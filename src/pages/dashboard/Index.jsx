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
import { fetchDashboardOverview } from "../../redux/features/order/orderSlices";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

// ---- Mini chart SVG simple (línea de ingresos) ---- (lo mantengo por si lo quieres reutilizar)
function Sparkline({ data = [], width = 420, height = 80, pad = 8, stroke = "#2563EB", fill = "rgba(37,99,235,0.08)" }) {
  const values = (data || []).map((d) => {
    const v = d == null ? 0 : Number(d.revenue_usd ?? d.revenue ?? 0);
    return Number.isFinite(v) ? v : 0;
  });

  if (!values.length) {
    return (
      <div className="h-[80px] flex items-center justify-center text-sm text-gray-400">
        Sin datos
      </div>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const n = values.length;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const stepX = n === 1 ? 0 : innerW / (n - 1);

  const mapX = (i) => pad + (n === 1 ? innerW / 2 : i * stepX);
  const mapY = (v) => {
    const t = (v - min) / (max - min || 1);
    return pad + (1 - t) * innerH;
  };

  const dPath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${mapX(i).toFixed(2)} ${mapY(v).toFixed(2)}`)
    .join(" ");

  const areaPath =
    values.length === 1
      ? `${dPath} L ${mapX(0).toFixed(2)} ${height - pad} L ${mapX(0).toFixed(2)} ${mapY(values[0]).toFixed(2)} Z`
      : `${dPath} L ${mapX(n - 1).toFixed(2)} ${height - pad} L ${mapX(0).toFixed(2)} ${height - pad} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      height={height}
      className="block"
      aria-hidden
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={height - pad}
        y2={height - pad}
        stroke={stroke}
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <path d={areaPath} fill={fill} stroke="none" />
      <path d={dPath} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const cx = mapX(i);
        const cy = mapY(v);
        return <circle key={i} cx={cx} cy={cy} r={n <= 30 ? 2.5 : 0} fill={stroke} opacity={0.95} />;
      })}
    </svg>
  );
}

const Index = () => {
  const dispatch = useDispatch();
  const { dashboard } = useSelector((s) => s.adminOrders || s.order); // intenta ambas keys por compatibilidad
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

  // Carga inicial
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
  const monthlySales = data?.monthly_sales || [];

  const loading = status === "loading";

  // Prepara datos para la gráfica de barras
  const chartData = useMemo(() => {
    // monthlySales viene normalizado (revenue_usd ya número). Aseguramos formato correcto.
    return (monthlySales || []).map((s) => ({
      date: s.date, // ISO
      day: s.day,
      revenue: Number(s.revenue_usd || 0),
    }));
  }, [monthlySales]);

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
        title: "Gasto promedio",
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
    <div className="text-gray-800 bg-white pr-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Panel de inicio</h1>
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
      <div className="border border-gray-200 rounded bg-white p-4 mb-5">
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
            className="border border-gray-200  rounded p-4 flex items-center gap-3 bg-white"
          >
            <k.icon className="h-8 w-8 text-green-400" />
            <div>
              <div className="text-sm text-gray-800">{k.title}</div>
              <div className="text-lg font-semibold text-red-600">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Ventas por día + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 ">
        <div className="lg:col-span-2 border border-gray-200 rounded p-4 bg-white">
          <div className="flex items-center justify-between mb-4 ">
            <h3 className="text-base font-semibold">Ventas por día</h3>
            <div className="text-xs text-red-500 font-medium">
              {data?.filters?.start} — {data?.filters?.end}
            </div>
          </div>

          <div className="h-56">
            {chartData && chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.06} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    // si quieres mostrar '01', puedes formatear aquí
                  />
                  <YAxis
                    tickFormatter={(v) => {
                      // Mostrar sólo números abreviados en el eje si son grandes
                      return currencyUSD(v);
                    }}
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => currencyUSD(value)}
                    labelFormatter={(label, payload) => {
                      // encontrar la fecha del payload para mostrar ISO si se quiere
                      const p = (payload && payload.length && payload[0]) || null;
                      if (p && p.payload && p.payload.date) {
                        return p.payload.date;
                      }
                      return `Día ${label}`;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No hay datos de ventas para el rango seleccionado.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm mt-3">
            <div className="border border-gray-200 rounded p-2">
              <div className="text-gray-500">Días</div>
              <div className="font-semibold">{chartData.length}</div>
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

        <div className="border border-gray-200 rounded p-4 bg-white">
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
      <div className="border border-gray-200 rounded mb-5 overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Últimas órdenes (mostrando {latestOrders.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
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
    <div className="flex items-center justify-between border border-gray-200 rounded p-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-red-600">{value}</span>
    </div>
  );
}

function CardList({ title, items = [], leftLabel, leftKey, rightLabel, rightKey }) {
  return (
    <div className="border border-gray-200 rounded overflow-hidden">
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
