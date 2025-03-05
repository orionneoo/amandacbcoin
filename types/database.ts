export interface UserEconomy {
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