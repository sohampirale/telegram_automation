import { Scenes, Markup } from 'telegraf'
import type { VisitSession } from '../types/index.js'
import { getDealerById, searchDealers } from '../services/dealerService.js'
import { getVisitTypes, getVisitTypeById } from '../services/visitTypeService.js'
import { getProducts, getProductById } from '../services/productService.js'
import { saveVisit } from '../storage/database.js'

const MAX_RESULTS = 20

interface WizardSession extends Scenes.WizardSessionData {
  visit?: VisitSession
  selectedProductIds?: string[]
}

const CANCEL = Markup.button.callback('❌ Cancel', 'cancel_visit')

function buildDealerKeyboard(matched: ReturnType<typeof searchDealers>): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons = matched.slice(0, MAX_RESULTS).map((d) => Markup.button.callback(d.name, `dealer_${d.id}`))
  return Markup.inlineKeyboard([...buttons, CANCEL], { columns: 1 })
}

function buildVisitTypeKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  const types = getVisitTypes()
  const buttons = types.map((t) => Markup.button.callback(t.name, `visittype_${t.id}`))
  return Markup.inlineKeyboard([...buttons, CANCEL], { columns: 1 })
}

function buildProductKeyboard(selectedIds: string[]): ReturnType<typeof Markup.inlineKeyboard> {
  const products = getProducts()
  const buttons = products.map((p) => {
    const checked = selectedIds.includes(p.id) ? '✅ ' : ''
    return Markup.button.callback(`${checked}${p.name}`, `product_${p.id}`)
  })
  buttons.push(Markup.button.callback('✅ Done', 'product_done'))
  return Markup.inlineKeyboard([...buttons, CANCEL], { columns: 1 })
}

export const visitWizard = new Scenes.WizardScene<Scenes.WizardContext<WizardSession>>(
  'visit-wizard',

  // Step 0: Dealer search prompt
  async (ctx) => {
    console.log(`[scene] step 0: search prompt (user ${ctx.from?.id})`)
    await ctx.reply(
      '🔍 *Search for a dealer:*\n\nType part of the dealer name to find them.',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([CANCEL]),
      },
    )
    ctx.wizard.next()
  },

  // Step 1: Dealer search & selection
  async (ctx) => {
    const input = ctx.callbackQuery && 'data' in ctx.callbackQuery ? ctx.callbackQuery.data : 'text'
    console.log(`[scene] step 1: user ${ctx.from?.id} input=${input}`)

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data

      if (data.startsWith('dealer_')) {
        const dealerId = data.replace('dealer_', '')
        const dealer = getDealerById(dealerId)
        if (!dealer) {
          await ctx.answerCbQuery('Invalid dealer.')
          return
        }

        ;(ctx.wizard.state as WizardSession).visit = {
          dealerId: dealer.id,
          dealerName: dealer.name,
        } as VisitSession

        await ctx.answerCbQuery()
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
        await ctx.reply(`Selected dealer: *${dealer.name}*\n\nNow select visit type:`, {
          parse_mode: 'Markdown',
          ...buildVisitTypeKeyboard(),
        })
        ctx.wizard.next()
        return
      }
    }

    if (ctx.message && 'text' in ctx.message) {
      const text = ctx.message.text
      const matched = searchDealers(text)

      if (matched.length === 0) {
        await ctx.reply('No dealers found matching that name. Try a different search.', {
          ...Markup.inlineKeyboard([CANCEL]),
        })
        return
      }

      const shown = matched.slice(0, MAX_RESULTS)
      const remaining = matched.length - shown.length
      let msg = shown.map((d) => `• ${d.name}`).join('\n')
      if (remaining > 0) {
        msg += `\n\n_Showing ${shown.length} of ${matched.length} — refine your search for more specific results._`
      }
      await ctx.reply(`*Matching dealers:*\n${msg}\n\nSelect one:`, {
        parse_mode: 'Markdown',
        ...buildDealerKeyboard(matched),
      })
      return
    }

    await ctx.reply('Please type part of a dealer name to search.', {
      ...Markup.inlineKeyboard([CANCEL]),
    })
  },

  // Step 2: Select visit type
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      await ctx.reply('Please select a visit type using the buttons below.', buildVisitTypeKeyboard())
      return
    }

    const data = ctx.callbackQuery.data
    if (!data.startsWith('visittype_')) {
      await ctx.reply('Please select a visit type using the buttons below.', buildVisitTypeKeyboard())
      return
    }

    const visitTypeId = data.replace('visittype_', '')
    const visitType = getVisitTypeById(visitTypeId)
    if (!visitType) {
      await ctx.reply('Invalid visit type. Please try /start again.')
      return ctx.scene.leave()
    }

    const state = ctx.wizard.state as WizardSession
    if (state.visit) {
      state.visit.visitTypeId = visitType.id
      state.visit.visitTypeName = visitType.name
    }
    state.selectedProductIds = []

    await ctx.answerCbQuery()
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
    await ctx.reply(
      `Dealer: *${state.visit?.dealerName}*\nVisit Type: *${visitType.name}*\n\nNow select products (you can select multiple):`,
      {
        parse_mode: 'Markdown',
        ...buildProductKeyboard([]),
      },
    )
    ctx.wizard.next()
  },

  // Step 3: Select products
  async (ctx) => {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return
    }

    const data = ctx.callbackQuery.data
    const state = ctx.wizard.state as WizardSession
    const selected = state.selectedProductIds || []

    if (data === 'product_done') {
      if (selected.length === 0) {
        await ctx.answerCbQuery('Please select at least one product.')
        return
      }

      const productNames = selected.map((id) => getProductById(id)!.name)
      if (state.visit) {
        state.visit.productIds = selected
        state.visit.productNames = productNames
      }

      await ctx.answerCbQuery()
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      await ctx.reply(
        `Products: *${productNames.join(', ')}*\n\nAdd any notes:`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([Markup.button.callback('Skip notes', 'skip_notes'), CANCEL]),
        },
      )
      ctx.wizard.next()
      return
    }

    if (data.startsWith('product_')) {
      const productId = data.replace('product_', '')
      const idx = selected.indexOf(productId)
      if (idx >= 0) {
        selected.splice(idx, 1)
      } else {
        selected.push(productId)
      }
      state.selectedProductIds = selected

      await ctx.editMessageReplyMarkup(buildProductKeyboard(selected).reply_markup)
      await ctx.answerCbQuery()
    }
  },

  // Step 4: Notes (text or skip callback)
  async (ctx) => {
    const state = ctx.wizard.state as WizardSession

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === 'skip_notes') {
      await ctx.answerCbQuery()
      if (state.visit) {
        state.visit.notes = ''
      }
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      await ctx.reply(
        'Thanks! Do you want to add a photo? (optional)\nSend a photo or click "Skip" to finish.',
        Markup.inlineKeyboard([Markup.button.callback('Skip', 'skip_photo'), CANCEL]),
      )
      ctx.wizard.next()
      return
    }

    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send a text message for notes, or click "Skip notes".', {
        ...Markup.inlineKeyboard([Markup.button.callback('Skip notes', 'skip_notes'), CANCEL]),
      })
      return
    }

    if (state.visit) {
      state.visit.notes = ctx.message.text
    }

    await ctx.reply(
      'Thanks! Do you want to add a photo? (optional)\nSend a photo or click "Skip" to finish.',
      Markup.inlineKeyboard([Markup.button.callback('Skip', 'skip_photo'), CANCEL]),
    )
    ctx.wizard.next()
  },

  // Step 5: Optional photo
  async (ctx) => {
    const state = ctx.wizard.state as WizardSession

    if (ctx.callbackQuery && 'data' in ctx.callbackQuery && ctx.callbackQuery.data === 'skip_photo') {
      await ctx.answerCbQuery()
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      await showSummary(ctx, state)
      return ctx.scene.leave()
    }

    if (ctx.message && 'photo' in ctx.message) {
      const photoArray = ctx.message.photo
      if (photoArray && photoArray.length > 0) {
        const fileId = photoArray[photoArray.length - 1].file_id
        if (state.visit) {
          state.visit.photoFileId = fileId
        }
      }
      await showSummary(ctx, state)
      return ctx.scene.leave()
    }

    await ctx.reply('Please send a photo or click "Skip".', {
      ...Markup.inlineKeyboard([Markup.button.callback('Skip', 'skip_photo'), CANCEL]),
    })
  },
)

async function showSummary(ctx: Scenes.WizardContext<WizardSession>, state: WizardSession): Promise<void> {
  const visit = state.visit
  if (!visit) {
    console.log('[scene] showSummary called with no visit data')
    await ctx.reply('Something went wrong. Please start again with /start.')
    return
  }

  const timestamp = new Date().toISOString()
  console.log(`[scene] saving visit: ${visit.dealerName} / ${visit.visitTypeName}`)

  saveVisit({
    dealerName: visit.dealerName,
    visitTypeName: visit.visitTypeName,
    products: visit.productNames.join(', '),
    notes: visit.notes || '',
    photoFileId: visit.photoFileId || null,
    timestamp,
    userId: ctx.from?.id || 0,
  })

  let msg = `✅ *Visit Report Saved*\n\n`
  msg += `*Dealer:* ${visit.dealerName}\n`
  msg += `*Visit Type:* ${visit.visitTypeName}\n`
  msg += `*Products:* ${visit.productNames.join(', ')}\n`
  msg += `*Notes:* ${visit.notes || '(none)'}\n`
  msg += `*Timestamp:* ${new Date(timestamp).toLocaleString()}\n`

  await ctx.reply(msg, { parse_mode: 'Markdown' })
  await ctx.reply('Use /start to begin a new visit.')
}
