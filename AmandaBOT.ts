import { WASocket, WAMessage, delay, GroupMetadata } from "@whiskeysockets/baileys";
import fs from 'fs';
import request from 'request';
import path from 'path';
import * as dotenv from 'dotenv';
import db from './database';
import { handleAdminCommand } from './commands/admin';
import { handleMemberCommand } from './commands/members';
import { MessageData, isAmandaActivated, formatActivationMessage, PREFIX, CONFIG as BaseConfig } from './config';
import { handleModerationCommand } from './commands/moderation';
import { handleEconomyCommand } from './commands/economy';

// Carrega variáveis de ambiente
dotenv.config();

// Configurações
const CONFIG = {
    ...BaseConfig,
    API_KEY: process.env.GEMINI_API_KEY,
    HISTORY_DIR: process.env.HISTORY_DIR || './historical',
    PERSON_DIR: process.env.PERSON_DIR || './PersonBOT',
    DEFAULT_CONFIG: path.join(process.env.PERSON_DIR || './PersonBOT', 'sys_inst.default.config'),
    PM_CONFIG: path.join(process.env.PERSON_DIR || './PersonBOT', 'sys_inst.light.config'),
    MAX_HISTORY_LENGTH: parseInt(process.env.MAX_HISTORY_LENGTH || '10'),
    MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
    RETRY_DELAY: parseInt(process.env.RETRY_DELAY || '1000'),
    RATE_LIMIT: parseInt(process.env.RATE_LIMIT || '10'),
    TIME_WINDOW: parseInt(process.env.TIME_WINDOW || '60000'),
    COOLDOWN: parseInt(process.env.COOLDOWN || '30000'),
    GROUP_MULTIPLIER: parseInt(process.env.GROUP_MULTIPLIER || '2'),
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '300000'),
    METADATA_TIMEOUT: parseInt(process.env.METADATA_TIMEOUT || '5000'),
};

// Rate Limiter mais robusto
class RateLimiter {
    private messageCount: Map<string, number> = new Map();
    private lastReset: Map<string, number> = new Map();
    private timeoutIds: Map<string, NodeJS.Timeout> = new Map();

    private readonly RATE_LIMIT = 10; // mensagens
    private readonly TIME_WINDOW = 60000; // 1 minuto
    private readonly COOLDOWN = 30000; // 30 segundos
    private readonly GROUP_MULTIPLIER = 2; // Limite maior para grupos

    public canProcess(jid: string, isGroup: boolean = false): boolean {
        const now = Date.now();
        const limit = isGroup ? this.RATE_LIMIT * this.GROUP_MULTIPLIER : this.RATE_LIMIT;

        // Reseta contador se passou o tempo da janela
        if (!this.lastReset.has(jid) || now - this.lastReset.get(jid)! >= this.TIME_WINDOW) {
            this.messageCount.set(jid, 0);
            this.lastReset.set(jid, now);
            this.clearTimeout(jid);
        }

        const count = this.messageCount.get(jid) || 0;
        if (count >= limit) {
            return false;
        }

        this.messageCount.set(jid, count + 1);
        return true;
    }

    public async waitForCooldown(jid: string): Promise<void> {
        return new Promise(resolve => {
            const timeoutId = setTimeout(() => {
                this.messageCount.set(jid, 0);
                this.lastReset.set(jid, Date.now());
                this.clearTimeout(jid);
                resolve();
            }, this.COOLDOWN);
            
            this.timeoutIds.set(jid, timeoutId);
        });
    }

    private clearTimeout(jid: string): void {
        const timeoutId = this.timeoutIds.get(jid);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeoutIds.delete(jid);
        }
    }
}

const rateLimiter = new RateLimiter();

// Gerenciador de metadados de grupo com cache e rate limiting
class GroupMetadataManager {
    private metadataCache: Map<string, GroupMetadata> = new Map();
    private lastFetch: Map<string, number> = new Map();
    private fetchQueue: Map<string, Promise<GroupMetadata>> = new Map();
    private rateLimiter: RateLimiter = new RateLimiter();

    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
    private readonly RETRY_DELAY = 2000; // 2 segundos
    private readonly MAX_RETRIES = 3;

    public async getGroupMetadata(jid: string, sock: WASocket): Promise<GroupMetadata> {
        const now = Date.now();
        const cachedData = this.metadataCache.get(jid);
        const lastFetchTime = this.lastFetch.get(jid) || 0;

        // Se temos cache válido, retorna
        if (cachedData && (now - lastFetchTime) < this.CACHE_TTL) {
            return cachedData;
        }

        // Se já tem uma requisição em andamento, aguarda ela
        const pendingFetch = this.fetchQueue.get(jid);
        if (pendingFetch) {
            return pendingFetch;
        }

        // Cria nova requisição
        const fetchPromise = this.fetchGroupMetadata(jid, sock);
        this.fetchQueue.set(jid, fetchPromise);

        try {
            const metadata = await fetchPromise;
            this.metadataCache.set(jid, metadata);
            this.lastFetch.set(jid, now);
            return metadata;
        } finally {
            this.fetchQueue.delete(jid);
        }
    }

    private async fetchGroupMetadata(jid: string, sock: WASocket, retryCount = 0): Promise<GroupMetadata> {
        try {
            // Espera o rate limiter
            if (!this.rateLimiter.canProcess(jid, true)) {
                await this.rateLimiter.waitForCooldown(jid);
            }

            // Tenta obter os metadados com timeout
            const metadata = await Promise.race([
                sock.groupMetadata(jid),
                new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]) as GroupMetadata;

            return metadata;
        } catch (error) {
            // Se for erro de rate limit, espera e tenta novamente
            if (error?.data === 429 && retryCount < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                return this.fetchGroupMetadata(jid, sock, retryCount + 1);
            }

            // Se for timeout ou outro erro, retorna metadados padrão
            console.error(`Erro ao obter metadados do grupo ${jid}:`, error);
            return {
                id: jid,
                subject: 'Grupo',
                creation: Date.now(),
                owner: undefined,
                desc: undefined,
                participants: [],
                announce: false,
                restrict: false,
            };
        }
    }

    public clearCache(jid?: string) {
        if (jid) {
            this.metadataCache.delete(jid);
            this.lastFetch.delete(jid);
        } else {
            this.metadataCache.clear();
            this.lastFetch.clear();
        }
    }
}

const groupMetadataManager = new GroupMetadataManager();

// Interfaces para melhor tipagem
interface HistoryItem {
    role: string;
    text: string;
}

interface GeminiMessage {
    role: string;
    parts: { text: string };
}

interface GeminiConfig {
    system_instruction: {
        parts: { text: string };
    };
    safetySettings: Array<{
        category: string;
        threshold: string;
    }>;
    generationConfig: {
        temperature: number;
        maxOutputTokens?: number;
        topP?: number;
        topK?: number;
    };
    contents: GeminiMessage[];
}

// Sistema de logging
const logger = {
    info: (message: string) => {
        // Não mostra mensagens info padrão
    },
    error: (message: string, error?: any) => console.error(`❌ ${message}`, error || ''),
    warning: (message: string) => {
        // Mostra apenas warnings críticos relacionados aos arquivos de configuração
        if (message.includes('sys_inst.default.config')) {
            console.warn(`⚠️ ${message}`);
        }
    },
    success: (message: string) => {
        // Não mostra mensagens de sucesso
    },
    command: (msg: WAMessage, text: string, configFile: string) => {
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        const pushName = msg.pushName || 'Desconhecido';
        
        console.log(`
📱 COMANDO AMANDA DETECTADO
📅 Data: ${date}
⏰ Hora: ${time}
👤 Nome: ${pushName}
🆔 ID Remetente: ${msg.key.participant || msg.key.remoteJid}
${isGroup ? `👥 ID Grupo: ${msg.key.remoteJid}` : ''}
💬 Mensagem: ${text}
📄 Arquivo de Sistema: ${configFile}
        `);
    }
};

let this_sock: WASocket;

function init(sock: WASocket) {
    this_sock = sock;
    
    // Cria diretório de histórico se não existir
    if (!fs.existsSync(CONFIG.HISTORY_DIR)) {
        fs.mkdirSync(CONFIG.HISTORY_DIR, { recursive: true });
    }

    // Inicializa o banco de dados
    db.ensureInitialized().catch(error => {
        console.error('Erro ao inicializar banco de dados:', error);
        process.exit(1); // Encerra o processo se não conseguir inicializar o banco
    });
}

const sendMessage = async (jid: string, text: string, replyToId?: string): Promise<void> => {
    try {
        const isGroup = jid.endsWith('@g.us');
        if (!rateLimiter.canProcess(jid, isGroup)) {
            console.log(`⏳ Rate limit atingido para ${jid}. Aguardando...`);
            await rateLimiter.waitForCooldown(jid);
        }

        const messageContent: any = { text };
        
        if (replyToId) {
            messageContent.quoted = { key: { id: replyToId } };
        }
        
        await this_sock.sendMessage(jid, messageContent);
        
        // Delay reduzido para grupos
        await new Promise(resolve => setTimeout(resolve, isGroup ? 200 : 500));
    } catch (error) {
        if (error?.data === 429) {
            console.log(`⏳ Rate limit do WhatsApp atingido. Aguardando ${CONFIG.COOLDOWN}ms...`);
            await rateLimiter.waitForCooldown(jid);
            return sendMessage(jid, text, replyToId);
        }
        
        if (error.message?.includes('No SenderKeyRecord found')) {
            console.log('🔄 Erro de decriptação. Tentando atualizar metadados do grupo...');
            try {
                await groupMetadataManager.getGroupMetadata(jid, this_sock);
                return sendMessage(jid, text, replyToId);
            } catch (groupError) {
                console.error('❌ Erro ao atualizar metadados do grupo:', groupError);
            }
        }
        
        logger.error(`Erro ao enviar mensagem para ${jid}:`, error);
        throw error;
    }
};

const readSystemInstructions = (configFile: string): string => {
    try {
        // Verifica se o diretório PersonBOT existe
        if (!fs.existsSync(CONFIG.PERSON_DIR)) {
            logger.warning(`Diretório ${CONFIG.PERSON_DIR} não encontrado. Criando...`);
            fs.mkdirSync(CONFIG.PERSON_DIR, { recursive: true });
        }

        // Verifica se o arquivo de configuração padrão existe
        if (!fs.existsSync(CONFIG.DEFAULT_CONFIG)) {
            logger.error(`Arquivo de configuração padrão não encontrado: ${CONFIG.DEFAULT_CONFIG}`);
            throw new Error('Arquivo de configuração padrão não encontrado');
        }

        // Tenta ler o arquivo de configuração específico
        if (fs.existsSync(configFile)) {
            const content = fs.readFileSync(configFile, 'utf8');
            logger.success(`Arquivo de configuração carregado com sucesso: ${configFile}`);
            return content;
        } else {
            logger.warning(`Arquivo ${configFile} não encontrado. Usando configuração padrão: ${CONFIG.DEFAULT_CONFIG}`);
            return fs.readFileSync(CONFIG.DEFAULT_CONFIG, 'utf8');
        }
    } catch (error) {
        logger.error(`Erro ao ler arquivo de configuração: ${configFile}`, error);
        throw error;
    }
};

const sendToGeminiAPI = async (
    sysInstructions: string,
    sysConfigFile: string,
    message: string,
    history: HistoryItem[],
    retryCount = 0
): Promise<string> => {
    try {
        const messages: GeminiMessage[] = [
            ...history.map(h => ({ role: h.role, parts: { text: h.text } })),
            { role: 'user', parts: { text: message } }
        ];

        const contents: GeminiConfig = {
            system_instruction: {
                parts: { text: sysInstructions }
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "BLOCK_NONE" }
            ],
            generationConfig: {
                temperature: 2.0,
                maxOutputTokens: 2048,
                topP: 0.8,
                topK: 40
            },
            contents: messages
        };

        const chatType = message.includes("@g.us") ? "Grupo" : "Privado";
        logger.info(`
    🏷️ Tipo: ${chatType}
    📌 ID: ${message}
    ⏰ Hora: ${new Date().toLocaleString()}
    📄 Arquivo de Instrução: ${sysConfigFile}
    💬 Última mensagem: ${message}`);

        return new Promise((resolve, reject) => {
            request.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${CONFIG.API_KEY}`,
                {
                    json: true,
                    body: contents,
                    timeout: 30000 // 30 segundos timeout
                },
                (err, resp, body) => {
                    if (err || resp.statusCode !== 200) {
                        const errorDetails = {
                            error: err ? err.message : 'Status code não é 200',
                            statusCode: resp?.statusCode,
                            body: body
                        };
                        logger.error('Erro na requisição:', errorDetails);
                        
                        if (retryCount < CONFIG.MAX_RETRIES) {
                            logger.warning(`Tentativa ${retryCount + 1} falhou. Tentando novamente...`);
                            setTimeout(() => {
                                resolve(sendToGeminiAPI(sysInstructions, sysConfigFile, message, history, retryCount + 1));
                            }, CONFIG.RETRY_DELAY);
                        } else {
                            reject(new Error(`Falha após ${CONFIG.MAX_RETRIES} tentativas. Status: ${resp?.statusCode}, Erro: ${err?.message || JSON.stringify(body)}`));
                        }
                        return;
                    }

                    try {
                        // Adiciona logs para debug
                        logger.info(`Resposta da API Gemini: ${JSON.stringify(body)}`);
                        
                        if (!body || !body.candidates || !body.candidates.length) {
                            throw new Error('Resposta inválida da API: candidates não encontrado');
                        }
                        
                        const candidate = body.candidates[0];
                        if (!candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
                            throw new Error('Resposta inválida da API: estrutura de content/parts inválida');
                        }
                        
                        const result = candidate.content.parts[0].text;
                        if (!result) {
                            throw new Error('Resposta inválida da API: texto não encontrado');
                        }
                        
                        resolve(result);
                    } catch (ex) {
                        logger.error('Erro detalhado ao processar resposta:', {
                            error: ex.message,
                            body: body,
                            statusCode: resp.statusCode
                        });
                        reject(new Error(`Erro ao processar resposta: ${ex.message}`));
                    }
                }
            );
        });
    } catch (error) {
        logger.error('Erro ao enviar mensagem para Gemini API:', error);
        throw error;
    }
};

const handleGemini = async (sysInstructions: string, sysConfigFile: string, text: string, jid: string, msg?: WAMessage): Promise<void> => {
    try {
        const histFilename = path.join(CONFIG.HISTORY_DIR, `hist.${jid}.json`);
        let history: HistoryItem[] = [];

        try {
            if (fs.existsSync(histFilename)) {
                history = JSON.parse(fs.readFileSync(histFilename, 'utf8'));
                // Removido o limite de histórico para manter todas as mensagens
            }
        } catch (error) {
            logger.warning(`Erro ao ler histórico para ${jid}. Iniciando novo histórico.`);
        }

        const gResponse = await sendToGeminiAPI(sysInstructions, sysConfigFile, text, history);

        if (gResponse) {
            try {
                history.push({ role: 'user', text: text });
                history.push({ role: 'model', text: gResponse });
                // Salva o histórico completo
                fs.writeFileSync(histFilename, JSON.stringify(history, undefined, 2), 'utf8');
            } catch (error) {
                logger.error(`Erro ao salvar histórico para ${jid}:`, error);
            }
            await sendMessage(jid, gResponse, msg?.key?.id);
        } else {
            throw new Error('Resposta vazia do Gemini API');
        }
    } catch (error) {
        logger.error(`Erro no processamento Gemini para ${jid}:`, error);
        await sendMessage(jid, '⚠️ Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.', msg?.key?.id);
    }
};

const handleFromGroup = async (text: string, jid: string, isReply: boolean = false, isMention: boolean = false, msg: WAMessage): Promise<void> => {
    try {
        // Salva informações no banco de dados
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderName = msg.pushName || 'Desconhecido';
            
            // Obtém informações do grupo
            const groupMetadata = await groupMetadataManager.getGroupMetadata(jid, this_sock);
            
            // Salva/atualiza informações do grupo
            await db.addGroup(
                jid,
                groupMetadata.subject || 'Grupo',
                groupMetadata.participants.length,
                groupMetadata.participants
                    .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
                    .map(p => p.id)
            );

            // Adiciona usuário ao grupo
            await db.addUserToGroup(
                sender,
                senderName,
                sender.split('@')[0],
                jid,
                groupMetadata.subject || 'Grupo',
                null,
                groupMetadata.participants.some(p => 
                    p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin')
                )
            );

            // Salva a mensagem
            await db.addMessage(
                msg.key.id,
                sender,
                jid,
                groupMetadata.subject || 'Grupo',
                text,
                'text'
            );
        } catch (dbError) {
            console.error('Erro ao salvar no banco de dados:', dbError);
        }

        // Processa mensagem normal se contiver "amanda", for uma resposta ou uma menção
        if (text.toLowerCase().includes("amanda") || text.toLowerCase().includes("amandinha") || isReply || isMention) {
            if (!rateLimiter.canProcess(jid)) {
                console.log(`⏳ Grupo ${jid} em cooldown. Aguardando...`);
                return;
            }

            const configFileName = `sys_inst.${jid}.config`;
            const sysConfigFile = path.join(CONFIG.PERSON_DIR, configFileName);
            logger.command(msg, text, configFileName);
            
            const sysInstructions = readSystemInstructions(sysConfigFile);
            
            if (!sysInstructions || sysInstructions.trim().length === 0) {
                throw new Error('Instruções do sistema vazias');
            }
            
            await handleGemini(sysInstructions, configFileName, text, jid, msg);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem de grupo:', error);
        await sendMessage(jid, '❌ Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.', msg?.key?.id);
    }
};

const handleFromPm = async (text: string, jid: string): Promise<void> => {
    const sysInstructions = readSystemInstructions(CONFIG.PM_CONFIG);
    await handleGemini(sysInstructions, path.basename(CONFIG.PM_CONFIG), text, jid);
};

const fromGroup = (msg: WAMessage): boolean => {
    return Boolean(msg?.key?.remoteJid?.endsWith('@g.us'));
};

const extractText = (msg: WAMessage): string | null => {
    const messageTypes = {
        conversation: msg.message?.conversation,
        imageCaption: msg.message?.imageMessage?.caption,
        videoCaption: msg.message?.videoMessage?.caption,
        extendedText: msg.message?.extendedTextMessage?.text,
        buttonResponse: msg.message?.buttonsResponseMessage?.selectedDisplayText,
        listResponse: msg.message?.listResponseMessage?.title,
        eventName: msg.message?.eventMessage?.name
    };

    return Object.values(messageTypes).find(text => text) || null;
};

const isReplyToBot = (msg: WAMessage): boolean => {
    try {
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
        if (!contextInfo) {
            return false;
        }

        const botId = (this_sock?.user?.id || '').split(':')[0];
        const quotedParticipant = (contextInfo.participant || '').split(':')[0];
        
        return quotedParticipant === botId;
    } catch (error) {
        console.error('Erro ao verificar resposta:', error);
        return false;
    }
};

const isMentioningBot = (msg: WAMessage): boolean => {
    try {
        const botId = (this_sock?.user?.id || '').split(':')[0];
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const messageText = msg.message?.conversation || 
            msg.message?.extendedTextMessage?.text || 
            msg.message?.imageMessage?.caption || 
            msg.message?.videoMessage?.caption || 
            '';

        return mentionedJids.some(jid => jid.split(':')[0] === botId) || messageText.includes('@' + botId);
    } catch (error) {
        console.error('Erro ao verificar menção:', error);
        return false;
    }
};

async function getGroupName(sock: WASocket, jid: string): Promise<string> {
    try {
        const groupMetadata = await groupMetadataManager.getGroupMetadata(jid, sock);
        return groupMetadata.subject || 'Grupo Desconhecido';
    } catch (error) {
        console.error('Erro ao obter nome do grupo:', error);
        return 'Grupo';
    }
}

function shouldProcessMessage(msg: WAMessage, text: string): boolean {
    const isReply = isReplyToBot(msg);
    const isMention = isMentioningBot(msg);
    const hasAmandaName = text.includes('amanda') || text.includes('amandinha');
    console.log('Verificando mensagem:', {
        isReply,
        isMention,
        hasAmandaName,
        text
    });
    return hasAmandaName || isReply || isMention;
}

async function processMessage(msg: WAMessage, text: string): Promise<any> {
    try {
        const jid = msg.key.remoteJid;
        if (!jid) return null;

        console.log('Processando mensagem normal:', text);

        if (fromGroup(msg)) {
            const configFileName = `sys_inst.${jid}.config`;
            const sysConfigFile = path.join(CONFIG.PERSON_DIR, configFileName);
            const sysInstructions = readSystemInstructions(sysConfigFile);
            
            if (!sysInstructions || sysInstructions.trim().length === 0) {
                throw new Error('Instruções do sistema vazias');
            }
            
            return await handleGemini(sysInstructions, configFileName, text, jid);
        } else {
            const sysInstructions = readSystemInstructions(CONFIG.PM_CONFIG);
            return await handleGemini(sysInstructions, path.basename(CONFIG.PM_CONFIG), text, jid);
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return { text: '❌ Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' };
    }
}

function logMessage(msg: WAMessage, text: string, sysFile?: string) {
    const now = new Date();
    const isGroup = fromGroup(msg);
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderName = msg.pushName || 'Desconhecido';

    console.log(`
📱 AMANDA ACIONADA
📅 Data: ${now.toLocaleDateString()}
⏰ Hora: ${now.toLocaleTimeString()}
👤 Nome: ${senderName}
🆔 ID: ${sender}
${isGroup ? `👥 Grupo: ${groupId}` : ''}
${sysFile ? `📄 Arquivo: ${sysFile}` : ''}
💬 Mensagem: ${text}
`);
}

async function sendResponse(jid: string, response: any) {
    if (typeof response === 'string') {
        await this_sock.sendMessage(jid, { text: response });
    } else if (response.text && response.mentions) {
        await this_sock.sendMessage(jid, {
            text: response.text,
            mentions: response.mentions
        });
    }
}

async function handle(msg: WAMessage) {
    try {
        const text = extractText(msg);
        if (!text) return;

        console.log('Mensagem recebida:', text);

        // Extrai menções da mensagem
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        // Se for uma resposta, adiciona o participante às menções
        if (quotedParticipant && !mentionedJids.includes(quotedParticipant)) {
            mentionedJids.push(quotedParticipant);
        }

        console.log('Menções detectadas:', mentionedJids);

        const messageData: MessageData = {
            body: text,
            from: msg.key.remoteJid,
            sender: {
                name: msg.pushName || 'Desconhecido',
                id: msg.key.participant || msg.key.remoteJid
            },
            isGroupMsg: fromGroup(msg),
            quotedMsg: msg.message?.extendedTextMessage?.contextInfo ? {
                participant: msg.message.extendedTextMessage.contextInfo.participant
            } : undefined,
            text: text,
            isMention: isMentioningBot(msg),
            isReply: isReplyToBot(msg),
            timestamp: new Date(),
            group: fromGroup(msg) ? {
                id: msg.key.remoteJid
            } : undefined
        };

        // Verifica se é um comando do CbCoin primeiro
        if (text.startsWith('!')) {
            console.log('Comando detectado:', text);
            const command = text.split(' ')[0];
            let args = text.split(' ').slice(1);

            // Se tiver menções, substitui os @mentions pelos JIDs
            if (mentionedJids.length > 0) {
                args = args.map(arg => {
                    if (arg.startsWith('@')) {
                        const userNumber = arg.slice(1);
                        const mentionedJid = mentionedJids.find(jid => jid.split('@')[0] === userNumber);
                        return mentionedJid || arg;
                    }
                    return arg;
                });
            }
            // Se for uma resposta e não tiver argumentos, usa o participante da resposta
            else if (quotedParticipant && args.length === 0) {
                args = [quotedParticipant];
            }

            console.log('Comando processado:', command);
            console.log('Argumentos:', args);

            // Lista de comandos do CbCoin
            const cbCoinCommands = ['!diario', '!minerar', '!roubar', '!vingar', '!emprestar', '!doar', 
                                  '!cassino', '!escudo', '!amuletosorte', '!ranking', '!abrirjogo', 
                                  '!fecharjogo', '!menucbcoin', '!menu', '!perfil', '!helpcbcoin'];

            // Verifica se é um comando do CbCoin
            if (cbCoinCommands.includes(command.toLowerCase())) {
                console.log('Comando CbCoin encontrado:', command);
                await handleEconomyCommand(this_sock, msg, command, args);
                return;
            }
            console.log('Comando não reconhecido como CbCoin:', command);
        }

        // Se não for um comando do CbCoin, processa como comando de moderação ou mensagem normal
        if (text.startsWith(PREFIX)) {
            console.log('Comando de moderação detectado:', text);
            try {
                const groupMetadata = await groupMetadataManager.getGroupMetadata(msg.key.remoteJid, this_sock);
                await handleModerationCommand(this_sock, msg, messageData, groupMetadata);
                return;
            } catch (error) {
                console.error('Erro ao processar comando de moderação:', error);
                await sendMessage(msg.key.remoteJid, '❌ Ocorreu um erro ao processar o comando!');
                return;
            }
        }

        // Processa mensagem normal
        if (fromGroup(msg)) {
            await handleFromGroup(text, msg.key.remoteJid, isReplyToBot(msg), isMentioningBot(msg), msg);
        } else {
            await handleFromPm(text, msg.key.remoteJid);
        }

    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
    }
}

export = {
    init,
    handle
};
