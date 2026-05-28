// Word Craft Chrome Extension - Popup Logic

document.getElementById('btn-grab').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  
  // Inject script to retrieve selected text
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString()
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const selectedText = results[0].result.trim();
      if (selectedText) {
        // Send message to background script to relay it
        chrome.runtime.sendMessage({ action: "send_text", text: selectedText });
        window.close(); // Close popup
      } else {
        alert("Please highlight/select some text on the webpage first!");
      }
    } else {
      alert("No selection found. Please select some text first.");
    }
  });
});

document.getElementById('btn-open').addEventListener('click', () => {
  // Tell background script to open dashboard without importing text
  chrome.runtime.sendMessage({ action: "open_dashboard" });
  window.close();
});
