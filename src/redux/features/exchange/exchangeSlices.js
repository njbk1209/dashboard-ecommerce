import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// state
const initialState = {
  rate: null,
  date: null,
  exchangeStatus: "idle",
  error: null,
  selectedExchange: "Bs",
  createStatus: "idle",
  createError: null,
};

const BASE_URL = import.meta.env.VITE_API_URL;

// thunk existente (ya lo tenías)
export const fetchLatestExchange = createAsyncThunk(
  "exchange/fetchLatestExchange",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/exchange/get-exchange/`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Error al obtener la tasa de cambio del día"
      );
    }
  }
);

// NUEVO thunk para crear una tasa (POST)
// recibe un número (rate) o un objeto { rate: number }
export const createExchange = createAsyncThunk(
  "exchange/createExchange",
  async (payload, { rejectWithValue }) => {
    const token = localStorage.getItem("access");
    try {
      // aceptar tanto un número como { rate: number }
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };
      const rateValue = typeof payload === "number" ? payload : payload?.rate;
      const response = await axios.post(`${BASE_URL}/api/exchange/exchange-rate/`, {
        rate: rateValue,
      }, config);
      return response.data; // se espera { date, rate }
    } catch (err) {
      // devolver mensaje de error útil
      const serverData = err.response?.data;
      const message =
        serverData?.detail ||
        serverData ||
        "Error al crear la tasa de cambio";
      return rejectWithValue(message);
    }
  }
);

const exchangeSlice = createSlice({
  name: "exchange",
  initialState,
  reducers: {
    setSelectedExchange: (state, action) => {
      state.selectedExchange = action.payload;
    },
    clearExchangeError(state) {
      state.error = null;
      state.exchangeStatus = "idle";
    },
    clearCreateError(state) {
      state.createError = null;
      state.createStatus = "idle";
    },
    // opcional: resetear estado de creación
    resetCreateState(state) {
      state.createStatus = "idle";
      state.createError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchLatestExchange handlers (existentes)
      .addCase(fetchLatestExchange.pending, (state) => {
        state.exchangeStatus = "loading";
        state.error = null;
      })
      .addCase(fetchLatestExchange.fulfilled, (state, action) => {
        state.exchangeStatus = "succeeded";
        state.rate = action.payload.rate;
        state.date = action.payload.date;
      })
      .addCase(fetchLatestExchange.rejected, (state, action) => {
        state.exchangeStatus = "failed";
        state.error = action.payload;
      })

      // createExchange handlers (nuevos)
      .addCase(createExchange.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createExchange.fulfilled, (state, action) => {
        state.createStatus = "succeeded";
        // actualizar tasa actual con la respuesta
        state.rate = action.payload.rate;
        state.date = action.payload.date;
      })
      .addCase(createExchange.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload;
      });
  },
});

export const {
  setSelectedExchange,
  clearExchangeError,
  clearCreateError,
  resetCreateState,
} = exchangeSlice.actions;

export default exchangeSlice.reducer;
