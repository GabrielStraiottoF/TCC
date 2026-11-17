// Validação do grafo de cenas do roteiro (destinos, alcançabilidade, ciclos e becos sem saída).
// Módulo puro: funciona no navegador (window.RoteiroGraph) e no Node (require), sem depender do DOM.
//
// Regras de navegação espelham o motor (app.js, advanceScene):
//  - sem `proximaCena`, a cena segue para a próxima do array; a última cena é o final da campanha;
//  - a cena de escolha (8) segue apenas para os destinos das escolhas;
//  - cenas terminais (11: fuga ou derrota) não têm saída por narrativa.
(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.RoteiroGraph = factory();
})(typeof self !== "undefined" ? self : this, function () {
    const defaultRouting = { choiceSceneId: 8, choices: [], terminalSceneIds: [] };

    function explicitNext(scene) {
        const value = scene.proximaCena ?? scene.proxima_cena ?? scene.nextScene ?? scene.proxima;
        if (value === undefined || value === null || value === "") return null;
        return Number(value);
    }

    // Arestas de saída de cada cena, no mesmo critério do motor.
    function buildEdges(roteiro, routing) {
        const rules = { ...defaultRouting, ...(routing || {}) };
        const edges = new Map();
        roteiro.cenas.forEach((scene, index) => {
            const id = Number(scene.id);
            const out = [];
            if (id === rules.choiceSceneId) {
                rules.choices.forEach(choice => out.push(Number(choice.sceneId)));
            } else if (rules.terminalSceneIds.map(Number).includes(id)) {
                // sem saída narrativa: o desfecho é uma tela de resultado
            } else {
                const explicit = explicitNext(scene);
                if (explicit !== null) out.push(explicit);
                else if (roteiro.cenas[index + 1]) out.push(Number(roteiro.cenas[index + 1].id));
            }
            edges.set(id, out);
        });
        return edges;
    }

    // Retorna a lista de problemas encontrados (vazia se o grafo é consistente).
    function validateGraph(roteiro, routing) {
        const errors = [];
        if (!roteiro || !Array.isArray(roteiro.cenas) || roteiro.cenas.length === 0) {
            return ["O roteiro não possui cenas para validar."];
        }
        const rules = { ...defaultRouting, ...(routing || {}) };
        const ids = roteiro.cenas.map(scene => Number(scene.id));
        const idSet = new Set(ids);
        const lastId = ids[ids.length - 1];
        const terminals = new Set(rules.terminalSceneIds.map(Number));
        const edges = buildEdges(roteiro, rules);

        edges.forEach((targets, from) => {
            targets.forEach(to => {
                if (Number.isNaN(to) || !idSet.has(to)) errors.push(`A cena ${from} aponta para a cena inexistente ${to}.`);
                else if (to === from) errors.push(`A cena ${from} aponta para si mesma.`);
            });
        });
        if (idSet.has(rules.choiceSceneId) && rules.choices.length === 0) {
            errors.push(`A cena de escolha ${rules.choiceSceneId} não tem opções.`);
        }

        // Alcançabilidade a partir da primeira cena.
        const reachable = new Set([ids[0]]);
        const queue = [ids[0]];
        while (queue.length) {
            const current = queue.shift();
            (edges.get(current) || []).forEach(to => {
                if (idSet.has(to) && !reachable.has(to)) { reachable.add(to); queue.push(to); }
            });
        }
        ids.filter(id => !reachable.has(id)).forEach(id => errors.push(`A cena ${id} não é alcançável a partir da cena ${ids[0]}.`));

        // Becos sem saída: só a última cena e as cenas terminais declaradas podem não ter destino.
        ids.forEach(id => {
            const out = (edges.get(id) || []).filter(to => idSet.has(to));
            if (out.length === 0 && id !== lastId && !terminals.has(id)) {
                errors.push(`A cena ${id} não tem saída e não é um final declarado.`);
            }
        });

        // Ciclos nas arestas narrativas (o retorno da derrota à cena 8 não é aresta do roteiro).
        const state = new Map();
        const visit = (id, path) => {
            state.set(id, 1);
            for (const to of edges.get(id) || []) {
                if (!idSet.has(to)) continue;
                if (state.get(to) === 1) { errors.push(`Ciclo no roteiro: ${[...path, id, to].join(" → ")}.`); continue; }
                if (!state.has(to)) visit(to, [...path, id]);
            }
            state.set(id, 2);
        };
        ids.forEach(id => { if (!state.has(id)) visit(id, []); });

        // Todo final (última cena ou cena terminal) deve ser alcançável.
        [lastId, ...terminals].forEach(id => {
            if (idSet.has(id) && !reachable.has(id)) errors.push(`O final na cena ${id} não é alcançável.`);
        });

        return [...new Set(errors)];
    }

    return { buildEdges, validateGraph };
});
