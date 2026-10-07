import { useState } from "react";
import {
  CheckCircle,
  Download,
  FileText,
  LineChart,
  Package,
  TrendingUp,
  XCircle,
  Activity,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { toast as notify } from "sonner";
import type { Order, Period, Product, ReportType } from "@/types";
import { PAID_STATUSES, escapeHtml, fmt } from "./shared";
import { printDocument } from "@/lib/generatePDF";
import logoImg from "@/imports/Logo.png";

const periodLabels: Record<Period, string> = {
  diario: "Hoy",
  mensual: "Este mes",
  anual: "Este año",
};
const periodKey = (date: string, period: Period) =>
  period === "diario"
    ? date
    : period === "mensual"
      ? date.slice(0, 7)
      : date.slice(0, 4);

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-VE");
}

function trendBuckets(period: Period) {
  const now = new Date();
  if (period === "diario") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return {
        key: date.toISOString().slice(0, 10),
        label: `${date.getDate()}/${date.getMonth() + 1}`,
      };
    });
  }
  if (period === "mensual") {
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: date
          .toLocaleDateString("es-VE", { month: "short" })
          .replace(".", ""),
      };
    });
  }
  return Array.from({ length: 5 }, (_, index) => {
    const year = String(now.getFullYear() - (4 - index));
    return { key: year, label: year };
  });
}

function statusText(order: Order) {
  return order.status === "procesando"
    ? "procesando"
    : order.status === "completado"
      ? "completado"
      : order.status;
}

const reportStyles = `*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
@page{size:A4;margin:10mm 14mm}body{font:9px Arial,sans-serif;color:#20202e;margin:0}
.page{max-width:680px;margin:0 auto}.top{display:flex;justify-content:space-between;font-size:8px;margin-bottom:8px}.header{display:flex;align-items:center;gap:14px;background-color:#000080;background-image:linear-gradient(110deg,#000080,#24106f 55%,#c8102e);color:#fff;padding:13px 20px;border-radius:5px;margin:0 0 12px}.logo{width:42px;height:42px;object-fit:contain}.brand{font-size:19px;font-weight:700}.subtitle{font-size:8px;letter-spacing:1px;margin-top:2px;color:#d9d9ec}
h1{font-size:14px;margin:0 0 3px;border-left:4px solid #c8102e;padding-left:8px;color:#000080}.period{font-size:8px;color:#777;margin:0 0 10px;padding-left:10px}.section{background:#000080;color:#fff;font-size:8px;font-weight:bold;letter-spacing:.8px;padding:6px 8px;margin-top:10px;text-transform:uppercase;border-radius:4px 4px 0 0}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:8px 0 11px}.card{color:#fff;text-align:center;border-radius:5px;padding:8px 4px;height:43px}.navy{background:#000080}.blue{background:#1560bd}.red{background:#d00b30}.darkred{background:#990000}.value{font-size:14px;font-weight:bold;line-height:15px}.label{font-size:7px;margin-top:3px;text-transform:uppercase}
.trend{border:1px solid #d8ddea;background:#f7f9ff;border-radius:6px;padding:7px 9px;margin-bottom:10px}.trend .section{margin:0}.trend svg{display:block;width:100%;height:145px}.muted{color:#777;font-size:8px}.empty{text-align:center;color:#999;padding:25px 8px}
table{width:100%;border-collapse:collapse;font-size:8px;background:#fff}th{background:#000080;color:#fff;text-align:left;padding:6px 7px;font-size:8px;border:0}td{padding:5px 7px;border-bottom:1px solid #e5e5e5;vertical-align:top}.section+table{border:0;border-radius:0 0 4px 4px;overflow:hidden}.right{text-align:right}.center{text-align:center}.badge{color:#168242;font-weight:bold}
.footer{display:flex;justify-content:space-between;border-top:2px solid #000080;margin-top:10px;padding-top:7px;color:#999;font-size:7px}`;

function reportPeriodLabel(period: Period) {
  return period === "diario"
    ? "Hoy"
    : period === "mensual"
      ? "Este mes"
      : "Este año";
}

function exportReport({
  type,
  period,
  periodOrders,
  periodPaid,
  products,
  soldByProduct,
  revenue,
  average,
  cancelled,
  trend,
  rotatingProducts,
}: {
  type: ReportType;
  period: Period;
  periodOrders: Order[];
  periodPaid: Order[];
  products: Product[];
  soldByProduct: Record<string, { product: Product; quantity: number }>;
  revenue: number;
  average: number;
  cancelled: number;
  trend: { key: string; label: string; value: number }[];
  rotatingProducts: { product: Product; quantity: number }[];
}) {
  const label = reportPeriodLabel(period);
  const inventoryRows = products
    .map((product) => {
      const sold = soldByProduct[product.id]?.quantity ?? 0;
      const status =
        product.stock === 0
          ? "Agotado"
          : product.stock <= product.minStock
            ? "Stock bajo"
            : "Normal";
      return `<tr><td>${escapeHtml(product.name)}</td><td>${escapeHtml(product.sku)}</td><td>${escapeHtml(product.category)}</td><td>${product.stock}</td><td>${product.minStock}</td><td>${sold}</td><td class="right">${fmt(product.price * product.stock)}</td><td class="badge">${status}</td></tr>`;
    })
    .join("");
  const orderRows = periodOrders
    .map(
      (order) =>
        `<tr><td>${escapeHtml(order.id)}</td><td>${escapeHtml(order.clientName)}</td><td>${order.items.map((item) => `${escapeHtml(item.product.name)} x${item.qty}`).join("<br>")}</td><td class="right">${fmt(order.total)}</td><td>${escapeHtml(statusText(order))}</td><td>${escapeHtml(formatDate(order.date))}</td></tr>`,
    )
    .join("");
  const inventoryUnits = products.reduce(
    (total, product) => total + product.stock,
    0,
  );
  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0,
  );
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;
  const inventoryRotation = rotatingProducts.length
    ? rotatingProducts
        .map(
          (item, index) =>
            `<tr><td>${index + 1}</td><td>${escapeHtml(item.product.name)}</td><td class="center">${item.quantity}</td><td class="right">${fmt(item.product.price * item.quantity)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4" class="empty">Ningún producto alcanzó el mínimo de rotación en este período</td></tr>`;
  const maxTrend = Math.max(...trend.map((item) => item.value), 1);
  const chartX = (index: number) =>
    52 + index * (470 / Math.max(trend.length - 1, 1));
  const chartY = (value: number) => 120 - (value / maxTrend) * 90;
  const chartPoints = trend
    .map((item, index) => `${chartX(index)},${chartY(item.value)}`)
    .join(" ");
  const chartLabels = trend
    .map(
      (item, index) =>
        `<circle cx="${chartX(index)}" cy="${chartY(item.value)}" r="3.5" fill="#c8102e"/><text x="${chartX(index)}" y="143" text-anchor="middle" font-size="8" fill="#777">${item.label}</text>`,
    )
    .join("");
  const chartMaxLabel = fmt(maxTrend);
  const chartMidLabel = fmt(maxTrend / 2);
  const salesBody = `<div class="cards"><div class="card navy"><div class="value">${fmt(revenue)}</div><div class="label">Ingresos</div></div><div class="card blue"><div class="value">${periodPaid.length}</div><div class="label">Órdenes pagadas</div></div><div class="card red"><div class="value">${fmt(average)}</div><div class="label">Ticket promedio</div></div><div class="card darkred"><div class="value">${cancelled}</div><div class="label">Canceladas</div></div></div><div class="trend"><div class="section">Tendencia de ventas</div><svg viewBox="0 0 550 155"><line x1="52" x2="522" y1="30" y2="30" stroke="#e1e4ec"/><line x1="52" x2="522" y1="75" y2="75" stroke="#e1e4ec"/><line x1="52" x2="522" y1="120" y2="120" stroke="#e1e4ec"/><text x="45" y="33" text-anchor="end" font-size="8" fill="#999">${escapeHtml(chartMaxLabel)}</text><text x="45" y="78" text-anchor="end" font-size="8" fill="#999">${escapeHtml(chartMidLabel)}</text><text x="45" y="123" text-anchor="end" font-size="8" fill="#999">$0.00</text><polygon fill="#c8102e18" points="52,120 ${chartPoints} 522,120"/><polyline fill="none" stroke="#c8102e" stroke-width="2.5" points="${chartPoints}"/>${chartLabels}</svg></div><div class="section">Productos con mayor rotación (mín. 3 uds)</div><table><thead><tr><th>#</th><th>Producto</th><th class="center">Unidades</th><th class="right">Ingresos</th></tr></thead><tbody>${inventoryRotation}</tbody></table><div class="section">Detalle de órdenes</div><table><thead><tr><th>Orden</th><th>Cliente</th><th>Artículos</th><th class="right">Total</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>${orderRows || `<tr><td colspan="6" class="empty">No hay órdenes en este período.</td></tr>`}</tbody></table>`;
  const inventoryBody = `<div class="cards"><div class="card navy"><div class="value">${inventoryUnits}</div><div class="label">Unidades en stock</div></div><div class="card blue"><div class="value">${fmt(inventoryValue)}</div><div class="label">Valor del inventario</div></div><div class="card red"><div class="value">${lowStock}</div><div class="label">Stock bajo</div></div><div class="card darkred"><div class="value">${outOfStock}</div><div class="label">Agotados</div></div></div><div class="section">Existencias</div><table><thead><tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Stock</th><th>Mínimo</th><th>Vendidos<br>(${label})</th><th class="right">Valor</th><th>Estado</th></tr></thead><tbody>${inventoryRows}</tbody></table><div class="section">Productos con mayor rotación (mín. 3 uds)</div><table><thead><tr><th>#</th><th>Producto</th><th class="center">Unidades</th><th class="right">Ingresos</th></tr></thead><tbody>${inventoryRotation}</tbody></table>`;
  const body = type === "inventario" ? inventoryBody : salesBody;
  const title =
    type === "inventario" ? "Informe de Inventario" : "Informe de Ventas";
  printDocument(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>${reportStyles}</style></head><body><main class="page"><div class="top"><span>${escapeHtml(new Date().toLocaleString("es-VE"))}</span><span>${title} — Music&amp;Sport DSS</span></div><div class="header"><img class="logo" src="${logoImg}" alt="Music&Sport"><div><div class="brand">Music&amp;Sport DSS, C.A.</div><div class="subtitle">GESTIÓN DE INVENTARIO Y VENTAS</div></div></div><h1>${title}</h1><p class="period">Período: <strong>${label.toLowerCase()}</strong> (${new Date().toISOString().slice(0, 10)}) · Generado: ${escapeHtml(new Date().toLocaleString("es-VE"))}</p>${body}<div class="footer"><span>Music&amp;Sport DSS, C.A.</span><span>Sistema de gestión de inventario y ventas</span></div></main></body></html>`,
    title,
  );
}

export function AdminReports({
  orders,
  products,
}: {
  orders: Order[];
  products: Product[];
}) {
  const [type, setType] = useState<ReportType>("ventas");
  const [period, setPeriod] = useState<Period>("diario");
  const [generated, setGenerated] = useState(false);
  const paid = orders.filter((order) => PAID_STATUSES.includes(order.status));
  const periodOrders = orders.filter(
    (order) =>
      periodKey(order.date, period) ===
      periodKey(new Date().toISOString().slice(0, 10), period),
  );
  const periodPaid = periodOrders.filter((order) =>
    PAID_STATUSES.includes(order.status),
  );
  const revenue = periodPaid.reduce((total, order) => total + order.total, 0);
  const average = periodPaid.length ? revenue / periodPaid.length : 0;
  const cancelled = periodOrders.filter(
    (order) => order.status === "cancelado",
  ).length;
  const buckets = trendBuckets(period);
  const trend = buckets.map((bucket) => ({
    ...bucket,
    value: paid
      .filter((order) => periodKey(order.date, period) === bucket.key)
      .reduce((total, order) => total + order.total, 0),
  }));
  const maxTrend = Math.max(...trend.map((item) => item.value), 1);
  const soldByProduct = periodPaid
    .flatMap((order) => order.items)
    .reduce<Record<string, { product: Product; quantity: number }>>(
      (result, item) => {
        const current = result[item.product.id] ?? {
          product: item.product,
          quantity: 0,
        };
        current.quantity += item.qty;
        result[item.product.id] = current;
        return result;
      },
      {},
    );
  const rotatingProducts = Object.values(soldByProduct)
    .filter((item) => item.quantity >= 3)
    .sort((a, b) => b.quantity - a.quantity);
  const inventoryUnits = products.reduce(
    (total, product) => total + product.stock,
    0,
  );
  const inventoryValue = products.reduce(
    (total, product) => total + product.price * product.stock,
    0,
  );
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;

  const generate = () => {
    setGenerated(true);
    notify.success("Informe generado");
  };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                1 · TIPO DE INFORME
              </p>
              <div className="flex w-fit rounded-xl bg-gray-50 p-1">
                {(
                  [
                    ["ventas", "Ventas"],
                    ["inventario", "Inventario"],
                  ] as [ReportType, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setType(value);
                      setGenerated(false);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm ${type === value ? "bg-[#000080] font-semibold text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                2 · PERÍODO
              </p>
              <div className="flex w-fit rounded-xl bg-gray-50 p-1">
                {(
                  [
                    ["diario", "Diario"],
                    ["mensual", "Mensual"],
                    ["anual", "Anual"],
                  ] as [Period, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setPeriod(value);
                      setGenerated(false);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm ${period === value ? "bg-[#000080] font-semibold text-white shadow-sm" : "text-gray-600 hover:bg-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={generate}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#C8102E] px-4 text-sm font-semibold text-white hover:bg-[#a90d26]"
            >
              <FileText size={15} />
              Generar informe
            </button>
            <button
              type="button"
              disabled={!generated}
              onClick={() =>
                exportReport({
                  type,
                  period,
                  periodOrders,
                  periodPaid,
                  products,
                  soldByProduct,
                  revenue,
                  average,
                  cancelled,
                  trend,
                  rotatingProducts,
                })
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#000080] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={15} />
              Exportar PDF
            </button>
          </div>
        </div>
      </section>

      {!generated ? (
        <section className="flex h-[230px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-center">
          <LineChart
            size={42}
            strokeWidth={1.5}
            className="mb-4 text-gray-200"
          />
          <p className="text-base font-medium text-gray-500">
            Selecciona el tipo de informe y el período
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Luego presiona "Generar informe" para ver los resultados y
            exportarlos.
          </p>
        </section>
      ) : (
        <>
          <p className="text-xs text-gray-400">
            Informe de {type === "ventas" ? "ventas" : "inventario"} ·{" "}
            {periodLabels[period]} ({new Date().toISOString().slice(0, 10)}) ·
            generado {new Date().toLocaleString("es-VE")}
          </p>
          {type === "inventario" ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={<Package size={20} />}
                  color="bg-[#000080]"
                  label="UNIDADES"
                  value={String(inventoryUnits)}
                  detail="En existencia"
                />
                <MetricCard
                  icon={<DollarSign size={20} />}
                  color="bg-[#1560BD]"
                  label="VALOR"
                  value={fmt(inventoryValue)}
                  detail="A precio de venta"
                />
                <MetricCard
                  icon={<AlertTriangle size={20} />}
                  color="bg-[#C8102E]"
                  label="STOCK BAJO"
                  value={String(lowStock)}
                  detail="Por reponer"
                />
                <MetricCard
                  icon={<XCircle size={20} />}
                  color="bg-[#990000]"
                  label="AGOTADOS"
                  value={String(outOfStock)}
                  detail="Sin existencias"
                />
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                  <h2 className="px-5 py-4 font-bold text-[#000080]">
                    Inventario de productos
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-5 py-3">Producto</th>
                          <th className="px-5 py-3">Stock</th>
                          <th className="px-5 py-3">Mín.</th>
                          <th className="px-5 py-3">Vendidos</th>
                          <th className="px-5 py-3">Valor</th>
                          <th className="px-5 py-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => {
                          const sold = soldByProduct[product.id]?.quantity ?? 0;
                          const status =
                            product.stock === 0
                              ? "Agotado"
                              : product.stock <= product.minStock
                                ? "Stock bajo"
                                : "Normal";
                          return (
                            <tr
                              key={product.id}
                              className="border-t border-gray-100"
                            >
                              <td className="px-5 py-3 font-semibold">
                                {product.name}
                              </td>
                              <td className="px-5 py-3">{product.stock}</td>
                              <td className="px-5 py-3 text-gray-400">
                                {product.minStock}
                              </td>
                              <td className="px-5 py-3">{sold}</td>
                              <td className="px-5 py-3">
                                {fmt(product.price * product.stock)}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs ${status === "Normal" ? "bg-green-50 text-green-700" : status === "Agotado" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-[#000080]">
                    Productos con mayor rotación
                  </h2>
                  <p className="mt-1 text-xs text-gray-400">
                    Mínimo 3 unidades vendidas ·{" "}
                    {periodLabels[period].toLowerCase()}
                  </p>
                  {rotatingProducts.length === 0 ? (
                    <p className="flex h-32 items-center justify-center text-center text-sm text-gray-400">
                      Ningún producto alcanzó el mínimo de rotación en este
                      período
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {rotatingProducts.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{item.product.name}</span>
                          <strong>{item.quantity} unidades</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={<TrendingUp size={20} />}
                  color="bg-[#000080]"
                  label="INGRESOS"
                  value={fmt(revenue)}
                  detail={periodLabels[period]}
                />
                <MetricCard
                  icon={<CheckCircle size={20} />}
                  color="bg-[#1560BD]"
                  label="ÓRDENES PAGADAS"
                  value={String(periodPaid.length)}
                  detail={`${periodPaid.length} emitidas`}
                />
                <MetricCard
                  icon={<Activity size={20} />}
                  color="bg-[#C8102E]"
                  label="TICKET PROMEDIO"
                  value={fmt(average)}
                  detail="Por orden pagada"
                />
                <MetricCard
                  icon={<XCircle size={20} />}
                  color="bg-[#990000]"
                  label="CANCELADAS"
                  value={String(cancelled)}
                  detail="En el período"
                />
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-[#000080]">
                    Tendencia de ventas
                  </h2>
                  <div className="mt-4 h-44">
                    <svg
                      viewBox="0 0 600 180"
                      className="h-full w-full"
                      role="img"
                      aria-label="Tendencia de ventas"
                    >
                      {[0, 1, 2].map((line) => (
                        <line
                          key={line}
                          x1="45"
                          x2="580"
                          y1={145 - line * 58}
                          y2={145 - line * 58}
                          stroke="#e8eaf2"
                        />
                      ))}
                      <polyline
                        fill="#c8102e14"
                        stroke="none"
                        points={`45,145 ${trend.map((item, index) => `${45 + index * (535 / Math.max(trend.length - 1, 1))},${145 - (item.value / maxTrend) * 125}`).join(" ")} 580,145`}
                      />
                      <polyline
                        fill="none"
                        stroke="#C8102E"
                        strokeWidth="3"
                        points={trend
                          .map(
                            (item, index) =>
                              `${45 + index * (535 / Math.max(trend.length - 1, 1))},${145 - (item.value / maxTrend) * 125}`,
                          )
                          .join(" ")}
                      />
                      {trend.map((item, index) => (
                        <g key={item.key}>
                          <circle
                            cx={
                              45 + index * (535 / Math.max(trend.length - 1, 1))
                            }
                            cy={145 - (item.value / maxTrend) * 125}
                            r="4"
                            fill="#C8102E"
                          />
                          <text
                            x={
                              45 + index * (535 / Math.max(trend.length - 1, 1))
                            }
                            y="166"
                            textAnchor="middle"
                            fontSize="10"
                            fill="#777"
                          >
                            {item.label}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </section>
                <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-[#000080]">
                    Productos con mayor rotación
                  </h2>
                  <p className="mt-1 text-xs text-gray-400">
                    Mínimo 3 unidades vendidas ·{" "}
                    {periodLabels[period].toLowerCase()}
                  </p>
                  {rotatingProducts.length === 0 ? (
                    <p className="flex h-32 items-center justify-center text-sm text-gray-400">
                      Ningún producto alcanzó el mínimo de rotación en este
                      período
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {rotatingProducts.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex justify-between text-sm"
                        >
                          <span>{item.product.name}</span>
                          <strong>{item.quantity} unidades</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
              <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <h2 className="px-5 py-4 font-bold text-[#000080]">
                  Órdenes del período
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Orden</th>
                        <th className="px-5 py-3">Cliente</th>
                        <th className="px-5 py-3">Total</th>
                        <th className="px-5 py-3">Estado</th>
                        <th className="px-5 py-3">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodOrders.map((order) => (
                        <tr key={order.id} className="border-t border-gray-100">
                          <td className="px-5 py-3 font-mono text-xs font-semibold text-[#000080]">
                            {order.id}
                          </td>
                          <td className="px-5 py-3">{order.clientName}</td>
                          <td className="px-5 py-3 font-semibold">
                            {fmt(order.total)}
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                              {statusText(order)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500">
                            {formatDate(order.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {periodOrders.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-gray-400">
                      No hay órdenes en este período.
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  color,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold tracking-wide text-gray-400">
          {label}
        </p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400">{detail}</p>
      </div>
    </div>
  );
}
