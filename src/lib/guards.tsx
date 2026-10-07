import type { ReactNode } from "react";
import { Navigate } from "react-router";
import type { Role } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { homeFor } from "./permissions";
import { pathForView } from "@/app/routeConfig";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { role } = useAuth();
  if (!role) return <Navigate to={pathForView("login")} replace />;
  if (roles && !roles.includes(role)) return <Navigate to={pathForView(homeFor(role))} replace />;
  return <>{children}</>;
}

export const AdminGuard = ({ children }: { children: ReactNode }) => <RequireAuth roles={["admin"]}>{children}</RequireAuth>;
export const VendorGuard = ({ children }: { children: ReactNode }) => <RequireAuth roles={["vendor", "admin"]}>{children}</RequireAuth>;
export const ClientGuard = ({ children }: { children: ReactNode }) => <RequireAuth roles={["client"]}>{children}</RequireAuth>;
