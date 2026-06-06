import type { IncomingMessage, ServerResponse } from 'node:http'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const token = process.env.BOT_TOKEN
  if (!token) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'BOT_TOKEN not set' }))
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`).searchParams.get('url')
  if (!url) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing ?url= query param' }))
    return
  }

  const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURI(url)}`, {
    method: 'POST',
  })
  const data = await r.json()

  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}
