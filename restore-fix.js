// Ajusta a restauração do progresso depois que o motor principal é carregado.
// Mantém o estado salvo antes de voltar a executar a cena.
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

    if (!payload || ![2, 3].includes(payload.version) || findSceneIndex(payload.sceneId) === -1) {
        clearSavedGame();
        return false;
    }

    selectedDifficulty = DIFFICULTY_LABELS[payload.difficulty] ? payload.difficulty : "normal";
    document.body.dataset.difficulty = selectedDifficulty;
    const savedSceneIndex = findSceneIndex(payload.sceneId);
    const savedScene = roteiro.cenas[savedSceneIndex];
    // Índices fora do intervalo da cena são limitados para não pular a narração.
    const clampIndex = (value, min, max) => Math.min(max, Math.max(min, value));
    const rawEventIndex = Number(payload.eventIndex);
    const savedEventIndex = Number.isInteger(rawEventIndex)
        ? clampIndex(rawEventIndex, 0, savedScene.eventos.length)
        : 0;
    const savedDialogueIndex = Number.isInteger(payload.dialogueIndex)
        ? clampIndex(payload.dialogueIndex, -1, savedScene.dialogos.length - 1)
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
    window.Investigation?.restore(payload.investigation);
    window.refreshExplorationState?.();
    currentState = "running";
    updateSceneMapSelection();
    advanceScene();
    return true;
}
