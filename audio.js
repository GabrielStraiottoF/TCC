/* Áudio procedural inspirado no sintetizador Web Audio do protótipo 20.
   Não depende de arquivos externos e só inicializa após interação do usuário. */
(() => {
    "use strict";

    const STORAGE_KEY = "heranca-maldita-audio-enabled-v1";
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let context = null;
    let enabled = readPreference();
    let lastFootstepAt = -Infinity;

    function readPreference() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === null ? true : saved === "true";
        } catch (_) {
            return true;
        }
    }

    function persistPreference() {
        try {
            localStorage.setItem(STORAGE_KEY, String(enabled));
        } catch (_) {
            // A preferência permanece válida durante esta sessão.
        }
    }

    function unlock() {
        if (!enabled || !AudioContextClass) return;
        try {
            if (!context) context = new AudioContextClass();
            if (context.state === "suspended") context.resume().catch(() => {});
        } catch (_) {
            context = null;
        }
    }

    function tone(frequency, duration, type = "sine", volume = 0.12, delay = 0) {
        if (!context || !enabled) return;
        const start = context.currentTime + delay;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.03);
    }

    function noise(duration, volume = 0.12, delay = 0) {
        if (!context || !enabled) return;
        const length = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, length, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            samples[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }
        const source = context.createBufferSource();
        const gain = context.createGain();
        const start = context.currentTime + delay;
        source.buffer = buffer;
        gain.gain.setValueAtTime(Math.max(0.0001, volume), start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(gain);
        gain.connect(context.destination);
        source.start(start);
        source.stop(start + duration + 0.03);
    }

    const effects = {
        footstep() {
            if (!context || context.currentTime - lastFootstepAt < 0.34) return;
            lastFootstepAt = context.currentTime;
            noise(0.055, 0.055);
            tone(74, 0.055, "sine", 0.035);
        },
        pickup() {
            tone(660, 0.07, "triangle", 0.07);
            tone(880, 0.09, "sine", 0.05, 0.07);
        },
        interact() {
            tone(220, 0.045, "square", 0.035);
        },
        jump() {
            tone(220, 0.08, "sine", 0.045);
            tone(330, 0.1, "triangle", 0.025, 0.04);
        },
        alert() {
            tone(52, 0.45, "sawtooth", 0.075);
            tone(56, 0.5, "sawtooth", 0.045, 0.08);
            noise(0.14, 0.055, 0.04);
        },
        caught() {
            noise(0.18, 0.14);
            tone(58, 0.3, "sawtooth", 0.09);
        }
    };

    function play(name) {
        if (!enabled || !effects[name]) return;
        unlock();
        effects[name]();
    }

    function updateButton() {
        const button = document.getElementById("btn-audio");
        if (!button) return;
        button.textContent = enabled ? "Som: ligado" : "Som: desligado";
        button.setAttribute("aria-pressed", String(enabled));
        button.setAttribute("aria-label", enabled ? "Desativar efeitos sonoros" : "Ativar efeitos sonoros");
    }

    function setEnabled(value) {
        enabled = Boolean(value);
        persistPreference();
        if (enabled) unlock();
        else if (context && context.state === "running") context.suspend().catch(() => {});
        updateButton();
    }

    document.addEventListener("pointerdown", unlock, { capture: true, once: true });
    document.addEventListener("keydown", unlock, { capture: true, once: true });
    document.getElementById("btn-audio")?.addEventListener("click", () => setEnabled(!enabled));

    window.GameAudio = {
        play,
        unlock,
        setEnabled,
        isEnabled: () => enabled
    };

    updateButton();
})();
