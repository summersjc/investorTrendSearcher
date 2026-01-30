import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import NetworkGraph from '../components/visualizations/NetworkGraph';

export default function NetworkVisualizationPage() {
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');

  // Fetch investors list
  const { data: investorsData } = useQuery({
    queryKey: ['investors'],
    queryFn: async () => {
      const response = await api.investors.list();
      return response.data;
    },
  });

  // Fetch network data for selected investor
  const { data: networkData, isLoading } = useQuery({
    queryKey: ['network', selectedInvestorId],
    queryFn: async () => {
      const response = await api.connections.getInvestorNetwork(selectedInvestorId);
      return response.data;
    },
    enabled: !!selectedInvestorId,
  });

  // Transform data for network graph
  const graphData = networkData
    ? {
        nodes: [
          // Central investor
          {
            id: selectedInvestorId,
            name: investorsData?.investors.find((i: any) => i.id === selectedInvestorId)?.name || 'Investor',
            type: 'investor' as const,
            group: 0,
          },
          // Co-investors
          ...networkData.map((connection: any, index: number) => ({
            id: connection.relatedInvestor.id,
            name: connection.relatedInvestor.name,
            type: 'investor' as const,
            group: 1,
          })),
          // Shared companies
          ...networkData.flatMap((connection: any) =>
            connection.sharedCompanies.map((company: any) => ({
              id: company.id,
              name: company.name,
              type: 'company' as const,
              group: 2,
            }))
          ),
        ],
        links: [
          // Links from central investor to co-investors
          ...networkData.map((connection: any) => ({
            source: selectedInvestorId,
            target: connection.relatedInvestor.id,
            strength: connection.strength,
          })),
          // Links from co-investors to shared companies
          ...networkData.flatMap((connection: any) =>
            connection.sharedCompanies.map((company: any) => ({
              source: connection.relatedInvestor.id,
              target: company.id,
              strength: 1,
            }))
          ),
        ],
      }
    : { nodes: [], links: [] };

  // Remove duplicate nodes
  const uniqueNodes = Array.from(
    new Map(graphData.nodes.map((node) => [node.id, node])).values()
  );

  const handleNodeClick = (node: any) => {
    if (node.type === 'investor') {
      setSelectedInvestorId(node.id);
    } else if (node.type === 'company') {
      window.location.href = `/companies/${node.id}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="mb-4">Investor Network Visualization</h1>
        <p className="text-gray-600">
          Explore connections between investors and their portfolio companies
        </p>
      </div>

      {/* Investor selector */}
      <div className="card mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select an investor to visualize their network
        </label>
        <select
          value={selectedInvestorId}
          onChange={(e) => setSelectedInvestorId(e.target.value)}
          className="input max-w-md"
        >
          <option value="">-- Select Investor --</option>
          {investorsData?.investors.map((investor: any) => (
            <option key={investor.id} value={investor.id}>
              {investor.name}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      {selectedInvestorId && (
        <div className="card mb-8">
          <h3 className="font-semibold mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Investors</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Companies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 bg-gray-400"></div>
              <span className="text-sm">Investments (line thickness = strength)</span>
            </div>
          </div>
        </div>
      )}

      {/* Network graph */}
      {isLoading && (
        <div className="card">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Loading network data...</span>
          </div>
        </div>
      )}

      {!isLoading && selectedInvestorId && networkData && (
        <>
          <NetworkGraph
            nodes={uniqueNodes}
            links={graphData.links}
            width={1200}
            height={800}
            onNodeClick={handleNodeClick}
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Co-Investors</p>
              <p className="text-3xl font-bold text-blue-600">{networkData.length}</p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-green-600">
                {new Set(networkData.flatMap((c: any) => c.sharedCompanies.map((sc: any) => sc.id))).size}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-sm text-gray-500 mb-1">Total Connections</p>
              <p className="text-3xl font-bold text-purple-600">{graphData.links.length}</p>
            </div>
          </div>

          {/* Co-investors list */}
          <div className="card mt-8">
            <h3 className="mb-4">Co-Investors by Connection Strength</h3>
            <div className="space-y-3">
              {networkData
                .sort((a: any, b: any) => b.strength - a.strength)
                .slice(0, 10)
                .map((connection: any) => (
                  <div
                    key={connection.relatedInvestor.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold">{connection.relatedInvestor.name}</h4>
                      <p className="text-sm text-gray-600">
                        {connection.sharedCompanies.length} shared companies
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        Strength: {connection.strength}
                      </span>
                      <button
                        onClick={() => setSelectedInvestorId(connection.relatedInvestor.id)}
                        className="btn-secondary text-sm"
                      >
                        View Network
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {!selectedInvestorId && (
        <div className="card text-center py-16">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Select an investor above to visualize their network</p>
        </div>
      )}
    </div>
  );
}
