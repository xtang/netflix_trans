// background.js
import { LLMApiClient } from './llm-api-client.js';

let targetLanguage = 'zh-CN'; // 默认目标语言
let llmClient;

const gptPromptPrefix = `
You are a professional Netflix subtitle translator. Your task is to accurately and naturally translate subtitles in Netflix videos. You need to deeply understand the source language's syntax, vocabulary meaning, and cultural background, and translate it fluently into the target language. The translation and analysis content should be returned in {targetLanguage}.

Please process the given subtitle text according to the following steps:

1. **Syntax Analysis:** Analyze the grammatical structure of the source language sentence, decompose the main components. Please return this in {targetLanguage}.

2. **Vocabulary Analysis:** Identify the words in the sentence. Be sure to mark the pronunciation of each word and consider its accurate meaning in the current context, as well as its inflections/variations. Please return this in {targetLanguage}.

3. **Cultural Context Understanding:** Consider potential cultural allusions, idioms, humor, and other elements present in the source language, and make appropriate conversions in the translation so that the target language audience can understand. Please return this in {targetLanguage}.

4. **Overall Translation:** Combining the above analyses, translate the entire sentence into the target language. Please return this in {targetLanguage}. Your translation should be:
    * Grammatically Correct:  Conforming to the grammatical rules of the target language.
    * Appropriate Vocabulary: Using natural, contextually appropriate vocabulary.
    * Natural and Fluent: Reading like the expression of a native speaker, avoiding awkward literal translations.
    * Preserve Original Meaning: Accurately conveying the original meaning of the source language, avoiding loss or distortion of information.
    * Consider Spoken Language: Netflix subtitles are usually spoken language, and the translation should reflect this.
    * Concise and Clear:  While ensuring accuracy, strive for conciseness, in line with the characteristics of subtitles.

5. Return the content with each paragraph as concise as possible, with appropriate line breaks. Do not return in Markdown format.

6. Do not return the achieved translation effect.

Please provide a translation for the following subtitle text, along with a brief syntax and vocabulary analysis (please be sure to include the pronunciation of each word in the vocabulary analysis).

Note that the returned translation and analysis content must be in the target language (Target Language): {targetLanguage}

Subtitle Text:
{text}
`;

// 初始化 LLMApiClient
function initializeLLMClient(provider, apiKey) {
    chrome.storage.sync.get(["apiUrl"]).then((result) => {
        let apiURL = result.apiUrl; // 可选的 API URL
        const config = {
            apiKey: apiKey,
            provider: provider,
            apiURL: apiURL,
        };

        llmClient = new LLMApiClient(config);
        console.log('LLMClient initialized，Provider:', provider);
    })
}

chrome.storage.sync.get(['provider', 'apiKey', 'targetLanguage'], (data) => {
    const initialProvider = data.provider || 'openai'; // 默认值
    initializeLLMClient(initialProvider, data.apiKey);
    targetLanguage = data.targetLanguage || 'Chinese (Simplified)';
});

// 监听存储变化
chrome.storage.sync.onChanged.addListener((changes, namespace) => {
  const newProvider = changes.provider?.newValue;
  const newApiKey = changes.apiKey?.newValue;
  const newLanguage = changes.targetLanguage?.newValue;

  if (newProvider) {
      console.log('Provider 设置已更改为:', newProvider);
      chrome.storage.sync.get(['apiKey'], (data) => {
      initializeLLMClient(newProvider, data.apiKey);
    });
  } else if (newApiKey && llmClient?.provider) {
    console.log('API Key 已更新');
    initializeLLMClient(llmClient.provider, newApiKey);
  } else if (newLanguage) {
      targetLanguage = newLanguage;
  }
});

// 在 background script 启动时初始化 LLMClient
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['provider', 'apiKey'], (data) => {
    const initialProvider = data.provider || 'openai'; // 默认值
    initializeLLMClient(initialProvider, data.apiKey);
  });
});

// 在安装或更新时初始化 LLMClient
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['provider', 'apiKey'], (data) => {
    const initialProvider = data.provider || 'openai'; // 默认值
    initializeLLMClient(initialProvider, data.apiKey);
  });
});

// 创建右键菜单项
chrome.contextMenus.create({
  id: "translate-netflix-subtitle",
  title: "Translate Subtitle",
  contexts: ["page"], // 只在页面上显示右键菜单
  documentUrlPatterns: ["*://www.netflix.com/*"] // 限定在 Netflix 页面显示
});

// 监听右键菜单点击事件
// background.js (片段)
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "translate-netflix-subtitle") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: grabSubtitle //  直接指定函数名
    }, (results) => { //  回调函数接收执行结果
      if (chrome.runtime.lastError) {
        console.error("执行 content script 错误:", chrome.runtime.lastError);
        return;
      }
      const subtitle = results && results[0].result; // 获取 content script 的返回值

      if (subtitle) {
        console.log('抓取到的字幕:', subtitle);
        translateSubtitle(subtitle, targetLanguage, tab.id); // 调用翻译函数
      } else {
        console.log('未找到字幕。');
        // 可以发送消息给 popup 显示错误
        chrome.runtime.sendMessage({ message: "show_translation_error", error: "未找到字幕。" });
      }
    });
  }
});


function grabSubtitle() {
  console.log("grabSubtitle");
  const subtitleElement = document.querySelector('.player-timedtext');
  if (subtitleElement) {
    return subtitleElement.textContent;
  } else {
    return null; // 返回 null 表示未找到字幕
  }
}


function translateSubtitle(text, targetLang, tabId) {
    if (llmClient) {
        // chrome.tabs.sendMessage(tabId, {
        //     message: "show_translation",
        //     originalText: text,
        //     text: 'Thinking...'
        // });
        const params = { "targetLanguage": targetLanguage, "text": text};
        const prompt = gptPromptPrefix.replace(/{(\w+)}/g, (match, key) => {
            return params[key] || match; // 如果 params 中没有对应的 key，则保留原占位符
        });
        // callOpenAI(text, gptPromptPrefix)
        llmClient.generateText({ prompt })
            .then(stream => {
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                let accumulatedResponse = "";

                function read() {
                    reader.read().then(({ done, value }) => {
                        if (done) {
                            console.log("Stream completed.");
                            return;
                        }
                        const content = value;
                        accumulatedResponse += content;
                        chrome.tabs.sendMessage(tabId, {
                            message: "show_translation",
                            originalText: text,
                            text: accumulatedResponse // 发送累积的翻译
                        });
                        read();
                    }).catch(error => {
                        console.error("Error reading stream:", error);
                    });
                }
                read();
            })
            .catch(error => {
                console.error("Error calling generateText:", error);
            });
    } else {
        console.log('LLMClient was not initialized');
    }
}
