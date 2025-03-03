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
}

// Interface para o documento Message
export interface IMessage extends Document {
    id: string;
    user_id: string;
    group_id?: string;
    group_name?: string;
    message: string;
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
    id: { type: String, required: true, unique: true },
    user_id: { type: String, required: true },
    group_id: String,
    group_name: String,
    message: { type: String, required: true },
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now }
});

// Schema das Settings
const SettingsSchema = new Schema<ISettings>({
    group_id: { type: String, required: true, unique: true },
    welcome_message: String,
    auto_response: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

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