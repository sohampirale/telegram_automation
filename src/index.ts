import 'dotenv/config'
import { getBot } from './bot/index.js'

const bot = await getBot()

bot.launch().then(() => {
  console.log('Bot running in polling mode')
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
