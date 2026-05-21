/**
 * Shared navigation config for the HaFAS dashboard shell.
 * Paths mirror the classic app (App.js) so all existing pages keep working.
 */

export const dashboardNavItems = [
  {
    section: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill', end: true },
      { to: '/dashboard/advisories', label: 'Advisory hub', icon: 'bi-collection' },
      { to: '/dashboard/metrics', label: 'Metrics preview', icon: 'bi-bar-chart-line-fill' },
      { to: '/dashboard/location', label: 'Location', icon: 'bi-geo-alt-fill' },
      { to: '/dashboard/insights', label: 'System Status', icon: 'bi-hdd-network' },
    ],
  },
  {
    id: 'advisories-group',
    section: null,
    items: [
      {
        expandable: true,
        groupId: 'advisories',
        label: 'Advisories',
        icon: 'bi-collection',
        children: [
          { to: '/fertilizer_advisories', label: 'N & P / yield', icon: 'bi-droplet-half' },
          { to: '/fertilizer_advisories_nps_urea', label: 'NPS & Urea', icon: 'bi-moisture' },
          { to: '/isfm', label: 'ISFM', icon: 'bi-recycle' },
          { to: '/agroclimate', label: 'Agroclimate', icon: 'bi-cloud-sun' },
          { to: '/lime', label: 'Lime', icon: 'bi-layers' },
          { to: '/pest_disease', label: 'Pest & disease', icon: 'bi-bug' },
          { to: '/csa', label: 'CSA', icon: 'bi-tree' },
          { to: '/irrigation', label: 'Irrigation', icon: 'bi-water' },
          { to: '/mechanization', label: 'Mechanization', icon: 'bi-gear-wide-connected' },
          { to: '/bundled_aas', label: 'Bundled AAS', icon: 'bi-box-seam' },
          { to: '/wheat_rust', label: 'Wheat rust', icon: 'bi-shield-exclamation' },
        ],
      },
    ],
  },
];

export const advisoryQuickLinks = [
  {
    title: 'Country & location',
    description: 'Pick Ethiopia, then region → kebele',
    path: '/',
    dynamicLocation: true,
    color: '#1b4332',
  },
  {
    title: 'N, P & optimal yield',
    description: 'Probabilistic nutrient and yield maps',
    path: '/fertilizer_advisories',
    color: '#2d6a4f',
  },
  {
    title: 'NPS & Urea',
    description: 'Fertilizer blend recommendations',
    path: '/fertilizer_advisories_nps_urea',
    color: '#40916c',
  },
  {
    title: 'ISFM',
    description: 'Compost & vermi-compost advisories',
    path: '/isfm',
    color: '#52b788',
  },
  {
    title: 'PDF report',
    description: 'Charts, maps & seasonal outlook',
    path: '/report',
    dynamicReport: true,
    color: '#1d3557',
  },
  {
    title: 'Agroclimate',
    description: 'Climate-smart agriculture info',
    path: '/agroclimate',
    color: '#457b9d',
  },
  {
    title: 'Lime',
    description: 'Soil acidity management',
    path: '/lime',
    color: '#6c757d',
  },
  {
    title: 'CSA',
    description: 'Climate-smart agriculture',
    path: '/csa',
    color: '#2a9d8f',
  },
  {
    title: 'Irrigation',
    description: 'Water management guidance',
    path: '/irrigation',
    color: '#0077b6',
  },
  {
    title: 'Wheat rust',
    description: 'Disease advisory module',
    path: '/wheat_rust',
    color: '#bc6c25',
  },
  {
    title: 'AI chatbot',
    description: 'Layer lookup & batch coordinates',
    path: '/chatbot',
    color: '#5a189a',
  },
  {
    title: 'Methodology',
    description: 'Data sources & methods',
    path: '/methodology',
    color: '#495057',
  },
];
