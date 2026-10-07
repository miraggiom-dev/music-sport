import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
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
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<InternalUser | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

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
