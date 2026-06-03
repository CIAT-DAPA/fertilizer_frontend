/** Scenario keys aligned with metric.values[].s (1–4). */
export const SCENARIOS = [
  { key: 'above', label: 'Above normal', season: 1 },
  { key: 'normal', label: 'Normal', season: 2 },
  { key: 'below', label: 'Below normal', season: 3 },
  { key: 'dominant', label: 'Dominant', season: 4 },
];

/** Metric type names shown on each dashboard chart group. */
export const CHART_METRIC_NAMES = {
  'Fertilizer rate': ['nps', 'urea', 'n', 'p', 'dap'],
  'Fertilizer rate (ISFM)': ['compost', 'vermi-compost'],
  'Optimal yield': ['optimal-yield'],
};

/**
 * Flatten API metric.values (handles legacy nested list imports).
 * @returns {{ above?: number, normal?: number, below?: number, dominant?: number }}
 */
export function parseMetricSeasons(values) {
  const seasons = {};
  if (!Array.isArray(values)) return seasons;

  for (const raw of values) {
    const entry = Array.isArray(raw) ? raw[0] : raw;
    if (!entry || entry.s == null || entry.values == null) continue;
    const numeric = Array.isArray(entry.values) ? entry.values[0] : entry.values;
    const n = Number(numeric);
    if (!Number.isFinite(n)) continue;

    const match = SCENARIOS.find((s) => s.season === Number(entry.s));
    if (match) seasons[match.key] = n;
  }
  return seasons;
}

export function formatMetricLabel(name) {
  if (!name) return '';
  return name.replace(/-/g, ' ');
}

export function activeScenarios(seasons) {
  return SCENARIOS.filter((s) => seasons[s.key] != null);
}

export function filterMetricsByChartType(data, typeName, typeIdToName) {
  const allowed = new Set(CHART_METRIC_NAMES[typeName] || []);
  return (data || []).filter((row) => {
    const name = (typeIdToName.get(row.type) || '').toLowerCase();
    return allowed.has(name);
  });
}
