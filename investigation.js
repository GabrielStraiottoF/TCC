// Estado compartilhado da investigação. app.js persiste este objeto no save.
// Fonte única das regras: os requisitos de cada estratégia vivem em strategyCatalog e são
// usados tanto pela resolução do confronto quanto pela interface (escolha da cena 8, tela de derrota).
(() => {
    const clueCatalog = {
        tracks: { title: "Pegadas gigantescas", scene: 6, detail: "As marcas indicam uma criatura de grande porte e confirmam sua passagem pela clareira." },
        fur: { title: "Pelos encontrados", scene: 6, detail: "Vestígio físico associado à criatura; não revela, sozinho, uma vulnerabilidade." },
        blood: { title: "Sangue na perseguição", scene: 7, detail: "A criatura pode ser ferida. Isso não identifica, por si só, um ponto fraco." },
        field_book: { title: "Livro do acampamento", scene: 8, detail: "O livro registra uma possível vulnerabilidade. É uma hipótese documental a confrontar com as evidências." }
    };
    const itemCatalog = {
        thorn_branch: "Galho espinhoso",
        improvised_grenade: "Explosivo improvisado",
        weapon_and_rope: "Arma, uma munição e cordas"
    };

    // Estratégias da cena 8. `requires` é uma lista de exigências; cada exigência é satisfeita por
    // qualquer um dos ids de `anyOf` (clue = pista, item = recurso). `success` é o resultado se tudo for atendido.
    const strategyCatalog = [
        {
            label: "Espinhos + explosivo",
            risk: "Gastar os recursos sem garantir que a criatura não se recupere.",
            requires: [{ anyOf: [{ item: "thorn_branch" }] }, { anyOf: [{ item: "improvised_grenade" }] }],
            success: "victory"
        },
        {
            label: "Arma + munição limitada",
            risk: "Só há uma munição, e a interpretação do livro pode estar errada.",
            requires: [{ anyOf: [{ item: "weapon_and_rope" }] }, { anyOf: [{ clue: "blood" }] }, { anyOf: [{ clue: "field_book" }] }],
            success: "victory"
        },
        {
            label: "Cordas para contenção e fuga",
            risk: "A contenção pode ser instável e a criatura pode voltar a perseguir Alex.",
            requires: [{ anyOf: [{ item: "weapon_and_rope" }] }, { anyOf: [{ clue: "tracks" }, { clue: "blood" }] }],
            success: "escape"
        }
    ];

    // Hipóteses do caderno: só aparecem quando a evidência-base existe (`needs`). `compare` lista os
    // vestígios com que a hipótese pode ser confrontada; `caveat` é o limite do que a evidência prova.
    const hypothesisCatalog = [
        {
            text: "A criatura pode ser ferida.",
            needs: [{ clue: "blood" }],
            caveat: "Isso não indica qual região do corpo é vulnerável."
        },
        {
            text: "Os espinhos provocaram uma reação observável.",
            needs: [{ item: "thorn_branch" }],
            caveat: "Ainda não prova uma fraqueza decisiva."
        },
        {
            text: "O livro apresenta uma possível vulnerabilidade.",
            needs: [{ clue: "field_book" }],
            compare: [{ clue: "blood" }, { clue: "tracks" }, { clue: "fur" }],
            caveat: "É um relato documental; compare-o com os vestígios físicos antes de confiar nele."
        }
    ];

    const fresh = () => ({ version: 1, clues: [], items: [], strategy: null, outcome: null });
    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    let state = fresh(), modal;

    const isFound = ref => ref.clue ? state.clues.includes(ref.clue) : state.items.includes(ref.item);
    const refTitle = ref => ref.clue ? clueCatalog[ref.clue].title : itemCatalog[ref.item];

    function ensureUI() {
        if (document.getElementById("investigation-modal")) { modal = document.getElementById("investigation-modal"); return; }
        modal = document.createElement("div"); modal.id = "investigation-modal"; modal.className = "modal";
        modal.innerHTML = '<div class="modal-content"><div class="modal-header"><h3>CADERNO DE INVESTIGAÇÃO</h3><button class="close-btn" type="button" aria-label="Fechar">×</button></div><div class="modal-body" id="investigation-content"></div></div>';
        document.getElementById("game-container")?.appendChild(modal);
        modal.querySelector(".close-btn").addEventListener("click", () => modal.classList.remove("active"));
        modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("active"); });
        document.getElementById("btn-investigation")?.addEventListener("click", () => { render(); modal.classList.add("active"); });
    }

    // Hipóteses visíveis agora, com a base encontrada e o confronto com outros vestígios.
    function getHypotheses() {
        return hypothesisCatalog.filter(h => h.needs.every(isFound)).map(h => {
            const found = h.compare ? h.compare.filter(isFound).map(refTitle) : null;
            return {
                text: h.text,
                basis: h.needs.map(refTitle),
                compared: found,
                caveat: h.caveat
            };
        });
    }

    function render() {
        ensureUI(); const root = document.getElementById("investigation-content"); if (!root) return; root.replaceChildren();
        const addSection = (title, entries, empty) => {
            const section = document.createElement("section"); section.className = "investigation-section";
            const heading = document.createElement("h4"); heading.textContent = title; section.appendChild(heading);
            if (!entries.length) {
                const p = document.createElement("p"); p.className = "investigation-empty"; p.textContent = empty; section.appendChild(p);
            } else {
                const ul = document.createElement("ul");
                entries.forEach(text => { const li = document.createElement("li"); li.textContent = text; ul.appendChild(li); });
                section.appendChild(ul);
            }
            root.appendChild(section);
        };
        addSection("Evidências", state.clues.map(id => { const x = clueCatalog[id]; return x ? x.title + " — Cena " + x.scene + ": " + x.detail : id; }), "Nenhuma evidência registrada.");
        addSection("Hipóteses", getHypotheses().map(h => {
            let text = h.text + " Base: " + h.basis.join(", ") + ".";
            if (h.compared !== null) text += h.compared.length ? " Confrontada com: " + h.compared.join(", ") + "." : " Ainda sem vestígios físicos para confrontar o relato.";
            return text + " " + h.caveat;
        }), "As hipóteses surgem conforme você encontra evidências.");
        addSection("Recursos", state.items.map(id => itemCatalog[id] || id), "Nenhum recurso especial registrado.");
        const p = document.createElement("p");
        p.textContent = "Estratégia escolhida: " + (state.strategy === null ? "ainda não escolhida" : strategyCatalog[state.strategy].label);
        root.appendChild(p);
    }

    function addClue(id) { if (!clueCatalog[id] || state.clues.includes(id)) return; state.clues.push(id); render(); window.saveGame?.(); }
    function addItem(id) { if (!itemCatalog[id] || state.items.includes(id)) return; state.items.push(id); render(); window.saveGame?.(); }
    function chooseStrategy(i) { if (!strategyCatalog[i]) return; state.strategy = i; state.outcome = null; window.saveGame?.(); }

    // Exigências de uma estratégia com o estado atual: [{ label, met }].
    function getRequirements(i) {
        const strategy = strategyCatalog[i];
        if (!strategy) return [];
        return strategy.requires.map(req => ({ label: req.anyOf.map(refTitle).join(" ou "), met: req.anyOf.some(isFound) }));
    }
    function getStrategyInfo(i) {
        const strategy = strategyCatalog[i];
        return strategy ? { label: strategy.label, risk: strategy.risk, requirements: getRequirements(i) } : null;
    }
    // O que falta para a estratégia escolhida (vazio se nada foi escolhido ou se tudo está atendido).
    function missingRequirements() {
        return state.strategy === null ? [] : getRequirements(state.strategy).filter(r => !r.met).map(r => r.label);
    }

    function resolve() {
        if (state.outcome) return state.outcome;
        const strategy = strategyCatalog[state.strategy];
        state.outcome = strategy && getRequirements(state.strategy).every(r => r.met) ? strategy.success : "defeat";
        window.saveGame?.();
        return state.outcome;
    }
    function getState() { return JSON.parse(JSON.stringify(state)); }

    // Validação estrita: retorna false se o estado contiver qualquer valor desconhecido.
    function isValidState(s) {
        if (!s || typeof s !== "object" || s.version !== 1) return false;
        if (!Array.isArray(s.clues) || !s.clues.every(x => hasOwn(clueCatalog, x))) return false;
        if (!Array.isArray(s.items) || !s.items.every(x => hasOwn(itemCatalog, x))) return false;
        if (!(s.strategy == null || [0, 1, 2].includes(s.strategy))) return false;
        if (!(s.outcome == null || ["victory", "escape", "defeat"].includes(s.outcome))) return false;
        return true;
    }
    function restore(s) {
        state = s && s.version === 1 ? {
            version: 1,
            clues: Array.isArray(s.clues) ? s.clues.filter(x => clueCatalog[x]) : [],
            items: Array.isArray(s.items) ? s.items.filter(x => itemCatalog[x]) : [],
            strategy: [0, 1, 2].includes(s.strategy) ? s.strategy : null,
            outcome: ["victory", "escape", "defeat"].includes(s.outcome) ? s.outcome : null
        } : fresh();
    }
    function reset() { state = fresh(); render(); }

    window.Investigation = {
        addClue, addItem, chooseStrategy, resolve, getState, restore, reset, isValidState,
        getRequirements, getStrategyInfo, missingRequirements, getHypotheses
    };
    window.addEventListener("DOMContentLoaded", ensureUI); window.addEventListener("load", ensureUI);
})();
