import { PDFDownloadLink } from '@react-pdf/renderer';
import FAIReporter from '../components/reports/FAIReporter.jsx';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

export default function FAIReports() {
  const location = useLocation();
  const { bocEntries = [], selectedBocEntry, projectDetails } = location.state || {};
  const [currentTime] = useState(new Date().toLocaleString());

  const handleExcelExport = () => {
    // Create CSV content
    const headers = ['ID', 'Nominal Value', 'Upper Tolerance', 'Lower Tolerance', 'Instrument', 'GD&T Symbol', 'M1', 'M2', 'M3', 'Mean', 'Status'];
    const csvContent = [
      headers.join(','),
      ...bocEntries.map(entry => [
        entry.id,
        entry.nominalValue,
        entry.upperTolerance,
        entry.lowerTolerance,
        entry.instrument || '',
        entry.gdntSymbol || '',
        entry.m1 || '',
        entry.m2 || '',
        entry.m3 || '',
        entry.mean || '',
        (entry.m1 && entry.m2 && entry.m3) ? 'Completed' : 'Pending'
      ].join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FAI_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isWithinTolerance = (value, nominal, upperTol, lowerTol) => {
    if (value === '' || isNaN(parseFloat(value))) return false;
    const numValue = parseFloat(value);
    const numNominal = parseFloat(nominal) || 0;
    const numUpperTol = parseFloat(upperTol) || 0;
    const numLowerTol = parseFloat(lowerTol) || 0;
    
    const upperLimit = numNominal + numUpperTol;
    const lowerLimit = numNominal - numLowerTol;
    
    return numValue >= lowerLimit && numValue <= upperLimit;
  };

  const getGdntSymbolDisplay = (symbol) => {
    const symbolMap = {
      'straightness': '⏤',
      'flatness': '□',
      'circularity': '○',
      'cylindricity': '⌭',
      'profileOfLine': '⌒',
      'profileOfSurface': '⌭',
      'parallelism': '∥',
      'perpendicularity': '⊥',
      'angularity': '∠',
      'position': '⌖',
      'concentricity': '◎',
      'symmetry': '⌯',
      'runout': '↗',
      'totalRunout': '↗',
      'diameter': '⌀',
      'radius': 'R',
      'square': '□',
      'dimension': '—'
    };
    return symbolMap[symbol] || symbol;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FAI / AS9102 Reports</h1>
        <div className="text-sm text-gray-600">
          Generated on: {currentTime}
        </div>
      </div>

      {/* Project Details Section */}
      {projectDetails && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800">Project Details</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Part Name:</span>
                <div className="text-sm text-gray-900 mt-1">{projectDetails.partName}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Part Number:</span>
                <div className="text-sm text-gray-900 mt-1">{projectDetails.partNumber}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Revision:</span>
                <div className="text-sm text-gray-900 mt-1">{projectDetails.revision}</div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Customer:</span>
                <div className="text-sm text-gray-900 mt-1">{projectDetails.customer}</div>
              </div>
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Drawing File:</span>
                <div className="text-sm text-gray-900 mt-1">{projectDetails.drawingFile}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Inspection Results</h2>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <span>Total Characteristics: {bocEntries.length}</span>
            <span>Completed: {bocEntries.filter(entry => entry.m1 && entry.m2 && entry.m3).length}</span>
            <span>Within Tolerance: {bocEntries.filter(entry => 
              entry.m1 && entry.m2 && entry.m3 && 
              isWithinTolerance(entry.mean, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance)
            ).length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">±Tol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GD&T</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instrument</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">M1</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">M2</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">M3</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mean</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bocEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{entry.id}</td>
                  <td className="px-4 py-3 text-sm">{entry.nominalValue}</td>
                  <td className="px-4 py-3 text-sm">
                    +{entry.upperTolerance} / -{entry.lowerTolerance}
                  </td>
                  <td className="px-4 py-3 text-sm text-lg">{getGdntSymbolDisplay(entry.gdntSymbol)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{entry.instrument}</td>
                  <td className={`px-4 py-3 text-sm ${entry.m1 && isWithinTolerance(entry.m1, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.m1 || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${entry.m2 && isWithinTolerance(entry.m2, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.m2 || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${entry.m3 && isWithinTolerance(entry.m3, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.m3 || '-'}
                  </td>
                  <td className={`px-4 py-3 text-sm font-medium ${entry.mean && isWithinTolerance(entry.mean, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.mean || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      entry.m1 && entry.m2 && entry.m3 && isWithinTolerance(entry.mean, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance)
                        ? 'bg-green-100 text-green-800'
                        : entry.m1 && entry.m2 && entry.m3
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {entry.m1 && entry.m2 && entry.m3 && isWithinTolerance(entry.mean, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance)
                        ? 'Pass'
                        : entry.m1 && entry.m2 && entry.m3
                          ? 'Fail'
                          : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        <PDFDownloadLink document={<FAIReporter bocEntries={bocEntries} currentTime={currentTime} projectDetails={projectDetails} />} fileName={`FAI_Report_${new Date().toISOString().split('T')[0]}.pdf`}>
          {({ loading }) => (
            <button 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {loading ? 'Generating PDF...' : 'Download PDF'}
            </button>
          )}
        </PDFDownloadLink>

        <button 
          onClick={handleExcelExport}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Export to Excel
        </button>
      </div>
    </div>
  );
}