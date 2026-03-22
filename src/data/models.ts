// RefundRadar — Price Drop Tracker & Refund Claims

export enum PurchaseCategory {
  Electronics = 'Electronics',
  Grocery = 'Grocery',
  Clothing = 'Clothing',
  Travel = 'Travel',
  Subscription = 'Subscription',
  Other = 'Other',
}

export const CATEGORY_COLORS: Record<PurchaseCategory, string> = {
  [PurchaseCategory.Electronics]: '#3B82F6',
  [PurchaseCategory.Grocery]: '#22C55E',
  [PurchaseCategory.Clothing]: '#8B5CF6',
  [PurchaseCategory.Travel]: '#F59E0B',
  [PurchaseCategory.Subscription]: '#EC4899',
  [PurchaseCategory.Other]: '#06B6D4',
};

export const CATEGORY_ICONS: Record<PurchaseCategory, string> = {
  [PurchaseCategory.Electronics]: 'laptop-outline',
  [PurchaseCategory.Grocery]: 'cart-outline',
  [PurchaseCategory.Clothing]: 'shirt-outline',
  [PurchaseCategory.Travel]: 'airplane-outline',
  [PurchaseCategory.Subscription]: 'card-outline',
  [PurchaseCategory.Other]: 'ellipsis-horizontal',
};

export interface Purchase {
  id: string;
  name: string;
  retailer: string;
  category: PurchaseCategory;
  purchasePrice: number;
  currentPrice: number | null;
  purchaseDate: string;
  receiptUrl?: string;
  priceDropDetected: boolean;
  savingsAmount: number;
}

export interface RefundClaim {
  id: string;
  purchaseId: string;
  retailer: string;
  itemName: string;
  originalPrice: number;
  newPrice: number;
  refundAmount: number;
  status: 'pending' | 'submitted' | 'approved' | 'denied' | 'paid';
  submittedDate: string;
  resolvedDate?: string;
}

export interface PriceAlert {
  id: string;
  purchaseId: string;
  itemName: string;
  retailer: string;
  originalPrice: number;
  newPrice: number;
  dropPercent: number;
  detectedDate: string;
  isRead: boolean;
}

export interface RetailerPolicy {
  id: string;
  name: string;
  icon: string;
  priceMatchWindow: number; // days
  refundMethod: string;
  requirements: string;
  difficulty: 'easy' | 'medium' | 'hard';
  successRate: number; // percentage
}

export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysAgo(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
