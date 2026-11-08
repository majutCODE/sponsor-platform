export const FEE_RATE = 0.15;
export const fmt = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
export const feeFor = (pence: number) => Math.round(pence * FEE_RATE);
