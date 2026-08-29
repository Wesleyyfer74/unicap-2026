import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import HomePage from '../pages/HomePage.jsx';
import LoginPage from '../pages/admin/LoginPage';
import ProtectedRoute from './ProtectedRoute';
import AdminOnly from './AdminOnly';
import RoleHomeRedirect from './RoleHomeRedirect';
import FiscaisPage from '../pages/admin/FiscaisPage';
import AlunosPage from '../pages/admin/AlunosPage';
import HistoricoPage from '../pages/admin/HistoricoPage';
import ChamadasPage from '../pages/admin/ChamadasPage';
import ChamadaDetailsPage from '../pages/admin/ChamadaDetailsPage';
import ViagemFormPage from '../pages/admin/ViagemFormPage';
import OcorrenciasPage from '../pages/admin/OcorrenciasPage';
import RelatoriosPage from '../pages/admin/RelatoriosPage';
const ChamadaScannerPage = lazy(() => import('../pages/admin/ChamadaScannerPage'));
export default function AppRoutes() {
  return <BrowserRouter><Routes><Route element={<PublicLayout />}><Route path="/" element={<HomePage />} /></Route><Route path="/admin/login" element={<LoginPage />} /><Route element={<ProtectedRoute />}><Route path="/admin" element={<AdminLayout />}><Route index element={<RoleHomeRedirect />} /><Route path="fiscais" element={<AdminOnly><FiscaisPage /></AdminOnly>} /><Route path="alunos" element={<AlunosPage />} /><Route path="chamadas" element={<ChamadasPage />} /><Route path="chamadas/:id" element={<ChamadaDetailsPage />} /><Route path="chamadas/:id/viagem" element={<ViagemFormPage />} /><Route path="chamadas/:id/scanner" element={<Suspense fallback={<main className="centered-page"><p>Carregando scanner...</p></main>}><ChamadaScannerPage /></Suspense>} /><Route path="ocorrencias" element={<OcorrenciasPage />} /><Route path="historico" element={<AdminOnly><HistoricoPage /></AdminOnly>} /><Route path="relatorios" element={<AdminOnly><RelatoriosPage /></AdminOnly>} /></Route></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
