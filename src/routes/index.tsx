import { BrowserRouter, HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { DemoDashboard } from '../pages/Demo';
import { demoMode } from '../services/appMode';
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Cadastro } from "../pages/Cadastro"; 

export function AppRoutes() {
  const demo = demoMode;
  const Router = demo ? HashRouter : BrowserRouter;
  return (
    <Router>
      <Routes>
        <Route path="/login" element={demo ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/cadastro" element={demo ? <Navigate to="/" replace /> : <Cadastro />} />
        <Route path="/" element={demo ? <DemoDashboard /> : <Dashboard />}>
          <Route path="pedidos" element={null} />
          <Route path="pedidos/:orderId" element={null} />
        </Route>
      </Routes>
    </Router>
  );
}
