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

    if (!payload || payload.version !== 2 || findSceneIndex(payload.sceneId) === -1) {
        clearSavedGame();
        return false;
    }

    const savedSceneIndex = findSceneIndex(payload.sceneId);
    const savedEventIndex = Math.max(0, Number(payload.eventIndex) || 0);
    const savedDialogueIndex = Number.isInteger(payload.dialogueIndex) ? payload.dialogueIndex : -1;
    const savedSceneLog = Array.isArray(payload.sceneLog) ? payload.sceneLog : [];
    const savedJourneyLog = Array.isArray(payload.journeyLog) ? payload.journeyLog : [];
    const savedVisitedScenes = Array.isArray(payload.visitedScenes) ? payload.visitedScenes.map(Number) : [];

    loadScene(savedSceneIndex, false);
    clearTypewriter();
    currentEventIndex = savedEventIndex;
    currentDialogueIndex = savedDialogueIndex;
    sceneLog = savedSceneLog;
    journeyLog = savedJourneyLog;
    visitedScenes = new Set(savedVisitedScenes);
    visitedScenes.add(Number(payload.sceneId));
    currentState = "running";
    updateSceneMapSelection();
    advanceScene();
    return true;
}
