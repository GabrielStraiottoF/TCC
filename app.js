// Motor principal do jogo.
// O conteúdo narrativo continua em roteiro.json; este arquivo cuida apenas da execução.

let roteiro = null;
let currentSceneIndex = 0;
let currentEventIndex = 0;
let currentDialogueIndex = -1;
let currentState = "loading";
let sceneLog = [];
let journeyLog = [];
let visitedScenes = new Set();

let typewriterText = "";
let typewriterIndex = 0;
let typewriterInterval = null;
let isTyping = false;
let currentOnComplete = null;
let endingInterval = null;

const SAVE_KEY = "tcc-mapinguari-save-v2";
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

// As escolhas permanecem iguais às previstas no roteiro original.
const scene8Choices = [
    { label: "Usar a armadilha de espinhos e a granada", sceneId: 9 },
    { label: "Usar a arma e atingir o ponto fraco", sceneId: 10 },
    { label: "Montar uma armadilha com cordas", sceneId: 11 }
];

window.addEventListener("load", initializeGame);

async function initializeGame() {
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

        if (!restoreSave()) {
            resetJourneyState();
            loadScene(0, false);
        }
    } catch (err) {
        console.error("Erro ao inicializar o jogo:", err);
        loadingOverlay?.classList.remove("active");
        errorOverlay?.classList.add("active");
        if (errorMessage) {
            errorMessage.textContent = `Falha ao ler roteiro.json: ${err.message}`;
        }
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
    const characterNames = new Set(data.personagens.map(personagem => personagem?.nome).filter(Boolean));

    data.cenas.forEach((scene, index) => {
        if (scene.id === undefined || scene.id === null || scene.id === "") {
            throw new Error(`Cena na posição ${index} está sem identificador.`);
        }

        const normalizedId = Number(scene.id);
        const idKey = Number.isNaN(normalizedId) ? String(scene.id) : normalizedId;
        if (ids.has(idKey)) {
            throw new Error(`O identificador da cena ${scene.id} está duplicado.`);
        }
        ids.add(idKey);

        if (typeof scene.local !== "string") {
            throw new Error(`A cena ${scene.id} possui um local inválido.`);
        }

        if (!Array.isArray(scene.eventos)) {
            throw new Error(`A cena ${scene.id} possui 'eventos' inválidos.`);
        }

        if (!Array.isArray(scene.dialogos)) {
            throw new Error(`A cena ${scene.id} possui 'dialogos' inválidos.`);
        }

        scene.dialogos.forEach((dialogue, dialogueIndex) => {
            if (!dialogue || typeof dialogue !== "object") {
                throw new Error(`Diálogo ${dialogueIndex + 1} da cena ${scene.id} é inválido.`);
            }
            if (typeof dialogue.personagem !== "string" || !dialogue.personagem) {
                throw new Error(`Diálogo ${dialogueIndex + 1} da cena ${scene.id} está sem personagem.`);
            }
            if (typeof dialogue.fala !== "string") {
                throw new Error(`Diálogo ${dialogueIndex + 1} da cena ${scene.id} está sem fala válida.`);
            }
            if (characterNames.size && !characterNames.has(dialogue.personagem)) {
                throw new Error(`O personagem '${dialogue.personagem}' usado na cena ${scene.id} não está cadastrado.`);
            }
        });
    });

    const sceneIds = new Set(data.cenas.map(scene => Number(scene.id)));
    scene8Choices.forEach(choice => {
        if (!sceneIds.has(choice.sceneId)) {
            throw new Error(`A escolha da cena 8 aponta para a cena inexistente ${choice.sceneId}.`);
        }
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
        if (confirm("Deseja reiniciar a história do início?")) {
            restartGame();
        }
    });

    closeLog?.addEventListener("click", closeModals);
    closeMap?.addEventListener("click", closeModals);

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
        if (document.querySelector(".modal.active")) {
            if (event.key === "Escape") closeModals();
            return;
        }

        if (currentState === "choice") {
            const choiceIndex = Number(event.key) - 1;
            if (Number.isInteger(choiceIndex) && choiceIndex >= 0 && choiceIndex < scene8Choices.length) {
                event.preventDefault();
                chooseScene8(choiceIndex);
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

function closeModals() {
    document.getElementById("log-modal")?.classList.remove("active");
    document.getElementById("map-modal")?.classList.remove("active");
}

function resetJourneyState() {
    clearTypewriter();
    clearInterval(endingInterval);
    currentSceneIndex = 0;
    currentEventIndex = 0;
    currentDialogueIndex = -1;
    currentState = "running";
    sceneLog = [];
    journeyLog = [];
    visitedScenes = new Set();
    clearSavedGame();
}

function restartGame() {
    resetJourneyState();
    loadScene(0, false);
}

function findSceneIndex(sceneId) {
    if (!roteiro) return -1;
    return roteiro.cenas.findIndex(scene => Number(scene.id) === Number(sceneId));
}

function findScene(sceneId) {
    const index = findSceneIndex(sceneId);
    return index === -1 ? null : roteiro.cenas[index];
}

function getNextSceneId(scene) {
    if (!scene || !roteiro) return null;

    const explicitNext = scene.proximaCena ?? scene.proxima_cena ?? scene.nextScene ?? scene.proxima;
    if (explicitNext !== undefined && explicitNext !== null && explicitNext !== "") {
        const numeric = Number(explicitNext);
        return Number.isNaN(numeric) ? explicitNext : numeric;
    }

    // Na ausência de uma propriedade de navegação, o roteiro segue a ordem declarada.
    const currentIndex = findSceneIndex(scene.id);
    const nextScene = roteiro.cenas[currentIndex + 1];
    return nextScene ? Number(nextScene.id) : null;
}

function loadScene(sceneIndex, save = true) {
    if (!roteiro || sceneIndex < 0 || sceneIndex >= roteiro.cenas.length) return;

    clearTypewriter();
    clearInterval(endingInterval);
    currentSceneIndex = sceneIndex;
    currentEventIndex = 0;
    currentDialogueIndex = -1;
    currentState = "running";
    sceneLog = [];

    const scene = roteiro.cenas[currentSceneIndex];
    visitedScenes.add(Number(scene.id));

    hideAllOverlays();

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

    if (save) saveGame();
    advanceScene();
}

function hideAllOverlays() {
    ["choices-overlay", "gameover-overlay", "ending-overlay", "log-modal", "map-modal"].forEach(id => {
        document.getElementById(id)?.classList.remove("active");
    });
}

function updateBackground(sceneId) {
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

    if (currentEventIndex < scene.eventos.length) {
        const eventText = scene.eventos[currentEventIndex];
        nameTag.textContent = "Narrativa";
        nameTag.className = "name-tag narration-tag";
        dialogBox.className = "dialog-box narration-style";
        renderPortraitFallback("N", "#2b2b2b");
        addToLog("narration", null, eventText);

        startTypewriter(eventText, dialogText, () => {
            currentEventIndex++;
            saveGame();
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
            saveGame();
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
        showDataError(`A próxima cena (${nextSceneId}) não foi encontrada.`);
        return;
    }

    loadScene(nextSceneIndex);
}

function showScene8Choices() {
    currentState = "choice";
    const overlay = document.getElementById("choices-overlay");
    const container = document.getElementById("choices-container");
    if (!overlay || !container) return;

    container.innerHTML = "";

    scene8Choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.className = "retro-btn choice-btn";
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
    saveGame();
}

function chooseScene8(index) {
    const choice = scene8Choices[index];
    if (!choice) return;

    const targetIndex = findSceneIndex(choice.sceneId);
    if (targetIndex === -1) {
        showDataError(`A escolha aponta para uma cena inexistente (${choice.sceneId}).`);
        return;
    }

    journeyLog.push({ type: "choice", sceneId: 8, choice: choice.label });
    loadScene(targetIndex);
}

function showGameOver() {
    currentState = "gameover";
    document.getElementById("choices-overlay")?.classList.remove("active");
    document.getElementById("gameover-overlay")?.classList.add("active");
    clearSavedGame();
}

function showEnding() {
    currentState = "ending";
    document.getElementById("choices-overlay")?.classList.remove("active");
    document.getElementById("ending-overlay")?.classList.add("active");
    clearSavedGame();

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

function showDataError(message) {
    console.error(message);
    currentState = "error";
    hideAllOverlays();

    const errorOverlay = document.getElementById("error-overlay");
    const errorMessage = document.getElementById("error-message");
    if (errorMessage) errorMessage.textContent = message;
    errorOverlay?.classList.add("active");
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
    journeyLog.push({ type, speaker, text, sceneId: Number(roteiro.cenas[currentSceneIndex]?.id) });
}

function openLogModal() {
    const list = document.getElementById("log-list");
    const modal = document.getElementById("log-modal");
    if (!list || !modal) return;

    list.innerHTML = "";

    const entries = journeyLog.length ? journeyLog : sceneLog;
    if (entries.length === 0) {
        list.innerHTML = "<p>Nenhum registro disponível.</p>";
    } else {
        entries.forEach(entry => {
            const item = document.createElement("div");
            item.className = `log-entry ${entry.type}`;

            const title = document.createElement("strong");
            title.className = "log-char";
            title.textContent = entry.speaker || (entry.type === "choice" ? "Escolha" : "Narrativa");

            const text = document.createElement("p");
            text.className = "log-text";
            text.textContent = entry.type === "choice" ? entry.choice : entry.text;

            if (entry.sceneId) {
                const sceneLabel = document.createElement("small");
                sceneLabel.textContent = `Cena ${entry.sceneId}`;
                item.append(sceneLabel);
            }

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

    roteiro.cenas.forEach(scene => {
        const sceneId = Number(scene.id);
        const unlocked = visitedScenes.has(sceneId);
        const button = document.createElement("button");
        button.type = "button";
        button.className = `scene-card${sceneId === Number(roteiro.cenas[currentSceneIndex].id) ? " active" : ""}`;
        button.dataset.sceneId = scene.id;
        button.disabled = !unlocked;
        button.title = unlocked ? "Abrir cena" : "Cena ainda não visitada";

        const number = document.createElement("span");
        number.textContent = unlocked ? String(scene.id) : "?";

        const location = document.createElement("small");
        location.textContent = unlocked ? scene.local : "Cena bloqueada";

        button.append(number, document.createElement("br"), location);

        if (unlocked) {
            const index = findSceneIndex(scene.id);
            button.addEventListener("click", () => {
                document.getElementById("map-modal")?.classList.remove("active");
                loadScene(index);
            });
        }

        map.appendChild(button);
    });
}

function updateSceneMapSelection() {
    document.querySelectorAll(".scene-card").forEach(card => {
        card.classList.toggle("active", Number(card.dataset.sceneId) === Number(roteiro?.cenas[currentSceneIndex]?.id));
    });
}

function saveGame() {
    if (!roteiro || currentState === "gameover" || currentState === "ending") return;

    const scene = roteiro.cenas[currentSceneIndex];
    if (!scene) return;

    const payload = {
        version: 2,
        sceneId: Number(scene.id),
        eventIndex: currentEventIndex,
        dialogueIndex: currentDialogueIndex,
        sceneLog,
        journeyLog,
        visitedScenes: Array.from(visitedScenes)
    };

    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn("Não foi possível salvar o progresso:", error);
    }
}

function restoreSave() {
    let payload;

    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        payload = JSON.parse(raw);
    } catch (error) {
        console.warn("Progresso salvo inválido:", error);
        clearSavedGame();
        return false;
    }

    if (!payload || payload.version !== 2 || findSceneIndex(payload.sceneId) === -1) {
        clearSavedGame();
        return false;
    }

    currentSceneIndex = findSceneIndex(payload.sceneId);
    currentEventIndex = Math.max(0, Number(payload.eventIndex) || 0);
    currentDialogueIndex = Number.isInteger(payload.dialogueIndex) ? payload.dialogueIndex : -1;
    sceneLog = Array.isArray(payload.sceneLog) ? payload.sceneLog : [];
    journeyLog = Array.isArray(payload.journeyLog) ? payload.journeyLog : [];
    visitedScenes = new Set(Array.isArray(payload.visitedScenes) ? payload.visitedScenes.map(Number) : []);
    visitedScenes.add(Number(payload.sceneId));

    loadScene(currentSceneIndex, false);
    return true;
}

function clearSavedGame() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (error) {
        console.warn("Não foi possível limpar o progresso:", error);
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
