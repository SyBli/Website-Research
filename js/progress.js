/* ==========================================================================
   progress.js — Perhitungan progress penelitian
   Progress = 50% checklist BAB + 30% timeline selesai + 20% referensi.
   Semua nilai dihitung ulang saat dibutuhkan (bukan disimpan statis) supaya
   selalu akurat terhadap data terbaru.
   ========================================================================== */

window.SR = window.SR || {};

SR.progress = (function () {
  const REF_TARGET = 3; // jumlah referensi yang dianggap "cukup" (100% porsi referensi)

  function checklistScore(project) {
    const items = Object.values(project.checklist || {});
    if (!items.length) return 0;
    const done = items.filter(Boolean).length;
    return done / items.length;
  }

  function timelineScore(project) {
    const items = project.timeline || [];
    if (!items.length) return 0;
    const done = items.filter(t => t.done).length;
    return done / items.length;
  }

  function referenceScore(project) {
    const count = (project.references || []).length;
    return Math.min(count / REF_TARGET, 1);
  }

  function compute(project) {
    const c = checklistScore(project);
    const t = timelineScore(project);
    const r = referenceScore(project);
    const total = Math.round((c * 0.5 + t * 0.3 + r * 0.2) * 100);
    return {
      checklist: Math.round(c * 100),
      timeline: Math.round(t * 100),
      reference: Math.round(r * 100),
      total
    };
  }

  function average(projects) {
    if (!projects.length) return 0;
    const sum = projects.reduce((acc, p) => acc + compute(p).total, 0);
    return Math.round(sum / projects.length);
  }

  return { compute, average, REF_TARGET };
})();
