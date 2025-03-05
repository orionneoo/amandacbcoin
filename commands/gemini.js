const genAI = require('../config/gemini');

async function handleGeminiMessage(message, args) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = args.join(' ');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        // Adaptação para Baileys/WhatsApp
        await message.reply(response.text());
    } catch (error) {
        console.error('Erro ao usar Gemini:', error);
        await message.reply('Desculpe, houve um erro ao processar sua solicitação.');
    }
}

module.exports = {
    name: 'gemini',
    execute: handleGeminiMessage
}; 