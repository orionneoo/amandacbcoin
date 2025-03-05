export interface UserEconomy {
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

export interface Group {
    id: string;
    name: string;
    created_at: number;
    last_interaction: number;
    total_messages: number;
    active: boolean;
    member_count: number;
    admins: string;
    game_active: boolean;
}

export interface UserGroup {
    user_id: string;
    group_id: string;
    group_name: string;
    user_name: string;
    name_captured: boolean;
    phone_number: string;
    total_messages: number;
    joined_at: number;
    last_interaction: number;
    is_admin: boolean;
}

export interface DatabaseManager {
    getGroup(groupId: string): Promise<Group | null>;
    getUserInGroup(userId: string, groupId: string): Promise<UserGroup | null>;
    setGameActive(groupId: string, active: boolean): Promise<void>;
    isGameActive(groupId: string): Promise<boolean>;
    getUserEconomy(groupId: string, userId: string): Promise<UserEconomy | null>;
    updateUserEconomy(groupId: string, userId: string, data: Partial<UserEconomy>): Promise<void>;
    createUserEconomy(groupId: string, userId: string, data: UserEconomy): Promise<void>;
    getGroupEconomyRanking(groupId: string): Promise<Array<{ user_id: string; coins: number }>>;
} 