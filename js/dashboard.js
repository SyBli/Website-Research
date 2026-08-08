/* ==========================================================================
   dashboard.js — Render halaman Dashboard, Semua Penelitian, dan Statistik
   ========================================================================== */

window.SR = window.SR || {};

SR.dashboard = (function () {

  function renderStatCards(projects) {
    const total = projects.length;
    const proses = projects.filter(p => p.status === 'Proses' || p.status === 'Revisi').length;
    const selesai = projects.filter(p => p.status === 'Selesai').length;
    const avgProgress = SR.progress.average(projects);

    const upcoming = projects
      .filter(p => p.status !== 'Selesai' && p.deadline)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
    const nearestLabel = upcoming ? SR.research.formatDate(upcoming.deadline) : '—';

    const cards = [
      { icon: 'folder-kanban', label: 'Total Penelitian', value: total, color: 'var(--primary-dark)', soft: 'var(--primary-soft)' },
      { icon: 'loader', label: 'Sedang Dikerjakan', value: proses, color: '#3A6EA5', soft: 'var(--info-soft)' },
      { icon: 'circle-check-big', label: 'Selesai', value: selesai, color: 'var(--primary-dark)', soft: 'var(--primary-soft)' },
      { icon: 'calendar-clock', label: 'Deadline Terdekat', value: nearestLabel, color: '#9A6B14', soft: 'var(--accent-soft)', small: true },
      { icon: 'trending-up', label: 'Progress Rata-rata', value: avgProgress + '%', color: 'var(--primary-dark)', soft: 'var(--primary-soft)' }
    ];

    document.getElementById('statGrid').innerHTML = cards.map(c => `
      <div class="stat-card">
        <div class="stat-icon" style="--stat-color:${c.color};--stat-color-soft:${c.soft}"><i data-lucide="${c.icon}"></i></div>
        <div class="stat-value" style="${c.small ? 'font-size:17px' : ''}">${c.value}</div>
        <div class="stat-label">${c.label}</div>
      </div>`).join('');
  }

  function renderDeadlines(projects) {
    const el = document.getElementById('deadlineList');
    const list = projects
      .filter(p => p.status !== 'Selesai' && p.deadline)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 6);

    if (!list.length) {
      el.innerHTML = '<li class="deadline-empty">Tidak ada deadline mendatang.</li>';
      return;
    }

    el.innerHTML = list.map(p => {
      const { d, m } = SR.research.formatDateShort(p.deadline);
      const days = SR.research.daysUntil(p.deadline);
      const sub = days < 0 ? `Lewat ${Math.abs(days)} hari` : days === 0 ? 'Hari ini' : `${days} hari lagi`;
      return `
        <li class="deadline-item" data-id="${p.id}">
          <div class="deadline-date"><b>${d}</b><span>${m}</span></div>
          <div class="deadline-info">
            <div class="deadline-title">${SR.research.escapeHtml(p.title) || '(Tanpa judul)'}</div>
            <div class="deadline-sub" style="${days < 0 ? 'color:var(--danger);font-weight:600' : ''}">${sub}</div>
          </div>
        </li>`;
    }).join('');

    el.querySelectorAll('.deadline-item').forEach(item => {
      item.addEventListener('click', () => SR.research.openDetail(item.dataset.id));
    });
  }

  function renderGrid(gridId, emptyId, projects, countElId) {
    const grid = document.getElementById(gridId);
    const empty = document.getElementById(emptyId);
    if (countElId) document.getElementById(countElId).textContent = `${projects.length} penelitian`;

    if (!projects.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    grid.innerHTML = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(SR.research.buildCard).join('');
  }

  function renderDashboard(projects) {
    renderStatCards(projects);
    renderDeadlines(projects);
    SR.charts.renderStatusChart('chartStatus', projects, { legendPosition: 'bottom' });
    renderGrid('dashResearchGrid', 'emptyStateDash', projects, 'dashCardCount');
  }

  function renderAll(allProjects, query, status) {
    const filtered = SR.search.filterProjects(allProjects, { query, status });
    renderGrid('allResearchGrid', 'emptyStateAll', filtered);
  }

  function renderStats(projects) {
    SR.charts.renderStatusChart('chartStatusBig', projects, { legendPosition: 'right' });
    SR.charts.renderCategoryChart('chartCategory', projects);
    SR.charts.renderProgressChart('chartProgress', projects);
  }

  function init() {
    document.getElementById('filterStatus').addEventListener('change', () => SR.app.refresh());
  }

  return { renderDashboard, renderAll, renderStats, init };
})();
