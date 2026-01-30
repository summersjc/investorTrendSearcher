import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface MarketDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketDataChartProps {
  data: MarketDataPoint[];
  type?: 'line' | 'area';
  height?: number;
}

export default function MarketDataChart({ data, type = 'area', height = 400 }: MarketDataChartProps) {
  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    date: format(new Date(point.date), 'MMM dd'),
    dateValue: new Date(point.date).getTime(),
  }));

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-2">{data.date}</p>
          <div className="space-y-1 text-xs">
            <p className="text-gray-600">Open: <span className="font-semibold">{formatPrice(data.open)}</span></p>
            <p className="text-gray-600">High: <span className="font-semibold text-green-600">{formatPrice(data.high)}</span></p>
            <p className="text-gray-600">Low: <span className="font-semibold text-red-600">{formatPrice(data.low)}</span></p>
            <p className="text-gray-600">Close: <span className="font-semibold">{formatPrice(data.close)}</span></p>
            <p className="text-gray-600">Volume: <span className="font-semibold">{formatVolume(data.volume)}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No market data available</p>
      </div>
    );
  }

  return (
    <div className="market-data-chart bg-white rounded-lg shadow p-4">
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={formatPrice} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="close" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" tickFormatter={formatPrice} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="high" stroke="#10b981" strokeWidth={2} dot={false} name="High" />
            <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="Close" />
            <Line type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={2} dot={false} name="Low" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
