import type { Dealer } from '../types/index.js'

function seededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = seededRandom(42)

const prefixes = [
  'Shri', 'Shree', 'Sri', 'Baba', 'Maa', 'Jai', 'Om', 'New', 'Royal', 'Super',
  'Modern', 'National', 'Global', 'United', 'Prime', 'Metro', 'City', 'Farm',
  'Green', 'Golden', 'Silver', 'Diamond', 'Star', 'Sun', 'Moon', 'Reliance',
  'Perfect', 'Noble', 'Excel', 'Elite', 'Supreme', 'Bright', 'Evergreen',
  'Laxmi', 'Ganesh', 'Shiv', 'Krishna', 'Durga', 'Sai', 'Radha', 'Ram',
  'Balaji', 'Tirupati', 'Surya', 'Agro', 'Bio', 'Eco', 'Organic',
]

const roots = [
  'Agro', 'Farms', 'Crops', 'Seeds', 'Fertilizers', 'Pesticides', 'Herbals',
  'Traders', 'Suppliers', 'Distributors', 'Enterprises', 'Industries',
  'Corporation', 'Agencies', 'Solutions', 'Products', 'Organics',
  'Kisaan', 'Krishi', 'Khet', 'Vikas', 'Udyog', 'Sadan', 'Bhandar',
  'Mills', 'Estates', 'Gardens', 'Nursery', 'Plantations',
]

const suffixes = [
  'Pvt Ltd', 'Ltd', 'LLP', '& Co', '& Sons', 'Group', 'International', '',
  '', '', '',
]

function generateDealers(): Dealer[] {
  const names = new Set<string>()
  let id = 1

  while (names.size < 100) {
    const p = prefixes[Math.floor(rand() * prefixes.length)]
    const r = roots[Math.floor(rand() * roots.length)]
    const s = suffixes[Math.floor(rand() * suffixes.length)]

    let name = `${p} ${r}`
    if (s) name += ` ${s}`

    if (!names.has(name)) {
      names.add(name)
    }
  }

  return Array.from(names).map((name) => ({
    id: String(id++),
    name,
  }))
}

const dealers: Dealer[] = generateDealers()

export function getDealers(): Dealer[] {
  return dealers
}

export function getDealerById(id: string): Dealer | undefined {
  return dealers.find((d) => d.id === id)
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
  }

  return dp[m][n]
}

export function searchDealers(query: string): Dealer[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const queryWords = q.split(/\s+/).filter(Boolean)

  // Pass 1: exact substring match (handles correct spellings)
  const exactMatchIds = new Set<string>()
  const exactMatches: Dealer[] = []

  for (const d of dealers) {
    const name = d.name.toLowerCase()
    if (name.includes(q)) {
      exactMatchIds.add(d.id)
      exactMatches.push(d)
    }
  }

  // Pass 2: fuzzy word-level matching (handles typos)
  const fuzzyResults: Array<{ dealer: Dealer; score: number }> = []

  for (const dealer of dealers) {
    if (exactMatchIds.has(dealer.id)) continue

    const nameWords = dealer.name.toLowerCase().split(/\s+/).filter(Boolean)
    let totalScore = 0

    for (const qw of queryWords) {
      let bestWordScore = 0
      for (const nw of nameWords) {
        const maxLen = Math.max(qw.length, nw.length)
        if (maxLen === 0) continue
        const dist = levenshtein(qw, nw)
        const score = 1 - dist / maxLen
        if (score > bestWordScore) {
          bestWordScore = score
        }
      }
      totalScore += bestWordScore
    }

    const avgScore = queryWords.length > 0 ? totalScore / queryWords.length : 0
    // threshold: 0.5 means at least 50% character similarity per query word
    if (avgScore >= 0.5) {
      fuzzyResults.push({ dealer, score: avgScore })
    }
  }

  fuzzyResults.sort((a, b) => b.score - a.score)

  return [...exactMatches, ...fuzzyResults.map((r) => r.dealer)]
}
