import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchOrderById,
  updateOrderStatus,
} from "../../redux/features/order/orderSlices";
import { Link, useParams } from "react-router";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import {
  fetchPaymentProofById,
  clearPaymentProof,
  fetchOrderNotes,
} from "../../redux/features/order/orderSlices";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { Spinner } from "@material-tailwind/react";

// Lista de estados disponibles
const ORDER_STATUSES = [
  { value: "not_processed", label: "Pago pendiente" },
  { value: "payment_review", label: "Pago en revisión" },
  { value: "shipping", label: "Pago aprobado, envío en proceso" },
  { value: "pickup", label: "En espera de retiro" },
  { value: "delivered", label: "Finalizó con éxito" },
  { value: "cancelled", label: "Pedido cancelado" },
];

//Reglas de transición
const TRANSITION_RULES = {
  not_processed: ["delivered", "cancelled", "shipping", "pickup"],
  payment_review: ["not_processed", "shipping", "pickup", "cancelled"],
  shipping: ["delivered", "cancelled"],
  pickup: ["delivered", "cancelled"],
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

const OrderDetail = () => {
  const { order_id } = useParams();
  const dispatch = useDispatch();
  const { order, orderStatus } = useSelector((state) => state.order);
  const { paymentProof } = useSelector((state) => state.order);
  const { orderNotes } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(clearPaymentProof());
    dispatch(fetchOrderById(order_id));
    dispatch(fetchPaymentProofById(order_id));
    dispatch(fetchOrderNotes(order_id));
  }, [dispatch, order_id]);

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
    <div className="text-gray-900 space-y-4">
      <h1 className="text-2xl mb-2">Pedido #{order?.id}</h1>
      <div className="grid grid-cols-4 gap-8">
        <aside className="col-span-1">
          {order?.status && (
            <div>
              <h3 className="font-bold text-base mb-2">
                Actualizar estado de la orden
              </h3>
              <Formik
                initialValues={{ status: "" }}
                enableReinitialize
                validationSchema={Yup.object().shape({
                  status: Yup.string()
                    .required("El estado es obligatorio")
                    .oneOf(
                      TRANSITION_RULES[order.status] || [],
                      "Transición de estado no permitida"
                    ),
                })}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                  try {
                    await dispatch(
                      updateOrderStatus({
                        orderId: order.id,
                        status: values.status,
                      })
                    ).unwrap();
                    await dispatch(fetchOrderById(order.id)); // Refresca la orden con el nuevo estado
                    toast.success("Estado actualizado correctamente");
                    resetForm(); // Opcional: limpia el select
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
                        Esta orden ya fue finalizada. No se puede cambiar el
                        estado.
                      </p>
                    );
                  }

                  return (
                    <Form className="space-y-4">
                      <div>
                        <label
                          htmlFor="status"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nuevo estado
                        </label>
                        <Field
                          as="select"
                          name="status"
                          className="mt-1 block w-full py-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Seleccione un estado</option>
                          {ORDER_STATUSES.filter((s) =>
                            allowedStatuses.includes(s.value)
                          ).map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage
                          name="status"
                          component="div"
                          className="text-sm text-red-600 mt-1"
                        />
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
                  <li
                    key={note.id}
                    className="border border-gray-200 p-3 bg-gray-100"
                  >
                    <p className="text-sm text-gray-800 font-medium">
                      {note.note}
                    </p>
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
                <h3 className="text-gray-900 text-sm">Fecha de creación</h3>
                <span className="text-gray-700 text-sm">
                  {new Date(order?.date_issued).toLocaleDateString("es-ES")}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">Estado del pedido</h3>
                <span className="text-gray-700 text-sm">
                  {order?.status_display}
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
                <span className="text-gray-700 text-sm">
                  {order?.address_line}
                </span>
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
                  {paymentProof?.reference || "No disponible"}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">Teléfono de origen</h3>
                <span className="text-gray-700 text-sm">
                  {paymentProof?.phone_number || "No disponible"}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">Fecha</h3>
                <span className="text-gray-700 text-sm">
                  {paymentProof?.date_issued
                    ? new Date(paymentProof.date_issued).toLocaleDateString(
                        "es-ES"
                      )
                    : "No disponible"}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">Banco</h3>
                <span className="text-gray-700 text-sm">
                  {paymentProof?.bank_code || "No disponible"}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">Comprobante</h3>
                {paymentProof?.image_proof ? (
                  <a
                    href={paymentProof.image_proof}
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
                <span className="text-gray-700 text-sm">
                  {order?.shipping_type}
                </span>

                <span className="block text-gray-900 text-sm">
                  {order?.shipping_total_bs} Bs. <span className="inline text-xs text-gray-700"> IVA. Inc</span>
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
                <span className="text-gray-700 text-sm">
                  {order?.phone_number}{" "}
                </span>
              </div>
              <div>
                <h3 className="text-gray-900 text-sm">
                  Teléfono de contacto alternativo
                </h3>
                <span className="text-gray-700 text-sm">
                  {order?.alt_phone_number || "No definido"}{" "}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Resumen de la orden
            </h2>

            <div className="flex justify-between border-b pb-2">
              <p className="text-[13px] font-semibold text-qblack uppercase">
                Producto
              </p>
              <p className="text-[13px] font-semibold text-qblack uppercase">
                Total
              </p>
            </div>

            <div className="w-full py-6 border-b border-gray-200">
              <ul className="flex flex-col justify-between space-y-3">
                {order?.items?.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm text-gray-900 font-medium">
                        {item.name}
                        <span className="text-[15px] ml-2 font-bold">
                          x{item.quantity}
                        </span>
                      </h4>
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      ${item.total_price}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="mt-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">
                  ${order?.sub_total_amount}
                </dd>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <dt className="flex text-sm text-gray-600">
                  <span>Envío</span>
                  <QuestionMarkCircleIcon className="h-5 w-5 ml-2 text-gray-400" />
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  ${order?.shipping_cost}
                </dd>
              </div>
              <div className="pt-4 mb-4 flex items-center justify-between">
                <dt className="flex text-sm text-gray-600">
                  <span>IVA</span>
                  <QuestionMarkCircleIcon className="h-5 w-5 ml-2 text-gray-400" />
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  ${order?.iva}
                </dd>
              </div>
              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">
                  Total en dólares
                </dt>
                <dd className="text-base font-medium text-gray-900">
                  ${order?.total_amount}
                </dd>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">
                  Tasa de cambio
                </dt>
                <dd className="text-base font-medium text-gray-900">
                  {order?.rate} Bs
                </dd>
              </div>
              <div className="pt-4 flex items-center justify-between">
                <dt className="text-base font-medium text-gray-900">
                  Total en bolívares
                </dt>
                <dd className="text-base font-medium text-gray-900">
                  {order?.total_amount_bs} Bs
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
