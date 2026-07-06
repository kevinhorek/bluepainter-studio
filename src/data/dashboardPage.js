import { cloneNodes } from './mockComponents';

export const initialDashboardNodes = {
  'dashboard-page': {
    id: 'dashboard-page',
    type: 'frame',
    name: 'Dashboard Page',
    tag: 'div',
    style: {
      position: 'relative',
      width: 1280,
      height: 800,
      display: 'flex',
      flexDirection: 'row',
      background: '#f1f5f9',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderStyle: 'solid'
    },
    children: ['sidebar', 'main-column']
  },

  sidebar: {
    id: 'sidebar',
    type: 'frame',
    name: 'Sidebar',
    tag: 'aside',
    style: {
      width: 240,
      minWidth: 240,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0f172a',
      padding: 24,
      gap: 32
    },
    children: ['sidebar-brand', 'sidebar-nav']
  },
  'sidebar-brand': {
    id: 'sidebar-brand',
    type: 'frame',
    name: 'Brand',
    tag: 'div',
    style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 },
    children: ['sidebar-logo-dot', 'sidebar-brand-text']
  },
  'sidebar-logo-dot': {
    id: 'sidebar-logo-dot',
    type: 'frame',
    name: 'Logo',
    tag: 'div',
    style: {
      width: 28,
      height: 28,
      borderRadius: 6,
      background: 'linear-gradient(135deg, #2563eb, #db2777)'
    },
    children: []
  },
  'sidebar-brand-text': {
    id: 'sidebar-brand-text',
    type: 'text',
    name: 'Brand Name',
    tag: 'span',
    style: { fontSize: 15, fontWeight: 700, color: '#ffffff' },
    text: 'Acme Studio'
  },
  'sidebar-nav': {
    id: 'sidebar-nav',
    type: 'frame',
    name: 'Navigation',
    tag: 'nav',
    style: { display: 'flex', flexDirection: 'column', gap: 4 },
    children: ['nav-dashboard', 'nav-team', 'nav-settings']
  },
  'nav-dashboard': {
    id: 'nav-dashboard',
    type: 'frame',
    name: 'Nav Dashboard',
    tag: 'div',
    style: {
      padding: '10px 12px',
      borderRadius: 6,
      background: 'rgba(37, 99, 235, 0.2)',
      fontSize: 14,
      fontWeight: 600,
      color: '#ffffff'
    },
    children: ['nav-dashboard-text']
  },
  'nav-dashboard-text': {
    id: 'nav-dashboard-text',
    type: 'text',
    name: 'Dashboard Link',
    tag: 'span',
    style: { fontSize: 14, fontWeight: 600, color: '#ffffff' },
    text: 'Dashboard'
  },
  'nav-team': {
    id: 'nav-team',
    type: 'frame',
    name: 'Nav Team',
    tag: 'div',
    style: { padding: '10px 12px', borderRadius: 6, fontSize: 14, color: '#94a3b8' },
    children: ['nav-team-text']
  },
  'nav-team-text': {
    id: 'nav-team-text',
    type: 'text',
    name: 'Team Link',
    tag: 'span',
    style: { fontSize: 14, color: '#94a3b8' },
    text: 'Team'
  },
  'nav-settings': {
    id: 'nav-settings',
    type: 'frame',
    name: 'Nav Settings',
    tag: 'div',
    style: { padding: '10px 12px', borderRadius: 6, fontSize: 14, color: '#94a3b8' },
    children: ['nav-settings-text']
  },
  'nav-settings-text': {
    id: 'nav-settings-text',
    type: 'text',
    name: 'Settings Link',
    tag: 'span',
    style: { fontSize: 14, color: '#94a3b8' },
    text: 'Settings'
  },

  'main-column': {
    id: 'main-column',
    type: 'frame',
    name: 'Main Column',
    tag: 'div',
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      height: '100%'
    },
    children: ['page-header', 'page-content']
  },
  'page-header': {
    id: 'page-header',
    type: 'frame',
    name: 'Page Header',
    tag: 'header',
    style: {
      height: 64,
      minHeight: 64,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      background: '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid'
    },
    children: ['page-title', 'header-actions']
  },
  'page-title': {
    id: 'page-title',
    type: 'text',
    name: 'Page Title',
    tag: 'h1',
    style: { fontSize: 20, fontWeight: 700, color: '#0f172a' },
    text: 'Dashboard'
  },
  'header-actions': {
    id: 'header-actions',
    type: 'frame',
    name: 'Header Actions',
    tag: 'div',
    style: { display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 16 },
    children: ['search-box', 'avatar']
  },
  'search-box': {
    id: 'search-box',
    type: 'frame',
    name: 'Search',
    tag: 'div',
    style: {
      padding: '8px 14px',
      borderRadius: 8,
      background: '#f1f5f9',
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      width: 200
    },
    children: ['search-placeholder']
  },
  'search-placeholder': {
    id: 'search-placeholder',
    type: 'text',
    name: 'Search Placeholder',
    tag: 'span',
    style: { fontSize: 13, color: '#94a3b8' },
    text: 'Search…'
  },
  avatar: {
    id: 'avatar',
    type: 'frame',
    name: 'Avatar',
    tag: 'div',
    style: {
      width: 36,
      height: 36,
      borderRadius: 18,
      background: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    children: ['avatar-initials']
  },
  'avatar-initials': {
    id: 'avatar-initials',
    type: 'text',
    name: 'Avatar Initials',
    tag: 'span',
    style: { fontSize: 13, fontWeight: 700, color: '#ffffff' },
    text: 'KH'
  },

  'page-content': {
    id: 'page-content',
    type: 'frame',
    name: 'Page Content',
    tag: 'main',
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      padding: 32,
      overflow: 'auto'
    },
    children: ['stats-row', 'components-row', 'team-panel']
  },

  'components-row': {
    id: 'components-row',
    type: 'frame',
    name: 'Imported Components',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      gap: 24,
      alignItems: 'flex-start',
      flexWrap: 'wrap'
    },
    children: ['hero-instance', 'pricing-instance']
  },
  'hero-instance': {
    id: 'hero-instance',
    type: 'component-instance',
    name: 'HeroSection',
    refFile: 'hero',
    tag: 'div',
    style: { flex: 1, minWidth: 420 }
  },
  'pricing-instance': {
    id: 'pricing-instance',
    type: 'component-instance',
    name: 'PricingCard',
    refFile: 'pricing',
    tag: 'div',
    style: { flexShrink: 0 }
  },

  'stats-row': {
    id: 'stats-row',
    type: 'frame',
    name: 'Stats Row',
    tag: 'div',
    style: { display: 'flex', flexDirection: 'row', gap: 16 },
    children: ['stat-card-revenue', 'stat-card-users', 'stat-card-projects']
  },
  'stat-card-revenue': {
    id: 'stat-card-revenue',
    type: 'frame',
    name: 'Stat Revenue',
    tag: 'div',
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 20,
      background: '#ffffff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid'
    },
    children: ['stat-label-revenue', 'stat-value-revenue', 'stat-delta-revenue']
  },
  'stat-label-revenue': {
    id: 'stat-label-revenue',
    type: 'text',
    name: 'Revenue Label',
    tag: 'span',
    style: { fontSize: 13, fontWeight: 500, color: '#64748b' },
    text: 'Revenue'
  },
  'stat-value-revenue': {
    id: 'stat-value-revenue',
    type: 'text',
    name: 'Revenue Value',
    tag: 'span',
    style: { fontSize: 28, fontWeight: 800, color: '#0f172a' },
    text: '$48,290'
  },
  'stat-delta-revenue': {
    id: 'stat-delta-revenue',
    type: 'text',
    name: 'Revenue Delta',
    tag: 'span',
    style: { fontSize: 12, fontWeight: 600, color: '#10b981' },
    text: '+12.5% from last month'
  },
  'stat-card-users': {
    id: 'stat-card-users',
    type: 'frame',
    name: 'Stat Users',
    tag: 'div',
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 20,
      background: '#ffffff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid'
    },
    children: ['stat-label-users', 'stat-value-users', 'stat-delta-users']
  },
  'stat-label-users': {
    id: 'stat-label-users',
    type: 'text',
    name: 'Users Label',
    tag: 'span',
    style: { fontSize: 13, fontWeight: 500, color: '#64748b' },
    text: 'Active users'
  },
  'stat-value-users': {
    id: 'stat-value-users',
    type: 'text',
    name: 'Users Value',
    tag: 'span',
    style: { fontSize: 28, fontWeight: 800, color: '#0f172a' },
    text: '2,847'
  },
  'stat-delta-users': {
    id: 'stat-delta-users',
    type: 'text',
    name: 'Users Delta',
    tag: 'span',
    style: { fontSize: 12, fontWeight: 600, color: '#10b981' },
    text: '+8.2% from last month'
  },
  'stat-card-projects': {
    id: 'stat-card-projects',
    type: 'frame',
    name: 'Stat Projects',
    tag: 'div',
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 20,
      background: '#ffffff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid'
    },
    children: ['stat-label-projects', 'stat-value-projects', 'stat-delta-projects']
  },
  'stat-label-projects': {
    id: 'stat-label-projects',
    type: 'text',
    name: 'Projects Label',
    tag: 'span',
    style: { fontSize: 13, fontWeight: 500, color: '#64748b' },
    text: 'Open projects'
  },
  'stat-value-projects': {
    id: 'stat-value-projects',
    type: 'text',
    name: 'Projects Value',
    tag: 'span',
    style: { fontSize: 28, fontWeight: 800, color: '#0f172a' },
    text: '142'
  },
  'stat-delta-projects': {
    id: 'stat-delta-projects',
    type: 'text',
    name: 'Projects Delta',
    tag: 'span',
    style: { fontSize: 12, fontWeight: 600, color: '#64748b' },
    text: '3 due this week'
  },

  'team-panel': {
    id: 'team-panel',
    type: 'frame',
    name: 'Team Panel',
    tag: 'section',
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 24,
      background: '#ffffff',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderStyle: 'solid',
      flex: 1
    },
    children: ['team-panel-header', 'team-table']
  },
  'team-panel-header': {
    id: 'team-panel-header',
    type: 'frame',
    name: 'Team Header',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    children: ['team-panel-title', 'team-add-btn']
  },
  'team-panel-title': {
    id: 'team-panel-title',
    type: 'text',
    name: 'Team Title',
    tag: 'h2',
    style: { fontSize: 16, fontWeight: 700, color: '#0f172a' },
    text: 'Team members'
  },
  'team-add-btn': {
    id: 'team-add-btn',
    type: 'button',
    name: 'Add Member',
    tag: 'button',
    style: {
      background: '#2563eb',
      color: '#ffffff',
      borderWidth: 0,
      padding: '8px 14px',
      borderRadius: 6,
      fontWeight: 600,
      fontSize: 13,
      cursor: 'pointer'
    },
    text: 'Invite'
  },
  'team-table': {
    id: 'team-table',
    type: 'frame',
    name: 'Team Table',
    tag: 'div',
    style: { display: 'flex', flexDirection: 'column', gap: 0 },
    children: ['table-header', 'table-row-1', 'table-row-2', 'table-row-3']
  },
  'table-header': {
    id: 'table-header',
    type: 'frame',
    name: 'Table Header',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      padding: '10px 0',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      borderBottomStyle: 'solid'
    },
    children: ['th-name', 'th-role', 'th-status']
  },
  'th-name': {
    id: 'th-name',
    type: 'text',
    name: 'TH Name',
    tag: 'span',
    style: { flex: 2, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    text: 'Name'
  },
  'th-role': {
    id: 'th-role',
    type: 'text',
    name: 'TH Role',
    tag: 'span',
    style: { flex: 1, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    text: 'Role'
  },
  'th-status': {
    id: 'th-status',
    type: 'text',
    name: 'TH Status',
    tag: 'span',
    style: { flex: 1, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
    text: 'Status'
  },
  'table-row-1': {
    id: 'table-row-1',
    type: 'frame',
    name: 'Row 1',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '14px 0',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      borderBottomStyle: 'solid'
    },
    children: ['row1-name', 'row1-role', 'row1-status']
  },
  'row1-name': {
    id: 'row1-name',
    type: 'text',
    name: 'Alex Chen',
    tag: 'span',
    style: { flex: 2, fontSize: 14, fontWeight: 600, color: '#0f172a' },
    text: 'Alex Chen'
  },
  'row1-role': {
    id: 'row1-role',
    type: 'text',
    name: 'Role',
    tag: 'span',
    style: { flex: 1, fontSize: 14, color: '#64748b' },
    text: 'Design lead'
  },
  'row1-status': {
    id: 'row1-status',
    type: 'text',
    name: 'Status',
    tag: 'span',
    style: { flex: 1, fontSize: 13, fontWeight: 600, color: '#10b981' },
    text: 'Active'
  },
  'table-row-2': {
    id: 'table-row-2',
    type: 'frame',
    name: 'Row 2',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '14px 0',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
      borderBottomStyle: 'solid'
    },
    children: ['row2-name', 'row2-role', 'row2-status']
  },
  'row2-name': {
    id: 'row2-name',
    type: 'text',
    name: 'Jordan Lee',
    tag: 'span',
    style: { flex: 2, fontSize: 14, fontWeight: 600, color: '#0f172a' },
    text: 'Jordan Lee'
  },
  'row2-role': {
    id: 'row2-role',
    type: 'text',
    name: 'Role',
    tag: 'span',
    style: { flex: 1, fontSize: 14, color: '#64748b' },
    text: 'Engineering'
  },
  'row2-status': {
    id: 'row2-status',
    type: 'text',
    name: 'Status',
    tag: 'span',
    style: { flex: 1, fontSize: 13, fontWeight: 600, color: '#10b981' },
    text: 'Active'
  },
  'table-row-3': {
    id: 'table-row-3',
    type: 'frame',
    name: 'Row 3',
    tag: 'div',
    style: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '14px 0'
    },
    children: ['row3-name', 'row3-role', 'row3-status']
  },
  'row3-name': {
    id: 'row3-name',
    type: 'text',
    name: 'Sam Rivera',
    tag: 'span',
    style: { flex: 2, fontSize: 14, fontWeight: 600, color: '#0f172a' },
    text: 'Sam Rivera'
  },
  'row3-role': {
    id: 'row3-role',
    type: 'text',
    name: 'Role',
    tag: 'span',
    style: { flex: 1, fontSize: 14, color: '#64748b' },
    text: 'Product'
  },
  'row3-status': {
    id: 'row3-status',
    type: 'text',
    name: 'Status',
    tag: 'span',
    style: { flex: 1, fontSize: 13, fontWeight: 600, color: '#f59e0b' },
    text: 'Away'
  }
};

export function getFreshDashboardNodes() {
  return cloneNodes(initialDashboardNodes);
}
