import confetti from 'canvas-confetti';

export function triggerCelebrationAnimation(event?: React.MouseEvent) {
  let origin = { x: 0.5, y: 0.7 };
  if (event) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    origin = {
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight,
    };
  }

  // Festive golden & rose colored confetti
  confetti({
    particleCount: 45,
    spread: 60,
    origin,
    colors: ['#f59e0b', '#f43f5e', '#ec4899', '#fbbf24', '#10b981'],
    disableForReducedMotion: true,
  });
}
