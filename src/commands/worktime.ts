import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { getUserData } from "../storage.js";
import type { CommandHandler, WorktimeResult } from "../types.js";
import {
    formatDuration,
    formatJSTDate,
    formatJSTDateTime,
    formatJSTShortDateTime,
    formatJSTTime,
    startOfJSTDay,
    startOfJSTMonth,
    startOfJSTWeek,
} from "../utils/date.js";
import { calcWorktime } from "../utils/worktime.js";

/** 期間の定義 */
interface Period {
    /** 期間ラベル */
    label: string;
    /** 開始時刻 (UTC ミリ秒) */
    start: number;
    /** 終了時刻 (UTC ミリ秒) */
    end: number;
    /** 打刻に日付を表示するか */
    showDate: boolean;
}

/**
 * 現在時刻から集計対象期間の一覧を生成します。
 * @param now 現在の UTC ミリ秒
 * @returns 期間の一覧 (今日・今週・先週・今月・先月)
 */
function buildPeriods(now: number): Period[] {
    const todayStart = startOfJSTDay(now);
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const thisWeekStart = startOfJSTWeek(now);
    const thisWeekEnd = thisWeekStart + 7 * 24 * 60 * 60 * 1000;

    const lastWeekStart = thisWeekStart - 7 * 24 * 60 * 60 * 1000;
    const lastWeekEnd = thisWeekStart;

    const thisMonthStart = startOfJSTMonth(now);
    // 翌月の初日を終了とする
    const nextMonthStart = startOfJSTMonth(thisMonthStart + 32 * 24 * 60 * 60 * 1000);

    // thisMonthStart は月初 0:00 のため 1ms 引くと前月末になる
    const lastMonthStart = startOfJSTMonth(thisMonthStart - 1);

    return [
        {
            label: `今日 (${formatJSTDate(now)})`,
            start: todayStart,
            end: todayEnd,
            showDate: false,
        },
        {
            label: `今週 (${formatJSTDate(thisWeekStart)} 〜 ${formatJSTDate(thisWeekEnd - 1)})`,
            start: thisWeekStart,
            end: thisWeekEnd,
            showDate: true,
        },
        {
            label: `先週 (${formatJSTDate(lastWeekStart)} 〜 ${formatJSTDate(lastWeekEnd - 1)})`,
            start: lastWeekStart,
            end: lastWeekEnd,
            showDate: true,
        },
        {
            label: `今月 (${formatJSTDate(thisMonthStart)} 〜)`,
            start: thisMonthStart,
            end: nextMonthStart,
            showDate: true,
        },
        {
            label: `先月 (${formatJSTDate(lastMonthStart)} 〜 ${formatJSTDate(thisMonthStart - 1)})`,
            start: lastMonthStart,
            end: thisMonthStart,
            showDate: true,
        },
    ];
}

/**
 * 期間の集計結果をフィールドの値テキストに変換します。
 * @param result 集計結果
 * @param now 現在の UTC ミリ秒
 * @param showDate 打刻に日付 (MM/DD) を表示するか
 * @returns 表示用テキスト
 */
function buildFieldValue(result: WorktimeResult, now: number, showDate: boolean): string {
    if (result.pairs.length === 0) {
        return "打刻なし";
    }

    const formatTime = showDate ? formatJSTShortDateTime : formatJSTTime;

    const lines: string[] = [];

    lines.push(`合計: **${formatDuration(result.totalMs)}**`);

    for (const pair of result.pairs) {
        const inTime = formatTime(pair.clockIn.timestamp);
        const inEdit = pair.clockIn.correctedAt !== undefined ? " ✏️" : "";
        const inReason = pair.clockIn.reason ? ` (${pair.clockIn.reason})` : "";

        if (pair.clockOut === null) {
            // 退勤未打刻 (勤務中)
            const elapsed = now - pair.clockIn.timestamp;
            lines.push(
                `出勤${inEdit}: ${inTime}${inReason} → **勤務中** (${formatDuration(elapsed)})`,
            );
        } else {
            const outTime = formatTime(pair.clockOut.timestamp);
            const outEdit = pair.clockOut.correctedAt !== undefined ? " ✏️" : "";
            const outReason = pair.clockOut.reason ? ` (${pair.clockOut.reason})` : "";
            const duration = pair.clockOut.timestamp - pair.clockIn.timestamp;
            lines.push(
                `出勤${inEdit}: ${inTime}${inReason} → 退勤${outEdit}: ${outTime}${outReason} | **${formatDuration(duration)}**`,
            );
        }
    }

    if (result.hasCorrections) {
        lines.push("※ ✏️ は修正済みの打刻です。");
    }

    return lines.join("\n");
}

/** `/worktime` コマンドのハンドラー */
export const worktimeCommand: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("worktime")
        .setDescription("打刻データから勤務時間を今日・今週・先週・今月・先月で表示します。"),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const now = Date.now();
        const userData = getUserData(userId);
        const periods = buildPeriods(now);

        const embed = new EmbedBuilder()
            .setTitle("📊 勤務時間レポート")
            .setColor(0x5865f2)
            .setFooter({ text: `集計日時: ${formatJSTDateTime(now)} JST` });

        for (const period of periods) {
            const result = calcWorktime(userData.entries, period.start, period.end);
            embed.addFields({
                name: period.label,
                value: buildFieldValue(result, now, period.showDate),
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },
};
