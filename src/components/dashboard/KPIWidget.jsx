export default function KPIWidget({ title, value, trend, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
  };
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <span className={`text-xs ${colors[color]} px-2 py-1 rounded-full`}>{trend}</span>
    </div>
  );
}