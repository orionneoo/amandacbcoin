import { WASocket, WAMessage, GroupMetadata } from "@whiskeysockets/baileys";
import { MessageData } from "../config";
import db from "../database";

interface ModAction {
    type: 'warn' | 'ban' | 'kick' | 'mute';
    userId: string;
    groupId: string;
    reason: string;
    moderatorId: string;
    timestamp: Date;
    duration?: number; // Para mute, em minutos
}

// Função para normalizar texto (remove acentos e converte para minúsculo)
function normalizeText(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

export async function handleModerationCommand(
    sock: WASocket,
    message: WAMessage,
    messageData: MessageData,
    groupMetadata: GroupMetadata
) {
    const { body, from, sender, isGroupMsg, quotedMsg } = messageData;
    const args = body.split(' ');
    const command = normalizeText(args[0]);

    console.log('Processando comando:', command);

    // Verifica se é um grupo
    if (!isGroupMsg || !groupMetadata) {
        console.log('❌ Comando usado fora de grupo');
        await sock.sendMessage(from, { text: '❌ Este comando só pode ser usado em grupos!' });
        return;
    }

    try {
        switch (command) {
            case normalizeText('!menu'):
            case normalizeText('!mod'):
                console.log('📱 Mostrando menu de moderação');
                await showModMenu(sock, from);
                break;

            case normalizeText('!mt'):
                console.log('🔔 Marcando todos os membros');
                await handleMentionAll(sock, messageData, groupMetadata);
                break;

            case normalizeText('!usuario'):
                console.log('👤 Mostrando informações do usuário');
                await showUserInfo(sock, messageData, args);
                break;

            case normalizeText('!registrar'):
                console.log('📝 Registrando punição');
                await handlePunishment(sock, messageData, args);
                break;

            case normalizeText('!avisar'):
                console.log('⚠️ Dando aviso');
                await handleWarn(sock, messageData, args);
                break;

            case normalizeText('!banir'):
                console.log('🚫 Banindo usuário');
                await handleBan(sock, messageData, args);
                break;

            case normalizeText('!expulsar'):
                console.log('👢 Expulsando usuário');
                await handleKick(sock, messageData, args);
                break;

            case normalizeText('!mutar'):
                console.log('🔇 Mutando usuário');
                await handleMute(sock, messageData, args);
                break;

            case normalizeText('!desmutar'):
                console.log('🔊 Desmutando usuário');
                await handleUnmute(sock, messageData, args);
                break;

            case normalizeText('!avisos'):
                console.log('📋 Mostrando avisos');
                await showWarnings(sock, messageData, args);
                break;

            case normalizeText('!desbanir'):
                console.log('✅ Desbanindo usuário');
                await handleUnban(sock, messageData, args);
                break;

            default:
                console.log('❌ Comando não reconhecido:', command);
                await sock.sendMessage(from, { text: '❌ Comando não reconhecido!' });
        }
    } catch (error) {
        console.error('❌ Erro ao executar comando:', error);
        await sock.sendMessage(from, { text: '❌ Ocorreu um erro ao executar o comando!' });
    }
}

async function showModMenu(sock: WASocket, from: string) {
    const menuText = `*🤖 Amanda BOT v5.08*

*👨‍💻 Criador:* @weelrib
*📱 Contato:* 21967233931

*🔧 Menu de Moderação*

Comandos disponíveis:
!usuario @usuario - Ver informações do usuário
!registrar @usuario [tipo] [motivo] - Registrar punição
!avisar @usuario [motivo] - Dar aviso
!banir @usuario [motivo] - Banir usuário
!expulsar @usuario [motivo] - Expulsar usuário
!mutar @usuario [tempo] [motivo] - Mutar usuário
!desmutar @usuario - Desmutar usuário
!avisos @usuario - Ver avisos
!desbanir @usuario - Desbanir usuário
!mt - Marcar todos os membros

Exemplos:
!usuario @usuario
!registrar @usuario aviso Spam
!banir @usuario Comportamento inadequado
!expulsar @usuario Violação das regras
!mutar @usuario 30 Spam excessivo
!mt`;

    try {
        await sock.sendMessage(from, { text: menuText });
        console.log('✅ Menu de moderação enviado com sucesso');
    } catch (error) {
        console.error('❌ Erro ao enviar menu de moderação:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao enviar menu de moderação!' });
    }
}

async function handleWarn(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 3) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !avisar @usuario [motivo]' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    const reason = args.slice(2).join(' ');

    const modAction: ModAction = {
        type: 'warn',
        userId: targetUser,
        groupId: from,
        reason,
        moderatorId: sender.id,
        timestamp: new Date()
    };

    await db.createModAction(modAction);

    await sock.sendMessage(from, {
        text: `⚠️ Aviso dado para @${targetUser.split('@')[0]}\n📝 Motivo: ${reason}`,
        mentions: [targetUser]
    });
}

async function handleBan(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 3) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !banir @usuario [motivo]' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    const reason = args.slice(2).join(' ');

    try {
        const modAction: ModAction = {
            type: 'ban',
            userId: targetUser,
            groupId: from,
            reason,
            moderatorId: sender.id,
            timestamp: new Date()
        };

        await db.createModAction(modAction);
        await sock.groupParticipantsUpdate(from, [targetUser], 'remove');

        await sock.sendMessage(from, {
            text: `🚫 Usuário @${targetUser.split('@')[0]} banido\n📝 Motivo: ${reason}`,
            mentions: [targetUser]
        });
    } catch (error) {
        console.error('Erro ao banir usuário:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao banir usuário!' });
    }
}

async function handleKick(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 3) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !expulsar @usuario [motivo]' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    const reason = args.slice(2).join(' ');

    try {
        // Verifica se o bot é admin
        const groupMetadata = await sock.groupMetadata(from);
        const botJid = sock.user.id;
        const isBotAdmin = groupMetadata.participants.some(p => 
            p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        if (!isBotAdmin) {
            await sock.sendMessage(from, { text: '❌ Preciso ser admin do grupo para executar esta ação!' });
            return;
        }

        // Verifica se o bot tem permissão de remover membros
        const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
        if (!botParticipant || botParticipant.admin !== 'superadmin') {
            await sock.sendMessage(from, { text: '❌ Preciso ser superadmin para remover membros!' });
            return;
        }

        // Verifica se o usuário alvo não é admin
        const targetParticipant = groupMetadata.participants.find(p => p.id === targetUser);
        if (targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin')) {
            await sock.sendMessage(from, { text: '❌ Não posso remover um administrador do grupo!' });
            return;
        }

        const modAction: ModAction = {
            type: 'kick',
            userId: targetUser,
            groupId: from,
            reason,
            moderatorId: sender.id,
            timestamp: new Date()
        };

        await db.createModAction(modAction);
        await sock.groupParticipantsUpdate(from, [targetUser], 'remove');

        await sock.sendMessage(from, {
            text: `👢 Usuário @${targetUser.split('@')[0]} expulso\n📝 Motivo: ${reason}`,
            mentions: [targetUser]
        });
    } catch (error) {
        console.error('Erro ao expulsar usuário:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao expulsar usuário!' });
    }
}

async function handleMute(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 4) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !mutar @usuario [tempo em minutos] [motivo]' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    const duration = parseInt(args[2]);
    const reason = args.slice(3).join(' ');

    if (isNaN(duration) || duration <= 0) {
        await sock.sendMessage(from, { text: '❌ Tempo inválido! Use um número maior que 0.' });
        return;
    }

    try {
        const modAction: ModAction = {
            type: 'mute',
            userId: targetUser,
            groupId: from,
            reason,
            moderatorId: sender.id,
            timestamp: new Date(),
            duration
        };

        await db.createModAction(modAction);
        await sock.groupParticipantsUpdate(from, [targetUser], 'promote');

        await sock.sendMessage(from, {
            text: `🔇 Usuário @${targetUser.split('@')[0]} mutado por ${duration} minutos\n📝 Motivo: ${reason}`,
            mentions: [targetUser]
        });

        setTimeout(async () => {
            try {
                await sock.groupParticipantsUpdate(from, [targetUser], 'demote');
                await sock.sendMessage(from, {
                    text: `🔊 Usuário @${targetUser.split('@')[0]} desmutado automaticamente`,
                    mentions: [targetUser]
                });
            } catch (error) {
                console.error('Erro ao desmutar usuário:', error);
            }
        }, duration * 60 * 1000);
    } catch (error) {
        console.error('Erro ao mutar usuário:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao mutar usuário!' });
    }
}

async function handleUnmute(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 2) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !desmutar @usuario' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    await sock.groupParticipantsUpdate(from, [targetUser], 'demote');

    await sock.sendMessage(from, {
        text: `🔊 Usuário @${targetUser.split('@')[0]} desmutado`,
        mentions: [targetUser]
    });
}

async function showWarnings(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 2) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !avisos @usuario' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');

    const warnings = await db.getModActions({
        userId: targetUser,
        groupId: from,
        type: 'warn'
    });

    if (warnings.length === 0) {
        await sock.sendMessage(from, {
            text: `✅ Usuário @${targetUser.split('@')[0]} não possui avisos`,
            mentions: [targetUser]
        });
        return;
    }

    let warningText = `📝 Avisos de @${targetUser.split('@')[0]}:\n\n`;
    warnings.forEach((warn, index) => {
        warningText += `${index + 1}. ${warn.reason}\n`;
        warningText += `   ⏰ ${warn.timestamp.toLocaleString()}\n`;
        warningText += `   👮 Por: @${warn.moderatorId.split('@')[0]}\n\n`;
    });

    await sock.sendMessage(from, {
        text: warningText,
        mentions: [targetUser, ...warnings.map(w => w.moderatorId)]
    });
}

async function handleUnban(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 2) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !desbanir @usuario' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');

    try {
        const banAction = await db.getModActions({
            userId: targetUser,
            groupId: from,
            type: 'ban'
        });

        if (banAction.length === 0) {
            await sock.sendMessage(from, {
                text: `❌ Usuário @${targetUser.split('@')[0]} não está banido`,
                mentions: [targetUser]
            });
            return;
        }

        await db.removeModAction(banAction[0]._id);

        await sock.sendMessage(from, {
            text: `✅ Usuário @${targetUser.split('@')[0]} desbanido`,
            mentions: [targetUser]
        });
    } catch (error) {
        console.error('Erro ao desbanir usuário:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao desbanir usuário!' });
    }
}

async function showUserInfo(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 2) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !usuario @usuario' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');

    // Busca informações do usuário no banco de dados
    const userInfo = await db.getUserInfo(targetUser, from);
    const warnings = await db.getModActions({
        userId: targetUser,
        groupId: from,
        type: 'warn'
    });
    const punishments = await db.getModActions({
        userId: targetUser,
        groupId: from,
        type: 'punishment'
    });

    let userText = `*📊 Informações do Usuário*\n\n`;
    userText += `👤 Nome: ${userInfo?.user_name || 'Não encontrado'}\n`;
    userText += `📱 Número: ${targetUser.split('@')[0]}\n`;
    userText += `📅 Entrou em: ${userInfo?.joined_at ? new Date(userInfo.joined_at).toLocaleDateString() : 'Não encontrado'}\n`;
    userText += `💬 Total de mensagens: ${userInfo?.total_messages || 0}\n`;
    userText += `⚠️ Total de avisos: ${warnings.length}\n`;
    userText += `⚡ Total de punições: ${punishments.length}\n\n`;

    if (warnings.length > 0) {
        userText += `*📝 Últimos Avisos:*\n`;
        warnings.slice(-3).forEach((warn, index) => {
            userText += `${index + 1}. ${warn.reason}\n`;
            userText += `   ⏰ ${warn.timestamp.toLocaleString()}\n\n`;
        });
    }

    if (punishments.length > 0) {
        userText += `*⚡ Últimas Punições:*\n`;
        punishments.slice(-3).forEach((punish, index) => {
            userText += `${index + 1}. ${punish.reason}\n`;
            userText += `   ⏰ ${punish.timestamp.toLocaleString()}\n`;
            userText += `   👮 Por: @${punish.moderatorId.split('@')[0]}\n\n`;
        });
    }

    await sock.sendMessage(from, {
        text: userText,
        mentions: [targetUser, ...punishments.map(p => p.moderatorId)]
    });
}

async function handlePunishment(sock: WASocket, messageData: MessageData, args: string[]) {
    const { from, sender, quotedMsg } = messageData;
    
    if (args.length < 4) {
        await sock.sendMessage(from, { text: '❌ Uso correto: !registrar @usuario [tipo] [motivo]\n\nTipos disponíveis:\n- aviso\n- mute\n- kick\n- ban' });
        return;
    }

    const targetUser = quotedMsg?.participant || args[1].replace('@', '');
    const type = args[2].toLowerCase();
    const reason = args.slice(3).join(' ');

    if (!['aviso', 'mute', 'kick', 'ban'].includes(type)) {
        await sock.sendMessage(from, { text: '❌ Tipo de punição inválido! Use: aviso, mute, kick ou ban' });
        return;
    }

    const modAction: ModAction = {
        type: type as 'warn' | 'ban' | 'kick' | 'mute',
        userId: targetUser,
        groupId: from,
        reason,
        moderatorId: sender.id,
        timestamp: new Date()
    };

    await db.createModAction(modAction);

    // Executa a punição
}

async function handleMentionAll(sock: WASocket, messageData: MessageData, groupMetadata: GroupMetadata) {
    const { from, sender } = messageData;
    
    try {
        // Pega todos os participantes do grupo
        const participants = groupMetadata.participants;
        const mentions: string[] = [];
        let message = '';

        // Adiciona cada participante à lista de menções
        participants.forEach(participant => {
            if (participant.id !== '120363000000000000@g.us') { // Ignora o bot
                mentions.push(participant.id);
            }
        });

        // Cria uma mensagem fofa
        const cuteEmojis = ['💖', '✨', '🌟', '💫', '💝', '💕', '💗', '💓'];
        const randomEmoji = cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)];
        
        message = `${randomEmoji} *Olá pessoal!*\n\n`;
        message += `O @${sender.id.split('@')[0]} quer chamar a atenção de todos vocês! ${randomEmoji}\n\n`;
        message += `Espero que estejam tendo um dia maravilhoso! 💫`;

        await sock.sendMessage(from, {
            text: message,
            mentions: mentions
        });

        console.log('✅ Todos os membros foram marcados com sucesso');
    } catch (error) {
        console.error('❌ Erro ao marcar todos os membros:', error);
        await sock.sendMessage(from, { text: '❌ Erro ao marcar todos os membros!' });
    }
}

// Seção de ajuda para a Amanda explicar os comandos
const helpText = `*🤖 Comandos da Amanda*

*Comandos de Moderação:*
!menu ou !mod - Mostra o menu de moderação
!usuario @usuario - Mostra informações do usuário
!registrar @usuario [tipo] [motivo] - Registra uma punição
!avisar @usuario [motivo] - Dá um aviso ao usuário
!banir @usuario [motivo] - Bane o usuário do grupo
!expulsar @usuario [motivo] - Expulsa o usuário do grupo
!mutar @usuario [tempo] [motivo] - Muta o usuário por um tempo
!desmutar @usuario - Remove o mute do usuário
!avisos @usuario - Mostra os avisos do usuário
!desbanir @usuario - Remove o ban do usuário
!mt - Marca todos os membros do grupo

*Exemplos de uso:*
!usuario @usuario
!registrar @usuario aviso Spam
!banir @usuario Comportamento inadequado
!expulsar @usuario Violação das regras
!mutar @usuario 30 Spam excessivo
!mt

*Observações:*
- Todos os comandos funcionam com maiúsculas/minúsculas e acentos
- Você pode mencionar o usuário ou responder a mensagem dele
- O tempo de mute é em minutos
- Avisos e punições são registrados no banco de dados
- O bot precisa ser admin para executar ações de moderação
- O comando !mt marca todos os membros com uma mensagem fofa`;

// Seção de ajuda para o Gemini explicar os comandos
const geminiHelpText = `*🤖 Guia de Comandos da Amanda para Gemini*

*Comandos de Moderação:*

1. *!menu ou !mod*
   - Mostra o menu completo de comandos disponíveis
   - Útil para ver todas as opções de moderação

2. *!usuario @usuario*
   - Mostra informações detalhadas do usuário
   - Exibe nome, número, data de entrada, total de mensagens
   - Lista avisos e punições recentes
   - Útil para verificar histórico do usuário

3. *!registrar @usuario [tipo] [motivo]*
   - Registra uma punição no banco de dados
   - Tipos disponíveis: aviso, mute, kick, ban
   - Mantém histórico de ações de moderação
   - Exemplo: !registrar @usuario aviso Spam

4. *!avisar @usuario [motivo]*
   - Dá um aviso formal ao usuário
   - Registra o aviso no banco de dados
   - Útil para advertências leves
   - Exemplo: !avisar @usuario Comportamento inadequado

5. *!banir @usuario [motivo]*
   - Remove o usuário do grupo permanentemente
   - Registra o ban no banco de dados
   - Só pode ser revertido com !desbanir
   - Exemplo: !banir @usuario Violação grave das regras

6. *!expulsar @usuario [motivo]*
   - Remove o usuário do grupo temporariamente
   - Pode voltar se tiver link do grupo
   - Registra a expulsão no banco de dados
   - Exemplo: !expulsar @usuario Spam excessivo

7. *!mutar @usuario [tempo] [motivo]*
   - Muta o usuário por um tempo específico
   - Tempo em minutos
   - Desmuta automaticamente após o tempo
   - Exemplo: !mutar @usuario 30 Spam excessivo

8. *!desmutar @usuario*
   - Remove o mute do usuário imediatamente
   - Útil para desmutar antes do tempo programado
   - Exemplo: !desmutar @usuario

9. *!avisos @usuario*
   - Mostra todos os avisos do usuário
   - Lista data, motivo e moderador
   - Útil para verificar histórico de avisos
   - Exemplo: !avisos @usuario

10. *!desbanir @usuario*
    - Remove o ban do usuário
    - Permite que o usuário volte ao grupo
    - Só funciona se o usuário estiver banido
    - Exemplo: !desbanir @usuario

11. *!mt*
    - Marca todos os membros do grupo
    - Envia uma mensagem fofa com emojis
    - Útil para chamar atenção geral
    - Exemplo: !mt

*Observações Importantes:*
- Todos os comandos funcionam com maiúsculas/minúsculas e acentos
- Você pode mencionar o usuário ou responder a mensagem dele
- O bot precisa ser admin para executar ações de moderação
- Avisos e punições são registrados no banco de dados
- O tempo de mute é em minutos
- O comando !mt marca todos os membros com uma mensagem fofa

*Dicas de Uso:*
1. Use !menu para ver todos os comandos disponíveis
2. Verifique informações do usuário antes de punir
3. Mantenha um registro de avisos antes de banir
4. Use o comando !mt com moderação para não incomodar
5. Sempre informe o motivo das punições

*Exemplos Práticos:*
1. Verificar usuário: !usuario @usuario
2. Dar aviso: !avisar @usuario Spam
3. Banir usuário: !banir @usuario Violação grave
4. Mutar usuário: !mutar @usuario 30 Spam excessivo
5. Marcar todos: !mt`;

export { helpText, geminiHelpText }; 