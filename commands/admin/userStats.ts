import { WAMessage } from '@whiskeysockets/baileys';
import { Stats } from './types';
import db from '../../database';

export async function userStats(msg: WAMessage, userId?: string): Promise<string> {
    const targetId = userId || msg.key.participant || msg.key.remoteJid;
    const stats = await db.getUserStats(targetId);
    return formatUserStats(stats);
}

function formatUserStats(stats: Stats): string {
    return `📊 *Estatísticas do Usuário*\n\n` +
           `👤 Nome: ${stats.name}\n` +
           `💬 Total de mensagens: ${stats.total_messages}\n` +
           `👥 Grupos ativos: ${stats.groups_active}\n` +
           `📈 Mensagens (24h): ${stats.messages_last_24h}\n` +
           `📅 Primeiro registro: ${new Date(stats.created_at).toLocaleDateString()}\n` +
           `🕒 Última atividade: ${new Date(stats.last_interaction).toLocaleString()}`;
} 