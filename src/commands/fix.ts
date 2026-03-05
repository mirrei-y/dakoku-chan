import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import { getUserData, updateEntry } from "../storage.js";
import type { CommandHandler } from "../types.js";
import { formatJSTDateTime } from "../utils/date.js";

/** オートコンプリートで表示するエントリーの最大件数 */
const AUTOCOMPLETE_MAX = 25;

/** `/touch_fix` コマンドのハンドラー */
export const touchFixCommand: CommandHandler = {
    data: new SlashCommandBuilder()
        .setName("touch_fix")
        .setDescription("打刻を修正します。打刻を選択して理由を設定できます。")
        .addStringOption((option) =>
            option
                .setName("entry")
                .setDescription("修正する打刻を選択してください")
                .setRequired(true)
                .setAutocomplete(true),
        )
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("新しい打刻理由 (空にすると理由を削除します)")
                .setRequired(false),
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const userId = interaction.user.id;
        const entryId = interaction.options.getString("entry", true);
        // reason が未指定なら undefined、指定されていれば文字列 (空文字で削除)
        const reasonRaw = interaction.options.getString("reason");
        const reason = reasonRaw != null && reasonRaw.trim() !== "" ? reasonRaw.trim() : undefined;

        const userData = getUserData(userId);
        const target = userData.entries.find((e) => e.id === entryId);
        if (target === undefined) {
            await interaction.editReply("❌ 指定された打刻が見つかりませんでした。");
            return;
        }

        const success = updateEntry(userId, entryId, {
            reason,
            correctedAt: Date.now(),
        });

        if (!success) {
            await interaction.editReply("❌ 打刻の修正に失敗しました。");
            return;
        }

        const label = target.type === "in" ? "出勤" : "退勤";
        const timeStr = formatJSTDateTime(target.timestamp);
        const reasonLine = reason
            ? `\n> 新しい理由: ${reason}`
            : "\n> 理由を削除しました。";
        await interaction.editReply(
            `✏️ **${label}** (${timeStr}) を修正しました。${reasonLine}`,
        );
    },

    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const userId = interaction.user.id;
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const userData = getUserData(userId);

        // 新しい順に並べてオートコンプリート候補を生成
        const sorted = [...userData.entries].sort((a, b) => b.timestamp - a.timestamp);

        const choices = sorted
            .map((entry) => {
                const label = entry.type === "in" ? "出勤" : "退勤";
                const editMark = entry.correctedAt !== undefined ? " ✏️" : "";
                const reasonPart = entry.reason ? ` (${entry.reason})` : "";
                const name = `[${label}${editMark}] ${formatJSTDateTime(entry.timestamp)}${reasonPart}`;
                return { name, value: entry.id };
            })
            .filter(
                (c) =>
                    focusedValue === "" ||
                    c.name.toLowerCase().includes(focusedValue),
            )
            .slice(0, AUTOCOMPLETE_MAX);

        await interaction.respond(choices);
    },
};
