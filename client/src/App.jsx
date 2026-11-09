import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewNegotiation from './pages/NewNegotiation'
import NegotiationRoom from './pages/NegotiationRoom'
import Approval from './pages/Approval'
import Checkout from './pages/Checkout'
import AuditTrail from './pages/AuditTrail'
import NegotiationAudit from './pages/NegotiationAudit'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
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
              path="/negotiations/new"
              element={
                <ProtectedRoute>
                  <NewNegotiation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/negotiations/:id"
              element={
                <ProtectedRoute>
                  <NegotiationRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/negotiations/:id/approve"
              element={
                <ProtectedRoute>
                  <Approval />
                </ProtectedRoute>
              }
            />
            <Route
              path="/negotiations/:id/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AuditTrail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/negotiations/:id/audit"
              element={
                <ProtectedRoute>
                  <NegotiationAudit />
                </ProtectedRoute>
              }
            />
            {/* Unknown paths redirect to / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
