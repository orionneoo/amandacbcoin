import mongoose, { Schema, Document } from 'mongoose';

// Interface para o documento Group
export interface IGroup extends Document {
    id: string;
    name: string;
    created_at: Date;
    last_interaction: Date;
    total_messages: number;
    active: boolean;
    member_count: number;
    admins: string[];
    game_active: boolean;
}

// Interface para o documento UserGroup
export interface IUserGroup extends Document {
    user_id: string;
    user_name: string;
<<<<<<< HEAD
    name_captured: string | null;
    group_id: string;
    total_messages: number;
    message_count: number;
    last_message: Date;
    is_admin: boolean;
    joined_at: Date;
=======
    name_captured: boolean;
    phone_number: string;
    group_id: string;
    group_name: string;
    total_messages: number;
    joined_at: Date;
    last_interaction: Date;
    is_admin: boolean;
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
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
}

// Interface para o documento Message
export interface IMessage extends Document {
    id: string;
    user_id: string;
    group_id?: string;
    group_name?: string;
<<<<<<< HEAD
    message?: string;
=======
    message: string;
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    type: string;
    timestamp: Date;
    created_at: Date;
}

// Interface para o documento Settings
export interface ISettings extends Document {
    group_id: string;
    welcome_message?: string;
    auto_response: boolean;
    created_at: Date;
    updated_at: Date;
}

<<<<<<< HEAD
// Interface para o documento Economy
export interface IEconomy extends Document {
    group_id: string;
    user_id: string;
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

// Schema para economia (CbCoin)
const economySchema = new Schema({
    group_id: { type: String, required: true },
    group_name: { type: String, required: true },
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    coins: { type: Number, default: 0 },
    last_daily: { type: Number, default: null },
    mining_chances: { type: Number, default: 6 },
    steal_chances: { type: Number, default: 4 },
    avenge_chances: { type: Number, default: 2 },
    lend_chances: { type: Number, default: 2 },
    donate_chances: { type: Number, default: 2 },
    casino_chances: { type: Number, default: 6 },
    shield: { type: Boolean, default: false },
    lucky_charm: { type: Boolean, default: false },
    sniper_cooldown: { type: Number, default: null },
    lucky_cooldown: { type: Number, default: null }
}, {
    timestamps: true // Adiciona created_at e updated_at
});

// Índice composto para economia
economySchema.index({ group_id: 1, user_id: 1 }, { unique: true });

// Schema para grupos
const groupSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    member_count: { type: Number, default: 0 },
    admins: [String],
    total_messages: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    game_active: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    last_interaction: { type: Date, default: Date.now }
});

// Schema para relação usuários/grupos
const userGroupSchema = new Schema({
    user_id: { type: String, required: true },
    group_id: { type: String, required: true },
    user_name: { type: String, required: true },
    name_captured: { type: String, default: null },
    message_count: { type: Number, default: 0 },
    last_message: { type: Date, default: Date.now },
    is_admin: { type: Boolean, default: false },
    joined_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Índice composto para user_groups
userGroupSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

// Schema para mensagens
const messageSchema = new Schema({
=======
// Interface para o documento ModAction
export interface ModAction {
    _id?: string;
    type: 'warn' | 'ban' | 'kick' | 'mute' | 'punishment';
    userId: string;
    groupId: string;
    reason: string;
    moderatorId: string;
    timestamp: Date;
    duration?: number;
}

// Schema do Group
const GroupSchema = new Schema<IGroup>({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    last_interaction: { type: Date, default: Date.now },
    total_messages: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    member_count: { type: Number, default: 0 },
    admins: [String],
    game_active: { type: Boolean, default: false }
});

// Schema do UserGroup
const UserGroupSchema = new Schema<IUserGroup>({
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    name_captured: { type: Boolean, default: false },
    phone_number: { type: String, required: true },
    group_id: { type: String, required: true },
    group_name: { type: String, required: true },
    total_messages: { type: Number, default: 0 },
    joined_at: { type: Date, default: Date.now },
    last_interaction: { type: Date, default: Date.now },
    is_admin: { type: Boolean, default: false },
    coins: { type: Number, default: 0 },
    last_daily: { type: Number, default: 0 },
    mining_chances: { type: Number, default: 0 },
    steal_chances: { type: Number, default: 0 },
    avenge_chances: { type: Number, default: 0 },
    lend_chances: { type: Number, default: 0 },
    donate_chances: { type: Number, default: 0 },
    casino_chances: { type: Number, default: 0 },
    shield: { type: Boolean, default: false },
    lucky_charm: { type: Boolean, default: false }
});

// Índice composto para user_id e group_id
UserGroupSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

// Schema da Message
const MessageSchema = new Schema<IMessage>({
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    group_id: String,
    group_name: String,
<<<<<<< HEAD
    message: String,
=======
    message: { type: String, required: true },
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

<<<<<<< HEAD
// Schema para configurações
const settingsSchema = new Schema({
    group_id: { type: String, required: true, unique: true },
    welcome_message: String,
    auto_response: { type: Boolean, default: true },
=======
// Schema das Settings
const SettingsSchema = new Schema<ISettings>({
    group_id: { type: String, required: true, unique: true },
    welcome_message: String,
    auto_response: { type: Boolean, default: false },
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

<<<<<<< HEAD
// Schema para ações de moderação
const modActionSchema = new Schema({
    type: { 
        type: String, 
        required: true,
        enum: ['warn', 'ban', 'kick', 'mute', 'punishment']
    },
    userId: { type: String, required: true },
    groupId: { type: String, required: true },
    reason: String,
    moderatorId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    duration: Number
});

// Exporta os modelos
export const Economy = mongoose.model('Economy', economySchema);
export const Group = mongoose.model('Group', groupSchema);
export const UserGroup = mongoose.model('UserGroup', userGroupSchema);
export const Message = mongoose.model<IMessage>('Message', messageSchema);
export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export const ModAction = mongoose.model<IModAction>('ModAction', modActionSchema);

// Interfaces para TypeScript
export interface IEconomy extends Document {
    group_id: string;
    user_id: string;
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

export interface IGroup extends Document {
    id: string;
    name: string;
    member_count: number;
    admins: string[];
    total_messages: number;
    active: boolean;
    game_active: boolean;
    created_at: Date;
    last_interaction: Date;
}

export interface IUserGroup extends Document {
    user_id: string;
    group_id: string;
    user_name: string;
    name_captured: string | null;
    message_count: number;
    last_message: Date;
    is_admin: boolean;
    joined_at: Date;
}

export interface IMessage extends Document {
    id: string;
    user_id: string;
    group_id?: string;
    group_name?: string;
    message?: string;
    type: string;
    timestamp: Date;
    created_at: Date;
}

export interface ISettings extends Document {
    group_id: string;
    welcome_message?: string;
    auto_response: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IModAction extends Document {
    type: 'warn' | 'ban' | 'kick' | 'mute' | 'punishment';
    userId: string;
    groupId: string;
    reason?: string;
    moderatorId: string;
    timestamp: Date;
    duration?: number;
} 
=======
// Schema do ModAction
const modActionSchema = new Schema<ModAction>({
    type: { type: String, required: true, enum: ['warn', 'ban', 'kick', 'mute', 'punishment'] },
    userId: { type: String, required: true },
    groupId: { type: String, required: true },
    reason: { type: String, required: true },
    moderatorId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    duration: { type: Number }
});

// Modelos
export const Group = mongoose.model<IGroup>('Group', GroupSchema);
export const UserGroup = mongoose.model<IUserGroup>('UserGroup', UserGroupSchema);
export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);
export const ModAction = mongoose.model<ModAction>('ModAction', modActionSchema); 
>>>>>>> ff2530683e39c10cacf0f2adeefb6771459bca2b
