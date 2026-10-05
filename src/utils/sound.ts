export const playSound = (soundType: 'study_starting' | 'study_break' | 'class_starting' | 'class_closed') => {
  try {
    const audio = new Audio(`/${soundType}.wav`);
    audio.volume = 0.8;
    audio.play().catch(e => {
      // Audio playback might be blocked by browser autoplay policies until user interacts
      console.warn("Audio play blocked or unavailable:", e);
    });
  } catch (err) {
    console.warn("Sound error:", err);
  }
};
