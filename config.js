// Word Craft - Default Configuration Settings
// 
// You can enter your API keys here to distribute the app with pre-loaded credentials.
// Users can still override these settings by entering their own keys in the app settings modal.
// If a user enters their own key, it is saved in browser localStorage and takes precedence.

const DEFAULT_CONFIG = {
  // Choose default provider: 'gemini' or 'openrouter'
  apiProvider: 'gemini', 
  
  // Paste your default Gemini API Key (native) below:
  geminiApiKey: '', 
  
  // Paste your default OpenRouter API Key below:
  openRouterApiKey: '', 
  
  // Set default model: e.g. 'gemini-2.5-flash', 'google/gemini-2.5-flash', 'deepseek/deepseek-chat', etc.
  geminiModel: 'gemini-2.5-flash',
  
  // Security settings
  isPasswordLockEnabled: false,
  settingsPassword: ''
};
