import { WAMessage } from '@whiskeysockets/baileys';

export interface CommandResponse {
    text: string;
    mentions?: string[];
}

export interface Stats {
    name: string;
    total_messages: number;
    messages_last_24h: number;
    created_at: Date;
    last_interaction: Date;
    unique_users?: number;
    groups_active?: number;
}

export interface GroupSettings {
    welcome_message?: string;
    auto_response?: boolean;
    updated_at: Date;
} 