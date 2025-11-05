import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/navigation/Navbar.jsx';
import Dashboard from './pages/Dashboard.jsx';

import InspectionPlans from './pages/InspectionPlans.jsx';
import FAIReports from './pages/FAIReports.jsx';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
           
            <Route path="/inspection" element={<InspectionPlans />} />
            <Route path="/inspection/:partId" element={<InspectionPlans />} />
            <Route path="/fai" element={<FAIReports />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;