import { Routes, Route } from "react-router-dom";

import Dashboard from "../src/pages/Dashboard";
import History from "../src/components/HistoryGraph";

function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={<Dashboard />}
      />

      <Route
        path="/history"
        element={<History />}
      />

    </Routes>
  );
}

export default App;