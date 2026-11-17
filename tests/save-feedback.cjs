// Testa o feedback visual quando o navegador falha ao gravar o save.
// Execução: node tests/save-feedback.cjs
// Requer Chromium e Playwright; o servidor HTTP de teste usa Node.js.
const path = require("path");
const { startStaticServer } = require("./http-server");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.TEST_PORT || 8798);
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
    let server;
    let browser;
    try {
        server = await startStaticServer(ROOT, PORT);
        await waitForServer();
        browser = await chromium.launch();
        const page = await browser.newPage();
        await page.goto(BASE);
        await page.waitForFunction(() => typeof roteiro !== "undefined" && roteiro !== null);

        const initialHidden = await page.locator("#save-warning").evaluate(element => element.hidden);
        check("aviso de salvamento começa oculto", initialHidden);

        const failure = await page.evaluate(() => {
            const originalSetItem = Storage.prototype.setItem;
            Storage.prototype.setItem = function () {
                throw new DOMException("Quota excedida", "QuotaExceededError");
            };
            try {
                return window.writeSavePayload({ version: 3, sceneId: 1 });
            } finally {
                Storage.prototype.setItem = originalSetItem;
            }
        });
        const warning = await page.locator("#save-warning").evaluate(element => ({
            hidden: element.hidden,
            text: element.textContent,
            role: element.getAttribute("role"),
            live: element.getAttribute("aria-live"),
        }));
        check("falha de armazenamento retorna false", failure === false);
        check("falha exibe aviso persistente", warning.hidden === false);
        check("aviso explica que o progresso recente pode ser perdido", warning.text.includes("podem ser perdidas"));
        check("aviso é anunciado por tecnologia assistiva", warning.role === "status" && warning.live === "polite");

        const success = await page.evaluate(() => window.writeSavePayload({ version: 3, sceneId: 1 }));
        const hiddenAfterSuccess = await page.locator("#save-warning").evaluate(element => element.hidden);
        check("salvamento bem-sucedido retorna true", success === true);
        check("salvamento bem-sucedido oculta o aviso", hiddenAfterSuccess);
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
