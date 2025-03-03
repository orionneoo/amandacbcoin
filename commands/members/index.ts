import { WAMessage, WASocket } from '@whiskeysockets/baileys';

// Interface para respostas de comandos
interface CommandResponse {
    text?: string;
    mentions?: string[];
}

// Função para mostrar o menu de membros
function showMemberMenu(): string {
    return `
╭━━━━━━━━━━━━━━━━╮
┃ 🤖 *AMANDA 3.031* 🤖
╰━━━━━━━━━━━━━━━━╯

📱 *COMANDOS DISPONÍVEIS*
┠⊷ !menu
┃    _Mostra este menu_
┠⊷ !ping
┃    _Verifica se o bot está online_
┠⊷ !info
┃    _Informações sobre o bot_

╭━━━━━━━━━━━━━━━━╮
┃ 👨‍💻 *INFORMAÇÕES* 👨‍💻
┠⊷ Criador: W
┠⊷ Contato: (21)967233931
┃
┃ ©️ Amanda Bot 2024
╰━━━━━━━━━━━━━━━━╯`;
}

// Função para verificar se o bot está online
function ping(): string {
    return '🟢 *Pong!* Bot está online e funcionando!';
}

// Função para mostrar informações sobre o bot
function showInfo(): string {
    return `
🤖 *Informações do Bot*

📱 Nome: Amanda Bot
👑 Versão: 3.031
📅 Última atualização: 27/02/2024
👨‍💻 Desenvolvedor: W
📞 Contato: (21)967233931

💡 *Recursos*
- Respostas automáticas
- Processamento de comandos
- Integração com grupos
- Sistema de banco de dados
- E muito mais!

🔗 *Links Úteis*
- GitHub: https://github.com/orionneoo/amanda_prod
`;
}

// Função principal para processar comandos de membros
export async function handleMemberCommand(msg: WAMessage, command: string, socket: WASocket): Promise<CommandResponse | string | null> {
    try {
        console.log('Processando comando de membro:', command);
        const cmd = command.toLowerCase().trim();

        switch (cmd) {
            case '!menu':
                console.log('Comando menu de membros detectado');
                return showMemberMenu();

            case '!ping':
                console.log('Comando ping detectado');
                return ping();

            case '!info':
                console.log('Comando info detectado');
                return showInfo();
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao processar comando de membro:', error);
        return '❌ Erro ao processar comando. Por favor, tente novamente.';
    }
} 