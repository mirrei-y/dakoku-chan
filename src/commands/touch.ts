import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import { addEntry, generateEntryId, getUserData } from "../storage.js";
import type { CommandHandler } from "../types.js";
import { formatJSTDateTime } from "../utils/date.js";

/** `/touch` コマンドのハンドラー */
export const touchCommand: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("touch")
        .setDescription("打刻します。直前の状態に応じて出勤・退勤を自動判定します。")
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("打刻理由 (任意)")
                .setRequired(false),
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const reason = interaction.options.getString("reason") ?? undefined;
        const now = Date.now();

        const userData = getUserData(userId);
        const sortedEntries = [...userData.entries].sort((a, b) => a.timestamp - b.timestamp);
        const lastEntry = sortedEntries.at(-1);

        // 直前のエントリーが "in" なら退勤、それ以外 (未打刻 or "out") なら出勤
        const type = lastEntry?.type === "in" ? "out" : "in";
        const label = type === "in" ? "出勤" : "退勤";

        addEntry(userId, {
            id: generateEntryId(),
            type,
            timestamp: now,
            reason,
        });

        const timeStr = formatJSTDateTime(now);
        const reasonLine = reason ? `\n> 理由: ${reason}` : "";
        await interaction.editReply(`✅ **${label}** を打刻しました。\n> ${timeStr}${reasonLine}`);
    },
};
