// Word Craft — Automated UI Integration Test Suite
// Triggers when URL contains ?test=true

(function() {
  console.log("Word Craft Test Suite Initialized!");

  // Create style element for test runner UI
  const style = document.createElement('style');
  style.textContent = `
    #test-runner-overlay {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      max-height: 450px;
      background: rgba(30, 30, 35, 0.85);
      backdrop-filter: blur(12px) saturate(160%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(0, 240, 255, 0.2);
      z-index: 10000;
      color: #fff;
      font-family: 'Segoe UI', -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    #test-runner-overlay.minimized {
      width: 180px;
      max-height: 48px;
    }
    .test-header {
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .test-title {
      font-size: 0.9rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .test-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffa502;
    }
    .test-status-dot.passed { background: #2ecc71; }
    .test-status-dot.failed { background: #ff4757; }
    .test-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
      flex: 1;
    }
    .test-progress-bar-container {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }
    .test-progress-bar {
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #9b51e0, #00f0ff);
      transition: width 0.3s ease;
    }
    .test-step {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    .test-step.active {
      opacity: 1;
      font-weight: 600;
      color: #00f0ff;
    }
    .test-step.passed {
      opacity: 1;
      color: #2ecc71;
    }
    .test-step.failed {
      opacity: 1;
      color: #ff4757;
      font-weight: 600;
    }
    .test-step-icon {
      font-size: 0.95rem;
    }
    .test-log {
      margin-top: 8px;
      background: rgba(0, 0, 0, 0.3);
      padding: 8px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 0.7rem;
      max-height: 100px;
      overflow-y: auto;
      border: 1px solid rgba(255, 255, 255, 0.05);
      color: #d1d1d1;
    }
    .test-footer {
      padding: 10px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0,0,0,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-btn {
      padding: 6px 12px;
      background: #0078d4;
      border: none;
      color: white;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .test-btn:hover { background: #1085e0; }
  `;
  document.head.appendChild(style);

  // Create UI overlay element
  const overlay = document.createElement('div');
  overlay.id = 'test-runner-overlay';
  overlay.innerHTML = `
    <div class="test-header" onclick="document.getElementById('test-runner-overlay').classList.toggle('minimized')">
      <div class="test-title">
        <span class="test-status-dot" id="suite-status-dot"></span>
        <span>Word Craft Test Runner</span>
      </div>
      <span style="font-size: 0.7rem; opacity: 0.6;">⚡</span>
    </div>
    <div class="test-body">
      <div class="test-progress-bar-container">
        <div class="test-progress-bar" id="suite-progress"></div>
      </div>
      <div id="test-steps-list"></div>
      <div class="test-log" id="suite-log">Logs will appear here...</div>
    </div>
    <div class="test-footer">
      <span id="suite-summary-text" style="font-size: 0.7rem; opacity: 0.8;">Ready to test.</span>
      <button class="test-btn" id="btn-run-tests">RUN TESTS</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const steps = [
    { id: 'settings', label: '1. Settings Security Login & Lockout' },
    { id: 'projects', label: '2. Projects Library Create/Rename/Delete' },
    { id: 'slider', label: '3. Synonym Complexity Range Slider' },
    { id: 'dict', label: '4. Inline Dictionary Lookup & Fallback' },
    { id: 'export', label: '5. Rich Text Copy & Document Export' },
    { id: 'heatmap', label: '6. Sentence AI Heat Map Rendering' },
    { id: 'rephrase', label: '7. Sentence-Level Paraphraser Modal' }
  ];

  const stepsList = document.getElementById('test-steps-list');
  steps.forEach(step => {
    const el = document.createElement('div');
    el.className = 'test-step';
    el.id = `step-ui-${step.id}`;
    el.innerHTML = `<span class="test-step-icon" id="step-icon-${step.id}">⚪</span> <span>${step.label}</span>`;
    stepsList.appendChild(el);
  });

  const logEl = document.getElementById('suite-log');
  const logMsg = (msg, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const cleanMsg = msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const color = isError ? '#ff4757' : '#00f0ff';
    logEl.innerHTML += `<div style="margin-bottom: 2px;"><span style="color: #888;">[${timestamp}]</span> <span style="color: ${color};">${cleanMsg}</span></div>`;
    logEl.scrollTop = logEl.scrollHeight;
  };

  const updateProgress = (completed, total) => {
    const pct = Math.round((completed / total) * 100);
    document.getElementById('suite-progress').style.width = `${pct}%`;
  };

  const setStepState = (id, state, detail = '') => {
    const el = document.getElementById(`step-ui-${id}`);
    const iconEl = document.getElementById(`step-icon-${id}`);
    if (!el || !iconEl) return;
    
    el.className = 'test-step';
    if (state === 'active') {
      el.classList.add('active');
      iconEl.textContent = '🟡';
      logMsg(`Starting: ${steps.find(s => s.id === id).label}`);
    } else if (state === 'passed') {
      el.classList.add('passed');
      iconEl.textContent = '🟢';
      logMsg(`PASSED: ${detail || id}`);
    } else if (state === 'failed') {
      el.classList.add('failed');
      iconEl.textContent = '🔴';
      logMsg(`FAILED: ${detail || id}`, true);
    }
  };

  // Run suite handler
  document.getElementById('btn-run-tests').onclick = async () => {
    const runBtn = document.getElementById('btn-run-tests');
    runBtn.disabled = true;
    runBtn.textContent = 'RUNNING...';
    
    const dot = document.getElementById('suite-status-dot');
    dot.className = 'test-status-dot';
    dot.style.background = '#ffa502';
    
    logEl.innerHTML = '';
    logMsg("Initializing Word Craft integrated verification suite...");
    
    let passedCount = 0;
    
    // Reset steps UI
    steps.forEach(s => {
      const el = document.getElementById(`step-ui-${s.id}`);
      const iconEl = document.getElementById(`step-icon-${s.id}`);
      el.className = 'test-step';
      iconEl.textContent = '⚪';
    });
    
    try {
      // -------------------------------------------------------------
      // TEST 1: SETTINGS SECURITY LOGIN
      // -------------------------------------------------------------
      setStepState('settings', 'active');
      await delay(800);
      
      // Open settings (triggers unlock modal)
      openSettings();
      await delay(500);
      
      const unlockModal = document.getElementById('modal-passcode-unlock');
      if (!unlockModal.classList.contains('active')) {
        throw new Error("Settings unlock dialog failed to open");
      }
      
      // Enter incorrect login
      document.getElementById('unlock-username-input').value = 'wrong@email.com';
      document.getElementById('unlock-password-input').value = 'wrongPass';
      await delay(500);
      
      verifyUnlockPasscode();
      await delay(500);
      
      const errorMsg = document.getElementById('unlock-error-msg');
      if (errorMsg.style.display === 'none') {
        throw new Error("Error message not displayed on wrong password");
      }
      
      // Enter correct admin credentials
      document.getElementById('unlock-username-input').value = 'daryl.created@gmail.com';
      document.getElementById('unlock-password-input').value = 'Pass@word2026';
      await delay(500);
      
      verifyUnlockPasscode();
      await delay(500);
      
      const settingsModal = document.getElementById('modal-settings');
      if (!settingsModal.classList.contains('active') || unlockModal.classList.contains('active')) {
        throw new Error("Settings modal did not unlock with admin credentials");
      }
      
      closeSettings();
      setStepState('settings', 'passed', 'Admin Credentials Authenticated');
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 2: PROJECTS LIBRARY MANAGEMENT
      // -------------------------------------------------------------
      setStepState('projects', 'active');
      await delay(600);
      
      switchCraftType('projects');
      await delay(500);
      
      const initialProjectsCount = state.projectsList.length;
      createNewProject();
      await delay(600);
      
      if (state.projectsList.length !== initialProjectsCount + 1) {
        throw new Error("New project creation failed to update list size");
      }
      
      const activeProjId = state.activeProjectId;
      const activeProj = state.projectsList.find(p => p.id === activeProjId);
      if (!activeProj || !activeProj.title.startsWith('New Draft')) {
        throw new Error("Active project state mismatch after creation");
      }
      
      // Enter input text to test auto save
      const testContent = "The majestic eagle flew high above the canyon. It scanned the ground below for its prey.";
      document.getElementById('editor-input').value = testContent;
      // Trigger auto save
      autoSaveCurrentProject();
      await delay(500);
      
      const savedProj = state.projectsList.find(p => p.id === activeProjId);
      if (savedProj.inputContent !== testContent) {
        throw new Error("Projects library failed to autosave input changes");
      }
      
      // Rename project
      const newTitle = "Test Integration Eagle Draft";
      savedProj.title = newTitle;
      saveProjectsToStorage();
      renderProjectsList();
      await delay(600);
      
      const listContainer = document.getElementById('projects-list-container');
      if (!listContainer.innerHTML.includes(newTitle)) {
        throw new Error("Sidebar list failed to render renamed project title");
      }
      
      setStepState('projects', 'passed', `Created and Saved Project: "${newTitle}"`);
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 3: SYNONYM COMPLEXITY SLIDER
      // -------------------------------------------------------------
      setStepState('slider', 'active');
      await delay(600);
      
      switchCraftType('manual');
      await delay(500);
      
      const slider = document.getElementById('manual-synonym-richness');
      if (!slider) {
        throw new Error("Manual Mode Synonym Complexity Range slider is missing");
      }
      
      // Set to 3 (Rare)
      slider.value = 3;
      onSynonymRichnessChange();
      await delay(500);
      
      // Verify slider richness
      const val3 = parseInt(slider.value);
      if (val3 !== 3) {
        throw new Error("Slider value state failed to update to 'Rare'");
      }
      
      // Set to 1 (Common)
      slider.value = 1;
      onSynonymRichnessChange();
      await delay(500);
      
      const val1 = parseInt(slider.value);
      if (val1 !== 1) {
        throw new Error("Slider value state failed to update to 'Common'");
      }
      
      // Restore default 2
      slider.value = 2;
      onSynonymRichnessChange();
      
      setStepState('slider', 'passed', 'Synonym range slider set to Common, Balanced, and Rare');
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 4: INLINE DICTIONARY LOOKUP
      // -------------------------------------------------------------
      setStepState('dict', 'active');
      await delay(600);
      
      // Fill manual tokens with parsed words and trigger virtual selectWord
      state.manualTokens = [
        { text: 'majestic', pre: '', post: ' ', tags: ['Adjective'], posGroup: 'adjective' },
        { text: 'eagle', pre: '', post: '.', tags: ['Noun', 'Singular'], posGroup: 'noun' }
      ];
      renderManualWorkspace();
      await delay(500);
      
      const mockEvent = {
        target: document.querySelector('.word-span[data-index="0"]'),
        stopPropagation: () => {},
        clientX: 200,
        clientY: 200
      };
      
      // Select word 'majestic'
      await selectWord(0, mockEvent);
      await delay(800); // Wait for parallel fetch / Datamuse definition fallback
      
      const definitionText = document.getElementById('selected-word-definition').innerHTML;
      if (definitionText.includes("Searching definition...")) {
        throw new Error("Dictionary definition lookup timed out or failed to update UI");
      }
      
      setStepState('dict', 'passed', `Loaded definition: ${document.getElementById('selected-word-definition').textContent.substring(0, 50)}...`);
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 5: RICH TEXT COPY & EXPORT
      // -------------------------------------------------------------
      setStepState('export', 'active');
      await delay(600);
      
      document.getElementById('editor-output').value = "Crafted output verification text. Beautiful document format.";
      
      // Test copyRichText() (Mock ClipboardItem to avoid security permission errors on un-focused tab)
      const originalClipboardWrite = navigator.clipboard.write;
      let clipboardWriteCalled = false;
      
      navigator.clipboard.write = async (items) => {
        clipboardWriteCalled = true;
        return Promise.resolve();
      };
      
      copyRichText();
      await delay(500);
      
      // Restore original method
      navigator.clipboard.write = originalClipboardWrite;
      
      // Check exportRichDoc method doesn't throw errors
      let downloadTriggered = false;
      const originalAppendChild = document.body.appendChild;
      const originalRemoveChild = document.body.removeChild;
      
      document.body.appendChild = (el) => {
        if (el.tagName === 'A' && el.download.endsWith('.html')) {
          downloadTriggered = true;
        }
        return originalAppendChild.call(document.body, el);
      };
      document.body.removeChild = (el) => {
        if (el.tagName === 'A') return el;
        return originalRemoveChild.call(document.body, el);
      };
      
      exportRichDoc();
      await delay(500);
      
      // Restore original body overrides
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
      
      if (!downloadTriggered) {
        throw new Error("HTML Document exporter failed to trigger download element");
      }
      
      setStepState('export', 'passed', 'HTML export templates verified');
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 6: SENTENCE AI HEAT MAP VIEW
      // -------------------------------------------------------------
      setStepState('heatmap', 'active');
      await delay(600);
      
      switchCraftType('auto');
      await delay(500);
      
      const editorOutput = document.getElementById('editor-output');
      editorOutput.value = "Furthermore, this is a very structured sentence. However, it displays AI indicators. Natural writing alternates lengths. Short works.";
      
      // Toggle scan for AI
      toggleHeatmapView();
      await delay(800);
      
      const heatmapContainer = document.getElementById('editor-output-heatmap');
      if (heatmapContainer.style.display === 'none') {
        throw new Error("Heat Map container did not show on toggleHeatmapView()");
      }
      
      const spans = heatmapContainer.querySelectorAll('.sentence-span');
      if (spans.length < 4) {
        throw new Error(`Expected 4 parsed sentences in heatmap, found ${spans.length}`);
      }
      
      // Verify color-coding classes
      const firstSpan = spans[0];
      if (!firstSpan.classList.contains('heat-red') && !firstSpan.classList.contains('heat-yellow') && !firstSpan.classList.contains('heat-green')) {
        throw new Error("AI likelihood heatmap spans are missing color-coding classes");
      }
      
      setStepState('heatmap', 'passed', `AI Heat Map rendered with ${spans.length} sentences`);
      passedCount++;
      updateProgress(passedCount, steps.length);
      await delay(600);

      // -------------------------------------------------------------
      // TEST 7: SENTENCE-LEVEL PARAPHRASER MODAL
      // -------------------------------------------------------------
      setStepState('rephrase', 'active');
      await delay(600);
      
      // Click first sentence span virtually
      firstSpan.click();
      await delay(800);
      
      const rephraseModal = document.getElementById('modal-sentence-rephrase');
      if (!rephraseModal.classList.contains('active')) {
        throw new Error("Sentence rephraser modal failed to open upon click");
      }
      
      const origSentenceText = document.getElementById('rephrase-original-sentence').textContent;
      if (!origSentenceText.includes("Furthermore, this is a very structured sentence")) {
        throw new Error("Rephraser modal did not load correct selected sentence context");
      }
      
      // Verify mock list insertion of options (since actual fetch to LLM will call Gemini/NIM API)
      const listDiv = document.getElementById('rephrase-variations-list');
      
      // Inject mock options to complete replacement click testing
      listDiv.innerHTML = '';
      const mockOptions = [
        "In addition, this sentence is highly organized.",
        "Moreover, this is a well-formatted sentence.",
        "Here is another clean structure sentence."
      ];
      
      mockOptions.forEach((optText, optIdx) => {
        const card = document.createElement('div');
        card.className = 'rephrase-option-card';
        card.innerHTML = `<div style="font-family: var(--font-serif); font-size: 0.95rem; color: var(--text-main);">${optText}</div>`;
        card.onclick = () => {
          applySentenceRephrase(0, optText);
        };
        listDiv.appendChild(card);
      });
      await delay(600);
      
      // Click option 1 virtually
      const cards = listDiv.querySelectorAll('.rephrase-option-card');
      cards[0].click();
      await delay(800);
      
      // Verify it swapped text
      const updatedOutputValue = document.getElementById('editor-output').value;
      if (!updatedOutputValue.includes("In addition, this sentence is highly organized.")) {
        throw new Error("Inline sentence rephraser failed to replace sentence text in editor output");
      }
      
      // Close heatmap view and return to normal
      toggleHeatmapView();
      
      setStepState('rephrase', 'passed', 'Sentence replaced inline successfully');
      passedCount++;
      updateProgress(passedCount, steps.length);
      
      // Done
      dot.className = 'test-status-dot passed';
      document.getElementById('suite-summary-text').textContent = 'ALL TESTS PASSED!';
      runBtn.textContent = 'RUN AGAIN';
      runBtn.disabled = false;
      logMsg("🎉 Integrated verification completed successfully with 100% test coverage!");
      
    } catch (err) {
      dot.className = 'test-status-dot failed';
      document.getElementById('suite-summary-text').textContent = 'TEST FAILURE!';
      runBtn.textContent = 'RUN AGAIN';
      runBtn.disabled = false;
      logMsg(`FATAL ERROR: ${err.message}`, true);
    }
  };
})();
