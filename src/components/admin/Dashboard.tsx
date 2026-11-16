import type { Order, Period, Product, View } from "@/types";
import { AlertTriangle, DollarSign, Package, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { stockStatus } from "./Inventory";
import { newestFirst } from "./Orders";
import { periodKey, trendBuckets } from "./Reports";
import { fmt, PAID_STATUSES, round2, StatusBadge } from "./shared";

// Ventas pagadas agrupadas por período (reemplaza al salesTrend de
// components/shared, que devolvía el mismo total en todas las barras).
export function salesByPeriod(orders: Order[], p: Period, now = new Date()) {
  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  return trendBuckets(p, now).map((b) => {
    const inBucket = paid.filter((o) => periodKey(o.date, p) === b.key);
    return {
      key: b.key,
      label: b.label,
      ventas: round2(inBucket.reduce((a, o) => a + o.total, 0)),
      ordenes: inBucket.length,
    };
  });
}

// Redondea hacia arriba a 1, 2, 2.5 o 5 × 10^n para que el eje del
// gráfico tenga marcas legibles (154.5 → 200 → $0, $50, $100…).
export function niceCeil(n: number): number {
  if (n <= 0) return 4;
  const m = 10 ** Math.floor(Math.log10(n));
  return [1, 2, 2.5, 5, 10].map((f) => f * m).find((v) => v >= n) ?? 10 * m;
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p
          className="text-2xl font-bold text-gray-800"
          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}
        >
          {value}
        </p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}

export function AdminDashboard({
  products,
  orders,
  rateAlert,
  setView,
}: {
  products: Product[];
  orders: Order[];
  rateAlert: string;
  setView: (v: View) => void;
}) {
  const lowStockCount = products.filter(
    (p) => stockStatus(p) === "bajo",
  ).length;
  const outOfStockCount = products.filter(
    (p) => stockStatus(p) === "agotado",
  ).length;
  const pendingOrders = orders.filter((o) => o.status === "pendiente").length;
  const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const totalRevenue = paid.reduce((a, o) => a + o.total, 0);
  const salesData = salesByPeriod(orders, "mensual").map((d) => ({
    mes: d.label,
    ventas: d.ventas,
  }));
  const catTotals = (["Deportes", "Música"] as const).map((c) =>
    paid
      .flatMap((o) => o.items)
      .filter((i) => i.product.category === c)
      .reduce((a, i) => a + i.product.price * i.qty, 0),
  );
  const catSum = catTotals[0] + catTotals[1];
  const categoryData =
    catSum === 0
      ? []
      : [
          {
            name: "Deportes",
            value: Math.round((catTotals[0] / catSum) * 100),
            color: "#1560BD",
          },
          {
            name: "Música",
            value: 100 - Math.round((catTotals[0] / catSum) * 100),
            color: "#C8102E",
          },
        ];
  const pieData = categoryData.filter((c) => c.value > 0);
  return (
    <div className="space-y-6">
      {rateAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            {rateAlert}
          </span>
          <button
            onClick={() => setView("admin-rates")}
            className="text-sm font-semibold text-[#000080] hover:underline shrink-0"
          >
            Actualizar tasa
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos totales"
          value={fmt(totalRevenue)}
          sub="Órdenes pagadas"
          icon={<DollarSign size={20} />}
          color="#000080"
        />
        <StatCard
          label="Órdenes pendientes"
          value={String(pendingOrders)}
          sub="Esperan aprobación de pago"
          icon={<ShoppingBag size={20} />}
          color="#C8102E"
        />
        <StatCard
          label="Productos activos"
          value={String(products.filter((p) => p.active).length)}
          sub={`${lowStockCount} con stock bajo`}
          icon={<Package size={20} />}
          color="#1560BD"
        />
        <StatCard
          label="Stock bajo"
          value={String(lowStockCount)}
          sub={`${outOfStockCount} agotados`}
          icon={<AlertTriangle size={20} />}
          color="#800000"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3
            className="font-bold text-[#000080] mb-4"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Ventas de los últimos 6 meses (USD)
          </h3>
          <div className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 500 200"
              width="100%"
              style={{ display: "block" }}
            >
              {(() => {
                const W = 500,
                  H = 200,
                  padL = 48,
                  padB = 32,
                  padT = 10,
                  padR = 10;
                const iW = W - padL - padR,
                  iH = H - padB - padT;
                const maxV = niceCeil(
                  Math.max(...salesData.map((d) => d.ventas)),
                );
                const barW = (iW / salesData.length) * 0.6;
                const gap = iW / salesData.length;
                return (
                  <>
                    {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                      const y = padT + iH - r * iH;
                      return (
                        <g key={i}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={W - padR}
                            y2={y}
                            stroke="#f0f0f0"
                            strokeWidth={1}
                          />
                          <text
                            x={padL - 4}
                            y={y + 4}
                            textAnchor="end"
                            fontSize={9}
                            fill="#999"
                          >
                            ${Math.round(r * maxV)}
                          </text>
                        </g>
                      );
                    })}
                    {salesData.map((d, i) => {
                      const bH = (d.ventas / maxV) * iH;
                      const x = padL + i * gap + (gap - barW) / 2;
                      const y = padT + iH - bH;
                      return (
                        <g key={i}>
                          <rect
                            x={x}
                            y={y}
                            width={barW}
                            height={bH}
                            fill="#C8102E"
                            rx={3}
                          />
                          <text
                            x={x + barW / 2}
                            y={H - 8}
                            textAnchor="middle"
                            fontSize={10}
                            fill="#666"
                          >
                            {d.mes}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3
            className="font-bold text-[#000080] mb-4"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Ventas por categoría
          </h3>
          {categoryData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">
              Sin ventas pagadas todavía
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={pieData}
                  strokeWidth={pieData.length > 1 ? 1 : 0}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Participación"]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex gap-4 justify-center mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: c.color }}
                />
                <span className="text-xs text-gray-600">
                  {c.name} {c.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3
            className="font-bold text-[#000080]"
            style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontSize: "1.1rem",
            }}
          >
            Órdenes recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Orden", "Cliente", "Total", "Estado", "Fecha"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    Todavía no hay órdenes
                  </td>
                </tr>
              )}
              {[...orders]
                .sort(newestFirst)
                .slice(0, 5)
                .map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[#000080] font-semibold">
                      {o.id}
                    </td>
                    <td className="px-5 py-3 text-gray-700">{o.clientName}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800">
                      {fmt(o.total)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {o.date}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
