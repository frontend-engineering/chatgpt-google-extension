import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

export class OpenAIProvider implements Provider {
  constructor(private token: string, private model: string) {
    this.token = token
    this.model = model
  }

  private buildPrompt(prompt: string): any[] {
    const startToken = '||>'
    const endToken = ''
    const currentDateString = new Date().toString()
    const promptPrefix = `${startToken}Instructions:\nYou are ChatGPT, a large language model trained by OpenAI. Respond conversationally.\nCurrent date: ${currentDateString}${endToken}\n\n`
    const promptSuffix = `${startToken}ChatGPT:\n` // Prompt ChatGPT to respond.

    const instructionsPayload = {
      role: 'system',
      name: 'instructions',
      content: promptPrefix,
    }

    const messagePayload = {
      role: 'system',
      name: 'user',
      content: `${prompt} ${promptSuffix}`,
    }
    return [instructionsPayload, messagePayload]
    // if (this.model.startsWith('text-chat-davinci')) {
    //   return `Respond conversationally.<|im_end|>\n\nUser: ${prompt}<|im_sep|>\nChatGPT:`
    // }
    // return prompt
  }

  async generateAnswer(params: GenerateAnswerParams) {
    let result = ''

    await fetchSSE('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.buildPrompt(params.prompt),
        stream: true,
        max_tokens: 2048,
      }),
      onMessage(message) {
        console.debug('sse message', message)
        if (message?.data === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        let data
        try {
          data = JSON.parse(message?.data)
          const text = data.choices[0]?.delta?.content
          if (!text) {
            return
          }
          if (text === '<|im_end|>' || text === '<|im_sep|>') {
            return
          }
          result += text
          params.onEvent({
            type: 'answer',
            data: {
              text: result,
              messageId: data.id,
              conversationId: data.id,
            },
          })
        } catch (err) {
          console.error(err)
          return
        }
      },
    })
    return {}
  }
}
