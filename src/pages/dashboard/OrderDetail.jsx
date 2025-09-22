import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderById,
  updateOrderStatus,
  updateOrderItems,
} from "../../redux/features/order/orderSlices";
import { useParams } from "react-router";
import { fetchSearchProducts } from "../../redux/features/product/productsSlices";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Spinner } from "@material-tailwind/react";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

// Lista de estados disponibles
const ORDER_STATUSES = [
  { value: "not_processed", label: "Pago pendiente" },
  { value: "payment_review", label: "Pago en revisión" },
  { value: "shipping", label: "Pago aprobado, envío en proceso" },
  { value: "pickup", label: "En espera de retiro" },
  { value: "delivered", label: "Finalizó con éxito" },
  { value: "cancelled", label: "Pedido cancelado" },
];

// Reglas de transición
const TRANSITION_RULES = {
  not_processed: ["delivered", "cancelled", "shipping", "pickup"],
  payment_review: ["not_processed", "shipping", "pickup", "cancelled"],
  shipping: ["delivered", "pickup", "cancelled"],
  pickup: ["delivered", "shipping", "cancelled"],
  delivered: [], // No se puede cambiar
};

// Esquema de validación Yup
const StatusSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(
      ORDER_STATUSES.map((s) => s.value),
      "Estado inválido"
    )
    .required("El estado es obligatorio"),
});

const MAX_QTY = 36; // Alineado con el backend

const OrderDetail = () => {
  const { order_id } = useParams();
  const dispatch = useDispatch();

  const { order, orderStatus, orderNotes } = useSelector((state) => state.order);
  // Nota: usa el mismo slice que tu SearchBar (state.products)
  const { searchProducts, searchProductsStatus, error } = useSelector(
    (state) => state.product
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Items locales del modal (edición en memoria)
  const [items, setItems] = useState([]);

  // Buscador con debounce (mismo patrón que SearchBar)
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const minChars = 3;
  const delay = 300;

  const canSearch = useMemo(() => value.trim().length >= minChars, [value]);
  const hasResults = Array.isArray(searchProducts) && searchProducts.length > 0;
  const closeSearchPanel = () => setOpen(false);

  useEffect(() => {
    dispatch(fetchOrderById(order_id));
  }, [dispatch, order_id]);

  useEffect(() => {
    // Sincroniza items locales al cargar/refrescar la orden
    if (order?.items) setItems(order.items.map((i) => ({ ...i })));
  }, [order]);

  const canEditOrder = () => order?.status === "not_processed";

  const openModal = () => {
    if (!canEditOrder()) {
      toast.error("Esta orden no puede ser editada");
      return;
    }
    setItems(order?.items ? order.items.map((i) => ({ ...i })) : []);
    setIsModalOpen(true);
  };

  // Debounce de la búsqueda
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!canSearch) {
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      dispatch(fetchSearchProducts(value.trim()));
      setOpen(true);
    }, delay);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, canSearch, delay, dispatch]);

  // --- Handlers de edición local ---
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity > MAX_QTY) return toast.error(`La cantidad máxima por producto es ${MAX_QTY}`);
    if (newQuantity < 1) return toast.error("La cantidad mínima por producto es 1");
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, quantity: newQuantity } : it)));
  };

  const removeItemLocal = (itemId) => {
    if (items.length <= 1) return toast.error("No se puede eliminar el único item de la orden");
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Añadir producto (invoca backend; el endpoint suma si ya existe)
  const addProductToOrder = async (productId) => {
    try {
      await dispatch(
        updateOrderItems({
          orderId: order.id,
          action: "add",
          product_id: productId,
          quantity: 1,
        })
      ).unwrap();

      await dispatch(fetchOrderById(order.id)); // refresca totales/ítems
      setValue("");
      closeSearchPanel();
      toast.success("Producto añadido");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Error al añadir producto");
    }
  };

  // Guardar cambios (aplica diffs: remove + edit)
  const saveChanges = async () => {
    if (!canEditOrder()) return toast.error("Esta orden no puede ser editada");

    const original = order?.items || [];
    const current = items;

    const removed = original.filter((o) => !current.some((c) => c.id === o.id));
    const modified = current.filter((c) => {
      const o = original.find((oo) => oo.id === c.id);
      return o && o.quantity !== c.quantity;
    });

    try {
      for (const it of removed) {
        await dispatch(
          updateOrderItems({
            orderId: order.id,
            action: "remove",
            item_id: it.id,
          })
        ).unwrap();
      }

      for (const it of modified) {
        await dispatch(
          updateOrderItems({
            orderId: order.id,
            action: "edit",
            item_id: it.id,
            quantity: it.quantity,
          })
        ).unwrap();
      }

      await dispatch(fetchOrderById(order.id));
      toast.success("Items actualizados");
      setIsModalOpen(false);
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Error al actualizar items");
    }
  };

  if (orderStatus === "loading" || !order) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spinner className="h-10 w-10 mb-4 mx-auto" color="blue" />
          <p className="text-gray-600 text-sm">Cargando orden...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-gray-900 space-y-4">
        <h1 className="text-2xl mb-2">Pedido #{order?.id}</h1>
        <div className="grid grid-cols-4 gap-8">
          <aside className="col-span-1">
            {order?.status && (
              <div>
                <h3 className="font-bold text-base mb-2">Actualizar estado de la orden</h3>
                <Formik
                  initialValues={{ status: "" }}
                  enableReinitialize
                  validationSchema={Yup.object().shape({
                    status: Yup.string()
                      .required("El estado es obligatorio")
                      .oneOf(TRANSITION_RULES[order.status] || [], "Transición de estado no permitida"),
                  })}
                  onSubmit={async (values, { setSubmitting, resetForm }) => {
                    try {
                      await dispatch(
                        updateOrderStatus({
                          orderId: order.id,
                          status: values.status,
                        })
                      ).unwrap();
                      await dispatch(fetchOrderById(order.id));
                      toast.success("Estado actualizado correctamente");
                      resetForm();
                    } catch (error) {
                      toast.error(`Error al actualizar estado: ${error}`);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ isSubmitting }) => {
                    const allowedStatuses = TRANSITION_RULES[order.status] || [];
                    if (allowedStatuses.length === 0) {
                      return (
                        <p className="text-sm text-gray-600">
                          Esta orden ya fue finalizada. No se puede cambiar el estado.
                        </p>
                      );
                    }
                    return (
                      <Form className="space-y-4">
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Nuevo estado
                          </label>
                          <Field
                            as="select"
                            name="status"
                            className="mt-1 block w-full py-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="">Seleccione un estado</option>
                            {ORDER_STATUSES.filter((s) => allowedStatuses.includes(s.value)).map((s) => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </Field>
                          <ErrorMessage name="status" component="div" className="text-sm text-red-600 mt-1" />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
                        >
                          {isSubmitting ? "Actualizando..." : "Actualizar estado"}
                        </button>
                      </Form>
                    );
                  }}
                </Formik>
              </div>
            )}

            {orderNotes && orderNotes.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold text-base mb-2">Notas de la orden</h4>
                <ul className="space-y-3">
                  {orderNotes.map((note) => (
                    <li key={note.id} className="border border-gray-200 p-3 bg-gray-100">
                      <p className="text-sm text-gray-800 font-medium">{note.note}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.date_issued).toLocaleString("es-VE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <div className="col-span-3">
            <div className="grid grid-cols-3 gap-5">
              <div className="space-y-2">
                <h2 className="font-bold text-base">General</h2>
                <div>
                  <h3 className="text-gray-900 text-sm">Estado del pedido</h3>
                  <span className="text-gray-700 text-sm">{order?.status_display}</span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Fecha de creación</h3>
                  <span className="text-gray-700 text-sm">
                    {new Date(order?.date_issued).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Cliente</h3>
                  <span className="text-gray-700 text-sm">{order?.user} </span>
                </div>
                <h2 className="font-bold text-base">Facturación</h2>
                <div>
                  <h3 className="text-gray-900 text-sm">Razón social</h3>
                  <span className="text-gray-700 text-sm">
                    {order?.first_name} {order?.last_name}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Identificación</h3>
                  <span className="text-gray-700 text-sm">
                    {order?.identification_type}-{order?.identification}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Dirección</h3>
                  <span className="text-gray-700 text-sm">{order?.address_line}</span>
                  <p className="text-gray-700 text-sm">
                    {order?.state_province} - {order?.city}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-bold text-base">Pago</h2>
                <div>
                  <h3 className="text-gray-900 text-sm">Referencia</h3>
                  <span className="text-gray-700 text-sm">
                    {order?.payment_proofs[0]?.reference || "No disponible"}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Fecha de pago</h3>
                  <span className="text-gray-700 text-sm">
                    {order?.payment_proofs[0]?.uploaded_at
                      ? new Date(order?.payment_proofs[0]?.uploaded_at).toLocaleDateString("es-ES")
                      : "No disponible"}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Comprobante</h3>
                  {order?.payment_proofs[0]?.proof_file ? (
                    <a
                      href={order?.payment_proofs[0]?.proof_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-800 text-sm underline cursor-pointer"
                    >
                      Ver comprobante
                    </a>
                  ) : (
                    <span className="text-gray-700 text-sm">No disponible</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-bold text-base">Envío</h2>
                <div>
                  <h3 className="text-gray-900 text-sm">Tipo de envío</h3>
                  <span className="text-gray-700 text-sm">{order?.shipping_type}</span>
                  <span className="block text-gray-900 text-sm">
                    {order?.shipping_total_bs} Bs.{" "}
                    <span className="inline text-xs text-gray-700"> IVA. Inc</span>
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Coordenadas</h3>
                  <span className="text-gray-700 text-sm">
                    {order?.latitude || ""} {order?.longitude || ""}
                  </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Teléfono de contacto</h3>
                  <span className="text-gray-700 text-sm">{order?.phone_number} </span>
                </div>
                <div>
                  <h3 className="text-gray-900 text-sm">Teléfono alternativo</h3>
                  <span className="text-gray-700 text-sm">{order?.alt_phone_number || "No definido"} </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-5 ">
                <h2 className="text-lg font-bold text-gray-900">Resumen de la orden</h2>
                {order?.status === "not_processed" && (
                  <button
                    onClick={openModal}
                    className="bg-amber-600 rounded px-2 py-1.5 hover:bg-amber-700 font-medium text-sm text-white"
                  >
                    Editar productos
                  </button>
                )}
              </div>

              <div className="flex justify-between border-b pb-2">
                <p className="text-[13px] font-semibold text-qblack uppercase">Producto</p>
                <p className="text-[13px] font-semibold text-qblack uppercase">Total</p>
              </div>

              <div className="w-full py-6 border-b border-gray-200">
                <ul className="flex flex-col justify-between space-y-3">
                  {order?.items?.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm text-gray-900 font-medium">
                          {item.name}
                          <span className="text-[15px] ml-2 font-bold">x{item.quantity}</span>
                        </h4>
                      </div>
                      <p className="text-sm text-gray-900 font-medium">${item.total_price}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">Subtotal</dt>
                  <dd className="text-sm font-medium text-gray-900">${order?.sub_total_amount}</dd>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <dt className="flex text-sm text-gray-600">
                    <span>Envío</span>
                    <QuestionMarkCircleIcon className="h-5 w-5 ml-2 text-gray-400" />
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">${order?.shipping_total || "0.00"}</dd>
                </div>
                <div className="pt-4 mb-4 flex items-center justify-between">
                  <dt className="flex text-sm text-gray-600">
                    <span>IVA</span>
                    <QuestionMarkCircleIcon className="h-5 w-5 ml-2 text-gray-400" />
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">${order?.iva}</dd>
                </div>
                <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">Total en dólares</dt>
                  <dd className="text-base font-medium text-gray-900">${order?.total_amount}</dd>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">Tasa de cambio</dt>
                  <dd className="text-base font-medium text-gray-900">{order?.rate} Bs</dd>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <dt className="text-base font-medium text-gray-900">Total en bolívares</dt>
                  <dd className="text-base font-medium text-gray-900">{order?.total_amount_bs} Bs</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para editar productos */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full transform transition-all sm:my-8 sm:align-middle sm:w-full sm:max-w-4xl ">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-900">Editar productos de la orden</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => {
                  setIsModalOpen(false);
                  closeSearchPanel();
                }}
              >
                <span className="sr-only">Cerrar modal</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            {/* Buscador con debounce */}
            <div className="bg-white pb-6">
              <h2 className="mb-3 text-lg font-bold text-gray-900">Añadir Productos</h2>

              <div className="relative">
                {/* Input */}
                <div className="relative border border-gray-300 rounded w-full sm:w-[600px]">
                  <input
                    type="search"
                    className="block w-full p-3 ps-6 pr-10 font-medium text-gray-900 placeholder-gray-500 rounded text-sm outline-none"
                    placeholder="Harina de trigo todo uso..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => {
                      if (canSearch) setOpen(true);
                    }}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                  />
                  <div className="absolute inset-y-0 end-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="none">
                      <path
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Backdrop para cerrar con click afuera */}
                {open && (
                  <button
                    type="button"
                    className="fixed inset-0 z-40 bg-black/0 cursor-default"
                    onClick={closeSearchPanel}
                    aria-label="Cerrar resultados de búsqueda"
                  />
                )}

                {/* Panel flotante */}
                {open && (
                  <div
                    className="absolute z-50 top-full left-0 right-0 mt-2 rounded border border-gray-200 bg-white"
                    role="listbox"
                  >
                    {/* Estados */}
                    {value && !canSearch && (
                      <div className="p-3 text-xs text-gray-500">
                        Escribe al menos {minChars} caracteres para buscar.
                      </div>
                    )}

                    {canSearch && searchProductsStatus === "loading" && (
                      <div className="p-3 text-sm text-gray-500">Buscando…</div>
                    )}

                    {canSearch && searchProductsStatus === "failed" && (
                      <div className="p-3 text-sm text-red-600">
                        {typeof error === "string" ? error : "Ocurrió un error en la búsqueda"}
                      </div>
                    )}

                    {/* Resultados */}
                    {canSearch &&
                      searchProductsStatus === "succeeded" &&
                      (hasResults ? (
                        <ul className="max-h-80 overflow-auto divide-y">
                          {searchProducts.map((product) => (
                            <li
                              key={product.id}
                              className="flex items-center gap-4 p-3 hover:bg-gray-100 transition cursor-pointer"
                              onClick={() => addProductToOrder(product.id)}
                            >
                              <img
                                src={product.thumbnails}
                                alt={product.product_name}
                                className="h-12 w-12 object-cover rounded-md"
                              />
                              <div className="flex-1">
                                <p className="text-gray-900 text-sm font-semibold mb-[-5px]">
                                  {product.product_name}
                                </p>
                                {product.stock > 0 ? (
                                  <p className="inline text-xs text-green-600">¡Disponible!</p>
                                ) : (
                                  <p className="inline text-xs text-red-600">Agotado</p>
                                )}
                                <div className="space-x-2 mt-[-5px]">
                                  <p className="inline text-sm font-medium text-gray-900">
                                    {product.regular_price}$
                                  </p>
                                  {product.compare_price !== null && (
                                    <p className="inline text-xs text-gray-600 line-through">
                                      {product.compare_price}$
                                    </p>
                                  )}
                                  <p className="inline text-xs text-gray-600 ">{product.iva_status}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-3 text-sm text-gray-500">Sin resultados.</div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lista editable (usa items locales) */}
            <div className="mt-4">
              <div className="flex justify-between border-b pb-2">
                <p className="text-sm font-semibold text-gray-900 uppercase w-1/2">Producto</p>
                <p className="text-sm font-semibold text-gray-900 uppercase w-1/6 text-center">Precio</p>
                <p className="text-sm font-semibold text-gray-900 uppercase w-1/6 text-center">Cantidad</p>
                <p className="text-sm font-semibold text-gray-900 uppercase w-1/6 text-center">Total</p>
                <p className="text-sm font-semibold text-gray-900 uppercase w-1/12"></p>
              </div>

              <div className="w-full py-6 border-b border-gray-200">
                <ul className="flex flex-col justify-between space-y-6">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center">
                      <div className="w-1/2">
                        <h4 className="text-sm text-gray-900 font-medium">{item.name}</h4>
                      </div>
                      <div className="w-1/6 text-center">
                        <p className="text-sm text-gray-900">{Number(item.price).toFixed(2)} $</p>
                      </div>
                      <div className="w-1/6 flex justify-center items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="w-1/6 text-center">
                        <p className="text-sm text-gray-900 font-medium">
                          {(Number(item.price) * item.quantity).toFixed(2)} $
                        </p>
                      </div>
                      <div className="w-1/12 flex justify-end">
                        <button
                          onClick={() => removeItemLocal(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                          disabled={items.length <= 1}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                onClick={saveChanges}
                className="inline-flex justify-center rounded-md border border-green-300 shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
              >
                Guardar Cambios
              </button>

              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                onClick={() => {
                  setIsModalOpen(false);
                  closeSearchPanel();
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetail;
