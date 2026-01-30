import { useParams, Link } from 'react-router-dom';
import { useInvestorBySlug, useInvestorPortfolio, useEnrichInvestor } from '../hooks/useInvestors';

export default function InvestorDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: investor, isLoading, error } = useInvestorBySlug(slug!);
  const { data: portfolioData } = useInvestorPortfolio(investor?.id);
  const enrichMutation = useEnrichInvestor();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Loading investor...</span>
        </div>
      </div>
    );
  }

  if (error || !investor) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-700">Investor not found</p>
        </div>
      </div>
    );
  }

  const handleEnrich = async () => {
    try {
      await enrichMutation.mutateAsync(investor.id);
      alert('Investor enriched successfully!');
    } catch (err) {
      alert('Failed to enrich investor');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="mb-2">{investor.name}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {investor.type}
              </span>
              {investor.foundedYear && (
                <span className="text-gray-500">Founded {investor.foundedYear}</span>
              )}
              {investor.city && investor.country && (
                <span className="text-gray-500">
                  {investor.city}, {investor.country}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleEnrich}
              disabled={enrichMutation.isPending}
              className="btn-secondary"
            >
              {enrichMutation.isPending ? 'Enriching...' : 'Enrich from Wikidata'}
            </button>
            <Link to={`/investors/${investor.id}/edit`} className="btn-primary">
              Edit
            </Link>
          </div>
        </div>

        {investor.description && (
          <p className="text-gray-600 text-lg">{investor.description}</p>
        )}

        {investor.website && (
          <a
            href={investor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            {investor.website}
          </a>
        )}
      </div>

      {/* Portfolio Statistics */}
      {portfolioData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Total Companies</p>
            <p className="text-3xl font-bold">{portfolioData.stats.totalCompanies}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {portfolioData.stats.activeInvestments}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Exits</p>
            <p className="text-3xl font-bold text-blue-600">{portfolioData.stats.exits}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-3xl font-bold">
              ${(portfolioData.stats.totalInvested / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Companies */}
      {portfolioData && portfolioData.portfolio && portfolioData.portfolio.length > 0 && (
        <div className="card mb-8">
          <h2 className="mb-6">Portfolio Companies</h2>
          <div className="space-y-3">
            {portfolioData.portfolio.map((item: any) => (
              <Link
                key={item.id}
                to={`/companies/${item.company.slug}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <h3 className="text-lg font-semibold">{item.company.name}</h3>
                  {item.company.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {item.company.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-white rounded">
                      {item.company.type}
                    </span>
                    {item.company.industry && (
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {item.company.industry}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400"
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
              </Link>
            ))}
          </div>
        </div>
      )}

      {portfolioData && portfolioData.portfolio && portfolioData.portfolio.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-500">No portfolio companies yet</p>
        </div>
      )}
    </div>
  );
}
