import { createContext } from "react";
import type { ExchangeRate } from "@/types";

export const RateContext = createContext<ExchangeRate | null>(null);
