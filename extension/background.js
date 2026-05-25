// Word Craft Chrome Extension - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "craft-selection",
    title: "Craft selection with Word Craft",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "craft-selection" && info.selectionText) {
    sendTextToWordCraft(info.selectionText);
  }
});

// Listen for runtime messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "send_text" && request.text) {
    sendTextToWordCraft(request.text);
    sendResponse({ status: "success" });
  } else if (request.action === "open_dashboard") {
    sendTextToWordCraft("");
    sendResponse({ status: "success" });
  }
});

/**
 * Searches for an open Word Craft tab and passes the selected text.
 * If none is open, it opens the default local file path.
 */
function sendTextToWordCraft(text) {
  // Query all tabs to look for Word Craft
  chrome.tabs.query({}, (tabs) => {
    // Look for a tab matching Word Craft URL keywords or title
    const wordCraftTab = tabs.find(t => 
      (t.url && t.url.includes("word-craft")) || 
      (t.title && t.title.toLowerCase().includes("word craft"))
    );

    if (wordCraftTab) {
      // Focus the existing tab
      chrome.tabs.update(wordCraftTab.id, { active: true }, () => {
        if (text) {
          // Send message to the tab's content script to relay it to the page
          chrome.tabs.sendMessage(wordCraftTab.id, {
            action: "import_text",
            text: text
          }, (response) => {
            // If content script was not ready, inject script directly
            if (chrome.runtime.lastError) {
              chrome.scripting.executeScript({
                target: { tabId: wordCraftTab.id },
                func: (txt) => {
                  window.postMessage({ type: "WORD_CRAFT_IMPORT", text: txt }, "*");
                },
                args: [text]
              });
            }
          });
        }
      });
    } else {
      // No tab open. Open a default tab and pass the text in the query/hash or local storage later
      const fileUrl = "file:///C:/Users/daryl/.gemini/antigravity/scratch/word-craft/index.html";
      chrome.tabs.create({ url: fileUrl }, (newTab) => {
        if (text) {
          // Inject a content script to check local storage
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: (txt) => {
                window.postMessage({ type: "WORD_CRAFT_IMPORT", text: txt }, "*");
              },
              args: [text]
            }).catch(() => {
              // Ignore errors if permission is not set for file URLs
            });
          }, 1000);
        }
      });
    }
  });
}
