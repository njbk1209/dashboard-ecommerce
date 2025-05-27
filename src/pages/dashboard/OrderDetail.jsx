import React from 'react'

const OrderDetail = () => {
    return (
        <div className='text-gray-900 space-y-4'>
            <h1 className='text-2xl mb-2'>
                Pedido #001
            </h1>
            <div className='grid grid-cols-3 gap-3'>
                <div className='space-y-2'>
                    <h2 className='font-bold text-base'>General</h2>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Fecha de creación</h3>
                        <span className='text-gray-700 text-sm'>2025-05-23</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Estado del pedido</h3>
                        <span className='text-gray-700 text-sm'>Pago pendiente</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Cliente</h3>
                        <span className='text-gray-700 text-sm'>juan@example.com</span>
                    </div>
                </div>
                <div className='space-y-2'>
                    <h2 className='font-bold text-base'>Facturación</h2>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Dirección</h3>
                        <span className='text-gray-700 text-sm'>Francisco Javier Rodríguez Rodríguez
                            C/Médico Enrique González Mayböll,16
                            21400 Ayamonte
                            Huelva</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Razón social</h3>
                        <span className='text-gray-700 text-sm'>Juan Soto</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Identificación</h3>
                        <span className='text-gray-700 text-sm'>V-12458967</span>
                    </div>
                    <h2 className='font-bold text-base'>Pago</h2>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Método</h3>
                        <span className='text-gray-700 text-sm'>Pago móvil</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Referencia</h3>
                        <span className='text-gray-700 text-sm'>0002345658963</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Teléfono de origen</h3>
                        <span className='text-gray-700 text-sm'>04245305968</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Fecha</h3>
                        <span className='text-gray-700 text-sm'>2025-05-23</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Banco</h3>
                        <span className='text-gray-700 text-sm'>Banesco (0134)</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Comprobante</h3>
                        <span className='text-blue-800 text-sm underline cursor-pointer'>Ver comprobante</span>
                    </div>
                </div>
                <div className='space-y-2'>
                    <h2 className='font-bold text-base'>Envío</h2>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Dirección</h3>
                        <span className='text-gray-700 text-sm'>Francisco Javier Rodríguez Rodríguez
                            C/Médico Enrique González Mayböll,16
                            21400 Ayamonte
                            Huelva</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Comentarios adicionales</h3>
                        <span className='text-gray-700 text-sm'>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi deleniti voluptates quibusdam sit, eaque dolorum vel culpa exercitationem doloremque nulla laboriosam eveniet consequuntur tempore labore? Iure veritatis illo obcaecati harum?</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Teléfono de contacto</h3>
                        <span className='text-gray-700 text-sm'>0424-55564748</span>
                    </div>
                    <div>
                        <h3 className='text-gray-900 text-sm'>Teléfono de contacto alternativo</h3>
                        <span className='text-gray-700 text-sm'>0424-5645565</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderDetail