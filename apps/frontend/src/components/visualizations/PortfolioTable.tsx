import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper, SortingState, ColumnFiltersState } from '@tanstack/react-table';

interface PortfolioCompany {
  id: string;
  company: {
    name: string;
    slug: string;
    type: string;
    stage?: string;
    industry?: string;
    marketCap?: number;
  };
  status: string;
  addedAt: string;
}

interface PortfolioTableProps {
  data: PortfolioCompany[];
}

const columnHelper = createColumnHelper<PortfolioCompany>();

export default function PortfolioTable({ data }: PortfolioTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('company.name', {
        header: 'Company',
        cell: (info) => (
          <a
            href={`/companies/${info.row.original.company.slug}`}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            {info.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor('company.type', {
        header: 'Type',
        cell: (info) => (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('company.stage', {
        header: 'Stage',
        cell: (info) => {
          const stage = info.getValue();
          return stage ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
              {stage.replace(/_/g, ' ')}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      }),
      columnHelper.accessor('company.industry', {
        header: 'Industry',
        cell: (info) => info.getValue() || <span className="text-gray-400">-</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          const colors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-700',
            EXITED: 'bg-blue-100 text-blue-700',
            IPO: 'bg-purple-100 text-purple-700',
            ACQUIRED: 'bg-yellow-100 text-yellow-700',
            DEFUNCT: 'bg-gray-100 text-gray-700',
          };
          return (
            <span className={`px-2 py-1 rounded text-sm ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
              {status}
            </span>
          );
        },
        filterFn: 'equals',
      }),
      columnHelper.accessor('company.marketCap', {
        header: 'Market Cap',
        cell: (info) => {
          const value = info.getValue();
          if (!value) return <span className="text-gray-400">-</span>;
          return <span className="font-semibold">${(value / 1000000000).toFixed(2)}B</span>;
        },
      }),
      columnHelper.accessor('addedAt', {
        header: 'Added',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="portfolio-table">
      {/* Search and filters */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search companies..."
          className="input flex-1 max-w-md"
        />

        <div className="flex gap-2">
          <select
            value={(table.getColumn('status')?.getFilterValue() ?? '') as string}
            onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value || undefined)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXITED">Exited</option>
            <option value="IPO">IPO</option>
            <option value="ACQUIRED">Acquired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">No companies found</div>
        )}
      </div>

      {/* Results info */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {data.length} companies
      </div>
    </div>
  );
}
