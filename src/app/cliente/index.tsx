import type { ReactNode } from "react";

export function ClientArea({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[#f4f5f7] overflow-x-hidden" style={{ fontFamily: "'Inter',sans-serif", paddingBottom: "var(--safe-bottom)" }}>
      {children}
    </div>
  );
}
