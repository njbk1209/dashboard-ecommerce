import { Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Index from "./pages/dashboard/Index";
import Orders from "./pages/dashboard/Orders";
import OrderDetail from "./pages/dashboard/OrderDetail";
import ProductsDashboard from "./pages/dashboard/products/Index";
import Reporting from "./pages/dashboard/reporting";
import SalesDetail from "./pages/dashboard/reporting/SalesDetail";
import AdminUsers from "./pages/dashboard/users/Users";
import AdminUserDetail from "./pages/dashboard/users/AdminUserDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Index />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order/:order_id" element={<OrderDetail />} />

        <Route path="products" element={<ProductsDashboard />} />

        <Route path="users" element={<AdminUsers />} />
        <Route path="user/:id" element={<AdminUserDetail />} />


        <Route path="reporting" element={<Reporting />} />
        <Route path="reporting/sales-detail/:id" element={<SalesDetail />} />
      </Route>
    </Routes>
  )
}

export default App
