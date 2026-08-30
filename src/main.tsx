import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Dashboard from './components/Dashboard.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import ProfileSetup from './components/ProfileSetup.tsx'
import AnalyzerTool from './components/analyzer/AnalyzerTool.tsx'
import RoadmapTool from './components/analyzer/RoadmapTool.tsx'
import LiveHRAgentPage from './components/LiveHRAgentPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileSetup />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<App initialAuthMode="login" forceAuthModal={true} />} />
          <Route path="/signup" element={<App initialAuthMode="signup" forceAuthModal={true} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyzer"
            element={
              <ProtectedRoute>
                <AnalyzerTool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <RoadmapTool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr-agent"
            element={
              <ProtectedRoute>
                <LiveHRAgentPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,


)
