import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchTravels,
    clearTravelsState,
    fetchAvailableCouriers,
    assignCourierToTravel,
    markTravelDelivered, // <-- IMPORTAR el thunk
} from "../../../redux/features/shipping/shippingSlices";
import { Link } from "react-router";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

/**
 * TravelList
 * - Usa fetchTravels({ ...params })
 * - Params soportados: page, page_size, start_date, end_date, order_id, courier_identification, is_paid
 */

const TravelList = () => {
    const dispatch = useDispatch();
    const {
        travels,
        meta,
        statusTravels,
        statusCouriers,
        statusDeliver, // <- estado del thunk markTravelDelivered
        errorTravels,
        errorCouriers,
        couriers,
    } = useSelector((state) => state.shipping);

    // Parámetros de búsqueda locales (se pasan al thunk)
    const [params, setParams] = useState({
        page: 1,
        page_size: 10,
        start_date: "",
        end_date: "",
        order_id: "",
        courier_identification: "",
        is_paid: "", // "", "true", "false"
    });

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTravel, setSelectedTravel] = useState(null);
    const [selectedCourier, setSelectedCourier] = useState("");
    const [searchCourier, setSearchCourier] = useState("");

    // Schema de validación con Yup
    const validationSchema = Yup.object().shape({
        start_date: Yup.date()
            .nullable()
            .transform((v, o) => (o === "" ? null : v))
            .typeError("Fecha inválida"),
        end_date: Yup.date()
            .nullable()
            .transform((v, o) => (o === "" ? null : v))
            .typeError("Fecha inválida")
            .min(Yup.ref("start_date"), "La fecha hasta debe ser igual o posterior a la fecha desde"),
        order_id: Yup.number().integer().positive().nullable().transform((v, o) => (o === "" ? null : v)),
        courier_identification: Yup.string().nullable().transform((v, o) => (o === "" ? null : v)),
        page_size: Yup.number().integer().positive().min(1).max(100).nullable().transform((v, o) => (o === "" ? null : v)),
    });

    useEffect(() => {
        dispatch(fetchTravels(params));
        return () => dispatch(clearTravelsState());
    }, []); // eslint-disable-line

    // Handler para cuando cambie la pagina (next/prev)
    const goToPage = (newPage) => {
        const newParams = { ...params, page: newPage };
        setParams(newParams);
        dispatch(fetchTravels(newParams));
    };

    // Handler para submit del formik (aplica filtros y resetea page a 1)
    const handleSubmit = (values) => {
        const cleaned = {
            ...params,
            page: 1, // siempre reset al buscar
            start_date: values.start_date || "",
            end_date: values.end_date || "",
            order_id: values.order_id || "",
            courier_identification: values.courier_identification || "",
            is_paid: values.is_paid === "" ? "" : values.is_paid,
            page_size: values.page_size || params.page_size,
        };
        setParams(cleaned);
        dispatch(fetchTravels(cleaned));
    };

    // Limpiar filtros
    const handleClear = (resetForm) => {
        const cleared = {
            page: 1,
            page_size: 10,
            start_date: "",
            end_date: "",
            order_id: "",
            courier_identification: "",
            is_paid: "",
        };
        resetForm();
        setParams(cleared);
        dispatch(fetchTravels(cleared));
    };

    // Computed values for pagination UI
    const currentPage = meta?.next || meta?.previous ? params.page : params.page;
    const hasNext = !!meta?.next;
    const hasPrev = !!meta?.previous;

    const openModal = (travel) => {
        setSelectedTravel(travel);
        setSelectedCourier("");
        setSearchCourier("");
        setModalOpen(true);
        dispatch(fetchAvailableCouriers());
    };

    const assignCourier = () => {
        if (!selectedCourier || !selectedTravel) return;
        dispatch(assignCourierToTravel({ travel_id: selectedTravel.id, courier_id: selectedCourier }))
            .unwrap()
            .then(() => {
                setModalOpen(false);
                dispatch(fetchTravels(params)); // refrescar tabla
            })
            .catch((err) => {
                alert("Error asignando courier: " + (err?.detail || JSON.stringify(err)));
            });
    };

    const filteredCouriers = (couriers || []).filter(
        (c) =>
            c.full_name.toLowerCase().includes(searchCourier.toLowerCase()) ||
            c.identification.toLowerCase().includes(searchCourier.toLowerCase())
    );

    // ---------------- Badges ----------------
    const PaidBadge = ({ paid }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {paid ? "Pagado" : "No pagado"}
        </span>
    );

    const StatusBadge = ({ status, status_display }) => {
        // Permitir pasar tanto el código como la etiqueta
        if (status === "in_shipping" || status_display === "En camino") {
            return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">En camino</span>;
        }
        if (status === "not_shipping" || status_display === "Disponible") {
            return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">Disponible</span>;
        }
        if (status === "delivered" || status_display === "Entregado") {
            return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Entregado</span>;
        }
        return <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-full text-xs font-semibold">{status_display || status}</span>;
    };

    // ---------------- Nuevo: marcar entregado ----------------
    const handleMarkDelivered = (travel) => {
        // Mostrar confirm antes de llamar al endpoint
        const confirmMsg = `¿Marcar Travel #${travel.id} como entregado? Esta acción fijará la fecha de fin y dejará al courier como disponible.`;
        if (!window.confirm(confirmMsg)) return;

        // Llamar thunk y manejar respuesta
        dispatch(markTravelDelivered({ travel_id: travel.id }))
            .unwrap()
            .then((payload) => {
                // payload: { order_id, travel_id } según backend
                const orderId = payload?.order_id;
                if (orderId) {
                    // redirigir el admin a la orden
                    window.location.href = `/dashboard/order/${orderId}`;
                } else {
                    // si no viene order_id, refrescamos la tabla
                    dispatch(fetchTravels(params));
                }
            })
            .catch((err) => {
                console.error("Error marcando como entregado:", err);
                alert("Error marcando como entregado: " + (err?.detail || JSON.stringify(err)));
            });
    };

    return (
        <div className="text-gray-900 space-y-4 bg-white">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl">Control de entregas</h1>

                <div className="text-sm text-gray-600">
                    {statusTravels === "loading" ? "Cargando..." : `Resultados: ${meta?.count ?? 0}`}
                </div>
            </div>

            {/* FORMULARIO DE FILTROS */}
            <Formik
                initialValues={{
                    start_date: params.start_date,
                    end_date: params.end_date,
                    order_id: params.order_id,
                    courier_identification: params.courier_identification,
                    is_paid: params.is_paid,
                    page_size: params.page_size,
                }}
                validationSchema={validationSchema}
                onSubmit={(values) => handleSubmit(values)}
            >
                {({ values, isSubmitting, setFieldValue, resetForm }) => (
                    <Form className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="flex flex-col md:flex-row gap-3 w-full">
                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-700 mb-1">Fecha desde</label>
                                    <Field name="start_date" type="date" className="border border-gray-300 rounded px-3 py-2 text-sm" />
                                    <ErrorMessage name="start_date" component="div" className="text-xs text-red-600 mt-1" />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-700 mb-1">Fecha hasta</label>
                                    <Field name="end_date" type="date" className="border border-gray-300 rounded px-3 py-2 text-sm" />
                                    <ErrorMessage name="end_date" component="div" className="text-xs text-red-600 mt-1" />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-700 mb-1">ID Orden</label>
                                    <Field name="order_id" type="text" placeholder="123" className="border border-gray-300 rounded px-3 py-2 text-sm" />
                                    <ErrorMessage name="order_id" component="div" className="text-xs text-red-600 mt-1" />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-700 mb-1">Identificación Repartidor</label>
                                    <Field name="courier_identification" type="text" placeholder="V12345678" className="border border-gray-300 rounded px-3 py-2 text-sm" />
                                    <ErrorMessage name="courier_identification" component="div" className="text-xs text-red-600 mt-1" />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm text-gray-700 mb-1">Página / Tamaño</label>
                                    <div className="flex gap-2">
                                        <Field name="page_size" type="number" min="1" max="100" className="w-20 border border-gray-300 rounded px-3 py-2 text-sm" />
                                        <select
                                            name="is_paid"
                                            value={values.is_paid}
                                            onChange={(e) => setFieldValue("is_paid", e.target.value)}
                                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                                        >
                                            <option value="">Todos</option>
                                            <option value="true">Pagados</option>
                                            <option value="false">No pagados</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                >
                                    Buscar
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleClear(resetForm)}
                                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded border border-gray-200 text-sm"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </Form>
                )}
            </Formik>

            {/* ERRORES */}
            {statusTravels === "failed" && (
                <div className="text-sm text-red-600">Error: {typeof errorTravels === "string" ? errorTravels : JSON.stringify(errorTravels)}</div>
            )}

            {/* TABLA */}
            {statusTravels === "succeeded" && travels.length === 0 && (
                <div className="text-sm text-gray-600">No hay entregas para mostrar.</div>
            )}

            {statusTravels === "succeeded" && travels.length > 0 && (
                <div className="overflow-x-auto mt-2">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Orden</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Repartidor</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Identificación</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Inicio</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fin</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Monto</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Pago</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {travels.map((t) => (
                                <tr key={t.id}>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                        <Link to={`/dashboard/travel/${t.id}`} className="underline text-blue-600">#{t.id}</Link>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">
                                        {t.order?.id ? (
                                            <Link to={`/dashboard/order/${t.order.id}`} className="text-blue-600 underline">
                                                #{t.order.id}
                                            </Link>
                                        ) : (
                                            "N/A"
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{t.courier?.full_name ?? "N/A"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{t.courier?.identification ?? "N/A"}</td>
                                    <td className="px-4 py-3 text-sm"><StatusBadge status={t.status} status_display={t.status_display} /></td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{t.start_time ? new Date(t.start_time).toLocaleString() : "-"}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{t.end_time ? new Date(t.end_time).toLocaleString() : "-"}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-800">${t.amount_courier}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <PaidBadge paid={!!t.is_paid} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-800 flex items-center gap-2">
                                        <Link to={`/dashboard/travel/${t.id}`} className="text-blue-600 underline">Ver</Link>

                                        {/* Asignar repartidor solo si no hay courier */}
                                        {!t.courier && (
                                            <span
                                                onClick={() => openModal(t)}
                                                className="text-blue-600 underline px-2 py-1 rounded text-sm cursor-pointer"
                                            >
                                                Asignar repartidor
                                            </span>
                                        )}

                                        {/* MARCAR ENTREGADO — solo si está en camino */}
                                        {(t.status === "in_shipping" || t.status_display === "En camino") && (
                                            <button
                                                onClick={() => handleMarkDelivered(t)}
                                                className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                                                disabled={statusDeliver === "loading"}
                                            >
                                                {statusDeliver === "loading" ? "Procesando..." : "Marcar entregado"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* PAGINACIÓN */}
            <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                    Mostrando página {params.page} — Total: {meta?.count ?? 0}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (hasPrev && params.page > 1) {
                                goToPage(params.page - 1);
                            }
                        }}
                        disabled={!hasPrev}
                        className={`px-3 py-2 rounded text-sm ${hasPrev ? "bg-white border border-gray-300" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    >
                        Anterior
                    </button>

                    <button
                        onClick={() => {
                            if (hasNext) {
                                goToPage(params.page + 1);
                            }
                        }}
                        disabled={!hasNext}
                        className={`px-3 py-2 rounded text-sm ${hasNext ? "bg-white border border-gray-300" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Modal (idéntico al que ya tiene) */}
            {modalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-96">
                        <h2 className="text-lg font-semibold mb-4">Asignar courier a Travel #{selectedTravel?.id}</h2>
                        <input
                            type="text"
                            placeholder="Buscar courier..."
                            className="border border-gray-300 rounded px-3 py-2 w-full mb-3 text-sm"
                            value={searchCourier}
                            onChange={(e) => setSearchCourier(e.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto mb-4">
                            {filteredCouriers.map((c) => (
                                <div key={c.id} className="flex items-center mb-2">
                                    <input
                                        type="radio"
                                        name="selectedCourier"
                                        value={c.id}
                                        checked={selectedCourier === String(c.id)}
                                        onChange={() => setSelectedCourier(String(c.id))}
                                        className="mr-2"
                                    />
                                    <span>{c.full_name} ({c.identification})</span>
                                </div>
                            ))}
                            {filteredCouriers.length === 0 && <div className="text-gray-500 text-sm">No se encontraron couriers</div>}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded text-sm">Cancelar</button>
                            <button
                                onClick={assignCourier}
                                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                disabled={!selectedCourier}
                            >
                                Asignar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TravelList;
