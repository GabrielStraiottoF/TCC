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

    const scenePoints = {
        1: [{ x: 88, y: 72, label: "Entrada", action: "advance" }],
        2: [{ x: 50, y: 55, label: "Corredor do ônibus", action: "advance" }],
        3: [{ x: 76, y: 62, label: "Pier", action: "advance" }],
        4: [{ x: 55, y: 68, label: "Margem do rio", action: "advance" }],
        5: [{ x: 72, y: 70, label: "Entrada da mata", action: "advance" }],
        6: [{ x: 50, y: 62, label: "Clareira", action: "advance" }],
        7: [{ x: 70, y: 55, label: "Rastro", action: "advance" }],
        8: [
            { x: 25, y: 58, label: "Armadilha e granada", action: "choice", index: 0 },
            { x: 50, y: 58, label: "Arma", action: "choice", index: 1 },
            { x: 75, y: 58, label: "Cordas", action: "choice", index: 2 }
        ],
        9: [{ x: 52, y: 55, label: "Local da explosão", action: "advance" }],
        10: [{ x: 58, y: 57, label: "Ponto fraco", action: "advance" }],
        11: [{ x: 48, y: 60, label: "Armadilha", action: "advance" }],
        12: [{ x: 68, y: 64, label: "Trilha", action: "advance" }],
        13: [{ x: 58, y: 65, label: "Estrada", action: "advance" }],
        14: [{ x: 52, y: 62, label: "Opala", action: "advance" }]
    };

    function boot() {
        layer = document.getElementById("exploration-layer");
        player = document.getElementById("player");
        prompt = document.getElementById("interaction-prompt");
        if (!layer || !player) return;

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
                if (currentScene === 8 && choicesOverlay.classList.contains("active")) {
                    choicesOverlay.classList.remove("active");
                    updatePrompt();
                }
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

        const movementKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];
        if (movementKeys.includes(event.key)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            keys.add(event.key);
            return;
        }

        if (["Enter", " ", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            interactNearest();
            return;
        }

        if (event.key === "e" || event.key === "E") {
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
        if (blocked) return;

        let dx = 0;
        let dy = 0;
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) dx -= 1;
        if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) dx += 1;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) dy -= 1;
        if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) dy += 1;
        if (!dx && !dy) return;

        const length = Math.hypot(dx, dy) || 1;
        const nextX = x + (dx / length) * speed * dt;
        const nextY = y + (dy / length) * speed * dt;

        // Teste simples de colisão AABB: o personagem não atravessa as caixas.
        if (!collides(nextX, nextY)) {
            x = Math.max(7, Math.min(93, nextX));
            y = Math.max(18, Math.min(82, nextY));
        } else {
            // Permite deslizar pela lateral de um obstáculo.
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
        createScenePoints();
        createTestMap();
        renderPlayer();
    }

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
            const button = document.createElement("button");
            button.type = "button";
            button.className = "interaction-point";
            button.dataset.index = String(index);
            button.style.left = `${point.x}%`;
            button.style.top = `${point.y}%`;
            button.innerHTML = `<span class="interaction-icon">◆</span><span>${escapeHtml(point.label)}</span>`;
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
        prompt.textContent = `E — ${nearest.point.label}`;
    }

    function interactNearest() {
        const nearest = nearestPoint();
        if (nearest && nearest.distance <= 13) interact(nearest.index);
    }

    function interact(index) {
        const point = (scenePoints[currentScene] || [])[index];
        if (!point) return;

        if (point.action === "choice" && typeof window.chooseScene8 === "function") {
            window.chooseScene8(point.index);
            return;
        }

        if (point.action === "advance" && typeof window.advanceScene === "function") {
            window.advanceScene();
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
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
