class LLMApiClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiURL = config.apiURL;
    this.provider = config.provider;
    this.model = config.model || this.getDefaultModel(this.provider);
    this.apiURL = config.apiURL || this.getDefaultApiURL(this.provider);
  }

  getDefaultModel(provider) {
    switch (provider) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'anthropic':
        return 'claude-3-5-haiku-20241022';
      case 'deepseek':
        return 'deepseek-chat';
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  getDefaultApiURL(provider) {
    switch (provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'anthropic':
        return 'https://api.anthropic.com';
      case 'deepseek':
        return 'https://api.deepseek.com';
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async generateText(options) {
    try {
      switch (this.provider) {
        case 'openai':
          return await this.generateTextOpenAIStream(options);
        case 'anthropic':
          return await this.generateTextAnthropicStream(options);
        case 'deepseek':
          return await this.generateTextOpenAIStream(options);
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      console.error(`Error generating text with ${this.provider}:`, error);
      return null;
    }
  }

  async generateTextAnthropicStream(options) {
    const url = `${this.apiURL}/v1/messages`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': "true",
    });

    const defaultModel = this.model || 'claude-3-5-haiku-20241022';
    const body = JSON.stringify({
      model: defaultModel,
      messages: [{ role: 'user', content: options.prompt }],
      max_tokens: options.max_tokens || 1024,
      stream: true // 启用流式传输
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text(); // 如果不是 JSON，尝试获取文本
      }
      throw new Error(`Anthropic API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamClosed = false; // 添加一个标志来跟踪流是否已关闭

    return new ReadableStream({
      start(controller) {
        function push() {
          reader.read().then(({ done, value }) => {
            if (streamClosed) { // 如果流已经被关闭，则不再处理
              return;
            }

            if (done) {
              if (!streamClosed) {
                controller.close();
                streamClosed = true;
              }
              return;
            }
            const chunk = decoder.decode(value);
            chunk.split('\n')
              .filter(line => line.startsWith('data: '))
              .map(line => line.substring(6))
              .forEach(data => {
                try {
                  const json = JSON.parse(data);
                  if (json.type === 'content_block_delta' && json.delta?.text) {
                    controller.enqueue(json.delta.text);
                  } else if (json.type === 'message_stop') {
                    if (!streamClosed) {
                      controller.close();
                      streamClosed = true;
                    }
                  }
                } catch (e) {
                  console.error("Error parsing JSON data:", e, data);
                  if (!streamClosed) {
                    controller.error(e);
                    streamClosed = true;
                  }
                }
              });
            push();
          }).catch(error => {
            console.error("Stream reading error:", error);
            if (!streamClosed) {
              controller.error(error);
              streamClosed = true;
            }
          });
        }
        push();
      }
    });
  }

    async generateTextOpenAIStream(options) {
        const url = `${this.apiURL}/chat/completions`;
        const headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        });

        const defaultModel = this.model || 'gpt-4o-mini';
        const body = JSON.stringify({
            model: defaultModel,
            messages: [{ role: 'user', content: options.prompt }],
            temperature: options.temperature || 1.3,
            max_tokens: options.max_tokens || 1024,
            stream: true // 启用流式传输
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (e) {
                errorBody = await response.text(); // 如果不是 JSON，尝试获取文本
            }
            throw new Error(`OpenAI API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let streamClosed = false; // 添加一个标志来跟踪流是否已关闭

        return new ReadableStream({
            start(controller) {
                function push() {
                    reader.read().then(({ done, value }) => {
                        if (streamClosed) { // 如果流已经被关闭，则不再处理
                            return;
                        }
                        if (done) {
                            if (!streamClosed) {
                                controller.close();
                                streamClosed = true;
                            }
                            return;
                        }
                        const chunk = decoder.decode(value);
                        chunk.split('\n')
                            .filter(line => line.startsWith('data: '))
                            .map(line => line.substring(6))
                            .filter(data => data !== '[DONE]')
                            .forEach(data => {
                                try {
                                    const json = JSON.parse(data);
                                    const content = json.choices[0].delta.content;
                                    if (content) {
                                        controller.enqueue(content);
                                    }
                                } catch (e) {
                                    console.error("Error parsing JSON data:", e, data);
                                    controller.error(e); // 传递错误到流
                                    if (!streamClosed) {
                                        controller.error(e);
                                        streamClosed = true;
                                    }
                                }
                            });
                        push();
                    }).catch(error => {
                        console.error("Stream reading error:", error);
                        controller.error(error); // 传递错误到流
                    });
                }
                push();
            }
        });
    }

  async generateTextOpenAI(options) {
    const url = `${this.apiURL}/chat/completions`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    });

    const defaultModel = this.model || 'gpt-4o-mini';
    const body = JSON.stringify({
      model: defaultModel,
      messages: [{ role: 'user', content: options.prompt }],
      temperature: options.temperature,
      max_tokens: options.max_tokens || 1024,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`OpenAI API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateTextAnthropic(options) {
    const url = `${this.apiURL}/v1/messages`;
    const headers = new Headers({
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': "true",
    });

    const defaultModel = this.model || 'claude-3-5-haiku-20241022';
    const body = JSON.stringify({
      model: defaultModel,
      messages: [{ role: 'user', content: options.prompt }],
      max_tokens: options.max_tokens || 1024,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Anthropic API Error: ${response.status} - ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }
}

export { LLMApiClient };
