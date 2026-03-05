import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { JourneyExplorer } from './pages/JourneyExplorer';
import { JourneyDetail } from './pages/JourneyDetail';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/explore" replace />} />
          <Route path="/explore" element={<JourneyExplorer />} />
          <Route path="/journey/:correlationId" element={<JourneyDetail />} />
        </Routes>
      </main>
    </div>
  );
}
