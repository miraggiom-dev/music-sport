import type { ReactNode } from "react";
import { ClientArea } from "./index";
import { ClientGuard } from "@/lib/guards";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ClientGuard><ClientArea>{children}</ClientArea></ClientGuard>;
}
