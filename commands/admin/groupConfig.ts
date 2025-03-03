import { WAMessage } from '@whiskeysockets/baileys';
import { GroupSettings } from './types';
import db from '../../database';

export async function groupConfig(msg: WAMessage): Promise<string> {
    const groupId = msg.key.remoteJid;
    const settings = await db.getGroupSettings(groupId);
    return formatGroupSettings(settings);
}

function formatGroupSettings(settings: GroupSettings): string {
    return `⚙️ *Configurações do Grupo*\n\n` +
           `👋 Mensagem de boas-vindas: ${settings?.welcome_message || 'Não definida'}\n` +
           `🤖 Respostas automáticas: ${settings?.auto_response ? 'Ativadas' : 'Desativadas'}\n` +
           `📅 Última atualização: ${new Date(settings?.updated_at).toLocaleString()}`;
} 