// @ts-check
import { build } from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    outfile: "dist/dakoku-chan.mjs",
    format: "esm",
    platform: "node",
    target: "node24",
    sourcemap: false,
    logLevel: "info",
    banner: {
        js: [
            `import { createRequire } from "node:module";`,
            `import { fileURLToPath } from "node:url";`,
            `import { dirname } from "node:path";`,
            `const require = createRequire(import.meta.url);`,
            `const __filename = fileURLToPath(import.meta.url);`,
            `const __dirname = dirname(__filename);`,
        ].join("\n"),
    },
});
