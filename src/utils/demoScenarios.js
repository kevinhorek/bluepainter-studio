import { cloneNodes, initialHeroNodes, initialPricingNodes } from '../data/mockComponents';
import { getFreshDashboardNodes } from '../data/dashboardPage';

export function getFreshPricingNodes() {
  return cloneNodes(initialPricingNodes);
}

export function getFreshHeroNodes() {
  return cloneNodes(initialHeroNodes);
}

export { getFreshDashboardNodes };

export function applyBrokenDesignScenario(nodes) {
  const updated = cloneNodes(nodes);

  if (updated['pricing-card-frame']) {
    updated['pricing-card-frame'].style = {
      ...updated['pricing-card-frame'].style,
      padding: 34,
      borderRadius: 13
    };
  }

  if (updated['cta-button']) {
    updated['cta-button'].style = {
      ...updated['cta-button'].style,
      background: '#cbd5e1'
    };
    updated['cta-button'].text = 'Submit';
  }

  if (updated['features-list']) {
    updated['feature-item-4'] = {
      id: 'feature-item-4',
      type: 'list-item',
      name: 'Feature 4',
      tag: 'li',
      style: { fontSize: 14, color: '#475569' },
      text: 'Advanced analytics'
    };
    updated['feature-item-5'] = {
      id: 'feature-item-5',
      type: 'list-item',
      name: 'Feature 5',
      tag: 'li',
      style: { fontSize: 14, color: '#475569' },
      text: 'Team collaboration'
    };
    updated['feature-item-6'] = {
      id: 'feature-item-6',
      type: 'list-item',
      name: 'Feature 6',
      tag: 'li',
      style: { fontSize: 14, color: '#475569' },
      text: 'White-label exports'
    };
    updated['features-list'].children = [
      'feature-item-1',
      'feature-item-2',
      'feature-item-3',
      'feature-item-4',
      'feature-item-5',
      'feature-item-6'
    ];
  }

  return updated;
}

export function applyFixedDesignScenario() {
  return getFreshPricingNodes();
}
