import { configureStore } from '@reduxjs/toolkit'
import userReducer from './features/user/userSlices'
import adminOrdersSlice from './features/order/orderSlices'
import productReducer from './features/product/productsSlices'
import salesReportsReducer from './features/reporting/reportingSlices'

export const store = configureStore({
  reducer: {
    user: userReducer,
    order: adminOrdersSlice,
    product: productReducer,
    salesReports: salesReportsReducer
  },
})