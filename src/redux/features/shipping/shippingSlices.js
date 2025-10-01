import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ----------------------------------------
// 1️⃣ Fetch Travels
// ----------------------------------------
export const fetchTravels = createAsyncThunk(
  "shipping/fetchTravels",
  async (params = {}, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;

        if (key === "is_paid") {
          const lower = String(value).toLowerCase();
          if (["true", "false", "1", "0"].includes(lower)) {
            searchParams.append(key, ["true", "1"].includes(lower) ? "true" : "false");
          }
          return;
        }

        if (typeof value === "boolean") searchParams.append(key, value ? "true" : "false");
        else searchParams.append(key, String(value));
      });

      const url = searchParams.toString()
        ? `${API_URL}/api/shipping/get-travels/?${searchParams.toString()}`
        : `${API_URL}/api/shipping/get-travels/`;

      const response = await axios.get(url, {
        headers: { Authorization: `JWT ${token}` },
      });

      const data = response.data;
      if (data && Array.isArray(data.results)) {
        return {
          travels: data.results,
          meta: {
            count: data.count ?? data.results.length,
            next: data.next ?? null,
            previous: data.previous ?? null,
          },
        };
      }

      return {
        travels: Array.isArray(data) ? data : [data],
        meta: { count: Array.isArray(data) ? data.length : 1, next: null, previous: null },
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Error al obtener travels");
    }
  }
);

// ----------------------------------------
// 2️⃣ Fetch Available Couriers
// ----------------------------------------
export const fetchAvailableCouriers = createAsyncThunk(
  "shipping/fetchAvailableCouriers",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const response = await axios.get(`${API_URL}/api/shipping/couriers/available/`, {
        headers: { Authorization: `JWT ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Error al obtener couriers");
    }
  }
);

// ----------------------------------------
// 3️⃣ Assign Courier to Travel
// ----------------------------------------
export const assignCourierToTravel = createAsyncThunk(
  "shipping/assignCourierToTravel",
  async ({ travel_id, courier_id }, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const response = await axios.patch(
        `${API_URL}/api/shipping/travel/${travel_id}/assign-courier/`,
        { courier_id },
        { headers: { Authorization: `JWT ${token}` } }
      );
      // Esperamos que el backend devuelva el travel actualizado. Si no lo hace,
      // al menos devolvemos el objeto de respuesta para que el reducer haga lo posible.
      return { travel: response.data, travel_id };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Error al asignar courier");
    }
  }
);

// ----------------------------------------
// 4️⃣ Mark Travel Delivered
// ----------------------------------------
export const markTravelDelivered = createAsyncThunk(
  "shipping/markTravelDelivered",
  async ({ travel_id }, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const response = await axios.patch(
        `${API_URL}/api/shipping/travel/${travel_id}/mark-delivered/`,
        {},
        { headers: { Authorization: `JWT ${token}` } }
      );
      // El backend devuelve { order_id: <id> } — añadimos travel_id para uso local en reducer.
      return { order_id: response.data.order_id, travel_id };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Error al marcar entregado");
    }
  }
);

// agregar al top de tu archivo donde ya importas createAsyncThunk y axios
export const fetchCuts = createAsyncThunk(
  "shipping/fetchCuts",
  async (params = {}, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      const searchParams = new URLSearchParams();

      // params esperados: page, page_size, status (opcional)
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        // casteos simples
        if (typeof value === "boolean") searchParams.append(key, value ? "true" : "false");
        else searchParams.append(key, String(value));
      });

      const url = searchParams.toString()
        ? `${API_URL}/api/shipping/get-cuts/?${searchParams.toString()}`
        : `${API_URL}/api/shipping/get-cuts/`;

      const response = await axios.get(url, {
        headers: { Authorization: `JWT ${token}` },
      });

      const data = response.data;
      // Si el backend usa paginación DRF estándar devuelve {count, next, previous, results}
      if (data && Array.isArray(data.results)) {
        return {
          cuts: data.results,
          meta: {
            count: data.count ?? data.results.length,
            next: data.next ?? null,
            previous: data.previous ?? null,
          },
        };
      }

      // Si backend devuelve una lista simple
      return {
        cuts: Array.isArray(data) ? data : [data],
        meta: { count: Array.isArray(data) ? data.length : 1, next: null, previous: null },
      };
    } catch (error) {
      // Manejo robusto del error
      const payload = error.response?.data || error.message || "Error al obtener cortes";
      return rejectWithValue(payload);
    }
  }
);

export const createCut = createAsyncThunk(
  "shipping/createCut",
  /**
   * payload: {
   *   start_date: string (ISO date e.g. "2025-09-01T00:00:00Z" o "2025-09-01"),
   *   end_date: string,
   *   exchange_rate: string|number (opcional),
   *   note: string (opcional),
   *   refreshAfter: boolean (opcional) -> si true disparará fetchCuts al finalizar (en el componente puedes usar unwrap)
   * }
   */
  async (payload = {}, { rejectWithValue, dispatch }) => {
    const token = localStorage.getItem("access");
    try {
      const url = `${API_URL}/api/shipping/create-cut/`;
      // Preparar body
      const body = {
        start_date: payload.start_date,
        end_date: payload.end_date,
      };
      if (payload.exchange_rate !== undefined && payload.exchange_rate !== null && payload.exchange_rate !== "") {
        body.exchange_rate = String(payload.exchange_rate);
      }
      if (payload.note) body.note = payload.note;

      // Hacemos POST esperando un PDF (blob)
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `JWT ${token}`,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        responseType: "blob",
      });

      // Si llegamos aquí, probablemente recibimos un blob (PDF).
      const contentDisposition = response.headers["content-disposition"] || "";
      // intentar obtener filename de header
      let filename = `corte_${new Date().toISOString().replace(/[:.]/g, "")}.pdf`;
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];

      // Crear blob URL y forzar descarga
      const blob = new Blob([response.data], { type: response.data.type || "application/pdf" });
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);

      // opcional: refrescar lista de cortes si se pidió
      if (payload.refreshAfter) {
        // refrescar la primera página por defecto (puedes cambiar params)
        dispatch(fetchCuts({ page: 1, page_size: 20 }));
      }

      // retornamos metadata por si el componente necesita info
      return { filename };
    } catch (err) {
      // Si el backend respondió con JSON de error pero convirtiéndolo a blob, parsearlo
      const response = err?.response;
      if (response && response.data && response.data instanceof Blob) {
        try {
          const text = await response.data.text();
          const parsed = JSON.parse(text);
          return rejectWithValue(parsed);
        } catch (parseErr) {
          return rejectWithValue(response.statusText || "Error desconocido al crear corte");
        }
      }

      const payloadErr = err.response?.data || err.message || "Error al crear corte";
      return rejectWithValue(payloadErr);
    }
  }
);


// ----------------------------------------
// Slice
// ----------------------------------------
const initialState = {
  travels: [],
  meta: { count: 0, next: null, previous: null },
  couriers: [],
  cuts: [],
  cutsMeta: { count: 0, next: null, previous: null },

  // estados separados para que no se pisen en UI
  statusTravels: "idle",
  statusCouriers: "idle",
  statusAssign: "idle",
  statusDeliver: "idle",
  statusCuts: "idle",
  statusCreateCut: "idle",   // 'idle' | 'loading' | 'succeeded' | 'failed'

  errorTravels: null,
  errorCouriers: null,
  errorAssign: null,
  errorDeliver: null,
  errorCuts: null,
  errorCreateCut: null,
  lastCreatedCutFileName: null, // nombre del PDF descargado (opcional)

  // útil para redirección después de marcar entregado
  lastDeliveredOrderId: null,
};


const shippingSlice = createSlice({
  name: "shipping",
  initialState,
  reducers: {
    clearTravelsState(state) {
      state.travels = [];
      state.meta = { count: 0, next: null, previous: null };
      state.statusTravels = "idle";
      state.errorTravels = null;
    },
    clearCouriersState(state) {
      state.couriers = [];
      state.statusCouriers = "idle";
      state.errorCouriers = null;
    },
    clearAssignState(state) {
      state.statusAssign = "idle";
      state.errorAssign = null;
    },
    clearDeliverState(state) {
      state.statusDeliver = "idle";
      state.errorDeliver = null;
      state.lastDeliveredOrderId = null;
    },
    clearCutsState(state) {
      state.cuts = [];
      state.cutsMeta = { count: 0, next: null, previous: null };
      state.statusCuts = "idle";
      state.errorCuts = null;
    },
    clearCreateCutState(state) {
      state.statusCreateCut = "idle";
      state.errorCreateCut = null;
      state.lastCreatedCutFileName = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTravels
    builder
      .addCase(fetchTravels.pending, (state) => {
        state.statusTravels = "loading";
        state.errorTravels = null;
      })
      .addCase(fetchTravels.fulfilled, (state, action) => {
        state.statusTravels = "succeeded";
        state.travels = action.payload.travels;
        state.meta = action.payload.meta;
      })
      .addCase(fetchTravels.rejected, (state, action) => {
        state.statusTravels = "failed";
        state.errorTravels = action.payload || action.error?.message;
      });

    // fetchAvailableCouriers
    builder
      .addCase(fetchAvailableCouriers.pending, (state) => {
        state.statusCouriers = "loading";
        state.errorCouriers = null;
      })
      .addCase(fetchAvailableCouriers.fulfilled, (state, action) => {
        state.statusCouriers = "succeeded";
        state.couriers = action.payload;
      })
      .addCase(fetchAvailableCouriers.rejected, (state, action) => {
        state.statusCouriers = "failed";
        state.errorCouriers = action.payload || action.error?.message;
      });

    // assignCourierToTravel
    builder
      .addCase(assignCourierToTravel.pending, (state) => {
        state.statusAssign = "loading";
        state.errorAssign = null;
      })
      .addCase(assignCourierToTravel.fulfilled, (state, action) => {
        state.statusAssign = "succeeded";
        // action.payload.travel puede contener el travel actualizado (según backend).
        const returned = action.payload;
        if (returned?.travel && typeof returned.travel === "object") {
          // backend devolvió el travel completo
          const updated = returned.travel;
          const index = state.travels.findIndex((t) => t.id === updated.id);
          if (index !== -1) state.travels[index] = updated;
          else state.travels.unshift(updated); // o añadir si no estaba en la lista
        } else if (returned?.travel_id) {
          // Si backend no devolvió el travel completo, actualizamos mínimamente por id:
          const idx = state.travels.findIndex((t) => t.id === returned.travel_id);
          if (idx !== -1) {
            // ponemos courier placeholder (el frontend refrescará idealmente)
            state.travels[idx].courier = state.couriers.find((c) => String(c.id) === String(state.couriers.find?.id)) || state.travels[idx].courier;
            state.travels[idx].status = "in_shipping";
          }
        }
      })
      .addCase(assignCourierToTravel.rejected, (state, action) => {
        state.statusAssign = "failed";
        state.errorAssign = action.payload || action.error?.message;
      });

    // markTravelDelivered
    builder
      .addCase(markTravelDelivered.pending, (state) => {
        state.statusDeliver = "loading";
        state.errorDeliver = null;
      })
      .addCase(markTravelDelivered.fulfilled, (state, action) => {
        state.statusDeliver = "succeeded";
        const { order_id, travel_id } = action.payload || {};
        state.lastDeliveredOrderId = order_id ?? null;

        // actualizar travel localmente si está en la lista
        if (travel_id) {
          const idx = state.travels.findIndex((t) => Number(t.id) === Number(travel_id));
          if (idx !== -1) {
            state.travels[idx].status = "delivered";
            state.travels[idx].end_time = new Date().toISOString();
            // si existe courier, marcar disponible localmente (opcional)
            if (state.travels[idx].courier) {
              state.travels[idx].courier.status = "available";
            }
          }
        }
      })
      .addCase(markTravelDelivered.rejected, (state, action) => {
        state.statusDeliver = "failed";
        state.errorDeliver = action.payload || action.error?.message;
      });
    builder
      .addCase(fetchCuts.pending, (state) => {
        state.statusCuts = "loading";
        state.errorCuts = null;
      })
      .addCase(fetchCuts.fulfilled, (state, action) => {
        state.statusCuts = "succeeded";
        state.cuts = action.payload.cuts;
        state.cutsMeta = action.payload.meta;
      })
      .addCase(fetchCuts.rejected, (state, action) => {
        state.statusCuts = "failed";
        state.errorCuts = action.payload || action.error?.message;
      });
    builder
      .addCase(createCut.pending, (state) => {
        state.statusCreateCut = "loading";
        state.errorCreateCut = null;
        state.lastCreatedCutFileName = null;
      })
      .addCase(createCut.fulfilled, (state, action) => {
        state.statusCreateCut = "succeeded";
        state.errorCreateCut = null;
        state.lastCreatedCutFileName = action.payload?.filename || null;
      })
      .addCase(createCut.rejected, (state, action) => {
        state.statusCreateCut = "failed";
        state.errorCreateCut = action.payload || action.error?.message;
        state.lastCreatedCutFileName = null;
      });

  },
});

export const {
  clearTravelsState,
  clearCouriersState,
  clearAssignState,
  clearDeliverState,
  clearCutsState,
  clearCreateCutState,
} = shippingSlice.actions;

export default shippingSlice.reducer;
