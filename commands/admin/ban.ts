import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { PREFIX, BOT_NUMBER } from '../../config';

// Classes de erro personalizadas
class DangerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DangerError';
    }
}

class InvalidParameterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidParameterError';
    }
}

// Funções utilitárias
const toUserJid = (number: string): string => {
    const cleanNumber = onlyNumbers(number);
    return `${cleanNumber}@s.whatsapp.net`;
};

const onlyNumbers = (text: string): string => {
    return text.replace(/[^\d]/g, '');
};

// Informações do comando
export const banCommand = {
    name: "banir",
    description: "Removo um membro do grupo",
    commands: ["ban", "kick"],
    usage: `${PREFIX}ban @marcar_membro 

ou 

${PREFIX}ban (mencionando uma mensagem)`,
};

export async function banMember(msg: WAMessage, socket: WASocket): Promise<string> {
    try {
        const remoteJid = msg.key.remoteJid;
        const userJid = msg.key.participant || msg.key.remoteJid;
        const isReply = !!msg.message?.extendedTextMessage?.contextInfo;
        const replyJid = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        // Obtém os argumentos e menções
        const text = msg.message?.conversation || 
            msg.message?.extendedTextMessage?.text || 
            '';
        const args = text.split(' ').slice(1);
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Verifica se é administrador
        const groupMetadata = await socket.groupMetadata(remoteJid);
        const isAdmin = groupMetadata.participants.some(p => 
            p.id === userJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        if (!isAdmin) {
            throw new DangerError('Você não tem permissão para usar este comando!');
        }

        // Verifica se o bot é admin
        const botJid = toUserJid(BOT_NUMBER);
        const isBotAdmin = groupMetadata.participants.some(p => 
            p.id === botJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        if (!isBotAdmin) {
            throw new DangerError('Preciso ser admin do grupo para executar esta ação!');
        }

        // Verifica se o bot tem permissão de remover membros
        const botParticipant = groupMetadata.participants.find(p => p.id === botJid);
        if (!botParticipant || botParticipant.admin !== 'superadmin') {
            throw new DangerError('Preciso ser superadmin para remover membros!');
        }

        // Verifica se foi fornecido um membro para banir
        if (!mentions.length && !args.length && !isReply) {
            throw new InvalidParameterError('Você precisa mencionar (@) ou marcar um membro!');
        }

        // Obtém o JID do membro a ser removido
        let memberToRemoveJid: string;
        
        if (isReply) {
            // Se for reply, usa o JID da mensagem respondida
            memberToRemoveJid = replyJid;
        } else if (mentions.length > 0) {
            // Se houver menções (@), usa a primeira menção
            memberToRemoveJid = mentions[0];
        } else {
            // Se for número direto, converte para JID
            memberToRemoveJid = toUserJid(args[0]);
        }

        const memberToRemoveNumber = onlyNumbers(memberToRemoveJid);

        // Valida o número
        if (memberToRemoveNumber.length < 7 || memberToRemoveNumber.length > 15) {
            throw new InvalidParameterError('Número inválido!');
        }

        // Verifica se está tentando banir a si mesmo
        if (memberToRemoveJid === userJid) {
            throw new DangerError('Você não pode remover você mesmo!');
        }

        // Verifica se está tentando banir o bot
        if (memberToRemoveJid === botJid) {
            throw new DangerError('Você não pode me remover!');
        }

        // Verifica se o membro está no grupo
        const isMember = groupMetadata.participants.some(p => p.id === memberToRemoveJid);
        if (!isMember) {
            throw new InvalidParameterError('Este usuário não está no grupo!');
        }

        // Verifica se o usuário alvo não é admin
        const targetParticipant = groupMetadata.participants.find(p => p.id === memberToRemoveJid);
        if (targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin')) {
            throw new DangerError('Não posso remover um administrador do grupo!');
        }

        // Remove o membro
        await socket.groupParticipantsUpdate(
            remoteJid,
            [memberToRemoveJid],
            "remove"
        );

        // Envia reação de sucesso (emoji)
        try {
            await socket.sendMessage(remoteJid, { 
                react: { 
                    text: "✅", 
                    key: msg.key 
                } 
            });
        } catch (error) {
            console.error('Erro ao enviar reação:', error);
        }

        return '✅ Membro removido com sucesso!';
    } catch (error) {
        if (error instanceof DangerError || error instanceof InvalidParameterError) {
            return `❌ ${error.message}`;
        }
        console.error('Erro ao banir membro:', error);
        return '❌ Erro ao tentar remover o membro. Verifique se tenho permissão de administrador.';
    }
} 