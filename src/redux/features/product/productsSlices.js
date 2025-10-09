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
  searchProducts: [],
  searchProductsStatus: "idle",
};

const BASE_URL = import.meta.env.VITE_API_URL;

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
        `${BASE_URL}/api/product/get-products/?${params}`,
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
        `${BASE_URL}/api/product/products/export/`,
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
        `${BASE_URL}/api/product/products/import/`,
        formData,
        config
      );

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Nombre de archivo con timestamp (opcional)
      link.setAttribute(
        "download",
        `errores_productos_${new Date().toISOString().slice(0, 19)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Retornamos algún indicador de éxito
      return { success: true, message: "CSV procesado y resumen descargado" };
    } catch (error) {
      console.error(error);
      return rejectWithValue(
        error.response?.data?.error || "Error al importar productos"
      );
    }
  }
);

// Thunk para buscar productos en el search bar
export const fetchSearchProducts = createAsyncThunk(
  "product/fetchSearchProducts",
  async (query, { rejectWithValue, signal }) => {
    try {
      const params = new URLSearchParams();
      params.append("q", query);
      const response = await axios.get(
        `${BASE_URL}/api/product/search-products/?${params.toString()}`,
        { signal } // 👈 importante
      );
      return response.data;
    } catch (error) {
      // si fue cancelado, relanza para que RTK lo marque como abortado
      console.log(error);
      if (axios.isCancel?.(error) || error?.name === "CanceledError")
        throw error;
      return rejectWithValue(
        error.response?.data || "Error en la búsqueda de productos"
      );
    }
  }
);

export const toggleProductForSales = createAsyncThunk(
  "adminProducts/toggleProductForSales",
  async ({ order_id, for_sales }, { rejectWithValue }) => {
    const token = localStorage.getItem("access");

    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`,
        },
      };

      const body = JSON.stringify({ for_sales });

      const response = await axios.patch(
        `${BASE_URL}/api/product/toggle-for-sales/${order_id}/`,
        body,
        config
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          "Error al actualizar el estado de venta del producto."
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
      })
      // Añadir los casos para autocompleteProducts
      .addCase(fetchSearchProducts.pending, (state) => {
        state.searchProductsStatus = "loading";
      })
      .addCase(fetchSearchProducts.fulfilled, (state, action) => {
        state.searchProductsStatus = "succeeded";
        state.searchProducts = action.payload;
      })
      .addCase(fetchSearchProducts.rejected, (state, action) => {
        state.searchProductsStatus = "failed";
        state.error = action.payload;
      })
      // ExtraReducers para toggleProductForSales
      .addCase(toggleProductForSales.pending, (state) => {
        state.productStatus = "loading";
        state.error = null;
      })
      .addCase(toggleProductForSales.fulfilled, (state, action) => {
        state.productStatus = "succeeded";
        state.error = null;
        const updatedProduct = action.payload;
        const index = state?.products?.results?.findIndex(
          (product) => product.id === updatedProduct.id
        );
        if (index !== -1) {
          state.products.results[index] = updatedProduct;
        }
      })
      .addCase(toggleProductForSales.rejected, (state, action) => {
        state.productStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearProducts } = adminProductsSlice.actions;
export default adminProductsSlice.reducer;
