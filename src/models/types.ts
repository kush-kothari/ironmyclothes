/**
 * Domain types for IronTrack – aligned with SQLite schema where applicable.
 */

export type ItemStatus = 'Pending' | 'Partial' | 'Completed';

export interface Category {
  id: number;
  name: string;
  price: number;
  isCustom: number;
}

export interface Entry {
  id: number;
  dateGiven: string;
  expectedReturnDate: string | null;
  notes: string | null;
  totalAmount: number;
}

export interface EntryItem {
  id: number;
  entryId: number;
  categoryId: number;
  quantityGiven: number;
  quantityReturned: number;
  // Joined from categories (not in DB)
  categoryName?: string;
  pricePerItem?: number;
}

export interface Photo {
  id: number;
  entryId: number;
  uri: string;
}

export interface EntryWithItems extends Entry {
  items: (EntryItem & { categoryName: string; pricePerItem: number })[];
  photos: Photo[];
}

export interface DashboardStats {
  totalActiveEntries: number;
  totalPendingClothes: number;
  totalPendingAmount: number;
}

export interface EntryListItem extends Entry {
  totalItems: number;
  pendingItems: number;
  pendingAmount: number;
  status: ItemStatus;
}

/** Helper: derive item status from quantities */
export function getItemStatus(quantityGiven: number, quantityReturned: number): ItemStatus {
  if (quantityReturned === 0) return 'Pending';
  if (quantityReturned < quantityGiven) return 'Partial';
  return 'Completed';
}

/** Helper: pending quantity */
export function getPendingQuantity(quantityGiven: number, quantityReturned: number): number {
  return Math.max(0, quantityGiven - quantityReturned);
}
