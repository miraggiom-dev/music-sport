
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { InternalUser, Role } from "@/types";
import { authService, type BackendUser } from "@/services/authService";

interface AuthContextValue {
  role: Role | null;
  setRole: Dispatch<SetStateAction<Role | null>>;
  currentUser: InternalUser | null;
  setCurrentUser: Dispatch<SetStateAction<InternalUser | null>>;
  currentClientId: string | null;
  setCurrentClientId: Dispatch<SetStateAction<string | null>>;
  notice: string;
  setNotice: Dispatch<SetStateAction<string>>;
  authLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapBackendUser(user: BackendUser): {
  role: Role;
  currentUser: InternalUser | null;
  currentClientId: string | null;
} {
  if (user.role === "client") {
    return {
      role: "client",
      currentUser: null,
      currentClientId: String(user.clientId),
    };
  }

  return {
    role: user.role,
    currentUser: {
      id: String(user.id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status as "activo" | "inactivo",
      phone: user.phone,
      createdAt: user.createdAt,
      password: "",
    },
    currentClientId: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [currentUser, setCurrentUser] = useState<InternalUser | null>(null);
  const [currentClientId, setCurrentClientId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const user = await authService.getCurrentUser();

        if (!active || !user) return;

        const mapped = mapBackendUser(user);

        setRole(mapped.role);
        setCurrentUser(mapped.currentUser);
        setCurrentClientId(mapped.currentClientId);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        currentClientId,
        setCurrentClientId,
        notice,
        setNotice,
        authLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
