/** JST オフセット (ミリ秒) */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST の日付コンポーネント */
interface JSTComponents {
    /** 年 */
    year: number;
    /** 月 (0始まり) */
    month: number;
    /** 日 */
    day: number;
    /** 曜日 (0=日, 1=月, ..., 6=土) */
    weekday: number;
    /** 時 */
    hours: number;
    /** 分 */
    minutes: number;
}

/**
 * UTC ミリ秒から JST の日付コンポーネントを取得します。
 * @param utcMs UTC ミリ秒
 * @returns JST の日付コンポーネント
 */
export function getJSTComponents(utcMs: number): JSTComponents {
    const d = new Date(utcMs + JST_OFFSET_MS);
    return {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth(),
        day: d.getUTCDate(),
        weekday: d.getUTCDay(),
        hours: d.getUTCHours(),
        minutes: d.getUTCMinutes(),
    };
}

/**
 * UTC ミリ秒から JST の日付の開始時刻 (UTC ミリ秒) を返します。
 * @param utcMs 基準となる UTC ミリ秒
 * @returns JST 0:00:00 の UTC ミリ秒
 */
export function startOfJSTDay(utcMs: number): number {
    const { year, month, day } = getJSTComponents(utcMs);
    return Date.UTC(year, month, day, 0, 0, 0, 0) - JST_OFFSET_MS;
}

/**
 * UTC ミリ秒から JST の週 (月曜始まり) の開始時刻 (UTC ミリ秒) を返します。
 * @param utcMs 基準となる UTC ミリ秒
 * @returns JST の週の月曜 0:00:00 の UTC ミリ秒
 */
export function startOfJSTWeek(utcMs: number): number {
    const { year, month, day, weekday } = getJSTComponents(utcMs);
    // 月曜を週の先頭とする (0=日 → 6日前にずらす, 1=月 → 0日前, ...)
    const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
    return Date.UTC(year, month, day - daysFromMonday, 0, 0, 0, 0) - JST_OFFSET_MS;
}

/**
 * UTC ミリ秒から JST の月の開始時刻 (UTC ミリ秒) を返します。
 * @param utcMs 基準となる UTC ミリ秒
 * @returns JST の月初 0:00:00 の UTC ミリ秒
 */
export function startOfJSTMonth(utcMs: number): number {
    const { year, month } = getJSTComponents(utcMs);
    return Date.UTC(year, month, 1, 0, 0, 0, 0) - JST_OFFSET_MS;
}

/**
 * ミリ秒を「X時間Y分」の形式にフォーマットします。
 * @param ms ミリ秒
 * @returns フォーマットされた勤務時間文字列
 */
export function formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}分`;
    if (minutes === 0) return `${hours}時間`;
    return `${hours}時間${minutes}分`;
}

/**
 * UTC ミリ秒を JST の「HH:mm」形式にフォーマットします。
 * @param utcMs UTC ミリ秒
 * @returns JST の時刻文字列
 */
export function formatJSTTime(utcMs: number): string {
    const { hours, minutes } = getJSTComponents(utcMs);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * UTC ミリ秒を JST の「MM/DD」形式にフォーマットします。
 * @param utcMs UTC ミリ秒
 * @returns JST の日付文字列
 */
export function formatJSTDate(utcMs: number): string {
    const { month, day } = getJSTComponents(utcMs);
    return `${month + 1}/${String(day).padStart(2, "0")}`;
}

/**
 * UTC ミリ秒を JST の「YYYY/MM/DD HH:mm」形式にフォーマットします。
 * @param utcMs UTC ミリ秒
 * @returns JST の日時文字列
 */
export function formatJSTDateTime(utcMs: number): string {
    const { year, month, day, hours, minutes } = getJSTComponents(utcMs);
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const h = String(hours).padStart(2, "0");
    const min = String(minutes).padStart(2, "0");
    return `${year}/${m}/${d} ${h}:${min}`;
}

/**
 * UTC ミリ秒を JST の「MM/DD HH:mm」形式にフォーマットします。
 * @param utcMs UTC ミリ秒
 * @returns JST の短縮日時文字列
 */
export function formatJSTShortDateTime(utcMs: number): string {
    const { month, day, hours, minutes } = getJSTComponents(utcMs);
    const m = String(month + 1);
    const d = String(day).padStart(2, "0");
    const h = String(hours).padStart(2, "0");
    const min = String(minutes).padStart(2, "0");
    return `${m}/${d} ${h}:${min}`;
}

/**
 * 「HH:mm」形式の JST 時刻文字列を、基準日の JST 日付に当てはめた UTC ミリ秒に変換します。
 *
 * @param timeStr 「HH:mm」形式の時刻文字列
 * @param baseDateUtcMs 基準となる UTC ミリ秒 (この日付の JST 日付を使用する)
 * @returns UTC ミリ秒、または不正な形式の場合は `null`
 */
export function parseJSTTimeOnDate(timeStr: string, baseDateUtcMs: number): number | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
    if (match === null) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;

    const { year, month, day } = getJSTComponents(baseDateUtcMs);
    return Date.UTC(year, month, day, hours, minutes, 0, 0) - JST_OFFSET_MS;
}
