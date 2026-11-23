
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ background: "linear-gradient(135deg,#000080 0%,#C8102E 100%)" }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden px-6 sm:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
