/* ==========================================================================
   theme.js — Dark mode
   ========================================================================== */

window.SR = window.SR || {};

SR.theme = (function () {
  function apply(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    updateToggleIcons(mode);
  }

  function updateToggleIcons(mode) {
    const isDark = mode === 'dark';
    ['themeToggleTop', 'themeToggleSidebar'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const icon = btn.querySelector('i');
      if (icon) icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
      const label = btn.querySelector('span');
      if (label) label.textContent = isDark ? 'Mode Terang' : 'Mode Gelap';
    });
    if (window.lucide) lucide.createIcons();
  }

  function toggle() {
    const current = SR.storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    SR.storage.setTheme(next);
    apply(next);
  }

  function init() {
    apply(SR.storage.getTheme());
    const top = document.getElementById('themeToggleTop');
    const side = document.getElementById('themeToggleSidebar');
    if (top) top.addEventListener('click', toggle);
    if (side) side.addEventListener('click', toggle);
  }

  return { init, toggle, apply };
})();
