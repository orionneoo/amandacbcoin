import { proto } from '@whiskeysockets/baileys';
import db from '../database';
import { getRandomNumber } from '../utils/random';
<<<<<<< HEAD

const DAILY_COINS = 1000; // Recompensa diaria
const MINING_CHANCES = 6; // Chance de minerar
const STEAL_CHANCES = 4; // Roubar
const AVENGE_CHANCES = 2; // Chances de vingar
const LEND_CHANCES = 2; // Chance de emprestar
const DONATE_CHANCES = 2; // Chance de doar
const CASINO_CHANCES = 6; // Chance de apostar
const SHIELD_PRICE = 2500;  // Preço do escudo
const LUCKY_CHARM_PRICE = 1000;  // Preço do amuleto da sorte
const SNIPER_PRICE = 5000;  // Preço para usar o sniper
const SNIPER_COOLDOWN = 24 * 60 * 60 * 1000; // 24 horas em milissegundos
const LUCKY_PRIZE = 5000;  // Prêmio do sortudo

// Interface para incluir o cooldown do sniper
interface UserEconomy {
    coins: number;
    last_daily: number | null;
    mining_chances: number;
    steal_chances: number;
    avenge_chances: number;
    lend_chances: number;
    donate_chances: number;
    casino_chances: number;
    shield: boolean;
    lucky_charm: boolean;
    sniper_cooldown?: number | null;
    lucky_cooldown?: number | null;
}

// Função para verificar se o usuário está em cooldown do sniper
async function checkSniperCooldown(userId: string, groupId: string): Promise<boolean> {
    try {
        const userEconomy = await db.getUserEconomy(groupId, userId);
        
        // Se o usuário não tem economia, cria uma nova
        if (!userEconomy) {
            await db.createUserEconomy(groupId, userId, {
                coins: 0,
                last_daily: null,
                mining_chances: 6,
                steal_chances: 4,
                avenge_chances: 2,
                lend_chances: 2,
                donate_chances: 2,
                casino_chances: 6,
                shield: false,
                lucky_charm: false,
                sniper_cooldown: null,
                lucky_cooldown: null
            });
            return false;
        }

        // Verifica o cooldown
        if (!userEconomy.sniper_cooldown) return false;
        
        const now = Date.now();
        const cooldownTime = 5 * 60 * 1000; // 5 minutos em milissegundos
        
        if (now - userEconomy.sniper_cooldown < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - userEconomy.sniper_cooldown)) / 1000);
            throw new Error(`⏰ Aguarde ${remainingTime} segundos para usar o sniper novamente!`);
        }

        return false;
    } catch (error) {
        console.error('Erro ao verificar cooldown do sniper:', error);
        throw error;
    }
}

// Função principal do sniper
async function handleSniper(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string) {
    try {
        if (!target) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, use: !sniper @usuario`,
                mentions: [sender]
            });
            return;
        }

        // Limpa o JID e obtém metadata do grupo
        target = target.split('@')[0] + '@s.whatsapp.net';
        const groupMetadata = await sock.groupMetadata(groupId);
        const groupName = groupMetadata.subject;

        // Pega informações do usuário do banco de dados
        const targetUserGroup = await db.getUserInGroup(target, groupId);
        const targetName = targetUserGroup?.user_name || target.split('@')[0];

        // Verifica se é o próprio usuário
        if (target === sender) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, você não pode atirar em si mesmo!`,
                mentions: [sender]
            });
            return;
        }

        // Verifica se tem coins suficientes
        if (userEconomy.coins < SNIPER_PRICE) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, você precisa de ${SNIPER_PRICE.toLocaleString('pt-BR')} CbCoins para usar o sniper!\nSeu saldo: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
                mentions: [sender]
            });
            return;
        }

        // Obtém ou cria economia do alvo
        let targetEconomy = await db.getUserEconomy(groupId, target);
        
        if (!targetEconomy) {
            targetEconomy = {
                coins: 0,
                last_daily: null,
                mining_chances: MINING_CHANCES,
                steal_chances: STEAL_CHANCES,
                avenge_chances: AVENGE_CHANCES,
                lend_chances: LEND_CHANCES,
                donate_chances: DONATE_CHANCES,
                casino_chances: CASINO_CHANCES,
                shield: false,
                lucky_charm: false,
                sniper_cooldown: null,
                lucky_cooldown: null
            };
            await db.createUserEconomy(groupId, target, targetEconomy);
        }

        // Verifica se o alvo tem escudo
        if (targetEconomy.shield) {
            await sock.sendMessage(groupId, {
                text: `❌ @${sender.split('@')[0]}, o alvo @${target.split('@')[0]} está protegido por um escudo!`,
                mentions: [sender, target]
            });
            return;
        }

        // Cobra o preço
        userEconomy.coins -= SNIPER_PRICE;
        await db.updateUserEconomy(groupId, sender, userEconomy);

        // Aplica o cooldown no alvo com informações atualizadas
        const now = Date.now();
        await db.updateUserEconomy(groupId, target, {
            sniper_cooldown: now + SNIPER_COOLDOWN
        });

        // Envia mensagem de sucesso com tempo formatado
        const endTime = new Date(now + SNIPER_COOLDOWN);
        const timeStr = endTime.toLocaleTimeString('pt-BR');
        const dateStr = endTime.toLocaleDateString('pt-BR');

        await sock.sendMessage(groupId, {
            text: `🎯 @${sender.split('@')[0]} acertou @${target.split('@')[0]} com um sniper!\n\n` +
                  `@${target.split('@')[0]} não poderá jogar até ${timeStr} de ${dateStr}!\n\n` +
                  `Saldo de @${sender.split('@')[0]}: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
            mentions: [sender, target]
        });

    } catch (error) {
        console.error('Erro no comando sniper:', error);
        await sock.sendMessage(groupId, {
            text: '❌ Ocorreu um erro ao executar o comando sniper!'
        });
    }
}
=======
import { UserEconomy } from '../types/database';

const DAILY_COINS = 1000;
const MINING_CHANCES = 3;
const STEAL_CHANCES = 2;
const AVENGE_CHANCES = 1;
const LEND_CHANCES = 2;
const DONATE_CHANCES = 3;
const CASINO_CHANCES = 5;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b

export async function handleEconomyCommand(
    sock: any,
    message: proto.IWebMessageInfo,
    command: string,
    args: string[]
) {
<<<<<<< HEAD
    console.log('Iniciando handleEconomyCommand:', { command, args });
=======
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    const groupId = message.key.remoteJid;
    if (!groupId.endsWith('@g.us')) {
        await sock.sendMessage(groupId, { text: 'Este comando só pode ser usado em grupos!' });
        return;
    }

    const sender = message.key.participant || message.key.remoteJid;
<<<<<<< HEAD
    console.log('Dados do comando:', { groupId, sender });

    // Verifica cooldown do sniper antes de processar comandos
    if (command !== '!menu' && command !== '!menucbcoin' && command !== '!helpcbcoin') {
        if (await checkSniperCooldown(sender, groupId)) {
            return;
        }
    }

    // Verifica se o jogo está ativo
    if (command !== '!abrirjogo' && !(await db.isGameActive(groupId))) {
        await sock.sendMessage(groupId, { 
            text: 'O jogo está fechado neste grupo! Use !abrirjogo para começar.' 
        });
        return;
    }

    // Comandos do menu principal (funcionam sempre)
    if (command.toLowerCase() === '!menu') {
        console.log('Executando comando menu');
        await showMainMenu(sock, groupId);
        return;
    }

    if (command.toLowerCase() === '!comandos') {
        console.log('Executando comando comandos');
        await handleCommands(sock, groupId);
        return;
    }

    // Comandos de controle do jogo (funcionam sempre)
    if (command.toLowerCase() === '!abrirjogo') {
        console.log('Executando comando abrirjogo');
        const group = await db.getGroup(groupId);
        console.log('Dados do grupo:', group);
        if (!group) {
            await db.addGroup(groupId, 'Grupo CbCoin', 0, [sender]);
            await sock.sendMessage(groupId, { text: 'Grupo criado com sucesso!' });
            await db.setGameActive(groupId, true);
            await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin foi aberto! Use !menucbcoin para ver os comandos disponíveis.' });
=======

    // Comandos de controle do jogo
    if (command.toLowerCase() === '!abrirjogo') {
        const group = await db.getGroup(groupId);
        if (!group) {
            await sock.sendMessage(groupId, { text: 'Grupo não encontrado!' });
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
            return;
        }

        const admins = group.admins || [];
        if (!admins.includes(sender)) {
            await sock.sendMessage(groupId, { text: 'Apenas administradores podem abrir o jogo!' });
            return;
        }

        await db.setGameActive(groupId, true);
<<<<<<< HEAD
        await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin foi aberto! Use !menucbcoin para ver os comandos disponíveis.' });
=======
        await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin foi aberto! Use !menu para ver os comandos disponíveis.' });
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        return;
    }

    if (command.toLowerCase() === '!fecharjogo') {
        const group = await db.getGroup(groupId);
        if (!group) {
            await sock.sendMessage(groupId, { text: 'Grupo não encontrado!' });
            return;
        }

        const admins = group.admins || [];
        if (!admins.includes(sender)) {
            await sock.sendMessage(groupId, { text: 'Apenas administradores podem fechar o jogo!' });
            return;
        }

        await db.setGameActive(groupId, false);
        await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin foi fechado!' });
        return;
    }

<<<<<<< HEAD
    // Verifica se é um comando do jogo
    if (isCbCoinCommand(command)) {
        console.log('Comando CbCoin válido:', command);
        // Verifica se o jogo está ativo
        const isGameActive = await db.isGameActive(groupId);
        console.log('Status do jogo:', { groupId, isGameActive });
        if (!isGameActive) {
            await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin está fechado! Use !abrirjogo para começar a jogar.' });
            return;
        }

        let userEconomy = await db.getUserEconomy(groupId, sender);
        console.log('Dados do usuário:', userEconomy);

        if (!userEconomy) {
            userEconomy = {
                coins: 0,
                last_daily: null,  // Permite pegar o daily imediatamente
                mining_chances: MINING_CHANCES,
                steal_chances: STEAL_CHANCES,
                avenge_chances: AVENGE_CHANCES,
                lend_chances: LEND_CHANCES,
                donate_chances: DONATE_CHANCES,
                casino_chances: CASINO_CHANCES,
                shield: false,
                lucky_charm: false
            };
            await db.createUserEconomy(groupId, sender, userEconomy);
        }

        // Processa comandos do jogo
        switch (command.toLowerCase()) {
            case '!menucbcoin':
                await showCbCoinMenu(sock, groupId);
                break;
            case '!helpcbcoin':
                await handleHelpCbCoin(sock, groupId);
                break;
            case '!diario':
                await handleDaily(sock, groupId, sender, userEconomy);
                break;
            case '!minerar':
                await handleMining(sock, groupId, sender, userEconomy);
                break;
            case '!roubar':
                await handleSteal(sock, groupId, sender, userEconomy, args[0]);
                break;
            case '!vingar':
                await handleAvenge(sock, groupId, sender, userEconomy, args[0]);
                break;
            case '!emprestar':
                await handleLend(sock, groupId, sender, userEconomy, args[0], args[1]);
                break;
            case '!doar':
                await handleDonate(sock, groupId, sender, userEconomy, args[0], args[1]);
                break;
            case '!cassino':
                await handleCasino(sock, groupId, sender, userEconomy, args[0]);
                break;
            case '!escudo':
                await handleShield(sock, groupId, sender, userEconomy);
                break;
            case '!amuletosorte':
                await handleLuckyCharm(sock, groupId, sender, userEconomy);
                break;
            case '!ranking':
                await handleRanking(sock, groupId);
                break;
            case '!perfil':
                await handleProfile(sock, groupId, sender, userEconomy);
                break;
            case '!sniper':
                await handleSniper(sock, groupId, sender, userEconomy, args[0]);
                break;
            case '!sortudo':
                await handleLucky(sock, groupId, sender, userEconomy);
                break;
            default:
                await showCbCoinMenu(sock, groupId);
        }
    } else {
        console.log('Comando não reconhecido:', command);
    }
}

// Função auxiliar para verificar se é um comando do jogo
function isCbCoinCommand(command: string): boolean {
    const cbCoinCommands = [
        '!menucbcoin',
        '!helpcbcoin',
        '!diario',
        '!minerar',
        '!roubar',
        '!vingar',
        '!emprestar',
        '!doar',
        '!cassino',
        '!escudo',
        '!amuletosorte',
        '!ranking',
        '!perfil'
    ];
    return cbCoinCommands.includes(command.toLowerCase());
}

// Menu principal do bot (sempre disponível)
async function showMainMenu(sock: any, groupId: string) {
    const text = `*🤖 Menu Principal do Bot 🤖*

*Comandos Disponíveis:*
!menu - Mostra este menu
!abrirjogo - Abre o jogo CbCoin (admin)
!fecharjogo - Fecha o jogo CbCoin (admin)
!menucbcoin - Menu do jogo CbCoin
!helpcbcoin - Informações sobre o CbCoin`;

    await sock.sendMessage(groupId, { text });
=======
    // Verifica se o jogo está ativo para outros comandos
    const isGameActive = await db.isGameActive(groupId);
    if (!isGameActive) {
        await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin está fechado! Use !abrirjogo para começar a jogar.' });
        return;
    }

    let userEconomy = await db.getUserEconomy(groupId, sender);

    if (!userEconomy) {
        userEconomy = {
            coins: 0,
            last_daily: 0,
            mining_chances: MINING_CHANCES,
            steal_chances: STEAL_CHANCES,
            avenge_chances: AVENGE_CHANCES,
            lend_chances: LEND_CHANCES,
            donate_chances: DONATE_CHANCES,
            casino_chances: CASINO_CHANCES,
            shield: false,
            lucky_charm: false
        };
        await db.createUserEconomy(groupId, sender, userEconomy);
    }

    switch (command.toLowerCase()) {
        case '!menucbcoin':
            await showCbCoinMenu(sock, groupId);
            break;
        case '!menu':
            await showEconomyMenu(sock, groupId);
            break;
        case '!diario':
            await handleDaily(sock, groupId, sender, userEconomy);
            break;
        case '!minerar':
            await handleMining(sock, groupId, sender, userEconomy);
            break;
        case '!roubar':
            await handleSteal(sock, groupId, sender, userEconomy, args[0]);
            break;
        case '!vingar':
            await handleAvenge(sock, groupId, sender, userEconomy, args[0]);
            break;
        case '!emprestar':
            await handleLend(sock, groupId, sender, userEconomy, args[0], args[1]);
            break;
        case '!doar':
            await handleDonate(sock, groupId, sender, userEconomy, args[0], args[1]);
            break;
        case '!casino':
            await handleCasino(sock, groupId, sender, userEconomy, args[0]);
            break;
        case '!escudo':
            await handleShield(sock, groupId, sender, userEconomy);
            break;
        case '!amuletosorte':
            await handleLuckyCharm(sock, groupId, sender, userEconomy);
            break;
        case '!ranking':
            await handleRanking(sock, groupId);
            break;
        case '!perfil':
            await handleProfile(sock, groupId, sender, userEconomy);
            break;
        default:
            await showEconomyMenu(sock, groupId);
    }
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
}

async function handleDaily(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    const now = Date.now();
    const lastDaily = userEconomy.last_daily;
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastDaily < oneDay) {
        const timeLeft = oneDay - (now - lastDaily);
        const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, você precisa esperar ${hoursLeft} horas para receber sua recompensa diária novamente!`,
            mentions: [sender]
=======
            text: `Você precisa esperar ${hoursLeft} horas para receber sua recompensa diária novamente!`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    userEconomy.coins += DAILY_COINS;
    userEconomy.last_daily = now;
    userEconomy.mining_chances = MINING_CHANCES;
    userEconomy.steal_chances = STEAL_CHANCES;
    userEconomy.avenge_chances = AVENGE_CHANCES;
    userEconomy.lend_chances = LEND_CHANCES;
    userEconomy.donate_chances = DONATE_CHANCES;
    userEconomy.casino_chances = CASINO_CHANCES;

    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
<<<<<<< HEAD
        text: `@${sender.split('@')[0]} recebeu ${DAILY_COINS} CbCoins como recompensa diária!\nSaldo atual: ${userEconomy.coins} CbCoins`,
        mentions: [sender]
=======
        text: `Você recebeu ${DAILY_COINS} CbCoins como sua recompensa diária!\nSeu saldo atual: ${userEconomy.coins} CbCoins`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleMining(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    if (userEconomy.mining_chances <= 0) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, você não tem mais chances de minerar hoje!`,
            mentions: [sender]
=======
            text: 'Você não tem mais chances de minerar hoje!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    const success = getRandomNumber(1, 100) <= 70;
    const coins = success ? getRandomNumber(100, 500) : 0;

    userEconomy.mining_chances--;
    if (success) {
        userEconomy.coins += coins;
    }

    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
        text: success
<<<<<<< HEAD
            ? `@${sender.split('@')[0]} minerou com sucesso e ganhou ${coins} CbCoins!\nChances restantes: ${userEconomy.mining_chances}`
            : `@${sender.split('@')[0]} falhou na mineração!\nChances restantes: ${userEconomy.mining_chances}`,
        mentions: [sender]
=======
            ? `Mineragem bem sucedida! Você ganhou ${coins} CbCoins!\nChances restantes: ${userEconomy.mining_chances}`
            : `Mineragem falhou! Tente novamente!\nChances restantes: ${userEconomy.mining_chances}`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleSteal(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string) {
    if (!target) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, mencione o usuário que você quer roubar!`,
            mentions: [sender]
        });
        return;
    }

    // Limpa o JID se necessário
    target = target.split('@')[0] + '@s.whatsapp.net';

    if (target === sender) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você não pode roubar de si mesmo!`,
            mentions: [sender]
=======
            text: 'Mencione o usuário que você quer roubar!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    if (userEconomy.steal_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de roubar hoje!'
        });
        return;
    }

    const targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        await sock.sendMessage(groupId, {
            text: 'Usuário não encontrado!'
        });
        return;
    }

    if (targetEconomy.shield) {
        userEconomy.steal_chances--;
        await db.updateUserEconomy(groupId, sender, userEconomy);
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: 'O usuário está protegido por um escudo!',
            mentions: [target]
=======
            text: 'O usuário está protegido por um escudo!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    const success = getRandomNumber(1, 100) <= 30;
    const coins = success ? Math.floor(targetEconomy.coins * 0.1) : 0;

    userEconomy.steal_chances--;
    if (success) {
        userEconomy.coins += coins;
        targetEconomy.coins -= coins;
    }

    await db.updateUserEconomy(groupId, sender, userEconomy);
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: success
<<<<<<< HEAD
            ? `@${sender.split('@')[0]} roubou ${coins} CbCoins de @${target.split('@')[0]}!\nChances restantes: ${userEconomy.steal_chances}`
            : `@${sender.split('@')[0]} tentou roubar @${target.split('@')[0]} mas falhou!\nChances restantes: ${userEconomy.steal_chances}`,
        mentions: [sender, target]
=======
            ? `Roubo bem sucedido! Você roubou ${coins} CbCoins!\nChances restantes: ${userEconomy.steal_chances}`
            : `Roubo falhou! Tente novamente!\nChances restantes: ${userEconomy.steal_chances}`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleAvenge(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string) {
    if (!target) {
        await sock.sendMessage(groupId, {
            text: 'Mencione o usuário que você quer se vingar!'
        });
        return;
    }

<<<<<<< HEAD
    // Limpa o JID se necessário
    target = target.split('@')[0] + '@s.whatsapp.net';

    if (target === sender) {
        await sock.sendMessage(groupId, {
            text: 'Você não pode se vingar de si mesmo!'
        });
        return;
    }

=======
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    if (userEconomy.avenge_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de se vingar hoje!'
        });
        return;
    }

    const targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        await sock.sendMessage(groupId, {
            text: 'Usuário não encontrado!'
        });
        return;
    }

    const success = getRandomNumber(1, 100) <= 50;
    const coins = success ? Math.floor(targetEconomy.coins * 0.2) : 0;

    userEconomy.avenge_chances--;
    if (success) {
        userEconomy.coins += coins;
        targetEconomy.coins -= coins;
    }

    await db.updateUserEconomy(groupId, sender, userEconomy);
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: success
<<<<<<< HEAD
            ? `Vingança bem sucedida! Você roubou ${coins} CbCoins de @${target.split('@')[0]}!\nChances restantes: ${userEconomy.avenge_chances}`
            : `Vingança falhou! Tente novamente!\nChances restantes: ${userEconomy.avenge_chances}`,
        mentions: [target]
=======
            ? `Vingança bem sucedida! Você roubou ${coins} CbCoins!\nChances restantes: ${userEconomy.avenge_chances}`
            : `Vingança falhou! Tente novamente!\nChances restantes: ${userEconomy.avenge_chances}`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleLend(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string, amount: string) {
    if (!target || !amount) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, use: !emprestar @usuario [quantidade]`,
            mentions: [sender]
=======
            text: 'Mencione o usuário e a quantidade que você quer emprestar!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    // Limpa o JID se necessário
    target = target.split('@')[0] + '@s.whatsapp.net';

    if (target === sender) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você não pode emprestar para si mesmo!`,
            mentions: [sender]
=======
    if (userEconomy.lend_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de emprestar hoje!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    const coins = parseInt(amount);
    if (isNaN(coins) || coins <= 0) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, valor inválido!`,
            mentions: [sender]
=======
            text: 'Quantidade inválida!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    if (coins > userEconomy.coins) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você não tem CbCoins suficientes!\nSeu saldo: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
            mentions: [sender]
=======
    if (userEconomy.coins < coins) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem CbCoins suficientes!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    // Atualiza os saldos
    userEconomy.coins -= coins;
    await db.updateUserEconomy(groupId, sender, userEconomy);

    let targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        targetEconomy = {
            coins: 0,
            last_daily: null,
            mining_chances: MINING_CHANCES,
            steal_chances: STEAL_CHANCES,
            avenge_chances: AVENGE_CHANCES,
            lend_chances: LEND_CHANCES,
            donate_chances: DONATE_CHANCES,
            casino_chances: CASINO_CHANCES,
            shield: false,
            lucky_charm: false
        };
        await db.createUserEconomy(groupId, target, targetEconomy);
    }
    targetEconomy.coins += coins;
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: `💸 @${sender.split('@')[0]} emprestou ${coins.toLocaleString('pt-BR')} CbCoins para @${target.split('@')[0]}!\nSaldo de @${sender.split('@')[0]}: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
        mentions: [sender, target]
=======
    const targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        await sock.sendMessage(groupId, {
            text: 'Usuário não encontrado!'
        });
        return;
    }

    userEconomy.lend_chances--;
    userEconomy.coins -= coins;
    targetEconomy.coins += coins;

    await db.updateUserEconomy(groupId, sender, userEconomy);
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: `Você emprestou ${coins} CbCoins para ${target}!\nChances restantes: ${userEconomy.lend_chances}`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleDonate(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string, amount: string) {
    if (!target || !amount) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, use: !doar @usuario [quantidade]`,
            mentions: [sender]
=======
            text: 'Mencione o usuário e a quantidade que você quer doar!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    // Limpa o JID se necessário
    target = target.split('@')[0] + '@s.whatsapp.net';

    if (target === sender) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você não pode doar para si mesmo!`,
            mentions: [sender]
=======
    if (userEconomy.donate_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de doar hoje!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

    const coins = parseInt(amount);
    if (isNaN(coins) || coins <= 0) {
        await sock.sendMessage(groupId, {
<<<<<<< HEAD
            text: `@${sender.split('@')[0]}, valor inválido!`,
            mentions: [sender]
=======
            text: 'Quantidade inválida!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    if (coins > userEconomy.coins) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você não tem CbCoins suficientes!\nSeu saldo: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
            mentions: [sender]
=======
    if (userEconomy.coins < coins) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem CbCoins suficientes!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    // Atualiza os saldos
    userEconomy.coins -= coins;
    await db.updateUserEconomy(groupId, sender, userEconomy);

    let targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        targetEconomy = {
            coins: 0,
            last_daily: null,
            mining_chances: MINING_CHANCES,
            steal_chances: STEAL_CHANCES,
            avenge_chances: AVENGE_CHANCES,
            lend_chances: LEND_CHANCES,
            donate_chances: DONATE_CHANCES,
            casino_chances: CASINO_CHANCES,
            shield: false,
            lucky_charm: false
        };
        await db.createUserEconomy(groupId, target, targetEconomy);
    }
    targetEconomy.coins += coins;
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: `🎁 @${sender.split('@')[0]} doou ${coins.toLocaleString('pt-BR')} CbCoins para @${target.split('@')[0]}!\nSaldo de @${sender.split('@')[0]}: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
        mentions: [sender, target]
    });
}

// Configurações do cassino
const CASINO_CONFIG = {
    multipliers: [
        { value: 10, chance: 0.01, message: '🌟 JACKPOT!!! Você ganhou {amount} CBcoins (10x)!' },
        { value: 5, chance: 0.04, message: '🎯 EXTRAORDINÁRIO! Você ganhou {amount} CBcoins (5x)!' },
        { value: 3, chance: 0.15, message: '🎰 INCRÍVEL! Você ganhou {amount} CBcoins (3x)!' },
        { value: 2, chance: 0.30, message: '💰 Parabéns! Você ganhou {amount} CBcoins (2x)!' },
        { value: 1, chance: 0.50, message: '📉 Você perdeu {amount} CBcoins!' }
    ]
};

async function handleCasino(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, betAmount: string) {
    try {
        // Verifica chances disponíveis
        if (userEconomy.casino_chances <= 0) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, você não tem mais chances de apostar hoje!`,
                mentions: [sender]
            });
            return;
        }

        // Valida e converte a aposta
        const bet = parseInt(betAmount);
        if (isNaN(bet) || bet <= 0) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, valor inválido! Use: !cassino <valor>`,
                mentions: [sender]
            });
            return;
        }

        // Verifica saldo
        if (userEconomy.coins < bet) {
            await sock.sendMessage(groupId, {
                text: `@${sender.split('@')[0]}, você não tem CBcoins suficientes!\nSeu saldo: ${userEconomy.coins.toLocaleString('pt-BR')} CBcoins`,
                mentions: [sender]
            });
            return;
        }

        // Processa a aposta
        const random = Math.random();
        let accumulatedChance = 0;
        let result = CASINO_CONFIG.multipliers[CASINO_CONFIG.multipliers.length - 1]; // Default para perda

        for (const multiplier of CASINO_CONFIG.multipliers) {
            accumulatedChance += multiplier.chance;
            if (random <= accumulatedChance) {
                result = multiplier;
                break;
            }
        }

        // Calcula resultado
        const finalAmount = result.value === 1 ? -bet : bet * (result.value - 1);
        
        // Atualiza economia
        userEconomy.coins += finalAmount;
        userEconomy.casino_chances--;

        await db.updateUserEconomy(groupId, sender, {
            coins: userEconomy.coins,
            casino_chances: userEconomy.casino_chances
        });

        // Envia resultado
        const message = result.message.replace('{amount}', Math.abs(finalAmount).toLocaleString('pt-BR')) +
            `\nSaldo atual: ${userEconomy.coins.toLocaleString('pt-BR')} CBcoins` +
            `\nChances restantes: ${userEconomy.casino_chances}`;

        await sock.sendMessage(groupId, {
            text: message,
            mentions: [sender]
        });

    } catch (error) {
        console.error('Erro no cassino:', error);
        await sock.sendMessage(groupId, {
            text: '❌ Ocorreu um erro ao processar sua aposta!',
            mentions: [sender]
        });
    }
}

async function handleShield(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    const price = SHIELD_PRICE;
    
    if (userEconomy.shield) {
        await sock.sendMessage(groupId, {
            text: '❌ Você já possui um escudo ativo!'
=======
    const targetEconomy = await db.getUserEconomy(groupId, target);
    if (!targetEconomy) {
        await sock.sendMessage(groupId, {
            text: 'Usuário não encontrado!'
        });
        return;
    }

    userEconomy.donate_chances--;
    userEconomy.coins -= coins;
    targetEconomy.coins += coins;

    await db.updateUserEconomy(groupId, sender, userEconomy);
    await db.updateUserEconomy(groupId, target, targetEconomy);

    await sock.sendMessage(groupId, {
        text: `Você doou ${coins} CbCoins para ${target}!\nChances restantes: ${userEconomy.donate_chances}`
    });
}

async function handleCasino(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, bet: string) {
    if (!bet) {
        await sock.sendMessage(groupId, {
            text: 'Digite a quantidade que você quer apostar!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    if (userEconomy.coins < price) {
        await sock.sendMessage(groupId, {
            text: `❌ Você precisa de ${price} CbCoins para comprar um escudo!\nSeu saldo: ${userEconomy.coins} CbCoins`
=======
    if (userEconomy.casino_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de jogar no casino hoje!'
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        });
        return;
    }

<<<<<<< HEAD
    userEconomy.coins -= price;
    userEconomy.shield = true;
    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
        text: `✅ Você comprou um escudo por ${price} CbCoins!\nSeu saldo atual: ${userEconomy.coins} CbCoins`
=======
    const coins = parseInt(bet);
    if (isNaN(coins) || coins <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Quantidade inválida!'
        });
        return;
    }

    if (userEconomy.coins < coins) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem CbCoins suficientes!'
        });
        return;
    }

    const success = getRandomNumber(1, 100) <= 40;
    const multiplier = success ? getRandomNumber(1, 3) : 0;

    userEconomy.casino_chances--;
    if (success) {
        userEconomy.coins += coins * multiplier;
    } else {
        userEconomy.coins -= coins;
    }

    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
        text: success
            ? `Você ganhou ${coins * multiplier} CbCoins! (${multiplier}x)\nChances restantes: ${userEconomy.casino_chances}`
            : `Você perdeu ${coins} CbCoins!\nChances restantes: ${userEconomy.casino_chances}`
    });
}

async function handleShield(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    if (userEconomy.shield) {
        await sock.sendMessage(groupId, {
            text: 'Você já está protegido por um escudo!'
        });
        return;
    }

    const shieldCost = 5000;
    if (userEconomy.coins < shieldCost) {
        await sock.sendMessage(groupId, {
            text: `Você precisa de ${shieldCost} CbCoins para comprar um escudo!`
        });
        return;
    }

    userEconomy.coins -= shieldCost;
    userEconomy.shield = true;

    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
        text: `Você comprou um escudo por ${shieldCost} CbCoins!\nAgora você está protegido contra roubos!`
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    });
}

async function handleLuckyCharm(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    if (userEconomy.lucky_charm) {
        await sock.sendMessage(groupId, {
            text: 'Você já tem um amuleto da sorte!'
        });
        return;
    }

<<<<<<< HEAD
    const charmCost = LUCKY_CHARM_PRICE;
=======
    const charmCost = 3000;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    if (userEconomy.coins < charmCost) {
        await sock.sendMessage(groupId, {
            text: `Você precisa de ${charmCost} CbCoins para comprar um amuleto da sorte!`
        });
        return;
    }

    userEconomy.coins -= charmCost;
    userEconomy.lucky_charm = true;

    await db.updateUserEconomy(groupId, sender, userEconomy);

    await sock.sendMessage(groupId, {
        text: `Você comprou um amuleto da sorte por ${charmCost} CbCoins!\nAgora suas chances de sucesso aumentaram!`
    });
}

async function handleRanking(sock: any, groupId: string) {
    const ranking = await db.getGroupEconomyRanking(groupId);
<<<<<<< HEAD
    const mentions = ranking.map(user => user.user_id);

    let text = `╭━━━━━━━━━━━━━━━━╮
    ┃ 🏆 *RANKING CBCOIN* 🏆
    ╰━━━━━━━━━━━━━━━━╯\n\n`;

    for (let i = 0; i < ranking.length; i++) {
        const user = ranking[i];
        // Emojis para as posições
        const position = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎮';
        
        // Formata o número com pontos para milhares
        const formattedCoins = user.coins.toLocaleString('pt-BR');
        
        // Adiciona @ para criar a menção e usa o número do WhatsApp
        const userNumber = user.user_id.split('@')[0];
        text += `${position} ${i + 1}º @${userNumber}\n`;
        text += `┃    💰 ${formattedCoins} CbCoins\n`;
        if (i < ranking.length - 1) text += `┃\n`;
    }

    text += `\n╭━━━━━━━━━━━━━━━━╮
    ┃ 👑 *TOP 10 PLAYERS* 👑
    ╰━━━━━━━━━━━━━━━━╯`;

    await sock.sendMessage(groupId, { 
        text,
        mentions // Adiciona o array de menções
    });
}

async function handleHelpCbCoin(sock: any, groupId: string) {
    const text = `*🎮 O QUE É O CBCOIN? 🎮*

*Sobre o CbCoin:*
CbCoin é a moeda oficial do Calabouço! Com ela, você pode participar de várias atividades divertidas e interativas no grupo.

*🌟 O que você pode fazer:*
1. 💰 *Ganhar moedas:*
   • Coletar recompensa diária (1000 CbCoins)
   • Minerar CbCoins (70% de chance de sucesso)
   • Jogar no cassino e multiplicar seus ganhos

2. 🤝 *Interagir com outros jogadores:*
   • Roubar CbCoins de outros jogadores
   • Se vingar de quem te roubou
   • Emprestar moedas para amigos
   • Fazer doações
   • Competir no ranking

3. 🛡️ *Itens especiais:*
   • Comprar escudo para proteção contra roubos
   • Adquirir amuleto da sorte para aumentar chances

*⚙️ Como funciona:*
• Cada grupo tem sua própria economia
• As chances são renovadas diariamente
• Você pode ver seu progresso com !perfil
• Acompanhe os mais ricos com !ranking

*💡 Dicas importantes:*
• Comece coletando sua recompensa diária
• Minere regularmente para acumular moedas
• Proteja-se com escudo contra roubos
• Use o amuleto para aumentar suas chances
• Participe ativamente para subir no ranking

Use !menucbcoin para ver todos os comandos disponíveis!`;

=======

    let text = '*🏆 Ranking de CbCoins 🏆*\n\n';
    for (let i = 0; i < ranking.length; i++) {
        const user = ranking[i];
        text += `${i + 1}. @${user.user_id.split('@')[0]}: ${user.coins} CbCoins\n`;
    }

>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    await sock.sendMessage(groupId, { text });
}

async function showCbCoinMenu(sock: any, groupId: string) {
<<<<<<< HEAD
    const text = `🎮 *Menu CbCoin* 🎮

*💰 Comandos de Economia:*
!diario - Recebe ${DAILY_COINS} CbCoins diários
!minerar - Minera CbCoins (70% de chance)
!roubar @usuario - Rouba CbCoins de alguém
!vingar @usuario - Tenta recuperar CbCoins roubados
!emprestar @usuario [valor] - Empresta CbCoins
!doar @usuario [valor] - Doa CbCoins
!cassino [valor] - Tenta multiplicar seus CbCoins
!escudo - Compra proteção contra roubos (${SHIELD_PRICE} CbCoins)
!amuletosorte - Aumenta chances de sucesso (${LUCKY_CHARM_PRICE} CbCoins)
!sniper @usuario - Impede alguém de jogar por 24h (${SNIPER_PRICE} CbCoins)
!sortudo - Ganha ${LUCKY_PRIZE} CbCoins e marca alguém aleatório (24h cooldown)
!ranking - Mostra o ranking de CbCoins
!perfil - Mostra seu perfil no jogo

*💡 Chances Diárias:*
⛏️ Minerar: ${MINING_CHANCES}x chances
🦹‍♂️ Roubar: ${STEAL_CHANCES}x chances
⚔️ Vingar: ${AVENGE_CHANCES}x chance
💸 Emprestar: ${LEND_CHANCES}x chances
🎁 Doar: ${DONATE_CHANCES}x chances
🎲 Cassino: ${CASINO_CHANCES}x chances

*💡 Dicas:*
• Colete sua recompensa diária
• Minere para ganhar mais CbCoins
• Use o escudo para se proteger
• Ajude outros jogadores com doações
• Jogue no cassino com moderação

*⚠️ Observações:*
• As chances são resetadas diariamente
• O escudo protege contra roubos e sniper
• O amuleto aumenta chances de sucesso
• Seja ativo para ganhar mais CbCoins`;
=======
    const text = `*🎮 SISTEMA CBCOIN 🎮*

*Como Jogar:*
1. Use !abrirjogo para iniciar o jogo (apenas admins)
2. Todos os membros podem participar
3. Use !perfil para ver suas informações
4. Use !ranking para ver o top 10 mais ricos

*💰 Comandos Básicos:*
!diario - Receba 1000 CbCoins por dia
!minerar - Tente minerar CbCoins (70% de sucesso)
!roubar @usuario - Tente roubar 10% dos CbCoins de alguém (30% de sucesso)
!vingar @usuario - Tente se vingar e roubar 20% dos CbCoins (50% de sucesso)
!emprestar @usuario [quantidade] - Empreste CbCoins para alguém
!doar @usuario [quantidade] - Doe CbCoins para alguém
!casino [aposta] - Jogue no casino (40% de sucesso, multiplicador 1x-3x)

*🎯 Chances Diárias:*
⛏️ Minerar: 3x chances
🦹 Roubar: 2x chances
⚔️ Vingar: 1x chance
💸 Emprestar: 2x chances
🎁 Doar: 3x chances
🎲 Casino: 5x chances

*🛡️ Itens de Proteção:*
!escudo - Custa 5000 CbCoins
• Protege contra roubos
• Dura até ser desativado

*🍀 Itens de Sorte:*
!amuletosorte - Custa 3000 CbCoins
• Aumenta chances de sucesso
• Dura até ser desativado

*📊 Informações:*
• Cada grupo tem seu próprio sistema
• As chances são resetadas diariamente
• Use !perfil para ver suas informações
• Use !ranking para ver os mais ricos

*⚠️ Dicas:*
• Colete sua recompensa diária primeiro
• Use o escudo para se proteger de roubos
• Use o amuleto da sorte para aumentar chances
• Jogue no casino com moderação
• Ajude outros jogadores com doações

*🎮 Comandos de Controle:*
!abrirjogo - Abre o jogo (apenas admins)
!fecharjogo - Fecha o jogo (apenas admins)
!menucbcoin - Mostra este menu
!menu - Menu simplificado
!perfil - Mostra suas informações
!ranking - Mostra o top 10 mais ricos`;

    await sock.sendMessage(groupId, { text });
}

async function showEconomyMenu(sock: any, groupId: string) {
    const text = `*🎮 Menu Rápido CbCoin 🎮*

*Comandos:*
!diario - Receba 1000 CbCoins
!minerar - Minerar CbCoins
!roubar @usuario - Roubar CbCoins
!vingar @usuario - Se vingar
!emprestar @usuario [qtd] - Emprestar
!doar @usuario [qtd] - Doar
!casino [aposta] - Jogar no casino
!escudo - Comprar escudo
!amuletosorte - Comprar amuleto
!perfil - Ver suas informações
!ranking - Ver ranking
!menucbcoin - Menu completo

Use !menucbcoin para ver o menu completo com todas as informações!`;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b

    await sock.sendMessage(groupId, { text });
}

async function handleProfile(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    const user = await db.getUserInGroup(sender, groupId);
    if (!user) {
        await sock.sendMessage(groupId, { text: 'Usuário não encontrado!' });
        return;
    }

<<<<<<< HEAD
    const text = `🎮 *Perfil do Jogador*\n
👤 Jogador: @${sender.split('@')[0]}
💰 CbCoins: ${userEconomy.coins.toLocaleString('pt-BR')}

*📊 Chances Restantes:*
⛏️ Minerar: ${userEconomy.mining_chances}/${MINING_CHANCES}
🦹‍♂️ Roubar: ${userEconomy.steal_chances}/${STEAL_CHANCES}
⚔️ Vingar: ${userEconomy.avenge_chances}/${AVENGE_CHANCES}
💸 Emprestar: ${userEconomy.lend_chances}/${LEND_CHANCES}
🎁 Doar: ${userEconomy.donate_chances}/${DONATE_CHANCES}
🎲 Cassino: ${userEconomy.casino_chances}/${CASINO_CHANCES}

*🛡️ Itens Ativos:*
🛡️ Escudo: ${userEconomy.shield ? 'Ativo' : 'Inativo'}
🍀 Amuleto da Sorte: ${userEconomy.lucky_charm ? 'Ativo' : 'Inativo'}`;

    await sock.sendMessage(groupId, {
        text,
        mentions: [sender]
    });
}

async function handleCommands(sock: any, groupId: string) {
    const text = `╭━━━━━━━━━━━━━━━━╮
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

    await sock.sendMessage(groupId, { text });
}

// Adiciona a função para pegar membro aleatório do grupo
async function getRandomGroupMember(sock: any, groupId: string, sender: string): Promise<string | null> {
    try {
        const group = await sock.groupMetadata(groupId);
        const members = group.participants
            .map(p => p.id)
            .filter(id => id !== sender); // Exclui o próprio usuário
        
        if (members.length === 0) return null;
        
        const randomIndex = Math.floor(Math.random() * members.length);
        return members[randomIndex];
    } catch (error) {
        console.error('Erro ao obter membros do grupo:', error);
        return null;
    }
}

// Adiciona a função para lidar com o comando sortudo
async function handleLucky(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    // Verifica cooldown
    if (userEconomy.lucky_cooldown && Date.now() < userEconomy.lucky_cooldown) {
        const timeLeft = Math.ceil((userEconomy.lucky_cooldown - Date.now()) / (1000 * 60 * 60));
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, você precisa esperar ${timeLeft} horas para usar o comando sortudo novamente!`,
            mentions: [sender]
        });
        return;
    }

    // Pega um membro aleatório
    const luckyMember = await getRandomGroupMember(sock, groupId, sender);
    if (!luckyMember) {
        await sock.sendMessage(groupId, {
            text: `@${sender.split('@')[0]}, não foi possível encontrar um membro aleatório no grupo!`,
            mentions: [sender]
        });
        return;
    }

    // Atualiza o saldo e o cooldown do usuário
    userEconomy.coins += LUCKY_PRIZE;
    userEconomy.lucky_cooldown = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
    await db.updateUserEconomy(groupId, sender, userEconomy);

    // Envia a mensagem
    await sock.sendMessage(groupId, {
        text: `🍀 @${sender.split('@')[0]} usou o comando sortudo e ganhou ${LUCKY_PRIZE.toLocaleString('pt-BR')} CbCoins!\n\n🎯 Membro sorteado: @${luckyMember.split('@')[0]}\n\nSaldo atual: ${userEconomy.coins.toLocaleString('pt-BR')} CbCoins`,
        mentions: [sender, luckyMember]
    });
=======
    const text = `*👤 Perfil de ${user.user_name}*

💰 CbCoins: ${userEconomy.coins}
🎁 Recompensa Diária: ${userEconomy.last_daily ? 'Já coletada' : 'Disponível'}
⛏️ Chances de Minerar: ${userEconomy.mining_chances}/${MINING_CHANCES}
🦹 Chances de Roubar: ${userEconomy.steal_chances}/${STEAL_CHANCES}
⚔️ Chances de Vingar: ${userEconomy.avenge_chances}/${AVENGE_CHANCES}
💸 Chances de Emprestar: ${userEconomy.lend_chances}/${LEND_CHANCES}
🎁 Chances de Doar: ${userEconomy.donate_chances}/${DONATE_CHANCES}
🎲 Chances no Casino: ${userEconomy.casino_chances}/${CASINO_CHANCES}
🛡️ Escudo: ${userEconomy.shield ? 'Ativo' : 'Inativo'}
🍀 Amuleto da Sorte: ${userEconomy.lucky_charm ? 'Ativo' : 'Inativo'}`;

    await sock.sendMessage(groupId, { text });
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
} 