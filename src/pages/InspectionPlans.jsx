import { useStore } from '../store/useStore.js';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CreatePartModal from '../components/modals/CreatePartModal.jsx';
import STEPViewer from '../components/STEPViewer.jsx';
export default function InspectionPlans() {
  const { plans } = useStore();
  const location = useLocation();
  const { partId } = useParams();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [model3DUrl, setModel3DUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('drawing');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isStamping, setIsStamping] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [currentStamp, setCurrentStamp] = useState(null);
  const [showStampPopup, setShowStampPopup] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [stampCount, setStampCount] = useState(1);
  const [bocEntries, setBocEntries] = useState([
    ...(location.state?.bocEntries || []).map(entry => ({
      ...entry,
      m1: '',
      m2: '',
      m3: '',
      mean: ''
    }))
  ]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  const [bocPanelHeight, setBocPanelHeight] = useState('40vh');
  const [isDraggingBoc, setIsDraggingBoc] = useState(false);
  const [bocPanelY, setBocPanelY] = useState(0);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedStampForMenu, setSelectedStampForMenu] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStamp, setEditingStamp] = useState(null);

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
      'totalRunout': '↗'
    };
    return symbolMap[symbol] || symbol;
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

  const drawingRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const overlayRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [highlightedId, setHighlightedId] = useState(null);
  const [bocPosition, setBocPosition] = useState({ x: 0, y: 0 });
  const bocRef = useRef(null);
  const viewer3DRef = useRef(null);
  
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(300);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const [selectedBocEntry, setSelectedBocEntry] = useState(null);
  const [dimensions, setDimensions] = useState([]);
  const [showAddCharacteristic, setShowAddCharacteristic] = useState(false);
  const [autoBalloonData] = useState([]);
  const [newCharacteristic, setNewCharacteristic] = useState({
    id: '',
    nominalValue: '',
    upperTolerance: '',
    lowerTolerance: '',
    instrument: '',
    gdntSymbol: ''
  });
  const [currentSelection, setCurrentSelection] = useState(null);

  useEffect(() => {
    console.log('InspectionPlans - location.state:', location.state);
    const drawing2D = location.state?.drawing2D || location.state?.drawing;
    console.log('InspectionPlans - drawing2D:', drawing2D);
    console.log('InspectionPlans - is File?', drawing2D instanceof File);
    
    if (drawing2D && drawing2D instanceof File) {
      const fileUrl = URL.createObjectURL(drawing2D);
      console.log('InspectionPlans - Created PDF URL:', fileUrl);
      setPdfUrl(fileUrl);
      
      // Cleanup function for this specific URL
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    } else if (drawing2D && typeof drawing2D === 'string') {
      // Handle case where drawing2D is already a URL string
      console.log('InspectionPlans - drawing2D is a URL string:', drawing2D);
      setPdfUrl(drawing2D);
    }
  }, [location.state?.drawing2D, location.state?.drawing]);

  useEffect(() => {
    const drawing3D = location.state?.drawing3D;
    if (drawing3D && drawing3D instanceof File) {
      const modelUrl = URL.createObjectURL(drawing3D);
      setModel3DUrl(modelUrl);
      
      // Cleanup function for this specific URL
      return () => {
        URL.revokeObjectURL(modelUrl);
      };
    }
  }, [location.state?.drawing3D]);

  useEffect(() => {
    const clearHighlight = (e) => {
      if (!e.target.closest('.stamp-rectangle') && !e.target.closest('.boc-row')) {
        setHighlightedId(null);
      }
    };

    const drawingEl = drawingRef.current;
    if (drawingEl) {
      drawingEl.addEventListener('click', clearHighlight);
      return () => drawingEl.removeEventListener('click', clearHighlight);
    }
  }, [pdfUrl]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingBoc) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 200 && newHeight < window.innerHeight - 100) {
          setBocPanelHeight(`${newHeight}px`);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingBoc(false);
    };

    if (isDraggingBoc) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingBoc]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const handleStampClick = () => {
    setIsStamping(prev => !prev);
  };

  const handleOverlayMouseDown = (e) => {
    if (!isStamping) return;
    
    setIsDrawing(true);
    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleOverlayMouseMove = (e) => {
    if (!isStamping || !isDrawing) return;

    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPoint({ x, y });
  };

  const handleOverlayMouseUp = (e) => {
    if (!isStamping || !isDrawing) return;

    const overlay = overlayRef.current;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = Math.abs(x - startPoint.x);
    const height = Math.abs(y - startPoint.y);

    if (width > 5 && height > 5) {
      const stampPosition = {
        startX: Math.min(startPoint.x, x),
        startY: Math.min(startPoint.y, y),
        width,
        height
      };

      setSelectedStamp(stampPosition);
      setShowStampPopup(true);
    }

    setIsDrawing(false);
    setCurrentPoint({ x: 0, y: 0 });
  };

  const handleStampSubmit = (data) => {
    if (isEditMode && editingStamp) {
      setStamps(prev => prev.map(stamp => 
        stamp.id === editingStamp.id 
          ? { ...stamp, ...data }
          : stamp
      ));

      setBocEntries(prev => prev.map(entry =>
        entry.id === editingStamp.id
          ? {
              ...entry,
              nominalValue: data.nominalValue,
              upperTolerance: data.upperTolerance,
              lowerTolerance: data.lowerTolerance,
              instrument: data.instrument,
              gdntSymbol: data.gdntSymbol
            }
          : entry
      ));

      setIsEditMode(false);
      setEditingStamp(null);
    } else {
      const newStamp = { 
        ...selectedStamp, 
        ...data,
        id: stampCount
      };
      setStamps(prev => [...prev, newStamp]);

      setBocEntries(prev => [...prev, {
        id: stampCount,
        nominalValue: data.nominalValue,
        upperTolerance: data.upperTolerance,
        lowerTolerance: data.lowerTolerance,
        instrument: data.instrument,
        gdntSymbol: data.gdntSymbol,
        m1: '',
        m2: '',
        m3: '',
        mean: ''
      }]);

      setStampCount(prev => prev + 1);
    }

    setShowStampPopup(false);
    setSelectedStamp(null);
  };

  const handleStampRectangleClick = (e, stampId) => {
    e.stopPropagation();
    setHighlightedId(prev => (prev === stampId ? null : stampId));
    const row = document.getElementById(`boc-row-${stampId}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleStampRightClick = (e, stamp) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedStampForMenu(stamp);
    setShowContextMenu(true);
  };

  const handleEditStamp = () => {
    const stampToEdit = stamps.find(s => s.id === selectedStampForMenu.id);
    const bocEntry = bocEntries.find(b => b.id === selectedStampForMenu.id);
    
    if (stampToEdit && bocEntry) {
      setIsEditMode(true);
      setEditingStamp(stampToEdit);
      setSelectedStamp(stampToEdit);
      setShowStampPopup(true);
      setShowContextMenu(false);
    }
  };

  const handleDeleteStamp = () => {
    setStamps(prev => prev.filter(s => s.id !== selectedStampForMenu.id));
    setBocEntries(prev => prev.filter(e => e.id !== selectedStampForMenu.id));
    
    if (highlightedId === selectedStampForMenu.id) {
      setHighlightedId(null);
    }
    
    if (selectedBocEntry?.id === selectedStampForMenu.id) {
      setSelectedBocEntry(null);
    }
    
    setShowContextMenu(false);
    setSelectedStampForMenu(null);
  };

  const handleBocRowClick = (entryId) => {
    setHighlightedId(prev => (prev === entryId ? null : entryId));
    const entry = bocEntries.find(e => e.id === entryId);
    setSelectedBocEntry(prev => (prev?.id === entryId ? null : entry));
  };

  const handleBocMouseDown = (e) => {
    if (e.target.closest('.boc-header')) {
      setIsDraggingBoc(true);
      setDragStart({
        x: e.clientX - bocPosition.x,
        y: e.clientY - bocPosition.y
      });
    }
  };

  const handleBocMouseMove = (e) => {
    if (isDraggingBoc) {
      setBocPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleBocMouseUp = () => {
    setIsDraggingBoc(false);
  };

  useEffect(() => {
    if (isDraggingBoc) {
      document.addEventListener('mousemove', handleBocMouseMove);
      document.addEventListener('mouseup', handleBocMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleBocMouseMove);
        document.removeEventListener('mouseup', handleBocMouseUp);
      };
    }
  }, [isDraggingBoc, dragStart]);

  const handleDragStart = (e, id) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedItem === id) return;
    setDraggedOverItem(id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedItem === draggedOverItem) return;
    
    const newBocEntries = [...bocEntries];
    const draggedIndex = newBocEntries.findIndex(item => item.id === draggedItem);
    const draggedOverIndex = newBocEntries.findIndex(item => item.id === draggedOverItem);
    
    const [movedItem] = newBocEntries.splice(draggedIndex, 1);
    newBocEntries.splice(draggedOverIndex, 0, movedItem);
    
    setBocEntries(newBocEntries);
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleRightResizeStart = (e) => {
    e.preventDefault();
    setIsResizingRight(true);
  };

  const handleBottomResizeStart = (e) => {
    e.preventDefault();
    setIsResizingBottom(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          setRightPanelWidth(newWidth);
        }
      }
      if (isResizingBottom) {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight >= 150 && newHeight <= 600) {
          setBottomPanelHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
      setIsResizingBottom(false);
    };

    if (isResizingRight || isResizingBottom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingRight, isResizingBottom]);

  const handleBocDragStart = (e) => {
    e.preventDefault();
    setIsDraggingBoc(true);
    setBocPanelY(e.clientY);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = bocEntries.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(bocEntries.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleMeasurementChange = (id, field, value) => {
    setBocEntries(prevEntries => {
      return prevEntries.map(entry => {
        if (entry.id === id) {
          const updatedEntry = {
            ...entry,
            [field]: value
          };
          
          const m1 = parseFloat(updatedEntry.m1);
          const m2 = parseFloat(updatedEntry.m2);
          const m3 = parseFloat(updatedEntry.m3);
          
          if (!isNaN(m1) && !isNaN(m2) && !isNaN(m3)) {
            updatedEntry.mean = ((m1 + m2 + m3) / 3).toFixed(4);
          } else {
            updatedEntry.mean = '';
          }
          
          return updatedEntry;
        }
        return entry;
      });
    });
  };

  const handleAddCharacteristic = (e) => {
    e.preventDefault();
    
    setBocEntries(prev => [
      ...prev,
      {
        ...newCharacteristic,
        m1: '',
        m2: '',
        m3: '',
        mean: ''
      }
    ]);
    
    setShowAddCharacteristic(false);
    setNewCharacteristic({
      id: '',
      nominalValue: '',
      upperTolerance: '',
      lowerTolerance: '',
      instrument: '',
      gdntSymbol: ''
    });
    setCurrentSelection(null);
  };

  // Mock function to detect dimensions on the PDF
  const detectDimensions = () => {
    // In a real implementation, this would use a PDF parsing library or OCR
    // For now, we'll return mock data
    const mockDimensions = [
      { id: 1, x: 100, y: 150, width: 200, height: 30, value: '10.00 ±0.1' },
      { id: 2, x: 350, y: 200, width: 150, height: 30, value: 'R5.00' },
      { id: 3, x: 500, y: 300, width: 180, height: 30, value: '45°' },
    ];
    setDimensions(mockDimensions);
    return mockDimensions;
  };

  const handleAutoBalloonClick = () => {
    // Detect dimensions on the PDF
    const detectedDimensions = detectDimensions();
    
    // Add detected dimensions to BOC entries
    const newEntries = detectedDimensions.map((dim, index) => ({
      id: `DIM-${Date.now()}-${index}`,
      nominalValue: dim.value.split('±')[0].trim(),
      upperTolerance: dim.value.includes('±') ? dim.value.split('±')[1].trim() : '',
      lowerTolerance: dim.value.includes('±') ? dim.value.split('±')[1].trim() : '',
      instrument: 'Auto-detected',
      gdntSymbol: 'position', // Default GD&T symbol
      m1: '',
      m2: '',
      m3: '',
      mean: ''
    }));
    
    setBocEntries(prev => [...prev, ...newEntries]);
    
    // Show success message
    alert(`Auto-ballooning completed. Added ${newEntries.length} dimensions.`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-gray-200 border-b">
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

        <div className="flex items-center p-1 space-x-2">
          <div className="flex items-center space-x-1 border-r pr-2">
            <button className="p-1 hover:bg-gray-300 rounded" title="Select">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7 10h12" />
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
          </div>

          <div className="flex items-center space-x-1">
            <button 
              className="p-1 hover:bg-gray-300 rounded"
              onClick={handleAutoBalloonClick}
              title="Auto Ballooning"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          </div>
        </div>
      </div>


      <div className="flex flex-1" style={{ height: `calc(100vh - ${bottomPanelHeight}px - 100px)` }}>
        <div className="flex-1 relative" style={{ flex: '1 1 70%' }}>
          {activeTab === 'drawing' && !pdfUrl && (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Drawing Available</h3>
                <p className="text-gray-500 mb-4">No 2D drawing has been uploaded for this part.</p>
                <p className="text-sm text-gray-400">Please upload a drawing file (PDF, DWG, or DXF) from the Dashboard.</p>
              </div>
            </div>
          )}
          {activeTab === 'drawing' && pdfUrl && (
            <div 
              ref={drawingRef}
              className="h-full relative overflow-auto"
            >
              <div 
                style={{ 
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  position: 'relative',
                  width: 'fit-content',
                  minWidth: '100%',
                  minHeight: '100%'
                }}
              >
                <div className="relative">
                  <object
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full block"
                    style={{ 
                      pointerEvents: 'none',
                      minHeight: '100vh',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <p>Unable to display PDF</p>
                  </object>
                  
                  {/* Overlay for dimension markers */}
                  <div 
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 2 }}
                  >
                    {dimensions.map((dim) => (
                      <div 
                        key={dim.id}
                        className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30 flex items-center justify-center"
                        style={{
                          left: `${dim.x}px`,
                          top: `${dim.y}px`,
                          width: `${dim.width}px`,
                          height: `${dim.height}px`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {dim.id}
                        </div>
                        <div className="text-blue-500 font-medium">
                          {dim.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={overlayRef}
                  className="absolute"
                  style={{
                    cursor: isStamping ? 'crosshair' : 'default',
                    pointerEvents: isStamping ? 'auto' : 'none',
                    zIndex: 10,
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                  onMouseDown={handleOverlayMouseDown}
                  onMouseMove={handleOverlayMouseMove}
                  onMouseUp={handleOverlayMouseUp}
                  onMouseLeave={handleOverlayMouseUp}
                >
                  {isDrawing && (
                    <div
                      className="absolute border-2 border-blue-500 pointer-events-none"
                      style={{
                        left: `${Math.min(startPoint.x, currentPoint.x)}px`,
                        top: `${Math.min(startPoint.y, currentPoint.y)}px`,
                        width: `${Math.abs(currentPoint.x - startPoint.x)}px`,
                        height: `${Math.abs(currentPoint.y - startPoint.y)}px`,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                      }}
                    />
                  )}
                </div>

                <div className="absolute pointer-events-none" style={{ zIndex: 11, top: 0, left: 0, width: '100%', height: '100%' }}>
                  {stamps.map((stamp) => {
                    const isHighlighted = highlightedId === stamp.id;

                    return (
                      <div
                        key={stamp.id}
                        className={`stamp-rectangle absolute border-2 group transition-all duration-200 ${
                          isHighlighted 
                            ? 'border-yellow-400 ring-4 ring-yellow-400 ring-opacity-50' 
                            : 'border-blue-500 hover:border-blue-600'
                        }`}
                        style={{
                          left: `${stamp.startX}px`,
                          top: `${stamp.startY}px`,
                          width: `${stamp.width}px`,
                          height: `${stamp.height}px`,
                          backgroundColor: 'transparent',
                          pointerEvents: 'auto',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => handleStampRectangleClick(e, stamp.id)}
                        onContextMenu={(e) => handleStampRightClick(e, stamp)}
                      >
                        <div
                          className={`absolute -top-4 -right-4 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 transition-all duration-200 ${
                            isHighlighted 
                              ? 'bg-yellow-500 border-yellow-300 scale-110' 
                              : 'bg-red-500 border-white'
                          }`}
                          style={{ fontSize: '14px', zIndex: 20 }}
                        >
                          {stamp.id}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {activeTab === '3dmodel' && (
            <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="h-full w-full flex flex-col p-6">
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg p-4 mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)',
                      backgroundSize: '50px 50px'
                    }}></div>
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-8">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">File</div>
                          <div className="text-sm text-white font-medium">
                            {location.state?.drawing3D instanceof File ? location.state.drawing3D.name : 'No file loaded'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40 group-hover:bg-blue-500/30 transition">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Rotate</div>
                          <div className="text-sm text-white">Left Click + Drag</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/40 group-hover:bg-green-500/30 transition">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Zoom</div>
                          <div className="text-sm text-white">Scroll Wheel</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 group">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40 group-hover:bg-purple-500/30 transition">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400 font-medium">Pan</div>
                          <div className="text-sm text-white">Right Click + Drag</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-xs font-medium text-gray-300">Rendering Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-white rounded-lg shadow-sm relative overflow-hidden">
                  <STEPViewer stepFile={location.state?.drawing3D} />
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === 'drawing' && (
          <div className="border-l bg-white flex flex-col relative overflow-hidden" style={{ width: `${rightPanelWidth}px`, flexShrink: 0 }}>
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize bg-gray-300 hover:bg-blue-400 transition-colors z-10 flex items-center justify-center"
            onMouseDown={handleRightResizeStart}
            style={{ 
              backgroundColor: isResizingRight ? '#3b82f6' : '#d1d5db',
              width: '4px'
            }}
          >
            <div className="w-1 h-12 bg-gray-400 rounded-full"></div>
          </div>

          <div className="flex flex-col border-t" style={{ height: bocPanelHeight }}>
            <div 
              className="h-2 bg-gray-100 hover:bg-blue-100 cursor-ns-resize flex items-center justify-center"
              onMouseDown={handleBocDragStart}
            >
              <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
            </div>
            <div className="p-2 bg-gray-100 font-medium text-sm flex justify-between items-center border-b">
              <span>Bill of Characteristics</span>
              {bocEntries.length > 0 && (
                <div className="text-xs text-gray-500">
                  Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, bocEntries.length)} of {bocEntries.length}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Nominal</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Upper Tol</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500">Lower Tol</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Instrument</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Dimension</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">M1</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">M2</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">M3</th>
                    <th className="p-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Mean</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentRows.map((entry) => {
                    const isRowHighlighted = highlightedId === entry.id;
                    return (
                      <tr
                        id={`boc-row-${entry.id}`}
                        key={entry.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, entry.id)}
                        onDragOver={(e) => handleDragOver(e, entry.id)}
                        onDrop={handleDrop}
                        onDragEnd={handleDragEnd}
                        className={`boc-row cursor-move transition-all duration-200 ${
                          isRowHighlighted 
                            ? 'bg-yellow-100 hover:bg-yellow-200' 
                            : 'hover:bg-gray-50'
                        } ${draggedItem === entry.id ? 'opacity-50' : ''} ${
                          draggedOverItem === entry.id ? 'border-t-2 border-blue-500' : ''
                        }`}
                        onClick={() => handleBocRowClick(entry.id)}
                      >
                        <td className="p-2 font-medium">{entry.id}</td>
                        <td className="p-2">{entry.nominalValue}</td>
                        <td className="p-2">{entry.upperTolerance}</td>
                        <td className="p-2">{entry.lowerTolerance}</td>
                        <td className="p-2 hidden md:table-cell">{entry.instrument}</td>
                        <td className="p-2 hidden md:table-cell">{getGdntSymbolDisplay(entry.gdntSymbol)}</td>
                        <td className={`p-2 hidden md:table-cell ${
                          entry.m1 && isWithinTolerance(entry.m1, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                            ? 'bg-green-100' 
                            : entry.m1 
                              ? 'bg-red-100' 
                              : ''
                        }`}>
                          <input
                            type="number"
                            step="0.0001"
                            className={`w-full p-1 border rounded text-sm ${
                              entry.m1 && isWithinTolerance(entry.m1, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                                ? 'bg-green-50' 
                                : entry.m1 
                                  ? 'bg-red-50' 
                                  : ''
                            }`}
                            value={entry.m1 || ''}
                            onChange={(e) => handleMeasurementChange(entry.id, 'm1', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={`p-2 hidden md:table-cell ${
                          entry.m2 && isWithinTolerance(entry.m2, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                            ? 'bg-green-100' 
                            : entry.m2 
                              ? 'bg-red-100' 
                              : ''
                        }`}>
                          <input
                            type="number"
                            step="0.0001"
                            className={`w-full p-1 border rounded text-sm ${
                              entry.m2 && isWithinTolerance(entry.m2, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                                ? 'bg-green-50' 
                                : entry.m2 
                                  ? 'bg-red-50' 
                                  : ''
                            }`}
                            value={entry.m2 || ''}
                            onChange={(e) => handleMeasurementChange(entry.id, 'm2', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={`p-2 hidden md:table-cell ${
                          entry.m3 && isWithinTolerance(entry.m3, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                            ? 'bg-green-100' 
                            : entry.m3 
                              ? 'bg-red-100' 
                              : ''
                        }`}>
                          <input
                            type="number"
                            step="0.0001"
                            className={`w-full p-1 border rounded text-sm ${
                              entry.m3 && isWithinTolerance(entry.m3, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                                ? 'bg-green-50' 
                                : entry.m3 
                                  ? 'bg-red-50' 
                                  : ''
                            }`}
                            value={entry.m3 || ''}
                            onChange={(e) => handleMeasurementChange(entry.id, 'm3', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={`p-2 hidden md:table-cell ${
                          entry.mean && isWithinTolerance(entry.mean, entry.nominalValue, entry.upperTolerance, entry.lowerTolerance) 
                            ? 'bg-green-100' 
                            : entry.mean 
                              ? 'bg-red-100' 
                              : ''
                        }`}>
                          {entry.mean || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {bocEntries.length > rowsPerPage && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 text-sm rounded ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                  Previous
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-8 h-8 rounded-full text-sm ${
                        currentPage === number
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 text-sm rounded ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {selectedBocEntry && (
            <div className="flex-1 overflow-auto">
              <div className="p-2 bg-gray-100 font-medium text-sm border-b">Characteristic Details</div>
              <div className="p-3 space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-gray-600 font-medium">ID:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{selectedBocEntry.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Nominal Value:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{selectedBocEntry.nominalValue}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">GD&T Symbol:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-lg">{getGdntSymbolDisplay(selectedBocEntry.gdntSymbol)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Upper Tolerance:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{selectedBocEntry.upperTolerance}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Lower Tolerance:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{selectedBocEntry.lowerTolerance}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Total Tolerance:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">{(parseFloat(selectedBocEntry.upperTolerance) + Math.abs(parseFloat(selectedBocEntry.lowerTolerance))).toFixed(3)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Tolerance Range:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {(parseFloat(selectedBocEntry.nominalValue) - Math.abs(parseFloat(selectedBocEntry.lowerTolerance))).toFixed(3)} - {(parseFloat(selectedBocEntry.nominalValue) + parseFloat(selectedBocEntry.upperTolerance)).toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Instrument:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded capitalize">{selectedBocEntry.instrument}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Status:</span>
                    <div className="mt-1 p-2 bg-gray-50 rounded">
                      {selectedBocEntry.m1 && selectedBocEntry.m2 && selectedBocEntry.m3 ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </div>
                
                {(selectedBocEntry.m1 || selectedBocEntry.m2 || selectedBocEntry.m3) && (
                  <div className="border-t pt-3 mt-3">
                    <span className="text-gray-600 font-medium">Measurements:</span>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">M1</div>
                        <div className={`text-sm font-medium ${isWithinTolerance(selectedBocEntry.m1, selectedBocEntry.nominalValue, selectedBocEntry.upperTolerance, selectedBocEntry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedBocEntry.m1 || '-'}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">M2</div>
                        <div className={`text-sm font-medium ${isWithinTolerance(selectedBocEntry.m2, selectedBocEntry.nominalValue, selectedBocEntry.upperTolerance, selectedBocEntry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedBocEntry.m2 || '-'}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">M3</div>
                        <div className={`text-sm font-medium ${isWithinTolerance(selectedBocEntry.m3, selectedBocEntry.nominalValue, selectedBocEntry.upperTolerance, selectedBocEntry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedBocEntry.m3 || '-'}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Mean</div>
                        <div className={`text-sm font-medium ${isWithinTolerance(selectedBocEntry.mean, selectedBocEntry.nominalValue, selectedBocEntry.upperTolerance, selectedBocEntry.lowerTolerance) ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedBocEntry.mean || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={() => navigate('/fai', { 
                      state: { 
                        bocEntries, 
                        selectedBocEntry,
                        projectDetails: {
                          partName: location.state?.drawing2D?.name || location.state?.drawing3D?.name || 'Unknown Part',
                          partNumber: partId || 'N/A',
                          revision: 'A',
                          customer: 'TBD',
                          drawingFile: location.state?.drawing2D?.name || location.state?.drawing3D?.name || 'N/A'
                        }
                      } 
                    })}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      {showContextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[150px]"
          style={{
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center space-x-2 text-gray-700"
            onClick={handleEditStamp}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit</span>
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center space-x-2 text-red-600"
            onClick={handleDeleteStamp}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Delete</span>
          </button>
        </div>
      )}

      {showStampPopup && selectedStamp && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => {
              setShowStampPopup(false);
              setIsEditMode(false);
              setEditingStamp(null);
            }}
          />
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
                <h3 className="text-lg font-semibold">
                  {isEditMode ? 'Edit Characteristic' : 'Add Characteristic'}
                </h3>
                <button 
                  onClick={() => {
                    setShowStampPopup(false);
                    setIsEditMode(false);
                    setEditingStamp(null);
                  }}
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
                    stampId: isEditMode ? editingStamp.id : stampCount,
                    nominalValue: formData.get('nominal'),
                    upperTolerance: formData.get('upperTol'),
                    lowerTolerance: formData.get('lowerTol'),
                    instrument: formData.get('instrument'),
                    gdntSymbol: formData.get('gdntSymbol')
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
                      value={isEditMode ? editingStamp.id : stampCount}
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
                      defaultValue={isEditMode ? bocEntries.find(b => b.id === editingStamp.id)?.nominalValue : ''}
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
                      defaultValue={isEditMode ? bocEntries.find(b => b.id === editingStamp.id)?.upperTolerance : ''}
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
                      defaultValue={isEditMode ? bocEntries.find(b => b.id === editingStamp.id)?.lowerTolerance : ''}
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
                      defaultValue={isEditMode ? bocEntries.find(b => b.id === editingStamp.id)?.instrument : ''}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">Select Instrument</option>
                      <option value="caliper">Caliper</option>
                      <option value="micrometer">Micrometer</option>
                      <option value="cmm">CMM</option>
                      <option value="heightGauge">Height Gauge</option>
                      <option value="gdntSymbol">GD&T Symbol</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimension
                    </label>
                    <select
                      name="gdntSymbol"
                      defaultValue={isEditMode ? bocEntries.find(b => b.id === editingStamp.id)?.gdntSymbol : ''}
                      className="w-full border rounded-md px-3 py-2"
                    >
                      <option value="">Select Dimension (Optional)</option>
                      <option value="straightness">⏤ Straightness</option>
                      <option value="flatness">□ Flatness</option>
                      <option value="circularity">○ Circularity</option>
                      <option value="cylindricity">⌭ Cylindricity</option>
                      <option value="parallelism">∥ Parallelism</option>
                      <option value="perpendicularity">⊥ Perpendicularity</option>
                      <option value="angularity">∠ Angularity</option>
                      <option value="position">⌖ Position</option>
                      <option value="concentricity">◎ Concentricity</option>
                      <option value="symmetry">⌯ Symmetry</option>
                      <option value="runout">↗ Runout</option>
                      <option value="totalRunout">↗ Total Runout</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStampPopup(false);
                      setIsEditMode(false);
                      setEditingStamp(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isEditMode ? 'Update Stamp' : 'Add Stamp'}
                  </button>
                </div>
              </form>
            </div>
          </dialog>
        </>
      )}

      {showAddCharacteristic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Characteristic</h2>
              <button 
                onClick={() => setShowAddCharacteristic(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddCharacteristic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  name="id"
                  value={newCharacteristic.id}
                  onChange={(e) => setNewCharacteristic({...newCharacteristic, id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Value</label>
                <input
                  type="text"
                  name="nominalValue"
                  value={newCharacteristic.nominalValue}
                  onChange={(e) => setNewCharacteristic({...newCharacteristic, nominalValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimension
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={`${currentSelection?.width} x ${currentSelection?.height}`}
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GD&T Symbol
                  </label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newCharacteristic.gdntSymbol}
                    onChange={(e) => setNewCharacteristic(prev => ({
                      ...prev,
                      gdntSymbol: e.target.value
                    }))}
                    required
                  >
                    <option value="">Select GD&T Symbol</option>
                    <option value="straightness">⏤ Straightness</option>
                    <option value="flatness">□ Flatness</option>
                    <option value="circularity">○ Circularity</option>
                    <option value="cylindricity">⌭ Cylindricity</option>
                    <option value="parallelism">∥ Parallelism</option>
                    <option value="perpendicularity">⊥ Perpendicularity</option>
                    <option value="angularity">∠ Angularity</option>
                    <option value="position">⌖ Position</option>
                    <option value="concentricity">◎ Concentricity</option>
                    <option value="symmetry">⌯ Symmetry</option>
                    <option value="runout">↗ Runout</option>
                    <option value="totalRunout">↗ Total Runout</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nominal Value
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full p-2 border rounded"
                    value={newCharacteristic.nominalValue}
                    onChange={(e) => setNewCharacteristic(prev => ({
                      ...prev,
                      nominalValue: e.target.value
                    }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upper Tolerance
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full p-2 border rounded"
                      value={newCharacteristic.upperTolerance}
                      onChange={(e) => setNewCharacteristic(prev => ({
                        ...prev,
                        upperTolerance: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lower Tolerance
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full p-2 border rounded"
                      value={newCharacteristic.lowerTolerance}
                      onChange={(e) => setNewCharacteristic(prev => ({
                        ...prev,
                        lowerTolerance: e.target.value
                      }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instrument
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={newCharacteristic.instrument}
                    onChange={(e) => setNewCharacteristic(prev => ({
                      ...prev,
                      instrument: e.target.value
                    }))}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                  onClick={() => setShowAddCharacteristic(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Characteristic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}