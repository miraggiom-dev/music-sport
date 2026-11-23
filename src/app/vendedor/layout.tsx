import type { ReactNode } from "react";
import { VendorArea } from "./index";
import { VendorGuard } from "@/lib/guards";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <VendorGuard><VendorArea>{children}</VendorArea></VendorGuard>;
}
