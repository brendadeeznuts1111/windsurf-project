import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HealthMonitor from './pages/HealthMonitor';
import MetricsViewer from './pages/MetricsViewer';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/health" element={<HealthMonitor />} />
            <Route path="/metrics" element={<MetricsViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;