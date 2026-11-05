// Retorna a descrição do primeiro problema encontrado no save, ou null se ele for válido.
// Saves antigos (versão 2) sem investigação continuam aceitos como antes.
function findSaveProblem(payload) {
    if (!payload || typeof payload !== "object") return "O formato do progresso salvo é inválido.";
    if (![2, 3].includes(payload.version)) return "A versão do progresso salvo não é reconhecida.";
    if (findSceneIndex(payload.sceneId) === -1) return "A cena salva não existe neste roteiro.";
    const hasInvestigation = payload.investigation !== undefined && payload.investigation !== null;
    if ((hasInvestigation || payload.version === 3) && !window.Investigation?.isValidState(payload.investigation)) {
        return "Os dados de investigação do progresso salvo são inválidos.";
    }
    return null;
}

// Recusa a restauração sem apagar o save, e avisa o jogador.
function refuseInvalidSave(message, error) {
    if (error) console.warn(message, error);
    alert(`${message} Seu progresso não foi apagado e continua salvo.`);
    return false;
}

// Ajusta a restauração do progresso depois que o motor principal é carregado.
// Mantém o estado salvo antes de voltar a executar a cena.
function restoreSave() {
    let payload;

    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        payload = JSON.parse(raw);
    } catch (error) {
        return refuseInvalidSave("O progresso salvo não pôde ser lido.", error);
    }

    const problem = findSaveProblem(payload);
    if (problem) return refuseInvalidSave(problem);

    selectedDifficulty = DIFFICULTY_LABELS[payload.difficulty] ? payload.difficulty : "normal";
    document.body.dataset.difficulty = selectedDifficulty;
    const savedSceneIndex = findSceneIndex(payload.sceneId);
    const savedScene = roteiro.cenas[savedSceneIndex];
    // Índices fora do intervalo da cena são limitados. dialogueIndex vai de -1 até dialogos.length:
    // após o último diálogo ele vale dialogos.length, e não length - 1.
    const clampIndex = (value, min, max) => Math.min(max, Math.max(min, value));
    const rawEventIndex = Number(payload.eventIndex);
    const savedEventIndex = Number.isInteger(rawEventIndex)
        ? clampIndex(rawEventIndex, 0, savedScene.eventos.length)
        : 0;
    const savedDialogueIndex = Number.isInteger(payload.dialogueIndex)
        ? clampIndex(payload.dialogueIndex, -1, savedScene.dialogos.length)
        : -1;
    const savedSceneLog = Array.isArray(payload.sceneLog) ? payload.sceneLog : [];
    const savedJourneyLog = Array.isArray(payload.journeyLog) ? payload.journeyLog : [];
    const savedVisitedScenes = Array.isArray(payload.visitedScenes) ? payload.visitedScenes.map(Number) : [];

    loadScene(savedSceneIndex, false, false);
    clearTypewriter();
    currentEventIndex = savedEventIndex;
    currentDialogueIndex = savedDialogueIndex;
    sceneLog = savedSceneLog;
    journeyLog = savedJourneyLog;
    visitedScenes = new Set(savedVisitedScenes);
    visitedScenes.add(Number(payload.sceneId));
    scene8Checkpoint = payload.checkpoint && typeof payload.checkpoint === "object" ? payload.checkpoint : null;
    window.Investigation?.restore(payload.investigation);
    window.refreshExplorationState?.();
    currentState = "running";
    updateSceneMapSelection();
    advanceScene();
    return true;
}
