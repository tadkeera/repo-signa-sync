import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import DoctorSupportForm from "./pages/DoctorSupportForm";
import ConsignmentForm from "./pages/ConsignmentForm";
import ExtraBonusForm from "./pages/ExtraBonusForm";
import Reports from "./pages/Reports";
import ReportsIndex from "./pages/ReportsIndex";
import DataManagement from "./pages/DataManagement";
import ActivationPage, { isActivated } from "./pages/ActivationPage";
import SignaturePage from "./pages/SignaturePage";
import LoginPage from "./pages/LoginPage";
import UserManagement from "./pages/UserManagement";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";
import { useAutoBackup } from "@/hooks/useAutoBackup";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  useAutoBackup();

  // Role-based route protection
  const isRep = user?.role === 'representative';

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/doctor-support" element={<DoctorSupportForm />} />
        <Route path="/consignment" element={<ConsignmentForm />} />
        <Route path="/extra-bonus" element={<ExtraBonusForm />} />
        <Route path="/reports" element={<ReportsIndex />} />
        <Route path="/reports/:type" element={<Reports />} />
        <Route path="/signature" element={<SignaturePage />} />
        {!isRep && <Route path="/data-management" element={<DataManagement />} />}
        {!isRep && <Route path="/user-management" element={<UserManagement />} />}
        {!isRep && <Route path="/manager-dashboard" element={<ManagerDashboard />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const AuthenticatedApp = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

const App = () => {
  const [activated, setActivated] = useState(isActivated());

  if (!activated) {
    return <ActivationPage onActivated={() => setActivated(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
