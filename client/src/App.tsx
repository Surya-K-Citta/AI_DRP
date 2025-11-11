// @ts-nocheck
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectForm } from './pages/ProjectForm';
import { Chat } from './pages/Chat';
import { DPRGeneration } from './pages/DPRGeneration';
import { AIGuidedDPRBuilder } from './pages/AIGuidedDPRBuilder';
import { DPRPreview } from './pages/DPRPreview';
import { AllDPRs } from './pages/AllDPRs';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDocuments } from './pages/AdminDocuments';
import './i18n/config';

function App() {

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
              background: 'hsl(0, 84%, 60%)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: 'hsl(0, 84%, 60%)',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDocuments />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

