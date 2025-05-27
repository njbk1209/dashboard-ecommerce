import { Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Index from "./pages/dashboard/Index";
import Orders from "./pages/dashboard/Orders";
import OrderDetail from "./pages/dashboard/OrderDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Index />} />
        <Route path="orders" element={<Orders />} />
        <Route path="order/:id" element={<OrderDetail />} />
      </Route>
    </Routes>
  )
}

export default App
