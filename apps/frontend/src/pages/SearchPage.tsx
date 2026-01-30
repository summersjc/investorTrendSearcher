import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../hooks/useSearch';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useSearch(searchTerm);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(query);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-4">Search Investors & Companies</h1>
        <p className="text-gray-600">
          Search across our database of investors, companies, and investment relationships
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search for investors or companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input flex-1 text-lg"
          />
          <button type="submit" className="btn-primary px-8">
            Search
          </button>
        </div>
      </form>

      {error && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">Error: {(error as Error).message}</p>
        </div>
      )}

      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {data && data.results && data.results.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Found {data.total} result{data.total !== 1 ? 's' : ''} for "{data.query}"
          </p>

          {data.results.map((result: any) => (
            <Link
              key={`${result.type}-${result.id}`}
              to={`/${result.type === 'investor' ? 'investors' : 'companies'}/${result.slug}`}
              className="card block hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{result.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        result.type === 'investor'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {result.type === 'investor' ? 'Investor' : 'Company'}
                    </span>
                  </div>

                  {result.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">{result.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                    {result.metadata?.type && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{result.metadata.type}</span>
                    )}
                    {result.metadata?.stage && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{result.metadata.stage}</span>
                    )}
                    {result.metadata?.industry && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {result.metadata.industry}
                      </span>
                    )}
                    {result.metadata?.ticker && (
                      <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                        {result.metadata.ticker}
                      </span>
                    )}
                    {result.metadata?.city && result.metadata?.country && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {result.metadata.city}, {result.metadata.country}
                      </span>
                    )}
                  </div>
                </div>

                <svg
                  className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.results && data.results.length === 0 && searchTerm && (
        <div className="card text-center py-8">
          <p className="text-gray-500 mb-2">No results found for "{searchTerm}"</p>
          <p className="text-sm text-gray-400">Try a different search term</p>
        </div>
      )}

      {!searchTerm && (
        <div className="card text-center py-8">
          <p className="text-gray-500">Enter a search term to find investors and companies</p>
        </div>
      )}
    </div>
  );
}
