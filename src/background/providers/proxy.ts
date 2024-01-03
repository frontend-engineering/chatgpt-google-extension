import { fetchSSE } from '../fetch-sse'
import { GenerateAnswerParams, Provider } from '../types'

async function request(token: string, method: string, path: string, data?: unknown) {
  return fetch(`https://chat.openai.com/backend-api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
}

export async function sendMessageFeedback(token: string, data: unknown) {
  // TODO
  // await request(token, 'POST', '/conversation/message_feedback', data)
  return
}

export async function getProxyAccessToken(): Promise<string> {
  // TODO: SDK login
  return ''
}

export class ProxyProvider implements Provider {
  constructor(private token: string) {
    this.token = token
  }

  private async getModelName(): Promise<string> {
    // TODO: 先写死3.5 turbo
    return 'gpt-3.5-turbo'
  }

  async applyHash(prompt: string) {
    return fetch('https://api.webinfra.cloud/v1-flowda-api/zhiplus/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        question: prompt,
      }),
    })
      .then((resp) => resp.json())
      .then((resp) => {
        if (resp.success) {
          return resp.data
        }
        throw new Error(resp.message || 'unauthorized')
      })
  }

  async generateAnswer(params: GenerateAnswerParams) {
    const modelName = await this.getModelName()
    console.debug('Using model:', modelName)
    const hashResp = await this.applyHash(params.prompt).catch((err) => {
      // Error1: Limit Reached
      // Error2: Unauthorized
      console.error('apply failed: ', err)
      params.onEvent({ type: 'error', data: { message: err?.message || 'unauthorized' } })
    })
    const { id, hash } = hashResp || {}
    console.log('hash rep: ', id, hash)
    if (!hash || !id) {
      return {}
    }
    let result = ''
    await fetchSSE('http://my.webinfra.cloud/api/chat', {
      method: 'POST',
      signal: params.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        message: params.prompt,
        stream: true,
        hash,
      }),
      onMessage(message: any) {
        console.debug('proxy sse message', message)
        if (message.data === '[DONE]') {
          params.onEvent({ type: 'done' })
          return
        }
        if (message?.event === 'error') {
          params.onEvent({ type: 'error', data: JSON.parse(message.data) })
          return
        }

        if (message.event === 'result') {
          const resp = JSON.parse(message.data)
          console.log('result: ', resp.response)
          const msgId = resp.messageId
          const conversationId = resp.conversationId
          const finalResp = resp.response
          if (finalResp?.length > result?.length) {
            console.log('use returned full response: ', finalResp)
            result = finalResp
          }
          params.onEvent({
            type: 'result',
            data: {
              text: result,
              messageId: msgId,
              conversationId: conversationId,
            },
          })
          return
        }
        // partial response body event
        result += JSON.parse(message.data)
        params.onEvent({
          type: 'answer',
          data: {
            text: result,
            messageId: '',
            conversationId: '',
          },
        })

        return
      },
    })
    return {}
  }
}
