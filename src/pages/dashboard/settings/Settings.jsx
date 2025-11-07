import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchControl, updateMaintenanceSettings } from "../../../redux/features/control/controlSlices"; // Ajusta la ruta según tu proyecto
import FormularioTasa from "./components/FormularioTasa";


// --- Switch simple ---
const Switch = ({ checked, onChange, label, disabled = false }) => (
  <label
    className={`flex items-center space-x-3 cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""
      }`}
  >
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div
        className={`w-12 h-6 rounded-full transition-colors duration-300 ease-in-out ${checked ? "bg-blue-600 shadow-inner" : "bg-gray-300"
          }`}
      ></div>
      <div
        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ease-in-out transform ${checked ? "translate-x-6 bg-white shadow-md" : "shadow-md"
          }`}
      ></div>
    </div>
  </label>
);

// --- Utilidades de fecha ---
const isoToLocalDatetime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const localDatetimeToIso = (value) => {
  if (!value) return null;
  const local = new Date(value);
  const offset = local.getTimezoneOffset();
  const utc = new Date(local.getTime() + offset * 60000);
  return utc.toISOString();
};

// --- Componente Principal ---
const Settings = () => {
  const dispatch = useDispatch();
  const { control, status, updateStatus, updateError, error } = useSelector(
    (state) => state.control
  );

  const { rate, date } = useSelector((s) => s.exchange);

  const [formData, setFormData] = useState({
    isMaintenanceMode: false,
    scheduledEnd: "",
  });
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState(null);

  // Obtener estado inicial desde API
  useEffect(() => {
    dispatch(fetchControl());
  }, [dispatch]);

  // Cargar valores en el formulario cuando llegue la data
  useEffect(() => {
    if (control) {
      setFormData({
        isMaintenanceMode: control.is_active || false,
        scheduledEnd: isoToLocalDatetime(control.end_datetime),
      });
    }
  }, [control]);

  // Validación
  const validateForm = useCallback((values) => {
    const newErrors = {};
    if (values.isMaintenanceMode && !values.scheduledEnd) {
      newErrors.scheduledEnd =
        "Debes especificar una fecha y hora de finalización.";
    }
    if (values.scheduledEnd && new Date(values.scheduledEnd) < new Date()) {
      newErrors.scheduledEnd = "La fecha y hora deben ser futuras.";
    }
    return newErrors;
  }, []);

  // Manejadores
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors({});
    setStatusMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatusMessage({
        type: "error",
        text: "Por favor, corrige los errores antes de guardar.",
      });
      return;
    }

    const payload = {
      is_active: formData.isMaintenanceMode,
      end_datetime: localDatetimeToIso(formData.scheduledEnd),
    };

    try {
      await dispatch(updateMaintenanceSettings(payload)).unwrap();
      setStatusMessage({
        type: "success",
        text: "Configuraciones guardadas correctamente.",
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err || "Error al guardar la configuración.",
      });
    }
  };

  const isMaintenanceMode = formData.isMaintenanceMode;

  return (
    <div className="text-gray-900 space-y-4">
      <header>
        <h1 className="text-2xl mb-2">Configuraciones del Sistema</h1>
      </header>


      <form onSubmit={handleSubmit} className="p-4 rounded border border-gray-200">

        <h2 className="font-semibold text-gray-900 mb-2">
          Modo de Mantenimiento de la Web
        </h2>

        <div className="space-y-6 md:space-y-0 md:flex md:items-end md:gap-6 mb-4">
          <div className="flex-shrink-0">
            <Switch
              label="Activar Modo Mantenimiento"
              checked={isMaintenanceMode}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "isMaintenanceMode",
                    type: "checkbox",
                    checked: e.target.checked,
                  },
                })
              }
            />
          </div>

          <div className="flex-grow">
            <label
              htmlFor="scheduledEnd"
              className={`block text-sm font-medium mb-1 ${isMaintenanceMode ? "text-gray-700" : "text-gray-400"
                }`}
            >
              Fecha y hora de finalización (UTC)
            </label>
            <input
              id="scheduledEnd"
              name="scheduledEnd"
              type="datetime-local"
              value={formData.scheduledEnd}
              onChange={handleChange}
              disabled={!isMaintenanceMode}
              className={`w-full px-4 py-2 border rounded text-gray-700 text-base ${isMaintenanceMode
                ? errors.scheduledEnd
                  ? "border-red-500"
                  : "border-gray-300"
                : "bg-gray-100 border-gray-200 cursor-not-allowed"
                }`}
            />
            {errors.scheduledEnd && (
              <p className="mt-1 text-sm text-red-600">
                {errors.scheduledEnd}
              </p>
            )}
          </div>
        </div>


        {statusMessage && (
          <div
            className={`p-4 rounded text-sm font-medium ${statusMessage.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
              }`}
          >
            {statusMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={updateStatus === "loading"}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm rounded ${updateStatus === "loading"
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {updateStatus === "loading"
            ? "Guardando..."
            : "Guardar Configuraciones"}
        </button>

        {error && (
          <p className="text-sm text-red-600 mt-2">
            Error al cargar: {error}
          </p>
        )}
        {updateError && (
          <p className="text-sm text-red-600 mt-2">
            Error al guardar: {updateError}
          </p>
        )}
      </form>


      <div className="p-4 rounded border border-gray-200">
        <h2 className="font-semibold text-gray-900">
          Actualización de tasa
        </h2>
        <p className="text-xs text-gray-700 mb-2">
          Vigente: {date} | {rate} Bs x USD BCV
        </p>
        <FormularioTasa />
      </div>


    </div>
  );
};

export default Settings;
