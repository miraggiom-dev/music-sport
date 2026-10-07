import { useContext } from "react";
import { RateContext } from "@/contexts/RateContext";

export function useTasaCambio() {
  return useContext(RateContext);
}
