import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";

// state
const initialState = {
  rate: null,
  date: null,
  exchangeStatus: "idle", //'idle', 'loading', 'succeeded', 'failed'
  error: null,
  selectedExchange: "Bs", 
};

const API_URL = import.meta.env.VITE_API_URL;

export const fetchLatestExchange = createAsyncThunk(
  "exchange/fetchLatestExchange",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/exchange/get-exchange/`
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.detail || "Error al obtener la tasa de cambio del día"
      );
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
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { setSelectedExchange, clearExchangeError } = exchangeSlice.actions;
export default exchangeSlice.reducer;

