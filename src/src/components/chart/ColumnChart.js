import React from 'react';
import Chart from 'react-apexcharts';
import axios from 'axios';
import Configuration from '../../conf/Configuration';
import {
  activeScenarios,
  filterMetricsByChartType,
  formatMetricLabel,
  parseMetricSeasons,
  SCENARIOS,
} from './metricChartUtils';

function ColumnChart({ data, type }) {
  const [typeIdToName, setTypeIdToName] = React.useState(new Map());
  const [chartState, setChartState] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    axios
      .get(`${Configuration.get_url_api_base()}metric_types`)
      .then((res) => {
        if (cancelled) return;
        setTypeIdToName(new Map(res.data.map((t) => [t.id, (t.name || '').toLowerCase()])));
      })
      .catch(() => {
        if (!cancelled) setTypeIdToName(buildFallbackTypeMap(data));
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  React.useEffect(() => {
    if (!data?.length) {
      setChartState(null);
      return;
    }

    const resolvedTypes = new Map(typeIdToName);
    data.forEach((row) => {
      if (row.type_name) resolvedTypes.set(row.type, row.type_name.toLowerCase());
    });
    if (resolvedTypes.size === 0) {
      setChartState(null);
      return;
    }

    const rows = filterMetricsByChartType(data, type, resolvedTypes);
    if (!rows.length) {
      setChartState(null);
      return;
    }

    if (type.includes('Fertilizer rate')) {
      setChartState(buildFertilizerChart(rows, resolvedTypes));
    } else if (type === 'Optimal yield') {
      setChartState(buildOptimalYieldChart(rows[0], resolvedTypes));
    } else {
      setChartState(null);
    }
  }, [data, type, typeIdToName]);

  if (!chartState) {
    return (
      <p className="text-secondary small mb-0">
        No chart data for this forecast and metric group.
      </p>
    );
  }

  return (
    <Chart
      options={chartState.options}
      series={chartState.series}
      type="bar"
      height={350}
    />
  );
}

function buildFertilizerChart(rows, typeIdToName) {
  const metricNames = [];
  const seriesByScenario = Object.fromEntries(SCENARIOS.map((s) => [s.key, []]));
  let yUnit = 'kg/ha';

  rows.forEach((row) => {
    const name = typeIdToName.get(row.type) || row.type;
    const seasons = parseMetricSeasons(row.values);
    const present = activeScenarios(seasons);
    if (!present.length) return;

    metricNames.push(formatMetricLabel(name));
    SCENARIOS.forEach((scenario) => {
      seriesByScenario[scenario.key].push(
        seasons[scenario.key] != null ? Number(seasons[scenario.key].toFixed(2)) : null
      );
    });

    if (name === 'compost' || name === 'vermi-compost') {
      yUnit = 'ton/ha';
    }
  });

  const active = SCENARIOS.filter((s) =>
    seriesByScenario[s.key].some((v) => v != null)
  );

  const series = active.map((scenario) => ({
    name: scenario.label,
    data: seriesByScenario[scenario.key],
  }));

  return {
    series,
    options: {
      chart: { type: 'bar', height: 350 },
      plotOptions: {
        bar: { horizontal: false, columnWidth: '55%', endingShape: 'rounded' },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: metricNames },
      yaxis: { title: { text: yUnit } },
      fill: { opacity: 1 },
      tooltip: {
        y: {
          formatter: (val) => (val != null ? `${val} ${yUnit}` : '—'),
        },
      },
    },
  };
}

function buildOptimalYieldChart(row, typeIdToName) {
  const seasons = parseMetricSeasons(row.values);
  const present = activeScenarios(seasons);
  if (!present.length) return null;

  const categories = present.map((s) => s.label);
  const values = present.map((s) => Number(seasons[s.key].toFixed(2)));

  return {
    series: [{ name: formatMetricLabel(typeIdToName.get(row.type)), data: values }],
    options: {
      chart: { height: 350, type: 'bar' },
      colors: ['#0d6efd', '#20c997', '#ffc107', '#FF4560'],
      plotOptions: {
        bar: { columnWidth: '40%', distributed: true },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: { title: { text: 'kg/ha' } },
      tooltip: {
        y: { formatter: (val) => `${val} kg/ha` },
      },
    },
  };
}

/** Used when /metric_types is unavailable (e.g. API not restarted). */
function buildFallbackTypeMap(data) {
  const known = new Map([
    ['63865d9f68c981103580abf0', 'compost'],
    ['63865ef468c981103580e666', 'nps'],
    ['638660ad68c98110358120dc', 'optimal-yield'],
    ['638662c668c9811035815b52', 'urea'],
    ['6386653e68c98110358195c8', 'vermi-compost'],
    ['66751b21157b2a15fcae85aa', 'n'],
    ['66752b04157b2a15fcaf350a', 'p'],
    ['6a155b7d707f6d39de543793', 'dap'],
  ]);
  (data || []).forEach((row) => {
    const name = (row.type_name || '').toLowerCase();
    if (name) known.set(row.type, name);
    else if (!known.has(row.type)) known.set(row.type, row.type);
  });
  return known;
}

export default ColumnChart;
