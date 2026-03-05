import type { ClockEntry, WorktimeResult } from "../types.js";

/**
 * 打刻エントリー一覧から出退勤ペアを構成し、指定期間内の勤務時間を計算します。
 * @param allEntries ユーザーの全打刻エントリー (timestamp 昇順)
 * @param periodStart 集計期間の開始 (UTC ミリ秒, 含む)
 * @param periodEnd 集計期間の終了 (UTC ミリ秒, 含まない)
 * @returns 勤務時間の集計結果
 */
export function calcWorktime(
    allEntries: ClockEntry[],
    periodStart: number,
    periodEnd: number,
): WorktimeResult {
    // 全エントリーから出退勤ペアを構成する
    const pairs: WorktimeResult["pairs"] = [];
    let pendingIn: ClockEntry | null = null;

    for (const entry of allEntries) {
        if (entry.type === "in") {
            // 前の出勤が未退勤のままなら単独ペアとして確定
            if (pendingIn !== null) {
                pairs.push({ clockIn: pendingIn, clockOut: null });
            }
            pendingIn = entry;
        } else {
            if (pendingIn !== null) {
                pairs.push({ clockIn: pendingIn, clockOut: entry });
                pendingIn = null;
            }
            // pendingIn が null の場合は孤立した退勤 → スキップ
        }
    }
    // 最後の出勤が未退勤の場合
    if (pendingIn !== null) {
        pairs.push({ clockIn: pendingIn, clockOut: null });
    }

    // 期間内のペアを絞り込む
    // ペアの出勤時刻が期間内に含まれるものを対象とする
    const periodPairs = pairs.filter(
        (p) => p.clockIn.timestamp >= periodStart && p.clockIn.timestamp < periodEnd,
    );

    let totalMs = 0;
    let hasCorrections = false;

    for (const pair of periodPairs) {
        if (pair.clockIn.correctedAt !== undefined) hasCorrections = true;
        if (pair.clockOut !== null) {
            if (pair.clockOut.correctedAt !== undefined) hasCorrections = true;
            totalMs += pair.clockOut.timestamp - pair.clockIn.timestamp;
        }
    }

    return { totalMs, pairs: periodPairs, hasCorrections };
}
