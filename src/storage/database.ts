import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

const visitSchema = new mongoose.Schema({
  dealerName: { type: String, required: true },
  visitTypeName: { type: String, required: true },
  products: { type: String, required: true },
  notes: { type: String, default: '' },
  photoFileId: { type: String, default: null },
  timestamp: { type: String, required: true },
  userId: { type: Number, required: true },
  userName: { type: String, default: '' },
})

const sessionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
})

export const VisitModel = mongoose.models.Visit || mongoose.model('Visit', visitSchema)
export const SessionModel = mongoose.models.Session || mongoose.model('Session', sessionSchema)

const cached: { conn?: typeof mongoose } = {}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) throw new Error('MONGODB_URI environment variable is required')
  if (cached.conn) {
    console.log('[db] using cached connection')
    return cached.conn
  }
  console.log('[db] connecting...')
  cached.conn = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  console.log('[db] connected')
  return cached.conn
}

export async function saveVisit(data: {
  dealerName: string
  visitTypeName: string
  products: string
  notes: string
  photoFileId: string | null
  timestamp: string
  userId: number
  userName: string
}): Promise<void> {
  await VisitModel.create(data)
}
