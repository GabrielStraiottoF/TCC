// Testes do confronto da cena 8: matriz das três estratégias, requisitos visíveis,
// derrota sem narração de sucesso, "procurar mais" e hipóteses do caderno.
// Execução: node tests/confronto.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8798);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const SCENE8_INDEX = 7;

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
    if (condition) { passed++; console.log(`  ok   ${name}`); }
    else { failed++; console.log(`  FAIL ${name} ${detail}`); }
}

async function waitForServer() {
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(BASE)).ok) return; } catch (_) { /* aguarda */ }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error("Servidor local não respondeu.");
}

async function openGame(browser) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(BASE);
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
    await page.evaluate(() => hideMenus());
    return { context, page, errors };
}

// Chega à escolha da cena 8 com as pistas e itens indicados.
async function arriveAtChoice(page, clues, items) {
    await page.evaluate(([idx, c, i]) => {
        hideMenus();
        loadScene(idx, false);
        clearTypewriter(); // no jogo, a escolha só abre depois de todo o texto da cena
        c.forEach(x => Investigation.addClue(x));
        i.forEach(x => Investigation.addItem(x));
        const scene = roteiro.cenas[idx];
        currentEventIndex = scene.eventos.length;
        currentDialogueIndex = scene.dialogos.length;
        showScene8Choices();
    }, [SCENE8_INDEX, clues, items]);
}

// Avança narração e diálogos até a partida parar (final, derrota ou espera por interação).
async function playToEnd(page, maxSteps = 80) {
    for (let step = 0; step < maxSteps; step++) {
        const done = await page.evaluate(() => {
            const open = id => document.getElementById(id).classList.contains("active");
            if (open("gameover-overlay") || open("escape-overlay") || open("ending-overlay")) return true;
            advanceScene();
            return false;
        });
        if (done) return;
        await page.waitForTimeout(15);
    }
}

async function result(page) {
    return page.evaluate(() => ({
        gameOver: document.getElementById("gameover-overlay").classList.contains("active"),
        escape: document.getElementById("escape-overlay").classList.contains("active"),
        ending: document.getElementById("ending-overlay").classList.contains("active"),
        scene: roteiro.cenas[currentSceneIndex].id,
        outcome: Investigation.getState().outcome,
        reason: document.getElementById("gameover-reason").hidden ? "" : document.getElementById("gameover-reason").textContent,
    }));
}

const ALL_CLUES = ["tracks", "fur", "blood", "field_book"];
const matrix = [
    // nome, pistas, itens, estratégia, final esperado
    ["E1 espinhos+explosivo completo", [], ["thorn_branch", "improvised_grenade"], 0, "victory"],
    ["E1 sem explosivo", ["blood"], ["thorn_branch"], 0, "defeat"],
    ["E1 sem galho", [], ["improvised_grenade"], 0, "defeat"],
    ["E2 arma+sangue+livro completo", ["blood", "field_book"], ["weapon_and_rope"], 1, "victory"],
    ["E2 sem livro", ["blood"], ["weapon_and_rope"], 1, "defeat"],
    ["E2 sem sangue", ["field_book"], ["weapon_and_rope"], 1, "defeat"],
    ["E2 sem arma", ["blood", "field_book"], [], 1, "defeat"],
    ["E3 arma+pegadas", ["tracks"], ["weapon_and_rope"], 2, "escape"],
    ["E3 arma+sangue", ["blood"], ["weapon_and_rope"], 2, "escape"],
    ["E3 sem arma", ["tracks", "blood"], [], 2, "defeat"],
    ["E3 sem pegadas nem sangue", ["fur", "field_book"], ["weapon_and_rope"], 2, "defeat"],
];

async function runMatrix(browser) {
    console.log("MATRIZ — cada estratégia com requisitos presentes e ausentes");
    for (const [name, clues, items, strategy, expected] of matrix) {
        const { context, page, errors } = await openGame(browser);
        await arriveAtChoice(page, clues, items);
        await page.evaluate(i => chooseScene8(i), strategy);
        await playToEnd(page);
        const r = await result(page);
        const got = r.gameOver ? "defeat" : r.escape ? "escape" : r.ending ? "victory" : "nenhum";
        check(`${name} → ${expected}`, got === expected, `obtido=${got} cena=${r.scene}`);
        if (expected === "victory") check(`${name}: vitória passa pelo epílogo (cena 14)`, r.scene === 14, `cena=${r.scene}`);
        check(`${name}: sem erro de página`, errors.length === 0, errors.join("|"));
        await context.close();
    }
}

async function runDefeatFlow(browser) {
    console.log("DERROTA — resultado imediato, sem narrar o plano como se funcionasse");
    const { context, page } = await openGame(browser);
    await arriveAtChoice(page, ["blood"], ["thorn_branch"]);
    await page.evaluate(() => chooseScene8(0)); // falta o explosivo
    let r = await result(page);
    check("derrota aparece logo após a escolha", r.gameOver);
    check("não entra na cena de execução (continua na cena 8)", r.scene === 8, `cena=${r.scene}`);
    check("motivo da derrota lista o que faltou", r.reason.includes("Explosivo improvisado"), r.reason);
    check("motivo não cita o que já estava atendido", !r.reason.includes("Galho espinhoso"), r.reason);

    await page.click("#btn-retry-choice");
    await page.evaluate(() => chooseScene8(1)); // arma + sangue + livro: faltam arma e livro
    r = await result(page);
    check("outra estratégia sem requisitos também derrota", r.gameOver);
    check("motivo lista todas as exigências faltantes", r.reason.includes("Arma, uma munição e cordas") && r.reason.includes("Livro do acampamento"), r.reason);
    await context.close();
}

async function runChoiceUI(browser) {
    console.log("ESCOLHA — requisitos e risco visíveis antes de decidir");
    const { context, page } = await openGame(browser);
    await arriveAtChoice(page, ["blood"], ["thorn_branch"]);
    const lines = await page.evaluate(() => [...document.querySelectorAll("#choices-container .choice-btn")].map(b => ({
        reqs: [...b.querySelectorAll(".choice-req")].map(r => r.textContent),
        risk: (b.querySelector(".choice-risk") || {}).textContent || "",
    })));
    check("três escolhas exibem requisitos e risco", lines.length === 3 && lines.every(l => l.reqs.length >= 2 && l.risk.startsWith("Risco:")), JSON.stringify(lines));
    check("requisito atendido mostra ✓ e o nome", lines[0].reqs.includes("✓ Galho espinhoso"), JSON.stringify(lines[0]));
    check("requisito ausente mostra ✗ e '(falta)' (sem depender só de cor)", lines[0].reqs.includes("✗ Explosivo improvisado (falta)"), JSON.stringify(lines[0]));
    check("exigência alternativa lista as duas opções", lines[2].reqs.some(r => r.includes("Pegadas gigantescas ou Sangue na perseguição")), JSON.stringify(lines[2]));
    check("sangue já registrado marca a exigência alternativa como atendida", lines[2].reqs.some(r => r.startsWith("✓ Pegadas gigantescas ou Sangue")), JSON.stringify(lines[2]));

    // Teclado: Esc volta a explorar; Enter reabre a decisão; tecla 1 escolhe.
    await page.keyboard.press("Escape");
    let s = await page.evaluate(() => ({ open: document.getElementById("choices-overlay").classList.contains("active"), state: currentState }));
    check("Esc fecha a escolha e devolve o controle ao jogador", !s.open && s.state === "running", JSON.stringify(s));
    await page.evaluate(() => Investigation.addItem("improvised_grenade"));
    await page.keyboard.press("Enter");
    s = await page.evaluate(() => ({
        open: document.getElementById("choices-overlay").classList.contains("active"),
        state: currentState,
        firstReqs: [...document.querySelectorAll("#choices-container .choice-btn")[0].querySelectorAll(".choice-req")].map(r => r.textContent),
    }));
    check("Enter reabre a escolha", s.open && s.state === "choice", JSON.stringify(s));
    check("item coletado enquanto procurava aparece como atendido", s.firstReqs.includes("✓ Explosivo improvisado"), JSON.stringify(s.firstReqs));

    await page.click("#btn-scene8-explore");
    s = await page.evaluate(() => ({ open: document.getElementById("choices-overlay").classList.contains("active"), state: currentState }));
    check("botão 'Procurar mais no acampamento' fecha a escolha", !s.open && s.state === "running", JSON.stringify(s));
    await page.evaluate(() => document.getElementById("dialog-box").click());
    s = await page.evaluate(() => document.getElementById("choices-overlay").classList.contains("active"));
    check("tocar no texto reabre a escolha", s);
    await page.keyboard.press("1");
    await playToEnd(page);
    const r = await result(page);
    check("com o explosivo coletado depois, a estratégia 1 vence", r.ending && r.scene === 14, JSON.stringify(r));
    await context.close();
}

async function runNotebook(browser) {
    console.log("CADERNO — hipóteses só aparecem com a evidência-base");
    const { context, page } = await openGame(browser);
    const hypotheses = () => page.evaluate(() => Investigation.getHypotheses());

    let h = await hypotheses();
    check("sem evidências, nenhuma hipótese", h.length === 0, JSON.stringify(h));
    await page.evaluate(() => Investigation.addClue("tracks"));
    h = await hypotheses();
    check("pegadas sozinhas não geram hipótese", h.length === 0, JSON.stringify(h));

    await page.evaluate(() => Investigation.addClue("blood"));
    h = await hypotheses();
    check("sangue gera a hipótese 'pode ser ferida'", h.length === 1 && h[0].text.includes("ferida") && h[0].basis.includes("Sangue na perseguição"), JSON.stringify(h));
    check("hipótese informa o limite do que a evidência prova", h[0].caveat.length > 0);

    await page.evaluate(() => Investigation.addItem("thorn_branch"));
    h = await hypotheses();
    check("galho espinhoso gera a hipótese dos espinhos, ainda não decisiva", h.length === 2 && h[1].caveat.includes("fraqueza decisiva"), JSON.stringify(h));

    await page.evaluate(() => Investigation.addClue("field_book"));
    h = await hypotheses();
    const book = h.find(x => x.text.includes("livro"));
    check("livro gera hipótese documental", !!book);
    check("livro é confrontado com os vestígios já encontrados", book && book.compared.includes("Sangue na perseguição") && book.compared.includes("Pegadas gigantescas") && !book.compared.includes("Pelos encontrados"), JSON.stringify(book));

    await context.close();
    const fresh = await openGame(browser);
    await fresh.page.evaluate(() => Investigation.addClue("field_book"));
    const only = await fresh.page.evaluate(() => Investigation.getHypotheses());
    check("livro sem vestígios: hipótese existe mas está sem confronto", only.length === 1 && only[0].compared.length === 0, JSON.stringify(only));
    await fresh.page.evaluate(() => document.getElementById("btn-investigation").click());
    const text = await fresh.page.evaluate(() => document.getElementById("investigation-content").innerText);
    check("caderno avisa que o relato ainda não foi confrontado", text.includes("Ainda sem vestígios físicos"), text);
    await fresh.context.close();
}

async function runPersistence(browser) {
    console.log("PERSISTÊNCIA — requisitos refletem o estado restaurado");
    const { context, page } = await openGame(browser);
    await arriveAtChoice(page, ["blood", "field_book"], ["weapon_and_rope"]);
    await page.evaluate(() => saveGame());
    await page.reload();
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
    await page.click("#btn-continue");
    const reqs = await page.evaluate(() => [...document.querySelectorAll("#choices-container .choice-btn")[1].querySelectorAll(".choice-req")].map(r => r.textContent));
    check("após recarregar, a escolha mostra os requisitos da estratégia 2 atendidos", reqs.length === 3 && reqs.every(r => r.startsWith("✓")), JSON.stringify(reqs));
    await context.close();
}

(async () => {
    const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", ROOT], { stdio: "ignore" });
    let browser;
    try {
        await waitForServer();
        browser = await chromium.launch();
        await runMatrix(browser);
        await runDefeatFlow(browser);
        await runChoiceUI(browser);
        await runNotebook(browser);
        await runPersistence(browser);
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
