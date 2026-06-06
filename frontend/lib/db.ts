import mongoose from 'mongoose'

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

export const VisitModel = mongoose.models.Visit || mongoose.model('Visit', visitSchema)

const cached: { conn?: typeof mongoose } = {}

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is required')
  if (cached.conn) return cached.conn
  cached.conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  return cached.conn
}
