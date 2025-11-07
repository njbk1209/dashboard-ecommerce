import React, { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAdminPromotions,
    createOrUpdatePromotion,
    deletePromotion,
    clearImportResult,
    exportPromotionProductsCSV
} from "../../../redux/features/promotion/promotionSlices";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const Promotion = () => {
    const dispatch = useDispatch();

    const {
        promotions,
        fetchStatus,
        createStatus,
        deleteStatus,
        error,
        importResult,
        importStatus,
        exportStatus
    } = useSelector((state) => state.promotion);

    // Estados para modal / edición
    const [searchTerm, setSearchTerm] = useState("");
    const [editPromotion, setEditPromotion] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Estado local para saber qué promoción se está exportando exactamente
    const [exportingId, setExportingId] = useState(null);

    // Filtrar promociones localmente según searchTerm
    const filteredPromotions =
        promotions?.results?.filter((promo) =>
            promo.title.toLowerCase().includes(searchTerm.toLowerCase())
        ) || [];

    useEffect(() => {
        dispatch(fetchAdminPromotions());
    }, [dispatch]);

    // Validación Yup para crear/editar promo
    const promotionSchema = Yup.object().shape({
        title: Yup.string().required("El nombre es obligatorio"),
        description: Yup.string(),
        start_date: Yup.date()
            .required("Fecha inicio obligatoria")
            .typeError("Fecha inicio inválida"),
        end_date: Yup.date()
            .required("Fecha final obligatoria")
            .typeError("Fecha final inválida")
            .min(Yup.ref("start_date"), "La fecha final debe ser después de la de inicio"),
        active: Yup.boolean(),
        csvFile: Yup
            .mixed()
            .test(
                "fileFormat",
                "Solo se permiten archivos CSV",
                value => !value || (value && value.type === "text/csv")
            )
            .nullable(),
    });

    // Manejar submit del formulario (crear o actualizar)
    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            const { csvFile, ...promotionData } = values;

            await dispatch(
                createOrUpdatePromotion({
                    promotionId: editPromotion?.id,
                    data: promotionData,
                    csvFile: csvFile || null,
                })
            ).unwrap();

            resetForm();
            setEditPromotion(null);
            setShowForm(false);
        } catch (err) {
            // errores ya manejados en redux slice
        } finally {
            setSubmitting(false);
        }
    };

    // Manejar eliminar promoción
    const handleDelete = (id) => {
        if (window.confirm("¿Eliminar promoción?")) {
            dispatch(deletePromotion(id));
        }
    };

    // Abrir formulario para crear o editar
    const openForm = (promo = null) => {
        setEditPromotion(promo);
        setShowForm(true);
    };

    // Cancelar formulario
    const cancelForm = () => {
        setEditPromotion(null);
        setShowForm(false);
    };

    // Manejo de búsqueda
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handler: exportar productos de la promoción (descarga CSV)
    const handleExportProducts = async (promotionId) => {
        try {
            setExportingId(promotionId);
            // despacha y espera a que termine para limpiar estado local
            await dispatch(exportPromotionProductsCSV(promotionId)).unwrap();
            // toast ya es mostrado por el thunk
        } catch (err) {
            // el thunk maneja toasts y errores; aquí solo silenciamos o puedes mostrar adicional
        } finally {
            setExportingId(null);
        }
    };

    return (
        <div className="text-gray-900 space-y-4 mx-auto">
            <h1 className="text-2xl mb-2">Gestión de promociones</h1>

            {/* Barra de búsqueda + botón crear */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-end">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-grow">
                    <div className="flex flex-col flex-grow max-w-sm">
                        <label htmlFor="search-promo" className="mb-1 text-sm text-gray-900">
                            Búsqueda de promociones
                        </label>
                        <input
                            type="text"
                            id="search-promo"
                            className="border border-gray-300 rounded px-3 py-2 text-sm"
                            placeholder="Nombre de la promoción"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => openForm()}
                        className="inline-flex space-x-1 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50"
                        disabled={createStatus === "loading"}
                    >
                        <PlusIcon className="w-5 h-5 text-white" />
                        <span>Crear promoción</span>
                    </button>
                </div>
            </div>

            {/* Formulario creación/edición */}
            {showForm && (
                <div className="border border-gray-300 rounded p-4 bg-gray-50 shadow-sm">
                    <h2 className="text-lg font-semibold mb-3">
                        {editPromotion ? "Editar promoción" : "Crear promoción"}
                    </h2>

                    <Formik
                        initialValues={{
                            title: editPromotion?.title || "",
                            description: editPromotion?.description || "",
                            start_date:
                                editPromotion?.start_date
                                    ? editPromotion.start_date.slice(0, 10)
                                    : "",
                            end_date:
                                editPromotion?.end_date
                                    ? editPromotion.end_date.slice(0, 10)
                                    : "",
                            active: editPromotion?.active || false,
                            csvFile: null
                        }}
                        validationSchema={promotionSchema}
                        onSubmit={handleSubmit}
                        enableReinitialize
                    >
                        {({ isSubmitting, values, setFieldValue }) => (
                            <Form className="space-y-4 max-w-lg">
                                <div>
                                    <label htmlFor="title" className="block font-medium text-sm mb-1">
                                        Nombre
                                    </label>
                                    <Field
                                        name="title"
                                        type="text"
                                        id="title"
                                        className="border border-gray-300 rounded px-3 py-2 w-full"
                                    />
                                    <ErrorMessage
                                        name="title"
                                        component="div"
                                        className="text-red-600 text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="description"
                                        className="block font-medium text-sm mb-1"
                                    >
                                        Descripción
                                    </label>
                                    <Field
                                        name="description"
                                        as="textarea"
                                        id="description"
                                        className="border border-gray-300 rounded px-3 py-2 w-full resize-none"
                                        rows={3}
                                    />
                                    <ErrorMessage
                                        name="description"
                                        component="div"
                                        className="text-red-600 text-sm mt-1"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label
                                            htmlFor="start_date"
                                            className="block font-medium text-sm mb-1"
                                        >
                                            Fecha de inicio
                                        </label>
                                        <Field
                                            name="start_date"
                                            type="date"
                                            id="start_date"
                                            className="border border-gray-300 rounded px-3 py-2 w-full"
                                        />
                                        <ErrorMessage
                                            name="start_date"
                                            component="div"
                                            className="text-red-600 text-sm mt-1"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label
                                            htmlFor="end_date"
                                            className="block font-medium text-sm mb-1"
                                        >
                                            Fecha de finalización
                                        </label>
                                        <Field
                                            name="end_date"
                                            type="date"
                                            id="end_date"
                                            className="border border-gray-300 rounded px-3 py-2 w-full"
                                        />
                                        <ErrorMessage
                                            name="end_date"
                                            component="div"
                                            className="text-red-600 text-sm mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Field
                                        type="checkbox"
                                        name="active"
                                        id="active"
                                        className="h-4 w-4"
                                    />
                                    <label htmlFor="active" className="text-sm">
                                        Activa
                                    </label>
                                </div>

                                <div>
                                    <label
                                        htmlFor="csvFile"
                                        className="block font-medium text-sm mb-1"
                                    >
                                        Archivo CSV (opcional)
                                    </label>
                                    <input
                                        id="csvFile"
                                        name="csvFile"
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(event) => {
                                            setFieldValue("csvFile", event.currentTarget.files[0]);
                                        }}
                                        className="border border-gray-300 rounded px-3 py-2 w-full"
                                    />
                                    {values.csvFile && (
                                        <p className="mt-1 text-sm text-gray-700">
                                            Archivo seleccionado: {values.csvFile.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                    >
                                        {editPromotion ? "Actualizar" : "Crear"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelForm}
                                        className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}

            {/* Tabla de promociones */}
            <div className="overflow-x-auto mt-6">
                {fetchStatus === "loading" && (
                    <p className="text-center text-gray-600">Cargando promociones...</p>
                )}
                {fetchStatus === "failed" && (
                    <p className="text-center text-red-600">{error}</p>
                )}

                {fetchStatus === "succeeded" && filteredPromotions.length === 0 && (
                    <p className="text-center text-gray-600">No se encontraron promociones.</p>
                )}

                {fetchStatus === "succeeded" && filteredPromotions.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Nombre
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Descripción
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Fecha de inicio
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Fecha de finalización
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Estado
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-sm">
                            {filteredPromotions.map((promo) => (
                                <tr key={promo.id}>
                                    <td className="px-4 py-2 text-gray-800">{promo.title}</td>
                                    <td className="px-4 py-2 text-gray-800">{promo.description}</td>
                                    <td className="px-4 py-2 text-gray-800">
                                        {new Date(promo.start_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800">
                                        {new Date(promo.end_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2 text-gray-800">{promo.active ? "✔" : "✘"}</td>
                                    <td className="px-4 py-2 flex space-x-3 text-xs">
                                        <button
                                            className="text-blue-600 hover:underline"
                                            onClick={() => openForm(promo)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            className="text-red-600 hover:underline"
                                            onClick={() => handleDelete(promo.id)}
                                            disabled={deleteStatus === "loading"}
                                        >
                                            Eliminar
                                        </button>
                                        {/* Ver productos -> usa thunk exportPromotionProductsCSV */}
                                        <button
                                            className="text-orange-600 hover:underline flex items-center"
                                            onClick={() => handleExportProducts(promo.id)}
                                            disabled={exportingId === promo.id || exportStatus === "loading"}
                                            title="Descargar productos de la promoción en CSV"
                                        >
                                            {exportingId === promo.id || exportStatus === "loading" ? (
                                                // spinner simple
                                                <svg className="animate-spin h-4 w-4 mr-2 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                                </svg>
                                            ) : null}
                                            Ver productos
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Mensaje resultado import */}
            {importResult && (
                <div className="mt-4 p-3 border border-green-400 bg-green-100 rounded text-green-700">
                    {importResult.message || "Operación completada con éxito."}
                    <button
                        onClick={() => dispatch(clearImportResult())}
                        className="ml-4 underline text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            )}

            {/* Error global */}
            {error && (
                <div className="mt-4 p-3 border border-red-400 bg-red-100 rounded text-red-700">
                    {typeof error === "string"
                        ? error
                        : JSON.stringify(error, null, 2)}
                </div>
            )}
        </div>
    );
};

export default Promotion;
