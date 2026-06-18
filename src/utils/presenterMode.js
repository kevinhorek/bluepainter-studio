const PRESENTER_STEPS = [
  { delay: 0, message: 'Presenter mode — opening workspace…', action: 'workspace' },
  { delay: 700, message: 'Resetting to a clean Pricing Card…', action: 'reset' },
  { delay: 1600, message: "Breaking the design — watch Designer's Receipts flag issues…", action: 'break' },
  { delay: 3800, message: 'One-click fix — canvas and code update together…', action: 'fix' },
  { delay: 5500, message: 'Done! Switch to Phase 3 (Figma) or Phase 4 (Responsive) to close.' },
  { delay: 8500, message: null }
];

export function runPresenterSequence({ onStep, onBreak, onFix, onReset, ensureWorkspace }) {
  let cancelled = false;
  const timers = [];

  const cancel = () => {
    cancelled = true;
    timers.forEach(clearTimeout);
  };

  PRESENTER_STEPS.forEach((step) => {
    const timer = setTimeout(() => {
      if (cancelled) return;
      if (step.action === 'workspace') ensureWorkspace();
      if (step.action === 'reset') onReset();
      if (step.action === 'break') onBreak();
      if (step.action === 'fix') onFix();
      onStep(step.message);
    }, step.delay);
    timers.push(timer);
  });

  return cancel;
}

export { PRESENTER_STEPS };
