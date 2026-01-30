import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LoadingSkeleton from './components/common/LoadingSkeleton';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const InvestorDetailPage = lazy(() => import('./pages/InvestorDetailPage'));
const CompanyDetailPage = lazy(() => import('./pages/CompanyDetailPage'));
const NetworkVisualizationPage = lazy(() => import('./pages/NetworkVisualizationPage'));

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <LoadingSkeleton type="card" count={3} />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/investors/:slug" element={<InvestorDetailPage />} />
          <Route path="/companies/:slug" element={<CompanyDetailPage />} />
          <Route path="/network" element={<NetworkVisualizationPage />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
