import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import LoginDesign from "./LoginDesign";
import ClientDesign from "./ClientDesign";
import ChefDesign from "./ChefDesign";
import SuperAdminDashboard from "./components/SuperAdminDashboard";
import RestaurantAdminDashboard from "./components/RestaurantAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import KitchenDashboard from "./pages/KitchenDashboard";
import WaiterDashboard from "./pages/WaiterDashboard";
import ShiftManagement from "./pages/ShiftManagement";
import OrderManagement from "./pages/OrderManagement";
import OrderTotals from "./pages/OrderTotals";
import SendToKitchen from "./pages/SendToKitchen";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Login route */}
            <Route path="/login" element={<LoginDesign />} />

            {/* Protected Super Admin Dashboard */}
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute requiredRole="super-admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Restaurant Admin Dashboard */}
            <Route
              path="/restaurant/dashboard"
              element={
                <ProtectedRoute requiredRole="restaurant-admin">
                  <RestaurantAdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Waiter Dashboard */}
            <Route
              path="/waiter/dashboard"
              element={
                <ProtectedRoute requiredRole="restaurant-waiter">
                  <WaiterDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Chef Dashboard */}
            <Route
              path="/kitchendashboard"
              element={
                <ProtectedRoute requiredRole="restaurant-chef">
                  <KitchenDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Waiter Actions */}
            <Route
              path="/shift-management"
              element={
                <ProtectedRoute requiredRole="restaurant-waiter">
                  <ShiftManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-management"
              element={
                <ProtectedRoute requiredRole="restaurant-waiter">
                  <OrderManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-totals"
              element={
                <ProtectedRoute requiredRole="restaurant-waiter">
                  <OrderTotals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/send-to-kitchen"
              element={
                <ProtectedRoute requiredRole="restaurant-waiter">
                  <SendToKitchen />
                </ProtectedRoute>
              }
            />

            {/* Client Design route protegida */}
            <Route path="/client" element={<ClientDesign />} />

            {/* ChefDesign route */}
            <Route path="/chef" element={<ChefDesign />} />

            {/* Default redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Catch all other routes and redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
