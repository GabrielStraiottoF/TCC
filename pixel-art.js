// Renderizador procedural de pixel-art para os cenários.
// A arte é desenhada em uma resolução baixa e ampliada sem suavização,
// mantendo o aspecto pixelado sem precisar armazenar grandes PNGs.

(() => {
    const LOW_WIDTH = 160;
    const LOW_HEIGHT = 90;
    let canvas = null;
    let ctx = null;
    let currentScene = 1;
    let animationFrame = 0;
    let animationId = null;

    const palettes = {
        night: ['#06100b', '#0b1d12', '#12351b', '#1d4b25', '#4c3b25', '#d2ad5a'],
        bus: ['#080807', '#16130f', '#2c2119', '#4a3823', '#8c6b3e', '#e2bd63'],
        river: ['#041417', '#06262a', '#0a4548', '#11676a', '#2c8a83', '#cfaa55'],
        sunset: ['#120704', '#3b180d', '#713018', '#a94f29', '#df8340', '#ffd27a']
    };

    function setup() {
        const container = document.getElementById('game-container');
        if (!container) return;

        canvas = document.createElement('canvas');
        canvas.id = 'pixel-art-canvas';
        canvas.width = LOW_WIDTH;
        canvas.height = LOW_HEIGHT;
        canvas.setAttribute('aria-hidden', 'true');
        container.insertBefore(canvas, container.firstChild);
        ctx = canvas.getContext('2d', { alpha: true });
        ctx.imageSmoothingEnabled = false;

        startAnimation();
        window.addEventListener('resize', fitCanvas);
        fitCanvas();
    }

    function fitCanvas() {
        if (!canvas) return;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }

    function pixel(x, y, color, size = 1) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }

    function rect(x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    }

    function line(x1, y1, x2, y2, color, width = 1) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x1), Math.floor(y1), Math.max(1, Math.floor(x2 - x1)), Math.max(width, 1));
    }

    function clear(color = 'transparent') {
        ctx.clearRect(0, 0, LOW_WIDTH, LOW_HEIGHT);
        if (color !== 'transparent') rect(0, 0, LOW_WIDTH, LOW_HEIGHT, color);
    }

    function skyGradient(top, bottom, horizon = 48) {
        const gradient = ctx.createLinearGradient(0, 0, 0, horizon);
        gradient.addColorStop(0, top);
        gradient.addColorStop(1, bottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, LOW_WIDTH, horizon);
    }

    function blockTree(x, y, scale = 1, color = '#12351b') {
        rect(x + 5 * scale, y, 4 * scale, 30 * scale, '#2b2518');
        rect(x, y + 5 * scale, 14 * scale, 6 * scale, color);
        rect(x - 4 * scale, y + 11 * scale, 22 * scale, 7 * scale, color);
        rect(x - 7 * scale, y + 18 * scale, 29 * scale, 8 * scale, color);
    }

    function bushes(color, step = 12) {
        for (let x = 0; x < LOW_WIDTH; x += step) {
            const h = 5 + ((x * 13 + currentScene * 7) % 9);
            rect(x, 70 - h, 7, h + 10, color);
            pixel(x + 2, 67 - h, color, 3);
        }
    }

    function road(y = 66) {
        ctx.fillStyle = '#171512';
        ctx.beginPath();
        ctx.moveTo(58, y);
        ctx.lineTo(102, y);
        ctx.lineTo(145, 90);
        ctx.lineTo(15, 90);
        ctx.closePath();
        ctx.fill();
        rect(76, y + 7, 8, 2, '#cfb46b');
        rect(75, y + 18, 10, 2, '#cfb46b');
    }

    function drawScene(scene) {
        currentScene = scene;
        const p = scene === 2 ? palettes.bus : scene === 3 || scene === 4 || scene === 5 ? palettes.river : scene === 14 ? palettes.sunset : palettes.night;
        clear(p[0]);

        switch (scene) {
            case 1: drawBusStation(p); break;
            case 2: drawBusInterior(p); break;
            case 3: drawPier(p); break;
            case 4: drawRiver(p); break;
            case 5: drawRiverBank(p); break;
            case 6: drawClearing(p); break;
            case 7: drawChase(p); break;
            case 8: drawCamp(p); break;
            case 9: drawExplosion(p); break;
            case 10: drawEncounter(p); break;
            case 11: drawRopeTrap(p); break;
            case 12: drawAftermath(p); break;
            case 13: drawWorkshop(p); break;
            case 14: drawSunset(p); break;
            default: drawForest(p);
        }

        drawAnimatedAtmosphere(scene);
    }

    function drawBusStation(p) {
        skyGradient('#24201a', '#706145', 48);
        rect(0, 48, 160, 42, '#29231c');
        for (let x = 8; x < 160; x += 26) {
            rect(x, 20, 5, 48, '#40382c');
            rect(x - 2, 18, 9, 4, '#66563a');
        }
        for (let x = 23; x < 145; x += 34) rect(x, 12, 18, 3, '#d9b35b');
        rect(95, 42, 50, 24, '#293b35');
        rect(101, 46, 38, 9, '#0a1110');
        rect(113, 57, 14, 9, '#161412');
        bushes('#19331c', 18);
    }

    function drawBusInterior(p) {
        skyGradient('#17130f', '#31261a', 56);
        rect(0, 0, 160, 9, '#0a0908');
        rect(10, 10, 140, 5, '#887044');
        for (let x = 12; x < 150; x += 28) rect(x, 17, 17, 3, '#d9b35b');
        for (let x = 15; x < 150; x += 30) {
            rect(x, 30, 18, 23, '#453222');
            rect(x + 22, 30, 18, 23, '#453222');
        }
        rect(70, 22, 20, 50, '#181411');
        for (let x = 3; x < 160; x += 20) rect(x, 59, 15, 2, '#6d5839');
        for (let i = 0; i < 10; i++) pixel(15 + i * 13, 25 + ((i * 7) % 25), i % 2 ? '#21402a' : '#0f2117', 3);
    }

    function drawPier(p) {
        skyGradient('#102a2a', '#22565a', 48);
        rect(0, 48, 160, 42, '#0a3338');
        for (let y = 53; y < 88; y += 7) rect(0, y, 160, 1, '#2d7774');
        rect(15, 32, 34, 18, '#392d1f');
        rect(12, 28, 40, 5, '#6b5432');
        rect(26, 42, 6, 14, '#cfab55');
        rect(54, 61, 75, 5, '#654a2e');
        for (let x = 59; x < 126; x += 12) rect(x, 60, 2, 19, '#463722');
        bushes('#123820', 16);
    }

    function drawRiver(p) {
        skyGradient('#0a251f', '#1b594f', 42);
        rect(0, 43, 160, 47, '#0a4548');
        for (let y = 49; y < 85; y += 6) {
            for (let x = 0; x < 160; x += 16) rect(x + ((y / 6) % 2) * 4, y, 9, 1, '#2b8a83');
        }
        for (let x = 0; x < 160; x += 21) blockTree(x, 22 + (x % 17), 1, x % 2 ? '#12351b' : '#1a4322');
        rect(67, 50, 26, 4, '#081b17');
        pixel(80, 46, '#cfab55', 3);
    }

    function drawRiverBank(p) {
        drawRiver(p);
        rect(0, 59, 65, 31, '#4f3925');
        rect(0, 57, 70, 4, '#755335');
        for (let x = 73; x < 160; x += 20) blockTree(x, 25 + (x % 15), 1, '#164521');
        rect(86, 56, 11, 30, '#172817');
        line(91, 56, 78, 86, '#263a1f', 3);
        pixel(43, 65, '#241b12', 4);
        pixel(52, 69, '#241b12', 3);
        pixel(61, 75, '#241b12', 2);
    }

    function drawClearing(p) {
        skyGradient('#1a3519', '#2f4421', 42);
        rect(0, 48, 160, 42, '#3e2d1e');
        for (let x = 0; x < 160; x += 23) {
            rect(x, 25 + (x % 13), 5, 38, '#3b3023');
            rect(x - 5, 25 + (x % 13), 18, 3, '#4f3924');
        }
        rect(42, 61, 20, 7, '#24190f');
        rect(94, 57, 27, 8, '#24190f');
        pixel(49, 59, '#9c6d37', 2);
        pixel(103, 55, '#9c6d37', 2);
        bushes('#1a3619', 18);
    }

    function drawChase(p) {
        skyGradient('#091b0c', '#12351a', 45);
        for (let x = -10; x < 170; x += 20) {
            blockTree(x + ((animationFrame / 4) % 10), 15 + (x % 19), 1, '#0a2612');
        }
        rect(0, 65, 160, 25, '#061106');
        for (let i = 0; i < 8; i++) pixel(22 + i * 19, 52 + ((i * 11) % 17), '#7a2b24', 2);
        if (animationFrame % 90 < 28) {
            rect(116, 27, 9, 26, '#130c0b');
            pixel(118, 31, '#c64c32', 2);
            pixel(123, 31, '#c64c32', 2);
        }
    }

    function drawCamp(p) {
        skyGradient('#162a16', '#24371a', 45);
        for (let x = 8; x < 160; x += 29) blockTree(x, 22 + (x % 15), 1, '#163a1c');
        // barraca
        ctx.fillStyle = '#5c6744';
        ctx.beginPath();
        ctx.moveTo(52, 55); ctx.lineTo(75, 36); ctx.lineTo(98, 55); ctx.closePath(); ctx.fill();
        rect(61, 49, 28, 10, '#38432e');
        // fogueira
        pixel(28, 65, '#f2ca65', 3); pixel(32, 65, '#d9672b', 3); pixel(30, 61, '#ffd978', 2);
        rect(105, 64, 18, 3, '#6d5030');
        pixel(111, 67, '#20170d', 4);
        pixel(121, 72, '#20170d', 3);
    }

    function drawExplosion(p) {
        drawClearing(p);
        const pulse = Math.sin(animationFrame * 0.22);
        const r = 8 + Math.floor((pulse + 1) * 5);
        for (let i = 0; i < 9; i++) {
            const x = 80 + Math.round(Math.cos(i) * r);
            const y = 56 + Math.round(Math.sin(i) * r);
            pixel(x, y, i % 2 ? '#ff8d2e' : '#ffe083', 2);
        }
        rect(75, 50, 12, 9, '#f2e3ab');
        pixel(72, 49, '#ff6a2c', 3);
        pixel(88, 54, '#ff6a2c', 2);
    }

    function drawEncounter(p) {
        drawForest(p);
        drawMapinguari(100, 33, 0.8);
        // ponto fraco luminoso
        pixel(103, 42, '#ffd76a', 2);
        rect(30, 65, 16, 3, '#3e3024');
        rect(42, 63, 5, 3, '#b9aa8a');
    }

    function drawRopeTrap(p) {
        drawForest(p);
        line(18, 61, 67, 54, '#a89062', 2);
        line(67, 54, 122, 65, '#a89062', 2);
        pixel(67, 54, '#d0b17a', 2);
        drawMapinguari(117, 35, 0.7);
    }

    function drawAftermath(p) {
        skyGradient('#6d6948', '#31542a', 48);
        rect(0, 47, 160, 43, '#173615');
        for (let x = 2; x < 160; x += 22) blockTree(x, 18 + (x % 11), 1, '#275427');
        rect(74, 45, 12, 40, '#533e26');
        pixel(80, 42, '#f6cc75', 4);
        for (let x = 66; x < 98; x += 6) pixel(x, 63 + (x % 8), '#8e784f', 2);
    }

    function drawWorkshop(p) {
        skyGradient('#4b473e', '#77705b', 42);
        rect(0, 42, 160, 48, '#2d2923');
        rect(17, 23, 103, 44, '#48443c');
        for (let x = 20; x < 120; x += 14) rect(x, 18, 10, 6, '#6e6759');
        rect(75, 27, 24, 15, '#11110f');
        rect(27, 48, 26, 10, '#151515');
        pixel(34, 40, '#d4ae5d', 3);
        pixel(49, 40, '#d4ae5d', 3);
        rect(5, 69, 35, 5, '#5a472d');
        for (let i = 0; i < 6; i++) pixel(124 + i * 5, 63 + (i % 3), '#2e4c28', 4);
    }

    function drawSunset(p) {
        skyGradient('#a44b2d', '#e18a45', 48);
        rect(0, 48, 160, 42, '#1c160f');
        rect(112, 27, 10, 10, '#ffd479');
        road(58);
        bushes('#23351a', 15);
        blockTree(8, 30, 1, '#182918');
        blockTree(139, 26, 1, '#182918');
        if (animationFrame % 140 < 90) pixel(91, 52, '#5d301c', 2);
    }

    function drawForest(p) {
        skyGradient('#0a2010', '#143919', 44);
        for (let x = 0; x < 160; x += 19) blockTree(x, 18 + (x % 17), 1, x % 3 === 0 ? '#0a2512' : '#123718');
        rect(0, 60, 160, 30, '#071207');
        bushes('#16351a', 11);
    }

    function drawMapinguari(x, y, scale = 1) {
        const s = scale;
        rect(x - 7 * s, y + 4 * s, 15 * s, 22 * s, '#4a2d24');
        rect(x - 10 * s, y + 10 * s, 21 * s, 10 * s, '#5a382a');
        rect(x - 5 * s, y, 10 * s, 9 * s, '#43251f');
        rect(x - 11 * s, y + 11 * s, 5 * s, 20 * s, '#3a241f');
        rect(x + 6 * s, y + 11 * s, 5 * s, 20 * s, '#3a241f');
        rect(x - 5 * s, y + 23 * s, 4 * s, 8 * s, '#2d1d1a');
        rect(x + 2 * s, y + 23 * s, 4 * s, 8 * s, '#2d1d1a');
        pixel(x - 3 * s, y + 3 * s, '#c8563e', Math.max(1, Math.round(2 * s)));
        pixel(x + 2 * s, y + 3 * s, '#c8563e', Math.max(1, Math.round(2 * s)));
    }

    function drawAnimatedAtmosphere(scene) {
        // Partículas, chuva ou névoa em baixa quantidade para não esconder a arte.
        const rainScenes = [2, 3, 4, 7, 8];
        const fogScenes = [4, 5, 7, 11, 12];
        if (rainScenes.includes(scene)) {
            for (let i = 0; i < 18; i++) {
                const x = (i * 29 + animationFrame * 2) % LOW_WIDTH;
                const y = (i * 17 + animationFrame * 3) % LOW_HEIGHT;
                rect(x, y, 1, 3, 'rgba(156,199,191,.35)');
            }
        }
        if (fogScenes.includes(scene)) {
            const shift = (animationFrame * 0.3) % 40;
            rect(-20 + shift, 50, 42, 4, 'rgba(191,203,173,.08)');
            rect(50 - shift, 61, 50, 3, 'rgba(191,203,173,.07)');
        }
        if (scene === 7) {
            const x = 25 + ((animationFrame * 4) % 120);
            rect(x, 59, 7, 2, 'rgba(165,185,118,.4)');
        }
    }

    function startAnimation() {
        if (animationId) cancelAnimationFrame(animationId);
        const loop = () => {
            animationFrame++;
            drawScene(currentScene);
            animationId = requestAnimationFrame(loop);
        };
        loop();
    }

    window.PixelArtScenes = {
        setScene(sceneId) {
            const parsed = Number(sceneId);
            if (Number.isFinite(parsed)) {
                currentScene = parsed;
                drawScene(currentScene);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
        setup();
    }
})();
