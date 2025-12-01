import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const initialState = {
    invoices: [],
    invoice: null,
    invoiceStatus: "idle",
    listStatus: "idle",
    createStatus: "idle",
    updateStatus: "idle",
    deleteStatus: "idle",
    downloadStatus: "idle",
    error: null,
    meta: { count: 0, next: null, previous: null },
};

// helpers
const toQuery = (obj = {}) =>
    Object.entries(obj)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

// ---------------------- Thunks ----------------------
// Obtener lista para admin: soporta filtros/paginación
export const fetchAdminInvoices = createAsyncThunk(
    "adminInvoices/fetchAdminInvoices",
    async (filters = {}, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const qs = toQuery(filters);
            const url = `${BASE_URL}/api/invoice/${qs ? `?${qs}` : ""}`; // Ajusta la ruta si tu DRF la mapea diferente

            const res = await axios.get(url, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: token ? `JWT ${token}` : "",
                },
            });

            // soporta paginación DRF
            const data = res.data;
            if (data && Array.isArray(data.results)) {
                return {
                    invoices: data.results,
                    meta: {
                        count: data.count ?? data.results.length,
                        next: data.next ?? null,
                        previous: data.previous ?? null,
                    },
                };
            }

            return {
                invoices: Array.isArray(data) ? data : [data],
                meta: { count: Array.isArray(data) ? data.length : 1, next: null, previous: null },
            };
        } catch (err) {
            const payload = err.response?.data || err.message || "Error al obtener facturas";
            return rejectWithValue(payload);
        }
    }
);

// Obtener factura por id
export const fetchInvoiceById = createAsyncThunk(
    "adminInvoices/fetchInvoiceById",
    async (invoiceId, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const res = await axios.get(`${BASE_URL}/api/invoice/${invoiceId}/`, {
                headers: { Authorization: token ? `JWT ${token}` : "" },
            });
            return res.data;
        } catch (err) {
            const message = err.response?.data?.detail || err.message || "Error al obtener la factura";
            toast.error(message);
            return rejectWithValue(message);
        }
    }
);

// Crear factura (Admin)
export const createInvoice = createAsyncThunk(
    "adminInvoices/createInvoice",
    async (payload = {}, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        console.log(payload)
        try {
            const res = await axios.post(`${BASE_URL}/api/invoice/invoices/`, payload, {
                headers: {
                    Authorization: token ? `JWT ${token}` : "",
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });
            return res.data;
        } catch (err) {
            const resp = err.response?.data || err.message || "Error al crear la factura";
            console.log(err)
            return rejectWithValue(resp);
        }
    }
);

// Actualizar factura (PATCH / PUT)
export const updateInvoice = createAsyncThunk(
    "adminInvoices/updateInvoice",
    async ({ invoiceId, data, method = "patch" } = {}, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const url = `${BASE_URL}/api/invoice/${invoiceId}/`;
            const res =
                method === "put"
                    ? await axios.put(url, data, { headers: { Authorization: token ? `JWT ${token}` : "" } })
                    : await axios.patch(url, data, { headers: { Authorization: token ? `JWT ${token}` : "" } });

            return res.data;
        } catch (err) {
            const resp = err.response?.data || err.message || "Error al actualizar la factura";
            return rejectWithValue(resp);
        }
    }
);

// Eliminar factura
export const deleteInvoice = createAsyncThunk(
    "adminInvoices/deleteInvoice",
    async (invoiceId, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const res = await axios.delete(`${BASE_URL}/api/invoice/${invoiceId}/`, {
                headers: { Authorization: token ? `JWT ${token}` : "" },
            });
            return { invoiceId, status: res.status };
        } catch (err) {
            const resp = err.response?.data || err.message || "Error al eliminar la factura";
            return rejectWithValue(resp);
        }
    }
);

// Descargar PDF de la factura (suponiendo endpoint invoice/<id>/pdf/ o similar)
export const downloadInvoicePdf = createAsyncThunk(
    "adminInvoices/downloadInvoicePdf",
    async ({ invoiceId, openInNewTab = true } = {}, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        try {
            const url = `${BASE_URL}/api/invoice/${invoiceId}/pdf/`;
            const res = await axios.get(url, {
                headers: { Authorization: token ? `JWT ${token}` : "" },
                responseType: "blob",
            });

            const contentDisposition = res.headers["content-disposition"] || "";
            let filename = `invoice_${invoiceId}.pdf`;
            const match = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/);
            if (match && match[1]) filename = match[1];

            const blob = new Blob([res.data], { type: res.data.type || "application/pdf" });
            const urlBlob = window.URL.createObjectURL(blob);

            if (openInNewTab) {
                window.open(urlBlob, "_blank");
                setTimeout(() => window.URL.revokeObjectURL(urlBlob), 10000);
            } else {
                const a = document.createElement("a");
                a.href = urlBlob;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(urlBlob);
            }

            return { invoiceId, filename };
        } catch (err) {
            const resp = err.response;
            // si vuelve blob con json dentro
            if (resp && resp.data && resp.data instanceof Blob) {
                try {
                    const text = await resp.data.text();
                    const parsed = JSON.parse(text);
                    return rejectWithValue(parsed);
                } catch (parseErr) {
                    return rejectWithValue(resp.statusText || "Error al descargar PDF");
                }
            }
            const payloadErr = err.response?.data || err.message || "Error al descargar PDF";
            return rejectWithValue(payloadErr);
        }
    }
);

// fetchInvoiceByOrderId (nuevo thunk)
export const fetchInvoiceByOrderId = createAsyncThunk(
    "adminInvoices/fetchInvoiceByOrderId",
    async (orderId, { rejectWithValue }) => {
        const token = localStorage.getItem("access");
        if (!orderId) return rejectWithValue("orderId no proporcionado");

        // intentamos varios nombres de query param que suelen usarse
        const tried = [
            `?order=${encodeURIComponent(orderId)}`,
            `?order_id=${encodeURIComponent(orderId)}`,
            `?order__id=${encodeURIComponent(orderId)}`,
        ];

        try {
            let res = null;
            for (const q of tried) {
                const url = `${BASE_URL}/api/invoice/invoices/${q}`;
                try {
                    res = await axios.get(url, {
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json",
                            Authorization: token ? `JWT ${token}` : "",
                        },
                    });
                } catch (e) {
                    // si este intento falla (404 o 400), seguimos al siguiente
                    res = null;
                }
                if (res && res.data.results) break;
            }

            if (!res || !res.data) {
                return rejectWithValue("No se encontró factura para esta orden");
            }

            // si la API devolvió paginación DRF -> res.data.results
            const payload = Array.isArray(res.data.results)
                ? res.data.results
                : Array.isArray(res.data)
                    ? res.data
                    : [res.data];

            // devolvemos la primera factura si existe
            const invoice = payload.length > 0 ? payload[0] : null;
            return invoice;
        } catch (err) {
            const payloadErr = err.response?.data || err.message || "Error al obtener factura";
            return rejectWithValue(payloadErr);
        }
    }
);

// ---------------------- Slice ----------------------
const adminInvoicesSlice = createSlice({
    name: "adminInvoices",
    initialState,
    reducers: {
        clearInvoice: (state) => {
            state.invoice = null;
            state.invoiceStatus = "idle";
            state.error = null;
        },
        clearListState: (state) => {
            state.invoices = [];
            state.meta = { count: 0, next: null, previous: null };
            state.listStatus = "idle";
            state.error = null;
        },
        clearCreateState: (state) => {
            state.createStatus = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchAdminInvoices
            .addCase(fetchAdminInvoices.pending, (state) => {
                state.listStatus = "loading";
                state.error = null;
            })
            .addCase(fetchAdminInvoices.fulfilled, (state, action) => {
                state.listStatus = "succeeded";
                state.invoices = action.payload.invoices;
                state.meta = action.payload.meta || state.meta;
            })
            .addCase(fetchAdminInvoices.rejected, (state, action) => {
                state.listStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al cargar facturas";
            })

            // fetchInvoiceById
            .addCase(fetchInvoiceById.pending, (state) => {
                state.invoiceStatus = "loading";
                state.error = null;
            })
            .addCase(fetchInvoiceById.fulfilled, (state, action) => {
                state.invoiceStatus = "succeeded";
                state.invoice = action.payload;
            })
            .addCase(fetchInvoiceById.rejected, (state, action) => {
                state.invoiceStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al obtener factura";
            })

            // createInvoice
            .addCase(createInvoice.pending, (state) => {
                state.createStatus = "loading";
                state.error = null;
            })
            .addCase(createInvoice.fulfilled, (state, action) => {
                state.createStatus = "succeeded";
                // agregar al listado si existe
                if (action.payload) {
                    state.invoices = [action.payload, ...state.invoices];
                    state.meta.count = (state.meta.count || 0) + 1;
                    toast.success("Factura creada correctamente");
                }
            })
            .addCase(createInvoice.rejected, (state, action) => {
                state.createStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al crear factura";
            })

            // updateInvoice
            .addCase(updateInvoice.pending, (state) => {
                state.updateStatus = "loading";
                state.error = null;
            })
            .addCase(updateInvoice.fulfilled, (state, action) => {
                state.updateStatus = "succeeded";
                const updated = action.payload;
                if (updated && updated.id) {
                    state.invoices = state.invoices.map((inv) => (Number(inv.id) === Number(updated.id) ? updated : inv));
                    if (state.invoice && Number(state.invoice.id) === Number(updated.id)) state.invoice = updated;
                    toast.success("Factura actualizada");
                }
            })
            .addCase(updateInvoice.rejected, (state, action) => {
                state.updateStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al actualizar factura";
            })

            // deleteInvoice
            .addCase(deleteInvoice.pending, (state) => {
                state.deleteStatus = "loading";
                state.error = null;
            })
            .addCase(deleteInvoice.fulfilled, (state, action) => {
                state.deleteStatus = "succeeded";
                const id = action.payload?.invoiceId;
                if (id) {
                    state.invoices = state.invoices.filter((inv) => Number(inv.id) !== Number(id));
                    state.meta.count = Math.max(0, (state.meta.count || 1) - 1);
                    if (state.invoice && Number(state.invoice.id) === Number(id)) state.invoice = null;
                    toast.success("Factura eliminada");
                }
            })
            .addCase(deleteInvoice.rejected, (state, action) => {
                state.deleteStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al eliminar factura";
            })

            // downloadInvoicePdf
            .addCase(downloadInvoicePdf.pending, (state) => {
                state.downloadStatus = "loading";
                state.error = null;
            })
            .addCase(downloadInvoicePdf.fulfilled, (state, action) => {
                state.downloadStatus = "succeeded";
                // mantengo filename si es útil en la UI
                // action.payload: { invoiceId, filename }
            })
            .addCase(downloadInvoicePdf.rejected, (state, action) => {
                state.downloadStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al descargar PDF";
            })
            .addCase(fetchInvoiceByOrderId.pending, (state) => {
                state.invoiceStatus = "loading";
                state.error = null;
            })
            .addCase(fetchInvoiceByOrderId.fulfilled, (state, action) => {
                state.invoiceStatus = "succeeded";
                state.invoice = action.payload; // puede ser null si no hay factura
            })
            .addCase(fetchInvoiceByOrderId.rejected, (state, action) => {
                state.invoiceStatus = "failed";
                state.error = action.payload || action.error?.message || "Error al buscar factura";
            })
    },
});

export const { clearInvoice, clearListState, clearCreateState } = adminInvoicesSlice.actions;
export default adminInvoicesSlice.reducer;
