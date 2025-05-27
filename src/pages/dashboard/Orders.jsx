import React from 'react'
import { Link } from 'react-router'
import { Select, Option } from "@material-tailwind/react";
import { Button } from "@material-tailwind/react"

const orders = [
    {
        id: '#1001',
        email: 'juan@example.com',
        status: 'Pago pendiente',
        statusColor: 'bg-yellow-100 text-yellow-800',
        fecha: '2025-05-25',
        total: '$120.00',
    },
    {
        id: '#1002',
        email: 'maria@example.com',
        status: 'Entregado',
        statusColor: 'bg-green-100 text-green-800',
        fecha: '2025-05-24',
        total: '$89.50',
    },
    {
        id: '#1003',
        email: 'ana@example.com',
        status: 'Cancelado',
        statusColor: 'bg-red-100 text-red-800',
        fecha: '2025-05-23',
        total: '$45.00',
    },
];

const Orders = () => {
    return (
        <div className='text-gray-900 space-y-4'>
            <h1 className='text-2xl mb-2'>
                Pedidos
            </h1>

            {/* Links de filtros */}
            <div className='flex flex-row flex-wrap gap-2 sm:gap-x-4 text-sm'>
                <Link className='text-gray-900 font-semibold'>Todos <span className='font-normal text-gray-800'>(24)</span></Link>
                <Link className='text-blue-600'>Pago pendiente <span className='font-normal text-gray-800'>(6)</span></Link>
                <Link className='text-blue-600'>Pago en revisión <span className='font-normal text-gray-800'>(3)</span></Link>
                <Link className='text-blue-600'>Pago aprobado <span className='font-normal text-gray-800'>(3)</span></Link>
                <Link className='text-blue-600'>Retiro en tienda <span className='font-normal text-gray-800'>(3)</span></Link>
                <Link className='text-blue-600'>Enviado <span className='font-normal text-gray-800'>(3)</span></Link>
                <Link className='text-blue-600'>Entregado <span className='font-normal text-gray-800'>(6)</span></Link>
                <Link className='text-blue-600'>Cancelado <span className='font-normal text-gray-800'>(4)</span></Link>
                <Link className='text-blue-600'>Reembolsado <span className='font-normal text-gray-800'>(0)</span></Link>
            </div>

            {/* Filtros por fecha y búsqueda */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                {/* Fecha desde/hasta */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col">
                        <label htmlFor="start-date" className="mb-1 text-sm text-gray-800">
                            Fecha desde
                        </label>
                        <input
                            type="date"
                            id="start-date"
                            name="start-date"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label htmlFor="end-date" className="mb-1 text-sm text-gray-800">
                            Fecha hasta
                        </label>
                        <input
                            type="date"
                            id="end-date"
                            name="end-date"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Buscar pedido */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex flex-col">
                        <label htmlFor="search-order" className="mb-1 text-sm text-gray-800">
                            Correo o número de orden
                        </label>
                        <input
                            type="text"
                            id="search-order"
                            name="search-order"
                            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <Button className='rounded bg-blue-800'>Buscar</Button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto mt-6 ">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300 ">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Creada</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Monto Total</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="px-4 py-2 text-sm text-gray-800">{order.id}</td>
                                <td className="px-4 py-2 text-sm text-gray-800">{order.email}</td>
                                <td className="px-4 py-2 text-sm">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${order.statusColor}`}
                                    >
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-800">{order.fecha}</td>
                                <td className="px-4 py-2 text-sm text-gray-800">{order.total}</td>
                                <td className="px-4 py-2 text-sm text-blue-600 ">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 cursor-pointer">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Orders;
