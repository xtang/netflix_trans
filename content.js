console.log("Content script loaded on Netflix.");

let subtitleTranslationDiv = null;

function addClose() {
    const gptCloseBtn = document.querySelector('#sub-gpt-close');
    // Add a click event listener to the button
    gptCloseBtn.addEventListener('click', () => {
        // Get a reference to the #polish-div element
        // Hide the #polish-div element
        subtitleTranslationDiv.style.display = 'none';
    });
}

function addCopy() {
    // Get a reference to the #sub-gpt-copy button
    const gptCopyBtn = document.querySelector('#sub-gpt-copy');

    // Add a click event listener to the button
    gptCopyBtn.addEventListener('click', async () => {
        // Get a reference to the #polish-text paragraph element
        const polishText = document.querySelector('#subtitle-translate-text');
        try {
            await navigator.clipboard.writeText(polishText.textContent);
            polishText.classList.add('copied');
            setTimeout(() => {
                polishText.classList.remove('copied');
            }, 500);
        } catch (err) {
            console.error('Error copying text to clipboard:', err);
        }
    });
}

function createPolishDiv() {
    return new Promise((resolve, reject) => {
        fetch(chrome.runtime.getURL("subtitletran.html"))
            .then(response => response.text())
            .then(html => {
                subtitleTranslationDiv = document.createElement('div');
                subtitleTranslationDiv.innerHTML = html;
                // 设置固定位置和样式
                subtitleTranslationDiv.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    max-height: 80vh;
                    width: 400px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    z-index: 9999;
                    overflow: hidden;
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(subtitleTranslationDiv);
                addClose();
                addCopy();
                resolve();
            })
            .catch(error => {
                console.error(error);
                reject(error);
            })
    });
}

function showPolishDiv(text, originalText) {
    const showContent = () => {
        const polishText = document.getElementById('subtitle-translate-text');
        const originalTextP = document.getElementById("subtitle-translate-origin-text");
        const contentWrapper = document.getElementById("subtitle-translate-content");

        // 设置内容容器的样式
        contentWrapper.style.cssText = `
            max-height: calc(80vh - 80px); // 减去头部和按钮的高度
            overflow-y: auto;
            padding: 16px;
            scrollbar-width: thin;
        `;

        // 添加平滑的过渡效果
        subtitleTranslationDiv.style.opacity = '0';
        subtitleTranslationDiv.style.display = 'block';

        // 设置内容
        originalTextP.textContent = originalText;
        polishText.textContent = text;

        // 淡入效果
        requestAnimationFrame(() => {
            subtitleTranslationDiv.style.opacity = '1';
        });

        // 自动滚动到顶部
        contentWrapper.scrollTop = 0;
    };

    if (!subtitleTranslationDiv) {
        createPolishDiv()
            .then(showContent)
            .catch(error => {
                console.error(error);
            });
    } else {
        showContent();
    }
}

// 添加自定义滚动条样式
const scrollbarStyles = `
    #subtitle-translate-content::-webkit-scrollbar {
        width: 6px;
    }

    #subtitle-translate-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
    }

    #subtitle-translate-content::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
    }

    #subtitle-translate-content::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;

// 注入滚动条样式
const style = document.createElement('style');
style.textContent = scrollbarStyles;
document.head.appendChild(style);

// add css
const link = document.createElement('link');
link.rel = 'stylesheet';
link.type = 'text/css';
link.href = chrome.runtime.getURL('subtitletran.css');
document.head.appendChild(link);

function getSelectedSubtitle() {
  const subtitleElement = document.querySelector('.player-timedtext');
  if (subtitleElement) {
    return subtitleElement.textContent;
  }
  return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 用于检查 content script 是否已加载的 ping 消息
    if (request.type === "ping") {
        sendResponse("pong");
        return;
    }

    if (request.action === "translate-subtitle") {
        const subtitle = getSelectedSubtitle();
        if (subtitle) {
            chrome.runtime.sendMessage({
                action: "perform-translation",
                text: subtitle
            });
        }
    } else if (request.action === "close-translation") {
        if (subtitleTranslationDiv) {
            subtitleTranslationDiv.style.display = 'none';
        }
    } else if (request.message === "show_translation") {
        console.log("Content script received translation:", request.text);
        showPolishDiv(request.text, request.originalText);
    }
});

// 确保 DOM 加载完成后再初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("Content script DOM ready");
    // 初始化相关代码...
});
