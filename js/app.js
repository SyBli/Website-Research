/* ==========================================================================
   app.js — Inisialisasi aplikasi, navigasi, toast, dan dialog konfirmasi
   ========================================================================== */

window.SR = window.SR || {};

/* ---------------- Toast ---------------- */
SR.toast = function (message, type) {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast toast-${type || 'success'}`;
  const icon = type === 'error' ? 'alert-circle' : 'check-circle-2';
  el.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  stack.appendChild(el);
  if (window.lucide) lucide.createIcons();
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 220);
  }, 3200);
};

/* ---------------- App core ---------------- */
SR.app = (function () {
  let currentView = 'dashboard';
  let confirmCallback = null;

  const VIEWS = ['dashboard', 'all', 'stats', 'detail'];
  const NAV_MAP = { dashboard: 'navDashboard', all: 'navAll', stats: 'navStats' };

  function navigate(view) {
    currentView = view;
    VIEWS.forEach(v => {
      document.getElementById('view-' + v).hidden = v !== view;
    });
    Object.entries(NAV_MAP).forEach(([v, navId]) => {
      document.getElementById(navId).classList.toggle('is-active', v === view);
    });
    closeSidebarMobile();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    refresh();
  }

  function refresh() {
    const projects = SR.storage.getAll();
    if (currentView === 'dashboard') {
      SR.dashboard.renderDashboard(projects);
    } else if (currentView === 'all') {
      const query = document.getElementById('globalSearch').value;
      const status = document.getElementById('filterStatus').value;
      SR.dashboard.renderAll(projects, query, status);
    } else if (currentView === 'stats') {
      SR.dashboard.renderStats(projects);
    }
    if (window.lucide) lucide.createIcons();
  }

  /* ---------------- Confirm dialog ---------------- */
  function confirm({ title, desc, onConfirm }) {
    document.getElementById('modalConfirmTitle').textContent = title || 'Yakin ingin melanjutkan?';
    document.getElementById('modalConfirmDesc').textContent = desc || 'Tindakan ini tidak bisa dibatalkan.';
    confirmCallback = onConfirm;
    document.getElementById('modalConfirm').hidden = false;
  }

  function closeConfirm() {
    document.getElementById('modalConfirm').hidden = true;
    confirmCallback = null;
  }

  /* ---------------- Sidebar (mobile) ---------------- */
  function openSidebarMobile() {
    document.getElementById('sidebar').classList.add('is-open');
    document.getElementById('sidebarScrim').classList.add('is-visible');
  }
  function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebarScrim').classList.remove('is-visible');
  }

  /* ---------------- Wiring ---------------- */
  function wireNav() {
    document.getElementById('navDashboard').addEventListener('click', () => navigate('dashboard'));
    document.getElementById('navAll').addEventListener('click', () => navigate('all'));
    document.getElementById('navStats').addEventListener('click', () => navigate('stats'));
  }

  function wireSearch() {
    let debounce;
    document.getElementById('globalSearch').addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (currentView !== 'all') navigate('all');
        else refresh();
      }, 150);
    });
  }

  function wireSidebarToggle() {
    document.getElementById('hamburgerBtn').addEventListener('click', openSidebarMobile);
    document.getElementById('sidebarScrim').addEventListener('click', closeSidebarMobile);
  }

  function wireConfirmModal() {
    document.getElementById('cancelModalConfirm').addEventListener('click', closeConfirm);
    document.getElementById('confirmModalConfirm').addEventListener('click', () => {
      const cb = confirmCallback;
      closeConfirm();
      if (cb) cb();
    });
    document.getElementById('modalConfirm').addEventListener('click', (e) => {
      if (e.target.id === 'modalConfirm') closeConfirm();
    });
  }

  function wireEscKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      ['modalResearch', 'modalRef', 'modalTimeline', 'modalConfirm'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal && !modal.hidden) modal.hidden = true;
      });
    });
  }

  function init() {
    SR.theme.init();
    SR.research.init();
    SR.dashboard.init();
    wireNav();
    wireSearch();
    wireSidebarToggle();
    wireConfirmModal();
    wireEscKey();
    navigate('dashboard');
    if (window.lucide) lucide.createIcons();
  }

  return { init, navigate, refresh, confirm };
})();

document.addEventListener('DOMContentLoaded', SR.app.init);
