// Camada de exploração 2D sobre o motor narrativo existente.
// Não altera roteiro.json nem os textos narrativos.
(() => {
    let player = null;
    let layer = null;
    let prompt = null;
    let currentScene = 1;
    let x = 50;
    let y = 72;
    let lastTime = 0;
    let animationFrame = null;
    const keys = new Set();
    const speed = 22;
    const playerRadius = 2.2;

    // Estado de exploração. As decisões da cena 8 acontecem ao encontrar
    // elementos no cenário, e não por meio de um menu de escolhas.
    const discoveredItems = new Set();

    // Cenário de teste temporário compartilhado por todas as cenas.
    // Os valores são percentuais da área jogável (0-100).
    const testScene = {
        testMap: true,
        collisions: [
            { x: 8, y: 12, width: 17, height: 22, label: "Árvores" },
            { x: 34, y: 8, width: 32, height: 12, label: "Casa" },
            { x: 74, y: 14, width: 17, height: 24, label: "Árvores" },
            { x: 7, y: 44, width: 25, height: 12, label: "Rio" },
            { x: 43, y: 44, width: 13, height: 10, label: "Pedras" },
            { x: 69, y: 45, width: 23, height: 11, label: "Vegetação" },
            { x: 22, y: 68, width: 12, height: 8, label: "Tronco" },
            { x: 66, y: 68, width: 14, height: 8, label: "Pedras" }
        ],
        decorations: [
            { type: "trees", x: 8, y: 12, width: 17, height: 22 },
            { type: "house", x: 34, y: 8, width: 32, height: 12 },
            { type: "trees", x: 74, y: 14, width: 17, height: 24 },
            { type: "river", x: 7, y: 44, width: 25, height: 12 },
            { type: "rocks", x: 43, y: 44, width: 13, height: 10 },
            { type: "bushes", x: 69, y: 45, width: 23, height: 11 },
            { type: "log", x: 22, y: 68, width: 12, height: 8 },
            { type: "rocks", x: 66, y: 68, width: 14, height: 8 }
        ]
    };

    // Durante o teste, todas as cenas usam temporariamente o mesmo cenário.
    const sceneGameplay = Object.fromEntries(
        Array.from({ length: 14 }, (_, index) => [index + 1, testScene])
    );

    // Os pontos representam elementos encontrados no mundo, não opções de menu.
    // Na cena 8, a decisão é tomada pela ação do jogador sobre o elemento.
    const scenePoints = {
        1: [{ x: 88, y: 72, label: "Investigar", action: "advance" }],
        2: [{ x: 50, y: 55, label: "Investigar", action: "advance" }],
        3: [{ x: 76, y: 62, label: "Investigar", action: "advance" }],
        4: [{ x: 55, y: 68, label: "Investigar", action: "advance" }],
        5: [{ x: 72, y: 70, label: "Investigar", action: "advance" }],
        6: [
            { x: 30, y: 56, label: "Examinar pegadas", action: "clue", clue: "tracks" },
            { x: 70, y: 56, label: "Examinar pelos", action: "clue", clue: "fur" },
            { x: 50, y: 74, label: "Continuar", action: "advance" }
        ],
        7: [
            { x: 30, y: 58, label: "Examinar sangue", action: "clue", clue: "blood" },
            { x: 70, y: 58, label: "Recolher galho espinhoso", action: "item", item: "thorn_branch" },
            { x: 50, y: 74, label: "Continuar", action: "advance" }
        ],
        8: [
            { x: 25, y: 58, label: "Ler o livro", action: "clue", clue: "field_book" },
            { x: 50, y: 58, label: "Recolher explosivo improvisado", action: "item", item: "improvised_grenade" },
            { x: 75, y: 58, label: "Verificar arma e cordas", action: "item", item: "weapon_and_rope" }
        ],
        9: [{ x: 52, y: 55, label: "Investigar", action: "advance" }],
        10: [{ x: 58, y: 57, label: "Investigar", action: "advance" }],
        11: [{ x: 48, y: 60, label: "Investigar", action: "advance" }],
        12: [{ x: 68, y: 64, label: "Investigar", action: "advance" }],
        13: [{ x: 58, y: 65, label: "Investigar", action: "advance" }],
        14: [{ x: 52, y: 62, label: "Investigar", action: "advance" }]
    };

    function boot() {
        layer = document.getElementById("exploration-layer");
        player = document.getElementById("player");
        prompt = document.getElementById("interaction-prompt");
        if (!layer || !player) return;

        syncDiscoveredItems();
        createScenePoints();
        createTestMap();
        bindControls();
        syncScene();
        renderPlayer();
        animationFrame = requestAnimationFrame(loop);

        const container = document.getElementById("game-container");
        if (container) {
            new MutationObserver(syncScene).observe(container, {
                attributes: true,
                attributeFilter: ["data-scene"]
            });
        }

        const choicesOverlay = document.getElementById("choices-overlay");
        if (choicesOverlay) {
            new MutationObserver(() => {
                if (choicesOverlay.classList.contains("active")) updatePrompt();
            }).observe(choicesOverlay, {
                attributes: true,
                attributeFilter: ["class"]
            });
        }
    }

    function bindControls() {
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("keyup", event => keys.delete(event.key), true);
        window.addEventListener("blur", () => keys.clear());

        layer.addEventListener("click", event => {
            const point = event.target.closest(".interaction-point");
            if (point) interact(Number(point.dataset.index));
        });
    }

    function onKeyDown(event) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

        const movementKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "w", "a", "s", "d", "W", "A", "S", "D"];
        if (movementKeys.includes(event.key)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            keys.add(event.key);
            return;
        }

        // Enter, Espaço e Seta para direita pertencem ao motor narrativo.
        // A exploração usa exclusivamente E para interagir, evitando bloquear diálogos.
        if (event.key === "e" || event.key === "E") {
            const blocked = document.querySelector(".modal.active, .overlay.active");
            if (blocked) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            interactNearest();
        }
    }

    function loop(time) {
        const dt = Math.min((time - lastTime) / 1000 || 0, 0.05);
        lastTime = time;
        movePlayer(dt);
        animationFrame = requestAnimationFrame(loop);
    }

    function movePlayer(dt) {
        if (!player) return;

        const blocked = document.querySelector(".modal.active, .overlay.active");
        if (blocked) {
            keys.clear();
            player.classList.remove("is-walking");
            return;
        }

        let dx = 0;
        let dy = 0;
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
        if (keys.has("d") || keys.has("D")) dx += 1;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
        if (!dx && !dy) {
            player.classList.remove("is-walking");
            return;
        }
        player.classList.add("is-walking");

        const length = Math.hypot(dx, dy) || 1;
        const nextX = x + (dx / length) * speed * dt;
        const nextY = y + (dy / length) * speed * dt;

        if (!collides(nextX, nextY)) {
            x = Math.max(7, Math.min(93, nextX));
            y = Math.max(18, Math.min(82, nextY));
        } else {
            if (!collides(nextX, y)) x = Math.max(7, Math.min(93, nextX));
            if (!collides(x, nextY)) y = Math.max(18, Math.min(82, nextY));
        }

        renderPlayer();
        updatePrompt();
    }

    function collides(testX, testY) {
        const config = sceneGameplay[currentScene];
        if (!config?.collisions) return false;

        return config.collisions.some(box =>
            testX + playerRadius > box.x &&
            testX - playerRadius < box.x + box.width &&
            testY + playerRadius > box.y &&
            testY - playerRadius < box.y + box.height
        );
    }

    function syncScene() {
        const scene = Number(document.getElementById("game-container")?.dataset.scene);
        if (!Number.isFinite(scene) || scene === currentScene) return;

        currentScene = scene;
        x = 50;
        y = 72;
        syncDiscoveredItems();
        createScenePoints();
        createTestMap();
        renderPlayer();
    }

    function syncDiscoveredItems() {
        const state = window.Investigation?.getState();
        if (!state) return;

        discoveredItems.clear();
        [...(state.clues || []), ...(state.items || [])].forEach(id => discoveredItems.add(id));
    }

    // Chamado pelo restaurador depois de aplicar um save, inclusive quando
    // a cena restaurada é a mesma que já estava carregada.
    window.refreshExplorationState = function refreshExplorationState() {
        syncDiscoveredItems();
        createScenePoints();
        updatePrompt();
    };

    function createTestMap() {
        if (!layer) return;

        layer.querySelectorAll(".test-map, .collision-box").forEach(element => element.remove());

        const config = sceneGameplay[currentScene];
        if (!config?.testMap) return;

        const map = document.createElement("div");
        map.className = "test-map";
        map.setAttribute("aria-hidden", "true");

        config.decorations.forEach(decoration => {
            const element = document.createElement("div");
            element.className = `test-object test-object-${decoration.type}`;
            element.style.left = `${decoration.x}%`;
            element.style.top = `${decoration.y}%`;
            element.style.width = `${decoration.width}%`;
            element.style.height = `${decoration.height}%`;
            map.appendChild(element);
        });

        config.collisions.forEach(box => {
            const element = document.createElement("div");
            element.className = "collision-box";
            element.style.left = `${box.x}%`;
            element.style.top = `${box.y}%`;
            element.style.width = `${box.width}%`;
            element.style.height = `${box.height}%`;
            element.textContent = box.label;
            element.setAttribute("aria-hidden", "true");
            layer.appendChild(element);
        });

        layer.insertBefore(map, player);
    }

    function createScenePoints() {
        if (!layer) return;

        layer.querySelectorAll(".interaction-point").forEach(point => point.remove());

        (scenePoints[currentScene] || []).forEach((point, index) => {
            if (["clue", "item"].includes(point.action) && discoveredItems.has(point.clue || point.item)) return;

            const button = document.createElement("button");
            button.type = "button";
            button.className = `interaction-point ${["clue", "item"].includes(point.action) ? "discovery-point" : "advance-point"}`;
            button.dataset.index = String(index);
            button.style.left = `${point.x}%`;
            button.style.top = `${point.y}%`;
            button.innerHTML = `<span class="interaction-icon">${["clue", "item"].includes(point.action) ? "◆" : "•"}</span>`;
            button.setAttribute("aria-label", point.label);
            layer.appendChild(button);
        });

        updatePrompt();
    }

    function renderPlayer() {
        if (!player) return;
        player.style.left = `${x}%`;
        player.style.top = `${y}%`;
    }

    function nearestPoint() {
        let best = null;
        let distance = Infinity;

        (scenePoints[currentScene] || []).forEach((point, index) => {
            if (["clue", "item"].includes(point.action) && discoveredItems.has(point.clue || point.item)) return;

            const currentDistance = Math.hypot(x - point.x, y - point.y);
            if (currentDistance < distance) {
                distance = currentDistance;
                best = { point, index, distance: currentDistance };
            }
        });

        return best;
    }

    function updatePrompt() {
        if (!prompt) return;

        const nearest = nearestPoint();
        if (!nearest || nearest.distance > 13) {
            prompt.hidden = true;
            return;
        }

        prompt.hidden = false;
        prompt.textContent = `E — ${["clue", "item"].includes(nearest.point.action) ? "Examinar" : "Investigar"}`;
    }

    function interactNearest() {
        const nearest = nearestPoint();
        if (nearest && nearest.distance <= 13) interact(nearest.index);
    }

    function interact(index) {
        if (document.querySelector(".modal.active, .overlay.active")) return;
        const point = (scenePoints[currentScene] || [])[index];
        if (!point) return;

        if (point.action === "clue" || point.action === "item") {
            const key = point.clue || point.item;
            discoveredItems.add(key);
            if (point.action === "clue") window.Investigation?.addClue(point.clue);
            else window.Investigation?.addItem(point.item);
            createScenePoints();
            return;
        }

        if (point.action === "advance" && typeof window.advanceScene === "function") {
            window.advanceScene();
        }
    }

    window.addEventListener("beforeunload", () => {
        if (animationFrame) cancelAnimationFrame(animationFrame);
    });

    if (document.readyState === "loading") {
        window.addEventListener("load", boot, { once: true });
    } else {
        boot();
    }
})();
