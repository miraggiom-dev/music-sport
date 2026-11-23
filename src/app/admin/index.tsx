import type { ReactNode } from "react";

export function AdminArea({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-[#f4f5f7] overflow-hidden" style={{ fontFamily: "'Inter',sans-serif", height: "100dvh", paddingTop: "var(--safe-top)", paddingLeft: "var(--safe-left)", paddingRight: "var(--safe-right)" }}>
      {children}
    </div>
  );
}
