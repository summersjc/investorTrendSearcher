import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">InvestorSearch</span>
            </Link>

            <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
              <Link
                to="/search"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Search
              </Link>
              <Link
                to="/investors"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Investors
              </Link>
              <Link
                to="/companies"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Companies
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <button className="btn-primary">Add Investor</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
