// Testes de exibição: velocidade do texto (com persistência), tela cheia e controles de toque.
// Execução: node tests/display.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8805);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const TEXT_SPEED_KEY = "tcc-mapinguari-text-speed";

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
            const res = await fetch(BASE);
            if (res.ok) return;
        } catch (_) { /* aguarda */ }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error("Servidor local não respondeu.");
}

async function openGame(page) {
    await page.goto(BASE);
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
}

async function startNewGame(page) {
    await page.click("#btn-start");
    await page.click('.difficulty-btn[data-difficulty="normal"]');
    await page.waitForSelector("#top-nav", { state: "visible" });
}

// Mede quanto tempo o máquina de escrever leva para exibir um texto fixo, na velocidade atual.
async function typingDuration(page) {
    return page.evaluate(() => new Promise(resolve => {
        const element = document.createElement("p");
        document.body.appendChild(element);
        const text = "x".repeat(120);
        const started = performance.now();
        startTypewriter(text, element, () => {
            resolve({ ms: performance.now() - started, shown: element.textContent.length });
            element.remove();
        });
    }));
}

async function runTextSpeed(browser) {
    console.log("TEXTO — velocidade alternável e persistente");
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await openGame(page);

    // A barra superior só aparece durante a partida.
    await startNewGame(page);
    const label = () => page.textContent("#btn-text-speed");
    check("velocidade padrão é normal", (await label()) === "Texto: normal");

    const normal = await typingDuration(page);
    check("texto normal exibe o conteúdo inteiro", normal.shown === 120, String(normal.shown));

    await page.click("#btn-text-speed");
    check("clique muda para rápido", (await label()) === "Texto: rápido");
    check("preferência é gravada", (await page.evaluate(k => localStorage.getItem(k), TEXT_SPEED_KEY)) === "fast");

    const fast = await typingDuration(page);
    check("texto rápido exibe o conteúdo inteiro", fast.shown === 120, String(fast.shown));
    check("texto rápido é mais rápido que o normal", fast.ms < normal.ms * 0.6, `normal=${Math.round(normal.ms)}ms rápido=${Math.round(fast.ms)}ms`);

    await page.reload();
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
    await startNewGame(page);
    check("preferência sobrevive a recarregar a página", (await label()) === "Texto: rápido");

    await page.click("#btn-text-speed");
    check("clique volta para normal", (await label()) === "Texto: normal");

    check("nenhum erro de página", errors.length === 0, JSON.stringify(errors));
    await context.close();
}

async function runFullscreen(browser) {
    console.log("TELA CHEIA — botão presente e tolerante a recusa do navegador");
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await openGame(page);
    await startNewGame(page);

    const enabled = await page.evaluate(() => document.fullscreenEnabled);
    const hidden = await page.$eval("#btn-fullscreen", b => b.hidden);
    check("botão de tela cheia segue a disponibilidade do navegador", hidden === !enabled, `enabled=${enabled} hidden=${hidden}`);

    if (enabled) {
        await page.click("#btn-fullscreen");
        await page.waitForTimeout(300);
        await page.click("#btn-fullscreen");
        await page.waitForTimeout(300);
    }
    check("alternar tela cheia não gera erro de página", errors.length === 0, JSON.stringify(errors));
    await context.close();
}

async function runTouch(browser) {
    console.log("TOQUE — controles aparecem em dispositivo de toque e acionam o jogo");
    const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 780 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await openGame(page);

    const coarse = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
    const controlsHidden = await page.$eval("#touch-controls", el => el.hidden);
    check("ponteiro grosso é detectado no emulador", coarse, String(coarse));
    check("controles de toque ficam visíveis em ponteiro grosso", coarse === !controlsHidden, `coarse=${coarse} hidden=${controlsHidden}`);

    await page.click("#btn-start");
    await page.click('.difficulty-btn[data-difficulty="normal"]');
    await page.waitForTimeout(300);
    await page.click("#btn-touch-interact").catch(() => {});
    await page.click("#btn-touch-jump").catch(() => {});
    check("botões de toque não geram erro de página", errors.length === 0, JSON.stringify(errors));
    await context.close();
}

(async () => {
    const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", ROOT], {
        stdio: "ignore",
    });
    let browser;
    try {
        await waitForServer();
        browser = await chromium.launch();
        await runTextSpeed(browser);
        await runFullscreen(browser);
        await runTouch(browser);
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
