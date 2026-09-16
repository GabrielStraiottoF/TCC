// Orquestra os efeitos de movimento sem mexer no fluxo do roteiro.
// O script principal continua responsável por cenas, diálogos e escolhas.

(() => {
    const container = document.getElementById('game-container');
    if (!container) return;

    let lastScene = null;
    let lastDialogText = '';

    const sceneModes = {
        1: 'station',
        2: 'bus',
        3: 'pier',
        4: 'river',
        5: 'bank',
        6: 'clearing',
        7: 'chase',
        8: 'camp',
        9: 'explosion',
        10: 'confrontation',
        11: 'trap',
        12: 'aftermath',
        13: 'workshop',
        14: 'sunset'
    };

    function updateSceneState() {
        const scene = Number(container.dataset.scene || 1);
        if (!scene || scene === lastScene) return;

        lastScene = scene;
        container.classList.remove(...Object.values(sceneModes).map(mode => `scene-${mode}`));
        container.classList.add(`scene-${sceneModes[scene] || 'forest'}`);
        container.classList.add('scene-enter');
        window.setTimeout(() => container.classList.remove('scene-enter'), 600);

        if (window.PixelArtScenes) window.PixelArtScenes.setScene(scene);
    }

    function watchScene() {
        updateSceneState();
        window.requestAnimationFrame(watchScene);
    }

    function watchDialogue() {
        const text = document.getElementById('dialog-text');
        const wrapper = document.getElementById('dialog-wrapper');
        if (text && wrapper && text.textContent !== lastDialogText) {
            lastDialogText = text.textContent;
            wrapper.classList.remove('scene-dialog-in');
            // Força a reinicialização da animação sem alterar o conteúdo.
            void wrapper.offsetWidth;
            wrapper.classList.add('scene-dialog-in');
        }
        window.requestAnimationFrame(watchDialogue);
    }

    // Atalhos visuais: setas/espaco/enter já são tratados pelo script principal.
    // Aqui só damos feedback físico à interface para reforçar a ação do jogador.
    document.addEventListener('click', event => {
        if (event.target.closest('.choice-btn, .retro-btn')) {
            const button = event.target.closest('button');
            if (button) {
                button.classList.remove('action-pop');
                void button.offsetWidth;
                button.classList.add('action-pop');
            }
        }
    });

    watchScene();
    watchDialogue();
})();
