import { useStore } from '../store/useStore.js';
import { useLocation, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function InspectionPlans() {
  const { plans } = useStore();
  const location = useLocation();
  const { partId } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('drawing');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isStamping, setIsStamping] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [currentStamp, setCurrentStamp] = useState(null);
  const [showStampPopup, setShowStampPopup] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [stampCount, setStampCount] = useState(1); // Add this for ID tracking
  const [bocEntries, setBocEntries] = useState([]); // Add this for BOC table
  const drawingRef = useRef(null);
  const canvasRef = useRef(null);
  const [canvasContext, setCanvasContext] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const file = location.state?.drawing;
    if (file && file instanceof File) {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl);
      
      return () => URL.revokeObjectURL(fileUrl);
    }
  }, [location.state]);

  useEffect(() => {
    if (drawingRef.current && pdfUrl) {
      const canvas = canvasRef.current;
      const container = drawingRef.current;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      setCanvasContext(ctx);
    }
  }, [pdfUrl, drawingRef.current]);

  const handleStampClick = () => {
    setIsStamping(prev => !prev);
    if (drawingRef.current) {
      drawingRef.current.style.cursor = 'crosshair';
    }
  };

  const handleDrawingMouseDown = (e) => {
    if (!isStamping) return;
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });

    // Start new path
    canvasContext.beginPath();
    canvasContext.moveTo(x, y);
  };

  const handleDrawingMouseMove = (e) => {
    if (!isStamping || !isDrawing || !canvasContext) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clear previous drawing
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw rectangle with no fill
    canvasContext.beginPath();
    canvasContext.strokeStyle = '#3B82F6';
    canvasContext.lineWidth = 2;
    canvasContext.setLineDash([]);
    canvasContext.rect(
      startPoint.x,
      startPoint.y,
      x - startPoint.x,
      y - startPoint.y
    );
    canvasContext.stroke();
  };

  const handleDrawingMouseUp = (e) => {
    if (!isStamping || !isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);

    if (width > 5 && height > 5) {
      const stampPosition = {
        startX: Math.min(startPoint.x, x),
        startY: Math.min(startPoint.y, y),
        width,
        height,
        id: Date.now()
      };
      setSelectedStamp(stampPosition);
      setShowStampPopup(true);
      
      // Draw permanent rectangle with no fill
      if (canvasContext) {
        canvasContext.beginPath();
        canvasContext.strokeStyle = '#3B82F6';
        canvasContext.lineWidth = 2;
        canvasContext.setLineDash([]);
        canvasContext.rect(
          stampPosition.startX,
          stampPosition.startY,
          stampPosition.width,
          stampPosition.height
        );
        canvasContext.stroke();
      }
    }
    setIsDrawing(false);
  };

  const handleStampSubmit = (data) => {
    const newStamp = { 
      ...selectedStamp, 
      ...data,
      id: stampCount 
    };
    setStamps(prev => [...prev, newStamp]);

    // Add entry to BOC table
    setBocEntries(prev => [...prev, {
      id: stampCount,
      nominalValue: data.nominalValue,
      upperTolerance: data.upperTolerance,
      lowerTolerance: data.lowerTolerance,
      instrument: data.instrument
    }]);

    setStampCount(prev => prev + 1);
    setShowStampPopup(false);
    setSelectedStamp(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Tools Section */}
      <div className="bg-gray-200 border-b">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('drawing')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'drawing'
                ? 'bg-white border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Drawing
          </button>
          <button
            onClick={() => setActiveTab('3dmodel')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === '3dmodel'
                ? 'bg-white border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            3D Model
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center p-1 space-x-2">
          <div className="flex items-center space-x-1 border-r pr-2">
            <button className="p-1 hover:bg-gray-300 rounded" title="Select">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-300 rounded" title="Balloon">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="7" />
                <path d="M12 9v6M9 12h6" />
              </svg>
            </button>
            <button 
              className={`p-1 rounded ${isStamping ? 'bg-blue-200' : 'hover:bg-gray-300'}`} 
              title="Stamp"
              onClick={handleStampClick}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M7 7h10M7 12h10M7 17h10" />
              </svg>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border-r pr-2">
            <button 
              className="p-1 hover:bg-gray-300 rounded" 
              onClick={() => setZoomLevel(prev => prev + 10)}
              title="Zoom In"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <span className="text-sm font-medium">{zoomLevel}%</span>
            <button 
              className="p-1 hover:bg-gray-300 rounded"
              onClick={() => setZoomLevel(prev => prev - 10)}
              title="Zoom Out"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-300 rounded" title="Fit to Screen">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          {/* View Controls */}
          <div className="flex items-center space-x-1">
            <button className="p-1 hover:bg-gray-300 rounded" title="Pan">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12M8 12h12M8 17h12M4 7h0M4 12h0M4 17h0" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-300 rounded" title="Rotate">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main Drawing Area */}
        <div className="flex-1 relative">
          {activeTab === 'drawing' && pdfUrl && (
            <div 
              ref={drawingRef}
              className="h-full relative"
              style={{ 
                overflow: 'hidden',
                cursor: isStamping ? 'crosshair !important' : 'default'
              }}
            >
              {/* PDF Object */}
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full"
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  pointerEvents: isStamping ? 'none' : 'auto'
                }}
              >
                <p>Unable to display PDF</p>
              </object>

              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ 
                  cursor: 'inherit',
                  pointerEvents: isStamping ? 'auto' : 'none',
                  zIndex: 10
                }}
                onMouseDown={handleDrawingMouseDown}
                onMouseMove={handleDrawingMouseMove}
                onMouseUp={handleDrawingMouseUp}
                onMouseLeave={handleDrawingMouseUp}
              />

              {/* Update Existing Stamps Display */}
              <div className="absolute inset-0 pointer-events-none">
                {stamps.map((stamp) => (
                  <div
                    key={stamp.id}
                    className="absolute border-2 border-blue-500"
                    style={{
                      left: `${stamp.startX}px`,
                      top: `${stamp.startY}px`,
                      width: `${stamp.width}px`,
                      height: `${stamp.height}px`,
                      backgroundColor: 'transparent'
                    }}
                  >
                    {stamp.nominalValue && (
                      <span className="absolute -top-6 left-0 bg-white px-2 py-1 text-xs border rounded shadow-sm">
                        {stamp.nominalValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === '3dmodel' && (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <p className="text-gray-500">3D Model Viewer (Coming Soon)</p>
            </div>
          )}
        </div>

        {/* Right Side Panel */}
        <div className="w-80 border-l bg-white">
          {/* Part Properties */}
          <div className="border-b">
            <div className="p-2 bg-gray-100 font-medium">Part Properties</div>
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-2 text-sm">
                <span className="text-gray-600">Part Category:</span>
                <span>ACME (PC0004)</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-gray-600">Customer:</span>
                <span>High QA Engineering</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-gray-600">Part Number:</span>
                <span>SP002 PDF rev B</span>
              </div>
              <div className="grid grid-cols-2 text-sm">
                <span className="text-gray-600">Units:</span>
                <span>English (INCH)</span>
              </div>
            </div>
          </div>

          {/* BOC Table */}
          <div className="flex-1">
            <div className="p-2 bg-gray-100 font-medium">Bill of Characteristics</div>
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Nominal</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Upper Tol</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Lower Tol</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Instrument</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bocEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="p-2">{entry.id}</td>
                      <td className="p-2">{entry.nominalValue}</td>
                      <td className="p-2">{entry.upperTolerance}</td>
                      <td className="p-2">{entry.lowerTolerance}</td>
                      <td className="p-2">{entry.instrument}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Stamp Dialog */}
      {showStampPopup && selectedStamp && (
        <dialog 
          open 
          className="fixed bg-white rounded-lg shadow-xl w-[500px] z-50"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            margin: 0
          }}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Characteristic</h3>
              <button 
                onClick={() => setShowStampPopup(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleStampSubmit({
                  stampId: stampCount,
                  nominalValue: formData.get('nominal'),
                  upperTolerance: formData.get('upperTol'),
                  lowerTolerance: formData.get('lowerTol'),
                  instrument: formData.get('instrument')
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={stampCount}
                    disabled
                    className="w-full border rounded-md px-3 py-2 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal Value
                  </label>
                  <input
                    name="nominal"
                    type="number"
                    step="0.001"
                    required
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upper Tolerance
                  </label>
                  <input
                    name="upperTol"
                    type="number"
                    step="0.001"
                    required
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lower Tolerance
                  </label>
                  <input
                    name="lowerTol"
                    type="number"
                    step="0.001"
                    required
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrument
                  </label>
                  <select
                    name="instrument"
                    required
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select Instrument</option>
                    <option value="caliper">Caliper</option>
                    <option value="micrometer">Micrometer</option>
                    <option value="cmm">CMM</option>
                    <option value="heightGauge">Height Gauge</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStampPopup(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Stamp
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Add backdrop for dialog */}
      {showStampPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowStampPopup(false)}
        />
      )}
    </div>
  );
}