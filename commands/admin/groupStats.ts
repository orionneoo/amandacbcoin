import { WAMessage } from '@whiskeysockets/baileys';
import { Stats } from './types';
import db from '../../database';

export async function groupStats(msg: WAMessage): Promise<string> {
    const groupId = msg.key.remoteJid;
    const stats = await db.getGroupStats(groupId);
    return formatGroupStats(stats);
}

function formatGroupStats(stats: Stats): string {
    return `📊 *Estatísticas do Grupo*\n\n` +
           `📝 Nome: ${stats.name}\n` +
           `👥 Usuários únicos: ${stats.unique_users}\n` +
           `💬 Total de mensagens: ${stats.total_messages}\n` +
           `📈 Mensagens (24h): ${stats.messages_last_24h}\n` +
           `📅 Criado em: ${new Date(stats.created_at).toLocaleDateString()}\n` +
           `🕒 Última atividade: ${new Date(stats.last_interaction).toLocaleString()}`;
} 