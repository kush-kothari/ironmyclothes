import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { initDatabase } from './services/database';
import AppLayout from './components/AppLayout';
import Dashboard from './screens/Dashboard';
import EntryDetail from './screens/EntryDetail';
import AddEntry from './screens/AddEntry';
import CategoryManagement from './screens/CategoryManagement';

function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    setDbError(null);
    console.log('[App] Starting initDatabase()...');
    initDatabase()
      .then(() => {
        console.log('[App] initDatabase() done, setting dbReady=true');
        setDbReady(true);
      })
      .catch((e) => {
        console.error('[App] initDatabase() failed:', e);
        setDbError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  // Wait for DB before rendering screens that call getEntries/getCategories etc.
  if (!dbReady) {
    if (dbError) {
      console.log('[App] Rendering DB error screen');
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Database error</h1>
          <p className="text-sm text-red-600 mb-4 text-center">{dbError}</p>
          <button
            type="button"
            onClick={() => {
              setDbError(null);
              initDatabase()
                .then(() => setDbReady(true))
                .catch((e) => setDbError(e instanceof Error ? e.message : String(e)));
            }}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white"
          >
            Retry
          </button>
        </div>
      );
    }
    console.log('[App] Rendering Loading... (waiting for initDatabase)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  console.log('[App] dbReady=true, rendering app');

  // HashRouter works reliably in Capacitor WebView (URL stays ...#/ so "/" always matches)
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/entry/:id" element={<EntryDetail />} />
          <Route path="/add" element={<AddEntry />} />
          <Route path="/categories" element={<CategoryManagement />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}

export default App;
