export const DEFAULT_CURRENCY = '₹';
export const DEFAULT_DAILY_BUDGET = 500;
export const DEFAULT_MONTHLY_BUDGET = 15000;

export function formatMoney(amount: number, currency = DEFAULT_CURRENCY): string {
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${currency}${formatted}`;
}

export function formatMoneyExact(amount: number, currency = DEFAULT_CURRENCY): string {
  const hasDecimals = amount % 1 !== 0;
  const formatted = amount.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}
