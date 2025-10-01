import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link } from "react-router"; // ajusta si usas otra cosa
import {
  fetchCuts,
  createCut,
  // optionally clearCreateCutState if you exported it
} from "../../../redux/features/shipping/shippingSlices";

/**
 * CutsListTravels + Formulario para crear cortes (Formik + Yup)
 * - El formulario está encima de la tabla.
 * - Al crear el corte el thunk descarga el PDF y, si se pide, refresca la lista.
 */

export default function CutsListTravels() {
  const dispatch = useDispatch();
  const cuts = useSelector((state) => state.shipping.cuts);
  const meta = useSelector((state) => state.shipping.cutsMeta);
  const status = useSelector((state) => state.shipping.statusCuts);
  const error = useSelector((state) => state.shipping.errorCuts);

  const statusCreate = useSelector((state) => state.shipping.statusCreateCut);
  const errorCreate = useSelector((state) => state.shipping.errorCreateCut);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    dispatch(fetchCuts({ page, page_size: pageSize }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page]);

  const hasNext = !!meta?.next;
  const hasPrev = !!meta?.previous;

  // Badges
  const StatusBadge = ({ status }) => {
    if (!status) return <span className="bg-gray-50 text-gray-400 px-2 py-1 rounded-full text-xs font-semibold">-</span>;
    if (status === "open" || status === "OPEN" || status === "Abierto") {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Abierto</span>;
    }
    if (status === "paid" || status === "PAID" || status === "Pagado") {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Pagado</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
  };

  // Formik validation
  const validationSchema = Yup.object().shape({
    start_date: Yup.date()
      .required("Requerido")
      .typeError("Fecha inválida"),
    end_date: Yup.date()
      .required("Requerido")
      .typeError("Fecha inválida")
      .min(Yup.ref("start_date"), "La fecha hasta debe ser igual o posterior a la fecha desde"),
    exchange_rate: Yup.number()
      .required("Requerido")
      .positive("Debe ser un número positivo")
      .typeError("Tasa inválida"),
    note: Yup.string().nullable(),
  });

  // Handler de creación: despacha createCut que descargará el PDF
  const handleCreateCut = (values, { setSubmitting, resetForm }) => {
    const payload = {
      start_date: values.start_date,
      end_date: values.end_date,
      exchange_rate: values.exchange_rate,
      note: values.note || "",
      refreshAfter: true, // refresca la lista al terminar
    };

    dispatch(createCut(payload))
      .unwrap()
      .then(() => {
        // éxito: PDF descargado y fetchCuts ya despachado por createCut con refreshAfter
        setSubmitting(false);
        resetForm();
        // opcional: volver a la primera página
        setPage(1);
      })
      .catch((err) => {
        // errorCreate será alimentado en el slice; aquí opcionalmente mostrar alert
        console.error("Error creando corte:", err);
        setSubmitting(false);
      });
  };

  return (
    <div className="text-gray-900 space-y-4 bg-white p-4 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cortes</h1>
        <div className="text-sm text-gray-600">{status === "loading" ? "Cargando..." : `Resultados: ${meta?.count ?? 0}`}</div>
      </div>

      {/* ------------------ FORMULARIO PARA CREAR CORTE ------------------ */}
      <div className="bg-gray-50 p-4 rounded border border-gray-100">
        <Formik
          initialValues={{
            start_date: "",
            end_date: "",
            exchange_rate: "1.0",
            note: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleCreateCut}
        >
          {({ values, isSubmitting, setFieldValue }) => (
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
                    <label className="text-sm text-gray-700 mb-1">Tasa (BS x USD)</label>
                    <Field name="exchange_rate" type="number" step="0.0001" className="border border-gray-300 rounded px-3 py-2 text-sm w-36" />
                    <ErrorMessage name="exchange_rate" component="div" className="text-xs text-red-600 mt-1" />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="text-sm text-gray-700 mb-1">Nota (opcional)</label>
                    <Field name="note" as="textarea" rows="1" className="border border-gray-300 rounded px-3 py-2 text-sm" />
                    <ErrorMessage name="note" component="div" className="text-xs text-red-600 mt-1" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || statusCreate === "loading"}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    {statusCreate === "loading" || isSubmitting ? "Generando reporte..." : "Generar corte (PDF)"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // limpiar formulario: simplemente disparar un evento nativo para resetear valores en Formik
                      setFieldValue("start_date", "");
                      setFieldValue("end_date", "");
                      setFieldValue("exchange_rate", "1.0");
                      setFieldValue("note", "");
                    }}
                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded border border-gray-200 text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* mostrar error de creación si hay */}
              {statusCreate === "failed" && (
                <div className="text-sm text-red-600">
                  Error al crear corte: {typeof errorCreate === "string" ? errorCreate : JSON.stringify(errorCreate)}
                </div>
              )}

              {statusCreate === "succeeded" && (
                <div className="text-sm text-green-700">Reporte generado y descargado correctamente.</div>
              )}
            </Form>
          )}
        </Formik>
      </div>

      {/* ------------------ Mensajes generales de lista ------------------ */}
      {status === "failed" && <div className="text-sm text-red-600">Error: {JSON.stringify(error)}</div>}

      {/* ------------------ TABLA DE cortes ------------------ */}
      {status === "succeeded" && cuts.length === 0 && <div className="text-sm text-gray-600">No hay cortes para mostrar.</div>}

      {status === "succeeded" && cuts.length > 0 && (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Rango</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total (base)</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total (BS)</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Viajes</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {cuts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">#{c.id}</td>

                  <td className="px-4 py-3 text-sm text-gray-800">
                    <div className="flex flex-col">
                      <span className="text-sm">{c.start_date ? new Date(c.start_date).toLocaleString() : "-"}</span>
                      <span className="text-xs text-gray-500">→ {c.end_date ? new Date(c.end_date).toLocaleString() : "-"}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-right text-gray-800">${c.total_amount}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-800">Bs. {c.total_amount_bs}</td>

                  <td className="px-4 py-3 text-sm text-center text-gray-800">{c.total_travels}</td>

                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={c.status} />
                  </td>

                  <td className="px-4 py-3 text-sm text-gray-800 flex items-center gap-3">
                    <Link to={`/dashboard/cut/${c.id}`} className="text-blue-600 underline text-sm">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ------------------ PAGINACIÓN ------------------ */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Mostrando página {page} — Total: {meta?.count ?? 0}</div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (hasPrev && page > 1) {
                setPage((p) => Math.max(1, p - 1));
              }
            }}
            disabled={!hasPrev}
            className={`px-3 py-2 rounded text-sm ${hasPrev ? "bg-white border border-gray-300" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
          >
            Anterior
          </button>

          <span className="px-3 py-2 rounded text-sm bg-white border border-gray-200">Página {page}</span>

          <button
            onClick={() => {
              if (hasNext) setPage((p) => p + 1);
            }}
            disabled={!hasNext}
            className={`px-3 py-2 rounded text-sm ${hasNext ? "bg-white border border-gray-300" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
