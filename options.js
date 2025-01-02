document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiUrlInput = document.getElementById('apiUrl');
  const providerSelect = document.getElementById('provider');
  const modelSelect = document.getElementById('model');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const saveButton = document.getElementById('save');

  // 定义不同 provider 对应的模型选项
  const modelOptions = {
    openai: [
      { value: 'gpt-4o-mini', text: 'gpt-4o-mini' },
      { value: 'gpt-4o', text: 'gpt-4o' }
    ],
    anthropic: [
      { value: 'claude-3-5-haiku-20241022', text: 'claude-3-5-haiku-20241022' },
      { value: 'claude-3-5-sonnet-20241022', text: 'claude-3-5-sonnet-20241022' }
    ],
    deepseek: [
      { value: 'deepseek-chat', text: 'deepseek-chat' }
    ]
  };

  // 更新模型选择列表
  function updateModelOptions(provider) {
    modelSelect.innerHTML = '';
    modelOptions[provider].forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      modelSelect.appendChild(optionElement);
    });
  }

  // Provider 变化时更新模型列表
  providerSelect.addEventListener('change', function() {
    updateModelOptions(this.value);
  });

  // 加载保存的选项
  chrome.storage.sync.get(['apiKey', 'apiUrl', 'provider', 'model', 'targetLanguage'], (items) => {
    apiKeyInput.value = items.apiKey || '';
    apiUrlInput.value = items.apiUrl || '';
    providerSelect.value = items.provider || 'openai';
    updateModelOptions(providerSelect.value);
    modelSelect.value = items.model || modelOptions[providerSelect.value][0].value;
    targetLanguageSelect.value = items.targetLanguage || 'Chinese (Simplified)';
  });

  saveButton.addEventListener('click', function() {
    chrome.storage.sync.set({
      apiKey: apiKeyInput.value,
      apiUrl: apiUrlInput.value,
      provider: providerSelect.value,
      model: modelSelect.value,
      targetLanguage: targetLanguageSelect.value
    }, () => {
      alert('Options saved');
    });
  });
});
