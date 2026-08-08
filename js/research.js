/* ==========================================================================
   research.js — CRUD Penelitian & Workspace Detail
   Menangani: modal tambah/edit, kartu penelitian, dan seluruh section di
   halaman detail (informasi, ide, referensi, checklist, timeline, catatan,
   lampiran).
   ========================================================================== */

window.SR = window.SR || {};

SR.research = (function () {
  let currentId = null;
  let ideaSaveTimer = null;
  let notesSaveTimer = null;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BAB_LABELS = {
    bab1: ['BAB I', 'Pendahuluan'],
    bab2: ['BAB II', 'Kajian Pustaka'],
    bab3: ['BAB III', 'Metode Penelitian'],
    bab4: ['BAB IV', 'Hasil & Pembahasan'],
    bab5: ['BAB V', 'Penutup']
  };

  /* ---------------- Helpers ---------------- */

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '—';
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatDateShort(iso) {
    if (!iso) return { d: '--', m: '---' };
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return { d: '--', m: '---' };
    return { d: d.getDate(), m: MONTHS[d.getMonth()] };
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const target = new Date(iso + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function statusBadgeClass(status) {
    return {
      'Belum Mulai': 'badge-belum',
      'Proses': 'badge-proses',
      'Revisi': 'badge-revisi',
      'Selesai': 'badge-selesai'
    }[status] || 'badge-belum';
  }

  function categoryColor(category) {
    const palette = ['var(--tab-1)', 'var(--tab-2)', 'var(--tab-3)', 'var(--tab-4)', 'var(--tab-5)', 'var(--tab-6)'];
    let hash = 0;
    const str = category || 'Umum';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  function escapeHtml(str) {
    return (str || '').toString()
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getCurrent() {
    return currentId ? SR.storage.getById(currentId) : null;
  }

  /* ---------------- Card rendering (dipakai dashboard & semua penelitian) ---------------- */

  function buildCard(project) {
    const prog = SR.progress.compute(project).total;
    const overdue = project.status !== 'Selesai' && daysUntil(project.deadline) !== null && daysUntil(project.deadline) < 0;
    return `
      <article class="rcard" style="--tab-color:${categoryColor(project.category)}" data-id="${project.id}">
        <div class="rcard-top">
          <div>
            <h3 class="rcard-title">${escapeHtml(project.title) || '(Tanpa judul)'}</h3>
          </div>
          <span class="badge ${statusBadgeClass(project.status)}">${escapeHtml(project.status)}</span>
        </div>
        <div class="rcard-meta">
          <span><i data-lucide="book-open"></i>${escapeHtml(project.subject) || '—'}</span>
          <span><i data-lucide="tag"></i>${escapeHtml(project.category) || '—'}</span>
          <span style="${overdue ? 'color:var(--danger);font-weight:600' : ''}"><i data-lucide="calendar"></i>${formatDate(project.deadline)}${overdue ? ' (lewat)' : ''}</span>
        </div>
        <div class="rcard-progress">
          <div class="rcard-progress-top"><span>Progress</span><span>${prog}%</span></div>
          <div class="pbar"><div class="pbar-fill" style="width:${prog}%"></div></div>
        </div>
        <div class="rcard-actions">
          <button class="btn btn-primary btn-sm" data-action="open" data-id="${project.id}"><i data-lucide="folder-open"></i>Buka</button>
          <button class="btn btn-ghost btn-sm btn-icon-only" data-action="edit" data-id="${project.id}" title="Edit"><i data-lucide="pencil"></i></button>
          <button class="btn btn-ghost btn-sm btn-icon-only" data-action="delete" data-id="${project.id}" title="Hapus"><i data-lucide="trash-2"></i></button>
        </div>
      </article>`;
  }

  function wireGridDelegation(gridEl) {
    gridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'open') openDetail(id);
      else if (action === 'edit') openModal(SR.storage.getById(id));
      else if (action === 'delete') confirmDeleteProject(id);
    });
  }

  /* ---------------- Modal: Tambah / Edit Penelitian ---------------- */

  function populateCategoryList() {
    const dl = document.getElementById('categoryList');
    if (!dl) return;
    const cats = [...new Set(SR.storage.getAll().map(p => p.category).filter(Boolean))];
    dl.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}">`).join('');
  }

  function openModal(project) {
    populateCategoryList();
    const modal = document.getElementById('modalResearch');
    const title = document.getElementById('modalResearchTitle');
    const form = document.getElementById('formResearch');
    form.reset();
    if (project) {
      title.textContent = 'Edit Penelitian';
      document.getElementById('rId').value = project.id;
      document.getElementById('rTitle').value = project.title;
      document.getElementById('rCategory').value = project.category;
      document.getElementById('rSubject').value = project.subject;
      document.getElementById('rAuthor').value = project.author;
      document.getElementById('rAdvisor').value = project.advisor;
      document.getElementById('rStart').value = project.startDate;
      document.getElementById('rDeadline').value = project.deadline;
      document.getElementById('rStatus').value = project.status;
    } else {
      title.textContent = 'Tambah Penelitian';
      document.getElementById('rId').value = '';
      document.getElementById('rStart').value = new Date().toISOString().slice(0, 10);
    }
    modal.hidden = false;
    if (window.lucide) lucide.createIcons();
    setTimeout(() => document.getElementById('rTitle').focus(), 50);
  }

  function closeModal() {
    document.getElementById('modalResearch').hidden = true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('rId').value;
    const existing = id ? SR.storage.getById(id) : null;
    const project = existing || SR.storage.defaultProject();
    project.title = document.getElementById('rTitle').value.trim();
    project.category = document.getElementById('rCategory').value.trim();
    project.subject = document.getElementById('rSubject').value.trim();
    project.author = document.getElementById('rAuthor').value.trim();
    project.advisor = document.getElementById('rAdvisor').value.trim();
    project.startDate = document.getElementById('rStart').value;
    project.deadline = document.getElementById('rDeadline').value;
    project.status = document.getElementById('rStatus').value;
    SR.storage.upsert(project);
    closeModal();
    SR.toast(existing ? 'Penelitian berhasil diperbarui.' : 'Penelitian baru berhasil ditambahkan.', 'success');
    SR.app.refresh();
    if (currentId === project.id) openDetail(project.id);
  }

  function confirmDeleteProject(id) {
    const project = SR.storage.getById(id);
    if (!project) return;
    SR.app.confirm({
      title: `Hapus "${project.title || 'penelitian ini'}"?`,
      desc: 'Semua data ide, referensi, timeline, dan lampiran di dalamnya akan ikut terhapus secara permanen.',
      onConfirm: () => {
        SR.storage.remove(id);
        SR.toast('Penelitian berhasil dihapus.', 'success');
        if (currentId === id) SR.app.navigate('all');
        SR.app.refresh();
      }
    });
  }

  /* ---------------- Detail / Workspace ---------------- */

  function openDetail(id) {
    const project = SR.storage.getById(id);
    if (!project) { SR.toast('Penelitian tidak ditemukan.', 'error'); return; }
    currentId = id;
    SR.app.navigate('detail');
    renderDetail(project);
  }

  function renderDetail(project) {
    renderDetailHead(project);
    renderProgressOverview(project);
    renderInfoTab(project);
    renderIdeaTab(project);
    renderRefTab(project);
    renderChecklistTab(project);
    renderTimelineTab(project);
    renderNotesTab(project);
    renderFilesTab(project);
    if (window.lucide) lucide.createIcons();
  }

  function renderDetailHead(project) {
    const el = document.getElementById('detailHead');
    el.innerHTML = `
      <div>
        <h1 class="detail-head-title">${escapeHtml(project.title) || '(Tanpa judul)'}</h1>
        <div class="detail-head-meta">
          <span class="badge ${statusBadgeClass(project.status)}">${escapeHtml(project.status)}</span>
          <span class="tag">${escapeHtml(project.category) || 'Tanpa kategori'}</span>
          <span class="tag">${escapeHtml(project.subject) || '—'}</span>
          <span class="muted"><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:-2px"></i> Deadline ${formatDate(project.deadline)}</span>
        </div>
      </div>
      <div class="detail-head-actions">
        <button class="btn btn-ghost" id="btnEditDetail"><i data-lucide="pencil"></i>Edit</button>
        <button class="btn btn-ghost" id="btnDeleteDetail"><i data-lucide="trash-2"></i>Hapus</button>
      </div>`;
    document.getElementById('btnEditDetail').addEventListener('click', () => openModal(project));
    document.getElementById('btnDeleteDetail').addEventListener('click', () => confirmDeleteProject(project.id));
  }

  function renderProgressOverview(project) {
    const p = SR.progress.compute(project);
    const el = document.getElementById('progressOverview');
    el.innerHTML = `
      <div class="pcircle" style="--pct:${p.total}"><span class="pcircle-label">${p.total}%</span></div>
      <div class="progress-overview-bars">
        <div class="progress-overview-row">
          <span class="progress-overview-row-label">Checklist BAB</span>
          <div class="pbar"><div class="pbar-fill" style="width:${p.checklist}%"></div></div>
          <span class="progress-overview-row-val">${p.checklist}%</span>
        </div>
        <div class="progress-overview-row">
          <span class="progress-overview-row-label">Timeline</span>
          <div class="pbar"><div class="pbar-fill" style="width:${p.timeline}%"></div></div>
          <span class="progress-overview-row-val">${p.timeline}%</span>
        </div>
        <div class="progress-overview-row">
          <span class="progress-overview-row-label">Referensi</span>
          <div class="pbar"><div class="pbar-fill" style="width:${p.reference}%"></div></div>
          <span class="progress-overview-row-val">${p.reference}%</span>
        </div>
      </div>`;
  }

  /* ----- Tab: Informasi ----- */
  function renderInfoTab(project) {
    const el = document.getElementById('panel-info');
    const fields = [
      ['Judul Penelitian', 'title', project.title],
      ['Kategori', 'category', project.category],
      ['Mata Pelajaran', 'subject', project.subject],
      ['Penulis', 'author', project.author],
      ['Pembimbing', 'advisor', project.advisor],
      ['Tanggal Mulai', 'startDate', formatDate(project.startDate)],
      ['Deadline', 'deadline', formatDate(project.deadline)],
      ['Status', 'status', project.status]
    ];
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2>Informasi Penelitian</h2>
          <button class="btn btn-ghost btn-sm" id="btnEditInfo"><i data-lucide="pencil"></i>Edit</button>
        </div>
        <div class="info-grid">
          ${fields.map(([label, key, val]) => `
            <div>
              <label style="margin-bottom:4px">${label}</label>
              <div style="font-size:14px;font-weight:600">${escapeHtml(val) || '—'}</div>
            </div>`).join('')}
        </div>
      </div>`;
    document.getElementById('btnEditInfo').addEventListener('click', () => openModal(project));
  }

  /* ----- Tab: Ide Penelitian ----- */
  const IDEA_FIELDS = [
    ['background', 'Latar Belakang'], ['problem', 'Rumusan Masalah'],
    ['purpose', 'Tujuan Penelitian'], ['hypothesis', 'Hipotesis'],
    ['variables', 'Variabel'], ['method', 'Metode Penelitian'],
    ['object', 'Objek Penelitian'], ['benefit', 'Manfaat Penelitian']
  ];

  function renderIdeaTab(project) {
    const el = document.getElementById('panel-idea');
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h2>Ide Penelitian</h2></div>
        <p class="section-desc">Tersimpan otomatis ke Local Storage saat kamu mengetik.</p>
        <div class="idea-grid">
          ${IDEA_FIELDS.map(([key, label]) => `
            <div class="idea-field">
              <label for="idea_${key}">${label}</label>
              <textarea id="idea_${key}" data-key="${key}">${escapeHtml(project.idea[key])}</textarea>
            </div>`).join('')}
        </div>
        <div class="save-hint" id="ideaSaveHint"><i data-lucide="check-circle-2"></i><span>Tersimpan</span></div>
      </div>`;

    IDEA_FIELDS.forEach(([key]) => {
      document.getElementById('idea_' + key).addEventListener('input', (e) => {
        const p = getCurrent();
        p.idea[key] = e.target.value;
        clearTimeout(ideaSaveTimer);
        const hint = document.getElementById('ideaSaveHint');
        hint.classList.add('is-saving');
        hint.innerHTML = '<i data-lucide="loader-2"></i><span>Menyimpan…</span>';
        if (window.lucide) lucide.createIcons();
        ideaSaveTimer = setTimeout(() => {
          SR.storage.upsert(p);
          hint.classList.remove('is-saving');
          hint.innerHTML = '<i data-lucide="check-circle-2"></i><span>Tersimpan</span>';
          if (window.lucide) lucide.createIcons();
        }, 500);
      });
    });
  }

  /* ----- Tab: Referensi ----- */
  let refEditId = null;

  function renderRefTab(project, query) {
    const el = document.getElementById('panel-ref');
    const refs = SR.search.filterReferences(project.references || [], query || '');
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2>Referensi <span class="muted">(${project.references.length})</span></h2>
          <button class="btn btn-primary btn-sm" id="btnAddRef"><i data-lucide="plus"></i>Tambah Referensi</button>
        </div>
        <div class="topbar-search" style="max-width:320px;margin-bottom:16px;height:38px">
          <i data-lucide="search"></i>
          <input type="search" id="refSearch" placeholder="Cari referensi…" value="${escapeHtml(query || '')}">
        </div>
        ${refs.length ? `<div class="ref-grid">${refs.map(refCard).join('')}</div>` :
          `<div class="empty-state"><i data-lucide="book-x"></i><h3>Belum ada referensi</h3><p>Tambahkan buku, jurnal, atau website yang kamu gunakan.</p></div>`}
      </div>`;

    document.getElementById('btnAddRef').addEventListener('click', () => openRefModal());
    document.getElementById('refSearch').addEventListener('input', (e) => renderRefTab(getCurrent(), e.target.value));

    el.querySelectorAll('[data-ref-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const refId = btn.dataset.refId;
        if (btn.dataset.refAction === 'edit') {
          const ref = getCurrent().references.find(r => r.id === refId);
          openRefModal(ref);
        } else {
          SR.app.confirm({
            title: 'Hapus referensi ini?',
            desc: 'Referensi yang dihapus tidak dapat dikembalikan.',
            onConfirm: () => {
              const p = getCurrent();
              p.references = p.references.filter(r => r.id !== refId);
              SR.storage.upsert(p);
              renderRefTab(p);
              renderProgressOverview(p);
              SR.toast('Referensi dihapus.', 'success');
              if (window.lucide) lucide.createIcons();
            }
          });
        }
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function refIcon(type) {
    return { Buku: 'book', Jurnal: 'file-text', Website: 'globe' }[type] || 'book';
  }

  function refCard(ref) {
    return `
      <div class="ref-card">
        <div class="ref-card-top">
          <div>
            <div class="ref-card-title"><i data-lucide="${refIcon(ref.type)}" style="width:13px;height:13px;vertical-align:-2px;margin-right:4px"></i>${escapeHtml(ref.title)}</div>
            <div class="ref-card-meta">${escapeHtml(ref.author)} · ${ref.year} · <span class="tag">${escapeHtml(ref.type)}</span></div>
          </div>
        </div>
        ${ref.link ? `<a class="ref-card-link" href="${escapeHtml(ref.link)}" target="_blank" rel="noopener"><i data-lucide="link"></i>${escapeHtml(ref.link)}</a>` : ''}
        ${ref.note ? `<div class="ref-card-note">"${escapeHtml(ref.note)}"</div>` : ''}
        <div class="ref-card-actions">
          <button class="btn btn-ghost btn-sm" data-ref-action="edit" data-ref-id="${ref.id}"><i data-lucide="pencil"></i>Edit</button>
          <button class="btn btn-ghost btn-sm" data-ref-action="delete" data-ref-id="${ref.id}"><i data-lucide="trash-2"></i>Hapus</button>
        </div>
      </div>`;
  }

  function openRefModal(ref) {
    const modal = document.getElementById('modalRef');
    document.getElementById('formRef').reset();
    document.getElementById('modalRefTitle').textContent = ref ? 'Edit Referensi' : 'Tambah Referensi';
    document.getElementById('refId').value = ref ? ref.id : '';
    document.getElementById('refTitle').value = ref ? ref.title : '';
    document.getElementById('refAuthor').value = ref ? ref.author : '';
    document.getElementById('refYear').value = ref ? ref.year : new Date().getFullYear();
    document.getElementById('refType').value = ref ? ref.type : 'Buku';
    document.getElementById('refLink').value = ref ? ref.link : '';
    document.getElementById('refNote').value = ref ? ref.note : '';
    modal.hidden = false;
    setTimeout(() => document.getElementById('refTitle').focus(), 50);
  }

  function closeRefModal() {
    document.getElementById('modalRef').hidden = true;
  }

  function handleRefSubmit(e) {
    e.preventDefault();
    const project = getCurrent();
    const id = document.getElementById('refId').value;
    const ref = id ? project.references.find(r => r.id === id) : { id: SR.storage.uid('ref') };
    ref.title = document.getElementById('refTitle').value.trim();
    ref.author = document.getElementById('refAuthor').value.trim();
    ref.year = document.getElementById('refYear').value;
    ref.type = document.getElementById('refType').value;
    ref.link = document.getElementById('refLink').value.trim();
    ref.note = document.getElementById('refNote').value.trim();
    if (!id) project.references.push(ref);
    SR.storage.upsert(project);
    closeRefModal();
    renderRefTab(project);
    renderProgressOverview(project);
    SR.toast('Referensi tersimpan.', 'success');
    if (window.lucide) lucide.createIcons();
  }

  /* ----- Tab: Checklist BAB ----- */
  function renderChecklistTab(project) {
    const el = document.getElementById('panel-checklist');
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h2>Checklist BAB</h2></div>
        <p class="section-desc">Centang setiap BAB yang sudah selesai — progress akan bertambah otomatis.</p>
        <div class="checklist-list">
          ${Object.entries(BAB_LABELS).map(([key, [num, label]]) => `
            <label class="check-item ${project.checklist[key] ? 'is-checked' : ''}" for="chk_${key}">
              <input type="checkbox" id="chk_${key}" data-key="${key}" ${project.checklist[key] ? 'checked' : ''}>
              <div class="check-item-text">
                <div class="check-item-title">${num}</div>
                <div class="check-item-sub">${label}</div>
              </div>
              ${project.checklist[key] ? '<i data-lucide="check-circle-2" style="color:var(--primary);width:18px;height:18px"></i>' : ''}
            </label>`).join('')}
        </div>
      </div>`;
    Object.keys(BAB_LABELS).forEach(key => {
      document.getElementById('chk_' + key).addEventListener('change', (e) => {
        const p = getCurrent();
        p.checklist[key] = e.target.checked;
        SR.storage.upsert(p);
        renderChecklistTab(p);
        renderProgressOverview(p);
        if (window.lucide) lucide.createIcons();
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  /* ----- Tab: Timeline ----- */
  function renderTimelineTab(project) {
    const el = document.getElementById('panel-timeline');
    const items = [...project.timeline].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h2>Timeline</h2>
          <button class="btn btn-primary btn-sm" id="btnAddTimeline"><i data-lucide="plus"></i>Tambah Target</button>
        </div>
        ${items.length ? `<div class="timeline-list">${items.map((t, i) => timelineItem(t, i === items.length - 1)).join('')}</div>` :
          `<div class="empty-state"><i data-lucide="calendar-x"></i><h3>Belum ada target</h3><p>Tambahkan target pengerjaan supaya riset tetap on track.</p></div>`}
      </div>`;

    document.getElementById('btnAddTimeline').addEventListener('click', () => openTimelineModal());

    el.querySelectorAll('[data-t-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tId = btn.dataset.tId;
        const action = btn.dataset.tAction;
        const p = getCurrent();
        if (action === 'toggle') {
          const t = p.timeline.find(x => x.id === tId);
          t.done = !t.done;
          SR.storage.upsert(p);
          renderTimelineTab(p);
          renderProgressOverview(p);
        } else if (action === 'edit') {
          openTimelineModal(p.timeline.find(x => x.id === tId));
        } else if (action === 'delete') {
          SR.app.confirm({
            title: 'Hapus target ini?',
            desc: 'Target timeline yang dihapus tidak dapat dikembalikan.',
            onConfirm: () => {
              p.timeline = p.timeline.filter(x => x.id !== tId);
              SR.storage.upsert(p);
              renderTimelineTab(p);
              renderProgressOverview(p);
              SR.toast('Target dihapus.', 'success');
            }
          });
        }
        if (window.lucide) lucide.createIcons();
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function timelineItem(t, isLast) {
    return `
      <div class="timeline-item ${t.done ? 'is-done' : ''}">
        <div class="timeline-dot-col">
          <div class="timeline-dot"></div>
          ${!isLast ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-body">
          <div class="timeline-date">${formatDate(t.date)}</div>
          <div class="timeline-title">${escapeHtml(t.title)}</div>
          ${t.desc ? `<div class="timeline-desc">${escapeHtml(t.desc)}</div>` : ''}
          <div class="timeline-actions">
            <button class="btn btn-ghost btn-sm" data-t-action="toggle" data-t-id="${t.id}"><i data-lucide="${t.done ? 'rotate-ccw' : 'check'}"></i>${t.done ? 'Batal selesai' : 'Selesai'}</button>
            <button class="btn btn-ghost btn-sm btn-icon-only" data-t-action="edit" data-t-id="${t.id}"><i data-lucide="pencil"></i></button>
            <button class="btn btn-ghost btn-sm btn-icon-only" data-t-action="delete" data-t-id="${t.id}"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
      </div>`;
  }

  function openTimelineModal(t) {
    const modal = document.getElementById('modalTimeline');
    document.getElementById('formTimeline').reset();
    document.getElementById('modalTimelineTitle').textContent = t ? 'Edit Target' : 'Tambah Target Timeline';
    document.getElementById('tId').value = t ? t.id : '';
    document.getElementById('tDate').value = t ? t.date : new Date().toISOString().slice(0, 10);
    document.getElementById('tTitle').value = t ? t.title : '';
    document.getElementById('tDesc').value = t ? t.desc : '';
    modal.hidden = false;
    setTimeout(() => document.getElementById('tTitle').focus(), 50);
  }

  function closeTimelineModal() {
    document.getElementById('modalTimeline').hidden = true;
  }

  function handleTimelineSubmit(e) {
    e.preventDefault();
    const project = getCurrent();
    const id = document.getElementById('tId').value;
    const t = id ? project.timeline.find(x => x.id === id) : { id: SR.storage.uid('tl'), done: false };
    t.date = document.getElementById('tDate').value;
    t.title = document.getElementById('tTitle').value.trim();
    t.desc = document.getElementById('tDesc').value.trim();
    if (!id) project.timeline.push(t);
    SR.storage.upsert(project);
    closeTimelineModal();
    renderTimelineTab(project);
    renderProgressOverview(project);
    SR.toast('Target tersimpan.', 'success');
    if (window.lucide) lucide.createIcons();
  }

  /* ----- Tab: Catatan ----- */
  function renderNotesTab(project) {
    const el = document.getElementById('panel-notes');
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h2>Catatan</h2></div>
        <p class="section-desc">Contoh: revisi dari guru, jadwal konsultasi, atau ide tambahan.</p>
        <textarea id="notesArea" rows="10" placeholder="Tulis catatan penting di sini…">${escapeHtml(project.notes)}</textarea>
        <div class="save-hint" id="notesSaveHint"><i data-lucide="check-circle-2"></i><span>Tersimpan</span></div>
      </div>`;
    document.getElementById('notesArea').addEventListener('input', (e) => {
      const p = getCurrent();
      p.notes = e.target.value;
      clearTimeout(notesSaveTimer);
      const hint = document.getElementById('notesSaveHint');
      hint.classList.add('is-saving');
      hint.innerHTML = '<i data-lucide="loader-2"></i><span>Menyimpan…</span>';
      if (window.lucide) lucide.createIcons();
      notesSaveTimer = setTimeout(() => {
        SR.storage.upsert(p);
        hint.classList.remove('is-saving');
        hint.innerHTML = '<i data-lucide="check-circle-2"></i><span>Tersimpan</span>';
        if (window.lucide) lucide.createIcons();
      }, 500);
    });
    if (window.lucide) lucide.createIcons();
  }

  /* ----- Tab: Lampiran ----- */
  const ALLOWED_TYPES = ['application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png'];
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — batas aman untuk Local Storage

  function fileIcon(type) {
    if (type.includes('pdf')) return 'file-text';
    if (type.includes('word')) return 'file-type-2';
    if (type.includes('image')) return 'image';
    return 'file';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderFilesTab(project) {
    const el = document.getElementById('panel-files');
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h2>Lampiran <span class="muted">(${project.attachments.length})</span></h2></div>
        <div class="file-drop" id="fileDrop">
          <i data-lucide="upload-cloud"></i>
          <strong>Klik atau seret file ke sini</strong>
          <span>PDF, DOCX, JPG, PNG — maks 4MB per file</span>
          <input type="file" id="fileInput" accept=".pdf,.docx,.jpg,.jpeg,.png" multiple hidden>
        </div>
        <div class="file-list" id="fileList">
          ${project.attachments.length ? project.attachments.map(fileItem).join('') :
            '<p class="muted" style="text-align:center;padding:10px">Belum ada lampiran.</p>'}
        </div>
      </div>`;

    const drop = document.getElementById('fileDrop');
    const input = document.getElementById('fileInput');
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('is-drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('is-drag'));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      drop.classList.remove('is-drag');
      handleFiles(e.dataTransfer.files);
    });
    input.addEventListener('change', (e) => handleFiles(e.target.files));

    el.querySelectorAll('[data-file-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fId = btn.dataset.fileId;
        SR.app.confirm({
          title: 'Hapus lampiran ini?',
          desc: 'File yang dihapus tidak dapat dikembalikan.',
          onConfirm: () => {
            const p = getCurrent();
            p.attachments = p.attachments.filter(a => a.id !== fId);
            SR.storage.upsert(p);
            renderFilesTab(p);
            renderProgressOverview(p);
            SR.toast('Lampiran dihapus.', 'success');
          }
        });
      });
    });
    if (window.lucide) lucide.createIcons();
  }

  function fileItem(f) {
    return `
      <div class="file-item">
        <div class="file-icon"><i data-lucide="${fileIcon(f.type)}"></i></div>
        <div class="file-info">
          <div class="file-name">${escapeHtml(f.name)}</div>
          <div class="file-sub">${formatBytes(f.size)} · ${formatDate(f.addedAt.slice(0, 10))}</div>
        </div>
        <div class="file-actions">
          <a class="icon-btn icon-btn-ghost" href="${f.data}" download="${escapeHtml(f.name)}" title="Unduh"><i data-lucide="download"></i></a>
          <button class="icon-btn icon-btn-ghost" data-file-action="delete" data-file-id="${f.id}" title="Hapus"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`;
  }

  function handleFiles(fileList) {
    const project = getCurrent();
    const files = Array.from(fileList);
    let rejected = 0;
    let pending = files.length;
    if (!pending) return;
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        rejected++;
        pending--;
        if (pending === 0) finishUpload(project, rejected);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        project.attachments.push({
          id: SR.storage.uid('file'),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: reader.result,
          addedAt: SR.storage.nowIso()
        });
        pending--;
        if (pending === 0) finishUpload(project, rejected);
      };
      reader.onerror = () => {
        rejected++;
        pending--;
        if (pending === 0) finishUpload(project, rejected);
      };
      reader.readAsDataURL(file);
    });
  }

  function finishUpload(project, rejected) {
    SR.storage.upsert(project);
    renderFilesTab(project);
    renderProgressOverview(project);
    if (rejected > 0) SR.toast(`${rejected} file dilewati karena melebihi 4MB.`, 'error');
    else SR.toast('Lampiran berhasil diunggah.', 'success');
  }

  /* ---------------- Tab switching ---------------- */
  function wireTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
        btn.classList.add('is-active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('is-active');
      });
    });
  }

  /* ---------------- Init ---------------- */
  function init() {
    document.getElementById('btnAddResearchTop').addEventListener('click', () => openModal());
    document.getElementById('emptyAddBtn').addEventListener('click', () => openModal());
    document.getElementById('closeModalResearch').addEventListener('click', closeModal);
    document.getElementById('cancelModalResearch').addEventListener('click', closeModal);
    document.getElementById('formResearch').addEventListener('submit', handleSubmit);
    document.getElementById('modalResearch').addEventListener('click', (e) => { if (e.target.id === 'modalResearch') closeModal(); });

    document.getElementById('closeModalRef').addEventListener('click', closeRefModal);
    document.getElementById('cancelModalRef').addEventListener('click', closeRefModal);
    document.getElementById('formRef').addEventListener('submit', handleRefSubmit);
    document.getElementById('modalRef').addEventListener('click', (e) => { if (e.target.id === 'modalRef') closeRefModal(); });

    document.getElementById('closeModalTimeline').addEventListener('click', closeTimelineModal);
    document.getElementById('cancelModalTimeline').addEventListener('click', closeTimelineModal);
    document.getElementById('formTimeline').addEventListener('submit', handleTimelineSubmit);
    document.getElementById('modalTimeline').addEventListener('click', (e) => { if (e.target.id === 'modalTimeline') closeTimelineModal(); });

    document.getElementById('backToList').addEventListener('click', () => SR.app.navigate('all'));

    wireTabs();
    wireGridDelegation(document.getElementById('dashResearchGrid'));
    wireGridDelegation(document.getElementById('allResearchGrid'));
  }

  return {
    init, buildCard, openModal, openDetail,
    formatDate, formatDateShort, daysUntil, statusBadgeClass, categoryColor, escapeHtml,
    get currentId() { return currentId; }
  };
})();
