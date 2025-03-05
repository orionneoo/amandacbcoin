import { WASocket, WAMessage } from "@whiskeysockets/baileys";
import { CommandResponse } from './types';
import { showMenu } from './menu';
import { tagAll } from './tagAll';
import { groupStats } from './groupStats';
import { userStats } from './userStats';
import { groupConfig } from './groupConfig';
import { banMember } from './ban';
import db from '../../database';

// Função principal para processar comandos administrativos
export async function handleAdminCommand(msg: WAMessage, command: string, socket: WASocket): Promise<CommandResponse | string | null> {
    try {
        console.log('Iniciando processamento do comando administrativo:', command);
        const parts = command.toLowerCase().trim().split(' ');
        const cmd = parts[0];

        // Log para debug
        console.log('Comando recebido:', {
            cmd: cmd,
            parts: parts,
            isGroup: msg.key.remoteJid?.endsWith('@g.us')
        });

        let response: CommandResponse | string | null = null;

        switch (cmd) {
            case '!menu':
                console.log('Executando comando menu');
                response = showMenu();
                console.log('Resposta do menu:', response);
                break;

            case '!mt':
            case '!marcar':
                if (!msg.key.remoteJid?.endsWith('@g.us')) {
                    return '❌ Este comando só pode ser usado em grupos.';
                }
                console.log('Executando comando marcar todos');
                response = await tagAll(msg, socket);
                break;

            case '!grupo':
                if (!msg.key.remoteJid?.endsWith('@g.us')) {
                    return '❌ Este comando só pode ser usado em grupos.';
                }
                console.log('Executando comando grupo stats');
                response = await groupStats(msg);
                break;

            case '!usuario':
                console.log('Executando comando usuario stats');
                response = await userStats(msg, parts[1]);
                break;

            case '!config':
                if (!msg.key.remoteJid?.endsWith('@g.us')) {
                    return '❌ Este comando só pode ser usado em grupos.';
                }
                console.log('Executando comando config');
                response = await groupConfig(msg);
                break;

            case '!ban':
            case '!kick':
                if (!msg.key.remoteJid?.endsWith('@g.us')) {
                    return '❌ Este comando só pode ser usado em grupos.';
                }
                console.log('Executando comando ban');
                response = await banMember(msg, socket);
                break;

            case '!usuarios':
                console.log('Executando comando listar usuarios');
                try {
                    const users = await db.listAllUsersAndGroups();
                    let responseText = '*📊 Lista de Usuários e Grupos*\n\n';
                    
                    for (const user of users) {
                        responseText += `👤 *Nome:* ${user.name}\n`;
                        responseText += `📱 *Número:* ${user.phone_number}\n`;
                        responseText += `🆔 *ID:* ${user.id}\n`;
                        if (user.groups) {
                            responseText += `👥 *Grupos:* ${user.groups}\n`;
                        }
                        responseText += `📊 *Total de Grupos:* ${user.group_count}\n`;
                        responseText += '\n───────────────\n\n';
                    }
                    
                    response = responseText;
                } catch (error) {
                    console.error('Erro ao listar usuários:', error);
                    return '❌ Erro ao listar usuários. Por favor, tente novamente.';
                }
                break;

            case '!grupos':
                console.log('Executando comando listar grupos');
                try {
                    const activeGroups = await db.listActiveGroups();
                    const inactiveGroups = await db.listInactiveGroups();
                    
                    let responseText = '*📊 Lista de Grupos*\n\n';
                    
                    responseText += '*✅ Grupos Ativos:*\n';
                    for (const group of activeGroups) {
                        responseText += `\n👥 *Nome:* ${group.name}\n`;
                        responseText += `👤 *Membros:* ${group.member_count}\n`;
                        responseText += `📊 *Usuários Únicos:* ${group.member_count}\n`;
                        responseText += `⏰ *Última Atividade:* ${new Date(group.last_interaction).toLocaleString()}\n`;
                        responseText += '───────────────\n';
                    }
                    
                    if (inactiveGroups.length > 0) {
                        responseText += '\n*❌ Grupos Inativos:*\n';
                        for (const group of inactiveGroups) {
                            responseText += `\n👥 *Nome:* ${group.name}\n`;
                            responseText += `⏰ *Última Atividade:* ${new Date(group.last_interaction).toLocaleString()}\n`;
                            responseText += '───────────────\n';
                        }
                    }
                    
                    response = responseText;
                } catch (error) {
                    console.error('Erro ao listar grupos:', error);
                    return '❌ Erro ao listar grupos. Por favor, tente novamente.';
                }
                break;

            default:
                console.log('Comando não reconhecido:', cmd);
                return '❌ Comando não reconhecido. Use !menu para ver os comandos disponíveis.';
        }

        console.log('Resposta final do comando:', response);
        return response;
    } catch (error) {
        console.error('Erro ao processar comando administrativo:', error);
        throw error;
    }
} 