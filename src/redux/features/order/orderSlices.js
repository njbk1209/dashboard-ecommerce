// src/redux/features/order/adminOrdersSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-hot-toast"; // lo usabas en fetchOrderById

const initialState = {
  orders: [],
  order: null,
  paymentProof: null,
  orderNotes: [],
  orderStatus: "idle",
  notesStatus: "idle",
  error: null,

  dashboard: {
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    data: null, // { filters, kpis, timeseries, alerts, latest_orders, top_products_* }
    error: null,
    params: {
      start: null, // e.g. '2025-09-01'
      end: null, // e.g. '2025-09-26'
      group_by: "day", // 'day' | 'week' | 'month'
      status: "delivered", // 'delivered' | 'all' (afecta secciones exitosas)
      latest_limit: 10,
      top_n: 5,
    },
  },
};

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---------------------- Helpers ----------------------
const toQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

const toNumber = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const cleaned = v.replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  // por si viene Decimal serializado u otro objeto
  try {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

const normalizeDashboard = (raw) => {
  if (!raw) return raw;

  const kpis = raw.kpis || {};
  const normalizeKpis = {
    ...kpis,
    revenue_usd: toNumber(kpis.revenue_usd),
    revenue_bs: toNumber(kpis.revenue_bs),
    subtotal_usd: toNumber(kpis.subtotal_usd),
    iva_usd: toNumber(kpis.iva_usd),
    shipping_subtotal_usd: toNumber(kpis.shipping_subtotal_usd),
    shipping_iva_usd: toNumber(kpis.shipping_iva_usd),
    shipping_total_usd: toNumber(kpis.shipping_total_usd),
    orders_count: toNumber(kpis.orders_count),
    customers_count: toNumber(kpis.customers_count),
    units_sold: toNumber(kpis.units_sold),
    aov_usd: toNumber(kpis.aov_usd),
  };

  const timeseries = Array.isArray(raw.timeseries)
    ? raw.timeseries.map((r) => ({
        ...r,
        revenue_usd: toNumber(r.revenue_usd),
        shipping_total_usd: toNumber(r.shipping_total_usd),
        orders: toNumber(r.orders),
        units: toNumber(r.units),
        date: r.date,
      }))
    : [];

  const monthly_sales = Array.isArray(raw.monthly_sales)
    ? raw.monthly_sales.map((r) => ({
        date: r.date,
        day: toNumber(r.day),
        revenue_usd: toNumber(r.revenue_usd),
      }))
    : [];

  const top_products_qty = Array.isArray(raw.top_products_qty)
    ? raw.top_products_qty.map((p) => ({
        ...p,
        qty: toNumber(p.qty),
        revenue_usd: toNumber(p.revenue_usd),
      }))
    : [];

  const top_products_revenue = Array.isArray(raw.top_products_revenue)
    ? raw.top_products_revenue.map((p) => ({
        ...p,
        qty: toNumber(p.qty),
        revenue_usd: toNumber(p.revenue_usd),
      }))
    : [];

  const latest_orders = Array.isArray(raw.latest_orders)
    ? raw.latest_orders.map((o) => ({
        ...o,
        total_amount: toNumber(o.total_amount),
        items: toNumber(o.items),
      }))
    : [];

  return {
    ...raw,
    kpis: normalizeKpis,
    timeseries,
    monthly_sales,
    top_products_qty,
    top_products_revenue,
    latest_orders,
  };
};

// ---------------------- Thunks (mantengo los tuyos y reemplazo fetchDashboardOverview) ----------------------

// filters es un objeto con claves opcionales: { status, user, date_from, date_to }
export const fetchAdminOrders = createAsyncThunk(
  "adminOrders/fetchAdminOrders",
  async (filters = {}, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(
        `http://127.0.0.1:8000/api/order/get-orders-admin/?${params}`,
        config
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(
        error.response?.data?.detail || "Error al obtener órdenes"
      );
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "order/fetchOrderById",
  async (orderId, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };

      const response = await axios.get(
        `http://127.0.0.1:8000/api/order/get-order/${orderId}/`,
        config
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Error al obtener la orden";
      toast.error(message);
      console.log(error);
      return rejectWithValue(message);
    }
  }
);

export const fetchPaymentProofById = createAsyncThunk(
  "adminOrders/fetchPaymentProofById",
  async (order_id, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };

      const response = await axios.get(
        `http://127.0.0.1:8000/api/payment/get-payment-proof/?order_id=${order_id}`,
        config
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          "Error al obtener el comprobante de pago"
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  "order/updateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/order/update-status/${orderId}/`,
        { status },
        config
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        "Error al actualizar el estado de la orden";
      return rejectWithValue(message);
    }
  }
);

// Fetch order details
export const fetchOrderDetails = createAsyncThunk(
  "orders/fetchOrderDetails",
  async (orderId, thunkAPI) => {
    try {
      const token = localStorage.getItem("access");
      const response = await axios.get(
        `${API_URL}/api/order/get-order/${orderId}/`,
        {
          headers: {
            Authorization: token ? `JWT ${token}` : "",
          },
        }
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(error);
      return thunkAPI.rejectWithValue(
        error.response?.data || "Error al obtener detalles de la orden"
      );
    }
  }
);

// Actualizar items de una orden
export const updateOrderItems = createAsyncThunk(
  "orders/updateOrderItems",
  async ({ orderId, action, item_id, product_id, quantity }, thunkAPI) => {
    try {
      const token = localStorage.getItem("access");

      // Construir el payload según la acción
      let payload = { action };

      // Añadir los parámetros correspondientes según la acción
      if (action === "edit") {
        payload.item_id = item_id;
        payload.quantity = quantity;
      } else if (action === "add") {
        payload.product_id = product_id;
        payload.quantity = quantity;
      } else if (action === "remove") {
        payload.item_id = item_id;
      }

      const response = await axios.post(
        `${API_URL}api/order/edit-order-items/${orderId}/`,
        payload,
        {
          headers: {
            Authorization: token ? `JWT ${token}` : "",
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Error al actualizar los items de la orden"
      );
    }
  }
);

export const fetchOrderNotes = createAsyncThunk(
  "orders/fetchOrderNotes",
  async (orderId, thunkAPI) => {
    try {
      const token = localStorage.getItem("access");
      const response = await axios.get(
        `${API_URL}api/order/get-notes/${orderId}/`,
        {
          headers: {
            Authorization: token ? `JWT ${token}` : "",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.log(error);
      return thunkAPI.rejectWithValue(
        error.response?.data || "Error al obtener notas de la orden"
      );
    }
  }
);

// ---------------------- fetchDashboardOverview (reemplazado) ----------------------
export const fetchDashboardOverview = createAsyncThunk(
  "adminOrders/fetchDashboardOverview",
  async (params = {}, { rejectWithValue, getState }) => {
    const token = localStorage.getItem("access");
    if (!token) return rejectWithValue("No access token");

    // mezcla con defaults guardados en el state
    const state = getState();
    const defaults = state.adminOrders?.dashboard?.params || {};
    const q = { ...defaults, ...params };
    const qs = toQuery(q);

    try {
      const res = await axios.get(
        `${API_URL}/api/order/info-dashboard/${qs ? `?${qs}` : ""}`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `JWT ${token}`,
          },
        }
      );

      // Normalizar la payload para el frontend (Number en vez de strings/Decimal)
      const normalized = normalizeDashboard(res.data);

      return { data: normalized, params: q };
    } catch (error) {
      const msg =
        error?.response?.data?.detail ||
        error?.response?.data ||
        "Error al obtener el dashboard";
      return rejectWithValue(msg);
    }
  }
);

// ---------------------- Slice ----------------------
const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState,
  reducers: {
    clearOrder: (state) => {
      state.order = null;
      state.orderStatus = "loading";
    },
    clearPaymentProof: (state) => {
      state.paymentProof = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.orderStatus = "loading";
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.orders = action.payload;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload || "Error desconocido";
      })
      // Obtener orden por ID
      .addCase(fetchOrderById.pending, (state) => {
        state.orderStatus = "loading";
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.order = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchPaymentProofById.pending, (state) => {
        state.orderStatus = "loading";
        state.error = null;
      })
      .addCase(fetchPaymentProofById.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.paymentProof = action.payload;
      })
      .addCase(fetchPaymentProofById.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload || "Error al cargar el comprobante";
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.orderStatus = "loading";
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.order = action.payload; // actualiza el estado con la orden modificada
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload;
      })
      // Reducers para updateOrderItems
      .addCase(updateOrderItems.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateOrderItems.fulfilled, (state, action) => {
        state.status = "succeeded";
        // Actualizar los items en los detalles de la orden si están disponibles
        if (state.order) {
          // La respuesta de la API debería incluir los items actualizados
          state.order.items = action.payload.items || state.order.items;

          // Actualizar el total si está disponible en la respuesta
          if (action.payload.total) {
            state.order.total = action.payload.total;
          }
        }
      })
      .addCase(updateOrderItems.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Obtenemos los detalles de la orden consultada
      .addCase(fetchOrderDetails.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.order = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // Reducers para fetchOrderNotes
      .addCase(fetchOrderNotes.pending, (state) => {
        state.notesStatus = "loading";
      })
      .addCase(fetchOrderNotes.fulfilled, (state, action) => {
        state.notesStatus = "succeeded";
        state.orderNotes = action.payload;
      })
      .addCase(fetchOrderNotes.rejected, (state, action) => {
        state.notesStatus = "failed";
        state.error = action.payload;
      })
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.dashboard.status = "loading";
        state.dashboard.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.dashboard.status = "succeeded";
        state.dashboard.data = action.payload.data;
        state.dashboard.params = action.payload.params;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.dashboard.status = "failed";
        state.dashboard.error =
          typeof action.payload === "string"
            ? action.payload
            : "No se pudo cargar el dashboard";
      });
  },
});

export const { clearOrder, clearPaymentProof } = adminOrdersSlice.actions;
export default adminOrdersSlice.reducer;
