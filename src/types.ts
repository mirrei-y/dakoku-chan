import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";

/** 打刻種別 */
export type ClockType = "in" | "out";

/** 打刻エントリー */
export interface ClockEntry {
    /** エントリーの一意なID */
    id: string;
    /** 打刻種別 (出勤 or 退勤) */
    type: ClockType;
    /** 打刻時刻 (UTC ミリ秒) */
    timestamp: number;
    /** 打刻理由 */
    reason?: string;
    /** 修正日時 (UTC ミリ秒) - 修正された場合にセット */
    correctedAt?: number;
}

/** ユーザーごとの打刻データ */
export interface UserData {
    /** Discord ユーザー ID */
    userId: string;
    /** 打刻エントリーの一覧 (timestamp 昇順) */
    entries: ClockEntry[];
}

/** JSON ストレージ全体の型 */
export type StorageData = Record<string, UserData>;

/** コマンドハンドラーのインターフェース */
export interface CommandHandler {
    /** スラッシュコマンド定義 */
    data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
    /**
     * コマンドを実行します。
     * @param interaction コマンドのインタラクション
     */
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    /**
     * オートコンプリートを処理します。
     * @param interaction オートコンプリートのインタラクション
     */
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

/** 勤務時間の集計結果 */
export interface WorktimeResult {
    /** 合計勤務時間 (ミリ秒) */
    totalMs: number;
    /** 出退勤のペア一覧 */
    pairs: Array<{ clockIn: ClockEntry; clockOut: ClockEntry | null }>;
    /** 修正済みエントリーが含まれるか */
    hasCorrections: boolean;
}
