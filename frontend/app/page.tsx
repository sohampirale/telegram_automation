'use client'

import { useEffect, useState } from 'react'

interface Visit {
  _id: string
  dealerName: string
  visitTypeName: string
  products: string
  notes: string
  timestamp: string
}

export default function Home() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/visits')
      .then((res) => res.json())
      .then((data) => setVisits(data.visits ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-zinc-900">Visit Reports</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? 'Loading...' : `${visits.length} visit${visits.length === 1 ? '' : 's'} recorded`}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-800" />
          </div>
        ) : visits.length === 0 ? (
          <div className="rounded-lg border bg-white py-20 text-center">
            <p className="text-lg text-zinc-500">No visits recorded yet.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Submit a visit report through the Telegram bot to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                  <th className="px-4 py-3">Dealer</th>
                  <th className="px-4 py-3">Visit Type</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visits.map((v) => (
                  <tr key={v._id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{v.dealerName}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {v.visitTypeName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{v.products}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-zinc-500">{v.notes || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500">
                      {new Date(v.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
