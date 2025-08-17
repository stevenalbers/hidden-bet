import { BrowserRouter, Routes, Route } from "react-router-dom";
import PlayerPage from "./components/PlayerPage";
import AdminPage from "./components/AdminPage";
import { SubmissionsProvider, useSubmissions } from "./components/SubmissionsContext";

function RoutedApp() {
  const { allSubmissions, handleClear } = useSubmissions();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/admin" element={<AdminPage allSubmissions={allSubmissions} onClear={handleClear} />} />
        <Route path="*" element={<PlayerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <SubmissionsProvider>
      <RoutedApp />
    </SubmissionsProvider>
  );
}
