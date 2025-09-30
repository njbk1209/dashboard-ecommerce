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

// ----------------------------------------
// Slice
// ----------------------------------------
const initialState = {
  travels: [],
  meta: { count: 0, next: null, previous: null },
  couriers: [],

  // estados separados para que no se pisen en UI
  statusTravels: "idle",
  statusCouriers: "idle",
  statusAssign: "idle",
  statusDeliver: "idle",

  errorTravels: null,
  errorCouriers: null,
  errorAssign: null,
  errorDeliver: null,

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
  },
});

export const {
  clearTravelsState,
  clearCouriersState,
  clearAssignState,
  clearDeliverState,
} = shippingSlice.actions;

export default shippingSlice.reducer;
