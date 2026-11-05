// Testes do checkpoint pré-combate: a derrota volta à cena 8, antes da escolha,
// mantendo pistas, itens e caderno, e zerando a estratégia que falhou.
// Execução: node tests/checkpoint.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8796);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const SAVE_KEY = "tcc-mapinguari-save-v2";
const SCENE8_INDEX = 7; // cena id 8 é a oitava do roteiro

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
    await page.evaluate(() => hideMenus());
}

// Estado na cena 8, com pista de sangue e galho espinhoso, mas sem granada (E0 vai falhar).
async function arriveAtChoice(page) {
    await page.evaluate(idx => {
        hideMenus();
        loadScene(idx, false);
        Investigation.addClue("blood");
        Investigation.addItem("thorn_branch");
        // No jogo, as escolhas aparecem só depois de todos os eventos e diálogos da cena 8.
        const scene = roteiro.cenas[idx];
        currentEventIndex = scene.eventos.length;
        currentDialogueIndex = scene.dialogos.length;
        showScene8Choices();
    }, SCENE8_INDEX);
}

async function state(page) {
    return page.evaluate(k => ({
        scene: currentSceneIndex,
        choicesOpen: document.getElementById("choices-overlay").classList.contains("active"),
        gameOverOpen: document.getElementById("gameover-overlay").classList.contains("active"),
        investigation: Investigation.getState(),
        save: (() => { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } })(),
        choiceButtons: document.querySelectorAll("#choices-container .choice-btn").length,
    }), SAVE_KEY);
}

async function runCheckpoint(browser) {
    console.log("CHECKPOINT — derrota volta à cena 8, antes da escolha");
    const context = await browser.newContext();
    const page = await context.newPage();
    await openGame(page);
    await arriveAtChoice(page);

    // Escolhe a estratégia 1 (espinhos + granada), sem a granada: derrota.
    await page.evaluate(() => { chooseScene8(0); showGameOver(); });
    let s = await state(page);
    check("derrota mostra a tela de fracasso", s.gameOverOpen);
    check("derrota grava o checkpoint (não apaga a partida)", s.save !== null && s.save.sceneId === 8, JSON.stringify(s.save && s.save.sceneId));
    check("checkpoint guarda a pista de sangue", s.save.investigation.clues.includes("blood"));
    check("checkpoint guarda o galho espinhoso", s.save.investigation.items.includes("thorn_branch"));
    check("checkpoint zera a estratégia que falhou", s.save.investigation.strategy === null && s.save.investigation.outcome === null, JSON.stringify(s.save.investigation));

    await page.click("#btn-retry-choice");
    s = await state(page);
    check("'Retornar à Cena 8' volta à cena 8", s.scene === SCENE8_INDEX, String(s.scene));
    check("retorno reabre a escolha de estratégia", s.choicesOpen && s.choiceButtons === 3, `aberta=${s.choicesOpen} botões=${s.choiceButtons}`);
    check("retorno mantém a pista de sangue", s.investigation.clues.includes("blood"));
    check("retorno mantém o galho espinhoso", s.investigation.items.includes("thorn_branch"));
    check("retorno zera a estratégia", s.investigation.strategy === null, JSON.stringify(s.investigation));

    // O checkpoint sobrevive a recarregar a página.
    await page.reload();
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
    await page.click("#btn-continue");
    s = await state(page);
    check("após recarregar, 'Continuar' retorna à escolha da cena 8", s.scene === SCENE8_INDEX && s.choicesOpen, JSON.stringify({ scene: s.scene, choicesOpen: s.choicesOpen }));
    check("após recarregar, pistas e itens são mantidos", s.investigation.clues.includes("blood") && s.investigation.items.includes("thorn_branch"));

    await context.close();
}

async function runRestartAndEscape(browser) {
    console.log("CHECKPOINT — reinício e fuga não usam o checkpoint");
    const context = await browser.newContext();
    const page = await context.newPage();
    await openGame(page);
    await arriveAtChoice(page);
    await page.evaluate(() => { chooseScene8(0); showGameOver(); });

    // "Reiniciar Caçada" apaga o checkpoint e começa do início.
    await page.click("#btn-restart-gameover");
    let s = await state(page);
    check("'Reiniciar Caçada' volta ao início", s.scene === 0, String(s.scene));
    check("'Reiniciar Caçada' apaga a partida e o checkpoint", s.save === null && (await page.evaluate(() => scene8Checkpoint)) === null);

    // Fuga continua encerrando a partida, sem checkpoint.
    await arriveAtChoice(page);
    await page.evaluate(() => showEscapeEnding());
    s = await state(page);
    check("fuga continua apagando a partida", s.save === null);

    // Derrota sem checkpoint (partida carregada depois da escolha) mantém o comportamento de limpeza.
    await page.evaluate(() => { scene8Checkpoint = null; showGameOver(); });
    s = await state(page);
    check("derrota sem checkpoint disponível limpa a partida", s.save === null);

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
        await runCheckpoint(browser);
        await runRestartAndEscape(browser);
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
