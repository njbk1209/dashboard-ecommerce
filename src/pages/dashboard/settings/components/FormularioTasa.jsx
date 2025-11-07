import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { createExchange, fetchLatestExchange, resetCreateState } from "../../../../redux/features/exchange/exchangeSlices";

const FormularioTasa = () => {
  const dispatch = useDispatch();
  const { createStatus, createError } = useSelector((state) => state.exchange);

  // opcional: si quieres refrescar la tasa luego de crearla
  useEffect(() => {
    if (createStatus === "succeeded") {
      dispatch(fetchLatestExchange());
      // resetear estado de creación después de un éxito para permitir reintentos limpios
      const t = setTimeout(() => dispatch(resetCreateState()), 1200);
      return () => clearTimeout(t);
    }
  }, [createStatus, dispatch]);

  const formik = useFormik({
    initialValues: {
      tasa: "",
    },
    validationSchema: Yup.object({
      tasa: Yup.string()
        .required("La tasa es obligatoria")
        .test("is-number", "Debe ser un número válido", (value) => {
          if (!value) return false;
          // permitir coma o punto como separador decimal
          const normalized = value.replace(",", ".");
          return !Number.isNaN(Number(normalized));
        }),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        // normalizar valor (coma -> punto) y convertir a número
        const normalized = values.tasa.replace(",", ".");
        const num = parseFloat(normalized);

        // dispatch del thunk (puedes pasar sólo el número)
        const resultAction = await dispatch(createExchange(num));
        // si quieres manejar errores aquí: resultAction.error existe si falló
        if (resultAction.error) {
          // el createError en el slice ya se actualiza; opcional: mostrar alert
          // alert("Error al crear la tasa: " + (resultAction.payload || resultAction.error.message));
        } else {
          // éxito: limpiar formulario
          resetForm();
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col w-64 text-sm">
      <label htmlFor="tasa" className="font-medium mb-1 text-gray-800">
        Nueva tasa:
      </label>

      <input
        id="tasa"
        name="tasa"
        type="text"
        value={formik.values.tasa}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className="border rounded p-2 mb-2"
        placeholder="Ej. 320,32"
        disabled={formik.isSubmitting || createStatus === "loading"}
      />
      {formik.touched.tasa && formik.errors.tasa && (
        <div className="text-red-500 text-sm mb-2">{formik.errors.tasa}</div>
      )}

      <button
        type="submit"
        disabled={formik.isSubmitting || createStatus === "loading"}
        className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-60"
      >
        {createStatus === "loading" ? "Guardando..." : "Actualizar"}
      </button>

      {/* Mensajes simples de estado */}
      {createStatus === "succeeded" && (
        <div className="text-green-600 text-sm mt-2">Tasa creada con éxito.</div>
      )}
      {createStatus === "failed" && (
        <div className="text-red-600 text-sm mt-2">{createError ?? "Error al crear la tasa."}</div>
      )}
    </form>
  );
};

export default FormularioTasa;
