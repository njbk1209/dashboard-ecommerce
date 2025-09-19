import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  orders: [],
  order: null,
  paymentProof: null,
  orderNotes: [],
  orderStatus: "idle",
  error: null,
};

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

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        "Error al obtener la orden";
      toast.error(message);
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

export const fetchOrderNotes = createAsyncThunk(
  "order/fetchOrderNotes",
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
        `http://127.0.0.1:8000/api/order/notes/${orderId}/`,
        config
      );

      return response.data; // es un array de notas
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        "Error al obtener las notas de la orden";
      return rejectWithValue(message);
    }
  }
);

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
      .addCase(fetchOrderNotes.pending, (state) => {
        state.orderStatus = "loading";
        state.error = null;
        state.orderNotes = [];
      })
      .addCase(fetchOrderNotes.fulfilled, (state, action) => {
        state.orderStatus = "succeeded";
        state.orderNotes = action.payload;
      })
      .addCase(fetchOrderNotes.rejected, (state, action) => {
        state.orderStatus = "failed";
        state.error = action.payload;
        state.orderNotes = [];
      })
  },
});

export const { clearOrder, clearPaymentProof } = adminOrdersSlice.actions;
export default adminOrdersSlice.reducer;
