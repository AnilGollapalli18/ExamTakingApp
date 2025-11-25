import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ExamProvider } from "./contexts/ExamContext";
import Navbar from "./components/Layout/Navbar";
import PrivateRoute from "./components/Auth/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Exam from "./pages/Exam";
import Results from "./pages/Results";
import History from "./pages/History";
import { Navigate } from "react-router-dom";
import SamplePreview from "./components/Exam/SamplePreview";

function App() {
  return (
    <Router>
      <AuthProvider>
        <ExamProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/exam"
                element={
                  <PrivateRoute>
                    <Exam />
                  </PrivateRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <PrivateRoute>
                    <Results />
                  </PrivateRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <PrivateRoute>
                    <History />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
              <Route path="/sample" element={<SamplePreview />} />
            </Routes>
          </div>
        </ExamProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
