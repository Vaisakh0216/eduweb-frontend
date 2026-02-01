import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import BranchesPage from './pages/BranchesPage';
import CollegesPage from './pages/CollegesPage';
import CoursesPage from './pages/CoursesPage';
import AgentsPage from './pages/AgentsPage';
import AgentDetailsPage from './pages/AgentDetailsPage';
import AdmissionsPage from './pages/AdmissionsPage';
import AdmissionDetailsPage from './pages/AdmissionDetailsPage';
import AdmissionFormPage from './pages/AdmissionFormPage';
import PaymentsPage from './pages/PaymentsPage';
import AgentPaymentsPage from './pages/AgentPaymentsPage';
import DaybookPage from './pages/DaybookPage';
import CashbookPage from './pages/CashbookPage';
import VouchersPage from './pages/VouchersPage';
import VoucherPrintPage from './pages/VoucherPrintPage';
import Loading from './components/common/Loading';

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Users - Admin only */}
        <Route path="/users" element={<UsersPage />} />
        
        {/* Branches - Super Admin only */}
        <Route path="/branches" element={<BranchesPage />} />
        
        {/* Colleges & Courses */}
        <Route path="/colleges" element={<CollegesPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        
        {/* Agents */}
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentDetailsPage />} />
        
        {/* Admissions */}
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/admissions/new" element={<AdmissionFormPage />} />
        <Route path="/admissions/:id" element={<AdmissionDetailsPage />} />
        <Route path="/admissions/:id/edit" element={<AdmissionFormPage />} />
        
        {/* Payments */}
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/agent-payments" element={<AgentPaymentsPage />} />
        
        {/* Daybook & Cashbook */}
        <Route path="/daybook" element={<DaybookPage />} />
        <Route path="/cashbook" element={<CashbookPage />} />
        
        {/* Vouchers */}
        <Route path="/vouchers" element={<VouchersPage />} />
      </Route>
      
      {/* Voucher Print - Separate layout */}
      <Route path="/vouchers/:id/print" element={
        <ProtectedRoute>
          <VoucherPrintPage />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
