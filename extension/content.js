// Word Craft Chrome Extension - Content Script

// Listen for messages from background.js
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
