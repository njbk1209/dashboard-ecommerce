import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

/* =======================
   Estado inicial
======================= */
const initialState = {
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
  isAuthenticated: false,
  user: null,
  userStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'

  // Lista admin
  adminUsers: {
    items: [], // results
    count: 0, // total de registros
    next: null, // URL de siguiente página (DRF)
    previous: null, // URL de página previa (DRF)
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null, // string | null
    params: {
      // últimos parámetros usados
      page: 1,
      page_size: 20,
      search: "",
      ordering: "id",
    },
  },

  // Detalle admin
  adminUserDetail: {
    data: null,         // payload de /api/user/get-users/:id/
    status: "idle",     // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    params: {           // params usados para el detalle
      orders_limit: 10,
      orders_status: "delivered", // delivered | all
      top_n: 5,
    },
  },
};

const isProd = window.location.hostname.includes("appweb.motorche.com");
const BASE_URL = isProd
  ? "https://apiweb.motorche.com"
  : "http://localhost:8000";

/* =======================
   Helpers
======================= */
const toQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

/* =======================
   Thunks existentes
======================= */
// Login
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    const config = {
      headers: { "Content-Type": "application/json" },
    };
    const body = JSON.stringify({ email, password });

    try {
      const res = await axios.post(`${BASE_URL}/auth/jwt/create/`, body, config);

      if (res.status === 200) {
        const { access, refresh } = res.data;

        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        dispatch({
          type: "auth/login/fulfilled",
          payload: { access, refresh },
        });

        const userRes = await dispatch(load_user());

        if (load_user.rejected.match(userRes)) {
          dispatch(logout());
          return rejectWithValue("Error cargando el usuario");
        }

        const userData = userRes.payload;

        if (!userData.is_staff) {
          dispatch(logout());
          toast.error("Solo los usuarios del staff pueden iniciar sesión.");
          return rejectWithValue("No autorizado: solo usuarios staff");
        }

        toast.success("¡Acceso exitoso!");
        return { access, refresh };
      }
    } catch (err) {
      return rejectWithValue("Error al iniciar sesión");
    }
  }
);

// Refresh
export const refresh = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    if (!localStorage.getItem("refresh")) {
      return rejectWithValue("No refresh token found");
    }

    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const body = JSON.stringify({
      refresh: localStorage.getItem("refresh"),
    });

    try {
      const res = await axios.post(`${BASE_URL}/auth/jwt/refresh/`, body, config);
      if (res.status === 200) return res.data;
      return rejectWithValue("Failed to refresh token");
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error while refreshing token");
    }
  }
);

// Check Auth
export const checkAuthenticated = createAsyncThunk(
  "auth/checkAuthenticated",
  async (_, { rejectWithValue }) => {
    if (!localStorage.getItem("access")) {
      return rejectWithValue("No se ha encontrado un token de acceso");
    }

    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const body = JSON.stringify({
      token: localStorage.getItem("access"),
    });

    try {
      const res = await axios.post(`${BASE_URL}/auth/jwt/verify/`, body, config);
      if (res.status === 200) return true;
      return rejectWithValue("No hay autenticación");
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error de servidor");
    }
  }
);

// Load user
export const load_user = createAsyncThunk(
  "auth/load_user",
  async (_, { rejectWithValue }) => {
    if (!localStorage.getItem("access")) {
      return rejectWithValue("No access token found");
    }
    const config = {
      headers: {
        Authorization: `JWT ${localStorage.getItem("access")}`,
        Accept: "application/json",
      },
    };

    try {
      const res = await axios.get(`${BASE_URL}/auth/users/me/`, config);
      if (res.status === 200) return res.data;
      return rejectWithValue("Failed to load user");
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error while loading user");
    }
  }
);

/* =======================
   ADMIN: Listar usuarios
======================= */
export const fetchAdminUsers = createAsyncThunk(
  "auth/fetchAdminUsers",
  async (params = {}, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user?.access || localStorage.getItem("access");
    if (!token) return rejectWithValue("No access token");

    const config = {
      headers: {
        Authorization: `JWT ${token}`,
        Accept: "application/json",
      },
    };

    const defaults = { page: 1, page_size: 20, search: "", ordering: "id" };
    const q = { ...defaults, ...params };
    const qs = toQuery({
      page: q.page,
      page_size: q.page_size,
      search: q.search,
      ordering: q.ordering,
    });

    const url = `${BASE_URL}/api/user/get-users/${qs ? `?${qs}` : ""}`;

    try {
      const res = await axios.get(url, config);
      if (res.status === 200) return { data: res.data, params: q };
      return rejectWithValue("Error al cargar usuarios");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        const refreshRes = await dispatch(refresh());
        if (refresh.fulfilled.match(refreshRes)) {
          const newAccess = refreshRes.payload?.access;
          if (!newAccess) return rejectWithValue("Refresh sin access token");

          try {
            const retryRes = await axios.get(url, {
              headers: { Authorization: `JWT ${newAccess}`, Accept: "application/json" },
            });
            if (retryRes.status === 200) return { data: retryRes.data, params: q };
          } catch (retryErr) {
            return rejectWithValue(retryErr?.response?.data || "Error al recargar usuarios");
          }
        } else {
          dispatch(logout());
          return rejectWithValue("Sesión expirada");
        }
      }

      if (status === 403) {
        toast.error("No autorizado: solo superusuarios.");
        return rejectWithValue("Forbidden");
      }

      return rejectWithValue(err?.response?.data || "Error al cargar usuarios");
    }
  }
);

/* =======================
   ADMIN: Detalle de usuario
======================= */
export const fetchAdminUserDetail = createAsyncThunk(
  "auth/fetchAdminUserDetail",
  async ({ id, orders_limit = 10, orders_status = "delivered", top_n = 5 }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user?.access || localStorage.getItem("access");
    if (!token) return rejectWithValue("No access token");

    const qs = toQuery({ orders_limit, orders_status, top_n });
    const url = `${BASE_URL}/api/user/get-users/${id}/${qs ? `?${qs}` : ""}`;

    const getConfig = (tkn) => ({
      headers: { Authorization: `JWT ${tkn}`, Accept: "application/json" },
    });

    try {
      const res = await axios.get(url, getConfig(token));
      if (res.status === 200) {
        return { data: res.data, params: { orders_limit, orders_status, top_n } };
      }
      return rejectWithValue("Error al cargar detalle");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        const refreshRes = await dispatch(refresh());
        if (refresh.fulfilled.match(refreshRes)) {
          const newAccess = refreshRes.payload?.access;
          if (!newAccess) return rejectWithValue("Refresh sin access token");

          try {
            const retryRes = await axios.get(url, getConfig(newAccess));
            if (retryRes.status === 200) {
              return { data: retryRes.data, params: { orders_limit, orders_status, top_n } };
            }
          } catch (retryErr) {
            return rejectWithValue(retryErr?.response?.data || "Error al recargar detalle");
          }
        } else {
          dispatch(logout());
          return rejectWithValue("Sesión expirada");
        }
      }

      if (status === 403) {
        toast.error("No autorizado: solo superusuarios.");
        return rejectWithValue("Forbidden");
      }

      return rejectWithValue(err?.response?.data || "Error al cargar detalle");
    }
  }
);

/* =======================
   ADMIN: Desactivar usuario
======================= */
export const deactivateAdminUser = createAsyncThunk(
  "auth/deactivateAdminUser",
  async (id, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user?.access || localStorage.getItem("access");
    if (!token) return rejectWithValue("No access token");

    const url = `${BASE_URL}/api/user/get-users/${id}/deactivate/`;
    const getConfig = (tkn) => ({
      headers: { Authorization: `JWT ${tkn}`, Accept: "application/json" },
    });

    try {
      const res = await axios.post(url, null, getConfig(token));
      if (res.status === 200) {
        return { id, message: res.data?.detail || "Usuario desactivado con éxito." };
      }
      return rejectWithValue("No fue posible desactivar el usuario");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        const refreshRes = await dispatch(refresh());
        if (refresh.fulfilled.match(refreshRes)) {
          const newAccess = refreshRes.payload?.access;
          if (!newAccess) return rejectWithValue("Refresh sin access token");

          try {
            const retryRes = await axios.post(url, null, getConfig(newAccess));
            if (retryRes.status === 200) {
              return { id, message: retryRes.data?.detail || "Usuario desactivado con éxito." };
            }
          } catch (retryErr) {
            return rejectWithValue(retryErr?.response?.data || "Error al reintentar desactivar");
          }
        } else {
          dispatch(logout());
          return rejectWithValue("Sesión expirada");
        }
      }

      if (status === 400) {
        // Mensaje del backend: no desactivar staff/superuser o ya desactivado
        const detail = err?.response?.data?.detail || "Solicitud inválida";
        toast.error(detail);
        return rejectWithValue(detail);
      }

      if (status === 403) {
        toast.error("No autorizado: solo superusuarios.");
        return rejectWithValue("Forbidden");
      }

      return rejectWithValue(err?.response?.data || "No fue posible desactivar el usuario");
    }
  }
);

/* =======================
   ADMIN: Activar usuario
======================= */
export const activateAdminUser = createAsyncThunk(
  "auth/activateAdminUser",
  async (id, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const token = state.user?.access || localStorage.getItem("access");
    if (!token) return rejectWithValue("No access token");

    const url = `${BASE_URL}/api/user/get-users/${id}/activate/`;
    const getConfig = (tkn) => ({
      headers: { Authorization: `JWT ${tkn}`, Accept: "application/json" },
    });

    try {
      const res = await axios.post(url, null, getConfig(token));
      if (res.status === 200) {
        return { id, message: res.data?.detail || "Usuario activado con éxito." };
      }
      return rejectWithValue("No fue posible activar el usuario");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        const refreshRes = await dispatch(refresh());
        if (refresh.fulfilled.match(refreshRes)) {
          const newAccess = refreshRes.payload?.access;
          if (!newAccess) return rejectWithValue("Refresh sin access token");

          try {
            const retryRes = await axios.post(url, null, getConfig(newAccess));
            if (retryRes.status === 200) {
              return { id, message: retryRes.data?.detail || "Usuario activado con éxito." };
            }
          } catch (retryErr) {
            return rejectWithValue(retryErr?.response?.data || "Error al reintentar activar");
          }
        } else {
          dispatch(logout());
          return rejectWithValue("Sesión expirada");
        }
      }

      if (status === 403) {
        toast.error("No autorizado: solo superusuarios.");
        return rejectWithValue("Forbidden");
      }

      const msg = err?.response?.data || "No fue posible activar el usuario";
      return rejectWithValue(msg);
    }
  }
);

/* =======================
   Slice
======================= */
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      state.access = null;
      state.refresh = null;
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.userStatus = "loading";
      })
      .addCase(login.fulfilled, (state, action) => {
        const { access, refresh } = action.payload;
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);
        state.access = access;
        state.refresh = refresh;
        state.isAuthenticated = true;
        state.userStatus = "succeeded";
      })
      .addCase(login.rejected, (state) => {
        state.userStatus = "failed";
      })

      // Refresh
      .addCase(refresh.pending, (state) => {
        state.userStatus = "loading";
      })
      .addCase(refresh.fulfilled, (state, action) => {
        localStorage.setItem("access", action.payload.access);
        state.access = localStorage.getItem("access");
        state.userStatus = "succeeded";
      })
      .addCase(refresh.rejected, (state) => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        state.access = null;
        state.refresh = null;
        state.isAuthenticated = false;
        state.user = null;
        state.userStatus = "failed";
      })

      // Check
      .addCase(checkAuthenticated.pending, (state) => {
        state.userStatus = "loading";
      })
      .addCase(checkAuthenticated.fulfilled, (state) => {
        state.isAuthenticated = true;
        state.userStatus = "succeeded";
      })
      .addCase(checkAuthenticated.rejected, (state) => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        state.access = null;
        state.refresh = null;
        state.isAuthenticated = false;
        state.user = null;
        state.userStatus = "failed";
      })

      // Load user
      .addCase(load_user.pending, (state) => {
        state.userStatus = "loading";
      })
      .addCase(load_user.fulfilled, (state, action) => {
        state.user = action.payload;
        state.userStatus = "succeeded";
      })
      .addCase(load_user.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.userStatus = "failed";
      })

      /* ===== ADMIN LIST ===== */
      .addCase(fetchAdminUsers.pending, (state) => {
        state.adminUsers.status = "loading";
        state.adminUsers.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        const { data, params } = action.payload;
        state.adminUsers.items = data?.results || [];
        state.adminUsers.count = data?.count ?? 0;
        state.adminUsers.next = data?.next ?? null;
        state.adminUsers.previous = data?.previous ?? null;
        state.adminUsers.params = params;
        state.adminUsers.status = "succeeded";
        state.adminUsers.error = null;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.adminUsers.status = "failed";
        state.adminUsers.error =
          typeof action.payload === "string"
            ? action.payload
            : "No se pudo cargar la lista de usuarios";
      })

      /* ===== ADMIN DETAIL ===== */
      .addCase(fetchAdminUserDetail.pending, (state, action) => {
        state.adminUserDetail.status = "loading";
        state.adminUserDetail.error = null;

        // Si se pasan params nuevos, actualiza en estado para que la UI los refleje
        const arg = action.meta?.arg;
        if (arg) {
          state.adminUserDetail.params = {
            orders_limit: arg.orders_limit ?? state.adminUserDetail.params.orders_limit,
            orders_status: arg.orders_status ?? state.adminUserDetail.params.orders_status,
            top_n: arg.top_n ?? state.adminUserDetail.params.top_n,
          };
        }
      })
      .addCase(fetchAdminUserDetail.fulfilled, (state, action) => {
        state.adminUserDetail.data = action.payload.data || null;
        state.adminUserDetail.status = "succeeded";
        state.adminUserDetail.error = null;
        // asegura que los params queden sincronizados
        state.adminUserDetail.params = action.payload.params || state.adminUserDetail.params;
      })
      .addCase(fetchAdminUserDetail.rejected, (state, action) => {
        state.adminUserDetail.status = "failed";
        state.adminUserDetail.error =
          typeof action.payload === "string" ? action.payload : "No se pudo cargar el detalle";
      })

      /* ===== ADMIN DEACTIVATE ===== */
      .addCase(deactivateAdminUser.pending, (state) => {
        // no cambiamos estados globales; feedback lo maneja el componente con status si quiere
      })
      .addCase(deactivateAdminUser.fulfilled, (state, action) => {
        const { id, message } = action.payload;

        // Actualización optimista: marcar is_active=false en la lista si está presente
        const idx = state.adminUsers.items.findIndex((u) => u.id === id);
        if (idx !== -1) {
          state.adminUsers.items[idx] = {
            ...state.adminUsers.items[idx],
            is_active: false,
          };
        }

        // Si estás viendo el detalle del mismo usuario, actualízalo también
        if (state.adminUserDetail.data && state.adminUserDetail.data.id === id) {
          state.adminUserDetail.data = {
            ...state.adminUserDetail.data,
            is_active: false,
          };
        }

        toast.success(message || "Usuario desactivado con éxito.");
      })
      .addCase(deactivateAdminUser.rejected, (state, action) => {
        const msg =
          typeof action.payload === "string"
            ? action.payload
            : "No fue posible desactivar el usuario";
        // Puedes guardar un error global si quieres
        toast.error(msg);
      })
      // ---- ADMIN ACTIVATE ----
      .addCase(activateAdminUser.fulfilled, (state, action) => {
        const { id, message } = action.payload;

        // Actualización optimista en la lista
        const idx = state.adminUsers.items.findIndex((u) => u.id === id);
        if (idx !== -1) {
          state.adminUsers.items[idx] = {
            ...state.adminUsers.items[idx],
            is_active: true,
          };
        }

        // Si el detalle abierto coincide, actualízalo
        if (state.adminUserDetail.data && state.adminUserDetail.data.id === id) {
          state.adminUserDetail.data = {
            ...state.adminUserDetail.data,
            is_active: true,
          };
        }

        toast.success(message || "Usuario activado con éxito.");
      })
      .addCase(activateAdminUser.rejected, (state, action) => {
        const msg =
          typeof action.payload === "string" ? action.payload : "No fue posible activar el usuario";
        toast.error(msg);
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
