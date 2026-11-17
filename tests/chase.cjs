// Testes da perseguição do Mapinguari (cena 7): presença só na cena 7, movimento da criatura,
// agachar, esconderijos, contato e retorno ao início da trilha.
// Execução: node tests/chase.cjs
// Requer Chromium e Playwright instalados no ambiente e python3 para o servidor local.

const path = require("path");
const { startStaticServer } = require("./http-server");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8806);
const BASE = `http://127.0.0.1:${PORT}/index.html`;
const SCENE7_INDEX = 6; // cena id 7 é a sétima do roteiro
const SCENE6_INDEX = 5;
const HIDE_SPOT = { x: 44, y: 52 };

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

async function openScene(page, index) {
    await page.goto(BASE);
    await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);
    await page.evaluate(i => { hideMenus(); loadScene(i, false); }, index);
    await page.waitForFunction(() => window.ExplorationChase && document.querySelector("#exploration-layer"));
    await page.waitForTimeout(150);
}

async function chaseState(page) {
    return page.evaluate(() => window.ExplorationChase.state());
}

async function pressAndWait(page, key, ms = 60) {
    await page.keyboard.press(key);
    await page.waitForTimeout(ms);
}

(async () => {
    let server;
    let browser;
    try {
        server = await startStaticServer(ROOT, PORT);
        await waitForServer();
        browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", e => errors.push(e.message));
        page.on("dialog", d => d.accept());

        console.log("PRESENÇA — a criatura só existe na cena 7");
        await openScene(page, SCENE6_INDEX);
        let s = await chaseState(page);
        check("cena 6 não ativa a perseguição", s.active === false);
        check("cena 6 não cria a criatura", (await page.$$(".chase-creature")).length === 0);

        await openScene(page, SCENE7_INDEX);
        s = await chaseState(page);
        check("cena 7 ativa a perseguição", s.active === true);
        check("cena 7 cria a criatura", (await page.$$(".chase-creature")).length === 1);
        check("cena 7 cria os dois esconderijos", (await page.$$(".hide-spot")).length === 2);

        console.log("MOVIMENTO — a criatura patrulha e se move");
        await page.evaluate(() => window.ExplorationChase.placeCreature(50, 25));
        const before = await chaseState(page);
        await page.waitForTimeout(1500);
        const after = await chaseState(page);
        const moved = Math.hypot(after.creature.x - before.creature.x, after.creature.y - before.creature.y);
        check("criatura se move sozinha", moved > 0.3, `deslocamento=${moved.toFixed(2)}`);

        console.log("VISÃO — obstáculos bloqueiam a detecção");
        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(32, 45);
            window.ExplorationChase.placeCreature(43, 34);
        });
        await page.waitForTimeout(100);
        s = await chaseState(page);
        check("criatura não enxerga Alex através do tronco", s.creatureState !== "caçando", s.creatureState);

        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(50, 60);
            window.ExplorationChase.placeCreature(50, 45);
        });
        await page.waitForTimeout(100);
        s = await chaseState(page);
        check("criatura enxerga Alex sem obstáculo entre eles", s.creatureState === "caçando", s.creatureState);

        console.log("AGACHAR — C alterna o estado e reduz alcance visual");
        await openScene(page, SCENE7_INDEX);
        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(50, 50);
            window.ExplorationChase.placeCreature(50, 40);
        });
        await page.waitForTimeout(100);
        check("em pé, Alex é detectado a 10 unidades", (await chaseState(page)).creatureState === "caçando");
        await openScene(page, SCENE7_INDEX);
        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(50, 50);
            window.ExplorationChase.placeCreature(50, 40);
        });
        await pressAndWait(page, "c");
        await page.waitForTimeout(100);
        check("agachado, Alex não é detectado a 10 unidades", (await chaseState(page)).creatureState !== "caçando");

        console.log("RUÍDO — só há ruído quando existe deslocamento");
        await openScene(page, SCENE7_INDEX);
        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(42.3, 35);
            window.ExplorationChase.placeCreature(70, 35);
        });
        await page.keyboard.down("a");
        await page.waitForTimeout(180);
        await page.keyboard.up("a");
        s = await chaseState(page);
        check("pressionar movimento contra obstáculo não desloca Alex", Math.abs(s.player.x - 42.3) < 0.01, JSON.stringify(s.player));
        check("movimento bloqueado não emite ruído", s.noise.radius === 0 || s.noise.t <= 0, JSON.stringify(s.noise));

        await page.evaluate(() => {
            window.ExplorationChase.placePlayer(50, 72);
            window.ExplorationChase.placeCreature(85, 72);
        });
        await page.keyboard.down("d");
        await page.waitForTimeout(120);
        await page.keyboard.up("d");
        s = await chaseState(page);
        check("deslocamento real emite ruído de caminhada", s.noise.radius === 9 && s.noise.t > 0, JSON.stringify(s.noise));

        console.log("ESCONDERIJO — E esconde, bloqueia o movimento e E sai");
        await page.evaluate(p => window.ExplorationChase.placePlayer(p.x, p.y), HIDE_SPOT);
        await pressAndWait(page, "e");
        s = await chaseState(page);
        check("E dentro da moita esconde Alex", s.hidden === true);
        const hiddenX = s.player.x;
        await page.keyboard.down("d");
        await page.waitForTimeout(400);
        await page.keyboard.up("d");
        s = await chaseState(page);
        check("escondido, Alex não se move", Math.abs(s.player.x - hiddenX) < 0.01, `antes=${hiddenX} depois=${s.player.x}`);
        await pressAndWait(page, "e");
        check("E sai do esconderijo", (await chaseState(page)).hidden === false);

        console.log("CONTATO — a criatura alcança Alex e ele volta ao início da trilha");
        await page.evaluate(() => window.ExplorationChase.placePlayer(50, 50));
        await page.evaluate(() => window.ExplorationChase.placeCreature(50, 50));
        await page.waitForTimeout(150);
        s = await chaseState(page);
        check("contato devolve Alex ao início da trilha", s.player.x === 50 && s.player.y === 72, JSON.stringify(s.player));
        check("contato mostra o aviso", s.alert.includes("alcançou"), s.alert);
        check("contato reposiciona a criatura no ponto de origem", s.creature.y > 80, JSON.stringify(s.creature));

        console.log("ESCONDIDO — a criatura não alcança Alex dentro da moita");
        await page.evaluate(() => { window.__realRandom = Math.random; Math.random = () => 0.99; });
        await page.evaluate(p => window.ExplorationChase.placePlayer(p.x, p.y), HIDE_SPOT);
        await pressAndWait(page, "e");
        await page.evaluate(p => window.ExplorationChase.placeCreature(p.x, p.y), HIDE_SPOT);
        await page.waitForTimeout(500);
        s = await chaseState(page);
        check("criatura sobre a moita não pega Alex escondido", s.hidden === true && s.player.x === HIDE_SPOT.x, JSON.stringify(s));
        await page.evaluate(() => { Math.random = window.__realRandom; });

        check("nenhum erro de página durante os testes", errors.length === 0, JSON.stringify(errors));
        await context.close();
    } catch (error) {
        failed++;
        console.log(`  ERRO ${error.message}`);
    } finally {
        if (browser) await browser.close();
        if (server) await server.close();
    }
    console.log(`\nResultado: ${passed} aprovado(s), ${failed} reprovado(s).`);
    process.exit(failed === 0 ? 0 : 1);
})();
