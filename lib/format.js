import { moneyToNumber } from "@/lib/money";

export function formatNumber(value, digits = 2) {
  const num = moneyToNumber(value);
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num);
}

export function formatCurrency(value, digits = 2) {
  return `₹${formatNumber(value, digits)}`;
}

export default formatCurrency;
