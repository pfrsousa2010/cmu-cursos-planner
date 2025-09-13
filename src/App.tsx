
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Calendario from "./pages/Calendario";
import Cursos from "./pages/Cursos";
import UnidadeSalas from "./pages/UnidadeSalas";
import Materias from "./pages/Materias";
import Insumos from "./pages/Insumos";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";

import ProtectedRoute from "./components/ProtectedRoute";
import MeuPerfil from "./pages/MeuPerfil";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserProvider>
            <Toaster />
            <BrowserRouter basename="/cmu-cursos-planner">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/calendario" element={
              <ProtectedRoute>
                <Calendario />
              </ProtectedRoute>
            } />
            <Route path="/cursos" element={
              <ProtectedRoute>
                <Cursos />
              </ProtectedRoute>
            } />
            <Route path="/unidades-salas" element={
              <ProtectedRoute>
                <UnidadeSalas />
              </ProtectedRoute>
            } />
            <Route path="/materias" element={
              <ProtectedRoute>
                <Materias />
              </ProtectedRoute>
            } />
            <Route path="/insumos" element={
              <ProtectedRoute>
                <Insumos />
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute>
                <Usuarios />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <Relatorios />
              </ProtectedRoute>
            } />

            <Route path="/meu-perfil" element={
              <ProtectedRoute>
                <MeuPerfil />
              </ProtectedRoute>
            } />
          </Routes>
            </BrowserRouter>
          </UserProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
