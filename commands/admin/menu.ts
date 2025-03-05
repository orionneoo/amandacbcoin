import { CommandResponse } from './types';

export function showMenu(): CommandResponse {
    try {
        console.log('Iniciando geração do menu...');
        const menuText = `
╭━━━━━━━━━━━━━━━━╮
┃ 🤖 *AMANDA 3.031* 🤖
╰━━━━━━━━━━━━━━━━╯

📢 *COMANDOS DE GRUPO*
┠⊷ !mt
┃    _Marca todos os membros_
┠⊷ !marcar
┃    _Marca todos os membros_
┠⊷ !ban @membro
┃    _Remove um membro do grupo_
┠⊷ !kick @membro
┃    _Remove um membro do grupo_

📊 *ESTATÍSTICAS*
┠⊷ !grupo
┃    _Ver dados do grupo_
┠⊷ !usuario
┃    _Ver dados do usuário_
┠⊷ !grupos
┃    _Lista todos os grupos_
┠⊷ !usuarios
┃    _Lista todos os usuários_

⚙️ *CONFIGURAÇÕES*
┠⊷ !config
┃    _Configurações do grupo_
┠⊷ !menu
┃    _Mostra este menu_

╭━━━━━━━━━━━━━━━━╮
┃ 👨‍💻 *INFORMAÇÕES* 👨‍💻
┠⊷ Criador: W
┠⊷ Contato: (21)967233931
┃
┃ ©️ Amanda Bot 2024
╰━━━━━━━━━━━━━━━━╯`;

        console.log('Menu gerado com sucesso:', menuText);
        const response: CommandResponse = {
            text: menuText,
            mentions: []
        };
        console.log('Retornando resposta:', response);
        return response;
    } catch (error) {
        console.error('Erro ao gerar menu:', error);
        return {
            text: '❌ Erro ao gerar menu. Por favor, tente novamente.',
            mentions: []
        };
    }
} 