import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ClockEntry, StorageData, UserData } from "./types.js";

/** データディレクトリのパス */
const DATA_DIR = resolve(process.env.DATA_DIR ?? "data");

/** ユーザーデータの JSON ファイルパス */
const DATA_FILE = resolve(DATA_DIR, "users.json");

/** データディレクトリが存在しない場合に作成します。 */
function ensureDataDir(): void {
    if (!existsSync(DATA_DIR)) {
        mkdirSync(DATA_DIR, { recursive: true });
    }
}

/**
 * ストレージ全体を読み込みます。
 * @returns ストレージデータ
 */
function readData(): StorageData {
    ensureDataDir();
    if (!existsSync(DATA_FILE)) {
        return {};
    }
    return JSON.parse(readFileSync(DATA_FILE, "utf-8")) as StorageData;
}

/**
 * ストレージ全体を書き込みます。
 * @param data 書き込むストレージデータ
 */
function writeData(data: StorageData): void {
    ensureDataDir();
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), "utf-8");
}

/**
 * ユーザーデータを取得します。
 * @param userId Discord ユーザー ID
 * @returns ユーザーデータ
 */
export function getUserData(userId: string): UserData {
    const data = readData();
    return data[userId] ?? { userId, entries: [] };
}

/**
 * ユーザーデータを保存します。
 * @param userData 保存するユーザーデータ
 */
export function saveUserData(userData: UserData): void {
    const data = readData();
    data[userData.userId] = userData;
    writeData(data);
}

/**
 * 打刻エントリーを追加します。
 * @param userId Discord ユーザー ID
 * @param entry 追加する打刻エントリー
 */
export function addEntry(userId: string, entry: ClockEntry): void {
    const userData = getUserData(userId);
    userData.entries.push(entry);
    userData.entries.sort((a, b) => a.timestamp - b.timestamp);
    saveUserData(userData);
}

/**
 * 打刻エントリーを更新します。
 * @param userId Discord ユーザー ID
 * @param entryId 更新するエントリーの ID
 * @param updates 更新内容
 * @returns 更新に成功したか
 */
export function updateEntry(
    userId: string,
    entryId: string,
    updates: Partial<ClockEntry>,
): boolean {
    const userData = getUserData(userId);
    const index = userData.entries.findIndex((e) => e.id === entryId);
    if (index === -1) return false;
    userData.entries[index] = { ...userData.entries[index], ...updates };
    saveUserData(userData);
    return true;
}

/**
 * 新しい打刻エントリーの ID を生成します。
 * @returns 一意なエントリー ID
 */
export function generateEntryId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
