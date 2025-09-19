// src/redux/features/product/productSlices.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import fileDownload from "js-file-download";

const initialState = {
  products: [],
  productStatus: "idle",
  exportStatus: "idle",
  importStatus: "idle",
  importResult: null,
  error: null,
};

// ✅ Filtros esperados: { in_stock, in_promo, category_id, min_price, max_price, currency, etc }
export const fetchAdminProducts = createAsyncThunk(
  "adminProducts/fetchAdminProducts",
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
        `http://127.0.0.1:8000/api/product/get-products/?${params}`,
        config
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error al obtener productos"
      );
    }
  }
);

// ✅ Exportar productos en CSV
export const exportProductsCSV = createAsyncThunk(
  "adminProducts/exportProductsCSV",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "*/*",
          Authorization: `JWT ${token}`,
        },
        responseType: "blob", // ← importante para archivos
      };

      const response = await axios.get(
        "http://127.0.0.1:8000/api/product/products/export/",
        config
      );

      // Usamos fileDownload para guardar el archivo
      fileDownload(response.data, "products.csv");
      return true;
    } catch (error) {
      console.log(error);
      return rejectWithValue("Error al exportar productos");
    }
  }
);

// ✅ Importar productos en CSV
export const importProductsCSV = createAsyncThunk(
  "adminProducts/importProductsCSV",
  async (file, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const config = {
        headers: {
          Accept: "application/json",
          Authorization: `JWT ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/product/products/import/",
        formData,
        config
      );

      return response.data;
    } catch (error) {
      console.error(error.response);
      return rejectWithValue(
        error.response?.data?.error || "Error al importar productos"
      );
    }
  }
);

const adminProductsSlice = createSlice({
  name: "adminProducts",
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.productStatus = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.productStatus = "loading";
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.productStatus = "succeeded";
        state.products = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.productStatus = "failed";
        state.error = action.payload;
      })
      // ExtraReducers para exportación de productos
      .addCase(exportProductsCSV.pending, (state) => {
        state.exportStatus = "loading";
      })
      .addCase(exportProductsCSV.fulfilled, (state) => {
        state.exportStatus = "succeeded";
      })
      .addCase(exportProductsCSV.rejected, (state, action) => {
        state.exportStatus = "failed";
        state.error = action.payload;
      })
      // ExtraReducers para importación de productos
      .addCase(importProductsCSV.pending, (state) => {
        state.importStatus = "loading";
        state.importResult = null;
        state.error = null;
      })
      .addCase(importProductsCSV.fulfilled, (state, action) => {
        state.importStatus = "succeeded";
        state.importResult = action.payload;
      })
      .addCase(importProductsCSV.rejected, (state, action) => {
        state.importStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearProducts } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;
