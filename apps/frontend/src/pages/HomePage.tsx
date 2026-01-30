import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Investor & Company Research Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive research tool aggregating data from free APIs and manual entry.
            Track investors, companies, funding rounds, and investment relationships.
          </p>

          <div className="flex justify-center gap-4">
            <Link to="/search" className="btn-primary text-lg px-8 py-3">
              Start Searching
            </Link>
            <Link to="/investors/new" className="btn-secondary text-lg px-8 py-3">
              Add Investor
            </Link>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="mb-2">Search & Discover</h3>
            <p className="text-gray-600">
              Search across investors and companies with unified search interface
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="mb-2">Track Investments</h3>
            <p className="text-gray-600">
              Monitor funding rounds, portfolio companies, and investment relationships
            </p>
          </div>

          <div className="card text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="mb-2">Network Insights</h3>
            <p className="text-gray-600">
              Visualize connections between investors and discover co-investment patterns
            </p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center mb-8">Free Data Sources</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center py-4">
              <p className="font-semibold">SEC EDGAR</p>
              <p className="text-sm text-gray-600">Financial Filings</p>
            </div>
            <div className="card text-center py-4">
              <p className="font-semibold">Yahoo Finance</p>
              <p className="text-sm text-gray-600">Market Data</p>
            </div>
            <div className="card text-center py-4">
              <p className="font-semibold">OpenCorporates</p>
              <p className="text-sm text-gray-600">Company Registry</p>
            </div>
            <div className="card text-center py-4">
              <p className="font-semibold">Wikidata</p>
              <p className="text-sm text-gray-600">Entity Data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
