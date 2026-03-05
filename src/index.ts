import {
    Client,
    Events,
    GatewayIntentBits,
    MessageFlags,
    REST,
    Routes,
} from "discord.js";
import type { Interaction } from "discord.js";
import { touchFixCommand } from "./commands/fix.js";
import { touchCommand } from "./commands/touch.js";
import { worktimeCommand } from "./commands/worktime.js";
import type { CommandHandler } from "./types.js";

/** 登録するコマンドの一覧 */
const COMMANDS: CommandHandler[] = [touchCommand, touchFixCommand, worktimeCommand];

/** コマンド名からハンドラーへのマップ */
const commandMap = new Map<string, CommandHandler>(
    COMMANDS.map((cmd) => [cmd.data.name, cmd]),
);

/** Discord Bot クライアント */
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ ログイン: ${c.user.tag}`);

    const token = process.env.DISCORD_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (token == null || clientId == null) {
        console.error("❌ DISCORD_TOKEN または DISCORD_CLIENT_ID が設定されていません。");
        process.exit(1);
    }

    const rest = new REST().setToken(token);
    const commandBody = COMMANDS.map((cmd) => cmd.data.toJSON());

    try {
        // グローバルコマンドとして登録 (反映まで最大1時間)
        await rest.put(Routes.applicationCommands(clientId), {
            body: commandBody,
        });
        console.log("✅ グローバルコマンドを登録しました。");
    } catch (err) {
        console.error("❌ コマンド登録に失敗しました:", err);
    }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isChatInputCommand()) {
        const handler = commandMap.get(interaction.commandName);
        if (handler == null) return;
        try {
            await handler.execute(interaction);
        } catch (err) {
            console.error(`コマンド実行エラー [${interaction.commandName}]:`, err);
            const message = "❌ コマンドの実行中にエラーが発生しました。";
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(message).catch(() => undefined);
            } else {
                await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => undefined);
            }
        }
        return;
    }

    if (interaction.isAutocomplete()) {
        const handler = commandMap.get(interaction.commandName);
        if (handler?.autocomplete == null) return;
        try {
            await handler.autocomplete(interaction);
        } catch (err) {
            console.error(`オートコンプリートエラー [${interaction.commandName}]:`, err);
            await interaction.respond([]).catch(() => undefined);
        }
    }
});

const token = process.env.DISCORD_TOKEN;
if (token == null) {
    console.error("❌ DISCORD_TOKEN 環境変数が設定されていません。");
    process.exit(1);
}

client.login(token).catch((err) => {
    console.error("❌ ログインに失敗しました:", err);
    process.exit(1);
});
