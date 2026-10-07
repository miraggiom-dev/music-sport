import type { ExchangeRate } from "@/types";
import { initRates } from "@/data/mockData";
export interface RateService { list(): ExchangeRate[]; active(): ExchangeRate | undefined; }
export const rateService: RateService = { list: () => [...initRates], active: () => initRates.find(rate => rate.active) };
