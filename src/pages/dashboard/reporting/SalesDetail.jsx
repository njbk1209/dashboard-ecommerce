import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useLocation } from "react-router";
import { fetchSalesReportDetail } from "../../../redux/features/reporting/reportingSlices";
import {
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";

function Icon({ id, open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={`${
        id === open ? "rotate-180" : ""
      } h-5 w-5 transition-transform`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}

const SalesDetail = () => {
  const dispatch = useDispatch();
  const { id } = useParams(); // del path: /sales-detail/:id
  const { search } = useLocation(); // ?date=2025-07-05
  const query = new URLSearchParams(search);
  const date = query.get("date"); // "2025-07-05"

  const { reportDetail } = useSelector((state) => state.salesReports);

  const [open, setOpen] = useState(null);

  const handleOpen = (value) => {
    setOpen((prev) => (prev === value ? null : value));
  };

  useEffect(() => {
    dispatch(fetchSalesReportDetail({ id, date }));
  }, [dispatch]);

  const totalBs = (
    parseFloat(reportDetail?.total_amount) *
    parseFloat(reportDetail?.exchange_rate.rate)
  ).toFixed(2);

  return (
    <div className="text-gray-900 space-y-4">
      <h1 className="text-2xl mb-2">Ventas del día</h1>
      <div className="grid grid-cols-4 gap-8">
        {/* PANEL IZQUIERDO */}
        <aside className="col-span-1">
          <h2 className="font-bold text-base">Resumen general de ventas</h2>
          <dl className="mt-4 space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Subtotal</dt>
              <dd className="text-sm font-medium text-gray-900">
                ${reportDetail?.sub_total_amount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">IVA</dt>
              <dd className="text-sm font-medium text-gray-900">
                ${reportDetail?.iva}
              </dd>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <dt className="text-base font-medium text-gray-900">
                Total en dólares
              </dt>
              <dd className="text-base font-medium text-gray-900">
                ${reportDetail?.total_amount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base font-medium text-gray-900">
                Total envíos
              </dt>
              <dd className="text-base font-medium text-gray-900">
                ${reportDetail?.total_shipping_amount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base font-medium text-gray-900">
                Tasa de cambio
              </dt>
              <dd className="text-base font-medium text-gray-900">
                {reportDetail?.exchange_rate.rate} Bs
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base font-medium text-gray-900">
                Total en bolívares
              </dt>
              <dd className="text-base font-medium text-gray-900">
                {totalBs} Bs
              </dd>
            </div>
          </dl>
        </aside>

        {/* PANEL DERECHO */}
        <section className="col-span-3">
          <h2 className="font-bold text-base mb-2">Resumen de pedidos</h2>
          {reportDetail?.orders.map((order, idx) => (
            <Accordion
              className="mb-0"
              key={order.id} // 👈 importante para evitar errores de React
              open={open === idx}
              icon={<Icon id={idx} open={open} />}
            >
              <AccordionHeader
                className="font-medium text-base text-gray-800"
                onClick={() => handleOpen(idx)}
              >
                <span>
                  Resumen del pedido #{order.id.toString().padStart(3, "0")}
                </span>
              </AccordionHeader>
              <AccordionBody className="font-normal">
                <h3 className="text-sm text-gray-900">Correo</h3>
                <p className="text-sm text-gray-700 mb-1">{order.user}</p>
                <h3 className="text-sm text-gray-900">Razón social</h3>
                <p className="text-sm text-gray-700 mb-1">
                  {order.first_name} {order.last_name}
                </p>
                <h3 className="text-sm text-gray-900">Identificación</h3>
                <p className="text-sm text-gray-700 mb-1">
                  {order.identification_type}-{order.identification}
                </p>
                <h3 className="text-sm text-gray-900">Teléfono de contacto</h3>
                <p className="text-sm text-gray-700 mb-4">
                  {order.phone_number}
                </p>
                <div className="w-full py-6 border-y border-gray-200">
                  <ul className="flex flex-col space-y-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {item.name}
                            <span className="text-[15px] ml-2 font-bold">
                              x{item.quantity}
                            </span>
                          </h4>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${parseFloat(item.total_price).toFixed(2)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <dl className="mt-4 space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${order.sub_total_amount}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Envío</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${order.shipping_cost}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">IVA</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      ${order.iva}
                    </dd>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <dt className="text-base font-medium text-gray-900">
                      Total en dólares
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      ${order.total_amount}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-base font-medium text-gray-900">
                      Tasa de cambio
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      {order.rate} Bs
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-base font-medium text-gray-900">
                      Total en bolívares
                    </dt>
                    <dd className="text-base font-medium text-gray-900">
                      {parseFloat(order.total_amount_bs).toFixed(2)} Bs
                    </dd>
                  </div>
                </dl>
              </AccordionBody>
            </Accordion>
          ))}
        </section>
      </div>
    </div>
  );
};

export default SalesDetail;
