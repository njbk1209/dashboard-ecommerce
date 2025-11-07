import { configureStore } from '@reduxjs/toolkit'
import userReducer from './features/user/userSlices'
import adminOrdersSlice from './features/order/orderSlices'
import productReducer from './features/product/productsSlices'
import promotionReducer from './features/promotion/promotionSlices'
import salesReportsReducer from './features/reporting/reportingSlices'
import shippingReducer from "./features/shipping/shippingSlices"
import exchangeReducer from "./features/exchange/exchangeSlices"
import controlReducer from "./features/control/controlSlices";

export const store = configureStore({
  reducer: {
    user: userReducer,
    order: adminOrdersSlice,
    product: productReducer,
    promotion: promotionReducer,
    salesReports: salesReportsReducer,
    shipping: shippingReducer,
    exchange: exchangeReducer,
    control: controlReducer,
  },
})