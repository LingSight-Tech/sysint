import Router from '@koa/router'
import { BusinessException } from '../error/error.mjs'
import { defaultDistributedCache as store } from '../integration/cache.mjs'
import { defaultStaticJsonFileConfigCenter as config } from '../infra/config.mjs'
import { uuid } from '../util/random.mjs'
import { UserSession } from './wechat.mjs'
import { logger } from '../infra/logger.mjs'
import fetch from 'node-fetch'

const conversationRouter = new Router()

const ONE_WEEK_MILLS = 30 * 24 * 60 * 60 * 1000

interface ChatMessage {
  contentParts: {
    type: 'text' | 'image'
    content: string
  }[]
  role: 'system' | 'user' | 'assistant'
}

interface CompatibleChatMessage {
  content: string
  role: 'system' | 'user' | 'assistant'
}

interface CompatibleChunkedChatMessage {
  id?: string
  object?: string
  created?: number
  model?: string
  system_fingerprint?: string
  choices?: {
    index?: number
    delta?: {
      content?: string
    }
    logprobs?: null
    finish_reason?: string | null
  }[]
}



conversationRouter.post('/conversation', async (ctx, next) => {
  const sessionSerialized = await store.get(`session:${ctx.get('Authorization').replace('Bearer ', '')}`)
  const session: Partial<UserSession> = safeParse(sessionSerialized)

  const conversationId = uuid()
  store.set(`conversation:${conversationId}`, JSON.stringify([
    {
      contentParts: [{
        type: 'text',
        content: config.get('openai-api-compatible-llm.default-prompt')
      }],
      role: 'system'
    }
  ]), ONE_WEEK_MILLS)

  const conversationsSerialized = await store.get(`all-conversations:${session.openId}`)
  const conversations: string[] = safeParseArray(conversationsSerialized)
  store.set(`all-conversations:${session.openId}`, JSON.stringify([...conversations, conversationId]), ONE_WEEK_MILLS)

  ctx.body = {
    success: true,
    message: 'ok',
    data: {
      conversationId
    }
  }
})

conversationRouter.post('/completions', async (ctx, next) => {
  let { conversationId, messages: inputMessages } = ctx.request.body

  if (!conversationId) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'conversationId is required',
      data: null
    }
  }

  const historySerialized = await store.get(`conversation:${conversationId}`)
  if (!historySerialized) {
    ctx.status = 404
    ctx.body = {
      success: false,
      message: 'conversation not found',
      data: null
    }
  }

  const history = safeParseArray<ChatMessage[]>(historySerialized)

  if (!isChatMessageArray(inputMessages) || inputMessages.length === 0) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'messages is required',
      data: null
    }
    return
  }

  try {
    const response = await fetch(config.get('openai-api-compatible-llm.url'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + config.get('openai-api-compatible-llm.apikey')
      },
      body: JSON.stringify({
        model: config.get('openai-api-compatible-llm.model'),
        messages: merge(toOpenAiForm(history), toOpenAiForm(inputMessages)),
        stream: true
      })
    })

    if (!response.ok) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: 'Failed to get a valid response from the DeepSeek API',
        data: null
      }
      response.text().then(data => {
        logger.error('Failed to get a valid response from the DeepSeek API: ' + JSON.stringify(data))
      })
      return
    }

    ctx.type = 'text/event-stream'
    ctx.status = 200

    const reader = response.body
    if (!reader) {
      ctx.status = 500
      ctx.body = {
        success: false,
        message: 'Failed to get a valid response from the DeepSeek API',
        data: null
      }
      return;
    }

    const decoder = new TextDecoder()

    const newMessage: ChatMessage = {
      contentParts: [{
        type: 'text',
        content: ''
      }],
      role: 'assistant'
    }
    for await (let chunk of reader) {
      chunk = chunk.toString()
      if (!chunk.startsWith('data:')) {
        continue
      }
      let parts = chunk.split('\n\n').map(v => v.replace(/^data: /, '')).filter(v => (v ?? '')?.trim() !== '')
      for (let part of parts) {
        const chunkedMessage: CompatibleChunkedChatMessage = safeParse(part)
        const responseMessage = toChatMessage(chunkedMessage)
        if (responseMessage.contentParts?.[0]?.content === '') {
          continue
        }
        newMessage.contentParts[0].content += responseMessage.contentParts?.[0]?.content
        ctx.res.write(`data: ${JSON.stringify(responseMessage)}\n\n`)
      }
    }

    ctx.res.write('data: [DONE]\n\n')
    ctx.res.end()

    store.set(`conversation:${conversationId}`, JSON.stringify(merge(history, inputMessages, [newMessage])), ONE_WEEK_MILLS)
    const sessionSerialized = await store.get(`session:${ctx.get('Authorization').replace('Bearer ', '')}`)
    const session: Partial<UserSession> = safeParse(sessionSerialized)
    const conversationsSerialized = await store.get(`all-conversations:${session.openId}`)
    const conversations: string[] = safeParseArray(conversationsSerialized)
    store.set(`all-conversations:${session.openId}`, JSON.stringify([...conversations, conversationId]), ONE_WEEK_MILLS)
  } catch (e) {
    logger.error('Failed to get a valid response from the DeepSeek API: ' + e)
    if (e instanceof BusinessException) {
      ctx.status = e.status
      ctx.body = {
        success: false,
        message: e.message,
        data: null
      }
      return
    }

    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal Server Error',
      data: null
    }
  }
})

conversationRouter.get('/conversation', async (ctx, next) => {
  const { conversationId } = ctx.query

  if (!conversationId) {
    ctx.status = 400
    ctx.body = {
      success: false,
      message: 'conversationId is required',
      data: null
    }
    return
  }

  try {
    const historySerialized = conversationId ? await store.get(`conversation:${conversationId}`) : null
    const history = historySerialized ? JSON.parse(historySerialized) : null

    if (!history) {
      ctx.status = 404
      ctx.body = {
        success: false,
        message: 'Conversation not found',
        data: null
      }
      return
    }

    ctx.body = {
      success: true,
      message: 'ok',
      data: {
        messages: history
      }
    }
  } catch (e) {
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal Server Error',
      data: null
    }
  }
})

conversationRouter.get('/conversation-list', async (ctx, next) => {
  let page = parseIntOrDefault(ctx.query.page, 1)
  let pageSize = parseIntOrDefault(ctx.query.pageSize, 10)

  try {
    const sessionSerialized = await store.get(`session:${ctx.get('Authorization').replace('Bearer ', '')}`)
    const session: Partial<UserSession> = safeParse(sessionSerialized)
    const conversationsSerialized = await store.get(`all-conversations:${session.openId}`)
    const conversations: string[] = safeParseArray(conversationsSerialized)
    const total = conversations.length
    const list = conversations.slice((page - 1) * pageSize, page * pageSize)

    ctx.body = {
      success: true,
      message: 'ok',
      data: {
        total,
        list
      }
    }
  } catch (e) {
    ctx.status = 500
    ctx.body = {
      success: false,
      message: 'Internal Server Error',
      data: null
    }
  }
})

export { conversationRouter }
function isChatMessageArray(inputMessages: any): inputMessages is ChatMessage[] {
  return Array.isArray(inputMessages) && inputMessages.every(msg => {
    return Array.isArray(msg.contentParts) && msg.contentParts?.every?.((part: any) => {
      return part.type === 'text' || part.type === 'image'
    }) && (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant')
  })
}

function toChatMessage(message: CompatibleChunkedChatMessage): ChatMessage {
  return {
    contentParts: [{
      type: 'text',
      content: message?.choices?.[0]?.delta?.content ?? '',
    }],
    role: 'assistant'
  }
}

function safeParse<T extends Record<string, any>>(jsonString?: string | null): Partial<T> {
  if (!jsonString) return {}
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    return {}
  }
}

function safeParseArray<T extends any[]>(jsonString?: string | null): T | [] {
  if (!jsonString) return []
  try {
    const arr = JSON.parse(jsonString)
    if (Array.isArray(arr)) {
      return arr as T
    }
    return []
  } catch (e) {
    return []
  }
}

function merge(m1: any[], m2: any[], m3?: any[]): any[] {
  return [
    ...m1, ...m2, ...(m3 ?? [])
  ]
}

function toOpenAiForm(messages: ChatMessage[]): CompatibleChatMessage[] {
  return messages.map(message => {
    return {
      role: message.role,
      content: message.contentParts.map(part => part.content).join('')
    }
  })
}

function parseIntOrDefault(page: unknown, defaultValue: number) {
  try {
    if (typeof page === 'number') {
      return page
    }
    if (typeof page === 'string') {
      return parseInt(page)
    }
  } catch (e) { }
  return defaultValue
}

