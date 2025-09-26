import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import toast from "react-hot-toast";

// Initial State User
const initialState = {
  access: localStorage.getItem("access"),
  refresh: localStorage.getItem("refresh"),
  isAuthenticated: false,
  user: null,
  userStatus: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
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
};

const isProd = window.location.hostname.includes("appweb.motorche.com");
const BASE_URL = isProd
  ? "https://apiweb.motorche.com"
  : "http://localhost:8000";

// Helper para querystrings
const toQuery = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

// AsyncThunk para iniciar sesión
export const login = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    const config = {
      headers: { "Content-Type": "application/json" },
    };

    const body = JSON.stringify({ email, password });

    try {
      const res = await axios.post(
        `${BASE_URL}/auth/jwt/create/`,
        body,
        config
      );

      if (res.status === 200) {
        const { access, refresh } = res.data;

        // Guardar tokens en localStorage
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        // Actualizar tokens en el estado
        dispatch({
          type: "auth/login/fulfilled",
          payload: { access, refresh },
        });

        // Cargar datos del usuario
        const userRes = await dispatch(load_user());

        console.log(userRes);

        // Si la acción fue rechazada por algún motivo (ej. token inválido)
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
      console.log(err);
      return rejectWithValue("Error al iniciar sesión");
    }
  }
);

// AsyncThuck para refrescar el token
export const refresh = createAsyncThunk(
  "auth/refresh", // Nombre del action
  async (_, { rejectWithValue }) => {
    if (localStorage.getItem("refresh")) {
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
        const res = await axios.post(
          `${BASE_URL}/auth/jwt/refresh/`,
          body,
          config
        );

        if (res.status === 200) {
          return res.data; // Retorna los datos obtenidos (token actualizado)
        } else {
          return rejectWithValue("Failed to refresh token");
        }
      } catch (err) {
        return rejectWithValue(
          err.response?.data || "Error while refreshing token"
        );
      }
    } else {
      return rejectWithValue("No refresh token found");
    }
  }
);

// AsyncThuck para comprobar autenticación
export const checkAuthenticated = createAsyncThunk(
  "auth/checkAuthenticated", // Nombre del action
  async (_, { rejectWithValue }) => {
    if (localStorage.getItem("access")) {
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
        const res = await axios.post(
          `${BASE_URL}/auth/jwt/verify/`,
          body,
          config
        );
        if (res.status === 200) {
          return true; // Success
        } else {
          return rejectWithValue("No hay autenticación");
        }
      } catch (err) {
        return rejectWithValue(err.response?.data || "Error de servidor");
      }
    } else {
      return rejectWithValue("No se ha encontrado un token de acceso");
    }
  }
);

// AsyncThuck para cargar el usuario
export const load_user = createAsyncThunk(
  "auth/load_user", // Nombre del action
  async (_, { rejectWithValue }) => {
    if (localStorage.getItem("access")) {
      const config = {
        headers: {
          Authorization: `JWT ${localStorage.getItem("access")}`,
          Accept: "application/json",
        },
      };

      try {
        const res = await axios.get(`${BASE_URL}/auth/users/me/`, config);
        if (res.status === 200) {
          return res.data;
        } else {
          return rejectWithValue("Failed to load user");
        }
      } catch (err) {
        return rejectWithValue(
          err.response?.data || "Error while loading user"
        );
      }
    } else {
      return rejectWithValue("No access token found");
    }
  }
);

//Thunk para capturar usuarios
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

    // parámetros por defecto
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
      // 401 -> intenta refrescar una vez y reintenta
      const status = err?.response?.status;
      if (status === 401) {
        const refreshRes = await dispatch(refresh());
        if (refresh.fulfilled.match(refreshRes)) {
          const newAccess = refreshRes.payload?.access;
          if (!newAccess) return rejectWithValue("Refresh sin access token");

          try {
            const retryRes = await axios.get(url, {
              headers: {
                Authorization: `JWT ${newAccess}`,
                Accept: "application/json",
              },
            });
            if (retryRes.status === 200)
              return { data: retryRes.data, params: q };
          } catch (retryErr) {
            return rejectWithValue(
              retryErr?.response?.data || "Error al recargar usuarios"
            );
          }
        } else {
          // refresh falló -> logout
          dispatch(logout());
          return rejectWithValue("Sesión expirada");
        }
      }

      // 403 -> no superuser
      if (status === 403) {
        toast.error("No autorizado: solo superusuarios.");
        return rejectWithValue("Forbidden");
      }

      return rejectWithValue(err?.response?.data || "Error al cargar usuarios");
    }
  }
);

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
      // Login reducer
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

      // REFRESH REDUCER
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

      // CHECKAUTHENTICATED REDUCER
      .addCase(checkAuthenticated.pending, (state) => {
        state.userStatus = "loading";
      })
      .addCase(checkAuthenticated.fulfilled, (state, action) => {
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

      // LOADUSER REDUCER
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
      // ---- ADMIN USERS LIST ----
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
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
