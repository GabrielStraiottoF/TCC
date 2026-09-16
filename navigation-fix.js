// Compatibilidade com o roteiro atual: as cenas principais seguem em ordem.
// As escolhas da cena 8 continuam sendo controladas pelo script.js.
window.getNextSceneId = function (scene) {
    if (!scene) return null;

    const explicitNext = scene.proximaCena ?? scene.proxima_cena ?? scene.nextScene ?? scene.proxima;
    if (explicitNext !== undefined && explicitNext !== null && explicitNext !== "") {
        const numeric = Number(explicitNext);
        return Number.isNaN(numeric) ? explicitNext : numeric;
    }

    const sequentialNext = {
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
    };

    return Object.prototype.hasOwnProperty.call(sequentialNext, Number(scene.id))
        ? sequentialNext[Number(scene.id)]
        : null;
};
