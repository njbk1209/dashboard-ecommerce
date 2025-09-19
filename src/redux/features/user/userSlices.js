import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';

// Initial State User
const initialState = {
    access: localStorage.getItem('access'),
    refresh: localStorage.getItem('refresh'),
    isAuthenticated: false,
    user: null,
    userStatus: 'idle' // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const isProd = window.location.hostname.includes('appweb.motorche.com');
const BASE_URL = isProd ? 'https://apiweb.motorche.com' : 'http://localhost:8000';

// AsyncThunk para iniciar sesión
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue, dispatch }) => {
        const config = {
            headers: { 'Content-Type': 'application/json' },
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
                localStorage.setItem('access', access);
                localStorage.setItem('refresh', refresh);

                // Actualizar tokens en el estado
                dispatch({ type: 'auth/login/fulfilled', payload: { access, refresh } });

                // Cargar datos del usuario
                const userRes = await dispatch(load_user());

                console.log(userRes)

                // Si la acción fue rechazada por algún motivo (ej. token inválido)
                if (load_user.rejected.match(userRes)) {
                    dispatch(logout());
                    return rejectWithValue('Error cargando el usuario');
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
            console.log(err)
            return rejectWithValue("Error al iniciar sesión");
        }
    }
);

// AsyncThuck para refrescar el token
export const refresh = createAsyncThunk(
    'auth/refresh', // Nombre del action
    async (_, { rejectWithValue }) => {
        if (localStorage.getItem('refresh')) {
            const config = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            const body = JSON.stringify({
                refresh: localStorage.getItem('refresh')
            });

            try {
                const res = await axios.post(`${BASE_URL}/auth/jwt/refresh/`, body, config);


                if (res.status === 200) {
                    return res.data; // Retorna los datos obtenidos (token actualizado)
                } else {
                    return rejectWithValue('Failed to refresh token');
                }
            } catch (err) {
                return rejectWithValue(err.response?.data || 'Error while refreshing token');
            }
        } else {
            return rejectWithValue('No refresh token found');
        }
    }
);

// AsyncThuck para comprobar autenticación
export const checkAuthenticated = createAsyncThunk(
    'auth/checkAuthenticated', // Nombre del action
    async (_, { rejectWithValue }) => {
        if (localStorage.getItem('access')) {
            const config = {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };

            const body = JSON.stringify({
                token: localStorage.getItem('access')
            });

            try {
                const res = await axios.post(`${BASE_URL}/auth/jwt/verify/`, body, config);
                if (res.status === 200) {
                    return true; // Success
                } else {
                    return rejectWithValue('No hay autenticación');
                }
            } catch (err) {
                return rejectWithValue(err.response?.data || 'Error de servidor');
            }
        } else {
            return rejectWithValue('No se ha encontrado un token de acceso');
        }
    }
);

// AsyncThuck para cargar el usuario
export const load_user = createAsyncThunk(
    'auth/load_user', // Nombre del action
    async (_, { rejectWithValue }) => {
        if (localStorage.getItem('access')) {
            const config = {
                headers: {
                    'Authorization': `JWT ${localStorage.getItem('access')}`,
                    'Accept': 'application/json'
                }
            };

            try {
                const res = await axios.get(`${BASE_URL}/auth/users/me/`, config);
                if (res.status === 200) {
                    return res.data;
                } else {
                    return rejectWithValue('Failed to load user');
                }
            } catch (err) {
                return rejectWithValue(err.response?.data || 'Error while loading user');
            }
        } else {
            return rejectWithValue('No access token found');
        }
    }
);

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
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
                state.userStatus = 'loading'
            })
            .addCase(login.fulfilled, (state, action) => {
                const { access, refresh } = action.payload;
                localStorage.setItem('access', access);
                localStorage.setItem('refresh', refresh);
                state.access = access;
                state.refresh = refresh;
                state.isAuthenticated = true;
                state.userStatus = 'succeeded';
            })
            .addCase(login.rejected, (state) => {
                state.userStatus = 'failed';
            })

            // REFRESH REDUCER
            .addCase(refresh.pending, (state) => {
                state.userStatus = 'loading';
            })
            .addCase(refresh.fulfilled, (state, action) => {
                localStorage.setItem('access', action.payload.access);
                state.access = localStorage.getItem('access')
                state.userStatus = 'succeeded';
            })
            .addCase(refresh.rejected, (state) => {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                state.access = null;
                state.refresh = null;
                state.isAuthenticated = false
                state.user = null;
                state.userStatus = 'failed';
            })

            // CHECKAUTHENTICATED REDUCER
            .addCase(checkAuthenticated.pending, (state) => {
                state.userStatus = 'loading';
            })
            .addCase(checkAuthenticated.fulfilled, (state, action) => {
                state.isAuthenticated = true
                state.userStatus = 'succeeded';
            })
            .addCase(checkAuthenticated.rejected, (state) => {
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                state.access = null;
                state.refresh = null;
                state.isAuthenticated = false
                state.user = null;
                state.userStatus = 'failed';
            })

            // LOADUSER REDUCER
            .addCase(load_user.pending, (state) => {
                state.userStatus = 'loading';
            })
            .addCase(load_user.fulfilled, (state, action) => {
                state.user = action.payload;
                state.userStatus = 'succeeded';
            })
            .addCase(load_user.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.userStatus = 'failed';
            })
    },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;