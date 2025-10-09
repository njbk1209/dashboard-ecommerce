import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  salesReports: [],
  reportDetail: null,
  salesReportsStatus: "idle",
  error: null,
};

const BASE_URL = import.meta.env.VITE_API_URL;

// 1️⃣ Crear reporte de ventas
export const createSalesReport = createAsyncThunk(
  "salesReports/createSalesReport",
  async (date, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };

      const response = await axios.post(
        `${BASE_URL}/sales/sales-reports/create/?date=${date}`,
        null, // sin body
        config
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error al crear el reporte"
      );
    }
  }
);

// 2️⃣ Obtener listado de reportes
export const fetchSalesReports = createAsyncThunk(
  "salesReports/fetchSalesReports",
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
        `${BASE_URL}/sales/sales-reports/?${params}`,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error al obtener reportes"
      );
    }
  }
);

// 3️⃣ Obtener detalle de un reporte por id y fecha
export const fetchSalesReportDetail = createAsyncThunk(
  "salesReports/fetchSalesReportDetail",
  async ({ id, date }, { rejectWithValue }) => {
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
        `${BASE_URL}/sales/sales-reports/detail/?id=${id}&date=${date}`,
        config
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error al obtener detalles del reporte"
      );
    }
  }
);

// Slice
const salesReportsSlice = createSlice({
  name: "salesReports",
  initialState,
  reducers: {
    clearReportDetail: (state) => {
      state.reportDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Crear reporte
      .addCase(createSalesReport.pending, (state) => {
        state.salesReportsStatus = "loading";
        state.error = null;
      })
      .addCase(createSalesReport.fulfilled, (state, action) => {
        state.salesReportsStatus = "succeeded";
        state.salesReports.unshift(action.payload); // opcional: agregar a la lista
      })
      .addCase(createSalesReport.rejected, (state, action) => {
        state.salesReportsStatus = "failed";
        state.error = action.payload;
      })

      // Listar reportes
      .addCase(fetchSalesReports.pending, (state) => {
        state.salesReportsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchSalesReports.fulfilled, (state, action) => {
        state.salesReportsStatus = "succeeded";

        // ✅ Manejo seguro del resultado
        if (Array.isArray(action.payload.results)) {
          state.salesReports = action.payload.results;
        } else {
          state.salesReports = action.payload;
        }
      })
      .addCase(fetchSalesReports.rejected, (state, action) => {
        state.salesReportsStatus = "failed";
        state.error = action.payload;
      })

      // Detalle de reporte
      .addCase(fetchSalesReportDetail.pending, (state) => {
        state.salesReportsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchSalesReportDetail.fulfilled, (state, action) => {
        state.salesReportsStatus = "succeeded";
        state.reportDetail = action.payload;
      })
      .addCase(fetchSalesReportDetail.rejected, (state, action) => {
        state.salesReportsStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearReportDetail } = salesReportsSlice.actions;
export default salesReportsSlice.reducer;
