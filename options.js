// 配置选项
const CONFIG = {
  providers: [
    { value: 'openai', text: 'OpenAI' },
    { value: 'anthropic', text: 'Anthropic' },
    { value: 'deepseek', text: 'DeepSeek' }
  ],
  modelOptions: {
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
  },
  targetLanguages: [
    { value: 'Chinese (Simplified)', text: 'Chinese (Simplified)' },
    { value: 'Chinese (Traditional)', text: 'Chinese (Traditional)' },
    { value: 'English', text: 'English' },
    { value: 'Spanish', text: 'Spanish' },
    { value: 'Japanese', text: 'Japanese' },
    { value: 'Korean', text: 'Korean' },
    { value: 'Italian', text: 'Italian' },
    { value: 'French', text: 'French' }
  ]
};

document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    apiKey: document.getElementById('apiKey'),
    apiUrl: document.getElementById('apiUrl'),
    provider: document.getElementById('provider'),
    model: document.getElementById('model'),
    targetLanguage: document.getElementById('targetLanguage'),
    save: document.getElementById('save')
  };

  // 动态加载选项的通用函数
  function loadSelectOptions(selectElement, options) {
    selectElement.innerHTML = '';
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      selectElement.appendChild(optionElement);
    });
  }

  // 更新模型选择列表
  function updateModelOptions(provider) {
    loadSelectOptions(elements.model, CONFIG.modelOptions[provider]);
  }

  // 初始化所有选择器
  function initializeSelectors() {
    loadSelectOptions(elements.provider, CONFIG.providers);
    loadSelectOptions(elements.targetLanguage, CONFIG.targetLanguages);
    updateModelOptions(elements.provider.value);
  }

  // 加载保存的选项
  function loadSavedOptions() {
    chrome.storage.sync.get(
      ['apiKey', 'apiUrl', 'provider', 'model', 'targetLanguage'],
      (items) => {
        elements.apiKey.value = items.apiKey || '';
        elements.apiUrl.value = items.apiUrl || '';
        elements.provider.value = items.provider || CONFIG.providers[0].value;
        updateModelOptions(elements.provider.value);
        elements.model.value = items.model || CONFIG.modelOptions[elements.provider.value][0].value;
        elements.targetLanguage.value = items.targetLanguage || CONFIG.targetLanguages[0].value;
      }
    );
  }

  // 保存选项
  function saveOptions() {
    const options = {
      apiKey: elements.apiKey.value,
      apiUrl: elements.apiUrl.value,
      provider: elements.provider.value,
      model: elements.model.value,
      targetLanguage: elements.targetLanguage.value
    };

    chrome.storage.sync.set(options, () => {
      showSaveNotification();
    });
  }

  // 显示保存成功提示
  function showSaveNotification() {
    const notification = document.createElement('div');
    notification.textContent = 'Saved';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border-radius: 4px;
      transition: opacity 0.3s;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // 事件监听器
  elements.provider.addEventListener('change', () => {
    updateModelOptions(elements.provider.value);
  });

  elements.save.addEventListener('click', saveOptions);

  // 初始化
  initializeSelectors();
  loadSavedOptions();
});
