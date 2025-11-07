// src/redux/features/promotion/promotionSlices.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import fileDownload from "js-file-download";
import { toast } from "react-hot-toast";

const initialState = {
    promotions: [],
    promotionStatus: "idle",
    fetchStatus: "idle",
    createStatus: "idle",
    updateStatus: "idle",
    deleteStatus: "idle",
    importStatus: "idle",
    exportStatus: "idle",
    importResult: null,
    error: null,
};

const BASE_URL = import.meta.env.VITE_API_URL;

// Fetch promotions (admin) with optional filters object
export const fetchAdminPromotions = createAsyncThunk(
    "adminPromotions/fetchAdminPromotions",
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
            const url = params
                ? `${BASE_URL}/api/promotion/promotions/?${params}`
                : `${BASE_URL}/api/promotion/promotions/`;

            const response = await axios.get(url, config);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.detail || "Error al obtener promociones"
            );
        }
    }
);

/**
 * Create or Update Promotion (JSON fields + optional CSV)
 * payload: {
 *   promotionId?: number, // si existe -> update (PATCH). si no -> create (POST)
 *   data: { title, description, start_date, end_date, active, ... } // campos de Promotion
 *   csvFile?: File, // optional CSV file field name expected by backend: 'csv_file'
 *   merge?: boolean, // true => merge, false => replace (se envía como 'merge' en formdata)
 *   dry_run?: boolean, // true => preview only
 * }
 */
export const createOrUpdatePromotion = createAsyncThunk(
    "adminPromotions/createOrUpdatePromotion",
    async (payload, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        const { promotionId, data = {}, csvFile, merge = false, dry_run = false } =
            payload || {};

        try {
            const formData = new FormData();

            // Añadimos todos los campos de data al formData — convertir objetos/arrays a JSON strings
            Object.entries(data).forEach(([key, value]) => {
                if (value === undefined || value === null) return;
                if (typeof value === "object") {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            });

            if (csvFile) {
                // campo esperado: csv_file
                formData.append("csv_file", csvFile);
            }

            // flags
            if (merge) formData.append("merge", "true");
            if (dry_run) formData.append("dry_run", "true");

            const config = {
                headers: {
                    Accept: "application/json",
                    Authorization: `JWT ${token}`,
                    // Important: don't set Content-Type header explicitly; browser will set proper multipart boundary
                },
                // We might receive either JSON or a blob (CSV with errors) from the backend.
                responseType: "arraybuffer", // We'll try to detect blob vs JSON
            };

            const url = promotionId
                ? `${BASE_URL}/api/promotion/promotions/${promotionId}/`
                : `${BASE_URL}/api/promotion/promotions/`;

            // Use PATCH for partial updates, PUT if you prefer full replace. We'll use PATCH for update.
            const method = promotionId ? "patch" : "post";

            const axiosResult = await axios({
                method,
                url,
                data: formData,
                ...config,
            });

            // Try to parse response as JSON; if it's CSV blob, trigger download
            const contentType =
                axiosResult.headers["content-type"] ||
                axiosResult.headers["Content-Type"] ||
                "";

            if (contentType.includes("application/json")) {
                const text = new TextDecoder("utf-8").decode(axiosResult.data);
                const parsed = JSON.parse(text);

                toast.success(
                    promotionId
                        ? "Promoción actualizada exitosamente"
                        : "Promoción creada exitosamente"
                );

                return parsed;
            }

            // If we received a csv or other blob: prompt download
            // Use filename hint or generic name
            const disposition = axiosResult.headers["content-disposition"];
            let filename = "result.csv";
            if (disposition) {
                const match = disposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            } else {
                // fallback with timestamp
                filename = `promotion_import_${new Date().toISOString().slice(0, 19)}.csv`;
            }

            const blob = new Blob([axiosResult.data], { type: contentType || "text/csv" });
            fileDownload(blob, filename);
            toast.success(`Archivo CSV descargado correctamente: ${filename}`);
            return { success: true, message: "Archivo descargado", filename };
        } catch (error) {
            // maneja respuesta en JSON con mensajes de error
            if (error.response) {
                // si es blob con error, intentar convertir a texto
                const ct =
                    error.response.headers["content-type"] ||
                    error.response.headers["Content-Type"] ||
                    "";
                if ((ct || "").includes("text/csv") || (ct || "").includes("application/csv")) {
                    // descargar el csv de errores
                    const blob = new Blob([error.response.data], { type: ct || "text/csv" });
                    const filename = `promotion_import_errors_${new Date().toISOString().slice(0, 19)}.csv`;
                    fileDownload(blob, filename);
                    toast.error("Se detectaron errores en el CSV, archivo descargado");
                    return rejectWithValue({
                        detail: "CSV con errores descargado",
                        file: filename,
                    });
                }

                // intentamos parsear JSON del error
                const errData = error.response.data;
                // si viene como arraybuffer, decodificar
                if (errData instanceof ArrayBuffer) {
                    try {
                        const text = new TextDecoder("utf-8").decode(errData);
                        const parsed = JSON.parse(text);
                        toast.error(parsed.detail || "Error en el servidor");
                        return rejectWithValue(parsed);
                    } catch (e) {
                        // no JSON
                        toast.error("Error desconocido del servidor");
                        return rejectWithValue({ detail: "Error desconocido del servidor" });
                    }
                }
                toast.error(
                    errData?.detail ||
                    error.response?.data?.detail ||
                    "Error al crear/actualizar promoción"
                )
                return rejectWithValue(errData || error.response?.data?.detail || "Error en la petición");
            }

            return rejectWithValue(error.message || "Error al crear/actualizar promoción");
        }
    }
);

// Delete promotion
export const deletePromotion = createAsyncThunk(
    "adminPromotions/deletePromotion",
    async (promotionId, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const config = {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `JWT ${token}`,
                },
            };
            const response = await axios.delete(
                `${BASE_URL}/api/promotion/promotions/${promotionId}/`,
                config
            );
            // some backends return 204 No Content; we'll return the id
            return { id: promotionId, data: response.data || null };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.detail || "Error al eliminar la promoción"
            );
        }
    }
);

// Export promotion products CSV thunk (descarga)
export const exportPromotionProductsCSV = createAsyncThunk(
    "adminPromotions/exportPromotionProductsCSV",
    async (promotionId, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const config = {
                headers: {
                    Accept: "*/*",
                    Authorization: `JWT ${token}`,
                },
                responseType: "blob",
            };

            const response = await axios.get(
                `${BASE_URL}/api/promotion/promotions/${promotionId}/export-products/`,
                config
            );

            // Intentar obtener filename desde content-disposition
            const disposition = response.headers["content-disposition"];
            let filename = `promotion_${promotionId}_products_${new Date().toISOString().slice(0, 19)}.csv`;
            if (disposition) {
                const match = disposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            fileDownload(response.data, filename);
            toast.success("CSV de productos descargado ✅");
            return { success: true, filename };
        } catch (error) {
            // Si el servidor devolvió JSON con error
            toast.error("Error al exportar los productos de la promoción");
            return rejectWithValue(
                error.response?.data || "Error al exportar productos de la promoción"
            );
        }
    }
);

const adminPromotionsSlice = createSlice({
    name: "adminPromotions",
    initialState,
    reducers: {
        clearPromotions: (state) => {
            state.promotions = [];
            state.promotionStatus = "idle";
            state.error = null;
        },
        clearImportResult: (state) => {
            state.importResult = null;
            state.importStatus = "idle";
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchAdminPromotions
            .addCase(fetchAdminPromotions.pending, (state) => {
                state.fetchStatus = "loading";
                state.error = null;
            })
            .addCase(fetchAdminPromotions.fulfilled, (state, action) => {
                state.fetchStatus = "succeeded";
                state.promotions = action.payload;
            })
            .addCase(fetchAdminPromotions.rejected, (state, action) => {
                state.fetchStatus = "failed";
                state.error = action.payload;
            })

            // createOrUpdatePromotion
            .addCase(createOrUpdatePromotion.pending, (state) => {
                state.createStatus = "loading";
                state.updateStatus = "loading";
                state.error = null;
                state.importResult = null;
            })
            .addCase(createOrUpdatePromotion.fulfilled, (state, action) => {
                state.createStatus = "succeeded";
                state.updateStatus = "succeeded";

                const payload = action.payload;

                // Si backend devolvió un objeto promotion, actualizamos la lista:
                // Soportamos dos formas: payload.promotion o payload (si es promotion directo).
                const promotion = payload?.promotion || payload;
                if (promotion && promotion.id) {
                    // si ya está en el array (results paginado), reemplazar, si no, insertar al inicio
                    if (Array.isArray(state.promotions?.results)) {
                        const idx = state.promotions.results.findIndex((p) => p.id === promotion.id);
                        if (idx !== -1) {
                            state.promotions.results[idx] = promotion;
                        } else {
                            state.promotions.results.unshift(promotion);
                        }
                    } else {
                        // si no está paginado, asumimos array simple
                        const idx = state.promotions.findIndex((p) => p.id === promotion.id);
                        if (idx !== -1) state.promotions[idx] = promotion;
                        else state.promotions.unshift(promotion);
                    }
                } else {
                    // Si backend devolvió e.g. {success:true, filename:...}, lo guardamos en importResult
                    state.importResult = payload;
                }
            })
            .addCase(createOrUpdatePromotion.rejected, (state, action) => {
                state.createStatus = "failed";
                state.updateStatus = "failed";
                state.error = action.payload || action.error?.message;
            })

            // deletePromotion
            .addCase(deletePromotion.pending, (state) => {
                state.deleteStatus = "loading";
                state.error = null;
            })
            .addCase(deletePromotion.fulfilled, (state, action) => {
                state.deleteStatus = "succeeded";
                const id = action.payload.id;
                if (Array.isArray(state.promotions?.results)) {
                    state.promotions.results = state.promotions.results.filter((p) => p.id !== id);
                } else {
                    state.promotions = state.promotions.filter((p) => p.id !== id);
                }
            })
            .addCase(deletePromotion.rejected, (state, action) => {
                state.deleteStatus = "failed";
                state.error = action.payload;
            })
            // exportPromotionProductsCSV
            .addCase(exportPromotionProductsCSV.pending, (state) => {
                state.exportStatus = "loading";
                state.error = null;
            })
            .addCase(exportPromotionProductsCSV.fulfilled, (state, action) => {
                state.exportStatus = "succeeded";
                // action.payload: { success: true, filename }
                state.importResult = action.payload; // opcional: reusar importResult para devolver info de descarga
            })
            .addCase(exportPromotionProductsCSV.rejected, (state, action) => {
                state.exportStatus = "failed";
                state.error = action.payload || action.error?.message;
            });
    },
});

export const { clearPromotions, clearImportResult } = adminPromotionsSlice.actions;
export default adminPromotionsSlice.reducer;
