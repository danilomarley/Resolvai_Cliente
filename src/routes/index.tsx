import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Cadastro } from "../pages/Cadastro";
import { NotFound } from "../pages/NotFound";

/** Rota antiga da avaliação: agora é um modal sobre o pedido. */
function ReviewRedirect() {
  const { orderId = "" } = useParams();
  return <Navigate to={`/pedidos/${orderId}?modal=avaliar&pedido=${orderId}`} replace />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        {/* Rota antiga: a finalização de cadastro agora é um modal sobre o dashboard. */}
        <Route path="/complemento-cadastro" element={<Navigate to="/?modal=finalizar-cadastro" replace />} />
        <Route path="/pedidos/:orderId/avaliar" element={<ReviewRedirect />} />
        <Route path="/" element={<Dashboard />}>
          <Route path="pedidos" element={null} />
          <Route path="pedidos/:orderId" element={null} />
          <Route path="pedidos/:orderId/propostas" element={null} />
          <Route path="pedidos/:orderId/acompanhar" element={null} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
