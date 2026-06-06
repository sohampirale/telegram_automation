import { NextRequest } from 'next/server'
import { connectDB, VisitModel } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const visits = await VisitModel.find().sort({ timestamp: -1 }).lean()
    return Response.json({ visits })
  } catch (err) {
    console.error('[api/visits] error:', err)
    return Response.json({ error: 'Failed to fetch visits' }, { status: 500 })
  }
}
