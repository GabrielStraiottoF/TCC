// Estado global do jogo
let roteiro = null;
let currentSceneIndex = 0;
let currentEventIndex = 0;
let currentDialogueIndex = -1;
let currentState = "loading";
let sceneLog = [];

// Estado do efeito de texto
let typewriterText = "";
let typewriterIndex = 0;
let typewriterInterval = null;
let isTyping = false;
let currentOnComplete = null;
let endingInterval = null;

// Elementos principais da interface
const dialogText = document.getElementById("dialog-text");
const nameTag = document.getElementById("name-tag");
const dialogBox = document.getElementById("dialog-box");
const gameContainer = document.getElementById("game-container");

const characterColors = {
    "Alex": "#8c2a2a",
    "Lucas": "#cfab3c",
    "José": "#2a7da8",
    "Claudio": "#2aa84e",
    "Mecânico": "#6e6e6e",
    "Mapinguari": "#a82a8c"
};

const characterImages = {
    "Alex": "imagens/alex.png",
    "Mapinguari": "imagens/mapinguari.png",
    "Lucas": "imagens/lucas.png",
    "José": "imagens/jose.png",
    "Claudio": "imagens/claudio.png",
    "Mecânico": "imagens/mecanico.png"
};

// As três decisões da cena 8 correspondem aos caminhos do roteiro.
const scene8Choices = [
    { label: "Usar a armadilha de espinhos e a granada", sceneId: 9 },
    { label: "Usar a arma e atingir o ponto fraco", sceneId: 10 },
    { label: "Montar uma armadilha com cordas", sceneId: 11 }
];

window.addEventListener("load", fetchRoteiro);

async function fetchRoteiro() {
    const loadingOverlay = document.getElementById("loading-overlay");
    const errorOverlay = document.getElementById("error-overlay");
    const errorMessage = document.getElementById("error-message");
    const corsNotice = document.getElementById("cors-notice");

    try {
        const response = await fetch("roteiro.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        validateRoteiro(data);
        roteiro = data;

        loadingOverlay?.classList.remove("active");
        setupGameControls();
        buildSceneMap();
        loadScene(0);
    } catch (err) {
        console.error("Erro ao inicializar o roteiro:", err);
        loadingOverlay?.classList.remove("active");
        errorOverlay?.classList.add("active");
        if (errorMessage) errorMessage.textContent = `Falha ao ler roteiro.json: ${err.message}`;
        if (window.location.protocol === "file:" && corsNotice) {
            corsNotice.style.display = "block";
        }
    }
}

function validateRoteiro(data) {
    if (!data || typeof data !== "object") {
        throw new Error("O roteiro não contém um objeto válido.");
    }
    if (!Array.isArray(data.personagens)) {
        throw new Error("A chave 'personagens' deve ser um Array.");
    }
    if (!Array.isArray(data.cenas) || data.cenas.length === 0) {
        throw new Error("O roteiro deve conter pelo menos uma cena.");
    }

    const ids = new Set();
    data.cenas.forEach((scene, index) => {
        if (scene.id === undefined || scene.id === null) {
            throw new Error(`Cena na posição ${index} está sem identificador.`);
        }
        const normalizedId = Number(scene.id);
        const idKey = Number.isNaN(normalizedId) ? String(scene.id) : normalizedId;
        if (ids.has(idKey)) {
            throw new Error(`O identificador da cena ${scene.id} está duplicado.`);
        }
        ids.add(idKey);

        if (typeof scene.local !== "string") scene.local = "Cena sem nome";
        if (!Array.isArray(scene.eventos)) scene.eventos = [];
        if (!Array.isArray(scene.dialogos)) scene.dialogos = [];

        scene.dialogos.forEach(dialogue => {
            if (typeof dialogue.personagem !== "string") dialogue.personagem = "Desconhecido";
            if (typeof dialogue.fala !== "string") dialogue.fala = "...";
        });
    });
}

function setupGameControls() {
    const btnLog = document.getElementById("btn-log");
    const btnMap = document.getElementById("btn-map");
    const btnRestart = document.getElementById("btn-restart");
    const closeLog = document.getElementById("close-log");
    const closeMap = document.getElementById("close-map");
    const retryChoice = document.getElementById("btn-retry-choice");
    const restartGameOver = document.getElementById("btn-restart-gameover");
    const restartEnding = document.getElementById("btn-restart-ending");

    btnLog?.addEventListener("click", event => {
        event.stopPropagation();
        openLogModal();
    });

    btnMap?.addEventListener("click", event => {
        event.stopPropagation();
        openMapModal();
    });

    btnRestart?.addEventListener("click", event => {
        event.stopPropagation();
        if (confirm("Deseja reiniciar a história do início?")) restartGame();
    });

    closeLog?.addEventListener("click", () => {
        document.getElementById("log-modal")?.classList.remove("active");
    });

    closeMap?.addEventListener("click", () => {
        document.getElementById("map-modal")?.classList.remove("active");
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) modal.classList.remove("active");
        });
    });

    retryChoice?.addEventListener("click", () => {
        const scene8Index = findSceneIndex(8);
        if (scene8Index !== -1) loadScene(scene8Index);
    });

    restartGameOver?.addEventListener("click", restartGame);
    restartEnding?.addEventListener("click", restartGame);

    dialogBox?.addEventListener("click", event => {
        event.stopPropagation();
        if (currentState === "running") advanceScene();
    });

    document.addEventListener("keydown", event => {
        if (document.querySelector(".modal.active")) return;

        if (currentState === "choice") {
            if (["1", "2", "3"].includes(event.key)) {
                event.preventDefault();
                chooseScene8(Number(event.key) - 1);
            }
            return;
        }

        if (currentState !== "running") return;

        if (["Enter", " ", "ArrowRight"].includes(event.key)) {
            event.preventDefault();
            advanceScene();
        }
    });
}

function restartGame() {
    clearTypewriter();
    clearInterval(endingInterval);
    sceneLog = [];
    currentSceneIndex = 0;
    currentEventIndex = 0;
    currentDialogueIndex = -1;
    currentState = "running";
    loadScene(0);
}

function findSceneIndex(sceneId) {
    if (!roteiro) return -1;
    return roteiro.cenas.findIndex(scene => Number(scene.id) === Number(sceneId));
}

function loadScene(sceneIndex) {
    if (!roteiro || sceneIndex < 0 || sceneIndex >= roteiro.cenas.length) return;

    clearTypewriter();
    clearInterval(endingInterval);
    currentSceneIndex = sceneIndex;
    currentEventIndex = 0;
    currentDialogueIndex = -1;
    currentState = "running";
    sceneLog = [];

    hideAllOverlays();

    const scene = roteiro.cenas[currentSceneIndex];
    const topNav = document.getElementById("top-nav");
    const dialogWrapper = document.getElementById("dialog-wrapper");
    const sceneBadge = document.getElementById("scene-badge");
    const sceneLocation = document.getElementById("scene-location");

    if (topNav) topNav.style.display = "flex";
    if (dialogWrapper) dialogWrapper.style.display = "flex";
    if (sceneBadge) sceneBadge.textContent = `Cena ${scene.id}`;
    if (sceneLocation) sceneLocation.textContent = scene.local;
    document.title = `Sobrenatural: O Mapinguari — ${scene.local}`;

    updateBackground(scene.id);
    updateSceneMapSelection();
    advanceScene();
}

function hideAllOverlays() {
    ["choices-overlay", "gameover-overlay", "ending-overlay", "log-modal", "map-modal"].forEach(id => {
        document.getElementById(id)?.classList.remove("active");
    });
}

function updateBackground(sceneId) {
    // O cenário é controlado exclusivamente pelo CSS através de data-scene.
    // Não usamos background-image inline, para não sobrescrever backgrounds.css.
    if (!gameContainer) return;
    gameContainer.dataset.scene = String(sceneId);
}

function renderCharacterPortrait(name) {
    const portraitContainer = document.getElementById("portrait-container");
    if (!portraitContainer) return;

    const imageUrl = characterImages[name];
    const color = characterColors[name] || "#555";
    const initial = name ? name.charAt(0).toUpperCase() : "?";

    portraitContainer.innerHTML = "";

    if (!imageUrl) {
        renderPortraitFallback(initial, color);
        return;
    }

    const img = new Image();
    img.className = "portrait";
    img.alt = `Retrato de ${name}`;
    img.onload = () => portraitContainer.replaceChildren(img);
    img.onerror = () => renderPortraitFallback(initial, color);
    img.src = imageUrl;
}

function renderPortraitFallback(initial, color) {
    const portraitContainer = document.getElementById("portrait-container");
    if (!portraitContainer) return;

    portraitContainer.innerHTML = `
        <div class="portrait-fallback" style="--fallback-color: ${escapeHtml(color)};">
            ${escapeHtml(initial)}
        </div>
    `;
}

function advanceScene() {
    if (!roteiro || currentState !== "running") return;

    if (isTyping) {
        finishTypewriter();
        return;
    }

    const scene = roteiro.cenas[currentSceneIndex];
    if (!scene) return;

    updateBackground(scene.id);

    // Eventos narrativos vêm antes dos diálogos.
    if (currentEventIndex < scene.eventos.length) {
        const eventText = scene.eventos[currentEventIndex];
        nameTag.textContent = "Narrativa";
        nameTag.className = "name-tag narration-tag";
        dialogBox.className = "dialog-box narration-style";
        renderPortraitFallback("N", "#2b2b2b");
        addToLog("narration", null, eventText);

        startTypewriter(eventText, dialogText, () => {
            currentEventIndex++;
        });
        return;
    }

    if (currentDialogueIndex === -1) currentDialogueIndex = 0;

    if (currentDialogueIndex < scene.dialogos.length) {
        const dialogue = scene.dialogos[currentDialogueIndex];
        nameTag.textContent = dialogue.personagem;
        nameTag.className = "name-tag";
        dialogBox.className = "dialog-box";
        renderCharacterPortrait(dialogue.personagem);
        addToLog("dialogue", dialogue.personagem, dialogue.fala);

        startTypewriter(dialogue.fala, dialogText, () => {
            currentDialogueIndex++;
        });
        return;
    }

    if (Number(scene.id) === 8) {
        showScene8Choices();
        return;
    }

    if (Number(scene.id) === 11) {
        showGameOver();
        return;
    }

    const nextSceneId = getNextSceneId(scene);
    if (nextSceneId === null) {
        showEnding();
        return;
    }

    const nextSceneIndex = findSceneIndex(nextSceneId);
    if (nextSceneIndex === -1) {
        showEnding();
        return;
    }

    loadScene(nextSceneIndex);
}

function getNextSceneId(scene) {
    const next = scene.proximaCena ?? scene.proxima_cena ?? scene.nextScene ?? scene.proxima;
    if (next === undefined || next === null || next === "") return null;
    const numeric = Number(next);
    return Number.isNaN(numeric) ? next : numeric;
}

function showScene8Choices() {
    currentState = "choice";
    const overlay = document.getElementById("choices-overlay");
    const container = document.getElementById("choices-container");
    if (!overlay || !container) return;

    container.innerHTML = "";

    scene8Choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.className = "choice-btn";
        button.type = "button";
        button.innerHTML = `
            <span class="choice-key">${index + 1}</span>
            <span>${escapeHtml(choice.label)}</span>
        `;
        button.addEventListener("click", event => {
            event.stopPropagation();
            chooseScene8(index);
        });
        container.appendChild(button);
    });

    overlay.classList.add("active");
}

function chooseScene8(index) {
    const choice = scene8Choices[index];
    if (!choice) return;

    const targetIndex = findSceneIndex(choice.sceneId);
    if (targetIndex === -1) {
        showGameOver();
        return;
    }

    loadScene(targetIndex);
}

function showGameOver() {
    currentState = "gameover";
    document.getElementById("choices-overlay")?.classList.remove("active");
    document.getElementById("gameover-overlay")?.classList.add("active");
}

function showEnding() {
    currentState = "ending";
    document.getElementById("choices-overlay")?.classList.remove("active");
    document.getElementById("ending-overlay")?.classList.add("active");

    const endingText = document.getElementById("ending-text");
    const endingActions = document.getElementById("ending-actions");
    const finalMessage = "Onde existe um… existem outros.";

    if (!endingText) return;
    endingText.textContent = "";
    if (endingActions) endingActions.style.display = "none";

    let index = 0;
    clearInterval(endingInterval);
    endingInterval = setInterval(() => {
        endingText.textContent += finalMessage.charAt(index++);
        if (index >= finalMessage.length) {
            clearInterval(endingInterval);
            if (endingActions) endingActions.style.display = "block";
        }
    }, 55);
}

function startTypewriter(text, element, onComplete) {
    if (!element) return;

    clearTypewriter();
    typewriterText = String(text ?? "");
    typewriterIndex = 0;
    isTyping = true;
    currentOnComplete = onComplete;
    element.textContent = "";

    if (typewriterText.length === 0) {
        finishTypewriter();
        return;
    }

    typewriterInterval = setInterval(() => {
        element.textContent += typewriterText.charAt(typewriterIndex++);
        if (typewriterIndex >= typewriterText.length) finishTypewriter();
    }, 22);
}

function finishTypewriter() {
    if (!isTyping) return;

    clearInterval(typewriterInterval);
    typewriterInterval = null;
    if (dialogText) dialogText.textContent = typewriterText;
    isTyping = false;

    const callback = currentOnComplete;
    currentOnComplete = null;
    if (typeof callback === "function") callback();
}

function clearTypewriter() {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
    isTyping = false;
    currentOnComplete = null;
}

function addToLog(type, speaker, text) {
    sceneLog.push({ type, speaker, text });
}

function openLogModal() {
    const list = document.getElementById("log-list");
    const modal = document.getElementById("log-modal");
    if (!list || !modal) return;

    list.innerHTML = "";

    if (sceneLog.length === 0) {
        list.innerHTML = "<p>Nenhum registro nesta cena.</p>";
    } else {
        sceneLog.forEach(entry => {
            const item = document.createElement("div");
            item.className = `log-entry ${entry.type}`;

            const title = document.createElement("strong");
            title.className = "log-char";
            title.textContent = entry.speaker || "Narrativa";

            const text = document.createElement("p");
            text.className = "log-text";
            text.textContent = entry.text;

            item.append(title, text);
            list.appendChild(item);
        });
    }

    modal.classList.add("active");
}

function openMapModal() {
    buildSceneMap();
    document.getElementById("map-modal")?.classList.add("active");
}

function buildSceneMap() {
    const map = document.getElementById("scene-map");
    if (!map || !roteiro) return;

    map.innerHTML = "";
    roteiro.cenas.forEach((scene, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scene-card";
        button.dataset.sceneId = scene.id;

        const number = document.createElement("span");
        number.textContent = String(scene.id);

        const location = document.createElement("small");
        location.textContent = scene.local;

        button.append(number, location);
        button.addEventListener("click", () => {
            document.getElementById("map-modal")?.classList.remove("active");
            loadScene(index);
        });
        map.appendChild(button);
    });

    updateSceneMapSelection();
}

function updateSceneMapSelection() {
    const scene = roteiro?.cenas?.[currentSceneIndex];
    if (!scene) return;

    document.querySelectorAll(".scene-card").forEach(item => {
        item.classList.toggle("active", Number(item.dataset.sceneId) === Number(scene.id));
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
