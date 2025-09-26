import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router";
import {
  fetchAdminUsers,
  deactivateAdminUser,
  activateAdminUser
} from "../../../redux/features/user/userSlices";
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

const currencyUSD = (v) =>
  typeof v === "number" || typeof v === "string"
    ? new Intl.NumberFormat("es-VE", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(v))
    : "-";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { items, count, status, params } = useSelector(
    (s) => s.user.adminUsers
  );

  const [inputValue, setInputValue] = useState(params.search || "");

  useEffect(() => {
    // Carga inicial
    dispatch(fetchAdminUsers({ page: 1, page_size: params.page_size || 20 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(
      fetchAdminUsers({
        ...params,
        page: 1,
        search: inputValue.trim(),
      })
    );
  };

  const onChangePage = (page) => {
    if (page < 1) return;
    // calcula último posible según page_size
    const maxPage = Math.max(1, Math.ceil(count / (params.page_size || 20)));
    if (page > maxPage) return;
    dispatch(fetchAdminUsers({ ...params, page }));
  };

  const orderBy = (ordering) => {
    dispatch(fetchAdminUsers({ ...params, ordering, page: 1 }));
  };

  const toggleOrder = (field) => {
    const current = params.ordering || "id";
    const next =
      current === field ? `-${field}` : current === `-${field}` ? field : field;
    orderBy(next);
  };

  const handleDeactivate = async (u) => {
    if (!u?.id) return;
    const ok = window.confirm(
      `¿Desactivar al usuario ${u.full_name || u.email}?`
    );
    if (!ok) return;
    await dispatch(deactivateAdminUser(u.id));
    // refresca la página actual para mantener consistencia con el backend
    dispatch(fetchAdminUsers({ ...params }));
  };

  const page = params.page || 1;
  const pageSize = params.page_size || 20;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count, pageSize]
  );

  return (
    <div className="text-gray-800 py-6 bg-white pr-4">
      <h1 className="text-2xl font-medium mb-3">Gestión de usuarios</h1>

      {/* Search bar */}
      <div className="mb-5 flex">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por email o identificación"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Buscar"
        >
          Buscar
        </button>
      </div>

      {/* Controles superiores */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => toggleOrder("email")}
            className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
            title="Ordenar por email"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            Email
          </button>
          <button
            onClick={() => toggleOrder("gasto_total_usd")}
            className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
            title="Ordenar por gasto total"
          >
            <ArrowsUpDownIcon className="h-4 w-4" />
            Gasto total
          </button>
        </div>
        <div className="text-sm text-gray-500">
          {count} usuario{count === 1 ? "" : "s"}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Identificación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Fecha registro
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Gasto total (USD)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Ítems comprados
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" ? (
              <tr>
                <td colSpan="9" className="text-center py-8">
                  Cargando usuarios...
                </td>
              </tr>
            ) : items.length > 0 ? (
              items.map((u, index) => (
                <tr
                  key={u.id}
                  className={`border-b border-blue-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-blue-gray-50/50"
                    }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <Link
                      to={`/dashboard/user/${u.id}`}
                      className="text-blue-600 underline"
                    >
                      {u.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {u.full_name || `${u.first_name} ${u.last_name}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {u.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {u.profile?.identification || "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {u.date_joined
                      ? new Date(u.date_joined).toLocaleString("es-VE", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {currencyUSD(u.gasto_total_usd)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    {u.items_comprados ?? 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {u.is_active ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-green-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 text-red-500"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/dashboard/user/${u.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalle"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </Link>

                      {u.is_active ? (
                        // Botón rojo para desactivar (igual que ya tenías)
                        <button
                          onClick={() => handleDeactivate(u)}
                          className="text-red-500 hover:text-red-700"
                          title="Desactivar usuario"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        // NUEVO: botón verde para activar
                        <button
                          onClick={async () => {
                            const ok = window.confirm(`¿Activar al usuario ${u.full_name || u.email}?`);
                            if (!ok) return;
                            await dispatch(activateAdminUser(u.id));
                            // refresca la página actual para mantener consistencia con el backend
                            dispatch(fetchAdminUsers({ ...params }));
                          }}
                          className="text-green-600 hover:text-green-700"
                          title="Activar usuario"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-8">
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Página <span className="font-medium">{page}</span> de{" "}
          <span className="font-medium">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onChangePage(page - 1)}
            disabled={page <= 1 || status === "loading"}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Anterior
          </button>
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onChangePage(page + 1)}
            disabled={page >= totalPages || status === "loading"}
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
