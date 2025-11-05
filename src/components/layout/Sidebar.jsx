import { NavLink } from 'react-router-dom';
import { BarChart3, FileText, CheckSquare, Package, Users } from 'lucide-react';

const navItems = [
  { to: "/", icon: BarChart3, label: "Dashboard" },
  { to: "/ballooning", icon: FileText, label: "Ballooning" },
  { to: "/inspection", icon: CheckSquare, label: "Inspection Plans" },
  { to: "/fai", icon: Package, label: "FAI / AS9102" },
  { to: "/suppliers", icon: Users, label: "Suppliers" },
];

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-600 rounded" />
        <h1 className="text-xl font-bold">HighQA Mirror</h1>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive ? 'bg-blue-600' : 'hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}