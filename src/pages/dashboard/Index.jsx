import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BanknotesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CubeIcon,
  TruckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { fetchDashboardOverview } from "../../redux/features/order/orderSlices"; // <-- ajusta ruta

// ---- Helpers de formato ----
const currencyUSD = (v) =>
  v == null
    ? "-"
    : new Intl.NumberFormat("es-VE", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }).format(Number(v));

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-VE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

// ---- Mini chart SVG simple (línea de ingresos) ----
function Sparkline({ data = [], width = 420, height = 80, pad = 8 }) {
  const values = data.map((d) => Number(d.revenue_usd || 0));
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const n = Math.max(1, values.length);
  const stepX = (width - pad * 2) / (n - 1 || 1);
  const mapY = (v) => {
    // y invertido (0 abajo)
    const t = (v - min) / (max - min || 1);
    return height - pad - t * (height - pad * 2);
  };
  const dPath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * stepX} ${mapY(v)}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="block">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
        points={`${pad},${height - pad} ${width - pad},${height - pad}`}
      />
      <path d={dPath} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const Index = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((s) => s.order); // <-- ajusta el slice si cambia el nombre
  const { status, data, params, error } = dashboard || {};

  // Filtros locales (se inicializan con defaults del slice)
  const [start, setStart] = useState(params?.start || "");
  const [end, setEnd] = useState(params?.end || "");
  const [groupBy, setGroupBy] = useState(params?.group_by || "day");
  const [onlyDelivered, setOnlyDelivered] = useState(
    (params?.status || "delivered") === "delivered"
  );
  const [latestLimit, setLatestLimit] = useState(params?.latest_limit || 10);
  const [topN, setTopN] = useState(params?.top_n || 5);

  // Carga inicial (rango por defecto lo decide el backend: últimos 7 días)
  useEffect(() => {
    dispatch(fetchDashboardOverview());
  }, [dispatch]);

  const applyFilters = () => {
    dispatch(
      fetchDashboardOverview({
        start: start || undefined,
        end: end || undefined,
        group_by: groupBy,
        status: onlyDelivered ? "delivered" : "all",
        latest_limit: Number(latestLimit) || 10,
        top_n: Number(topN) || 5,
      })
    );
  };

  const kpis = data?.kpis || {};
  const timeseries = data?.timeseries || [];
  const alerts = data?.alerts || {};
  const latestOrders = data?.latest_orders || [];
  const topQty = data?.top_products_qty || [];
  const topRev = data?.top_products_revenue || [];

  const loading = status === "loading";

  // KPIs list
  const kpiCards = useMemo(
    () => [
      {
        title: "Ingresos",
        value: currencyUSD(kpis.revenue_usd),
        icon: BanknotesIcon,
      },
      {
        title: "Órdenes",
        value: kpis.orders_count ?? 0,
        icon: ShoppingBagIcon,
      },
      {
        title: "AOV",
        value: currencyUSD(kpis.aov_usd),
        icon: ChartBarIcon,
      },
      {
        title: "Unidades",
        value: kpis.units_sold ?? 0,
        icon: CubeIcon,
      },
      {
        title: "Clientes",
        value: kpis.customers_count ?? 0,
        icon: UserGroupIcon,
      },
      {
        title: "Envíos",
        value: currencyUSD(kpis.shipping_total_usd),
        icon: TruckIcon,
      },
    ],
    [kpis]
  );

  return (
    <div className="text-gray-800 py-6 bg-white pr-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <button
          onClick={applyFilters}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          disabled={loading}
          title="Aplicar filtros"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Actualizando..." : "Aplicar filtros"}
        </button>
      </div>

      {/* Filtros */}
      <div className="border border-gray-200 rounded-xl p-4 mb-5">
        <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Agrupar por</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={onlyDelivered}
                onChange={(e) => setOnlyDelivered(e.target.checked)}
              />
              Solo entregadas
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Últimas órdenes
            </label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={latestLimit}
              onChange={(e) => setLatestLimit(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Top N</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
              value={topN}
              onChange={(e) => setTopN(e.target.value)}
            />
          </div>
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-600">
            Error al cargar: {String(error)}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-5">
        {kpiCards.map((k) => (
          <div
            key={k.title}
            className="border border-gray-200 rounded-xl p-4 flex items-center gap-3"
          >
            <k.icon className="h-8 w-8 text-gray-600" />
            <div>
              <div className="text-sm text-gray-500">{k.title}</div>
              <div className="text-lg font-semibold">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tendencia + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="lg:col-span-2 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold">Tendencia de ingresos</h3>
            <div className="text-xs text-gray-500">
              {data?.filters?.start} — {data?.filters?.end} ({data?.filters?.group_by})
            </div>
          </div>
          <div className="text-gray-700">
            <Sparkline data={timeseries} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="border border-gray-200 rounded p-2">
              <div className="text-gray-500">Puntos</div>
              <div className="font-semibold">{timeseries.length}</div>
            </div>
            <div className="border border-gray-200 rounded p-2">
              <div className="text-gray-500">Ingresos totales</div>
              <div className="font-semibold">
                {currencyUSD(kpis.revenue_usd)}
              </div>
            </div>
            <div className="border border-gray-200 rounded p-2">
              <div className="text-gray-500">Órdenes</div>
              <div className="font-semibold">{kpis.orders_count ?? 0}</div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-base font-semibold mb-3">Salud de órdenes</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <AlertPill
              color="text-amber-600"
              icon={ClockIcon}
              label="Sin procesar"
              value={alerts.not_processed ?? 0}
            />
            <AlertPill
              color="text-blue-600"
              icon={ExclamationCircleIcon}
              label="Pago en revisión"
              value={alerts.payment_review ?? 0}
            />
            <AlertPill
              color="text-cyan-700"
              icon={TruckIcon}
              label="Envío"
              value={alerts.shipping ?? 0}
            />
            <AlertPill
              color="text-indigo-700"
              icon={TruckIcon}
              label="Pickup"
              value={alerts.pickup ?? 0}
            />
            <AlertPill
              color="text-green-700"
              icon={CheckCircleIcon}
              label="Entregadas"
              value={alerts.delivered ?? 0}
            />
            <AlertPill
              color="text-red-600"
              icon={XCircleIcon}
              label="Canceladas"
              value={alerts.cancelled ?? 0}
            />
          </div>
        </div>
      </div>

      {/* Últimas órdenes */}
      <div className="border border-gray-200 rounded-xl mb-5 overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Últimas órdenes (mostrando {latestOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>#</Th>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Email</Th>
                <Th>Total</Th>
                <Th>Método</Th>
                <Th>Items</Th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.length ? (
                latestOrders.map((o, i) => (
                  <tr
                    key={o.id}
                    className={`border-b border-gray-200 ${
                      i % 2 === 0 ? "bg-white" : "bg-blue-gray-50/50"
                    }`}
                  >
                    <Td>#{o.id}</Td>
                    <Td>{formatDateTime(o.date_issued)}</Td>
                    <Td>{o.customer_name || "-"}</Td>
                    <Td className="truncate max-w-[220px]">{o.email || "-"}</Td>
                    <Td>{currencyUSD(o.total_amount)}</Td>
                    <Td>{o.payment_method || "-"}</Td>
                    <Td>{o.items ?? 0}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-sm text-center">
                    No hay órdenes en el rango seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardList
          title="Top productos por cantidad"
          items={topQty}
          leftLabel="Cantidad"
          leftKey="qty"
          rightLabel="Ingresos"
          rightKey="revenue_usd"
        />
        <CardList
          title="Top productos por ingresos"
          items={topRev}
          leftLabel="Ingresos"
          leftKey="revenue_usd"
          rightLabel="Cantidad"
          rightKey="qty"
        />
      </div>
    </div>
  );
};

// ---- Subcomponentes UI ----
function Th({ children }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
      {children}
    </th>
  );
}
function Td({ children, className = "" }) {
  return (
    <td
      className={
        "px-4 py-3 whitespace-nowrap text-sm text-gray-700 " + className
      }
    >
      {children}
    </td>
  );
}

function AlertPill({ color = "text-gray-700", icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between border border-gray-200 rounded-lg p-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function CardList({ title, items = [], leftLabel, leftKey, rightLabel, rightKey }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <div className="p-3 grid gap-3">
        {items.length ? (
          items.map((it, i) => (
            <div
              key={`${it.product_id}-${i}`}
              className="border border-gray-200 rounded p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm text-gray-500">Producto</div>
                <div className="font-semibold truncate">{it.name}</div>
                <div className="text-xs text-gray-500">ID: {it.product_id ?? "-"}</div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <div className="text-xs text-gray-500">{leftLabel}</div>
                  <div className="font-semibold">
                    {leftKey?.toLowerCase().includes("revenue")
                      ? currencyUSD(it[leftKey])
                      : it[leftKey] ?? "-"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">{rightLabel}</div>
                  <div className="font-semibold">
                    {rightKey?.toLowerCase().includes("revenue")
                      ? currencyUSD(it[rightKey])
                      : it[rightKey] ?? "-"}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 px-1 py-2">
            No hay productos para el rango seleccionado.
          </div>
        )}
      </div>
    </div>
  );
}

export default Index;
