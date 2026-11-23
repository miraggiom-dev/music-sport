export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatUSD(value: number) {
  return `$${value.toFixed(2)}`;
}

export function formatVES(value: number) {
  return `Bs. ${round2(value).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const fmt = formatUSD;
export const fmtBs = formatVES;
