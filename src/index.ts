import 'dotenv/config'
import bot from './bot/index.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : undefined

bot.launch({ webhook: PORT ? { domain: process.env.WEBHOOK_DOMAIN || '', port: PORT } : undefined }).then(() => {
  const mode = PORT ? `webhook on port ${PORT}` : 'polling'
  console.log(`Bot running in ${mode} mode`)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
