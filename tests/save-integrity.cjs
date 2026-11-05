// Testes de integridade do save (SAVE-003 e SAVE-007).
// Execução: node tests/save-integrity.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8790);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const SAVE_KEY = "tcc-mapinguari-save-v2";

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

function payload(overrides = {}) {
    return {
        version: 3,
        difficulty: "normal",
        sceneId: 1,
        eventIndex: 0,
        dialogueIndex: -1,
        sceneLog: [],
        journeyLog: [],
        visitedScenes: [1],
        investigation: { version: 1, clues: [], items: [], strategy: null, outcome: null },
        ...overrides,
    };
}

async function seed(page, data) {
    await page.evaluate(([key, value]) => localStorage.setItem(key, JSON.stringify(value)), [SAVE_KEY, data]);
}

// Restaura de forma síncrona e lê os índices logo em seguida (antes dos callbacks do máquina de escrever).
async function restoreAndRead(page, data) {
    await seed(page, data);
    return page.evaluate(() => {
        restoreSave();
        return { event: currentEventIndex, dialogue: currentDialogueIndex };
    });
}

async function runSave003(browser) {
    console.log("SAVE-003 — índices limitados ao intervalo da cena");
    const context = await browser.newContext();
    const page = await context.newPage();
    await openGame(page);

    const scene1 = await page.evaluate(() => ({
        eventos: roteiro.cenas[0].eventos.length,
        dialogos: roteiro.cenas[0].dialogos.length,
    }));

    let r = await restoreAndRead(page, payload({ eventIndex: 9999, dialogueIndex: 9999 }));
    check("dialogueIndex acima do limite é limitado ao último diálogo", r.dialogue === scene1.dialogos - 1, JSON.stringify(r));
    check("eventIndex acima do limite é limitado ao fim dos eventos", r.event === scene1.eventos, JSON.stringify(r));

    r = await restoreAndRead(page, payload({ eventIndex: -4, dialogueIndex: -5 }));
    check("dialogueIndex negativo vira -1", r.dialogue === -1, JSON.stringify(r));
    check("eventIndex negativo vira 0", r.event === 0, JSON.stringify(r));

    r = await restoreAndRead(page, payload({ eventIndex: 1, dialogueIndex: 2 }));
    check("índices válidos são preservados", r.event === 1 && r.dialogue === 2, JSON.stringify(r));

    r = await restoreAndRead(page, payload({ eventIndex: "2", dialogueIndex: "2" }));
    check("eventIndex numérico em string continua aceito (compatibilidade)", r.event === 2, JSON.stringify(r));
    check("dialogueIndex não inteiro (string) cai para -1", r.dialogue === -1, JSON.stringify(r));

    await context.close();
}

async function runSave007(browser) {
    console.log("SAVE-007 — confirmação antes de apagar o save");
    const context = await browser.newContext();
    const page = await context.newPage();
    let dialogAnswer = null;
    let dialogMessage = null;
    page.on("dialog", async dialog => {
        dialogMessage = dialog.message();
        if (dialogAnswer) await dialog.accept(); else await dialog.dismiss();
    });

    await openGame(page);
    await seed(page, payload({ sceneId: 1 }));

    // Cancelar: o save deve permanecer.
    dialogAnswer = false;
    await page.click("#btn-start");
    await page.click('.difficulty-btn[data-difficulty="easy"]');
    let stillSaved = await page.evaluate(k => localStorage.getItem(k) !== null, SAVE_KEY);
    let stillOnDifficulty = await page.evaluate(() => document.getElementById("difficulty-overlay").classList.contains("active"));
    check("confirmação foi exibida", dialogMessage !== null && dialogMessage.includes("apaga o progresso"), String(dialogMessage));
    check("cancelar mantém o save", stillSaved);
    check("cancelar permanece na escolha de dificuldade", stillOnDifficulty);

    // Confirmar: o save é apagado e o novo jogo começa.
    dialogAnswer = true;
    await page.click('.difficulty-btn[data-difficulty="easy"]');
    stillSaved = await page.evaluate(k => localStorage.getItem(k) !== null, SAVE_KEY);
    const started = await page.evaluate(() => document.getElementById("top-nav").style.display !== "none");
    check("confirmar apaga o save", !stillSaved);
    check("confirmar inicia o novo jogo", started);

    // Sem save existente: nenhuma confirmação deve aparecer.
    dialogMessage = null;
    await page.evaluate(() => { document.getElementById("difficulty-overlay").classList.add("active"); });
    await page.click('.difficulty-btn[data-difficulty="normal"]');
    check("sem save existente não há confirmação", dialogMessage === null, String(dialogMessage));

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
        await runSave003(browser);
        await runSave007(browser);
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
