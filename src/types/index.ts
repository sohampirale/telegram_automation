export interface Dealer {
  id: string
  name: string
}

export interface VisitType {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
}

export interface VisitSession {
  dealerId: string
  dealerName: string
  visitTypeId: string
  visitTypeName: string
  productIds: string[]
  productNames: string[]
  notes: string
  photoFileId?: string
}

export interface CompletedVisit {
  id: number
  dealerName: string
  visitTypeName: string
  products: string
  notes: string
  photoFileId: string | null
  timestamp: string
  userId: number
}
