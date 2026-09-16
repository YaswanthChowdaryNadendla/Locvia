// src/services/notificationSoundService.js
// Module 38 — Web Audio API Notification Sound Service
// Generates clear, pleasant notification chimes without external audio assets.
// Handles browser autoplay restrictions gracefully.

const SOUND_PREF_PREFIX = 'locvia_notification_sound_';

// AudioContext singleton
let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return null;

  if (!audioCtx) {
    try {
      audioCtx = new AudioCtxClass();
    } catch {
      audioCtx = null;
    }
  }
  return audioCtx;
};

/**
 * Check if sound is enabled for a specific user (default: true)
 */
export const isSoundEnabled = (userId) => {
  if (!userId) return true;
  try {
    const raw = localStorage.getItem(`${SOUND_PREF_PREFIX}${userId}`);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading sound preference:', err);
  }
  return true; // Default ON
};

/**
 * Persist sound preference for a specific user
 */
export const setSoundEnabled = (userId, enabled) => {
  if (!userId) return;
  try {
    localStorage.setItem(`${SOUND_PREF_PREFIX}${userId}`, JSON.stringify(Boolean(enabled)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('locvia_sound_pref_changed', { detail: { userId, enabled: Boolean(enabled) } })
      );
    }
  } catch (err) {
    console.error('Error saving sound preference:', err);
  }
};

/**
 * Helper to play a series of synthesized melodic tones.
 * Uses smooth gain ramps to avoid any clicking or harshness.
 */
const playToneSequence = async (tones) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Autoplay blocked before user interaction — fail silently
        return;
      }
    }

    if (ctx.state !== 'running') return;

    let startTime = ctx.currentTime + 0.05;

    tones.forEach(({ freq, duration = 0.15, gain = 0.15, type = 'sine', gap = 0.04 }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Envelope: attack (0.01s) -> sustain -> exponential decay
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.02);

      startTime += duration + gap;
    });
  } catch {
    // Autoplay restrictions or audio error: safe silent fallback
  }
};

/**
 * Shop Owner Notification Sound:
 * 3-tone ascending chime (D5 -> A5 -> D6)
 * Noticeable, professional, pleasant, non-continuous
 */
export const playNewOrderSound = async (userId) => {
  if (userId && !isSoundEnabled(userId)) return;

  await playToneSequence([
    { freq: 587.33, duration: 0.12, gain: 0.18, type: 'sine', gap: 0.05 }, // D5
    { freq: 880.0, duration: 0.12, gain: 0.20, type: 'sine', gap: 0.05 },  // A5
    { freq: 1174.66, duration: 0.28, gain: 0.22, type: 'sine', gap: 0.0 }, // D6
  ]);
};

/**
 * Delivery Partner Notification Sound:
 * 2-tone alert chime (F5 -> C6)
 * Prompt, distinct, clear
 */
export const playDeliveryAssignedSound = async (userId) => {
  if (userId && !isSoundEnabled(userId)) return;

  await playToneSequence([
    { freq: 698.46, duration: 0.14, gain: 0.20, type: 'triangle', gap: 0.06 }, // F5
    { freq: 1046.50, duration: 0.30, gain: 0.22, type: 'sine', gap: 0.0 },     // C6
  ]);
};

/**
 * Initialize / unlock audio on first user click if suspended
 */
export const initAudioOnInteraction = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
};
