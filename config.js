// Word Craft - Default Configuration Settings
// 
// You can enter your API keys here to distribute the app with pre-loaded credentials.
// Users can still override these settings by entering their own keys in the app settings modal.
// If a user enters their own key, it is saved in browser localStorage and takes precedence.

const DEFAULT_CONFIG = {
  // Choose default provider: 'gemini', 'openrouter', or 'nvidia'
  apiProvider: 'nvidia', 
  
  // Paste your default Gemini API Key (native) below:
  geminiApiKey: '', 
  
  // Paste your default OpenRouter API Key below:
  openRouterApiKey: '', 

  // Paste your default NVIDIA NIM API Key below:
  nvidiaApiKey: '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', 
  
  // Set default model: e.g. 'meta/llama-3.3-70b-instruct', 'gemini-2.5-flash', etc.
  geminiModel: 'meta/llama-3.3-70b-instruct',
};

window.DEFAULT_CONFIG = DEFAULT_CONFIG;

