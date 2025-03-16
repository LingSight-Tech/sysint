import Router from '@koa/router'
import { BusinessException } from '../error/error.mjs'
import { defaultStorage as store } from '../infra/storage.mjs'
import { defaultStaticJsonFileConfigCenter as config } from '../infra/config/bootstrap.mjs'
import { uuid } from '../util/random.mjs'
import { UserSession } from './wechat.mjs'
import { logger } from '../infra/logger.mjs'
import fetch from 'node-fetch'
import Koa from 'koa'

const conversationRouter = new Router()

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


const respond = (ctx: Koa.Context, status: number, success: boolean, message: string, data: any) => {
  ctx.status = status
  ctx.body = {
    success,
    message,
    data
  }
}

conversationRouter.post('/conversation', async (ctx, next) => {
  const initConversion = JSON.stringify([
    {
      contentParts: [{
        type: 'text',
        content: config.get('openai-api-compatible-llm.default-prompt')
      }],
      role: 'system'
    }
  ])

  const conversationId = uuid()
  await store.createConversation(ctx.state.user.id, conversationId, initConversion)

  respond(ctx, 200, true, 'ok', { conversationId })
})

conversationRouter.post('/completions', async (ctx, next) => {
  let { conversationId, messages: inputMessages } = ctx.request.body

  if (!conversationId) {
    respond(ctx, 400, false, 'conversationId is required', null)
    return
  }

  const conversation = await store.getConversation(conversationId)
  if (!conversation || !conversation.historyJson) {
    respond(ctx, 404, false, 'conversation not found', null)
    return
  }

  const history = conversation.historyJson as ChatMessage[]

  if (!isChatMessageArray(inputMessages) || inputMessages.length === 0) {
    respond(ctx, 400, false, 'messages is required', null)
    return
  }

  try {
    const response = await callLlm(history, inputMessages)

    if (!response.ok) {
      respond(ctx, 500, false, 'Failed to get a valid response from the DeepSeek API', null)
      response.text().then(data => {
        logger.error('Failed to get a valid response from the DeepSeek API: ' + JSON.stringify(data))
      })
      return
    }

    ctx.type = 'text/event-stream'
    ctx.status = 200

    const reader = response.body
    if (!reader) {
      respond(ctx, 500, false, 'Failed to get a valid response from the DeepSeek API', null)
      return;
    }

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

    await store.updateConversation(conversationId, JSON.stringify(merge(history, inputMessages, [newMessage])))
  } catch (e) {
    logger.error('Failed to get a valid response from the DeepSeek API: ' + e)
    if (e instanceof BusinessException) {
      respond(ctx, e.status, false, e.message, null)
      return
    }

    respond(ctx, 500, false, 'Internal Server Error', null)
  }
})

conversationRouter.get('/conversation', async (ctx, next) => {
  const { conversationId } = ctx.query

  if (!conversationId) {
    respond(ctx, 400, false, 'conversationId is required', null)
    return
  }

  try {
    const conversation = await store.getConversation(conversationId as string)
    if (!conversation) {
      respond(ctx, 404, false, 'Conversation not found', null)
      return;
    }

    respond(ctx, 200, true, 'ok', { messages: conversation.historyJson })
  } catch (e) {
    respond(ctx, 500, false, 'Internal Server Error', null)
  }
})

conversationRouter.get('/conversation-list', async (ctx, next) => {
  let page = parseIntOrDefault(ctx.query.page, 1)
  let pageSize = parseIntOrDefault(ctx.query.pageSize, 10)

  try {
    const conversations = await store.getConversationsPage(ctx.state.user.id, /* offset */(page - 1) * pageSize, /* limit */ pageSize)
    const total = conversations.length
    const list = conversations.map(conversation => ({ conversationId: conversation.uuid, preview: getPreview(conversation.historyJson as ChatMessage[]) }))

    respond(ctx, 200, true, 'ok', { total, list })
  } catch (e) {
    respond(ctx, 500, false, 'Internal Server Error', null)
  }
})

export { conversationRouter }
async function callLlm(history: ChatMessage[], inputMessages: ChatMessage[]) {
  return await fetch(config.get('openai-api-compatible-llm.url'), {
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
}

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

function getPreview(messages: ChatMessage[]): string {
  if (messages.length === 0) {
    return 'default'
  }

  return messages.find(m => m.role === 'user')?.contentParts?.map(part => part?.content ?? '')?.join('')?.slice(0, 50) ?? 'default'
}

