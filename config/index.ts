// Prefixo usado para comandos
export const PREFIX = '!';

// Número do bot
export const BOT_NUMBER = '21971200821@s.whatsapp.net';

// Configurações gerais
export const CONFIG = {
    // Nome do bot
    BOT_NAME: 'Amanda',
    
    // Versão do bot
    VERSION: '1.0.0',
    
    // Tempo máximo de espera para respostas (em ms)
    TIMEOUT: 60000,
    
    // Tempo de espera entre comandos do mesmo usuário (em ms)
    COOLDOWN: 3000,
    
    // Configurações de rate limit
    RATE_LIMIT: {
        // Tempo entre mensagens (em ms)
        MESSAGE_DELAY: 2000,
        // Tempo de espera após rate limit (em ms)
        RATE_LIMIT_DELAY: 5000,
        // Máximo de mensagens por minuto
        MAX_MESSAGES_PER_MINUTE: 15
    },
    
    // Flag para exibir notificações
    SHOW_NOTIFICATIONS: false
};

// Interface para os dados da mensagem
export interface MessageData {
    text: string;
    isMention: boolean;
    isReply: boolean;
    sender: {
        name: string;
        id: string;
    };
    group?: {
        id: string;
    };
    timestamp: Date;
}

// Função para verificar se a Amanda foi acionada
export function isAmandaActivated(message: MessageData): boolean {
    const text = message.text.toLowerCase();
    
    // Ignora se for apenas o prefixo !
    if (text === PREFIX || text === PREFIX + ' ') {
        return false;
    }
    
    const hasPrefix = text.startsWith(PREFIX);
    const hasAmandaName = text.includes('amanda');
    const hasAmandinhaName = text.includes('amandinha');
    
    const isActivated = (
        hasPrefix ||           // Comando com prefixo
        hasAmandaName ||      // Menciona Amanda
        hasAmandinhaName ||   // Menciona Amandinha
        message.isMention ||  // Menção direta
        (message.isReply)     // Resposta a uma mensagem da Amanda
    );

    // Se o bot foi ativado, retorna true, caso contrário, false
    return isActivated;
}

// Função para formatar a mensagem de ativação
export function formatActivationMessage(data: MessageData): string {
    const date = data.timestamp;
    const formattedDate = date.toLocaleDateString('pt-BR');
    const formattedTime = date.toLocaleTimeString('pt-BR');
    
    return `📱 AMANDA ACIONADA
📅 Data: ${formattedDate}
⏰ Hora: ${formattedTime}
👤 Nome: ${data.sender.name}
🆔 ID: ${data.sender.id}
${data.group ? `👥 Grupo: ${data.group.id}\n` : ''}📄 Arquivo: sys_inst.${data.group?.id || data.sender.id}.config
💬 Mensagem: ${data.text}`;
} 