import { Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Index from "./pages/dashboard/Index";
import Orders from "./pages/dashboard/order/Orders";
import OrderDetail from "./pages/dashboard/order/OrderDetail";
import ProductsDashboard from "./pages/dashboard/products/Index";
import Reporting from "./pages/dashboard/reporting";
import SalesDetail from "./pages/dashboard/reporting/SalesDetail";
import AdminUsers from "./pages/dashboard/users/Users";
import AdminUserDetail from "./pages/dashboard/users/AdminUserDetail";
import TravelList from "./pages/dashboard/shipping/TravelList";
import CutsListTravels from "./pages/dashboard/reporting/CutsListTravels";
import OrderCutsList from "./pages/dashboard/reporting/OrderCutsList";
import Settings from "./pages/dashboard/settings/Settings";
import Promotion from "./pages/dashboard/promotion/Promotion";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Index />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order/:order_id" element={<OrderDetail />} />
        <Route path="orders/order-cuts" element={<OrderCutsList />} />


        <Route path="products" element={<ProductsDashboard />} />

        <Route path="users" element={<AdminUsers />} />
        <Route path="user/:id" element={<AdminUserDetail />} />

        <Route path="shipping" element={<TravelList />} />
        <Route path="shipping/cuts" element={<CutsListTravels />} />

        <Route path="promotion" element={<Promotion />} />

        <Route path="settings" element={<Settings />} />


      </Route>
    </Routes>
  )
}

export default App
