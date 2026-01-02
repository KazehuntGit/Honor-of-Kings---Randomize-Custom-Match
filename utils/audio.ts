
// Use Web Audio API for synthesizer-based UI sounds (No external files required)

export const playClickSound = () => {
  try {
    // Support for standard and webkit audio contexts
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Tech/Futuristic "Chirp" sound design
    // Start high, go higher, then drop fast
    const now = ctx.currentTime;
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    // Short envelope to avoid clicking/popping
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02); // Volume 15%
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.2);

    // Clean up context after a short delay to prevent memory leaks
    setTimeout(() => {
        if(ctx.state !== 'closed') ctx.close();
    }, 1000);

  } catch (error) {
    // Silently fail if audio is blocked or not supported
    console.warn("Audio playback prevented:", error);
  }
};
