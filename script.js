// Estado global do jogo
let roteiro = null;
let currentSceneIndex = 0;
let currentEventIndex = 0;
let currentDialogueIndex = -1;
let currentState = "loading"; // loading, running, choice, gameover, ending
let sceneLog = [];

// Estado do efeito de texto
let typewriterText = "";
let typewriterIndex = 0;
let typewriterInterval = null;
let isTyping = false;
let currentOnComplete = null;
let endingInterval = null;

// Elementos da interface
const dialogText = document.getElementById("dialog-text");
const nameTag = document.getElementById("name-tag");
const dialogBox = document.getElementById("dialog-box");
const cursorBlink = document.querySelector(".cursor-blink");
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

// Cada cena possui seu próprio fundo. Caso o asset ainda não exista,
// o gradiente correspondente permanece como fallback.
const backgroundImages = {
    1: "imagens/rodoviaria.png",
    2: "imagens/onibus.jpeg",
    3: "imagens/pier.png",
    4: "imagens/rio.png",
    5: "imagens/margem.png",
    6: "imagens/clareira.png",
    7: "imagens/floresta.png",
    8: "imagens/acampamento.png",
    9: "imagens/floresta.png",
    10: "imagens/floresta.png",
    11: "imagens/floresta.png",
    12: "imagens/floresta.png",
    13: "imagens/oficina.png",
    14: "imagens/estrada.png"
};

const backgroundGradients = {
    1: "linear-gradient(135deg, #2b1f0d 0%, #050505 100%)",
    2: "linear-gradient(135deg, #1f1105 0%, #000000 100%)",
    3: "linear-gradient(135deg, #0d2b33 0%, #050b0f 100%)",
    4: "linear-gradient(135deg, #071f1f 0%, #010808 100%)",
    5: "linear-gradient(135deg, #072615 0%, #010a05 100%)",
    6: "linear-gradient(135deg, #1b0726 0%, #07010a 100%)",
    7: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)",
    8: "linear-gradient(135deg, #261f07 0%, #0a0801 100%)",
    9: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)",
    10: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)",
    11: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)",
    12: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)",
    13: "linear-gradient(135deg, #212121 0%, #0a0a0a 100%)",
    14: "linear-gradient(135deg, #3d1b09 0%, #0a0401 100%)"
};

// As três decisões da cena 8 correspondem aos três caminhos já existentes no roteiro.
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

        loadingOverlay.classList.remove("active");
        setupGameControls();
        buildSceneMap();
        loadScene(0);
    } catch (err) {
        console.error("Erro ao inicializar o roteiro:", err);
        loadingOverlay.classList.remove("active");
        errorOverlay.classList.add("active");
        errorMessage.textContent = `Falha ao ler roteiro.json: ${err.message}`;

        if (window.location.protocol === "file:") {
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
        if (ids.has(scene.id)) {
            throw new Error(`O identificador da cena ${scene.id} está duplicado.`);
        }
        ids.add(scene.id);

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
    document.getElementById("btn-log").onclick = event => {
        event.stopPropagation();
        openLogModal();
    };

    document.getElementById("btn-map").onclick = event => {
        event.stopPropagation();
        openMapModal();
    };

    document.getElementById("btn-restart").onclick = event => {
        event.stopPropagation();
        if (confirm("Deseja reiniciar a história do início?")) restartGame();
    };

    document.getElementById("close-log").onclick = () => {
        document.getElementById("log-modal").classList.remove("active");
    };

    document.getElementById("close-map").onclick = () => {
        document.getElementById("map-modal").classList.remove("active");
    };

    document.querySelectorAll(".modal").forEach(modal => {
        modal.onclick = event => {
            if (event.target === modal) modal.classList.remove("active");
        };
    });

    document.getElementById("btn-retry-choice").onclick = () => {
        const scene8Index = findSceneIndex(8);
        if (scene8Index !== -1) loadScene(scene8Index);
    };

    document.getElementById("btn-restart-gameover").onclick = restartGame;
    document.getElementById("btn-restart-ending").onclick = restartGame;

    dialogBox.onclick = event => {
        event.stopPropagation();
        if (currentState === "running") advanceScene();
    };

    document.addEventListener("keydown", event => {
        const modalOpen = document.querySelector(".modal.active");
        if (modalOpen || currentState !== "running") return;

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
    loadScene(0);
}

function findSceneIndex(sceneId) {
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
    document.getElementById("top-nav").style.display = "flex";
    document.getElementById("dialog-wrapper").style.display = "flex";
    document.getElementById("scene-badge").textContent = `Cena ${scene.id}`;
    document.getElementById("scene-location").textContent = scene.local;

    updateBackground(scene.id);
    updateSceneMapSelection();
    advanceScene();
}

function hideAllOverlays() {
    ["choices-overlay", "gameover-overlay", "ending-overlay", "log-modal", "map-modal"].forEach(id => {
        document.getElementById(id).classList.remove("active");
    });
}

function updateBackground(sceneId) {
    const gradient = backgroundGradients[sceneId] || "linear-gradient(135deg, #111 0%, #000 100%)";
    const imageUrl = backgroundImages[sceneId];

    // O gradiente aparece imediatamente enquanto a imagem é carregada.
    gameContainer.style.backgroundImage = gradient;
    if (!imageUrl) return;

    const img = new Image();
    img.onload = () => {
        if (!roteiro || Number(roteiro.cenas[currentSceneIndex]?.id) !== Number(sceneId)) return;
        gameContainer.style.backgroundImage = `url("${imageUrl}")`;
    };
    img.onerror = () => {
        console.warn(`Imagem de fundo não encontrada: ${imageUrl}`);
    };
    img.src = imageUrl;
}

function renderCharacterPortrait(name) {
    const portraitContainer = document.getElementById("portrait-container");
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
    portraitContainer.innerHTML = `
        <div class="portrait-fallback" style="background: radial-gradient(circle, ${color} 0%, #110505 100%)">
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
    updateBackground(scene.id);

    // Eventos narrativos vêm antes dos diálogos.
    if (currentEventIndex < scene.eventos.length) {
        const eventText = scene.eventos[currentEventIndex];
        nameTag.textContent = "Narrativa";
        nameTag.className = "name-tag narration-tag";
        dialogBox.className = "dialog-box narration-style";
        renderPortraitFallback("📖", "#2b2b2b");
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

    handleSceneEnd(scene);
}

function startTypewriter(text, targetElement, onComplete) {
    clearTypewriter();
    targetElement.textContent = "";
    typewriterText = text || "";
    typewriterIndex = 0;
    isTyping = true;
    currentOnComplete = onComplete;
    if (cursorBlink) cursorBlink.style.display = "none";

    const speed = 22;
    typewriterInterval = setInterval(() => {
        if (typewriterIndex >= typewriterText.length) {
            finishTypewriter();
            return;
        }
        targetElement.textContent += typewriterText.charAt(typewriterIndex++);
    }, speed);
}

function finishTypewriter() {
    clearInterval(typewriterInterval);
    dialogText.textContent = typewriterText;
    isTyping = false;
    if (cursorBlink) cursorBlink.style.display = "inline";

    const callback = currentOnComplete;
    currentOnComplete = null;
    if (callback) callback();
}

function clearTypewriter() {
    clearInterval(typewriterInterval);
    typewriterInterval = null;
    isTyping = false;
    currentOnComplete = null;
    typewriterText = "";
    typewriterIndex = 0;
    if (cursorBlink) cursorBlink.style.display = "inline";
}

function handleSceneEnd(scene) {
    const sceneId = Number(scene.id);

    if (sceneId === 8) {
        showChoices();
        return;
    }

    if (sceneId === 11) {
        showGameOver();
        return;
    }

    if (sceneId === 14) {
        showEnding();
        return;
    }

    // Fluxo definido pelo roteiro atual.
    const nextSceneId = {
        1: 2,
        2: 3,
        3: 4,
        4: 5,
        5: 6,
        6: 7,
        7: 8,
        9: 12,
        10: 12,
        12: 13,
        13: 14
    }[sceneId];

    if (nextSceneId !== undefined) {
        const nextIndex = findSceneIndex(nextSceneId);
        if (nextIndex !== -1) {
            loadScene(nextIndex);
            return;
        }
    }

    if (currentSceneIndex < roteiro.cenas.length - 1) {
        loadScene(currentSceneIndex + 1);
    } else {
        showEnding();
    }
}

function showChoices() {
    currentState = "choice";
    const overlay = document.getElementById("choices-overlay");
    const container = document.getElementById("choices-container");
    container.innerHTML = "";

    scene8Choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "retro-btn choice-btn";
        button.textContent = `${index + 1}. ${choice.label}`;
        button.addEventListener("click", event => {
            event.stopPropagation();
            const targetIndex = findSceneIndex(choice.sceneId);
            if (targetIndex !== -1) loadScene(targetIndex);
        });
        container.appendChild(button);
    });

    overlay.classList.add("active");
}

function showGameOver() {
    clearTypewriter();
    currentState = "gameover";
    document.getElementById("gameover-overlay").classList.add("active");
}

function showEnding() {
    clearTypewriter();
    clearInterval(endingInterval);
    currentState = "ending";

    const overlay = document.getElementById("ending-overlay");
    const textElement = document.getElementById("ending-text");
    const actions = document.getElementById("ending-actions");
    const endingText = "Onde existe um… existem outros.";

    overlay.classList.add("active");
    actions.style.display = "none";
    textElement.textContent = "";

    let index = 0;
    endingInterval = setInterval(() => {
        textElement.textContent = endingText.slice(0, ++index);
        if (index >= endingText.length) {
            clearInterval(endingInterval);
            endingInterval = null;
            actions.style.display = "block";
        }
    }, 55);
}

function addToLog(type, character, text) {
    sceneLog.push({ type, character, text });
}

function openLogModal() {
    const body = document.getElementById("log-body");
    body.innerHTML = "";

    if (sceneLog.length === 0) {
        body.innerHTML = '<p class="map-subtitle">Nenhum diálogo registrado nesta cena.</p>';
    } else {
        sceneLog.forEach(entry => {
            const wrapper = document.createElement("div");
            wrapper.className = `log-entry ${entry.type}`;

            if (entry.type === "dialogue") {
                const character = document.createElement("span");
                character.className = "log-char";
                character.textContent = `${entry.character}: `;
                wrapper.appendChild(character);
            }

            const text = document.createElement("span");
            text.className = "log-text";
            text.textContent = entry.text;
            wrapper.appendChild(text);
            body.appendChild(wrapper);
        });
    }

    document.getElementById("log-modal").classList.add("active");
}

function buildSceneMap() {
    const grid = document.getElementById("scene-grid");
    grid.innerHTML = "";

    roteiro.cenas.forEach((scene, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scene-card";
        button.dataset.sceneIndex = index;
        button.textContent = `Cena ${scene.id} — ${scene.local}`;
        button.addEventListener("click", () => {
            loadScene(index);
            document.getElementById("map-modal").classList.remove("active");
        });
        grid.appendChild(button);
    });

    updateSceneMapSelection();
}

function updateSceneMapSelection() {
    document.querySelectorAll(".scene-card").forEach(card => {
        card.classList.toggle("active", Number(card.dataset.sceneIndex) === currentSceneIndex);
    });
}

function openMapModal() {
    updateSceneMapSelection();
    document.getElementById("map-modal").classList.add("active");
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
