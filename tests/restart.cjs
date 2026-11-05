// Testes de reinício (TEST-005): reiniciar após derrota, fuga, vitória e pelo botão do menu
// não pode herdar investigação, progresso salvo, histórico ou pontos de exploração.
// Execução: node tests/restart.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8793);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const SAVE_KEY = "tcc-mapinguari-save-v2";
const SCENE_7_INDEX = 6; // índice da cena id 7 (trilha da perseguição), com pista "blood"

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
    page.on("dialog", dialog => dialog.accept());
}

// Simula uma partida em andamento: pistas, itens, estratégia, histórico e um save gravado.
async function playPartialRun(page) {
    await page.evaluate(idx => {
        hideMenus(); // partida já iniciada: o menu de título não está mais aberto
        loadScene(idx, false);
        Investigation.addClue("blood");
        Investigation.addItem("thorn_branch");
        Investigation.addItem("improvised_grenade");
        Investigation.chooseStrategy(0);
        window.refreshExplorationState?.();
        saveGame();
    }, SCENE_7_INDEX);
}

async function snapshot(page) {
    return page.evaluate(k => ({
        investigation: Investigation.getState(),
        hasSave: localStorage.getItem(k) !== null,
        sceneIndex: currentSceneIndex,
        journeyScenes: journeyLog.map(entry => entry.sceneId),
        visited: visitedScenes.size,
        topNavVisible: document.getElementById("top-nav").style.display !== "none",
    }), SAVE_KEY);
}

function assertFreshGame(label, s) {
    const inv = s.investigation;
    check(`${label}: investigação zerada`, inv.clues.length === 0 && inv.items.length === 0, JSON.stringify(inv));
    check(`${label}: estratégia e resultado zerados`, inv.strategy === null && inv.outcome === null, JSON.stringify(inv));
    check(`${label}: save removido`, s.hasSave === false);
    check(`${label}: volta à cena 1`, s.sceneIndex === 0, String(s.sceneIndex));
    // O histórico pode conter apenas a abertura da cena 1 da nova partida, nada da anterior.
    check(`${label}: histórico contém só a cena 1 nova`, s.journeyScenes.every(id => id === 1), JSON.stringify(s.journeyScenes));
    check(`${label}: cenas visitadas recomeçam`, s.visited === 1, String(s.visited));
}

async function runEndingRestarts(browser) {
    console.log("TEST-005 — reinício após derrota, fuga, vitória e menu");
    const cases = [
        ["reinício após derrota", "showGameOver()", "#btn-restart-gameover"],
        ["reinício após fuga", "showEscapeEnding()", "#btn-restart-escape"],
        ["reinício após vitória", "showEnding()", "#btn-restart-ending"],
    ];
    for (const [label, endingCall, button] of cases) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await openGame(page);
        await playPartialRun(page);
        await page.evaluate(call => eval(call), endingCall);
        await page.click(button);
        assertFreshGame(label, await snapshot(page));
        await context.close();
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    await openGame(page);
    await playPartialRun(page);
    await page.evaluate(() => hideMenus());
    await page.click("#btn-restart");
    assertFreshGame("reinício pelo menu (botão Reiniciar)", await snapshot(page));
    await context.close();
}

async function runExplorationAfterRestart(browser) {
    console.log("TEST-005 — pontos de exploração após reinício");
    const context = await browser.newContext();
    const page = await context.newPage();
    await openGame(page);

    const countBlood = () => page.evaluate(() => document.querySelectorAll(".interaction-point.discovery-point").length);

    await page.evaluate(idx => loadScene(idx, false), SCENE_7_INDEX);
    const before = await countBlood();

    await page.evaluate(() => {
        Investigation.addClue("blood");
        window.refreshExplorationState?.();
    });
    const afterCollect = await countBlood();
    check("coletar pista remove um ponto de descoberta", afterCollect === before - 1, `antes=${before} depois=${afterCollect}`);

    await page.evaluate(() => hideMenus());
    await page.click("#btn-restart");
    await page.evaluate(idx => loadScene(idx, false), SCENE_7_INDEX);
    const afterRestart = await countBlood();
    check("após reinício, a pista não coletada volta a aparecer", afterRestart === before, `esperado=${before} obtido=${afterRestart}`);

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
        await runEndingRestarts(browser);
        await runExplorationAfterRestart(browser);
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
