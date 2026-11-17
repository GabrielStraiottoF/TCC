// Regressão da exploração: mapas de teste ocultos não podem bloquear o jogador.
const path = require("path");
const { startStaticServer } = require("./http-server");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8811);
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
        } catch (_) { /* aguarda o servidor */ }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Servidor local não respondeu.");
}

async function verifyScene(browser, sceneIndex, sceneId) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));

    await page.goto(BASE);
    await page.waitForFunction(() => typeof roteiro !== "undefined" && window.ExplorationControls);
    await page.evaluate(index => {
        hideMenus();
        loadScene(index, false);
    }, sceneIndex);
    await page.waitForTimeout(150);

    const mapState = await page.evaluate(() => ({
        scene: Number(document.getElementById("game-container")?.dataset.scene),
        testMapVisible: !!document.querySelector(".test-map"),
        startY: window.ExplorationChase.state().player.y
    }));

    check(`cena ${sceneId}: mapa genérico de teste não é exibido`, mapState.testMapVisible === false);
    check(`cena ${sceneId}: cena carregada corretamente`, mapState.scene === sceneId, JSON.stringify(mapState));

    await page.evaluate(() => window.ExplorationControls.setMove(0, -1));
    await page.waitForTimeout(1700);
    await page.evaluate(() => window.ExplorationControls.setMove(0, 0));

    const finalY = await page.evaluate(() => window.ExplorationChase.state().player.y);
    check(
        `cena ${sceneId}: Alex atravessa a área onde ficava a colisão invisível`,
        finalY < 50,
        `posição Y final=${finalY.toFixed(2)}; esperado < 50`
    );
    check(`cena ${sceneId}: nenhum erro de JavaScript`, errors.length === 0, JSON.stringify(errors));

    await page.close();
}

(async () => {
    let server;
    let browser;
    try {
        server = await startStaticServer(ROOT, PORT);
        await waitForServer();
        browser = await chromium.launch();
        console.log("EXPLORAÇÃO — colisões de mapas de teste ocultos");
        await verifyScene(browser, 0, 1);
        await verifyScene(browser, 8, 9);
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
