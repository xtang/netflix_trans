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
    if (!subtitleTranslationDiv) {
        createPolishDiv()
            .then(() => {
                const polishText = document.getElementById('subtitle-translate-text');
                subtitleTranslationDiv.style.display = 'block';
                polishText.textContent = text;
                const originalTextP = document.getElementById("subtitle-translate-origin-text");
                originalTextP.textContent = originalText
            })
            .catch(error => {
                console.error(error);
            });
    } else {
        const polishText = document.getElementById('subtitle-translate-text');
        subtitleTranslationDiv.style.display = 'block';
        polishText.textContent = text;
        const originalTextP = document.getElementById("subtitle-translate-origin-text");
        originalTextP.textContent = originalText
    }
}

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

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
