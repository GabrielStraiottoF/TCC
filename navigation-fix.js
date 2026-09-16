// Compatibilidade com o roteiro atual: as cenas principais seguem em ordem.
// As escolhas da cena 8 continuam sendo controladas pelo script.js.
window.getNextSceneId = function (scene) {
    if (!scene || !window.roteiro) return null;

    const explicitNext = scene.proximaCena ?? scene.proxima_cena ?? scene.nextScene ?? scene.proxima;
    if (explicitNext !== undefined && explicitNext !== null && explicitNext !== "") {
        const numeric = Number(explicitNext);
        return Number.isNaN(numeric) ? explicitNext : numeric;
    }

    const cenas = window.roteiro.cenas;
    const currentIndex = cenas.findIndex(item => Number(item.id) === Number(scene.id));

    if (currentIndex === -1 || currentIndex >= cenas.length - 1) return null;
    return cenas[currentIndex + 1].id;
};
