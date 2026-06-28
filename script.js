// Global state variables
let roteiro = null;
let currentSceneIndex = 0;
let currentEventIndex = 0;
let currentDialogueIndex = -1; // -1 means we are currently playing events/narration
let currentState = "loading"; // loading, running, choice, gameover, ending
let sceneLog = [];

// Typewriter state
let typewriterText = "";
let typewriterIndex = 0;
let typewriterInterval = null;
let isTyping = false;
let currentOnComplete = null;

// DOM Elements cache
const dialogText = document.getElementById("dialog-text");
const nameTag = document.getElementById("name-tag");
const dialogBox = document.getElementById("dialog-box");
const cursorBlink = document.querySelector(".cursor-blink");

// Configuration & Mappings
const characterColors = {
    "Alex": "#8c2a2a",      // Crimson
    "Lucas": "#cfab3c",     // Gold
    "José": "#2a7da8",      // Cyanish Blue
    "Claudio": "#2aa84e",   // Green
    "Mecânico": "#6e6e6e",  // Steel Grey
    "Mapinguari": "#a82a8c",// Purple
};

const characterImages = {
    "Alex": "imagens/alex.png",
    "Mapinguari": "imagens/mapinguari.png",
    "Lucas": "imagens/lucas.png",
    "José": "imagens/jose.png",
    "Claudio": "imagens/claudio.png",
    "Mecânico": "imagens/mecanico.png"
};

const backgroundGradients = {
    1: "linear-gradient(135deg, #2b1f0d 0%, #050505 100%)", // rodoviaria (yellowish dark)
    2: "linear-gradient(135deg, #1f1105 0%, #000000 100%)", // bus inside (already has image fallback)
    3: "linear-gradient(135deg, #0d2b33 0%, #050b0f 100%)", // pier (teal/water)
    4: "linear-gradient(135deg, #071f1f 0%, #010808 100%)", // river (dark greenish blue)
    5: "linear-gradient(135deg, #072615 0%, #010a05 100%)", // forest edge (green)
    6: "linear-gradient(135deg, #1b0726 0%, #07010a 100%)", // destroyed clearing (dark violet)
    7: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)", // forest chase (greenish dark)
    8: "linear-gradient(135deg, #261f07 0%, #0a0801 100%)", // camp (moss/wood)
    9: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)", // final 1 (greenish dark)
    10: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)", // final 2 (greenish dark)
    11: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)", // final 3 (greenish dark)
    12: "linear-gradient(135deg, #0c2607 0%, #030a01 100%)", // post-victory
    13: "linear-gradient(135deg, #212121 0%, #0a0a0a 100%)", // mechanic shop (metal/grey)
    14: "linear-gradient(135deg, #3d1b09 0%, #0a0401 100%)", // sunset (orange/black)
};

const backgroundImages = {
    1: "imagens/rodoviaria.png",
    2: "imagens/Onibus.jpeg",
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

// Initialize
window.onload = () => {
    fetchRoteiro();
};

// Fetch and load roteiro.json
async function fetchRoteiro() {
    const loadingOverlay = document.getElementById("loading-overlay");
    const errorOverlay = document.getElementById("error-overlay");
    const errorMessage = document.getElementById("error-message");
    const corsNotice = document.getElementById("cors-notice");
    
    try {
        const response = await fetch("roteiro.json");
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validate parsed object structure without modifying the original file
        validateRoteiro(data);
        
        roteiro = data;
        
        // Hide loading screen
        loadingOverlay.classList.remove("active");
        
        // Setup UI event listeners
        setupGameControls();
        
        // Load the initial scene (index 0)
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

// Logical validator for JSON schema (fails if main arrays are missing)
function validateRoteiro(data) {
    if (!data) throw new Error("JSON é nulo.");
    if (!Array.isArray(data.personagens)) throw new Error("A chave 'personagens' é obrigatória e deve ser um Array.");
    if (!Array.isArray(data.cenas)) throw new Error("A chave 'cenas' é obrigatória e deve ser um Array.");
    
    if (data.cenas.length === 0) throw new Error("O roteiro deve conter pelo menos uma cena.");
    
    // Validate each scene integrity (sets runtime fallbacks, never overrides file)
    data.cenas.forEach((scene, index) => {
        if (scene.id === undefined || scene.id === null) {
            throw new Error(`Cena na posição ${index} está sem identificador 'id'.`);
        }
        if (typeof scene.local !== 'string') {
            scene.local = "Cena Sem Nome";
        }
        if (!Array.isArray(scene.eventos)) {
            scene.eventos = [];
        }
        if (!Array.isArray(scene.dialogos)) {
            scene.dialogos = [];
        }
        
        scene.dialogos.forEach((dialogue, dIndex) => {
            if (typeof dialogue.personagem !== 'string') {
                dialogue.personagem = "Desconhecido";
            }
            if (typeof dialogue.fala !== 'string') {
                dialogue.fala = "...";
            }
        });
    });
}

// Bind navigation buttons and overlay triggers
function setupGameControls() {
    // Menu Buttons
    document.getElementById("btn-log").onclick = (e) => {
        e.stopPropagation();
        openLogModal();
    };
    
    document.getElementById("btn-map").onclick = (e) => {
        e.stopPropagation();
        openMapModal();
    };
    
    document.getElementById("btn-restart").onclick = (e) => {
        e.stopPropagation();
        if (confirm("Deseja reiniciar a história do início?")) {
            loadScene(0);
        }
    };
    
    // Modal Closers
    document.getElementById("close-log").onclick = () => {
        document.getElementById("log-modal").classList.remove("active");
    };
    document.getElementById("close-map").onclick = () => {
        document.getElementById("map-modal").classList.remove("active");
    };
    
    // Modal backgrounds closing clicking outside
    document.querySelectorAll(".modal").forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        };
    });
    
    // Game Over Buttons
    document.getElementById("btn-retry-choice").onclick = () => {
        const scene8Index = roteiro.cenas.findIndex(s => s.id === 8);
        loadScene(scene8Index);
    };
    
    document.getElementById("btn-restart-gameover").onclick = () => {
        loadScene(0);
    };
    
    // Ending Button
    document.getElementById("btn-restart-ending").onclick = () => {
        loadScene(0);
    };
    
    // Dialog wrapper click for advancement
    dialogBox.onclick = (e) => {
        e.stopPropagation();
        if (currentState === "running") {
            advanceScene();
        }
    };
    
    // Keyboard listener
    document.addEventListener("keydown", (e) => {
        if (currentState !== "running") return;
        
        // Don't advance if any modal is active
        if (document.querySelector(".modal.active")) return;
        
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
            e.preventDefault();
            advanceScene();
        }
    });
}

// Load a scene by its index in the array
function loadScene(sceneIndex) {
    if (sceneIndex < 0 || sceneIndex >= roteiro.cenas.length) return;
    
    currentSceneIndex = sceneIndex;
    currentEventIndex = 0;
    currentDialogueIndex = -1;
    sceneLog = [];
    currentState = "running";
    
    hideAllOverlays();
    
    const scene = roteiro.cenas[currentSceneIndex];
    
    // Show gameplay wrapper
    document.getElementById("top-nav").style.display = "flex";
    document.getElementById("dialog-wrapper").style.display = "flex";
    
    // Header updates
    document.getElementById("scene-badge").textContent = `Cena ${scene.id}`;
    document.getElementById("scene-location").textContent = scene.local;
    
    // Background graphic update
    updateBackground(scene.id);
    
    // Advance into first event
    advanceScene();
}

// Hide all fullscreen screen blocks
function hideAllOverlays() {
    document.getElementById("choices-overlay").classList.remove("active");
    document.getElementById("gameover-overlay").classList.remove("active");
    document.getElementById("ending-overlay").classList.remove("active");
    document.getElementById("log-modal").classList.remove("active");
    document.getElementById("map-modal").classList.remove("active");
}

// Set location background illustration or custom theme gradient
function updateBackground(sceneId) {
    const gameContainer = document.getElementById("game-container");
    
    // Determine which background image to use based on story progression
    let imageUrl = "imagens/onibus.jpeg";
    if (roteiro) {
        const scene3Index = roteiro.cenas.findIndex(s => s.id === 3);
        if (scene3Index !== -1) {
            if (currentSceneIndex > scene3Index || 
                (currentSceneIndex === scene3Index && (currentEventIndex > 0 || currentDialogueIndex >= 0))) {
                imageUrl = "imagens/mapinguari.png";
            }
        }
    }
    
    const activeSceneId = sceneId || (roteiro ? roteiro.cenas[currentSceneIndex].id : 1);
    const fallbackGradient = backgroundGradients[activeSceneId] || "linear-gradient(135deg, #111 0%, #000 100%)";
    
    if (imageUrl) {
        const img = new Image();
        img.onload = () => {
            gameContainer.style.backgroundImage = `url('${imageUrl}')`;
        };
        img.src = imageUrl;
    } else {
        gameContainer.style.backgroundImage = fallbackGradient;
    }
}

// Display dialogue speaker portraits, falling back to styled initials tags
function renderCharacterPortrait(name) {
    const portraitContainer = document.getElementById("portrait-container");
    const imageUrl = characterImages[name];
    const color = characterColors[name] || "#555";
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    
    if (imageUrl) {
        const img = new Image();
        img.onload = () => {
            portraitContainer.innerHTML = `<img src="${imageUrl}" alt="${name}" class="portrait">`;
        };
        img.onerror = () => {
            renderPortraitFallback(initial, color);
        };
        img.src = imageUrl;
    } else {
        renderPortraitFallback(initial, color);
    }
}

function renderPortraitFallback(initial, color) {
    const portraitContainer = document.getElementById("portrait-container");
    portraitContainer.innerHTML = `
        <div class="portrait-fallback" style="background: radial-gradient(circle, ${color} 0%, #110505 100%)">
            ${initial}
        </div>
    `;
}

// Core scene navigation logic (Events first, then dialogues)
function advanceScene() {
    if (isTyping) {
        stopTypewriter(dialogText);
        return;
    }
    
    const scene = roteiro.cenas[currentSceneIndex];
    
    // Update background image based on state change (e.g. advancing past "Alex desce do ônibus")
    updateBackground(scene.id);
    
    // 1. Process Event Narratives
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
    
    // Transition to dialogues once events are finished
    if (currentDialogueIndex === -1) {
        currentDialogueIndex = 0;
    }
    
    // 2. Process Dialogue Array
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
    
    // 3. Dialogue complete: handle scene transitions
    handleSceneEnd();
}

// Typewriter typewriter writing effect
function startTypewriter(text, targetElement, onComplete) {
    clearInterval(typewriterInterval);
    targetElement.textContent = "";
    typewriterText = text;
    typewriterIndex = 0;
    isTyping = true;
    currentOnComplete = onComplete;
    cursorBlink.style.display = "none";
    
    const speed = 25; // Milliseconds per character
    
    typewriterInterval = setInterval(() => {
        if (typewriterIndex < typewriterText.length) {
            targetElement.textContent += typewriterText.charAt(typewriterIndex);
            typewriterIndex++;
        } else {
            stopTypewriter(targetElement);
        }
    }, speed);
}

function stopTypewriter(targetElement) {
    clearInterval(typewriterInterval);
    targetElement.textContent = typewriterText;
    isTyping = false;
    
    if (targetElement === dialogText) {
        cursorBlink.style.display = "block";
    }
    
    if (currentOnComplete) {
        const cb = currentOnComplete;
        currentOnComplete = null;
        cb();
    }
}

// Logic flow controls at the end of each scene
function handleSceneEnd() {
    const scene = roteiro.cenas[currentSceneIndex];
    const sceneId = scene.id;
    
    if (sceneId === 8) {
        showChoicesMenu();
    } else if (sceneId === 11) {
        showGameOverScreen();
    } else if (sceneId === 9 || sceneId === 10) {
        // Successful final paths merge to Scene 12
        const scene12Index = roteiro.cenas.findIndex(s => s.id === 12);
        loadScene(scene12Index);
    } else if (sceneId === 14) {
        showEndingScreen();
    } else {
        // Sequential advance
        const nextIndex = currentSceneIndex + 1;
        if (nextIndex < roteiro.cenas.length) {
            loadScene(nextIndex);
        } else {
            showEndingScreen();
        }
    }
}

// Open Choice overlay for endings selection
function showChoicesMenu() {
    hideAllOverlays();
    currentState = "choice";
    
    document.getElementById("dialog-wrapper").style.display = "none";
    
    const overlay = document.getElementById("choices-overlay");
    const container = document.getElementById("choices-container");
    container.innerHTML = "";
    
    // Identify choice scenes (9, 10, 11)
    const options = roteiro.cenas.filter(s => [9, 10, 11].includes(s.id));
    
    options.forEach(scene => {
        const btn = document.createElement("button");
        btn.className = "retro-btn choice-btn";
        btn.textContent = scene.local.replace("Floresta - ", ""); // E.g., "Final Alternativo 1"
        btn.onclick = () => {
            overlay.classList.remove("active");
            const targetIndex = roteiro.cenas.findIndex(s => s.id === scene.id);
            loadScene(targetIndex);
        };
        container.appendChild(btn);
    });
    
    overlay.classList.add("active");
}

// Open Game Over screen
function showGameOverScreen() {
    hideAllOverlays();
    currentState = "gameover";
    document.getElementById("dialog-wrapper").style.display = "none";
    
    document.getElementById("gameover-overlay").classList.add("active");
}

// Open Final Victory overlay
function showEndingScreen() {
    hideAllOverlays();
    currentState = "ending";
    
    document.getElementById("dialog-wrapper").style.display = "none";
    document.getElementById("top-nav").style.display = "none";
    
    // Pitch-black transition
    const gameContainer = document.getElementById("game-container");
    gameContainer.style.backgroundImage = "none";
    gameContainer.style.backgroundColor = "#000";
    
    const overlay = document.getElementById("ending-overlay");
    overlay.classList.add("active");
    
    const textContainer = document.getElementById("ending-text");
    document.getElementById("ending-actions").style.display = "none";
    
    const quote = "Onde existe um… existem outros.";
    
    // Slow typewriter reveal
    startTypewriter(quote, textContainer, () => {
        setTimeout(() => {
            document.getElementById("ending-actions").style.display = "block";
        }, 1500);
    });
}

// Add history entries
function addToLog(type, character, text) {
    sceneLog.push({ type, character, text });
}

// Populate and reveal dialogue history log
function openLogModal() {
    const modal = document.getElementById("log-modal");
    const body = document.getElementById("log-body");
    body.innerHTML = "";
    
    if (sceneLog.length === 0) {
        body.innerHTML = `<p class="map-subtitle" style="text-align: center;">Nenhum diálogo ou narrativa exibidos ainda nesta cena.</p>`;
    } else {
        sceneLog.forEach(entry => {
            const div = document.createElement("div");
            if (entry.type === "narration") {
                div.className = "log-entry narration";
                div.textContent = entry.text;
            } else {
                div.className = "log-entry dialogue";
                div.innerHTML = `<span class="log-char" style="color: ${characterColors[entry.character] || '#e8dcc7'}">${entry.character}:</span> <span class="log-text">${entry.text}</span>`;
            }
            body.appendChild(div);
        });
    }
    
    modal.classList.add("active");
}

// Populate and reveal scene jumper map
function openMapModal() {
    const modal = document.getElementById("map-modal");
    const grid = document.getElementById("scene-grid");
    grid.innerHTML = "";
    
    roteiro.cenas.forEach((scene, index) => {
        const btn = document.createElement("button");
        btn.className = "scene-card";
        if (index === currentSceneIndex) {
            btn.classList.add("active");
        }
        
        btn.innerHTML = `<strong>Cena ${scene.id}</strong><br><span style="font-size: 13px; opacity: 0.85;">${scene.local}</span>`;
        btn.onclick = () => {
            modal.classList.remove("active");
            loadScene(index);
        };
        grid.appendChild(btn);
    });
    
    modal.classList.add("active");
}
