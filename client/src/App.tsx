// @ts-nocheck
import React, { Suspense, lazy } from 'react';
import { RouteTracker } from '@/lib/navHistory';
import { SessionManager } from '@/components/session/SessionManager';
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';
import { ThemeApplier } from '@/components/layout/ThemeToggle';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectForm = lazy(() => import('./pages/ProjectForm').then((m) => ({ default: m.ProjectForm })));
const Chat = lazy(() => import('./pages/Chat').then((m) => ({ default: m.Chat })));
const DPRGeneration = lazy(() => import('./pages/DPRGeneration').then((m) => ({ default: m.DPRGeneration })));
const AIGuidedDPRBuilder = lazy(() => import('./pages/AIGuidedDPRBuilder').then((m) => ({ default: m.AIGuidedDPRBuilder })));
const DPRPreview = lazy(() => import('./pages/DPRPreview').then((m) => ({ default: m.DPRPreview })));
const AllDPRs = lazy(() => import('./pages/AllDPRs').then((m) => ({ default: m.AllDPRs })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminDocuments = lazy(() => import('./pages/AdminDocuments').then((m) => ({ default: m.AdminDocuments })));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite').then((m) => ({ default: m.AcceptInvite })));
const DistrictReview = lazy(() => import('./pages/DistrictReview').then((m) => ({ default: m.DistrictReview })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const ClusterDPRCreation = lazy(() => import('./pages/ClusterDPRCreation').then((m) => ({ default: m.ClusterDPRCreation })));
const IndividualDPRCreation = lazy(() => import('./pages/IndividualDPRCreation').then((m) => ({ default: m.IndividualDPRCreation })));
const ReportGuide = lazy(() => import('./pages/ReportGuide').then((m) => ({ default: m.ReportGuide })));
const VentureMatch = lazy(() => import('./pages/VentureMatch').then((m) => ({ default: m.VentureMatch })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const AccountPrivacy = lazy(() => import('./pages/AccountPrivacy').then((m) => ({ default: m.AccountPrivacy })));
import './i18n/config';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ConfirmProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'hsl(217, 91%, 40%)',
            color: '#fff',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            fontWeight: '500',
          },
          success: {
            style: {
              background: 'hsl(142, 76%, 36%)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: 'hsl(142, 76%, 36%)',
            },
          },
          error: {
            style: {
              background: '#dc2626',
              color: '#ffffff',
              border: '1px solid #991b1b',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#dc2626',
            },
          },
        }}
      />
      <RouteTracker />
      <SessionManager />
      <ThemeApplier />
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status" aria-busy="true"><span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/projects/create"
          element={
            <ProtectedRoute>
              <ProjectForm />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectForm />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dpr/:projectId"
          element={
            <ProtectedRoute>
              <DPRGeneration />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dpr/builder"
          element={
            <ProtectedRoute>
              <AIGuidedDPRBuilder />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dpr/builder/:projectId"
          element={
            <ProtectedRoute>
              <AIGuidedDPRBuilder />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dpr/view/:dprId"
          element={
            <ProtectedRoute>
              <DPRPreview />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dprs"
          element={
            <ProtectedRoute>
              <AllDPRs />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/cluster-dpr/create"
          element={
            <ProtectedRoute>
              <ClusterDPRCreation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/individual-dpr/guide"
          element={
            <ProtectedRoute>
              <ReportGuide />
            </ProtectedRoute>
          }
        />

        <Route
          path="/individual-dpr/create"
          element={
            <ProtectedRoute>
              <IndividualDPRCreation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/venture-match"
          element={
            <ProtectedRoute>
              <VentureMatch />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account/privacy"
          element={
            <ProtectedRoute>
              <AccountPrivacy />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute requiredRole="super_admin">
              <AdminDocuments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviewer"
          element={
            <ProtectedRoute allowedRoles={['govt_official', 'super_admin']}>
              <DistrictReview />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Suspense>
      </ConfirmProvider>
    </Router>
  );
}

export default App;

