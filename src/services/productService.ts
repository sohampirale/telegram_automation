import type { Product } from '../types/index.js'

const products: Product[] = [
  { id: '1', name: 'Bio Fertilizer' },
  { id: '2', name: 'Growth Booster' },
  { id: '3', name: 'Seeds' },
  { id: '4', name: 'Pesticide' },
]

export function getProducts(): Product[] {
  return products
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}
