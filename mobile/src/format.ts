// The API pre-formats every money field, but cart totals are summed on the
// client, so we need one local formatter that matches the server's style.
const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const formatPaise = (paise: number) => inr.format(Math.round(paise) / 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
