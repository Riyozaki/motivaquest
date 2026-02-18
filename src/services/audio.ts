
class AudioService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    try {
        const ctx = this.getContext();
        // Browser requires user interaction to resume context
        if(ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        
        // Envelope
        gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    } catch (e) {
        console.warn("Audio play failed", e);
    }
  }

  public playCorrect() {
    this.playTone(523.25, 'square', 0.1, 0); // C5
    this.playTone(659.25, 'square', 0.2, 0.1); // E5
  }

  public playWrong() {
    this.playTone(150, 'sawtooth', 0.15, 0);
    this.playTone(110, 'sawtooth', 0.3, 0.1);
  }

  public playCoins() {
    this.playTone(987.77, 'sine', 0.1, 0, 0.05); // B5
    this.playTone(1318.51, 'sine', 0.3, 0.05, 0.05); // E6
  }

  public playLevelUp() {
    const ctx = this.getContext();
    const now = 0;
    // Final Fantasy style arpeggio
    this.playTone(523.25, 'square', 0.1, now);       // C5
    this.playTone(659.25, 'square', 0.1, now + 0.1); // E5
    this.playTone(783.99, 'square', 0.1, now + 0.2); // G5
    this.playTone(1046.50, 'square', 0.4, now + 0.3); // C6
  }

  public playQuestComplete() {
    // Victory Fanfare short
    this.playTone(523.25, 'triangle', 0.1, 0); // C5
    this.playTone(523.25, 'triangle', 0.1, 0.1); // C5
    this.playTone(523.25, 'triangle', 0.1, 0.2); // C5
    this.playTone(698.46, 'square', 0.6, 0.3); // F5
  }
}

export const audio = new AudioService();
