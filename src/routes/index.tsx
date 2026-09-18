import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Rota principal apontando para o Dashboard */}
        <Route path="/" element={<Dashboard />} /> 
      </Routes>
    </BrowserRouter>
  );
}