import type { VisitType } from '../types/index.js'

const visitTypes: VisitType[] = [
  { id: '1', name: 'Order Collection' },
  { id: '2', name: 'Product Demo' },
  { id: '3', name: 'Complaint' },
  { id: '4', name: 'Payment Followup' },
  { id: '5', name: 'General Visit' },
]

export function getVisitTypes(): VisitType[] {
  return visitTypes
}

export function getVisitTypeById(id: string): VisitType | undefined {
  return visitTypes.find((v) => v.id === id)
}
