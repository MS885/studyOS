# StudyOS 🌙

AI-powered study guide generator with a cyberpunk pixel city aesthetic.

Built with vanilla HTML/CSS/JS + Claude API.

---

## 🚀 Deploy to GitHub Pages (step-by-step)

### Step 1 — Create a GitHub account
If you don't have one: go to [github.com](https://github.com) → Sign Up (free).

### Step 2 — Create a new repository
1. Click the **+** button (top right) → **New repository**
2. Name it: `studyos` (or anything you like)
3. Set it to **Public**
4. Do NOT initialize with README (we'll upload our files)
5. Click **Create repository**

### Step 3 — Upload the files
On your new (empty) repo page:
1. Click **uploading an existing file**
2. Drag and drop ALL files maintaining the folder structure:
   ```
   index.html
   css/style.css
   js/city.js
   js/app.js
   README.md
   ```
3. Scroll down → click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Scroll to **Pages** in the left sidebar
3. Under **Source** → select **Deploy from a branch**
4. Branch: `main` · Folder: `/ (root)`
5. Click **Save**

### Step 5 — Get your live URL
After 1-2 minutes your site will be live at:
```
https://YOUR-USERNAME.github.io/studyos/
```

That's it! Share that URL with your whole class.

---

## 🔑 API Key Setup

StudyOS uses the Claude API (Anthropic). You need a free API key:

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-api03-...`)
5. Paste it into StudyOS on Step 4 (Review & Generate)

The key is saved **only in your browser's localStorage** — it never leaves your device except when making API calls directly to Anthropic's servers.

---

## 📄 PDF Guidelines

| Setting | Limit |
|---------|-------|
| Max files per session | 5 PDFs |
| Max file size | 25MB per PDF |
| Recommended | ~50 slides / pages per PDF |

For best results: use text-based PDFs (not scanned images).

---

## ✨ Features

- **6 learning styles**: Detective, Flashcard, Visual-heavy, Cornell Notes, Feynman, Mind Map
- **Multi-PDF support**: Upload up to 5 PDFs processed together
- **Exam-pattern quiz**: Section A/B/C with custom question count and marks
- **Interactive quiz**: Click to answer, auto-scored, explanations shown
- **8 cyberpunk scenes**: Changeable pixel art backgrounds
- **Zero backend**: Pure frontend + Claude API calls

---

## 🛠 Tech Stack

- Pure HTML5 / CSS3 / Vanilla JavaScript
- Canvas API for pixel art backgrounds
- Anthropic Claude API (`claude-opus-4-5`)
- No frameworks, no build tools, no dependencies
