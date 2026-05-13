let audioContext = null;
let masterGain = null;
const lastPlayedAt = new Map();
const MASTER_VOLUME = 0.22;
const THROTTLE_MS = {
    ui: 34,
    rotate: 42,
    tab: 52,
    blocked: 90,
};
function getAudioContext() {
    if (typeof window === 'undefined')
        return null;
    if (audioContext)
        return audioContext;
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtor)
        return null;
    audioContext = new AudioCtor();
    masterGain = audioContext.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(audioContext.destination);
    return audioContext;
}
function shouldPlay(id, now) {
    const throttle = THROTTLE_MS[id] ?? 0;
    if (throttle <= 0)
        return true;
    const prev = lastPlayedAt.get(id) ?? -Infinity;
    if (now - prev < throttle)
        return false;
    lastPlayedAt.set(id, now);
    return true;
}
export function unlockSfx() {
    const ctx = getAudioContext();
    if (!ctx)
        return;
    if (ctx.state === 'suspended') {
        void ctx.resume();
    }
}
function tone(ctx, start, duration, frequency, gain, options = {}) {
    if (!masterGain)
        return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const filter = options.filterHz ? ctx.createBiquadFilter() : null;
    osc.type = options.type ?? 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    if (options.endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), start + duration);
    }
    if (options.detune) {
        osc.detune.setValueAtTime(options.detune, start);
    }
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    if (filter) {
        filter.type = 'bandpass';
        filter.frequency.value = options.filterHz ?? 1200;
        filter.Q.value = 7;
        osc.connect(filter);
        filter.connect(amp);
    }
    else {
        osc.connect(amp);
    }
    amp.connect(masterGain);
    osc.start(start);
    osc.stop(start + duration + 0.02);
}
function noise(ctx, start, duration, gain, filterHz) {
    if (!masterGain)
        return;
    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = filterHz;
    filter.Q.value = 4.5;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.004);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(masterGain);
    source.start(start);
    source.stop(start + duration + 0.02);
}
export function playSfx(id) {
    const ctx = getAudioContext();
    if (!ctx || !shouldPlay(id, performance.now()))
        return;
    if (ctx.state === 'suspended') {
        void ctx.resume();
    }
    const t = ctx.currentTime;
    switch (id) {
        case 'ui':
            tone(ctx, t, 0.04, 720, 0.08, { endFrequency: 1080, type: 'triangle' });
            noise(ctx, t, 0.035, 0.018, 2400);
            break;
        case 'start':
            tone(ctx, t, 0.12, 98, 0.12, { endFrequency: 196, type: 'sawtooth', filterHz: 360 });
            tone(ctx, t + 0.055, 0.11, 880, 0.09, { endFrequency: 1760, type: 'triangle' });
            noise(ctx, t + 0.02, 0.08, 0.025, 1800);
            break;
        case 'back':
            tone(ctx, t, 0.07, 620, 0.08, { endFrequency: 260, type: 'triangle' });
            break;
        case 'panel':
            tone(ctx, t, 0.07, 220, 0.11, { endFrequency: 440, type: 'sawtooth', filterHz: 520 });
            tone(ctx, t + 0.045, 0.06, 1380, 0.06, { endFrequency: 920, type: 'sine' });
            break;
        case 'rotate':
            tone(ctx, t, 0.035, 430, 0.075, { endFrequency: 760, type: 'square', filterHz: 1200 });
            noise(ctx, t, 0.028, 0.018, 3100);
            break;
        case 'clear':
            tone(ctx, t, 0.13, 392, 0.1, { endFrequency: 784, type: 'triangle' });
            tone(ctx, t + 0.07, 0.16, 587, 0.09, { endFrequency: 1174, type: 'triangle' });
            tone(ctx, t + 0.15, 0.2, 880, 0.075, { endFrequency: 1760, type: 'sine' });
            noise(ctx, t + 0.05, 0.16, 0.022, 4200);
            break;
        case 'fail':
            tone(ctx, t, 0.18, 180, 0.12, { endFrequency: 52, type: 'sawtooth', filterHz: 180 });
            noise(ctx, t, 0.14, 0.05, 740);
            break;
        case 'sell':
            tone(ctx, t, 0.06, 640, 0.08, { endFrequency: 960, type: 'triangle' });
            tone(ctx, t + 0.045, 0.08, 980, 0.08, { endFrequency: 1480, type: 'triangle' });
            break;
        case 'buy':
            tone(ctx, t, 0.08, 110, 0.14, { endFrequency: 82, type: 'sawtooth', filterHz: 280 });
            tone(ctx, t + 0.07, 0.09, 1180, 0.08, { endFrequency: 1560, type: 'sine' });
            noise(ctx, t + 0.02, 0.05, 0.026, 2600);
            break;
        case 'skill':
            tone(ctx, t, 0.11, 523, 0.075, { endFrequency: 1046, type: 'triangle' });
            tone(ctx, t + 0.035, 0.12, 659, 0.065, { endFrequency: 1318, type: 'triangle' });
            break;
        case 'tab':
            tone(ctx, t, 0.045, 560, 0.055, { endFrequency: 720, type: 'triangle' });
            break;
        case 'blocked':
            tone(ctx, t, 0.07, 130, 0.08, { endFrequency: 92, type: 'square', filterHz: 300 });
            noise(ctx, t, 0.035, 0.018, 520);
            break;
        default:
            break;
    }
}
