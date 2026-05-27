// Word Craft — Main Application Logic

// --- App State ---
const state = {
  // Mode States
  craftType: 'auto', // 'auto' or 'manual'
  
  // Auto Mode States
  editorMode: 'humanize', // 'humanize', 'grammar', 'paraphrase'
  editorTone: 'professional',
  humanizeStrength: 2, // 1 (Standard), 2 (Balanced), 3 (Deep Human)
  showDiff: false,
  autoHistory: [], // AI craft history stack
  autoHistoryIndex: -1, // AI craft history pointer
  
  // Manual Mode States
  manualTokens: [], // Parsed tokens: { text, pre, post, tags, posGroup }
  selectedWordIndex: null,
  highlightPOS: true,
  manualHistory: [], // Text history stack
  manualHistoryIndex: -1, // History pointer
  
  // Settings
  apiKey: '',
  geminiModel: 'gemini-2.5-flash',
  apiProvider: 'gemini',
  geminiApiKey: '',
  openRouterApiKey: '',
  
  // Security Password Lock Settings
  settingsPassword: '',
  isPasswordLockEnabled: false,
  
  // Reviews
  reviewsList: [],
  selectedReviewRating: 5,
  
  // Mobile Responsive States
  mobileActivePane: 'input',
  isMobileSidebarOpen: false
};

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  // Load data from LocalStorage
  loadSettingsFromStorage();
  
  // Setup editor file drop zone
  setupEditorDropZone();

  // Highlight default options
  updateOptionUI();

  // Initialize mobile responsive active pane
  initMobileViews();
  
  // Keyboard Shortcut: Ctrl/Cmd + Enter to craft/analyze text
  const editorInput = document.getElementById('editor-input');
  if (editorInput) {
    editorInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerMainAction();
      }
    });
  }
  
  // Global click listener to close floating synonym popup when clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('synonym-popup');
    const clickedWord = e.target.classList.contains('word-span');
    const clickedPopup = e.target.closest('#synonym-popup');
    
    if (!clickedWord && !clickedPopup) {
      popup.classList.remove('active');
    }
  });
});

// --- LocalStorage Settings ---
function loadSettingsFromStorage() {
  state.apiProvider = localStorage.getItem('wc_api_provider') || 'gemini';
  const providerEl = document.getElementById('settings-provider');
  if (providerEl) providerEl.value = state.apiProvider;
  
  state.geminiApiKey = localStorage.getItem('wc_api_key') || '';
  state.openRouterApiKey = localStorage.getItem('wc_openrouter_key') || '';
  state.geminiModel = localStorage.getItem('wc_gemini_model') || 'gemini-2.5-flash';
  
  state.apiKey = state.apiProvider === 'gemini' ? state.geminiApiKey : state.openRouterApiKey;
  document.getElementById('settings-api-key').value = state.apiKey;
  
  updateModelOptions();
  
  document.getElementById('settings-model').value = state.geminiModel;

  state.settingsPassword = localStorage.getItem('wc_settings_password') || '';
  state.isPasswordLockEnabled = localStorage.getItem('wc_settings_locked') === 'true';
  
  document.getElementById('settings-lock-toggle').checked = state.isPasswordLockEnabled;
  document.getElementById('settings-passcode').value = state.settingsPassword;
  toggleLockSetupDisplay();

  loadReviews();

  const muted = localStorage.getItem('wc_muted') === 'true';
  if (muted) {
    audio.muted = true;
    document.getElementById('svg-unmuted').style.display = 'none';
    document.getElementById('svg-muted').style.display = 'block';
  }
}

// --- Navigation / Theme / Audio Switchers ---
function toggleMute() {
  const muted = audio.toggleMute();
  localStorage.setItem('wc_muted', muted);
  
  if (muted) {
    document.getElementById('svg-unmuted').style.display = 'none';
    document.getElementById('svg-muted').style.display = 'block';
  } else {
    document.getElementById('svg-unmuted').style.display = 'block';
    document.getElementById('svg-muted').style.display = 'none';
  }
}

function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('theme-dark')) {
    body.classList.remove('theme-dark');
    body.classList.add('theme-light');
  } else {
    body.classList.remove('theme-light');
    body.classList.add('theme-dark');
  }
  audio.playClick();
}

// --- Settings Dialog ---
function openSettings() {
  if (state.isPasswordLockEnabled && state.settingsPassword) {
    document.getElementById('unlock-passcode-input').value = '';
    document.getElementById('unlock-error-msg').style.display = 'none';
    document.getElementById('modal-passcode-unlock').classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('unlock-passcode-input');
      if (input) input.focus();
    }, 300);
  } else {
    document.getElementById('modal-settings').classList.add('active');
  }
  audio.playClick();
}

function closeSettings() {
  document.getElementById('modal-settings').classList.remove('active');
  audio.playClick();
}

function saveSettings() {
  const provider = document.getElementById('settings-provider').value;
  const key = document.getElementById('settings-api-key').value.trim();
  const model = document.getElementById('settings-model').value;
  const lockToggle = document.getElementById('settings-lock-toggle').checked;
  const passcode = document.getElementById('settings-passcode').value.trim();
  
  if (lockToggle && !passcode) {
    alert("Please enter a passcode to enable the settings lock!");
    return;
  }
  
  state.apiProvider = provider;
  if (provider === 'gemini') {
    state.geminiApiKey = key;
    localStorage.setItem('wc_api_key', key);
  } else {
    state.openRouterApiKey = key;
    localStorage.setItem('wc_openrouter_key', key);
  }
  state.apiKey = key;
  state.geminiModel = model;
  state.isPasswordLockEnabled = lockToggle;
  state.settingsPassword = passcode;
  
  localStorage.setItem('wc_api_provider', provider);
  localStorage.setItem('wc_gemini_model', model);
  localStorage.setItem('wc_settings_locked', lockToggle);
  localStorage.setItem('wc_settings_password', passcode);
  
  closeSettings();
}

function toggleApiProvider() {
  const provider = document.getElementById('settings-provider').value;
  const keyInput = document.getElementById('settings-api-key');
  
  if (provider === 'gemini') {
    keyInput.value = state.geminiApiKey || '';
  } else {
    keyInput.value = state.openRouterApiKey || '';
  }
  
  updateModelOptions();
}

function updateModelOptions() {
  const provider = document.getElementById('settings-provider').value;
  const modelSelect = document.getElementById('settings-model');
  const lblApiKey = document.getElementById('lbl-api-key');
  const keyInput = document.getElementById('settings-api-key');
  const apiGuide = document.querySelector('.api-guide');
  
  if (!modelSelect) return;
  modelSelect.innerHTML = '';
  
  if (provider === 'gemini') {
    if (lblApiKey) lblApiKey.textContent = "Gemini API Key";
    if (keyInput) keyInput.placeholder = "AIzaSy...";
    if (apiGuide) {
      apiGuide.innerHTML = `
        <strong>Need a key?</strong>
        <p>Get a free Gemini API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener">Google AI Studio</a>.</p>
      `;
    }
    
    const options = [
      { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash (Recommended: Fast & Efficient)' },
      { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro (Extremely Detailed, Higher Latency)' }
    ];
    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.text;
      if (state.geminiModel === opt.value) el.selected = true;
      modelSelect.appendChild(el);
    });
  } else {
    if (lblApiKey) lblApiKey.textContent = "OpenRouter API Key";
    if (keyInput) keyInput.placeholder = "sk-or-v1-...";
    if (apiGuide) {
      apiGuide.innerHTML = `
        <strong>Need an OpenRouter key?</strong>
        <p>Get an API key from the <a href="https://openrouter.ai/" target="_blank" rel="noopener">OpenRouter Console</a>.</p>
      `;
    }
    
    const options = [
      { value: 'google/gemini-2.5-flash', text: 'Gemini 2.5 Flash (via OpenRouter)' },
      { value: 'google/gemini-2.5-pro', text: 'Gemini 2.5 Pro (via OpenRouter)' },
      { value: 'deepseek/deepseek-chat', text: 'DeepSeek V3 (Fast, Cheap & Powerful)' },
      { value: 'meta-llama/llama-3.3-70b-instruct', text: 'Llama 3.3 70B Instruct (Excellent Paraphraser)' }
    ];
    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.text;
      if (state.geminiModel === opt.value) el.selected = true;
      modelSelect.appendChild(el);
    });
  }
}

function toggleLockSetupDisplay() {
  const isChecked = document.getElementById('settings-lock-toggle').checked;
  document.getElementById('settings-lock-setup-fields').style.display = isChecked ? 'block' : 'none';
}

function verifyUnlockPasscode() {
  const entered = document.getElementById('unlock-passcode-input').value;
  if (entered === state.settingsPassword) {
    document.getElementById('modal-passcode-unlock').classList.remove('active');
    document.getElementById('modal-settings').classList.add('active');
    audio.playDiscover();
  } else {
    document.getElementById('unlock-error-msg').style.display = 'block';
    audio.playError();
    document.getElementById('unlock-passcode-input').value = '';
    document.getElementById('unlock-passcode-input').focus();
  }
}

function cancelUnlock() {
  document.getElementById('modal-passcode-unlock').classList.remove('active');
  audio.playClick();
}

function checkUnlockKey(event) {
  if (event.key === 'Enter') {
    verifyUnlockPasscode();
  }
}
function initMobileViews() {
  switchMobileEditorPane(state.mobileActivePane);
}

function toggleMobileSidebar(isOpen) {
  const panel = document.querySelector('.editor-options-panel');
  const backdrop = document.getElementById('sidebar-backdrop');
  
  if (isOpen === undefined) {
    state.isMobileSidebarOpen = !state.isMobileSidebarOpen;
  } else {
    state.isMobileSidebarOpen = isOpen;
  }
  
  if (state.isMobileSidebarOpen) {
    panel.classList.add('active');
    backdrop.classList.add('active');
  } else {
    panel.classList.remove('active');
    backdrop.classList.remove('active');
  }
  audio.playClick();
}

function switchMobileEditorPane(pane) {
  state.mobileActivePane = pane;
  
  // Select panes inside the twin container
  const panes = document.querySelectorAll('.twin-editors-container > .editor-pane');
  const originalPane = panes[0];
  const resultPane = panes[1];
  
  const tabInput = document.getElementById('m-tab-input');
  const tabOutput = document.getElementById('m-tab-output');
  
  if (pane === 'input') {
    if (originalPane) originalPane.classList.add('active-pane');
    if (resultPane) resultPane.classList.remove('active-pane');
    if (tabInput) tabInput.classList.add('active');
    if (tabOutput) tabOutput.classList.remove('active');
  } else {
    if (originalPane) originalPane.classList.remove('active-pane');
    if (resultPane) resultPane.classList.add('active-pane');
    if (tabInput) tabInput.classList.remove('active');
    if (tabOutput) tabOutput.classList.add('active');
  }
}

// --- Switch between AI Auto-Craft, Manual Word Craft, and Reviews ---
function switchCraftType(type) {
  state.craftType = type;
  
  // Slide options panel closed on mobile
  const panel = document.querySelector('.editor-options-panel');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (panel && backdrop) {
    panel.classList.remove('active');
    backdrop.classList.remove('active');
    state.isMobileSidebarOpen = false;
  }
  
  // Sidebar Tabs highlight
  document.querySelectorAll('.craft-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  // Toggle sections
  const autoPanel = document.getElementById('panel-auto-controls');
  const manualPanel = document.getElementById('panel-manual-controls');
  const reviewsPanel = document.getElementById('panel-reviews-controls');
  
  const autoActions = document.getElementById('pane-actions-auto');
  const manualActions = document.getElementById('pane-actions-manual');
  
  const autoOutput = document.getElementById('editor-output');
  const diffOutput = document.getElementById('editor-output-diff');
  const manualOutput = document.getElementById('editor-output-manual');
  
  const headerTitle = document.getElementById('app-title-label');
  const craftBtnText = document.getElementById('craft-btn-text');
  
  // Close popup if open
  document.getElementById('synonym-popup').classList.remove('active');
  
  if (type === 'auto') {
    document.getElementById('btn-tab-auto').classList.add('active');
    
    autoPanel.classList.add('active');
    manualPanel.classList.remove('active');
    reviewsPanel.classList.remove('active');
    
    autoActions.style.display = 'flex';
    manualActions.style.display = 'none';
    
    // Restore diff state display if active
    if (state.showDiff) {
      autoOutput.style.display = 'none';
      diffOutput.style.display = 'block';
    } else {
      autoOutput.style.display = 'block';
      diffOutput.style.display = 'none';
    }
    manualOutput.style.display = 'none';
    
    headerTitle.textContent = "AI Paraphraser & Humanizer";
    craftBtnText.textContent = "CRAFT TEXT";
    
  } else if (type === 'manual') {
    document.getElementById('btn-tab-manual').classList.add('active');
    
    autoPanel.classList.remove('active');
    manualPanel.classList.add('active');
    reviewsPanel.classList.remove('active');
    
    autoActions.style.display = 'none';
    manualActions.style.display = 'flex';
    
    autoOutput.style.display = 'none';
    diffOutput.style.display = 'none';
    manualOutput.style.display = 'block';
    
    headerTitle.textContent = "Manual Word Craftsman";
    craftBtnText.textContent = "ANALYZE TEXT";
  } else {
    // Reviews Tab
    document.getElementById('btn-tab-reviews').classList.add('active');
    
    autoPanel.classList.remove('active');
    manualPanel.classList.remove('active');
    reviewsPanel.classList.add('active');
    
    autoActions.style.display = 'none';
    manualActions.style.display = 'none';
    
    autoOutput.style.display = 'block';
    diffOutput.style.display = 'none';
    manualOutput.style.display = 'none';
    
    headerTitle.textContent = "Word Craft Reviews";
    craftBtnText.textContent = "WRITE REVIEW";
  }
  
  audio.playClick();
  updateInputStats();
}

function triggerMainAction() {
  if (state.craftType === 'auto') {
    craftText();
  } else if (state.craftType === 'manual') {
    analyzeManualText();
  } else {
    openReviewModal();
  }
}

// --- TEXT CRAFTSMAN AI MODES ---

function setEditorMode(mode, playSound = true) {
  state.editorMode = mode;
  document.querySelectorAll('.mode-select-btn').forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'humanize') {
    document.getElementById('btn-opt-humanize').classList.add('active');
    document.getElementById('section-humanize-strength').style.display = 'flex';
  } else if (mode === 'grammar') {
    document.getElementById('btn-opt-grammar').classList.add('active');
    document.getElementById('section-humanize-strength').style.display = 'none';
  } else {
    document.getElementById('btn-opt-paraphrase').classList.add('active');
    document.getElementById('section-humanize-strength').style.display = 'none';
  }
  if (playSound) {
    audio.playClick();
  }
}

function updateOptionUI() {
  setEditorMode(state.editorMode, false);
}

function updateInputStats() {
  const text = document.getElementById('editor-input').value;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const charCount = text.length;
  
  document.getElementById('input-word-count').textContent = `${wordCount} words`;
  document.getElementById('input-char-count').textContent = `${charCount} characters`;
  
  // Real-time language detection warning
  checkLanguageWarning(text);
  
  if (state.craftType === 'auto') {
    const outputText = document.getElementById('editor-output').value;
    const outWordCount = outputText.trim() === '' ? 0 : outputText.trim().split(/\s+/).length;
    document.getElementById('output-word-count').textContent = `${outWordCount} words`;
  } else {
    // Count manual words
    const mWords = state.manualTokens.filter(t => t.posGroup !== 'other').length;
    document.getElementById('output-word-count').textContent = `${mWords} words`;
  }
}

function clearEditorInput() {
  document.getElementById('editor-input').value = '';
  updateInputStats();
  if (state.craftType === 'manual') {
    state.manualTokens = [];
    state.selectedWordIndex = null;
    document.getElementById('editor-output-manual').innerHTML = `
      <div class="placeholder-word-text centered">
        Enter text on the left and click "ANALYZE TEXT" to identify parts of speech and swap synonyms word-by-word.
      </div>
    `;
    // Hide active details card
    document.querySelector('#active-word-card .placeholder-word-text').style.display = 'block';
    document.querySelector('#active-word-card .active-word-details').style.display = 'none';
  }
  audio.playClick();
}

function copyCraftedText() {
  const text = document.getElementById('editor-output').value;
  if (!text) return;
  navigator.clipboard.writeText(text);
  audio.playClick();
  
  const copyBtn = document.querySelector('.pane-header button[onclick="copyCraftedText()"]');
  const oldText = copyBtn.textContent;
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = oldText, 1500);
}

function exportCraftedText() {
  const text = document.getElementById('editor-output').value;
  if (!text) return;
  
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `crafted_text_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  audio.playClick();
}

// Drag and drop file reader setup
function setupEditorDropZone() {
  const editorBody = document.querySelector('.editor-pane:first-child');
  
  editorBody.addEventListener('dragenter', (e) => {
    e.preventDefault();
    editorBody.classList.add('dragover');
  });
  
  editorBody.addEventListener('dragover', (e) => {
    e.preventDefault();
    editorBody.classList.add('dragover');
  });
  
  editorBody.addEventListener('dragleave', (e) => {
    e.preventDefault();
    editorBody.classList.remove('dragover');
  });
  
  editorBody.addEventListener('drop', async (e) => {
    e.preventDefault();
    editorBody.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await parseAndLoadFile(files[0]);
    }
  });
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    await parseAndLoadFile(file);
  }
}

async function parseAndLoadFile(file) {
  audio.playClick();
  const inputArea = document.getElementById('editor-input');
  
  // 1. File Size Warning (> 1.5MB)
  if (file.size > 1.5 * 1024 * 1024) {
    const proceed = confirm("This file is very large. Loading it may temporarily freeze the interface. Continue?");
    if (!proceed) {
      return;
    }
  }

  // 2. CSV Rejection
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    alert("CSV file format is not supported. Please import a Word (.docx), PDF (.pdf), or Text (.txt) file.");
    audio.playError();
    return;
  }

  if (ext !== 'docx' && ext !== 'txt' && ext !== 'pdf') {
    alert("Unsupported file type! Please upload a Microsoft Word .docx, PDF .pdf, or plain text .txt file.");
    audio.playError();
    return;
  }

  try {
    inputArea.placeholder = "Reading file...";
    let text = '';
    
    if (ext === 'docx') {
      text = await docxReader.read(file);
    } else if (ext === 'txt') {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    } else if (ext === 'pdf') {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            if (window.pdfjsLib) {
              pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            } else {
              throw new Error("PDF.js library is not loaded.");
            }
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
      });
    }
    
    inputArea.value = text;
    updateInputStats();
  } catch (error) {
    alert("Error reading file: " + error.message);
  } finally {
    inputArea.placeholder = "Paste your text, Google Doc paragraphs, or drag and drop a Microsoft Word (.docx), PDF (.pdf), or Text (.txt) file here to start crafting...";
  }
}

// Diff Engine
function toggleDiffView() {
  state.showDiff = !state.showDiff;
  const btn = document.getElementById('btn-toggle-diff');
  const txtArea = document.getElementById('editor-output');
  const diffBox = document.getElementById('editor-output-diff');
  
  if (state.showDiff) {
    btn.textContent = "Show Plain Text";
    txtArea.style.display = 'none';
    diffBox.style.display = 'block';
    
    const original = document.getElementById('editor-input').value;
    const crafted = txtArea.value;
    const diffHTML = computeDiffHTML(original, crafted);
    diffBox.innerHTML = diffHTML;
  } else {
    btn.textContent = "Show Changes";
    txtArea.style.display = 'block';
    diffBox.style.display = 'none';
  }
  audio.playClick();
}

function computeDiffHTML(oldText, newText) {
  if (!oldText.trim()) return newText;
  
  const diffs = getLcsDiff(oldText, newText);
  return diffs.map(chunk => {
    if (chunk.type === 'equal') {
      return escapeHTML(chunk.text).replace(/\n/g, '<br>');
    } else if (chunk.type === 'ins') {
      return `<span class="diff-ins">${escapeHTML(chunk.text).replace(/\n/g, '<br>')}</span>`;
    } else {
      return `<span class="diff-del">${escapeHTML(chunk.text).replace(/\n/g, '<br>')}</span>`;
    }
  }).join('');
}

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getLcsDiff(oldStr, newStr) {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
  const dp = Array(oldWords.length + 1).fill(0).map(() => Array(newWords.length + 1).fill(0));
  
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i-1] === newWords[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  let i = oldWords.length;
  let j = newWords.length;
  const result = [];
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i-1] === newWords[j-1]) {
      result.unshift({ type: 'equal', text: oldWords[i-1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'ins', text: newWords[j-1] });
      j--;
    } else {
      result.unshift({ type: 'del', text: oldWords[i-1] });
      i--;
    }
  }
  return result;
}

// --- Gemini API Paraphraser Integration ---
async function craftText() {
  const input = document.getElementById('editor-input').value.trim();
  if (!input) {
    alert("Please enter or paste text to craft first!");
    audio.playError();
    return;
  }
  
  const words = input.split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    alert("Please enter at least 3 words to craft!");
    audio.playError();
    return;
  }
  
  if (!state.apiKey) {
    alert("Gemini API Key is missing! Please click the Settings gear icon in the top right to configure your API key.");
    openSettings();
    return;
  }

  const craftBtn = document.getElementById('btn-craft-master');
  const craftBtnText = document.getElementById('craft-btn-text');
  const outputArea = document.getElementById('editor-output');
  const savingIndicator = document.getElementById('output-saving-indicator');
  
  const toneSelect = document.getElementById('editor-tone-select');
  state.editorTone = toneSelect.value;
  
  const strengthSlider = document.getElementById('humanize-strength');
  state.humanizeStrength = parseInt(strengthSlider.value);
  
  const preserveFormat = document.getElementById('chk-preserve-format').checked;
  const registerLock = document.getElementById('chk-register-lock').checked;
  
  craftBtn.disabled = true;
  craftBtnText.textContent = "CRAFTING...";
  
  outputArea.value = "Translating and refining text through alchemical AI algorithms...";
  
  try {
    let systemInstruction = "";
    let promptText = "";
    
    const toneText = state.editorTone.toUpperCase();
    
    let extraDirectives = "";
    if (preserveFormat) {
      extraDirectives += "\n- PRESERVE FORMATTING: You MUST maintain the exact layout, indentation, list structure (bulleted lists using '-', '•', numbered lists using '1.', etc.), and line breaks of the original text. Do not merge bullet points or numbered steps into standard paragraphs.";
    } else {
      extraDirectives += "\n- FORMATTING: You may reflow text and paragraphs to improve readability.";
    }
    
    if (registerLock) {
      extraDirectives += "\n- REGISTER LOCK: You MUST lock the dialect, register, and personal style of the input text. Do not correct colloquial words, informal phrasing, or slang (e.g. 'y'all', 'gonna', 'wanna', 'dunno'). Retain these expressions exactly as they are in the output to preserve the original voice.";
    }
    
    if (state.editorMode === 'humanize') {
      const strength = state.humanizeStrength;
      let humanizeDirectives = "";
      if (strength === 1) {
        humanizeDirectives = "Vary phrasing slightly and replace robotic AI words.";
      } else if (strength === 2) {
        humanizeDirectives = "Extensively break sentence patterns, insert organic sentence transitions, randomize vocabulary styles, and alternate sentence lengths (short and long). Ensure a diverse flow.";
      } else {
        humanizeDirectives = "Write as an advanced human author who makes slight stylistic idiosyncrasies. Use rich, varied structures, high burstiness (very short sentences mixed with compound sentences), high perplexity (uncommon synonyms), and completely strip all AI clichés like 'delve', 'testament', 'furthermore', 'moreover', 'tapestry', 'beacon', 'intricate', 'notably', 'pinnacle', 'in conclusion', 'crucial role'.";
      }
      
      systemInstruction = `
        You are Word Craft, an expert human writer and linguistic specialist.
        Your task is to rewrite the user's text to make it read completely human, bypassing Turnitin, GPTZero, and other AI content detectors.
        Follow these strict guidelines:
        1. Maintain the exact original meaning and factual content. Do not add external facts or ignore details.
        2. Adjust the tone to: ${toneText}.
        3. Humanize directives: ${humanizeDirectives}
        4. ABSOLUTELY AVOID THESE CLICHÉ WORDS: delve, testament, furthermore, moreover, tapestry, beacon, intricate, notably, pinnacle, in conclusion, it is important to note, crucial role.
        5. Preserve and carry over all emoji characters present in the original text. Do not strip them.
        6. Output ONLY the rewritten text, with no introduction, explanation, or markdown wrappers unless necessary for document layout.
        ${extraDirectives}
      `;
      promptText = `Humanize this text while ensuring the tone is ${state.editorTone}:\n\n${input}`;
      
    } else if (state.editorMode === 'grammar') {
      systemInstruction = `
        You are Word Craft, a meticulous editor.
        Fix all grammatical, spelling, punctuation, and typographical errors in the text.
        Enhance readability and vocabulary where appropriate to match a ${toneText} tone, but preserve the author's original voice, style, and sentence configurations as much as possible.
        Preserve and carry over all emoji characters present in the original text. Do not strip them.
        Output ONLY the corrected text, with no introduction or explanation.
        ${extraDirectives}
      `;
      promptText = `Fix grammar in this text:\n\n${input}`;
      
    } else {
      systemInstruction = `
        You are Word Craft, a master paraphraser.
        Completely restate and rewrite the user's text. Shift the sentence structures, use creative synonyms, and alter the sentence ordering if it improves flow.
        Maintain a ${toneText} tone. Ensure the core argument and original details are preserved.
        Preserve and carry over all emoji characters present in the original text. Do not strip them.
        Output ONLY the paraphrased text, with no introduction or explanation.
        ${extraDirectives}
      `;
      promptText = `Paraphrase this text:\n\n${input}`;
    }

    let cleanText = "";
    
    if (state.apiProvider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.geminiModel}:generateContent?key=${state.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemInstruction}\n\nUser Input:\n${promptText}` }]
          }]
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "HTTP error " + response.status);
      }
      
      const resData = await response.json();
      const resultText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      cleanText = resultText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
    } else {
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
          model: state.geminiModel,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: promptText }
          ]
        })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "OpenRouter error " + response.status);
      }
      
      const resData = await response.json();
      const resultText = resData.choices?.[0]?.message?.content || '';
      
      cleanText = resultText.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');
      }
    }

    outputArea.value = cleanText;
    
    // Push successful craft to history
    pushAutoHistory(cleanText);
    
    const outWordCount = cleanText.split(/\s+/).length;
    document.getElementById('output-word-count').textContent = `${outWordCount} words`;
    
    runBypassAnalysis(cleanText);
    
    audio.playDiscover();
    
    savingIndicator.classList.add('show');
    setTimeout(() => savingIndicator.classList.remove('show'), 2000);
    
    if (state.showDiff) {
      document.getElementById('editor-output-diff').innerHTML = computeDiffHTML(input, cleanText);
    }

    // Auto-switch to output view on mobile!
    if (window.innerWidth <= 768) {
      switchMobileEditorPane('output');
    }

  } catch (error) {
    audio.playError();
    outputArea.value = `[Crafting Failed] Error: ${error.message}\n\nPlease check your API key, connection, or model configurations in Settings.`;
  } finally {
    craftBtn.disabled = false;
    craftBtnText.textContent = "CRAFT TEXT";
  }
}

// Real-time Turnitin-bypass simulation analyzer
function runBypassAnalysis(text) {
  if (!text) return;
  
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  if (totalWords < 5) return;
  
  const uniqueWords = new Set(words).size;
  const perplexityPct = Math.min(100, Math.floor((uniqueWords / totalWords) * 130));
  
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  let burstinessPct = 0;
  
  if (sentences.length > 1) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    burstinessPct = Math.min(100, Math.floor((variance / 40) * 100));
  } else {
    burstinessPct = 20;
  }

  const aiCliches = ['delve', 'testament', 'furthermore', 'moreover', 'tapestry', 'beacon', 'intricate', 'notably', 'pinnacle', 'in conclusion', 'crucial role'];
  let clicheCount = 0;
  words.forEach(w => {
    if (aiCliches.includes(w)) clicheCount++;
  });
  
  const penalty = clicheCount * 12;

  let overallScore = Math.floor((perplexityPct * 0.4) + (burstinessPct * 0.6)) - penalty;
  overallScore = Math.max(5, Math.min(99, overallScore));
  
  updateDial('dial-perplexity', perplexityPct);
  updateDial('dial-burstiness', burstinessPct);
  
  const banner = document.getElementById('ai-score-banner');
  const pctDom = document.getElementById('human-score-pct');
  const statusDom = document.getElementById('human-score-status');
  const descDom = document.getElementById('human-score-desc');
  
  pctDom.textContent = `${overallScore}%`;
  
  banner.className = 'ai-score-banner';
  if (overallScore >= 80) {
    banner.classList.add('green');
    statusDom.textContent = "High Human Probability";
    descDom.textContent = "Highly likely to bypass Turnitin, GPTZero, and other AI classifiers.";
  } else if (overallScore >= 50) {
    banner.classList.add('amber');
    statusDom.textContent = "Moderate AI Risk";
    descDom.textContent = "Medium likelihood of triggering AI detectors. Try raising Humanize Strength.";
  } else {
    banner.classList.add('red');
    statusDom.textContent = "High AI Risk Detected";
    descDom.textContent = "Looks highly automated. Contains uniform structures or AI words. Try re-crafting.";
  }
}

function updateDial(id, value) {
  const dial = document.getElementById(id);
  dial.textContent = `${value}%`;
  
  dial.className = 'dial-circle';
  if (value >= 70) {
    dial.classList.add('high-pass');
  } else if (value >= 40) {
    dial.classList.add('mid-pass');
  } else {
    dial.classList.add('fail-pass');
  }
}

// --- Manual Craft History (Undo/Redo) ---
function pushManualHistory(text) {
  if (state.manualHistoryIndex < state.manualHistory.length - 1) {
    state.manualHistory = state.manualHistory.slice(0, state.manualHistoryIndex + 1);
  }
  
  if (state.manualHistory.length > 0 && state.manualHistory[state.manualHistory.length - 1] === text) {
    return;
  }
  
  state.manualHistory.push(text);
  
  if (state.manualHistory.length > 50) {
    state.manualHistory.shift();
  }
  
  state.manualHistoryIndex = state.manualHistory.length - 1;
  updateUndoRedoButtons();
}

function triggerManualUndo() {
  if (state.manualHistoryIndex > 0) {
    state.manualHistoryIndex--;
    const text = state.manualHistory[state.manualHistoryIndex];
    document.getElementById('editor-input').value = text;
    restoreStateFromText(text);
    updateUndoRedoButtons();
    audio.playClick();
  }
}

function triggerManualRedo() {
  if (state.manualHistoryIndex < state.manualHistory.length - 1) {
    state.manualHistoryIndex++;
    const text = state.manualHistory[state.manualHistoryIndex];
    document.getElementById('editor-input').value = text;
    restoreStateFromText(text);
    updateUndoRedoButtons();
    audio.playClick();
  }
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-manual-undo');
  const redoBtn = document.getElementById('btn-manual-redo');
  
  if (undoBtn && redoBtn) {
    undoBtn.disabled = state.manualHistoryIndex <= 0;
    redoBtn.disabled = state.manualHistoryIndex >= state.manualHistory.length - 1;
  }
}

function restoreStateFromText(text) {
  if (!window.nlp) return;
  const doc = window.nlp(text);
  const sentences = doc.json();
  const flatTerms = [];
  sentences.forEach(s => {
    if (s.terms) {
      flatTerms.push(...s.terms);
    }
  });
  
  state.manualTokens = flatTerms.map(t => {
    const tags = t.tags || [];
    const posGroup = determinePOSGroup(tags);
    return {
      text: t.text || '',
      pre: t.pre || '',
      post: t.post || '',
      tags: tags,
      posGroup: posGroup
    };
  });
  
  state.selectedWordIndex = null;
  renderManualWorkspace();
  updateInputStats();
  
  document.querySelector('#active-word-card .placeholder-word-text').style.display = 'block';
  document.querySelector('#active-word-card .active-word-details').style.display = 'none';
}

// --- MANUAL CRAFTSMAN WORD & SYNONYM ENGINE ---

function analyzeManualText() {
  const input = document.getElementById('editor-input').value.trim();
  if (!input) {
    alert("Please enter or paste text to analyze first!");
    audio.playError();
    return;
  }
  
  const words = input.split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    alert("Please enter at least 3 words to analyze!");
    audio.playError();
    return;
  }
  
  if (!window.nlp) {
    alert("Compromise NLP library is loading or offline. Please check connection.");
    return;
  }
  
  const craftBtn = document.getElementById('btn-craft-master');
  const craftBtnText = document.getElementById('craft-btn-text');
  
  craftBtn.disabled = true;
  craftBtnText.textContent = "ANALYZING...";
  
  // Close popup
  document.getElementById('synonym-popup').classList.remove('active');
  
  try {
    // Process input using Compromise.js
    const doc = window.nlp(input);
    const sentences = doc.json();
    const flatTerms = [];
    sentences.forEach(s => {
      if (s.terms) {
        flatTerms.push(...s.terms);
      }
    });
    
    // Parse terms into state tokens
    state.manualTokens = flatTerms.map(t => {
      const tags = t.tags || [];
      const posGroup = determinePOSGroup(tags);
      return {
        text: t.text || '',
        pre: t.pre || '',
        post: t.post || '',
        tags: tags,
        posGroup: posGroup
      };
    });
    
    state.selectedWordIndex = null;
    
    // Clear and initialize history
    state.manualHistory = [];
    state.manualHistoryIndex = -1;
    pushManualHistory(input);
    
    // Render
    renderManualWorkspace();
    updateInputStats();
    
    // Hide active details card
    document.querySelector('#active-word-card .placeholder-word-text').style.display = 'block';
    document.querySelector('#active-word-card .active-word-details').style.display = 'none';
    
    audio.playDiscover();

    // Auto-switch to output view on mobile!
    if (window.innerWidth <= 768) {
      switchMobileEditorPane('output');
    }
    
  } catch (error) {
    audio.playError();
    alert("Error parsing text: " + error.message);
  } finally {
    craftBtn.disabled = false;
    craftBtnText.textContent = "ANALYZE TEXT";
  }
}

function determinePOSGroup(tags) {
  if (tags.includes('Interjection')) return 'interjection';
  if (tags.includes('Value') || tags.includes('Cardinal') || tags.includes('Ordinal') || tags.includes('NumericValue')) return 'value';
  if (tags.includes('Modal')) return 'modal';
  if (tags.includes('Auxiliary') || tags.includes('Copula')) return 'aux';
  if (tags.includes('Noun') || tags.includes('Singular') || tags.includes('Plural') || tags.includes('ProperNoun')) return 'noun';
  if (tags.includes('Verb') || tags.includes('PresentTense') || tags.includes('PastTense') || tags.includes('Infinitive') || tags.includes('Gerund')) return 'verb';
  if (tags.includes('Adjective')) return 'adjective';
  if (tags.includes('Adverb')) return 'adverb';
  if (tags.includes('Pronoun') || tags.includes('Possessive') || tags.includes('Subject') || tags.includes('Object')) return 'pronoun';
  if (tags.includes('Preposition')) return 'prep';
  if (tags.includes('Conjunction')) return 'conj';
  if (tags.includes('Determiner')) return 'det';
  return 'other';
}

function renderManualWorkspace() {
  const container = document.getElementById('editor-output-manual');
  container.innerHTML = '';
  
  if (state.manualTokens.length === 0) {
    container.innerHTML = `
      <div class="placeholder-word-text centered">
        Enter text on the left and click "ANALYZE TEXT" to identify parts of speech and swap synonyms word-by-word.
      </div>
    `;
    return;
  }
  
  const root = document.createElement('div');
  root.className = 'manual-text-flow';
  if (!state.highlightPOS) {
    root.classList.add('pos-highlight-disabled');
  }
  
  state.manualTokens.forEach((token, idx) => {
    // 1. Spacing/Punctuation before word
    if (token.pre) {
      root.appendChild(document.createTextNode(token.pre));
    }
    
    // 2. Interactive Word Span
    const span = document.createElement('span');
    span.className = `word-span pos-${token.posGroup}`;
    span.textContent = token.text;
    span.dataset.index = idx;
    
    // Active state highlighting
    if (state.selectedWordIndex === idx) {
      span.classList.add('active');
    }
    
    // Hover tooltip (Title showing first tag name)
    const displayTag = token.tags.length > 0 ? cleanTagName(token.tags[0]) : 'Word';
    span.title = `Grammar: ${displayTag}`;
    
    // Select word event
    span.addEventListener('click', (e) => {
      e.stopPropagation();
      selectWord(idx, e);
    });
    
    root.appendChild(span);
    
    // 3. Spacing/Punctuation after word
    if (token.post) {
      root.appendChild(document.createTextNode(token.post));
    }
  });
  
  container.appendChild(root);
}

function cleanTagName(tag) {
  // Format camelcase tags. e.g. "PresentTense" -> "Present Tense"
  return tag.replace(/([A-Z])/g, ' $1').trim();
}

function togglePOSHighlight() {
  const chk = document.getElementById('chk-highlight-pos');
  state.highlightPOS = chk.checked;
  
  const flow = document.querySelector('.manual-text-flow');
  if (flow) {
    if (state.highlightPOS) {
      flow.classList.remove('pos-highlight-disabled');
    } else {
      flow.classList.add('pos-highlight-disabled');
    }
  }
  audio.playClick();
}

// Select a word, display its statistics, query synonyms
async function selectWord(index, event) {
  state.selectedWordIndex = index;
  
  // Update workspace active highlighting
  document.querySelectorAll('.word-span').forEach(span => {
    span.classList.remove('active');
    if (parseInt(span.dataset.index) === index) {
      span.classList.add('active');
    }
  });

  const token = state.manualTokens[index];
  const cleanWord = token.text.replace(/[^\w-]/g, '').toLowerCase();
  
  // Show active word detail block on left sidebar
  const cardPlaceholder = document.querySelector('#active-word-card .placeholder-word-text');
  const cardDetails = document.querySelector('#active-word-card .active-word-details');
  
  cardPlaceholder.style.display = 'none';
  cardDetails.style.display = 'flex';
  
  const tagEl = document.getElementById('selected-word-tag');
  tagEl.className = `active-word-tag ${token.posGroup}`;
  tagEl.textContent = token.tags.length > 0 ? cleanTagName(token.tags[0]) : 'Word';
  document.getElementById('selected-word-name').textContent = token.text;
  
  const listEl = document.getElementById('selected-word-synonyms');
  const antListEl = document.getElementById('selected-word-antonyms');
  
  listEl.innerHTML = '<span class="placeholder-word-text">Searching synonyms...</span>';
  antListEl.innerHTML = '<span class="placeholder-word-text">Searching antonyms...</span>';
  
  // Open floating popup immediately loading
  const popup = document.getElementById('synonym-popup');
  popup.innerHTML = `<div class="dropdown-header-title">"${token.text}" Choices</div>
                     <div class="dropdown-sub-header-title">Synonyms</div>
                     <div class="dropdown-syn-item" style="opacity: 0.5;">Loading...</div>`;
  popup.classList.add('active');
  
  // Calculate best position to prevent viewport overflows
  const rect = event.target.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Render popup temporarily invisible to get height and width
  popup.style.visibility = 'hidden';
  popup.style.display = 'block';
  const popupRect = popup.getBoundingClientRect();
  const w = popupRect.width || 220;
  const h = popupRect.height || 200;
  popup.style.display = '';
  popup.style.visibility = '';
  
  let left = rect.left;
  if (left + w > viewportWidth - 12) {
    left = viewportWidth - w - 12;
  }
  if (left < 12) {
    left = 12;
  }
  
  let top = rect.bottom + 6;
  if (top + h > viewportHeight - 12 && rect.top > h + 12) {
    top = rect.top - h - 6;
  }
  
  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
  popup.classList.add('active');

  try {
    // Query Datamuse API for synonyms, means like, and antonyms in parallel
    const relUrl = `https://api.datamuse.com/words?rel_syn=${cleanWord}&max=8`;
    const mlUrl = `https://api.datamuse.com/words?ml=${cleanWord}&max=12`;
    const antUrl = `https://api.datamuse.com/words?rel_ant=${cleanWord}&max=8`;
    const trgUrl = `https://api.datamuse.com/words?rel_trg=${cleanWord}&max=8`;
    
    let synonyms = [];
    let antonyms = [];
    
    const [relRes, antRes, mlRes] = await Promise.all([
      fetch(relUrl).catch(() => null),
      fetch(antUrl).catch(() => null),
      fetch(mlUrl).catch(() => null)
    ]);
    
    if (relRes && relRes.ok) {
      const relData = await relRes.json();
      synonyms = relData.map(w => w.word);
    }
    
    if (mlRes && mlRes.ok) {
      const mlData = await mlRes.json();
      mlData.forEach(w => {
        if (!synonyms.includes(w.word) && w.word !== cleanWord) {
          synonyms.push(w.word);
        }
      });
    }
    
    // Fallback: if we still have very few synonyms (e.g. less than 5), query rel_trg (trigger words)
    if (synonyms.length < 5) {
      const trgRes = await fetch(trgUrl).catch(() => null);
      if (trgRes && trgRes.ok) {
        const trgData = await trgRes.json();
        trgData.forEach(w => {
          if (!synonyms.includes(w.word) && w.word !== cleanWord) {
            synonyms.push(w.word);
          }
        });
      }
    }
    
    synonyms = synonyms.slice(0, 12);
    
    if (antRes.ok) {
      const antData = await antRes.json();
      antonyms = antData.map(w => w.word).slice(0, 12);
    }
    
    // Format capitalized replacements if the original word was capitalized
    const isCapitalized = token.text[0] === token.text[0].toUpperCase() && token.text[0] !== token.text[0].toLowerCase();
    
    // 1. Populate the left-side details panel (Synonyms)
    if (synonyms.length > 0) {
      listEl.innerHTML = '';
      synonyms.forEach(syn => {
        const displaySyn = isCapitalized ? syn[0].toUpperCase() + syn.slice(1) : syn;
        const chip = document.createElement('span');
        chip.className = 'synonym-chip';
        chip.textContent = displaySyn;
        chip.onclick = () => replaceWord(index, displaySyn);
        listEl.appendChild(chip);
      });
    } else {
      listEl.innerHTML = '<span class="placeholder-word-text">No synonyms found.</span>';
    }
    
    // Populate left details (Antonyms)
    if (antonyms.length > 0) {
      antListEl.innerHTML = '';
      antonyms.forEach(ant => {
        const displayAnt = isCapitalized ? ant[0].toUpperCase() + ant.slice(1) : ant;
        const chip = document.createElement('span');
        chip.className = 'synonym-chip antonym-type';
        chip.textContent = displayAnt;
        chip.onclick = () => replaceWord(index, displayAnt);
        antListEl.appendChild(chip);
      });
    } else {
      antListEl.innerHTML = '<span class="placeholder-word-text">No antonyms found.</span>';
    }
    
    // 2. Populate the floating absolute dropdown
    popup.innerHTML = `<div class="dropdown-header-title">"${token.text}" Choices</div>`;
    
    if (synonyms.length > 0) {
      const synHeader = document.createElement('div');
      synHeader.className = 'dropdown-sub-header-title';
      synHeader.textContent = 'Synonyms';
      popup.appendChild(synHeader);
      
      synonyms.forEach(syn => {
        const displaySyn = isCapitalized ? syn[0].toUpperCase() + syn.slice(1) : syn;
        const item = document.createElement('div');
        item.className = 'dropdown-syn-item';
        item.textContent = displaySyn;
        item.onclick = () => replaceWord(index, displaySyn);
        popup.appendChild(item);
      });
    }
    
    if (antonyms.length > 0) {
      const antHeader = document.createElement('div');
      antHeader.className = 'dropdown-sub-header-title';
      antHeader.textContent = 'Antonyms';
      popup.appendChild(antHeader);
      
      antonyms.forEach(ant => {
        const displayAnt = isCapitalized ? ant[0].toUpperCase() + ant.slice(1) : ant;
        const item = document.createElement('div');
        item.className = 'dropdown-syn-item antonym-item-type';
        item.textContent = displayAnt;
        item.onclick = () => replaceWord(index, displayAnt);
        popup.appendChild(item);
      });
    }
    
    if (synonyms.length === 0 && antonyms.length === 0) {
      popup.innerHTML = `<div class="dropdown-header-title">"${token.text}" Choices</div>
                         <div class="dropdown-syn-item" style="opacity: 0.5;">No results found.</div>`;
    }
    
  } catch (err) {
    listEl.innerHTML = '<span class="placeholder-word-text">Could not load.</span>';
    antListEl.innerHTML = '<span class="placeholder-word-text">Could not load.</span>';
    popup.innerHTML = `<div class="dropdown-header-title">"${token.text}" Choices</div>
                       <div class="dropdown-syn-item" style="color:var(--danger);">Error loading choices</div>`;
  }
}

// Substitute active token word and refresh views
function replaceWord(index, newWord) {
  audio.playClick();
  
  // Close popups
  document.getElementById('synonym-popup').classList.remove('active');
  
  // Replace text
  state.manualTokens[index].text = newWord;
  
  // Synchronize back into input textarea
  rebuildInputFromTokens();
  
  // Push state to undo/redo history
  pushManualHistory(document.getElementById('editor-input').value);
  
  // Re-render
  renderManualWorkspace();
  
  // Update active word card text
  document.getElementById('selected-word-name').textContent = newWord;
  // Re-query synonyms for the new word
  const activeSpan = document.querySelector(`.word-span[data-index="${index}"]`);
  if (activeSpan) {
    // Trigger virtual click events to reload synonyms for the newly placed word!
    const mockEvent = {
      target: activeSpan,
      stopPropagation: () => {},
      clientX: 0,
      clientY: 0
    };
    selectWord(index, mockEvent);
  }
}

function rebuildInputFromTokens() {
  let rebuilt = "";
  state.manualTokens.forEach(t => {
    rebuilt += (t.pre || '') + t.text + (t.post || '');
  });
  document.getElementById('editor-input').value = rebuilt;
  updateInputStats();
}

function syncManualToInput() {
  rebuildInputFromTokens();
  audio.playDiscover();
  
  const syncBtn = document.querySelector('.pane-actions-manual button[onclick="syncManualToInput()"]') || 
                  document.querySelector('.pane-header button[onclick="syncManualToInput()"]');
                  
  const oldText = syncBtn.textContent;
  syncBtn.textContent = "Synced!";
  setTimeout(() => syncBtn.textContent = oldText, 1500);
}

function copyManualText() {
  let text = "";
  state.manualTokens.forEach(t => {
    text += (t.pre || '') + t.text + (t.post || '');
  });
  
  if (!text) return;
  navigator.clipboard.writeText(text);
  audio.playClick();
  
  const copyBtn = document.querySelector('.pane-actions-manual button[onclick="copyManualText()"]') ||
                  document.querySelector('.pane-header button[onclick="copyManualText()"]');
                  
  const oldText = copyBtn.textContent;
  copyBtn.textContent = "Copied!";
  setTimeout(() => copyBtn.textContent = oldText, 1500);
}

function clearCraftedOutput() {
  audio.playClick();
  
  // Clear Auto Mode Output and Diff
  const outputArea = document.getElementById('editor-output');
  if (outputArea) outputArea.value = '';
  
  const diffBox = document.getElementById('editor-output-diff');
  if (diffBox) diffBox.innerHTML = '';
  
  // Clear Manual Mode state and container
  state.manualTokens = [];
  state.selectedWordIndex = null;
  state.manualHistory = [];
  state.manualHistoryIndex = -1;
  updateUndoRedoButtons();
  
  const manualOutput = document.getElementById('editor-output-manual');
  if (manualOutput) {
    manualOutput.innerHTML = `
      <div class="placeholder-word-text centered">
        Enter text on the left and click "ANALYZE TEXT" to identify parts of speech and swap synonyms word-by-word.
      </div>
    `;
  }
  
  // Reset active word card details
  const cardPlaceholder = document.querySelector('#active-word-card .placeholder-word-text');
  const cardDetails = document.querySelector('#active-word-card .active-word-details');
  if (cardPlaceholder && cardDetails) {
    cardPlaceholder.style.display = 'block';
    cardDetails.style.display = 'none';
  }
  
  // Reset auto history state
  state.autoHistory = [];
  state.autoHistoryIndex = -1;
  updateAutoUndoRedoButtons();
  
  // Close popup
  const popup = document.getElementById('synonym-popup');
  if (popup) popup.classList.remove('active');
  
  updateInputStats();
}

// --- REVIEWS & FEEDBACK ENGINE ---

function loadReviews() {
  const defaultReviews = [
    {
      author: "Daryl S.",
      rating: 5,
      title: "Best bypass tool on the market!",
      comment: "This tool is a lifesaver. The manual paraphraser gives me absolute control over word choices, and the Turnitin bypass dial is spot on! Clean and offline-friendly.",
      date: "2026-05-24"
    },
    {
      author: "Elena K. (Academic Writer)",
      rating: 5,
      title: "Meticulous grammar and tagging",
      comment: "I love the detailed parts of speech highlights! It helps me catch structural redundancies and repetitive phrasing that standard editors miss. The UI is absolutely gorgeous.",
      date: "2026-05-23"
    },
    {
      author: "Marcus T.",
      rating: 4,
      title: "Great offline capability",
      comment: "Great response times. The sound design is very satisfying too! A solid, premium editor.",
      date: "2026-05-20"
    }
  ];
  
  const savedReviews = localStorage.getItem('wc_custom_reviews');
  if (savedReviews) {
    try {
      const parsed = JSON.parse(savedReviews);
      state.reviewsList = [...defaultReviews, ...parsed];
    } catch (e) {
      state.reviewsList = defaultReviews;
    }
  } else {
    state.reviewsList = defaultReviews;
  }
  
  renderReviews();
}

function renderReviews() {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (state.reviewsList.length === 0) {
    container.innerHTML = '<div class="placeholder-word-text centered">No reviews yet. Be the first to leave a comment!</div>';
    return;
  }
  
  let totalRating = 0;
  
  // Render list (newest first)
  const sortedReviews = [...state.reviewsList].reverse();
  
  sortedReviews.forEach(rev => {
    totalRating += rev.rating;
    
    const card = document.createElement('div');
    card.className = 'review-card';
    
    const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
    
    card.innerHTML = `
      <div class="review-card-header">
        <span class="review-card-author">${escapeHTML(rev.author)}</span>
        <span class="review-card-stars">${stars}</span>
      </div>
      <div class="review-card-title">${escapeHTML(rev.title)}</div>
      <div class="review-card-comment">${escapeHTML(rev.comment)}</div>
      <div class="review-card-date">${rev.date}</div>
    `;
    
    container.appendChild(card);
  });
  
  // Calculate average
  const avg = (totalRating / state.reviewsList.length).toFixed(1);
  const avgStars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  
  document.getElementById('reviews-avg-score').textContent = avg;
  document.getElementById('reviews-avg-stars').textContent = avgStars;
  document.getElementById('reviews-total-count').textContent = `Based on ${state.reviewsList.length} reviews`;
}

function openReviewModal() {
  document.getElementById('modal-review').classList.add('active');
  // Reset fields
  document.getElementById('review-author').value = '';
  document.getElementById('review-title').value = '';
  document.getElementById('review-comment').value = '';
  setStarInputRating(0); // Reset stars to 0 on open (rating is required)
  audio.playClick();
}

function closeReviewModal() {
  document.getElementById('modal-review').classList.remove('active');
  audio.playClick();
}

function setStarInputRating(rating) {
  state.selectedReviewRating = rating;
  const stars = document.querySelectorAll('#modal-review .star-input');
  stars.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function submitReview() {
  const author = document.getElementById('review-author').value.trim() || 'Anonymous';
  const title = document.getElementById('review-title').value.trim() || 'No Title';
  const comment = document.getElementById('review-comment').value.trim();
  
  if (state.selectedReviewRating === 0) {
    alert("Please select a star rating (1-5) for your review!");
    audio.playError();
    return;
  }
  
  if (!comment) {
    alert("Please write your review comment!");
    audio.playError();
    return;
  }
  
  const newReview = {
    author: author,
    rating: state.selectedReviewRating,
    title: title,
    comment: comment,
    date: new Date().toISOString().split('T')[0]
  };
  
  // Fetch only custom reviews from storage
  let customReviews = [];
  const savedReviews = localStorage.getItem('wc_custom_reviews');
  if (savedReviews) {
    try {
      customReviews = JSON.parse(savedReviews);
    } catch(e) {}
  }
  
  customReviews.push(newReview);
  localStorage.setItem('wc_custom_reviews', JSON.stringify(customReviews));
  
  // Reload
  loadReviews();
  closeReviewModal();
  
  audio.playDiscover();
  
  // Prompt option to email it
  setTimeout(() => {
    if (confirm("Thank you for your review! Would you also like to email this feedback directly to Daryl at daryl.created@gmail.com?")) {
      sendDirectEmail(newReview);
    }
  }, 500);
}

function sendDirectEmail(reviewObj = null) {
  let subject = "Word Craft Feedback";
  let body = "Hi Daryl,\n\nI wanted to share my feedback on Word Craft.\n\n";
  
  if (reviewObj) {
    subject = `Word Craft Review from ${reviewObj.author}`;
    body += `Rating: ${'★'.repeat(reviewObj.rating)} (${reviewObj.rating}/5)\n`;
    body += `Title: ${reviewObj.title}\n\n`;
    body += `Review Comments:\n${reviewObj.comment}\n`;
  } else {
    body += "[Enter your comments and reviews here...]";
  }
  
  body += "\n\nRegards,\nWord Craft User";
  
  const email = "daryl.created@gmail.com";
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  window.open(mailtoUrl, '_blank');
}

// --- Language Check & Auto History Helpers ---
function checkLanguageWarning(text) {
  const words = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
  const foreignStopWords = new Set([
    // French
    'les', 'pour', 'dans', 'une', 'des', 'est', 'cette', 'avec', 'vous', 'nous',
    // German
    'der', 'die', 'das', 'und', 'ist', 'den', 'von', 'mit', 'auf', 'nicht',
    // Spanish
    'para', 'con', 'del', 'los', 'por', 'como', 'pero', 'este', 'esta'
  ]);
  
  let hasForeign = false;
  for (const w of words) {
    if (foreignStopWords.has(w)) {
      hasForeign = true;
      break;
    }
  }
  
  const banner = document.getElementById('lang-warning-banner');
  if (banner) {
    banner.style.display = hasForeign ? 'flex' : 'none';
  }
}

function pushAutoHistory(text) {
  if (state.autoHistoryIndex < state.autoHistory.length - 1) {
    state.autoHistory = state.autoHistory.slice(0, state.autoHistoryIndex + 1);
  }
  if (state.autoHistory.length > 0 && state.autoHistory[state.autoHistory.length - 1] === text) {
    return;
  }
  state.autoHistory.push(text);
  if (state.autoHistory.length > 50) {
    state.autoHistory.shift();
  }
  state.autoHistoryIndex = state.autoHistory.length - 1;
  updateAutoUndoRedoButtons();
}

function triggerAutoUndo() {
  if (state.autoHistoryIndex > 0) {
    state.autoHistoryIndex--;
    const text = state.autoHistory[state.autoHistoryIndex];
    document.getElementById('editor-output').value = text;
    updateAutoUndoRedoButtons();
    
    if (state.showDiff) {
      const input = document.getElementById('editor-input').value;
      document.getElementById('editor-output-diff').innerHTML = computeDiffHTML(input, text);
    }
    
    runBypassAnalysis(text);
    audio.playClick();
  }
}

function triggerAutoRedo() {
  if (state.autoHistoryIndex < state.autoHistory.length - 1) {
    state.autoHistoryIndex++;
    const text = state.autoHistory[state.autoHistoryIndex];
    document.getElementById('editor-output').value = text;
    updateAutoUndoRedoButtons();
    
    if (state.showDiff) {
      const input = document.getElementById('editor-input').value;
      document.getElementById('editor-output-diff').innerHTML = computeDiffHTML(input, text);
    }
    
    runBypassAnalysis(text);
    audio.playClick();
  }
}

function updateAutoUndoRedoButtons() {
  const undoBtn = document.getElementById('btn-auto-undo');
  const redoBtn = document.getElementById('btn-auto-redo');
  
  if (undoBtn && redoBtn) {
    undoBtn.disabled = state.autoHistoryIndex <= 0;
    redoBtn.disabled = state.autoHistoryIndex >= state.autoHistory.length - 1;
  }
}

// --- Browser Chrome Extension Receiver ---
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WORD_CRAFT_IMPORT') {
    const text = event.data.text;
    if (text) {
      const inputArea = document.getElementById('editor-input');
      inputArea.value = text;
      updateInputStats();
      
      // Auto-analyze if in manual mode
      if (state.craftType === 'manual') {
        analyzeManualText();
      }
      
      audio.playDiscover();
    }
  }
});
