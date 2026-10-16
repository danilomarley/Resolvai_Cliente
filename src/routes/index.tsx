import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Cadastro } from "../pages/Cadastro";
import { CompleteRegistration } from "../pages/CompleteRegistration";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/complemento-cadastro" element={<CompleteRegistration />} />
        <Route path="/" element={<Dashboard />}>
          <Route path="pedidos" element={null} />
          <Route path="pedidos/:orderId" element={null} />
          <Route path="pedidos/:orderId/propostas" element={null} />
          <Route path="pedidos/:orderId/acompanhar" element={null} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
