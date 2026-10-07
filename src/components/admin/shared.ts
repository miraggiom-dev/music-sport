export * from "@/components/shared";
export const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMG_MAX_MB = 2;
export const statusColor: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  procesando: "bg-blue-100 text-blue-800",
  despachado: "bg-indigo-50 text-indigo-700",
  completado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};
export const statusIcon: Record<string, React.ReactNode> = {};
import { Image as ImageIcon, Upload, Lock, Printer } from "lucide-react";
export {
  BsRef,
  StatusBadge,
  Logo,
  Input,
  StatCard,
  StatusFilter,
  OrderDetailModal,
  ConfirmDialog,
  round2,
  taxLabel,
  ORDER_STATUSES,
} from "@/components/shared";
