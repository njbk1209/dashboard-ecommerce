import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { createSlice } from "@reduxjs/toolkit";

const initialMaintenanceData = {
    is_active: false,
    end_datetime: null,
    updated_at: null,
    is_active_until: {
        active: false,
        end_datetime: null,
    }
};

// state
const initialState = {
    control: initialMaintenanceData,
    status: "idle", //'idle', 'loading', 'succeeded', 'failed'
    error: null,
    updateStatus: "idle",
    updateError: null,
};

const API_URL = import.meta.env.VITE_API_URL;

export const fetchControl = createAsyncThunk(
    "control/fetchControl",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(`${API_URL}/api/control/maintenance/`);
            return response.data;
        } catch (err) {
            return rejectWithValue(
                err.response?.data?.detail ||
                "Error al obtener la tasa de cambio del día"
            );
        }
    }
);

export const updateMaintenanceSettings = createAsyncThunk(
  "maintenance/updateSettings",
  async (data, { rejectWithValue, getState }) => {
    const token = localStorage.getItem("access");
    try {
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `JWT ${token}`, // o `Bearer ${token}` según tu auth
        },
      };

      // Usamos PATCH (puedes usar PUT si tu endpoint lo espera)
      const response = await axios.patch(
        `${API_URL}/api/control/active-maintenance/`,
        data,
        config
      );

      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data) ||
        err.message ||
        "Error desconocido al actualizar.";
      return rejectWithValue(message);
    }
  }
);

const maintenanceSlice = createSlice({
    name: "maintenance",
    initialState,
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            // --- Caso PENDIENTE: La llamada está en curso ---
            .addCase(fetchControl.pending, (state) => {
                state.status = "loading";
            })
            // --- Caso CUMPLIDO: La llamada fue exitosa ---
            .addCase(fetchControl.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.control = action.payload;
                state.error = null;
            })
            // --- Caso RECHAZADO: La llamada falló ---
            .addCase(fetchControl.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })
            .addCase(updateMaintenanceSettings.pending, (state) => {
                state.updateStatus = "loading";
                state.updateError = null;
            })
            .addCase(updateMaintenanceSettings.fulfilled, (state, action) => {
                state.updateStatus = "succeeded";
                state.data = action.payload; // Reemplaza la data con la respuesta actualizada del servidor
                state.updateError = null;
            })
            .addCase(updateMaintenanceSettings.rejected, (state, action) => {
                state.updateStatus = "failed";
                state.updateError = action.payload;
            });
    },
});


export default maintenanceSlice.reducer;