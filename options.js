document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiUrlInput = document.getElementById('apiUrl');
  const providerSelect = document.getElementById('provider');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const saveButton = document.getElementById('save');

  // Load saved options
    chrome.storage.sync.get(['apiKey', 'apiUrl', 'provider', 'targetLanguage'], (items) => {
    apiKeyInput.value = items.apiKey || ''; // Set default if not found
    apiUrlInput.value = items.apiUrl || '';
    providerSelect.value = items.provider || 'openai';
    targetLanguageSelect.value = items.targetLanguage || 'zh-CN'; // Set default
  });

  saveButton.addEventListener('click', function() {
    const selectedLanguage = targetLanguageSelect.value;
    const selectedProvider = providerSelect.value;
    const apiKey = apiKeyInput.value;
    const apiUrl = apiUrlInput.value;

    chrome.storage.sync.set({
      apiKey: apiKey,
      apiUrl: apiUrl,
      provider: selectedProvider,
      targetLanguage: selectedLanguage
    }, () => {
      // Optionally provide feedback to the user
      alert('Options saved');
    });
  });
});
