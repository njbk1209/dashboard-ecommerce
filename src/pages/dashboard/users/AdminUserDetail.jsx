import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
    fetchAdminUserDetail,
    deactivateAdminUser,
    activateAdminUser,
    fetchAdminUsers, // para refrescar lista si vuelves
} from "../../../redux/features/user/userSlices";
import {
    ArrowLeftIcon,
    EyeIcon,
    ArrowPathIcon,
    UserIcon,
    EnvelopeIcon,
    IdentificationIcon,
    MapPinIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    CubeIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

const currencyUSD = (v) =>
    typeof v === "number" || typeof v === "string"
        ? new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(Number(v))
        : "-";

const formatDateTime = (iso) =>
    iso
        ? new Date(iso).toLocaleString("es-VE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "-";

export default function AdminUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { data, status, error, params } = useSelector(
        (s) => s.user.adminUserDetail
    );
    const [ordersStatus, setOrdersStatus] = useState(
        params.orders_status || "delivered"
    );
    const [ordersLimit, setOrdersLimit] = useState(params.orders_limit || 10);
    const [topN, setTopN] = useState(params.top_n || 5);

    // Cargar detalle
    useEffect(() => {
        dispatch(
            fetchAdminUserDetail({
                id,
                orders_status: ordersStatus,
                orders_limit: ordersLimit,
                top_n: topN,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const user = data; // alias corto

    const handleRefetchWithParams = () => {
        dispatch(
            fetchAdminUserDetail({
                id,
                orders_status: ordersStatus,
                orders_limit: Number(ordersLimit) || 10,
                top_n: Number(topN) || 5,
            })
        );
    };

    const handleDeactivate = async () => {
        if (!user?.id) return;
        const ok = window.confirm(
            `¿Desactivar al usuario ${user.full_name || user.email}?`
        );
        if (!ok) return;
        await dispatch(deactivateAdminUser(user.id));
        // refrescamos el detalle para ver el estado actualizado por si viniera de DB
        handleRefetchWithParams();
    };

    const handleActivate = async () => {
        if (!user?.id) return;
        const ok = window.confirm(
            `¿Activar al usuario ${user.full_name || user.email}?`
        );
        if (!ok) return;
        await dispatch(activateAdminUser(user.id));
        handleRefetchWithParams();
    };

    const totalOrdersShown = useMemo(() => user?.orders?.length || 0, [user]);

    if (status === "loading") {
        return (
            <div className="text-gray-800 py-6 bg-white pr-4">
                <div className="flex items-center gap-2 mb-4">
                    <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Volver
                    </button>
                    <h1 className="text-2xl font-medium">Detalle de usuario</h1>
                </div>
                <p>Cargando usuario...</p>
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="text-gray-800 py-6 bg-white pr-4">
                <div className="flex items-center gap-2 mb-4">
                    <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Volver
                    </button>
                    <h1 className="text-2xl font-medium">Detalle de usuario</h1>
                </div>
                <p className="text-red-600">Error: {String(error || "No disponible")}</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="text-gray-800 py-6 bg-white pr-4">
            {/* Header y acciones */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                        Volver
                    </button>
                    <h1 className="text-2xl font-medium">Detalle de usuario</h1>
                </div>
                <div className="flex items-center gap-2">
                    {user.is_active ? (
                        <button
                            onClick={handleDeactivate}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                            title="Desactivar usuario"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Desactivar cliente
                        </button>
                    ) : (
                        <button
                            onClick={handleActivate}
                            className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-sm"
                            title="Activar usuario"
                        >
                            <ArrowPathIcon className="h-5 w-5" />
                            Activar cliente
                        </button>
                    )}
                </div>
            </div>

            {/* Cabecera de datos básicos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="col-span-2 border border-gray-200 rounded p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <UserIcon className="h-6 w-6 text-gray-600" />
                        <h2 className="text-lg font-semibold">
                            {user.full_name || `${user.first_name} ${user.last_name}`}
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-sm">
                        <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">Email:</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <IdentificationIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">Identificación:</span>
                            <span className="font-medium">
                                {user.profile?.identification_type
                                    ? `${user.profile.identification_type}-`
                                    : ""}
                                {user.profile?.identification || "-"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">Registro:</span>
                            <span className="font-medium">{formatDateTime(user.date_joined)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">Ciudad:</span>
                            <span className="font-medium">{user.profile?.city || "-"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPinIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-gray-500">Dirección:</span>
                            <span className="font-medium">
                                {user.profile?.address_line || "-"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {user.is_active ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            ) : (
                                <CheckCircleIcon className="h-5 w-5 text-red-500 rotate-45" />
                            )}
                            <span className="text-gray-500">Estado:</span>
                            <span className="font-medium">
                                {user.is_active ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Resumen */}
                <div className="border border-gray-200 rounded p-4">
                    <h3 className="text-lg font-semibold mb-2">Resumen (exitosas)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BanknotesIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-gray-500">Gasto total:</span>
                            </div>
                            <span className="font-semibold">
                                {currencyUSD(user.resumen?.gasto_total_usd)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CubeIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-gray-500">Ítems comprados:</span>
                            </div>
                            <span className="font-semibold">
                                {user.resumen?.items_comprados ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-gray-500">Pedidos exitosos:</span>
                            </div>
                            <span className="font-semibold">
                                {user.resumen?.num_ordenes_exitosas ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-5 w-5 text-gray-500" />
                                <span className="text-gray-500">Última compra:</span>
                            </div>
                            <span className="font-semibold">
                                {formatDateTime(user.resumen?.ultima_compra)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controles de filtros para el detalle */}
            <div className="border border-gray-200 rounded p-4 mb-4">
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Pedidos:</span>
                        <div className="flex">
                            <button
                                onClick={() => setOrdersStatus("delivered")}
                                className={`px-3 py-1.5 border text-sm rounded-l ${ordersStatus === "delivered"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                Entregados
                            </button>
                            <button
                                onClick={() => setOrdersStatus("all")}
                                className={`px-3 py-1.5 border text-sm rounded-r ${ordersStatus === "all"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                Todos
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">
                            Límite Pedidos
                        </label>
                        <input
                            type="number"
                            min={1}
                            className="w-28 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={ordersLimit}
                            onChange={(e) => setOrdersLimit(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Top N</label>
                        <input
                            type="number"
                            min={1}
                            className="w-28 px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                            value={topN}
                            onChange={(e) => setTopN(e.target.value)}
                        />
                    </div>
                    <div className="md:ml-auto">
                        <button
                            onClick={handleRefetchWithParams}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                        >
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Pedidos (tabla con items) */}
            <div className="border border-gray-200 rounded mb-6 overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-base font-semibold">
                        Pedidos {ordersStatus === "delivered" ? "entregadas" : "todas"} (mostrando {totalOrdersShown})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Total (USD)
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Método de envío
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    Items
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {user.orders?.length ? (
                                user.orders.map((o, idx) => (
                                    <tr
                                        key={o.id}
                                        className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-blue-gray-50/50"
                                            } align-top`}
                                    >
                                        <td className="px-4 py-3 text-sm underline text-blue-600"><Link to={`/dashboard/order/${o.id}`}>#{o.id}</Link></td>
                                        <td className="px-4 py-3 text-sm">{formatDateTime(o.date_issued)}</td>
                                        <td className="px-4 py-3 text-sm capitalize">{o.status}</td>
                                        <td className="px-4 py-3 text-sm">{currencyUSD(o.total_amount)}</td>
                                        <td className="px-4 py-3 text-sm">{o.shipping_type || "-"}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {o.items?.length ? (
                                                <span className="font-medium">
                                                    {o.items.reduce((acc, it) => acc + (it.quantity || 0), 0)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-6 text-center text-sm">
                                        No hay Pedidos para mostrar con los filtros actuales.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top productos */}
            <div className="border border-gray-200 rounded overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                    <h3 className="text-base font-semibold">Top productos (por cantidad)</h3>
                </div>
                <div className="p-4">
                    {user.top_products?.length ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {user.top_products.map((tp, i) => (
                                <div
                                    key={`${tp.product_id}-${i}`}
                                    className="border border-gray-200 rounded p-3"
                                >
                                    <div className="text-sm text-gray-500">Producto</div>
                                    <div className="font-semibold truncate">{tp.name}</div>
                                    <div className="mt-2 text-sm">
                                        <span className="text-gray-500">ID:</span>{" "}
                                        <span className="font-medium">{tp.product_id ?? "-"}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Cantidad:</span>{" "}
                                        <span className="font-medium">{tp.total_qty}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500">
                            No hay productos para el rango/estado seleccionado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
