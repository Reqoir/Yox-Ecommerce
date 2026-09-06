/**
 * @file audio.ts
 * @description Web Audio API notification chime synthesizer.
 *
 * Generates a pleasant two-tone bell chime on new admin notifications.
 * No file downloads, no latency — pure Web Audio API synthesis.
 */

export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playTone = (frequency: number, startTime: number, duration: number, volume = 0.3) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // Envelope: quick attack, long decay (bell-like)
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;

    // Chord: C6 then E6 then G6 (major triad arpeggio — pleasant, attention-grabbing)
    playTone(1046.5, now, 0.6, 0.25);        // C6
    playTone(1318.5, now + 0.12, 0.6, 0.2);  // E6
    playTone(1568.0, now + 0.24, 0.8, 0.18); // G6

    // Close audio context after sounds finish
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Web Audio API not supported or blocked — silently ignore
  }
}
