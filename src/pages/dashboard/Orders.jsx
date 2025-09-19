import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrders, clearOrder, } from "../../redux/features/order/orderSlices";
import { Link } from "react-router";
import { Spinner } from "@material-tailwind/react";

const ORDER_STATUSES = [
  { value: "", label: "Todos los estados" },
  { value: "not_processed", label: "Pago pendiente" },
  { value: "payment_review", label: "Pago en revisión" },
  { value: "shipping", label: "Pago aprobado, envío en proceso" },
  { value: "pickup", label: "En espera de retiro" },
  { value: "delivered", label: "Finalizo con éxito" },
  { value: "cancelled", label: "Pedido cancelado" },
];

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "not_processed":
      return "bg-yellow-100 text-yellow-800";
    case "payment_review":
      return "bg-amber-100 text-amber-800";
    case "shipping":
      return "bg-blue-100 text-blue-800";
    case "pickup":
      return "bg-indigo-100 text-indigo-800";
    case "delivered":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, orderStatus, error } = useSelector((state) => state.order);

  const [filters, setFilters] = useState({
    status: "",
    user: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    dispatch(clearOrder());
    dispatch(fetchAdminOrders(filters));
  }, []);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    dispatch(fetchAdminOrders(newFilters));
  };

  return (
    <div className="text-gray-900 space-y-4">
      <h1 className="text-2xl mb-2">Pedidos</h1>

      {/* Filtros rápidos por estado */}
      <div className="flex flex-row flex-wrap gap-2 sm:gap-x-2 text-sm">
        <button
          onClick={() => handleFilterChange("status", "")}
          className={`${
            filters.status === ""
              ? "text-gray-900 font-semibold"
              : "text-blue-600"
          } `}
        >
          Todos
        </button>

        {ORDER_STATUSES.slice(1).map((status) => (
          <React.Fragment key={status.value}>
            <span>|</span>
            <button
              onClick={() => handleFilterChange("status", status.value)}
              className={`${
                filters.status === status.value
                  ? "text-gray-900 font-semibold"
                  : "text-blue-600"
              }`}
            >
              {status.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Filtros avanzados */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label htmlFor="start-date" className="mb-1 text-sm text-gray-800">
              Fecha desde
            </label>
            <input
              type="date"
              id="start-date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
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
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col">
            <label
              htmlFor="search-order"
              className="mb-1 text-sm text-gray-800"
            >
              Correo
            </label>
            <input
              type="text"
              id="search-order"
              value={filters.user}
              onChange={(e) => handleFilterChange("user", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Cargando */}
      {orderStatus === "loading" && (
        <div className="text-sm text-gray-600 mt-6 flex items-center">
          <Spinner className="h-5 w-5 mr-4" color="blue" /> Cargando pedidos...
        </div>
      )}

      {/* Error */}
      {orderStatus === "failed" && (
        <div className="text-sm text-red-600 mt-6">Error: {error}</div>
      )}

      {/* Tabla */}
      {orderStatus === "succeeded" && (
        <>
          {orders.length === 0 ? (
            <div className="text-sm text-gray-600 mt-6">
              No hay pedidos disponibles para mostrar.
            </div>
          ) : (
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Tipo de envío
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Creada
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Monto Total
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <Link
                          to={`/dashboard/order/${order.id}`}
                          className="underline text-blue-600"
                        >
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {order.user}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {order.shipping_type || "N/A"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            order.status
                          )}`}
                        >
                          {order.status_display}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {new Date(order.date_issued).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        ${order.total_amount}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        <Link to={`/dashboard/order/${order.id}`}>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Orders;
