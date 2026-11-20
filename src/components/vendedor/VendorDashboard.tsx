import { useEffect } from "react";
import { AlertTriangle, Clock, Coins, Package, ShoppingBag, Truck } from "lucide-react";
import type { Order, Product, View } from "@/types";
import { StatCard, fmtDateTime, useRate } from "@/components/shared";
import "./setup";

export function VendorDashboard({
  orders,
  products,
  setView,
}: {
  orders: Order[];
  products: Product[];
  setView: (v: View) => void;
}) {
  const rate = useRate();

  useEffect(() => {
    if (typeof document !== "undefined") {
      const content = "width=device-width, initial-scale=1, viewport-fit=cover";
      let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "viewport";
        document.head.prepend(meta);
      }
      meta.content = content;
      const applySafeTop = () => {
        const probe = document.createElement("div");
        probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none";
        document.body.appendChild(probe);
        const measured = probe.getBoundingClientRect().height;
        probe.remove();
        const ua = navigator.userAgent;
        const iOS = /iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 500);
        const portrait = window.innerHeight >= window.innerWidth;
        const tall = Math.max(screen.width, screen.height);
        const fullScreen = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone || window.innerHeight >= screen.height - 40;
        let top = measured;
        if (!top && fullScreen && iOS && portrait && tall >= 812) top = tall >= 852 ? 59 : 47;
        else if (!top && fullScreen && /Android/.test(ua) && portrait && window.innerHeight >= screen.height - 4) top = 28;
        document.documentElement.style.setProperty("--safe-top", `${top}px`);
      };
      const runSafe = () => {
        if (document.body) applySafeTop();
        else document.addEventListener("DOMContentLoaded", applySafeTop, { once: true });
      };
      runSafe();
      window.addEventListener("resize", runSafe);
      window.addEventListener("orientationchange", () => setTimeout(runSafe, 300));
      if (!document.getElementById("ms-global-style")) {
        const st = document.createElement("style");
        st.id = "ms-global-style";
        st.textContent = `
          html, body, #root { scrollbar-width: none; -ms-overflow-style: none; overscroll-behavior-y: none; }
          html, body { overflow-x: hidden; max-width: 100%; background: #f4f5f7; }
          *, *::before, *::after { scrollbar-width: none !important; -ms-overflow-style: none !important; }
          *::-webkit-scrollbar, html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }
        `;
        document.head.appendChild(st);
      }
      return () => {
        window.removeEventListener("resize", runSafe);
        window.removeEventListener("orientationchange", () => setTimeout(runSafe, 300));
      };
    }
  }, []);

  const pending = orders.filter((o) => o.status === "pendiente").length;
  const processing = orders.filter((o) => o.status === "procesando").length;
  const lowStock = products.filter(
    (p) => p.active && p.stock <= p.minStock,
  ).length;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pagos por verificar"
          value={String(pending)}
          sub="Órdenes pendientes"
          icon={<Clock size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Por despachar"
          value={String(processing)}
          sub="Pago aprobado"
          icon={<Truck size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Stock bajo o agotado"
          value={String(lowStock)}
          sub="Productos activos"
          icon={<AlertTriangle size={20} />}
          color="#800000"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#1560BD] text-white flex items-center justify-center shrink-0">
          <Coins size={20} />
        </div>
        {rate ? (
          <div className="min-w-0">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Tasa activa · {rate.name}
            </p>
            <p
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
            >
              {rate.value.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{" "}
              Bs/USD
            </p>
            <p className="text-xs text-gray-400">
              Última actualización: {fmtDateTime(rate.updatedAt)} · Solo lectura
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No hay una tasa de cambio activa. Solicita al administrador que la
            registre.
          </p>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3
          className="font-bold text-[#000080] mb-4"
          style={{
            fontFamily: "'Barlow Condensed',sans-serif",
            fontSize: "1.1rem",
          }}
        >
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setView("vendor-orders")}
            className="flex items-center gap-3 p-4 bg-[#C8102E] text-white rounded-xl hover:bg-[#a80d25] transition-colors"
          >
            <ShoppingBag size={20} />
            <div className="text-left">
              <p className="font-semibold text-sm">Gestionar órdenes</p>
              <p className="text-white/60 text-xs">
                Verificar pagos y despachar
              </p>
            </div>
          </button>
          <button
            onClick={() => setView("admin-inventory")}
            className="flex items-center gap-3 p-4 bg-[#000080] text-white rounded-xl hover:bg-[#0000a0] transition-colors"
          >
            <Package size={20} />
            <div className="text-left">
              <p className="font-semibold text-sm">Consultar inventario</p>
              <p className="text-white/60 text-xs">Solo lectura</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}