/* ==========================================================================
   chart.js — Pembungkus Chart.js untuk statistik
   ========================================================================== */

window.SR = window.SR || {};

SR.charts = (function () {
  const instances = {};
  const STATUS_ORDER = ['Belum Mulai', 'Proses', 'Revisi', 'Selesai'];

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function statusColors() {
    return [cssVar('--status-belum'), cssVar('--status-proses'), cssVar('--status-revisi'), cssVar('--status-selesai')];
  }

  function categoryPalette() {
    return [cssVar('--tab-1'), cssVar('--tab-2'), cssVar('--tab-3'), cssVar('--tab-4'), cssVar('--tab-5'), cssVar('--tab-6')];
  }

  function destroy(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function statusCounts(projects) {
    return STATUS_ORDER.map(s => projects.filter(p => p.status === s).length);
  }

  function renderStatusChart(canvasId, projects, opts) {
    const el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    destroy(canvasId);
    const data = statusCounts(projects);
    const hasData = data.some(v => v > 0);
    instances[canvasId] = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: STATUS_ORDER,
        datasets: [{
          data: hasData ? data : [1],
          backgroundColor: hasData ? statusColors() : [cssVar('--bg-soft')],
          borderColor: cssVar('--surface'),
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: (opts && opts.legendPosition) || 'bottom',
            labels: { color: cssVar('--ink-soft'), font: { family: 'Inter', size: 11.5 }, boxWidth: 10, padding: 14, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: { enabled: hasData }
        }
      }
    });
  }

  function renderCategoryChart(canvasId, projects) {
    const el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    destroy(canvasId);
    const map = {};
    projects.forEach(p => {
      const key = p.category || 'Lainnya';
      map[key] = (map[key] || 0) + 1;
    });
    const labels = Object.keys(map);
    const values = Object.values(map);
    const palette = categoryPalette();
    instances[canvasId] = new Chart(el, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Belum ada data'],
        datasets: [{
          data: labels.length ? values : [0],
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderRadius: 8,
          maxBarThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: cssVar('--ink-soft'), font: { size: 11 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: cssVar('--ink-soft'), stepSize: 1, precision: 0 }, grid: { color: cssVar('--border') } }
        }
      }
    });
  }

  function renderProgressChart(canvasId, projects) {
    const el = document.getElementById(canvasId);
    if (!el || !window.Chart) return;
    destroy(canvasId);
    const labels = projects.map(p => p.title.length > 18 ? p.title.slice(0, 18) + '…' : p.title || '(Tanpa judul)');
    const values = projects.map(p => SR.progress.compute(p).total);
    instances[canvasId] = new Chart(el, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['Belum ada data'],
        datasets: [{
          data: labels.length ? values : [0],
          backgroundColor: cssVar('--primary'),
          borderRadius: 8,
          maxBarThickness: 26
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 100, ticks: { color: cssVar('--ink-soft'), callback: v => v + '%' }, grid: { color: cssVar('--border') } },
          y: { ticks: { color: cssVar('--ink-soft'), font: { size: 11.5 } }, grid: { display: false } }
        }
      }
    });
  }

  return { renderStatusChart, renderCategoryChart, renderProgressChart, destroy };
})();
