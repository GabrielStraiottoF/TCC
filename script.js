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

// Fundos temporários feitos apenas com CSS.
// Quando as artes finais forem produzidas, basta trocar/remover estes valores.
const backgroundScenes = {
    1: [
        "radial-gradient(circle at 18% 28%, rgba(255,214,120,.28) 0 3%, transparent 4%),",
        "linear-gradient(180deg, transparent 0 62%, rgba(12,8,5,.88) 63%),",
        "repeating-linear-gradient(90deg, transparent 0 78px, rgba(207,171,60,.10) 79px 82px, transparent 83px 150px),",
        "linear-gradient(135deg, #49351b 0%, #21150c 42%, #090807 100%)"
    ].join(" "),
    2: [
        "radial-gradient(ellipse at 50% 38%, rgba(214,164,75,.20) 0 20%, transparent 48%),",
        "linear-gradient(180deg, rgba(10,12,15,.15) 0 45%, rgba(0,0,0,.82) 46%),",
        "repeating-linear-gradient(90deg, transparent 0 110px, rgba(207,171,60,.08) 111px 114px, transparent 115px 190px),",
        "linear-gradient(160deg, #40301c 0%, #18130e 50%, #050505 100%)"
    ].join(" "),
    3: [
        "radial-gradient(ellipse at 72% 58%, rgba(54,155,176,.30) 0 12%, transparent 40%),",
        "linear-gradient(170deg, transparent 0 52%, rgba(5,22,23,.9) 53%),",
        "repeating-linear-gradient(105deg, transparent 0 42px, rgba(70,120,83,.12) 43px 48px, transparent 49px 90px),",
        "linear-gradient(135deg, #16383d 0%, #0c2225 48%, #030a0c 100%)"
    ].join(" "),
    4: [
        "radial-gradient(ellipse at 55% 55%, rgba(34,117,104,.38) 0 14%, transparent 50%),",
        "repeating-linear-gradient(72deg, transparent 0 55px, rgba(57,103,58,.20) 56px 68px, transparent 69px 125px),",
        "linear-gradient(180deg, rgba(3,19,18,.05) 0 45%, rgba(1,8,8,.72) 100%),",
        "linear-gradient(135deg, #0d3932 0%, #09251f 48%, #010706 100%)"
    ].join(" "),
    5: [
        "radial-gradient(circle at 70% 36%, rgba(120,170,93,.18) 0 8%, transparent 32%),",
        "repeating-linear-gradient(118deg, transparent 0 35px, rgba(63,113,54,.18) 36px 44px, transparent 45px 76px),",
        "linear-gradient(180deg, rgba(15,49,24,.05) 0 52%, rgba(2,10,5,.84) 53%),",
        "linear-gradient(135deg, #0b3a20 0%, #082615 50%, #010a04 100%)"
    ].join(" "),
    6: [
        "radial-gradient(ellipse at 50% 48%, rgba(139,100,48,.26) 0 16%, transparent 45%),",
        "linear-gradient(180deg, rgba(9,20,8,.10) 0 48%, rgba(4,7,3,.86) 49%),",
        "repeating-linear-gradient(105deg, transparent 0 72px, rgba(86,59,34,.20) 73px 80px, transparent 81px 145px),",
        "linear-gradient(135deg, #233417 0%, #181b0d 48%, #050602 100%)"
    ].join(" "),
    7: [
        "radial-gradient(ellipse at 58% 50%, rgba(164,49,37,.22) 0 7%, transparent 34%),",
        "repeating-linear-gradient(112deg, transparent 0 45px, rgba(44,92,39,.24) 46px 55px, transparent 56px 95px),",
        "linear-gradient(180deg, rgba(6,28,6,.12), rgba(0,5,0,.88)),",
        "linear-gradient(135deg, #12310d 0%, #071c07 52%, #010501 100%)"
    ].join(" "),
    8: [
        "radial-gradient(circle at 50% 56%, rgba(207,171,60,.25) 0 5%, transparent 6%),",
        "radial-gradient(ellipse at 50% 65%, rgba(153,80,29,.20) 0 18%, transparent 42%),",
        "repeating-linear-gradient(90deg, transparent 0 100px, rgba(80,104,54,.18) 101px 110px, transparent 111px 180px),",
        "linear-gradient(135deg, #3a3217 0%, #1c2411 45%, #060a03 100%)"
    ].join(" "),
    9: [
        "radial-gradient(ellipse at 50% 60%, rgba(211,171,65,.34) 0 10%, transparent 38%),",
        "linear-gradient(155deg, transparent 0 58%, rgba(32,67,24,.62) 59%),",
        "repeating-linear-gradient(112deg, transparent 0 50px, rgba(52,105,42,.22) 51px 61px, transparent 62px 105px),",
        "linear-gradient(135deg, #1b4212 0%, #0c2508 50%, #020702 100%)"
    ].join(" "),
    10: [
        "radial-gradient(circle at 50% 54%, rgba(207,171,60,.38) 0 4%, transparent 5%),",
        "radial-gradient(ellipse at 50% 54%, rgba(174,47,36,.18) 0 12%, transparent 35%),",
        "repeating-linear-gradient(108deg, transparent 0 45px, rgba(55,105,43,.25) 46px 56px, transparent 57px 100px),",
        "linear-gradient(135deg, #15380e 0%, #092008 50%, #010501 100%)"
    ].join(" "),
    11: [
        "radial-gradient(ellipse at 50% 55%, rgba(168,42,42,.28) 0 12%, transparent 40%),",
        "linear-gradient(180deg, rgba(5,25,5,.10), rgba(0,3,0,.93)),",
        "repeating-linear-gradient(115deg, transparent 0 52px, rgba(43,85,37,.18) 53px 64px, transparent 65px 110px),",
        "linear-gradient(135deg, #17350f 0%, #071b06 50%, #000300 100%)"
    ].join(" "),
    12: [
        "radial-gradient(ellipse at 50% 50%, rgba(207,171,60,.20) 0 10%, transparent 42%),",
        "linear-gradient(180deg, rgba(20,55,19,.08), rgba(2,11,2,.76)),",
        "repeating-linear-gradient(110deg, transparent 0 60px, rgba(60,112,48,.18) 61px 70px, transparent 71px 125px),",
        "linear-gradient(135deg, #174212 0%, #0a2608 50%, #020702 100%)"
    ].join(" "),
    13: [
        "radial-gradient(circle at 68% 40%, rgba(207,171,60,.22) 0 4%, transparent 5%),",
        "repeating-linear-gradient(90deg, transparent 0 92px, rgba(116,116,116,.12) 93px 98px, transparent 99px 160px),",
        "linear-gradient(180deg, rgba(70,70,70,.14) 0 55%, rgba(5,5,5,.90) 56%),",
        "linear-gradient(135deg, #393939 0%, #202020 48%, #080808 100%)"
    ].join(" "),
    14: [
        "radial-gradient(ellipse at 74% 28%, rgba(255,175,72,.42) 0 8%, transparent 34%),",
        "linear-gradient(180deg, rgba(255,125,48,.08) 0 45%, rgba(18,7,2,.72) 46%),",
        "repeating-linear-gradient(95deg, transparent 0 90px, rgba(120,75,31,.16) 91px 97px, transparent 98px 170px),",
        "linear-gradient(160deg, #8a421d 0%, #4a2110 45%, #0d0502 100%)"
    ].join(" ")
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
    const background = backgroundScenes[sceneId] || "linear-gradient(135deg, #111 0%, #000 100%)";
    gameContainer.style.backgroundImage = background;
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
    typewriterInterval = null;
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
            chooseScene8(index);
        });
        container.appendChild(button);
    });

    overlay.classList.add("active");
}

function chooseScene8(choiceIndex) {
    const choice = scene8Choices[choiceIndex];
    if (!choice) return;

    const targetIndex = findSceneIndex(choice.sceneId);
    if (targetIndex !== -1) loadScene(targetIndex);
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
