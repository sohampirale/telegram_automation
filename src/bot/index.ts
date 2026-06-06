import { Telegraf, Scenes, session } from 'telegraf'
import { visitWizard } from '../scenes/visitScene.js'
import { connectDB } from '../storage/database.js'
import { MongoSessionStore } from '../storage/sessionStore.js'

const BOT_TOKEN = process.env.BOT_TOKEN!

let _bot: Telegraf<Scenes.WizardContext> | null = null

export async function getBot(): Promise<Telegraf<Scenes.WizardContext>> {
  if (_bot) {
    console.log('[bot] returning cached instance')
    return _bot
  }
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN environment variable is required')

  console.log('[bot] initializing...')
  await connectDB()
  console.log('[bot] MongoDB connected')

  const store = new MongoSessionStore()
  const stage = new Scenes.Stage<Scenes.WizardContext>([visitWizard])

  const bot = new Telegraf<Scenes.WizardContext>(BOT_TOKEN)

  bot.use(session({ store }))

  bot.use(async (ctx, next) => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === 'cancel_visit') {
      await ctx.answerCbQuery()
      if (ctx.session) delete (ctx.session as any).__scenes
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] }).catch(() => {})
      await ctx.reply('❌ Visit cancelled. Use /start to begin a new visit.')
      return
    }
    return next()
  })

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

  _bot = bot
  return bot
}
