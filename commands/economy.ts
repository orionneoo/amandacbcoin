import { proto } from '@whiskeysockets/baileys';
import db from '../database';
import { getRandomNumber } from '../utils/random';
import { UserEconomy } from '../types/database';

const DAILY_COINS = 1000;
const MINING_CHANCES = 3;
const STEAL_CHANCES = 2;
const AVENGE_CHANCES = 1;
const LEND_CHANCES = 2;
const DONATE_CHANCES = 3;
const CASINO_CHANCES = 5;

export async function handleEconomyCommand(
    sock: any,
    message: proto.IWebMessageInfo,
    command: string,
    args: string[]
) {
    const groupId = message.key.remoteJid;
    if (!groupId.endsWith('@g.us')) {
        await sock.sendMessage(groupId, { text: 'Este comando só pode ser usado em grupos!' });
        return;
    }

    const sender = message.key.participant || message.key.remoteJid;

    // Comandos de controle do jogo
    if (command.toLowerCase() === '!abrirjogo') {
        const group = await db.getGroup(groupId);
        if (!group) {
            await sock.sendMessage(groupId, { text: 'Grupo não encontrado!' });
            return;
        }

        const admins = group.admins || [];
        if (!admins.includes(sender)) {
            await sock.sendMessage(groupId, { text: 'Apenas administradores podem abrir o jogo!' });
            return;
        }

        await db.setGameActive(groupId, true);
        await sock.sendMessage(groupId, { text: '🎮 O jogo CbCoin foi aberto! Use !menu para ver os comandos disponíveis.' });
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
}

async function handleDaily(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    const now = Date.now();
    const lastDaily = userEconomy.last_daily;
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - lastDaily < oneDay) {
        const timeLeft = oneDay - (now - lastDaily);
        const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
        await sock.sendMessage(groupId, {
            text: `Você precisa esperar ${hoursLeft} horas para receber sua recompensa diária novamente!`
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
        text: `Você recebeu ${DAILY_COINS} CbCoins como sua recompensa diária!\nSeu saldo atual: ${userEconomy.coins} CbCoins`
    });
}

async function handleMining(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    if (userEconomy.mining_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de minerar hoje!'
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
            ? `Mineragem bem sucedida! Você ganhou ${coins} CbCoins!\nChances restantes: ${userEconomy.mining_chances}`
            : `Mineragem falhou! Tente novamente!\nChances restantes: ${userEconomy.mining_chances}`
    });
}

async function handleSteal(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string) {
    if (!target) {
        await sock.sendMessage(groupId, {
            text: 'Mencione o usuário que você quer roubar!'
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
            text: 'O usuário está protegido por um escudo!'
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
            ? `Roubo bem sucedido! Você roubou ${coins} CbCoins!\nChances restantes: ${userEconomy.steal_chances}`
            : `Roubo falhou! Tente novamente!\nChances restantes: ${userEconomy.steal_chances}`
    });
}

async function handleAvenge(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string) {
    if (!target) {
        await sock.sendMessage(groupId, {
            text: 'Mencione o usuário que você quer se vingar!'
        });
        return;
    }

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
            ? `Vingança bem sucedida! Você roubou ${coins} CbCoins!\nChances restantes: ${userEconomy.avenge_chances}`
            : `Vingança falhou! Tente novamente!\nChances restantes: ${userEconomy.avenge_chances}`
    });
}

async function handleLend(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string, amount: string) {
    if (!target || !amount) {
        await sock.sendMessage(groupId, {
            text: 'Mencione o usuário e a quantidade que você quer emprestar!'
        });
        return;
    }

    if (userEconomy.lend_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de emprestar hoje!'
        });
        return;
    }

    const coins = parseInt(amount);
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
    });
}

async function handleDonate(sock: any, groupId: string, sender: string, userEconomy: UserEconomy, target: string, amount: string) {
    if (!target || !amount) {
        await sock.sendMessage(groupId, {
            text: 'Mencione o usuário e a quantidade que você quer doar!'
        });
        return;
    }

    if (userEconomy.donate_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de doar hoje!'
        });
        return;
    }

    const coins = parseInt(amount);
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
        });
        return;
    }

    if (userEconomy.casino_chances <= 0) {
        await sock.sendMessage(groupId, {
            text: 'Você não tem mais chances de jogar no casino hoje!'
        });
        return;
    }

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
    });
}

async function handleLuckyCharm(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    if (userEconomy.lucky_charm) {
        await sock.sendMessage(groupId, {
            text: 'Você já tem um amuleto da sorte!'
        });
        return;
    }

    const charmCost = 3000;
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

    let text = '*🏆 Ranking de CbCoins 🏆*\n\n';
    for (let i = 0; i < ranking.length; i++) {
        const user = ranking[i];
        text += `${i + 1}. @${user.user_id.split('@')[0]}: ${user.coins} CbCoins\n`;
    }

    await sock.sendMessage(groupId, { text });
}

async function showCbCoinMenu(sock: any, groupId: string) {
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

    await sock.sendMessage(groupId, { text });
}

async function handleProfile(sock: any, groupId: string, sender: string, userEconomy: UserEconomy) {
    const user = await db.getUserInGroup(sender, groupId);
    if (!user) {
        await sock.sendMessage(groupId, { text: 'Usuário não encontrado!' });
        return;
    }

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
} 