/* ==========================================================================
   storage.js — Lapisan penyimpanan Local Storage
   Tidak ada backend/database online. Semua project & preferensi disimpan
   di localStorage browser, dibungkus supaya modul lain tidak perlu tahu
   detail key/format penyimpanan.
   ========================================================================== */

window.SR = window.SR || {};

SR.storage = (function () {
  const KEY_PROJECTS = 'studyresearch.projects.v1';
  const KEY_THEME = 'studyresearch.theme.v1';

  function safeParse(json, fallback) {
    try {
      const val = JSON.parse(json);
      return val === null || val === undefined ? fallback : val;
    } catch (e) {
      console.warn('StudyResearch: gagal membaca data tersimpan, memakai default.', e);
      return fallback;
    }
  }

  function readRaw() {
    return safeParse(localStorage.getItem(KEY_PROJECTS), []);
  }

  function writeRaw(list) {
    try {
      localStorage.setItem(KEY_PROJECTS, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('StudyResearch: penyimpanan penuh atau tidak tersedia.', e);
      if (window.SR.toast) window.SR.toast('Gagal menyimpan — penyimpanan browser penuh.', 'error');
      return false;
    }
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultProject(overrides) {
    return Object.assign({
      id: uid('proj'),
      title: '',
      category: '',
      subject: '',
      author: '',
      advisor: '',
      startDate: '',
      deadline: '',
      status: 'Belum Mulai',
      idea: {
        background: '', problem: '', purpose: '', hypothesis: '',
        variables: '', method: '', object: '', benefit: ''
      },
      references: [],
      checklist: { bab1: false, bab2: false, bab3: false, bab4: false, bab5: false },
      timeline: [],
      notes: '',
      attachments: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    }, overrides || {});
  }

  function getAll() {
    return readRaw();
  }

  function getById(id) {
    return readRaw().find(p => p.id === id) || null;
  }

  function upsert(project) {
    const list = readRaw();
    project.updatedAt = nowIso();
    const idx = list.findIndex(p => p.id === project.id);
    if (idx === -1) {
      list.push(project);
    } else {
      list[idx] = project;
    }
    writeRaw(list);
    return project;
  }

  function remove(id) {
    const list = readRaw().filter(p => p.id !== id);
    writeRaw(list);
  }

  function getTheme() {
    return localStorage.getItem(KEY_THEME) || 'light';
  }

  function setTheme(value) {
    localStorage.setItem(KEY_THEME, value);
  }

  return {
    uid, nowIso, defaultProject,
    getAll, getById, upsert, remove,
    getTheme, setTheme
  };
})();
