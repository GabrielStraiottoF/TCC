// Testes da abertura: cena 1 (rodoviária) com um único texto do narrador e saída pelo ônibus;
// cena 2 (ônibus) sem diálogos.
// Execução: node tests/intro.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8804);
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
            const res = await fetch(BASE);
            if (res.ok) return;
        } catch (_) { /* aguarda */ }
        await new Promise(r => setTimeout(r, 100));
    }
    throw new Error("Servidor local não respondeu.");
}

async function pressUntilIdle(page, times) {
    for (let i = 0; i < times; i++) {
        await page.keyboard.press("Enter");
        await page.waitForTimeout(40);
    }
}

async function state(page) {
    return page.evaluate(() => ({
        scene: currentSceneIndex,
        state: currentState,
        event: currentEventIndex,
        dialogue: currentDialogueIndex,
        exploring: document.getElementById("exploration-layer") !== null,
        busPointLabels: [...document.querySelectorAll(".interaction-point")].map(b => b.getAttribute("aria-label")),
    }));
}

(async () => {
    const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", ROOT], {
        stdio: "ignore",
    });
    let browser;
    try {
        await waitForServer();
        browser = await chromium.launch();
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        const errors = [];
        page.on("pageerror", e => errors.push(e.message));
        page.on("dialog", d => d.accept());

        await page.goto(BASE);
        await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);

        const data = await page.evaluate(() => ({
            s1: { eventos: roteiro.cenas[0].eventos, dialogos: roteiro.cenas[0].dialogos.length, transicao: roteiro.cenas[0].transicao },
            s2: { dialogos: roteiro.cenas[1].dialogos.length },
        }));
        console.log("CENA 1 e 2 — conteúdo do roteiro");
        check("cena 1 tem apenas o texto do narrador", JSON.stringify(data.s1.eventos) === JSON.stringify(["A rodoviária está barulhenta."]), JSON.stringify(data.s1.eventos));
        check("cena 1 não tem diálogos", data.s1.dialogos === 0, String(data.s1.dialogos));
        check("cena 1 é marcada para sair pela interação", data.s1.transicao === "interacao", String(data.s1.transicao));
        check("cena 2 não tem diálogos", data.s2.dialogos === 0, String(data.s2.dialogos));

        console.log("CENA 1 — a partida espera o jogador");
        await page.click("#btn-start");
        await page.click('.difficulty-btn[data-difficulty="normal"]');
        await pressUntilIdle(page, 6);
        let s = await state(page);
        check("começa na cena 1", s.scene === 0, String(s.scene));
        // Muitos avanços não podem tirar o jogador da cena 1 nem disparar diálogos.
        await pressUntilIdle(page, 40);
        s = await state(page);
        check("avanços extras não saem da cena 1", s.scene === 0, String(s.scene));
        // Com zero diálogos, o índice termina em 0 (= dialogos.length); o que importa é não haver diálogo ativo.
        check("cena 1 não tem diálogo ativo", s.dialogue >= 0 && s.dialogue >= data.s1.dialogos, String(s.dialogue));
        check("a partida continua em execução na cena 1", s.state === "running", s.state);
        check("ponto 'Entrar no ônibus' está disponível", s.busPointLabels.includes("Entrar no ônibus"), JSON.stringify(s.busPointLabels));

        console.log("CENA 1 → 2 — entrar no ônibus");
        await page.click('.interaction-point[aria-label="Entrar no ônibus"]');
        await page.waitForTimeout(300);
        s = await state(page);
        check("entrar no ônibus leva à cena 2", s.scene === 1, String(s.scene));

        console.log("CENA 2 — sem diálogos");
        // Enquanto a narração da cena 2 é exibida, nenhum diálogo deve começar.
        const scene2Dialogues = data.s2.dialogos;
        let sawDialogue = false;
        for (let i = 0; i < 40; i++) {
            await page.keyboard.press("Enter");
            await page.waitForTimeout(40);
            const cur = await state(page);
            if (cur.dialogue >= 0 && cur.dialogue < scene2Dialogues) sawDialogue = true;
        }
        check("cena 2 não exibe nenhum diálogo", sawDialogue === false && scene2Dialogues === 0);

        check("nenhum erro de página durante o teste", errors.length === 0, JSON.stringify(errors));
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
