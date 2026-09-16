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

    const scenePoints = {
        1: [{ x: 82, y: 72, label: "Entrada", action: "advance" }],
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
            keys.add(event.key);
            return;
        }

        if (event.key === "e" || event.key === "E") {
            event.preventDefault();
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
        x = Math.max(7, Math.min(93, x + (dx / length) * speed * dt));
        y = Math.max(18, Math.min(82, y + (dy / length) * speed * dt));
        renderPlayer();
        updatePrompt();
    }

    function syncScene() {
        const scene = Number(document.getElementById("game-container")?.dataset.scene);
        if (!Number.isFinite(scene) || scene === currentScene) return;

        currentScene = scene;
        x = 50;
        y = 72;
        createScenePoints();
        renderPlayer();
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
