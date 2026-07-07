import { useEffect, useState } from 'react';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to BluePainter Studio',
    body: 'This is a clickable prototype of a visual canvas ↔ code workspace. You can edit the design, watch the code update, and let Designer\'s Receipts catch issues automatically.',
    target: null,
    position: 'center'
  },
  {
    id: 'canvas',
    title: 'Visual Canvas',
    body: 'Click any element to select it. Drag to reposition, resize handles to scale, and double-click text to edit inline. Every change syncs to code instantly.',
    target: '[data-tour="canvas"]',
    position: 'right'
  },
  {
    id: 'receipts',
    title: 'Designer\'s Receipts',
    body: 'Click a receipt message at the bottom, or the checkmark in the rail, to open the sidebar with full audit details and one-click fixes.',
    target: '[data-tour="receipts"]',
    position: 'left'
  },
  {
    id: 'code',
    title: 'Bidirectional Code Sync',
    body: 'Edit the generated React TSX directly. Change padding, colors, or text — the canvas reflects your code edits. AST sync preserves your formatting when you edit the canvas.',
    target: '[data-tour="code"]',
    position: 'left'
  },
  {
    id: 'panes',
    title: 'Focus design or code',
    body: 'Use ⊞ on the Design or Code header to expand either panel to ~90%. Click again to restore split view.',
    target: '.studio-pane-bar',
    position: 'bottom'
  },
  {
    id: 'library',
    title: 'Component library',
    body: 'Open Library in the sidebar to drag PricingCard or HeroSection onto a page — they stay linked to the source files.',
    target: '[data-tour="library"]',
    position: 'left'
  },
  {
    id: 'scenarios',
    title: 'Facilitator tools',
    body: 'Open the ··· menu to break the design (trigger receipt warnings) or fix everything in one click — useful when demoing to a group.',
    target: '[data-tour="facilitator-menu"]',
    position: 'bottom'
  },
  {
    id: 'explore',
    title: 'You\'re ready',
    body: 'Click around freely — edit the canvas, edit code, switch components. When you\'re done, share feedback so we know if this is worth building.',
    target: null,
    position: 'center',
    isLast: true
  }
];

function getSpotlightRect(targetSelector) {
  if (!targetSelector) return null;
  const el = document.querySelector(targetSelector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - 8,
    left: rect.left - 8,
    width: rect.width + 16,
    height: rect.height + 16
  };
}

export default function DemoTour({ isActive, onComplete, onSkip, currentStep, setCurrentStep }) {
  const [spotlight, setSpotlight] = useState(null);
  const step = TOUR_STEPS[currentStep];

  useEffect(() => {
    if (!isActive) return;

    const updateSpotlight = () => {
      setSpotlight(getSpotlightRect(step?.target));
    };

    updateSpotlight();
    window.addEventListener('resize', updateSpotlight);
    const timer = setTimeout(updateSpotlight, 150);

    return () => {
      window.removeEventListener('resize', updateSpotlight);
      clearTimeout(timer);
    };
  }, [isActive, currentStep, step?.target]);

  if (!isActive || !step) return null;

  const handleNext = () => {
    if (step.isLast) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const isCentered = step.position === 'center' || !spotlight;
  const tooltipStyle = {};
  if (!isCentered) {
    if (step.position === 'right') {
      tooltipStyle.top = Math.max(24, spotlight.top);
      tooltipStyle.left = Math.min(spotlight.left + spotlight.width + 20, window.innerWidth - 380);
    } else if (step.position === 'left') {
      tooltipStyle.top = Math.max(24, spotlight.top);
      tooltipStyle.right = Math.max(24, window.innerWidth - spotlight.left + 20);
    } else if (step.position === 'bottom') {
      tooltipStyle.top = Math.min(spotlight.top + spotlight.height + 20, window.innerHeight - 220);
      tooltipStyle.left = Math.max(24, spotlight.left);
    }
  }

  return (
    <div className="demo-tour-overlay">
      <div className="demo-tour-backdrop" onClick={onSkip} />

      {spotlight && (
        <div
          className="demo-tour-spotlight"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height
          }}
        />
      )}

      <div
        className={`demo-tour-tooltip ${isCentered ? 'demo-tour-tooltip-center' : ''}`}
        style={tooltipStyle}
      >
        <div className="demo-tour-progress">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </div>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
        <div className="demo-tour-actions">
          <button type="button" className="demo-tour-skip" onClick={onSkip}>
            Skip tour
          </button>
          <button type="button" className="demo-tour-next" onClick={handleNext}>
            {step.isLast ? 'Start exploring' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { TOUR_STEPS };
