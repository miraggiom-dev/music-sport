import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { InternalUser, Role } from "@/types";

interface AuthContextValue {
  role: Role | null;
  setRole: Dispatch<SetStateAction<Role | null>>;
  currentUser: InternalUser | null;
  setCurrentUser: Dispatch<SetStateAction<InternalUser | null>>;
  currentClientId: string | null;
  setCurrentClientId: Dispatch<SetStateAction<string | null>>;
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem("ms_role") as Role) || null);
  const [currentUser, setCurrentUser] = useState<InternalUser | null>(() => {
    const saved = localStorage.getItem("ms_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [currentClientId, setCurrentClientId] = useState<string | null>(() => localStorage.getItem("ms_client_id"));
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (role) localStorage.setItem("ms_role", role);
    else localStorage.removeItem("ms_role");

    if (currentUser) localStorage.setItem("ms_user", JSON.stringify(currentUser));
    else localStorage.removeItem("ms_user");

    if (currentClientId) localStorage.setItem("ms_client_id", currentClientId);
    else localStorage.removeItem("ms_client_id");
  }, [role, currentUser, currentClientId]);

  return (
    <AuthContext.Provider value={{ role, setRole, currentUser, setCurrentUser, currentClientId, setCurrentClientId, notice, setNotice }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
