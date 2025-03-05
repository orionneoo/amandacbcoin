import mongoose from 'mongoose';
<<<<<<< HEAD
import { Group, UserGroup, Message, Settings, Economy } from './models/schemas';
import { IGroup, IUserGroup, IMessage, ISettings } from './models/schemas';
import { ObjectId } from 'mongodb';
import { UserEconomy } from './types/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env') });
=======
import { Group, UserGroup, Message, Settings } from './models/schemas';
import { IGroup, IUserGroup, IMessage, ISettings } from './models/schemas';
import { ObjectId } from 'mongodb';
import { Db, Collection } from 'mongodb';
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b

interface GroupData {
    id: string;
    name: string;
    created_at: string;
    last_interaction: string;
    total_messages: number;
    active: boolean;
    member_count: number;
<<<<<<< HEAD
    admins: string[];
    game_active: boolean;
=======
    admins: string;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
}

interface UserData {
    user_id: string;
    user_name: string;
    name_captured: string | null;
<<<<<<< HEAD
    message_count: number;
    last_message: Date;
    group_id: string;
    total_messages: number;
=======
    phone_number: string;
    group_id: string;
    group_name: string;
    total_messages: number;
    joined_at: string;
    last_interaction: string;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    is_admin: boolean;
}

interface MessageData {
    id: string;
    user_id: string;
    group_id: string | null;
    group_name: string | null;
    message: string;
    type: string;
    timestamp: string;
    created_at: string;
}

interface SettingsData {
    id: number;
    group_id: string;
    welcome_message: string | null;
    auto_response: boolean;
    created_at: string;
    updated_at: string;
}

interface DatabaseMessage {
    id: string;
    user_id: string;
    user_name: string;
    group_id: string | null;
    group_name: string | null;
    message: string;
    type: string;
    timestamp: string;
    created_at: string;
}

interface ModAction {
    _id?: string;
    type: 'warn' | 'ban' | 'kick' | 'mute' | 'punishment';
    userId: string;
    groupId: string;
    reason: string;
    moderatorId: string;
    timestamp: Date;
    duration?: number;
}

<<<<<<< HEAD
=======
interface UserEconomy {
    coins: number;
    last_daily: number;
    mining_chances: number;
    steal_chances: number;
    avenge_chances: number;
    lend_chances: number;
    donate_chances: number;
    casino_chances: number;
    shield: boolean;
    lucky_charm: boolean;
}

>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
class DatabaseManager {
    private static instance: DatabaseManager;
    private isInitialized: boolean = false;
    private mongooseConnection: typeof mongoose;

    private constructor() {
        this.mongooseConnection = mongoose;
<<<<<<< HEAD

        // Verifica se já existe uma conexão
        if (mongoose.connection.readyState === 1) {
            console.log('Usando conexão MongoDB existente');
            return;
        }

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI não está definida nas variáveis de ambiente');
        }

        // Única conexão com MongoDB
        console.log('Tentando conectar ao MongoDB com URI:', uri);
        mongoose.connect(uri)
            .then(() => {
                console.log('Conexão bem sucedida!');
                console.log('Database:', mongoose.connection.db.databaseName);
                console.log('Host:', mongoose.connection.host);
                this.isInitialized = true;
            })
            .catch(err => {
                console.error('Erro detalhado:', err.message);
                console.error('Erro ao conectar ao MongoDB:', err);
            });
=======
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public async ensureInitialized(): Promise<void> {
        if (!this.isInitialized) {
            // Verifica se já existe uma conexão
            if (this.mongooseConnection.connection.readyState === 1) {
                this.isInitialized = true;
                return;
            }
            
            // Se não houver conexão, aguarda a conexão existente
            await new Promise<void>((resolve) => {
                const checkConnection = () => {
                    if (this.mongooseConnection.connection.readyState === 1) {
                        this.isInitialized = true;
                        resolve();
                    } else {
                        setTimeout(checkConnection, 100);
                    }
                };
                checkConnection();
            });
        }
    }

    // Métodos para grupos
    public async addGroup(id: string, name: string, memberCount: number = 0, admins: string[] = []): Promise<void> {
        await this.ensureInitialized();
        await Group.findOneAndUpdate(
            { id },
            {
                id,
                name,
                member_count: memberCount,
                admins,
                last_interaction: new Date()
            },
            { upsert: true }
        );
    }

    public async updateGroupInfo(id: string, memberCount: number, admins: string[]): Promise<void> {
        await this.ensureInitialized();
        await Group.findOneAndUpdate(
            { id },
            {
                member_count: memberCount,
                admins,
                last_interaction: new Date()
            }
        );
    }

    public async addMessage(
        messageId: string,
        userId: string,
        groupId: string | null,
        groupName: string | null,
        message: string,
        type: string
    ): Promise<void> {
        await this.ensureInitialized();
        
        const newMessage = new Message({
            id: messageId,
            user_id: userId,
            group_id: groupId,
            group_name: groupName,
            message,
            type,
            timestamp: new Date(),
            created_at: new Date()
        });

        await newMessage.save();
        await this.updateMessageCounters(userId, groupId);
    }

    public async getGroupSettings(groupId: string): Promise<ISettings | null> {
        await this.ensureInitialized();
        return await Settings.findOne({ group_id: groupId });
    }

    public async updateGroupSettings(groupId: string, settings: Partial<ISettings>): Promise<void> {
        await this.ensureInitialized();
        await Settings.findOneAndUpdate(
            { group_id: groupId },
            { ...settings, updated_at: new Date() },
            { upsert: true }
        );
    }

    public async getGroupStats(groupId: string): Promise<any> {
        await this.ensureInitialized();
        const group = await Group.findOne({ id: groupId });
        const messageCount = await Message.countDocuments({ group_id: groupId });
        const userCount = await UserGroup.countDocuments({ group_id: groupId });

        return {
            name: group?.name,
            total_messages: messageCount,
            member_count: userCount,
            created_at: group?.created_at
        };
    }

    public async getUserStats(userId: string): Promise<any> {
        await this.ensureInitialized();
        const userGroups = await UserGroup.find({ user_id: userId });
        const messageCount = await Message.countDocuments({ user_id: userId });

        return {
            groups: userGroups.map(ug => ({
<<<<<<< HEAD
                group_id: ug.group_id,
                user_name: ug.user_name,
                message_count: ug.message_count,
                last_message: ug.last_message
=======
                group_name: ug.group_name,
                total_messages: ug.total_messages,
                joined_at: ug.joined_at
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
            })),
            total_messages: messageCount
        };
    }

    public async getGroupMembers(groupId: string): Promise<IUserGroup[]> {
        await this.ensureInitialized();
        return await UserGroup.find({ group_id: groupId });
    }

    public async getGroupAdmins(groupId: string): Promise<string[]> {
        await this.ensureInitialized();
        const group = await Group.findOne({ id: groupId });
        return group?.admins || [];
    }

    public async getUserGroups(userId: string): Promise<IUserGroup[]> {
        await this.ensureInitialized();
        return await UserGroup.find({ user_id: userId });
    }

    public async resetDatabase(): Promise<void> {
        await this.ensureInitialized();
        await Promise.all([
            Group.deleteMany({}),
            UserGroup.deleteMany({}),
            Message.deleteMany({}),
            Settings.deleteMany({})
        ]);
    }

    public async addUserToGroup(
        userId: string,
        userName: string,
        phoneNumber: string,
        groupId: string,
        groupName: string,
        nameCaptured: string | null = null,
        isAdmin: boolean = false
    ): Promise<void> {
        await this.ensureInitialized();
        await UserGroup.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            {
                user_id: userId,
                user_name: userName,
                phone_number: phoneNumber,
                group_id: groupId,
                group_name: groupName,
                name_captured: nameCaptured,
                is_admin: isAdmin,
                last_interaction: new Date()
            },
            { upsert: true }
        );
    }

    public async updateUserCapturedName(userId: string, groupId: string, nameCaptured: string): Promise<void> {
        await this.ensureInitialized();
        await UserGroup.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            { name_captured: nameCaptured }
        );
    }

    public async listAllUsersAndGroups(): Promise<any[]> {
        await this.ensureInitialized();
        return await UserGroup.find().sort({ group_name: 1, user_name: 1 });
    }

    public async getGroupUsers(groupId: string): Promise<IUserGroup[]> {
        await this.ensureInitialized();
        return await UserGroup.find({ group_id: groupId });
    }

    public async updateGroupStatus(groupId: string, isActive: boolean): Promise<void> {
        await this.ensureInitialized();
        await Group.findOneAndUpdate(
            { id: groupId },
            { active: isActive }
        );
    }

    public async listActiveGroups(): Promise<IGroup[]> {
        await this.ensureInitialized();
        return await Group.find({ active: true });
    }

    public async listInactiveGroups(): Promise<IGroup[]> {
        await this.ensureInitialized();
        return await Group.find({ active: false });
    }

    public async messageExists(messageId: string): Promise<boolean> {
        await this.ensureInitialized();
        const count = await Message.countDocuments({ id: messageId });
        return count > 0;
    }

    public async getGroupMessages(groupId: string, limit: number = 50): Promise<IMessage[]> {
        await this.ensureInitialized();
        return await Message.find({ group_id: groupId })
            .sort({ timestamp: -1 })
            .limit(limit);
    }

    public async countMessages(groupId: string | null = null, period: string = '24 hours'): Promise<number> {
        await this.ensureInitialized();
        const query: any = {};
        
        if (groupId) {
            query.group_id = groupId;
        }

        const date = new Date();
        date.setHours(date.getHours() - 24);
        query.timestamp = { $gte: date };

        return await Message.countDocuments(query);
    }

    private async updateMessageCounters(userId: string, groupId: string | null): Promise<void> {
        if (groupId) {
            await Promise.all([
                Group.findOneAndUpdate(
                    { id: groupId },
                    { $inc: { total_messages: 1 }, last_interaction: new Date() }
                ),
                UserGroup.findOneAndUpdate(
                    { user_id: userId, group_id: groupId },
                    { $inc: { total_messages: 1 }, last_interaction: new Date() }
                )
            ]);
        }
    }

    // Métodos para ações de moderação
    async createModAction(action: ModAction): Promise<ModAction> {
        try {
            const newAction = new mongoose.models.ModAction(action);
            await newAction.save();
            return { ...action, _id: newAction._id.toString() };
        } catch (error) {
            console.error('Erro ao criar ação de moderação:', error);
            throw error;
        }
    }

    async getModActions(filter: Partial<ModAction>): Promise<ModAction[]> {
        try {
            const actions = await mongoose.models.ModAction.find(filter);
            return actions.map(action => ({
                ...action.toObject(),
                _id: action._id.toString()
            }));
        } catch (error) {
            console.error('Erro ao buscar ações de moderação:', error);
            throw error;
        }
    }

    async removeModAction(id: string): Promise<boolean> {
        try {
            const result = await mongoose.models.ModAction.deleteOne({ _id: new ObjectId(id) });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Erro ao remover ação de moderação:', error);
            throw error;
        }
    }

    async getModActionCount(filter: Partial<ModAction>): Promise<number> {
        try {
            return await mongoose.models.ModAction.countDocuments(filter);
        } catch (error) {
            console.error('Erro ao contar ações de moderação:', error);
            throw error;
        }
    }

    async getUserInfo(userId: string, groupId: string): Promise<IUserGroup | null> {
        try {
            return await UserGroup.findOne({ user_id: userId, group_id: groupId });
        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            throw error;
        }
    }

    public async getGroup(groupId: string): Promise<IGroup | null> {
        await this.ensureInitialized();
        return await Group.findOne({ id: groupId });
    }

    public async setGameActive(groupId: string, active: boolean): Promise<void> {
        await this.ensureInitialized();
        await Group.findOneAndUpdate(
            { id: groupId },
            { game_active: active }
        );
    }

    public async isGameActive(groupId: string): Promise<boolean> {
        await this.ensureInitialized();
        const group = await Group.findOne({ id: groupId });
        return group?.game_active || false;
    }

    public async getUserEconomy(groupId: string, userId: string): Promise<UserEconomy | null> {
        await this.ensureInitialized();
<<<<<<< HEAD
        const economy = await Economy.findOne({ user_id: userId, group_id: groupId });
        
        if (!economy) return null;
        
        return {
            coins: economy.coins,
            last_daily: economy.last_daily,
            mining_chances: economy.mining_chances,
            steal_chances: economy.steal_chances,
            avenge_chances: economy.avenge_chances,
            lend_chances: economy.lend_chances,
            donate_chances: economy.donate_chances,
            casino_chances: economy.casino_chances,
            shield: economy.shield,
            lucky_charm: economy.lucky_charm,
            sniper_cooldown: economy.sniper_cooldown,
            lucky_cooldown: economy.lucky_cooldown
=======
        const user = await UserGroup.findOne({ user_id: userId, group_id: groupId });
        if (!user) return null;
        return {
            coins: user.coins || 0,
            last_daily: user.last_daily || 0,
            mining_chances: user.mining_chances || 0,
            steal_chances: user.steal_chances || 0,
            avenge_chances: user.avenge_chances || 0,
            lend_chances: user.lend_chances || 0,
            donate_chances: user.donate_chances || 0,
            casino_chances: user.casino_chances || 0,
            shield: user.shield || false,
            lucky_charm: user.lucky_charm || false
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        };
    }

    public async updateUserEconomy(groupId: string, userId: string, data: Partial<UserEconomy>): Promise<void> {
        await this.ensureInitialized();
<<<<<<< HEAD

        // Busca informações atuais
        const group = await Group.findOne({ id: groupId });
        const userGroup = await UserGroup.findOne({ user_id: userId, group_id: groupId });

        // Atualiza mantendo os nomes
        await Economy.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            { 
                $set: {
                    ...data,
                    group_name: group?.name || 'Unknown Group',
                    user_name: userGroup?.user_name || userId.split('@')[0]
                }
            }
=======
        await UserGroup.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            { $set: data }
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        );
    }

    public async createUserEconomy(groupId: string, userId: string, data: UserEconomy): Promise<void> {
        await this.ensureInitialized();
<<<<<<< HEAD
        
        // Busca informações do grupo e usuário
        const group = await Group.findOne({ id: groupId });
        const userGroup = await UserGroup.findOne({ user_id: userId, group_id: groupId });

        // Prepara os dados com nome do usuário e grupo
        const economyData = {
            ...data,
            group_id: groupId,
            user_id: userId,
            group_name: group?.name || 'Unknown Group',
            user_name: userGroup?.user_name || userId.split('@')[0]
        };

        // Cria ou atualiza a economia
        await Economy.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            { $set: economyData },
=======
        await UserGroup.findOneAndUpdate(
            { user_id: userId, group_id: groupId },
            { $set: data },
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
            { upsert: true }
        );
    }

    public async getGroupEconomyRanking(groupId: string): Promise<Array<{ user_id: string; coins: number }>> {
        await this.ensureInitialized();
<<<<<<< HEAD
        const economies = await Economy.find({ group_id: groupId })
            .sort({ coins: -1 })
            .limit(10);
        
        return economies.map(economy => ({
            user_id: economy.user_id,
            coins: economy.coins
=======
        const users = await UserGroup.find({ group_id: groupId })
            .sort({ coins: -1 })
            .limit(10);
        return users.map(user => ({
            user_id: user.user_id,
            coins: user.coins || 0
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
        }));
    }

    public async getUserInGroup(userId: string, groupId: string): Promise<IUserGroup | null> {
        await this.ensureInitialized();
        return await UserGroup.findOne({ user_id: userId, group_id: groupId });
    }
}

const databaseManager = DatabaseManager.getInstance();
export default databaseManager; 