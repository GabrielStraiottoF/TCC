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

// Os cenários são renderizados integralmente por backgrounds.css.
// O JavaScript só informa qual cena está ativa através de data-scene.
// Isso evita background-image inline sobrescrevendo os gradientes CSS.

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
        if (modalOpen) return;

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
    document.getElementById("top-nav").style.display = "flex";
    document.getElementById("dialog-wrapper").style.display = "flex";
    document.getElementById("scene-badge").textContent = `Cena ${scene.id}`;
    document.getElementById("scene-location").textContent = scene.local;
    document.title = `Sobrenatural: O Mapinguari — ${scene.local}`;

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
    // O cenário é 100% CSS. Apenas trocamos o estado sem inserir imagens.
    gameContainer.style.backgroundImage = "";
    gameContainer.dataset.scene = String(sceneId);
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
        <div class="portrait-fallback" style="--fallback-color: ${color};">
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
    container.innerHTML = "";

    scene8Choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.className = "choice-button";
        button.type = "button";
        button.innerHTML = `<span class="choice-key">${index + 1}</span><span>${escapeHtml(choice.label)}</span>`;
        button.onclick = event => {
            event.stopPropagation();
            chooseScene8(index);
        };
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
    document.getElementById("choices-overlay").classList.remove("active");
    document.getElementById("gameover-overlay").classList.add("active");
}

function showEnding() {
    currentState = "ending";
    document.getElementById("choices-overlay").classList.remove("active");
    document.getElementById("ending-overlay").classList.add("active");

    const endingText = document.getElementById("ending-text");
    const finalMessage = "Onde existe um… existem outros.";
    endingText.textContent = "";

    let index = 0;
    clearInterval(endingInterval);
    endingInterval = setInterval(() => {
        endingText.textContent += finalMessage.charAt(index++);
        if (index >= finalMessage.length) clearInterval(endingInterval);
    }, 55);
}

function startTypewriter(text, element, onComplete) {
    clearTypewriter();
    typewriterText = String(text ?? "");
    typewriterIndex = 0;
    isTyping = true;
    currentOnComplete = onComplete;
    element.textContent = "";

    typewriterInterval = setInterval(() => {
        element.textContent += typewriterText.charAt(typewriterIndex++);
        if (typewriterIndex >= typewriterText.length) finishTypewriter();
    }, 22);
}

function finishTypewriter() {
    if (!isTyping) return;
    clearInterval(typewriterInterval);
    typewriterInterval = null;
    dialogText.textContent = typewriterText;
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
    list.innerHTML = "";

    if (sceneLog.length === 0) {
        list.innerHTML = "<p>Nenhum registro nesta cena.</p>";
    } else {
        sceneLog.forEach(entry => {
            const item = document.createElement("div");
            item.className = `log-entry ${entry.type}`;
            const title = entry.speaker || "Narrativa";
            item.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(entry.text)}</p>`;
            list.appendChild(item);
        });
    }

    document.getElementById("log-modal").classList.add("active");
}

function openMapModal() {
    buildSceneMap();
    document.getElementById("map-modal").classList.add("active");
}

function buildSceneMap() {
    const map = document.getElementById("scene-map");
    if (!map || !roteiro) return;

    map.innerHTML = "";
    roteiro.cenas.forEach((scene, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "scene-map-item";
        button.dataset.sceneId = scene.id;
        button.innerHTML = `<span>${escapeHtml(String(scene.id))}</span><small>${escapeHtml(scene.local)}</small>`;
        button.onclick = () => {
            document.getElementById("map-modal").classList.remove("active");
            loadScene(index);
        };
        map.appendChild(button);
    });

    updateSceneMapSelection();
}

function updateSceneMapSelection() {
    const scene = roteiro?.cenas?.[currentSceneIndex];
    if (!scene) return;

    document.querySelectorAll(".scene-map-item").forEach(item => {
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
