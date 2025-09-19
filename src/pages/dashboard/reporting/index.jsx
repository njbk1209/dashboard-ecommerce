import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSalesReports,
  createSalesReport,
} from "../../../redux/features/reporting/reportingSlices";
import { toast } from "react-hot-toast";
import { Link } from "react-router";

const Reporting = () => {
  const dispatch = useDispatch();
  const { salesReports, salesReportsStatus } = useSelector(
    (state) => state.salesReports
  );

  const [localFilters, setLocalFilters] = useState({
    date_from: "",
    date_to: "",
  });

  // Fetch inicial sin filtros
  useEffect(() => {
    dispatch(fetchSalesReports());
  }, [dispatch]);

  const handleApplyFilters = () => {
    dispatch(fetchSalesReports(localFilters));
  };

  const handleCreateReport = async (date) => {
    const confirmed = window.confirm(
      `¿Estás seguro de generar el cierre de ventas del día ${date}?`
    );
    if (!confirmed) return;

    try {
      const result = await dispatch(createSalesReport(date)).unwrap();
      toast.success(result.detail || "Reporte creado con éxito.");
      dispatch(fetchSalesReports(localFilters));
    } catch (error) {
      toast.error(error || "Error al crear el reporte");
    }
  };

  return (
    <div className="text-gray-900 space-y-4">
      <h1 className="text-2xl mb-2">Estadísticas de venta</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="mb-1 text-sm text-gray-800">
              Fecha desde
            </label>
            <input
              type="date"
              id="start-date"
              value={localFilters.date_from}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, date_from: e.target.value })
              }
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="end-date" className="mb-1 text-sm text-gray-800">
              Fecha hasta
            </label>
            <input
              type="date"
              id="end-date"
              value={localFilters.date_to}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, date_to: e.target.value })
              }
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Aplicar filtro
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Fecha
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Pedidos
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Subtotal
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                IVA
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Total
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Envíos
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {salesReports?.length > 0 ? (
              salesReports.map((report) => (
                <tr key={report.id || "provisional"}>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {report?.orders?.length}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {parseFloat(report.sub_total_amount).toFixed(2)}$
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {parseFloat(report.iva).toFixed(2)}$
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {parseFloat(report.total_amount).toFixed(2)}$
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {parseFloat(report.total_shipping_amount).toFixed(2)}$
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 flex space-x-3">
                    {report.id === null ? (
                      <button
                        className="text-blue-600 underline"
                        onClick={() => handleCreateReport(report.date)}
                      >
                        Cerrar reporte del día
                      </button>
                    ) : (
                      <Link
                        to={`/dashboard/reporting/sales-detail/${report.id}?date=${report.date}`}
                        className="text-blue-600 underline"
                      >
                        Ver detalle
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-4 text-center text-sm text-gray-500"
                >
                  No hay reportes disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reporting;
