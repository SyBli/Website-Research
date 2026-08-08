/* ==========================================================================
   search.js — Pencarian & filter realtime
   ========================================================================== */

window.SR = window.SR || {};

SR.search = (function () {
  function normalize(str) {
    return (str || '').toString().toLowerCase().trim();
  }

  function matchesQuery(project, query) {
    const q = normalize(query);
    if (!q) return true;
    const haystack = [
      project.title, project.subject, project.category, project.advisor
    ].map(normalize).join(' | ');
    return haystack.includes(q);
  }

  function matchesStatus(project, status) {
    if (!status) return true;
    return project.status === status;
  }

  function filterProjects(projects, { query = '', status = '' } = {}) {
    return projects.filter(p => matchesQuery(p, query) && matchesStatus(p, status));
  }

  function filterReferences(refs, query) {
    const q = normalize(query);
    if (!q) return refs;
    return refs.filter(r => {
      const haystack = [r.title, r.author, r.type, String(r.year || '')].map(normalize).join(' | ');
      return haystack.includes(q);
    });
  }

  return { filterProjects, filterReferences, normalize };
})();
