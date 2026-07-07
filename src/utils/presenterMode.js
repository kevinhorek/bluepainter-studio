const PRESENTER_STEPS = [
  { delay: 0, message: 'Presenter mode — opening workspace…', action: 'workspace' },
  { delay: 700, message: 'Resetting to a clean Pricing Card…', action: 'reset' },
  { delay: 1500, message: 'Round-trip: open PricingCard — edit canvas, code patches in place (AST sync)…', action: 'pricing' },
  { delay: 3200, message: "Breaking the design — watch Designer's Receipts flag issues…", action: 'break' },
  { delay: 5200, message: 'One-click fix — canvas and code update together…', action: 'fix' },
  { delay: 6800, message: 'Try editing code — canvas updates without losing your formatting.', action: 'code_hint' },
  { delay: 9000, message: 'Done! Export session JSON from ··· → Scorecard after your session.' },
  { delay: 11000, message: null }
];

export function runPresenterSequence({ onStep, onBreak, onFix, onReset, onPricing, ensureWorkspace }) {
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
      if (step.action === 'pricing') onPricing?.();
      if (step.action === 'break') onBreak();
      if (step.action === 'fix') onFix();
      onStep(step.message);
    }, step.delay);
    timers.push(timer);
  });

  return cancel;
}

export { PRESENTER_STEPS };
