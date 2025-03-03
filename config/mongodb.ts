import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/amanda_bot';
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 segundos

let isConnecting = false;
let retryCount = 0;

export const connectToMongoDB = async () => {
    if (isConnecting) {
        console.log('Já existe uma tentativa de conexão em andamento...');
        return;
    }

    // Se já estiver conectado, não tenta conectar novamente
    if (mongoose.connection.readyState === 1) {
        console.log('✅ Já conectado ao MongoDB');
        return;
    }

    isConnecting = true;

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        
        console.log('✅ Conexão com o MongoDB estabelecida com sucesso');
        retryCount = 0; // Reseta o contador de tentativas
        
        // Configura listeners para reconexão automática
        mongoose.connection.on('disconnected', () => {
            console.log('❌ MongoDB desconectado. Tentando reconectar...');
            setTimeout(connectToMongoDB, RETRY_DELAY);
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ Erro na conexão com MongoDB:', error);
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`Tentativa ${retryCount} de ${MAX_RETRIES}...`);
                setTimeout(connectToMongoDB, RETRY_DELAY);
            } else {
                console.error('❌ Número máximo de tentativas atingido. Verifique sua conexão com o MongoDB.');
            }
        });

    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`Tentativa ${retryCount} de ${MAX_RETRIES}...`);
            setTimeout(connectToMongoDB, RETRY_DELAY);
        } else {
            console.error('❌ Número máximo de tentativas atingido. Verifique sua conexão com o MongoDB.');
        }
    } finally {
        isConnecting = false;
    }
};

export const disconnectFromMongoDB = async () => {
    try {
        await mongoose.disconnect();
        console.log('✅ Desconectado do MongoDB com sucesso');
    } catch (error) {
        console.error('❌ Erro ao desconectar do MongoDB:', error);
        throw error;
    }
}; 