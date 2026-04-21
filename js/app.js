/* ═══════════════════════════════════════════
   STUDYOS — APP LOGIC
   Full flow: Upload → Style → Exam → Generate → Results
═══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── STATE ───────────────────────────────────────────────────────────────────
  const state = {
    files: [],          // { file, base64, name, size }
    style: 'detective',
    sections: {
      a: { on: true, q: 5,  m: 2  },
      b: { on: true, q: 5,  m: 4  },
      c: { on: true, q: 3,  m: 10 },
    },
    apiKey: localStorage.getItem('studyos_apikey') || '',
    step: 1,
    quizData: [],
    quizAnswered: {},
    quizScore: 0,
  };

  const MAX_FILES = 5;
  const MAX_FILE_SIZE_MB = 25; // ~50 slides per PDF ≈ 15-25MB

  // ── SCREEN NAVIGATION ─────────────────────────────────────────────────────
  window.goScreen = function (name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(`screen-${name}`).classList.add('active');
    window.scrollTo(0, 0);
    if (name === 'upload') {
      state.step = 1;
      renderStep();
    }
  };

  // ── BG CHANGE BUTTON ──────────────────────────────────────────────────────
  document.getElementById('bg-change-btn')?.addEventListener('click', () => {
    const name = CityBG.next();
    const label = document.getElementById('scene-label');
    const idx = CityBG.getIndex() + 1;
    const total = CityBG.getCount();
    if (label) {
      label.textContent = `${idx}/${total} · ${name}`;
      label.style.opacity = '1';
      setTimeout(() => { label.style.opacity = '0'; }, 2500);
    }
  });

  // ── STEP RENDERING ─────────────────────────────────────────────────────────
  function renderStep() {
    const steps = {
      1: renderUploadStep,
      2: renderStyleStep,
      3: renderExamStep,
      4: renderReviewStep,
    };
    const content = document.getElementById('step-content');
    content.innerHTML = '';
    content.appendChild(steps[state.step]());
    updateStepUI();
  }

  function updateStepUI() {
    document.getElementById('step-indicator').textContent = `STEP ${state.step} / 4`;
    document.getElementById('progress-bar').style.width = `${state.step * 25}%`;
  }

  function nextStep() {
    if (state.step < 4) { state.step++; renderStep(); window.scrollTo(0, 0); }
  }
  function prevStep() {
    if (state.step > 1) { state.step--; renderStep(); window.scrollTo(0, 0); }
  }

  // ── STEP 1: UPLOAD ─────────────────────────────────────────────────────────
  function renderUploadStep() {
    const wrap = el('div', 'step-panel');

    wrap.innerHTML = `
      <div class="panel-heading">// <span>01</span> UPLOAD YOUR PDFs</div>
      <div class="panel-sub">Drop up to ${MAX_FILES} PDFs (up to ${MAX_FILE_SIZE_MB}MB each · ~50 slides). All files will be processed together.</div>

      <div class="upload-zone" id="upload-zone">
        <input type="file" id="file-input" accept=".pdf" multiple>
        <div class="upload-zone-text">
          <div class="upload-zone-icon">📁</div>
          <div class="upload-zone-main">DRAG & DROP PDFs HERE</div>
          <div class="upload-zone-hint">or click to browse · max ${MAX_FILES} files · ${MAX_FILE_SIZE_MB}MB each</div>
        </div>
      </div>

      <div class="file-limit-warn" id="file-limit-warn">⚠ Maximum ${MAX_FILES} PDFs allowed. Extra files were ignored.</div>
      <div id="file-list" class="file-list"></div>
      <div class="err-msg" id="err-upload">Please upload at least one PDF to continue.</div>

      <div class="step-nav">
        <button class="btn-next" onclick="App.next()" id="btn-next-1">NEXT: LEARNING STYLE →</button>
      </div>
    `;

    // Wire up file input
    setTimeout(() => {
      const input = document.getElementById('file-input');
      const zone = document.getElementById('upload-zone');

      input.addEventListener('change', e => handleFiles(e.target.files));

      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
      });

      renderFileList();
    }, 0);

    return wrap;
  }

  function handleFiles(fileList) {
    const warn = document.getElementById('file-limit-warn');
    let added = 0;

    Array.from(fileList).forEach(file => {
      if (state.files.length >= MAX_FILES) { if (warn) warn.style.display = 'block'; return; }
      if (file.type !== 'application/pdf') return;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        showErr('err-upload', `${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB).`);
        return;
      }
      if (state.files.find(f => f.name === file.name)) return; // duplicate

      const reader = new FileReader();
      reader.onload = e => {
        state.files.push({
          file,
          base64: e.target.result.split(',')[1],
          name: file.name,
          size: file.size,
        });
        renderFileList();
      };
      reader.readAsDataURL(file);
      added++;
    });

    if (added > 0 && warn) warn.style.display = 'none';
    hideErr('err-upload');
  }

  function renderFileList() {
    const listEl = document.getElementById('file-list');
    if (!listEl) return;
    listEl.innerHTML = state.files.map((f, i) => `
      <div class="file-item">
        <span style="color:var(--neon-green);font-size:12px">✓</span>
        <span class="file-item-name">${f.name}</span>
        <span class="file-item-size">${(f.size / 1024 / 1024).toFixed(1)}MB</span>
        <button class="file-remove" onclick="App.removeFile(${i})" title="Remove">✕</button>
      </div>
    `).join('');

    // Update upload zone hint
    const zone = document.getElementById('upload-zone');
    if (zone) {
      const remaining = MAX_FILES - state.files.length;
      zone.querySelector('.upload-zone-hint').textContent =
        remaining > 0
          ? `${state.files.length} file${state.files.length > 1 ? 's' : ''} loaded · ${remaining} slot${remaining > 1 ? 's' : ''} remaining`
          : `${MAX_FILES}/${MAX_FILES} files loaded`;
    }
  }

  // ── STEP 2: STYLE ──────────────────────────────────────────────────────────
  const STYLES = [
    { id: 'detective', icon: '🔍', name: 'DETECTIVE', desc: 'Story-driven. Each concept is a clue. Best for deep narrative understanding.' },
    { id: 'flashcard', icon: '🃏', name: 'FLASHCARD', desc: 'Fast Q&A format. Term → Definition. Great for memorization sprints.' },
    { id: 'visual',    icon: '📊', name: 'VISUAL-HEAVY', desc: 'ASCII diagrams, tables, structured visual breakdowns. Perfect for processes.' },
    { id: 'cornell',   icon: '📓', name: 'CORNELL NOTES', desc: 'Classic Cornell: cues | notes | summary. Perfect for handwritten transcription.' },
    { id: 'feynman',   icon: '💡', name: 'FEYNMAN', desc: 'Explain like I\'m 12. Simple analogies. No jargon. Hard concepts made easy.' },
    { id: 'mindmap',   icon: '🧠', name: 'MIND MAP', desc: 'ASCII mind map with hierarchy. Central idea → branches → sub-points.' },
  ];

  function renderStyleStep() {
    const wrap = el('div', 'step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>02</span> CHOOSE LEARNING STYLE</div>
      <div class="panel-sub">How should StudyOS explain your material? This shapes the entire study guide.</div>
      <div class="style-grid" id="style-grid">
        ${STYLES.map(s => `
          <div class="style-card ${state.style === s.id ? 'selected' : ''}" data-id="${s.id}" onclick="App.selectStyle('${s.id}')">
            <div class="sc-icon">${s.icon}</div>
            <div class="sc-name">${s.name}</div>
            <div class="sc-desc">${s.desc}</div>
          </div>
        `).join('')}
      </div>
      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" onclick="App.next()">NEXT: EXAM PATTERN →</button>
      </div>
    `;
    return wrap;
  }

  // ── STEP 3: EXAM PATTERN ──────────────────────────────────────────────────
  function renderExamStep() {
    const wrap = el('div', 'step-panel');

    const secRows = ['a','b','c'].map(s => {
      const sec = state.sections[s];
      return `
        <div class="exam-section ${sec.on ? '' : 'disabled'}" id="exam-sec-${s}">
          <div class="exam-sec-label">SEC ${s.toUpperCase()}</div>
          <div class="exam-fields">
            <div class="exam-field">
              <label>Questions:</label>
              <input type="number" id="eq-${s}" value="${sec.q}" min="0" max="30" onchange="App.updateSection('${s}','q',this.value)">
            </div>
            <div class="exam-field">
              <label>Marks each:</label>
              <input type="number" id="em-${s}" value="${sec.m}" min="1" max="25" onchange="App.updateSection('${s}','m',this.value)">
            </div>
          </div>
          <button class="exam-toggle ${sec.on ? 'on' : ''}" id="etog-${s}" onclick="App.toggleSection('${s}')">${sec.on ? 'ON' : 'OFF'}</button>
        </div>
      `;
    }).join('');

    wrap.innerHTML = `
      <div class="panel-heading">// <span>03</span> EXAM PATTERN</div>
      <div class="panel-sub">Tell StudyOS your exam structure so it generates the right number and type of questions.</div>
      <div class="exam-grid">${secRows}</div>
      <div class="exam-marks-total" id="marks-total"></div>
      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" onclick="App.next()">NEXT: REVIEW & GENERATE →</button>
      </div>
    `;

    setTimeout(() => updateMarksTotal(), 0);
    return wrap;
  }

  function updateMarksTotal() {
    const el = document.getElementById('marks-total');
    if (!el) return;
    let total = 0, parts = [];
    ['a','b','c'].forEach(s => {
      const sec = state.sections[s];
      if (sec.on) {
        const sub = sec.q * sec.m;
        total += sub;
        parts.push(`Sec ${s.toUpperCase()}: ${sec.q}×${sec.m}=${sub}`);
      }
    });
    el.innerHTML = parts.length
      ? parts.join(' &nbsp;|&nbsp; ') + ` &nbsp;&nbsp; <strong>TOTAL: ${total} MARKS</strong>`
      : 'No sections enabled.';
  }

  // ── STEP 4: REVIEW ────────────────────────────────────────────────────────
  function renderReviewStep() {
    const styleName = STYLES.find(s => s.id === state.style)?.name || state.style;

    const secLines = ['a','b','c']
      .filter(s => state.sections[s].on)
      .map(s => {
        const sec = state.sections[s];
        return `<div>Section ${s.toUpperCase()}: ${sec.q} questions × ${sec.m} marks = ${sec.q * sec.m} marks</div>`;
      }).join('');

    const savedKey = state.apiKey ? '••••••••' + state.apiKey.slice(-6) : '';

    const wrap = el('div', 'step-panel');
    wrap.innerHTML = `
      <div class="panel-heading">// <span>04</span> REVIEW & GENERATE</div>
      <div class="panel-sub">Check your settings, add your Claude API key, then generate.</div>

      <div class="review-box">
        <div>📄 <strong>FILES:</strong> <span class="rv-val">${state.files.map(f => f.name).join(', ') || '—'}</span></div>
        <div>🎨 <strong>STYLE:</strong> <span class="rv-val">${styleName}</span></div>
        <div class="review-section">
          📋 <strong>EXAM PATTERN:</strong>
          ${secLines || '<span style="color:var(--text-muted)">No sections enabled</span>'}
        </div>
      </div>

      <div class="apikey-row">
        <label>API KEY</label>
        <input type="password" id="apikey-field" placeholder="sk-ant-api03-..." value="${state.apiKey}" oninput="App.setKey(this.value)">
        <span class="apikey-saved" id="apikey-saved" style="${state.apiKey ? '' : 'display:none'}">✓ SAVED</span>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-bottom:20px;line-height:1.9">
        Get a free key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a> · Stored in your browser only · Never sent anywhere except Anthropic.
      </div>

      <div class="err-msg" id="err-gen"></div>

      <div class="step-nav">
        <button class="btn-prev" onclick="App.prev()">◀ BACK</button>
        <button class="btn-next" onclick="App.generate()" id="btn-generate">⚡ GENERATE STUDY GUIDE + QUIZ</button>
      </div>
    `;
    return wrap;
  }

  // ── GENERATE ──────────────────────────────────────────────────────────────
  const LOG_LINES = [
    'Parsing PDF structure...',
    'Extracting text and content blocks...',
    'Identifying key concepts and topics...',
    'Analyzing exam pattern requirements...',
    'Building study guide outline...',
    'Writing study content in selected style...',
    'Generating exam-pattern quiz questions...',
    'Formatting output for StudyOS...',
    'Running final quality check...',
    'Almost there...',
  ];

  let logInterval, progressInterval, logIdx = 0, progressVal = 0;

  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.add('active');
    logIdx = 0; progressVal = 0;

    const titleEl = document.getElementById('loading-title');
    const subEl = document.getElementById('loading-sub');
    const logEl = document.getElementById('loading-log');
    const progEl = document.getElementById('loading-progress-fill');

    titleEl.textContent = 'PROCESSING...';
    subEl.textContent = `Processing ${state.files.length} PDF${state.files.length > 1 ? 's' : ''} with Claude AI...`;
    logEl.innerHTML = '';
    progEl.style.width = '0%';

    logInterval = setInterval(() => {
      if (logIdx < LOG_LINES.length) {
        const line = document.createElement('div');
        line.textContent = LOG_LINES[logIdx++];
        logEl.appendChild(line);
        if (logEl.children.length > 5) logEl.removeChild(logEl.children[0]);
      }
    }, 3500);

    progressInterval = setInterval(() => {
      progressVal = Math.min(progressVal + (Math.random() * 4), 92);
      progEl.style.width = progressVal + '%';
    }, 1200);
  }

  function hideLoading() {
    clearInterval(logInterval);
    clearInterval(progressInterval);
    document.getElementById('loading-progress-fill').style.width = '100%';
    setTimeout(() => {
      document.getElementById('loading-overlay').classList.remove('active');
    }, 500);
  }

  async function generate() {
    if (!state.apiKey) {
      showErr('err-gen', 'Please enter your Claude API key above.');
      return;
    }
    if (state.files.length === 0) {
      showErr('err-gen', 'No PDFs loaded. Go back to step 1.');
      return;
    }

    showLoading();

    const styleDefs = {
      detective: 'Format the study guide as a detective investigation. The student is a detective. Each concept is a "CLUE DISCOVERED". Use phrases like "THE CASE OF:", "EVIDENCE:", "DEDUCTION:", "CASE CLOSED:". Make it narrative and immersive.',
      flashcard: 'Format as numbered flashcards. Each card: ┌─ CARD [N] ─┐ | FRONT: [term/question] | BACK: [definition/answer] └──────────┘. Group cards by topic with ### headers.',
      visual:    'Use heavy ASCII art: tables with | borders, diagrams with ─ ═ ║ ╔ ╗ ╚ ╝ arrows →, ⇒, flowcharts, comparison tables. Minimize prose, maximize visual structure.',
      cornell:   'Use Cornell Notes format. Three zones:\nCUES (left, 30%): key terms and questions\nNOTES (right, 70%): detailed content\nSUMMARY (bottom): 3-5 sentence recap\nUse ASCII borders to separate zones. Optimized for handwritten transcription.',
      feynman:   'Explain everything as if teaching a curious 12-year-old. Use everyday analogies, metaphors, and real-world comparisons. No unexplained jargon. Short sentences. Start each section with a relatable hook.',
      mindmap:   'Generate ASCII mind maps. Format: CENTRAL TOPIC at center, major branches with ──►, sub-branches with  └──, leaf nodes with      •. Then provide brief notes (2-3 lines) per major branch.',
    };

    const activeSections = ['a','b','c'].filter(s => state.sections[s].on);
    const examSpec = activeSections.map(s => {
      const sec = state.sections[s];
      return `Section ${s.toUpperCase()}: ${sec.q} questions × ${sec.m} marks each (${sec.q * sec.m} marks total)`;
    }).join('\n');

    const totalQuestions = activeSections.reduce((sum, s) => sum + state.sections[s].q, 0);

    const prompt = `You are StudyOS, an AI study assistant. Analyze ALL uploaded PDF documents and produce a comprehensive study package.

══ PART 1: STUDY GUIDE ══

${styleDefs[state.style] || styleDefs.detective}

Requirements:
- Cover ALL major topics, concepts, theorems, formulas, definitions from every PDF
- Use ## for main sections, ### for subsections
- Be comprehensive — this is for exam preparation
- If multiple PDFs are uploaded, integrate the content cohesively

══ PART 2: EXAM QUIZ ══

Exam pattern:
${examSpec || '10 mixed questions, 2 marks each'}

Generate exactly ${totalQuestions || 10} questions matching this pattern.
Mix question types: conceptual, numerical, application, recall.

CRITICAL: At the very end of your response, output the quiz as a JSON block EXACTLY like this:

\`\`\`json
{
  "questions": [
    {
      "section": "A",
      "marks": 2,
      "q": "Question text?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "answer": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}
\`\`\`

answer is 0-indexed (0=A, 1=B, 2=C, 3=D). Output ONLY the study guide then the JSON block. No other text after the JSON.`;

    // Build multi-document message content
    const messageContent = [];
    state.files.forEach(f => {
      messageContent.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: f.base64 }
      });
    });
    messageContent.push({ type: 'text', text: prompt });

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': state.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-calls': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 8000,
          messages: [{ role: 'user', content: messageContent }],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error ${res.status}`);
      }

      const data = await res.json();
      const rawText = data.content?.find(b => b.type === 'text')?.text || '';

      // Parse quiz JSON
      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```\s*$/);
      let quiz = null;
      if (jsonMatch) {
        try { quiz = JSON.parse(jsonMatch[1]); } catch (e) { console.warn('Quiz parse error', e); }
      }
      const guideText = jsonMatch ? rawText.slice(0, rawText.lastIndexOf('```json')) : rawText;

      hideLoading();
      renderResults(guideText, quiz);

    } catch (err) {
      hideLoading();
      const errEl = document.getElementById('err-gen');
      if (errEl) {
        errEl.textContent = '❌ ' + err.message;
        errEl.classList.add('show');
      }
      console.error('StudyOS API error:', err);
    }
  }

  // ── RENDER RESULTS ─────────────────────────────────────────────────────────
  function renderResults(guideText, quiz) {
    goScreen('results');

    // Guide
    document.getElementById('guide-content').innerHTML = mdToHtml(guideText);

    // Quiz
    state.quizData = quiz?.questions || [];
    state.quizAnswered = {};
    state.quizScore = 0;
    document.getElementById('quiz-score-bar').style.display = 'none';

    const quizEl = document.getElementById('quiz-content');
    if (!state.quizData.length) {
      quizEl.innerHTML = `<p style="color:var(--text-dim);font-size:12px;padding:20px 0">No quiz questions could be parsed from the response. Check the study guide tab for the full content.</p>`;
    } else {
      quizEl.innerHTML = state.quizData.map((q, i) => `
        <div class="quiz-question" id="qq-${i}">
          <div class="quiz-meta">Q${i + 1} · SECTION ${q.section || '?'} · ${q.marks || '?'} MARKS</div>
          <div class="quiz-q-text">${escHtml(q.q)}</div>
          <div class="quiz-options">
            ${(q.options || []).map((opt, oi) => `
              <button class="quiz-opt" id="qopt-${i}-${oi}" onclick="App.answerQ(${i},${oi})">${escHtml(opt)}</button>
            `).join('')}
          </div>
          <div class="quiz-explanation" id="qexpl-${i}">${escHtml(q.explanation || '')}</div>
        </div>
      `).join('');
    }
  }

  // ── QUIZ INTERACTION ────────────────────────────────────────────────────────
  function answerQ(qi, chosen) {
    if (state.quizAnswered[qi] !== undefined) return;
    state.quizAnswered[qi] = chosen;

    const q = state.quizData[qi];
    const correct = q.answer;

    (q.options || []).forEach((_, oi) => {
      const btn = document.getElementById(`qopt-${qi}-${oi}`);
      if (!btn) return;
      btn.disabled = true;
      if (oi === correct) btn.classList.add('correct');
      else if (oi === chosen && chosen !== correct) btn.classList.add('wrong');
    });

    if (chosen === correct) state.quizScore++;
    const expl = document.getElementById(`qexpl-${qi}`);
    if (expl) expl.classList.add('show');

    // Show score when all answered
    if (Object.keys(state.quizAnswered).length === state.quizData.length) {
      const bar = document.getElementById('quiz-score-bar');
      const pct = Math.round((state.quizScore / state.quizData.length) * 100);
      bar.textContent = `FINAL SCORE: ${state.quizScore} / ${state.quizData.length} (${pct}%) ${pct >= 75 ? '🎉' : pct >= 50 ? '📚' : '💪'}`;
      bar.style.display = 'block';
      bar.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ── TAB SWITCHING ──────────────────────────────────────────────────────────
  window.switchTab = function (tab) {
    ['guide', 'quiz'].forEach(t => {
      document.getElementById(`rtab-${t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`rpane-${t}`)?.classList.toggle('active', t === tab);
    });
  };

  // ── NEW SESSION ────────────────────────────────────────────────────────────
  window.newSession = function () {
    state.files = [];
    state.style = 'detective';
    state.sections = {
      a: { on: true, q: 5, m: 2  },
      b: { on: true, q: 5, m: 4  },
      c: { on: true, q: 3, m: 10 },
    };
    state.quizData = [];
    state.quizAnswered = {};
    state.quizScore = 0;
    goScreen('upload');
  };

  // ── MARKDOWN RENDERER ──────────────────────────────────────────────────────
  function mdToHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      // Re-allow certain safe tags we'll reintroduce
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$3</h3>'.replace('$3','$1'))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^```[\s\S]*?```$/gm, m => `<pre>${m.replace(/```[a-z]*/g,'').replace(/```/g,'').trim()}</pre>`)
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^---$/gm, '<hr>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>(\n|$))+/g, m => `<ul>${m}</ul>`)
      .replace(/^\|(.+)\|$/gm, row => {
        const cells = row.split('|').slice(1,-1);
        return '<tr>' + cells.map(c => c.trim().match(/^[-:]+$/) ? '' : `<td>${c.trim()}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>.*<\/tr>(\n|$))+/g, m => `<table>${m}</table>`)
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(?!<[hputbcr]|<\/)/gm, '<p>') + '</p>';
  }

  // ── HELPERS ────────────────────────────────────────────────────────────────
  function el(tag, className) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    return e;
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof msg === 'string') el.textContent = msg;
    el.classList.add('show');
  }

  function hideErr(id) {
    document.getElementById(id)?.classList.remove('show');
  }

  // ── PUBLIC API ────────────────────────────────────────────────────────────
  window.App = {
    next() {
      if (state.step === 1 && state.files.length === 0) {
        showErr('err-upload', 'Please upload at least one PDF to continue.');
        return;
      }
      nextStep();
    },
    prev() { prevStep(); },
    removeFile(i) {
      state.files.splice(i, 1);
      renderFileList();
    },
    selectStyle(id) {
      state.style = id;
      document.querySelectorAll('.style-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.id === id);
      });
    },
    toggleSection(s) {
      state.sections[s].on = !state.sections[s].on;
      const tog = document.getElementById(`etog-${s}`);
      const row = document.getElementById(`exam-sec-${s}`);
      if (tog) { tog.textContent = state.sections[s].on ? 'ON' : 'OFF'; tog.classList.toggle('on', state.sections[s].on); }
      if (row) row.classList.toggle('disabled', !state.sections[s].on);
      updateMarksTotal();
    },
    updateSection(s, field, val) {
      state.sections[s][field] = parseInt(val) || 0;
      updateMarksTotal();
    },
    setKey(val) {
      state.apiKey = val.trim();
      localStorage.setItem('studyos_apikey', state.apiKey);
      const saved = document.getElementById('apikey-saved');
      if (saved) saved.style.display = state.apiKey ? '' : 'none';
    },
    generate,
    answerQ,
  };

  // ── BOOT ───────────────────────────────────────────────────────────────────
  renderStep();

})();
