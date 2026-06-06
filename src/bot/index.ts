import { Telegraf, Scenes, session } from 'telegraf'
import { visitWizard } from '../scenes/visitScene.js'

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required')
  process.exit(1)
}

const stage = new Scenes.Stage<Scenes.WizardContext>([visitWizard])

const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN)

bot.use(session())
bot.use(stage.middleware())

bot.start(async (ctx) => {
  await ctx.reply(
    '👋 Welcome to Visit Reporter Bot!\n\nUse the button below to start a new dealer visit report.',
    {
      reply_markup: {
        keyboard: [[{ text: 'Start Visit' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    },
  )
})

bot.hears('Start Visit', async (ctx) => {
  await ctx.scene.enter('visit-wizard')
})

bot.hears('/start', async (ctx) => {
  await ctx.reply(
    '👋 Welcome to Visit Reporter Bot!\n\nUse the button below to start a new dealer visit report.',
    {
      reply_markup: {
        keyboard: [[{ text: 'Start Visit' }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    },
  )
})

export default bot
