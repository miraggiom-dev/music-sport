import { useState } from "react";
import { LogOut, Menu, ShoppingCart, X } from "lucide-react";
import type { CartItem, Client, View } from "@/types";
import { Logo } from "@/components/shared";

export function ClientNav({
  cart,
  setView,
  currentUser,
  onLogout,
}: {
  cart: CartItem[];
  setView: (v: View) => void;
  currentUser: Client | null;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const navigate = (view: View) => {
    setView(view);
    setMenuOpen(false);
  };

  return (
    <nav
      className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <button onClick={() => navigate("catalog")} aria-label="Ir al catálogo">
          <Logo size={36} />
        </button>

        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={() => navigate("catalog")}
            className="text-sm font-medium text-gray-600 hover:text-[#C8102E] transition-colors"
          >
            Catálogo
          </button>
          {currentUser && (
            <>
              <button
                onClick={() => navigate("client-profile")}
                className="text-sm font-medium text-gray-600 hover:text-[#C8102E]"
              >
                Mi perfil
              </button>
              <button
                onClick={() => navigate("client-orders")}
                className="text-sm font-medium text-gray-600 hover:text-[#C8102E]"
              >
                Mis órdenes
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("cart")}
            className="relative p-2 text-gray-600 hover:text-[#C8102E] transition-colors"
            aria-label={`Ver carrito (${cartCount} artículos)`}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#C8102E] text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <>
              <button
                onClick={() => navigate("client-profile")}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8102E] to-[#800000] flex items-center justify-center text-white font-bold text-xs shrink-0"
                aria-label="Abrir mi perfil"
              >
                {currentUser.name.charAt(0)}
              </button>
              <button
                onClick={onLogout}
                className="hidden md:flex items-center gap-1 text-xs text-gray-400 hover:text-[#C8102E] transition-colors"
              >
                <LogOut size={14} />
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("login")}
              className="hidden md:flex px-4 py-2 bg-[#C8102E] text-white rounded-xl text-sm font-semibold hover:bg-[#a80d25] transition-colors"
            >
              Ingresar
            </button>
          )}

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
          <button
            onClick={() => navigate("catalog")}
            className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Catálogo
          </button>
          {currentUser ? (
            <>
              <button
                onClick={() => navigate("client-profile")}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Mi perfil
              </button>
              <button
                onClick={() => navigate("client-orders")}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Mis órdenes
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("login")}
              className="block w-full text-left px-4 py-3 text-sm font-semibold text-[#C8102E]"
            >
              Ingresar
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
