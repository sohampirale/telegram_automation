import { SessionModel } from './database.js'

export class MongoSessionStore {
  async get(key: string): Promise<any> {
    const doc = await SessionModel.findOne({ key }).lean()
    return doc?.data ?? undefined
  }

  async set(key: string, value: any): Promise<void> {
    await SessionModel.updateOne({ key }, { key, data: value }, { upsert: true })
  }

  async delete(key: string): Promise<void> {
    await SessionModel.deleteOne({ key })
  }
}
