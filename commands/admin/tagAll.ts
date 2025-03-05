import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { CommandResponse } from './types';

export async function tagAll(msg: WAMessage, socket: WASocket): Promise<CommandResponse> {
    try {
        console.log('Executando comando tagAll...');
        const groupMetadata = await socket.groupMetadata(msg.key.remoteJid);
        console.log('Metadados do grupo obtidos:', groupMetadata.subject);
        
        const mentions = groupMetadata.participants.map(p => p.id);
        console.log(`Marcando ${mentions.length} membros`);
        
        let text = `🌸 *Oiee pessoal!* 🌺\n\n`;
        text += `💝 A Amanda está chamando todo mundo!\n`;
        text += `🎀 Não me ignorem, viu? 😊\n\n`;
        
        // Adiciona menções formatadas
        groupMetadata.participants.forEach(participant => {
            text += `@${participant.id.split('@')[0]}\n`;
        });
        
        console.log('Mensagem preparada:', text);
        
        return {
            text: text,
            mentions: mentions
        };
    } catch (error) {
        console.error('Erro ao marcar todos:', error);
        throw new Error('❌ Erro ao marcar membros do grupo: ' + error.message);
    }
} 