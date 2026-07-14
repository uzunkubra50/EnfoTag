import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import BarcodeCreate from "./pages/BarcodeCreate";
import BarcodeList from "./pages/BarcodeList";
import BarcodePrint from "./pages/BarcodePrint";
import Login from "./pages/Login";
import Units from "./pages/Units";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/units" replace />} />
          <Route path="/units" element={<Units />} />
          <Route path="/barcodes/new" element={<BarcodeCreate />} />
          <Route path="/barcodes" element={<BarcodeList />} />
          <Route path="/print" element={<BarcodePrint />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
