/* ═══════════════════════════════════════════
   STUDYOS v2 — APP LOGIC
   Gemini backend · Dynamic exam sections
═══════════════════════════════════════════ */
(function () {
  'use strict';

  // ── STATE ──────────────────────────────────────────────────────────────────
  const state = {
    files: [],
    style: 'detective',
    // Dynamic sections — user can add/remove/rename
    sections: [
      { id: 's1', label: 'A', q: 5,  m: 2,  on: true },
      { id: 's2', label: 'B', q: 5,  m: 4,  on: true },
      { id: 's3', label: 'C', q: 3,  m: 10, on: true },
    ],
    step: 1,
    quizData: [],
    quizAnswered: {},
    quizScore: 0,
    sectionCounter: 4,
  };

  const MAX_FILES = 5;
  const MAX_MB    = 25;
  const SECTION_LABELS = ['A','B','C','D','E','F','G','H','I','J'];

  // ── SCREEN NAV ────────────────────────────────────────────────────────────
  window.goScreen = function (name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    window.scrollTo(0, 0);
    if (name === 'upload') { state.step = 1; renderStep(); }
  };

  // ── BG BUTTON ─────────────────────────────────────────────────────────────
  document.getElementById('bg-change-btn')?.addEventListener('click', () => {
    const name = CityBG.next();
    const label = document.getElementById('scene-label');
    if (label) {
      label.textContent = `${CityBG.getIndex()+1}/${CityBG.getCount()} · ${name}`;
      label.style.opacity = '1';
      setTimeout(() => label.style.opacity = '0', 2500);
    }
  });

  // ── STEP ROUTER ───────────────────────────────────────────────────────────
  const stepRenderers = { 1: renderUpload, 2: renderStyle, 3: renderExam, 4: renderReview };

  function renderStep() {
    const content = document.getElementById('step-content');
    content.innerHTML = '';
    content.appendChild(stepRenderers[state.step]());
    document.getElementById('step-indicator').textContent = `STEP ${state.step} / 4`;
    document.getElementById('progress-bar').style.width = `${state.step * 25}%`;
    window.scrollTo(0, 0);
  }

  // ── STEP 1: UPLOAD ────────────────────────────────────────────────────────
  function renderUpload() {
    const wrap = div('step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>01</span> UPLOAD YOUR PDFs</div>
      <div class="panel-sub">Drop up to ${MAX_FILES} PDFs (max ${MAX_MB}MB each · ~50 slides). All processed together.</div>
      <div class="upload-zone" id="upload-zone">
        <input type="file" id="file-input" accept=".pdf" multiple>
        <div class="upload-zone-text">
          <div class="upload-zone-icon">📁</div>
          <div class="upload-zone-main">DRAG & DROP PDFs HERE</div>
          <div class="upload-zone-hint" id="upload-hint">or click to browse · max ${MAX_FILES} files</div>
        </div>
      </div>
      <div id="file-list" class="file-list"></div>
      <div class="err-msg" id="err-upload"></div>
      <div class="step-nav">
        <button class="btn-next" onclick="App.next()">NEXT: LEARNING STYLE →</button>
      </div>`;

    setTimeout(() => {
      const input = document.getElementById('file-input');
      const zone  = document.getElementById('upload-zone');
      input.addEventListener('change', e => handleFiles(e.target.files));
      zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });
      renderFileList();
    }, 0);

    return wrap;
  }

  function handleFiles(list) {
    Array.from(list).forEach(file => {
      if (state.files.length >= MAX_FILES) return;
      if (file.type !== 'application/pdf') { showErr('err-upload', `${file.name} is not a PDF.`); return; }
      if (file.size > MAX_MB * 1024 * 1024) { showErr('err-upload', `${file.name} too large (max ${MAX_MB}MB).`); return; }
      if (state.files.find(f => f.name === file.name)) return;
      const reader = new FileReader();
      reader.onload = e => {
        state.files.push({ file, base64: e.target.result.split(',')[1], name: file.name, size: file.size });
        renderFileList();
        hideErr('err-upload');
      };
      reader.readAsDataURL(file);
    });
  }

  function renderFileList() {
    const el = document.getElementById('file-list');
    if (!el) return;
    el.innerHTML = state.files.map((f, i) => `
      <div class="file-item">
        <span style="color:var(--neon-green)">✓</span>
        <span class="file-item-name">${f.name}</span>
        <span class="file-item-size">${(f.size/1024/1024).toFixed(1)}MB</span>
        <button class="file-remove" onclick="App.removeFile(${i})">✕</button>
      </div>`).join('');
    const hint = document.getElementById('upload-hint');
    if (hint) {
      const rem = MAX_FILES - state.files.length;
      hint.textContent = state.files.length
        ? `${state.files.length} file${state.files.length>1?'s':''} loaded · ${rem} slot${rem!==1?'s':''} remaining`
        : `or click to browse · max ${MAX_FILES} files`;
    }
  }

  // ── STEP 2: STYLE ─────────────────────────────────────────────────────────
  const STYLES = [
    { id: 'detective', icon: '🔍', name: 'DETECTIVE',     desc: 'Story-driven investigation. Each concept is a clue.' },
    { id: 'flashcard', icon: '🃏', name: 'FLASHCARD',     desc: 'Fast Q&A blocks. Term → Definition. Great for memorization.' },
    { id: 'visual',    icon: '📊', name: 'VISUAL-HEAVY',  desc: 'ASCII diagrams, tables, structured breakdowns.' },
    { id: 'cornell',   icon: '📓', name: 'CORNELL NOTES', desc: 'Cues | Notes | Summary. Perfect for handwritten notes.' },
    { id: 'feynman',   icon: '💡', name: 'FEYNMAN',       desc: 'Explain like I\'m 12. Simple analogies. No jargon.' },
    { id: 'mindmap',   icon: '🧠', name: 'MIND MAP',      desc: 'ASCII mind map. Central idea → branches → sub-points.' },
  ];

  function renderStyle() {
    const wrap = div('step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>02</span> LEARNING STYLE</div>
      <div class="panel-sub">How should StudyOS explain your material?</div>
      <div class="style-grid">
        ${STYLES.map(s => `
          <div class="style-card ${state.style===s.id?'selected':''}" data-id="${s.id}" onclick="App.selectStyle('${s.id}')">
            <div class="sc-icon">${s.icon}</div>
            <div class="sc-name">${s.name}</div>
            <div class="sc-desc">${s.desc}</div>
          </div>`).join('')}
      </div>
      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" onclick="App.next()">NEXT: EXAM PATTERN →</button>
      </div>`;
    return wrap;
  }

  // ── STEP 3: EXAM SECTIONS (DYNAMIC) ───────────────────────────────────────
  function renderExam() {
    const wrap = div('step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>03</span> EXAM PATTERN</div>
      <div class="panel-sub">Add, remove or rename sections. Set questions and marks for each.</div>

      <div id="sections-list"></div>

      <button class="add-section-btn" id="add-sec-btn" onclick="App.addSection()">
        <span>＋</span> ADD SECTION
      </button>

      <div class="exam-marks-total" id="marks-total"></div>

      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" onclick="App.next()">NEXT: REVIEW & GENERATE →</button>
      </div>`;

    setTimeout(() => { renderSectionsList(); updateMarksTotal(); }, 0);
    return wrap;
  }

  function renderSectionsList() {
    const list = document.getElementById('sections-list');
    if (!list) return;

    list.innerHTML = state.sections.map((sec, i) => `
      <div class="exam-section ${sec.on?'':'disabled'}" id="esec-${sec.id}">

        <div class="esec-left">
          <div class="esec-label-wrap">
            <span class="esec-prefix">SEC</span>
            <input
              class="esec-label-input"
              type="text"
              maxlength="3"
              value="${sec.label}"
              title="Rename section"
              onchange="App.renameSection('${sec.id}', this.value)"
              onclick="this.select()"
            >
          </div>
        </div>

        <div class="esec-fields">
          <div class="esec-field">
            <label>Questions</label>
            <input type="number" value="${sec.q}" min="0" max="50"
              onchange="App.updateSection('${sec.id}','q',this.value)">
          </div>
          <div class="esec-field">
            <label>Marks each</label>
            <input type="number" value="${sec.m}" min="1" max="50"
              onchange="App.updateSection('${sec.id}','m',this.value)">
          </div>
          <div class="esec-field esec-subtotal">
            <label>Subtotal</label>
            <span id="sub-${sec.id}">${sec.q * sec.m} marks</span>
          </div>
        </div>

        <div class="esec-actions">
          <button class="esec-toggle ${sec.on?'on':''}" onclick="App.toggleSection('${sec.id}')">
            ${sec.on ? 'ON' : 'OFF'}
          </button>
          ${state.sections.length > 1 ? `
            <button class="esec-delete" onclick="App.deleteSection('${sec.id}')" title="Remove section">✕</button>
          ` : ''}
        </div>

      </div>`).join('');

    updateMarksTotal();
  }

  function updateMarksTotal() {
    const el = document.getElementById('marks-total');
    if (!el) return;
    let total = 0;
    const parts = [];
    state.sections.forEach(sec => {
      if (sec.on) {
        const sub = sec.q * sec.m;
        total += sub;
        parts.push(`Sec ${sec.label}: ${sub}`);
        const subEl = document.getElementById(`sub-${sec.id}`);
        if (subEl) subEl.textContent = `${sub} marks`;
      }
    });
    el.innerHTML = parts.length
      ? parts.join(' &nbsp;|&nbsp; ') + ` &nbsp;&nbsp; <strong>TOTAL: ${total} MARKS</strong>`
      : 'No active sections.';
  }

  // ── STEP 4: REVIEW ────────────────────────────────────────────────────────
  function renderReview() {
    const styleName = STYLES.find(s => s.id === state.style)?.name || state.style;
    const secLines = state.sections
      .filter(s => s.on)
      .map(s => `<div>Section ${s.label}: ${s.q} questions × ${s.m} marks = ${s.q*s.m} marks</div>`)
      .join('');

    const wrap = div('step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>04</span> REVIEW & GENERATE</div>
      <div class="panel-sub">Everything looks good? Hit generate.</div>

      <div class="review-box">
        <div>📄 <strong>FILES:</strong> <span class="rv-val">${state.files.map(f=>f.name).join(', ')||'—'}</span></div>
        <div>🎨 <strong>STYLE:</strong> <span class="rv-val">${styleName}</span></div>
        <div class="review-section">
          📋 <strong>EXAM PATTERN:</strong>
          ${secLines || '<span style="color:var(--text-muted)">No active sections</span>'}
        </div>
      </div>

      <div class="free-badge">
        <span class="free-icon">🆓</span>
        <div>
          <div class="free-title">POWERED BY AI · FREE TO USE</div>
          <div class="free-sub">No API key needed. Your classmates can use this link directly.</div>
        </div>
      </div>

      <div class="err-msg" id="err-gen"></div>

      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" id="btn-generate" onclick="App.generate()">⚡ GENERATE STUDY GUIDE + QUIZ</button>
      </div>`;
    return wrap;
  }

  // ── GENERATE ──────────────────────────────────────────────────────────────
  const LOG_LINES = [
    'Parsing PDF structure...',
    'Extracting text and concepts...',
    'Identifying key topics...',
    'Applying learning style...',
    'Building study guide...',
    'Writing exam questions...',
    'Formatting output...',
    'Almost done...',
  ];
  let logTimer, progTimer, logIdx = 0, progVal = 0;

  function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
    logIdx = 0; progVal = 0;
    document.getElementById('loading-title').textContent = 'PROCESSING...';
    document.getElementById('loading-sub').textContent = `Reading ${state.files.length} PDF${state.files.length>1?'s':''}...`;
    document.getElementById('loading-log').innerHTML = '';
    document.getElementById('loading-progress-fill').style.width = '0%';

    logTimer = setInterval(() => {
      if (logIdx < LOG_LINES.length) {
        const line = document.createElement('div');
        line.textContent = LOG_LINES[logIdx++];
        const log = document.getElementById('loading-log');
        log.appendChild(line);
        if (log.children.length > 4) log.removeChild(log.children[0]);
      }
    }, 4000);

    progTimer = setInterval(() => {
      progVal = Math.min(progVal + Math.random() * 5, 90);
      document.getElementById('loading-progress-fill').style.width = progVal + '%';
    }, 1000);
  }

  function hideLoading() {
    clearInterval(logTimer);
    clearInterval(progTimer);
    document.getElementById('loading-progress-fill').style.width = '100%';
    setTimeout(() => document.getElementById('loading-overlay').classList.remove('active'), 400);
  }

  async function generate() {
    if (!state.files.length) { showErr('err-gen', 'No PDFs loaded. Go back to step 1.'); return; }

    showLoading();

    const styleDefs = {
      detective: 'Write as a detective investigation. The student is a detective. Each concept = a CLUE DISCOVERED. Use "THE CASE OF:", "EVIDENCE:", "DEDUCTION:", "CASE CLOSED:". Make it immersive and narrative.',
      flashcard: 'Format as numbered flashcards. Each card: ┌─ CARD [N] ─┐ | FRONT: [term] | BACK: [answer] └──────────┘. Group by topic with ### headers.',
      visual:    'Use heavy ASCII art: tables with | borders, diagrams with ─ ═ ║ ╔ ╗ arrows →. Minimize prose, maximize visual structure.',
      cornell:   'Cornell Notes format:\nCUES (30%): key terms/questions\nNOTES (70%): detailed content\nSUMMARY: 3-5 sentence recap\nUse ASCII borders to separate zones.',
      feynman:   'Explain like teaching a curious 12-year-old. Everyday analogies, no unexplained jargon. Short sentences. Start each section with a relatable hook.',
      mindmap:   'ASCII mind maps. CENTRAL TOPIC → major branches ──► → sub-branches └── → leaf nodes •. Then 2-3 line notes per branch.',
    };

    const activeSections = state.sections.filter(s => s.on);
    const examSpec = activeSections
      .map(s => `Section ${s.label}: ${s.q} questions × ${s.m} marks each`)
      .join('\n');
    const totalQ = activeSections.reduce((sum, s) => sum + s.q, 0);

    const prompt = `You are StudyOS, an AI study assistant. Analyze ALL uploaded PDFs and produce a study package.

══ PART 1: STUDY GUIDE ══
${styleDefs[state.style] || styleDefs.feynman}

Requirements:
- Cover ALL major topics and concepts from every PDF
- Use # for title, ## for main sections, ### for subsections
- Be comprehensive — exam preparation level

══ PART 2: EXAM QUIZ ══
Exam pattern:
${examSpec || '10 mixed questions, 2 marks each'}

Generate exactly ${totalQ || 10} questions matching this pattern precisely.

CRITICAL: End your response with ONLY this JSON block:

\`\`\`json
{
  "questions": [
    {
      "section": "A",
      "marks": 2,
      "q": "Question text?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answer": 0,
      "explanation": "Why this is correct."
    }
  ]
}
\`\`\`

answer is 0-indexed (0=A, 1=B, 2=C, 3=D). Nothing after the JSON block.`;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          pdfDataList: state.files.map(f => ({ base64: f.base64, name: f.name })),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.text || '';

      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```\s*$/);
      let quiz = null;
      if (jsonMatch) {
        try { quiz = JSON.parse(jsonMatch[1]); } catch(e) { console.warn('Quiz parse fail', e); }
      }
      const guideText = jsonMatch ? rawText.slice(0, rawText.lastIndexOf('```json')) : rawText;

      hideLoading();
      renderResults(guideText, quiz);

    } catch (err) {
      hideLoading();
      const el = document.getElementById('err-gen');
      if (el) { el.textContent = '❌ ' + err.message; el.classList.add('show'); }
      console.error(err);
    }
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  function renderResults(guideText, quiz) {
    goScreen('results');
    document.getElementById('guide-content').innerHTML = mdToHtml(guideText);

    state.quizData = quiz?.questions || [];
    state.quizAnswered = {};
    state.quizScore = 0;
    document.getElementById('quiz-score-bar').style.display = 'none';

    const qEl = document.getElementById('quiz-content');
    if (!state.quizData.length) {
      qEl.innerHTML = `<p style="color:var(--text-dim);padding:20px 0;font-size:13px">No quiz questions parsed. Check the Study Guide tab.</p>`;
      return;
    }

    qEl.innerHTML = state.quizData.map((q, i) => `
      <div class="quiz-question" id="qq-${i}">
        <div class="quiz-meta">Q${i+1} · SECTION ${q.section||'?'} · ${q.marks||'?'} MARKS</div>
        <div class="quiz-q-text">${esc(q.q)}</div>
        <div class="quiz-options">
          ${(q.options||[]).map((opt,oi) => `
            <button class="quiz-opt" id="qopt-${i}-${oi}" onclick="App.answerQ(${i},${oi})">${esc(opt)}</button>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="qexpl-${i}">${esc(q.explanation||'')}</div>
      </div>`).join('');
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  function answerQ(qi, chosen) {
    if (state.quizAnswered[qi] !== undefined) return;
    state.quizAnswered[qi] = chosen;
    const q = state.quizData[qi];
    (q.options||[]).forEach((_, oi) => {
      const btn = document.getElementById(`qopt-${qi}-${oi}`);
      if (!btn) return;
      btn.disabled = true;
      if (oi === q.answer) btn.classList.add('correct');
      else if (oi === chosen) btn.classList.add('wrong');
    });
    if (chosen === q.answer) state.quizScore++;
    document.getElementById(`qexpl-${qi}`)?.classList.add('show');

    if (Object.keys(state.quizAnswered).length === state.quizData.length) {
      const bar = document.getElementById('quiz-score-bar');
      const pct = Math.round(state.quizScore / state.quizData.length * 100);
      bar.textContent = `FINAL SCORE: ${state.quizScore}/${state.quizData.length} (${pct}%) ${pct>=75?'🎉':pct>=50?'📚':'💪'}`;
      bar.style.display = 'block';
      bar.scrollIntoView({ behavior: 'smooth' });
    }
  }

  window.switchTab = function (tab) {
    ['guide','quiz'].forEach(t => {
      document.getElementById(`rtab-${t}`)?.classList.toggle('active', t===tab);
      document.getElementById(`rpane-${t}`)?.classList.toggle('active', t===tab);
    });
  };

  window.newSession = function () {
    state.files = [];
    state.style = 'detective';
    state.sections = [
      { id: 's1', label: 'A', q: 5, m: 2,  on: true },
      { id: 's2', label: 'B', q: 5, m: 4,  on: true },
      { id: 's3', label: 'C', q: 3, m: 10, on: true },
    ];
    state.sectionCounter = 4;
    goScreen('upload');
  };

  // ── MARKDOWN ──────────────────────────────────────────────────────────────
  function mdToHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
      .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/`(.+?)`/g,       '<code>$1</code>')
      .replace(/^> (.+)$/gm,    '<blockquote>$1</blockquote>')
      .replace(/^---$/gm,        '<hr>')
      .replace(/^[-*] (.+)$/gm,  '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  function div(cls) { const e = document.createElement('div'); e.className = cls; return e; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function showErr(id, msg) { const e = document.getElementById(id); if(e){e.textContent=msg;e.classList.add('show');} }
  function hideErr(id) { document.getElementById(id)?.classList.remove('show'); }

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  window.App = {
    next() {
      if (state.step === 1 && !state.files.length) { showErr('err-upload','Upload at least one PDF.'); return; }
      if (state.step < 4) { state.step++; renderStep(); }
    },
    prev() { if (state.step > 1) { state.step--; renderStep(); } },
    removeFile(i) { state.files.splice(i,1); renderFileList(); },
    selectStyle(id) {
      state.style = id;
      document.querySelectorAll('.style-card').forEach(c => c.classList.toggle('selected', c.dataset.id===id));
    },

    // DYNAMIC SECTIONS
    addSection() {
      if (state.sections.length >= 10) return;
      const nextLabel = SECTION_LABELS[state.sections.length] || String(state.sections.length + 1);
      state.sections.push({
        id: 's' + state.sectionCounter++,
        label: nextLabel,
        q: 5, m: 2, on: true,
      });
      renderSectionsList();
    },
    deleteSection(id) {
      if (state.sections.length <= 1) return;
      state.sections = state.sections.filter(s => s.id !== id);
      renderSectionsList();
    },
    toggleSection(id) {
      const sec = state.sections.find(s => s.id === id);
      if (!sec) return;
      sec.on = !sec.on;
      const tog = document.querySelector(`#esec-${id} .esec-toggle`);
      const row = document.getElementById(`esec-${id}`);
      if (tog) { tog.textContent = sec.on ? 'ON' : 'OFF'; tog.classList.toggle('on', sec.on); }
      if (row) row.classList.toggle('disabled', !sec.on);
      updateMarksTotal();
    },
    updateSection(id, field, val) {
      const sec = state.sections.find(s => s.id === id);
      if (sec) { sec[field] = parseInt(val) || 0; updateMarksTotal(); }
    },
    renameSection(id, val) {
      const sec = state.sections.find(s => s.id === id);
      if (sec) sec.label = val.trim().toUpperCase().slice(0,3) || sec.label;
    },
    generate,
    answerQ,
  };

  // ── BOOT ──────────────────────────────────────────────────────────────────
  renderStep();
})();
