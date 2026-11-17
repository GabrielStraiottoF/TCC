// Testes do validador de grafo do roteiro (T-GRAFO-01/02, NAR-004).
// Execução: node tests/graph.cjs — Node puro, sem navegador.

const path = require("path");
const fs = require("fs");
const { validateGraph } = require("../roteiro-graph.js");

const roteiro = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "roteiro.json"), "utf8"));
const routing = {
    choiceSceneId: 8,
    choices: [{ sceneId: 9 }, { sceneId: 10 }, { sceneId: 11 }],
    terminalSceneIds: [11],
};

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
    if (condition) { passed++; console.log(`  ok   ${name}`); }
    else { failed++; console.log(`  FAIL ${name} ${detail}`); }
}
const clone = () => JSON.parse(JSON.stringify(roteiro));
const scene = (r, id) => r.cenas.find(c => Number(c.id) === id);
const has = (errors, text) => errors.some(e => e.includes(text));

console.log("GRAFO — roteiro atual");
const base = validateGraph(roteiro, routing);
check("roteiro atual não tem erros de grafo", base.length === 0, JSON.stringify(base));

console.log("GRAFO — defeitos detectados");
let r = clone(); scene(r, 9).proximaCena = 99;
let e = validateGraph(r, routing);
check("destino inexistente é rejeitado com o ID da cena", has(e, "cena 9") && has(e, "inexistente 99"), JSON.stringify(e));

r = clone(); scene(r, 9).proximaCena = 9;
e = validateGraph(r, routing);
check("cena apontando para si mesma é rejeitada", has(e, "aponta para si mesma"), JSON.stringify(e));

r = clone(); r.cenas.splice(r.cenas.findIndex(c => Number(c.id) === 12), 1);
e = validateGraph(r, routing);
check("remover a cena 12 deixa 9 e 10 apontando para destino inexistente", has(e, "inexistente 12"), JSON.stringify(e));

r = clone(); scene(r, 5).proximaCena = 7;
e = validateGraph(r, routing);
check("cena 6 fica inalcançável quando 5 a pula", has(e, "cena 6 não é alcançável"), JSON.stringify(e));

r = clone(); scene(r, 13).proximaCena = 12;
e = validateGraph(r, routing);
check("ciclo 12 → 13 → 12 é detectado", has(e, "Ciclo no roteiro"), JSON.stringify(e));

r = clone(); r.cenas.splice(r.cenas.findIndex(c => Number(c.id) === 11), 0, { id: 99, local: "Beco", eventos: [], dialogos: [], proximaCena: 98 });
e = validateGraph(r, routing);
check("destino 98 inexistente a partir de cena extra", has(e, "inexistente 98"), JSON.stringify(e));

e = validateGraph(roteiro, { ...routing, choices: [] });
check("cena de escolha sem opções é rejeitada", has(e, "não tem opções"), JSON.stringify(e));

e = validateGraph(roteiro, { ...routing, choices: [{ sceneId: 9 }, { sceneId: 10 }, { sceneId: 77 }] });
check("escolha apontando para cena inexistente é rejeitada", has(e, "inexistente 77"), JSON.stringify(e));

e = validateGraph(roteiro, { ...routing, choices: [{ sceneId: 9 }, { sceneId: 10 }] });
check("cena 11 sem escolha que a alcance é inalcançável", has(e, "cena 11 não é alcançável"), JSON.stringify(e));

e = validateGraph({ cenas: [] }, routing);
check("roteiro sem cenas é rejeitado", e.length === 1);

console.log(`\nResultado: ${passed} aprovado(s), ${failed} reprovado(s).`);
process.exit(failed === 0 ? 0 : 1);
