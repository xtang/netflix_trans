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

function addDragFeature() {
    const dragHandle = document.querySelector('#sub-gpt-operators');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
        // 如果点击的是操作按钮，则不启动拖拽
        if (e.target.id === 'sub-gpt-close' || e.target.id === 'sub-gpt-copy') {
            return;
        }

        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === dragHandle) {
            isDragging = true;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // // 获取窗口尺寸和元素尺寸
            // const windowWidth = window.innerWidth;
            // const windowHeight = window.innerHeight;
            // const element = subtitleTranslationDiv;
            // const elementRect = element.getBoundingClientRect();

            // // 允许元素最多移出屏幕一半的宽度/高度
            // const maxX = windowWidth - elementRect.width / 2;
            // const maxY = windowHeight - elementRect.height / 2;
            // const minX = -elementRect.width / 2;
            // const minY = -elementRect.height / 2;

            // currentX = Math.min(Math.max(currentX, minX), maxX);
            // currentY = Math.min(Math.max(currentY, minY), maxY);

            setTranslate(currentX, currentY, subtitleTranslationDiv);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // 添加事件监听器
    dragHandle.addEventListener("touchstart", dragStart, false);
    dragHandle.addEventListener("touchend", dragEnd, false);
    dragHandle.addEventListener("touchmove", drag, false);

    dragHandle.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mousemove", drag, false);
    document.addEventListener("mouseup", dragEnd, false);
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
                    transform: translate3d(0, 0, 0);
                `;
                document.body.appendChild(subtitleTranslationDiv);
                addClose();
                addCopy();
                addDragFeature(); // 添加拖拽功能
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
        showPolishDiv(request.text, request.originalText);
    }
});

// 确保 DOM 加载完成后再初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log("Content script DOM ready");
    // 初始化相关代码...
});
