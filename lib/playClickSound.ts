/**
 * Plays a click sound effect if sound is enabled
 * Checks localStorage for sound mode setting
 */
export function playClickSound() {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if sound effects are enabled
    const soundMode = localStorage.getItem('soundMode') || 'all';
    
    // Play click sound if mode is 'all' or 'effects'
    if (soundMode === 'all' || soundMode === 'effects') {
      const clickAudio = new Audio('/sounds/click.wav');
      clickAudio.volume = 0.5; // 50% volume for click
      clickAudio.play().catch(err => {
        console.log('Click sound prevented:', err);
      });
    }
  } catch (err) {
    console.log('Error playing click sound:', err);
  }
}
