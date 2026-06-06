import type { IncomingMessage, ServerResponse } from 'node:http'
import { getBot } from '../src/bot/index.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const start = Date.now()
  console.log(`[bot] ${req.method} ${req.url}`)

  try {
    const bot = await getBot()

    if (req.method === 'POST') {
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(chunk)
      const body = JSON.parse(Buffer.concat(chunks).toString())
      const updateId = body.update_id

      console.log(`[bot] processing update ${updateId} (${Date.now() - start}ms)`)

      await bot.handleUpdate(body)

      console.log(`[bot] update ${updateId} done (${Date.now() - start}ms)`)
      res.statusCode = 200
      res.end('OK')
    } else {
      const info = await bot.telegram.getMe()
      console.log(`[bot] health check — bot @${info.username}`)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true, bot: info.username }))
    }
  } catch (err) {
    console.error(`[bot] error (${Date.now() - start}ms):`, err)
    res.statusCode = 500
    res.end('Internal Server Error')
  }
}
