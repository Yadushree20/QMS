import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white">
    <div className="max-w-full px-2">
      <div className="flex h-16 items-center">
        <div className="flex-shrink-0">
          <span className="text-xl font-bold">QMS</span>
        </div>
        <div className="ml-auto flex space-x-4">
          <Link to="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            Dashboard
          </Link>
          <Link to="/inspection" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            Inspection Plans
          </Link>
          <Link to="/fai" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-700">
            FAI Reports
          </Link>
        </div>
      </div>
    </div>
  </nav>
  );
}
