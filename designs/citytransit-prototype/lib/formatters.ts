import { formatDistanceToNow } from 'date-fns';

export function formatTimeAgo(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}
