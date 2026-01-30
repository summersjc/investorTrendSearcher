import { format } from 'date-fns';

interface Investment {
  id: string;
  company: {
    name: string;
    slug: string;
  };
  stage: string;
  amount?: number;
  investedAt?: string;
  status: string;
}

interface InvestmentTimelineProps {
  investments: Investment[];
}

export default function InvestmentTimeline({ investments }: InvestmentTimelineProps) {
  // Sort investments by date (most recent first)
  const sortedInvestments = [...investments].sort((a, b) => {
    if (!a.investedAt) return 1;
    if (!b.investedAt) return -1;
    return new Date(b.investedAt).getTime() - new Date(a.investedAt).getTime();
  });

  // Group by year
  const groupedByYear = sortedInvestments.reduce((acc, investment) => {
    if (!investment.investedAt) return acc;
    const year = new Date(investment.investedAt).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(investment);
    return acc;
  }, {} as Record<number, Investment[]>);

  const years = Object.keys(groupedByYear)
    .map(Number)
    .sort((a, b) => b - a);

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PRE_SEED: 'bg-purple-100 text-purple-700',
      SEED: 'bg-blue-100 text-blue-700',
      SERIES_A: 'bg-green-100 text-green-700',
      SERIES_B: 'bg-yellow-100 text-yellow-700',
      SERIES_C: 'bg-orange-100 text-orange-700',
      SERIES_D_PLUS: 'bg-red-100 text-red-700',
      GROWTH: 'bg-indigo-100 text-indigo-700',
      IPO: 'bg-pink-100 text-pink-700',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-500',
      EXITED: 'bg-blue-500',
      IPO: 'bg-purple-500',
      ACQUIRED: 'bg-yellow-500',
      DEFUNCT: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <div className="investment-timeline">
      {years.map((year) => (
        <div key={year} className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 sticky top-0 bg-white py-2 z-10">
            {year}
          </h3>

          <div className="space-y-4 relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200">
            {groupedByYear[year].map((investment) => (
              <div key={investment.id} className="relative">
                {/* Timeline dot */}
                <div
                  className={`absolute left-[-1.94rem] top-2 w-4 h-4 rounded-full ${getStatusColor(
                    investment.status
                  )} ring-4 ring-white`}
                ></div>

                {/* Investment card */}
                <div className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{investment.company.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(investment.stage)}`}>
                          {investment.stage.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700`}>
                          {investment.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {investment.investedAt && (
                          <span>{format(new Date(investment.investedAt), 'MMM dd, yyyy')}</span>
                        )}
                        {investment.amount && (
                          <span className="font-semibold text-green-600">
                            ${(investment.amount / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={`/companies/${investment.company.slug}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {years.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No investment history available
        </div>
      )}
    </div>
  );
}
