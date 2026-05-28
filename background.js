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

// Listen for runtime messages from popup.js and content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "send_text" && request.text) {
    sendTextToWordCraft(request.text);
    sendResponse({ status: "success" });
  } else if (request.action === "open_dashboard") {
    sendTextToWordCraft("");
    sendResponse({ status: "success" });
  } else if (request.action === "make_api_request") {
    // Perform fetch from background service worker to bypass CORS
    fetch(request.url, {
      method: request.method || 'POST',
      headers: request.headers,
      body: request.body
    })
    .then(async (response) => {
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
      sendResponse({ success: true, status: response.status, data: data, ok: response.ok });
    })
    .catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

/**
 * Searches for an open Word Craft tab and passes the selected text.
 * If none is open, it opens the extension's packaged index.html.
 */
function sendTextToWordCraft(text) {
  // Query all tabs to look for Word Craft
  chrome.tabs.query({}, (tabs) => {
    // Look for a tab matching Word Craft URL keywords, extension ID, or title
    const wordCraftTab = tabs.find(t => 
      (t.url && (t.url.includes("word-craft") || t.url.includes(chrome.runtime.id))) || 
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
      // No tab open. Open the extension packaged index.html page
      const fileUrl = chrome.runtime.getURL("index.html");
      chrome.tabs.create({ url: fileUrl }, (newTab) => {
        if (text) {
          // Inject a content script to pass the text once page loads
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: (txt) => {
                window.postMessage({ type: "WORD_CRAFT_IMPORT", text: txt }, "*");
              },
              args: [text]
            }).catch(() => {
              // Ignore errors if permission is not set
            });
          }, 1000);
        }
      });
    }
  });
}
