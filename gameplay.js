// Camada de exploração 2D sobre o motor narrativo existente.
// Não altera roteiro.json nem os textos narrativos.
(() => {
    // true mostra o mapa de teste (fundo CSS e caixas de colisão) nas cenas sem mapa próprio.
    const SHOW_TEST_MAP = false;
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
    const RUN_MULTIPLIER = 1.7;
    // Entrada dos controles de toque: joystick (-1..1) e botão de correr.
    const touch = { dx: 0, dy: 0, run: false };
    let jumpTimer = null;
    const clampAxis = value => Math.max(-1, Math.min(1, value));

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

    // Mapas próprios das cenas de investigação. Coordenadas e colisões usam
    // percentuais da área jogável; as áreas livres preservam acesso aos pontos.
    const investigationScenes = {
        6: {
            mapClass: "scene-map-6",
            mapTitle: "CLAREIRA DESTRUÍDA",
            collisions: [
                { x: 5, y: 14, width: 17, height: 28, label: "Árvore caída" },
                { x: 78, y: 12, width: 17, height: 30, label: "Troncos" },
                { x: 29, y: 22, width: 13, height: 11, label: "Raízes" },
                { x: 60, y: 28, width: 14, height: 10, label: "Destroços" },
                { x: 15, y: 66, width: 18, height: 9, label: "Galhos" },
                { x: 70, y: 67, width: 17, height: 10, label: "Raízes" }
            ],
            decorations: [
                { type: "fallen-tree", x: 3, y: 13, width: 22, height: 15 },
                { type: "broken-trunk", x: 78, y: 10, width: 18, height: 31 },
                { type: "roots", x: 27, y: 21, width: 16, height: 13 },
                { type: "debris", x: 58, y: 27, width: 17, height: 12 },
                { type: "tracks", x: 23, y: 47, width: 17, height: 13 },
                { type: "fur", x: 64, y: 45, width: 13, height: 12 },
                { type: "debris", x: 13, y: 65, width: 21, height: 11 },
                { type: "roots", x: 68, y: 65, width: 20, height: 12 }
            ]
        },
        7: {
            mapClass: "scene-map-7",
            mapTitle: "TRILHA DA PERSEGUIÇÃO",
            collisions: [
                { x: 4, y: 12, width: 19, height: 34, label: "Vegetação densa" },
                { x: 77, y: 10, width: 19, height: 36, label: "Vegetação densa" },
                { x: 28, y: 28, width: 12, height: 15, label: "Tronco" },
                { x: 59, y: 19, width: 13, height: 16, label: "Tronco" },
                { x: 10, y: 67, width: 17, height: 10, label: "Arbusto" },
                { x: 75, y: 64, width: 18, height: 12, label: "Arbusto" }
            ],
            decorations: [
                { type: "dense-forest", x: 2, y: 10, width: 22, height: 39 },
                { type: "dense-forest", x: 76, y: 8, width: 22, height: 41 },
                { type: "trunk", x: 27, y: 27, width: 14, height: 17 },
                { type: "trunk", x: 58, y: 18, width: 15, height: 18 },
                { type: "blood-trail", x: 23, y: 48, width: 15, height: 12 },
                { type: "thorn-bush", x: 66, y: 52, width: 19, height: 17 },
                { type: "bent-grass", x: 39, y: 17, width: 19, height: 10 },
                { type: "bent-grass", x: 39, y: 63, width: 20, height: 10 }
            ]
        },
        8: {
            mapClass: "scene-map-8",
            mapTitle: "ACAMPAMENTO ABANDONADO",
            collisions: [
                { x: 8, y: 17, width: 22, height: 23, label: "Barraca" },
                { x: 69, y: 16, width: 22, height: 24, label: "Barraca" },
                { x: 37, y: 18, width: 23, height: 12, label: "Mesa" },
                { x: 15, y: 61, width: 15, height: 11, label: "Caixas" },
                { x: 73, y: 61, width: 15, height: 11, label: "Suprimentos" }
            ],
            decorations: [
                { type: "tent", x: 7, y: 15, width: 24, height: 26 },
                { type: "tent", x: 68, y: 14, width: 24, height: 27 },
                { type: "supply-table", x: 36, y: 17, width: 25, height: 13 },
                { type: "campfire", x: 43, y: 43, width: 15, height: 16 },
                { type: "book-site", x: 17, y: 48, width: 16, height: 12 },
                { type: "crate", x: 13, y: 60, width: 18, height: 13 },
                { type: "bedroll", x: 66, y: 47, width: 17, height: 12 },
                { type: "crate", x: 72, y: 60, width: 18, height: 13 }
            ]
        }
    };

    // As demais cenas mantêm o mapa de teste atual enquanto são trabalhadas.
    const sceneGameplay = Object.fromEntries(
        Array.from({ length: 14 }, (_, index) => [index + 1, testScene])
    );
    Object.assign(sceneGameplay, investigationScenes);

    // Os pontos representam elementos encontrados no mundo, não opções de menu.
    // Na cena 8, a decisão é tomada pela ação do jogador sobre o elemento.
    const scenePoints = {
        1: [{ x: 88, y: 72, label: "Investigar", action: "advance" }],
        2: [{ x: 50, y: 55, label: "Investigar", action: "advance" }],
        3: [{ x: 76, y: 62, label: "Investigar", action: "advance" }],
        4: [{ x: 55, y: 68, label: "Investigar", action: "advance" }],
        5: [{ x: 72, y: 70, label: "Investigar", action: "advance" }],
        6: [
            { x: 31, y: 54, label: "Examinar pegadas", action: "clue", clue: "tracks" },
            { x: 70, y: 51, label: "Examinar pelos", action: "clue", clue: "fur" },
            { x: 50, y: 22, label: "Seguir pela clareira", action: "advance" }
        ],
        7: [
            { x: 29, y: 55, label: "Examinar sangue", action: "clue", clue: "blood" },
            { x: 73, y: 58, label: "Recolher galho espinhoso", action: "item", item: "thorn_branch" },
            { x: 50, y: 19, label: "Escapar da perseguição", action: "advance" }
        ],
        8: [
            { x: 25, y: 54, label: "Ler o livro", action: "clue", clue: "field_book" },
            { x: 50, y: 64, label: "Recolher explosivo improvisado", action: "item", item: "improvised_grenade" },
            { x: 77, y: 54, label: "Verificar arma e cordas", action: "item", item: "weapon_and_rope" }
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
        bindTouch();
        window.ExplorationControls = {
            setMove(dx, dy) { touch.dx = clampAxis(dx); touch.dy = clampAxis(dy); },
            setRun(on) { touch.run = !!on; },
            jump,
            interact: interactNearest
        };

        layer.addEventListener("click", event => {
            const point = event.target.closest(".interaction-point");
            if (point) interact(Number(point.dataset.index));
        });
    }

    function bindTouch() {
        const controls = document.getElementById("touch-controls");
        const joystick = document.getElementById("joystick");
        const knob = document.getElementById("joystick-knob");
        if (!controls || !joystick || !knob) return;
        controls.hidden = !window.matchMedia("(pointer: coarse)").matches;
        if (controls.hidden) return;

        let joystickPointer = null;
        const moveKnob = event => {
            const rect = joystick.getBoundingClientRect();
            const max = rect.width / 2;
            let dx = event.clientX - (rect.left + max);
            let dy = event.clientY - (rect.top + max);
            const distance = Math.hypot(dx, dy);
            if (distance > max) { dx = dx * max / distance; dy = dy * max / distance; }
            knob.style.transform = `translate(${dx}px, ${dy}px)`;
            window.ExplorationControls.setMove(dx / max, dy / max);
        };
        const releaseKnob = event => {
            if (event.pointerId !== joystickPointer) return;
            joystickPointer = null;
            knob.style.transform = "";
            window.ExplorationControls.setMove(0, 0);
        };
        joystick.addEventListener("pointerdown", event => {
            joystickPointer = event.pointerId;
            joystick.setPointerCapture(event.pointerId);
            moveKnob(event);
        });
        joystick.addEventListener("pointermove", event => {
            if (event.pointerId === joystickPointer) moveKnob(event);
        });
        joystick.addEventListener("pointerup", releaseKnob);
        joystick.addEventListener("pointercancel", releaseKnob);

        const run = document.getElementById("btn-touch-run");
        const setRunButton = on => {
            window.ExplorationControls.setRun(on);
            run.classList.toggle("is-pressed", on);
        };
        run.addEventListener("pointerdown", event => { run.setPointerCapture(event.pointerId); setRunButton(true); });
        run.addEventListener("pointerup", () => setRunButton(false));
        run.addEventListener("pointercancel", () => setRunButton(false));
        run.addEventListener("lostpointercapture", () => setRunButton(false));

        document.getElementById("btn-touch-jump")?.addEventListener("click", () => window.ExplorationControls.jump());
        document.getElementById("btn-touch-interact")?.addEventListener("click", () => window.ExplorationControls.interact());
    }

    function onKeyDown(event) {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;

        const movementKeys = ["w", "a", "s", "d", "W", "A", "S", "D"];
        if (movementKeys.includes(event.key)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            keys.add(event.key);
            return;
        }

        // Shift corre (segurado) e Q pula. Ambos são ignorados enquanto há janelas abertas.
        if (event.key === "Shift") {
            keys.add("Shift");
            return;
        }
        if (event.key === "q" || event.key === "Q") {
            const blocked = document.querySelector(".modal.active, .overlay.active");
            if (blocked || event.repeat) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            jump();
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

    function setRunning(on) {
        if (!player) return;
        player.classList.toggle("is-running", !!on && player.classList.contains("is-walking"));
    }

    function jump() {
        if (!player || jumpTimer || document.querySelector(".modal.active, .overlay.active")) return;
        player.classList.add("is-jumping");
        jumpTimer = setTimeout(() => {
            player.classList.remove("is-jumping");
            jumpTimer = null;
        }, 520);
    }

    function movePlayer(dt) {
        if (!player) return;

        const blocked = document.querySelector(".modal.active, .overlay.active");
        if (blocked) {
            keys.clear();
            touch.dx = 0;
            touch.dy = 0;
            setRunning(false);
            player.classList.remove("is-walking");
            return;
        }

        let dx = touch.dx;
        let dy = touch.dy;
        if (keys.has("a") || keys.has("A")) dx -= 1;
        if (keys.has("d") || keys.has("D")) dx += 1;
        if (keys.has("w") || keys.has("W")) dy -= 1;
        if (keys.has("s") || keys.has("S")) dy += 1;
        dx = clampAxis(dx);
        dy = clampAxis(dy);

        // O joystick é analógico: a intensidade do toque define a velocidade.
        const magnitude = Math.min(1, Math.hypot(dx, dy));
        if (!magnitude) {
            setRunning(false);
            player.classList.remove("is-walking");
            return;
        }
        player.classList.add("is-walking");
        const runActive = touch.run || keys.has("Shift");
        setRunning(runActive);

        const length = Math.hypot(dx, dy) || 1;
        const step = speed * (runActive ? RUN_MULTIPLIER : 1) * magnitude * dt;
        const nextX = x + (dx / length) * step;
        const nextY = y + (dy / length) * step;

        if (!collides(nextX, nextY)) {
            x = Math.max(7, Math.min(93, nextX));
            y = Math.max(18, Math.min(82, nextY));
        } else {
            if (!collides(nextX, y)) x = Math.max(7, Math.min(93, nextX));
            if (!collides(x, nextY)) y = Math.max(18, Math.min(82, nextY));
        }

        renderPlayer();
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

        layer.querySelectorAll(".test-map, .scene-map, .collision-box").forEach(element => element.remove());

        const config = sceneGameplay[currentScene];
        if (!config?.decorations?.length) return;
        // Sem o mapa de teste visível, o fundo da cena aparece. As colisões continuam ativas.
        if (!config.mapClass && !SHOW_TEST_MAP) return;

        const map = document.createElement("div");
        map.className = config.mapClass ? `scene-map ${config.mapClass}` : "test-map";
        map.setAttribute("aria-hidden", "true");
        if (config.mapTitle) map.setAttribute("data-map-title", config.mapTitle);

        config.decorations.forEach(decoration => {
            const element = document.createElement("div");
            element.className = `test-object test-object-${decoration.type}`;
            element.style.left = `${decoration.x}%`;
            element.style.top = `${decoration.y}%`;
            element.style.width = `${decoration.width}%`;
            element.style.height = `${decoration.height}%`;
            map.appendChild(element);
        });

        if (!config.mapClass) {
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
        }

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
