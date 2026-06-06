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

export function searchDealers(query: string): Dealer[] {
  const q = query.toLowerCase()
  return dealers.filter((d) => d.name.toLowerCase().includes(q))
}
