// Motion primitives for shramdan-web (Phase 8).
//
// Calm, soft, predictable. The same easing + same stagger across the app
// so every section feels like it belongs to one rhythm.
//
// Respects prefers-reduced-motion automatically when consumed via
// MotionSection / StaggerList wrappers in src/components/MotionSection.js.

const easeOutExpo = [0.16, 1, 0.3, 1];

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: easeOutExpo },
};

export const fadeUpInView = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45, ease: easeOutExpo },
};

export const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  viewport: { once: true, amount: 0.15 },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.35, ease: easeOutExpo },
};

export const heroChildVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: easeOutExpo },
};

export const heroContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
