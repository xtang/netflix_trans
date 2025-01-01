# Netflix Subtitle Translator

> Effortlessly overcome language barriers with powerful AI-powered real-time translation for Netflix subtitles!

**Netflix Subtitle Translator** is a browser extension designed to help Netflix users understand video content more efficiently and deeply. It utilizes advanced AI technology to instantly translate subtitles via a right-click menu and provides original text for comparison, helping users better learn languages and understand cultural backgrounds.

## Key Features

* **Instant Right-Click Translation:** On Netflix playback pages, select the subtitle text, right-click, and choose "Translate Subtitle" to view the translation results.
* **AI-Powered Accurate Translation:** Leveraging integrated LLM APIs (supporting OpenAI, Anthropic, DeepSeek) to deliver high-quality, natural-sounding translations.
* **Detailed Analysis Information:** In addition to the translation, it displays syntax analysis, vocabulary analysis (including pronunciation), and cultural background understanding, aiding in in-depth learning.
* **Original Text Comparison:** Translation results are displayed alongside the original subtitle text for easy comparison and learning.
* **Configurable Translation Engine:** Users can select different LLM API providers (OpenAI, Anthropic, DeepSeek) on the options page.
* **Customizable Target Language:** Supports multiple target languages, including Chinese (Simplified), Chinese (Traditional), English, Spanish, Japanese, Korean, Italian, and French.
* **Translation Result Copying:** Provides a one-click function to copy the translated text.
* **Clean UI Presentation:** Translation results are displayed in a clear popup window for easy reading and operation.

## Installation

### Chrome

You can install manually:

1. Clone the repo into your local disk.
2. In the Chrome browser, type `chrome://extensions/` and press Enter.
4. Enable the **Developer mode** toggle in the top right corner.
5. Click **Load unpacked**.
6. Select the source code folder.

## How to Use

0. Setup the provider config. (see below)
1. After installing **Netflix Subtitle Translator**, open Netflix and play the video you want to watch.
2. Ensure subtitles are enabled in the Netflix player.
3. When a subtitle you want to translate appears, **Right-click** with your mouse and select **"Translate Subtitle"** from the context menu.
4. The translation results (including the original text, translation, syntax analysis, vocabulary analysis, and cultural background understanding) will be displayed in a popup window at the top of the page.
5. You can click the "close" button in the top right corner of the popup to close the translation results, or click "copy" to copy the translated text.

## Configuration Options

1. In the browser address bar, type `chrome://extensions/` and press Enter, locate **Netflix Subtitle Translator**.
2. Click the **Details** button.
3. Find and click **Options** (or right-click the extension icon and select "Options").
4. On the options page, you can configure the following:
    * **API Key:** Enter your API Key for OpenAI, Anthropic, or DeepSeek.
    * **Provider:** Select the LLM API provider you want to use (default is OpenAI).
    * **Target Language:** Select the target language you want to translate the subtitles into (default is Chinese Simplified).
5. Click **Save** to save your configurations.

**Note:** You need to have a valid LLM API Key to use the translation functionality.

## Technical Details

* **Background Script (`background.js`):**
    * Listens for right-click menu events and grabs the selected subtitle text.
    * Manages user configurations (API Key, Provider, Target Language).
    * Constructs the prompt sent to the LLM API, containing detailed translation and analysis requests.
    * Uses `llm-api-client.js` (requires user implementation or inclusion) to communicate with the LLM API.
    * Sends translation results to the Content Script for display.
* **Content Script (`content.js`):**
    * When it receives a translation message from the Background Script, it dynamically creates and displays an HTML popup window (`subtitletran.html`) containing the translation results.
    * Provides functionality to close and copy the translation results.
    * Injects custom CSS (`subtitletran.css`) to style the translation results display.
* **Options Page (`options.html`, `options.js`):**
    * Provides a user interface to configure the API Key, API URL, LLM provider, and target language.
    * Uses the `chrome.storage.sync` API to save and load user configurations.
* **LLM API Client (`llm-api-client.js`):**
    * This module is responsible for interacting with different LLM APIs, such as OpenAI's API, Anthropic's API, etc. You need to implement or include the appropriate library based on your chosen provider.

## Contributing

Contributions of any kind are welcome! You can participate by:

* **Submitting Issues:** If you find a bug or have a new feature suggestion, please submit an [Issue](https://github.com/xtang/netflix_trans/issues).
* **Submitting Pull Requests:** If you want to fix a bug or add a new feature, please fork this repository and submit a [Pull Request](https://github.com/xtang/netflix_trans/pulls).
* **Sharing Your Ideas:** Participate in discussions in the [Issues](https://github.com/xtang/netflix_trans/issues).
* **Helping with Promotion:** Share this extension with your friends and colleagues.

## License

This project is licensed under the Apache 2.0 License.

**Thank you for using and supporting!**
