// Word Craft Chrome Extension - Content Script

// Listen for messages from background.js (like import text commands)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "import_text" && request.text) {
    // Post message to the webpage so that app.js can receive it
    window.postMessage({
      type: "WORD_CRAFT_IMPORT",
      text: request.text
    }, "*");
    sendResponse({ status: "success" });
  }
});

// Bridge: Listen for message from app.js (webpage context)
window.addEventListener("message", (event) => {
  // Only handle messages from our page
  if (event.source !== window || !event.data) return;

  if (event.data.type === "WORD_CRAFT_API_REQUEST_BRIDGE") {
    const { requestId, url, method, headers, body } = event.data;
    
    // Relay to background script
    chrome.runtime.sendMessage({
      action: "make_api_request",
      url,
      method,
      headers,
      body
    }, (response) => {
      // Send response back to webpage context
      window.postMessage({
        type: "WORD_CRAFT_API_RESPONSE_BRIDGE",
        requestId,
        response: response || { success: false, error: "No response from extension background script." }
      }, "*");
    });
  }
});

// Signal to the webpage that the extension is installed
document.documentElement.setAttribute('data-word-craft-extension-installed', 'true');
