// Testa preferências e disponibilidade do módulo de áudio procedural.
// Execução: node tests/audio.cjs
// Requer Chromium, Playwright e python3.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8799);
const BASE = `http://127.0.0.1:${PORT}/index.html`;

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
    if (condition) {
        passed++;
        console.log(`  ok   ${name}`);
    } else {
        failed++;
        console.log(`  FAIL ${name} ${detail}`);
    }
}

async function waitForServer() {
    for (let i = 0; i < 50; i++) {
        try {
            const response = await fetch(BASE);
            if (response.ok) return;
        } catch (_) { /* aguarda o servidor iniciar */ }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Servidor local não respondeu.");
}

(async () => {
    const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", ROOT], {
        stdio: "ignore",
    });
    let browser;
    try {
        await waitForServer();
        browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(BASE);
        await page.waitForFunction(() => typeof window.GameAudio?.play === "function");

        let state = await page.locator("#btn-audio").evaluate(button => ({
            text: button.textContent,
            pressed: button.getAttribute("aria-pressed"),
        }));
        check("áudio começa habilitado por padrão", state.pressed === "true" && state.text.includes("ligado"), JSON.stringify(state));

        await page.click("#btn-audio");
        state = await page.locator("#btn-audio").evaluate(button => ({
            text: button.textContent,
            pressed: button.getAttribute("aria-pressed"),
            preference: localStorage.getItem("heranca-maldita-audio-enabled-v1"),
        }));
        check("controle desativa o áudio", state.pressed === "false" && state.text.includes("desligado"), JSON.stringify(state));
        check("preferência desligada é persistida", state.preference === "false", JSON.stringify(state));

        const silentCall = await page.evaluate(() => {
            try { window.GameAudio.play("pickup"); return true; }
            catch (_) { return false; }
        });
        check("efeito pode ser chamado sem áudio habilitado", silentCall);

        await page.click("#btn-audio");
        state = await page.locator("#btn-audio").evaluate(button => ({
            pressed: button.getAttribute("aria-pressed"),
            preference: localStorage.getItem("heranca-maldita-audio-enabled-v1"),
        }));
        check("controle reativa o áudio", state.pressed === "true" && state.preference === "true", JSON.stringify(state));
    } catch (error) {
        failed++;
        console.log(`  ERRO ${error.message}`);
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
    console.log(`\nResultado: ${passed} aprovado(s), ${failed} reprovado(s).`);
    process.exit(failed === 0 ? 0 : 1);
})();
