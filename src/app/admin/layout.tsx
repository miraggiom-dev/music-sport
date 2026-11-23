import type { ReactNode } from "react";
import { AdminArea } from "./index";
import { AdminGuard } from "@/lib/guards";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGuard><AdminArea>{children}</AdminArea></AdminGuard>;
}
