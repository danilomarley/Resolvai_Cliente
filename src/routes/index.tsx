import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { DemoDashboard } from '../pages/Demo';
import { demoMode } from '../services/appMode';
import { DemoStateProvider } from '../components/DemoStateProvider';
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { Cadastro } from "../pages/Cadastro"; 

export function AppRoutes() {
  const demo = demoMode;
  const Router = demo ? HashRouter : BrowserRouter;
  const content = (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/" element={demo ? <DemoDashboard /> : <Dashboard />}>
          <Route path="pedidos" element={null} />
          <Route path="pedidos/:orderId" element={null} />
        </Route>
      </Routes>
    </Router>
  );
  return demo ? <DemoStateProvider>{content}</DemoStateProvider> : content;
}
