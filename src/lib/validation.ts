export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
export const isValidPhone = (v: string) => /^\+?[\d\s\-().]{7,20}$/.test(v.trim());
export const isValidName = (v: string) => v.trim().length >= 3;
export const isValidSku = (v: string) => /^[A-Za-z0-9\-_]{2,20}$/.test(v.trim());
export const isValidPrice = (v: number) => v > 0 && v <= 999999;
export const isValidStock = (v: number) => Number.isInteger(v) && v >= 0;
export const isValidPass = (v: string) => v.length >= 6 && v.length <= 50;
export const isValidDocId = (v: string) => /^[VEJGP]-?\d{6,9}(-?\d)?$/i.test(v.trim());

