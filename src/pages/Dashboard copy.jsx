import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import createPartStore from '../store/createPart';
import CreatePartModal from '../components/modals/CreatePartModal';

const ActionMenu = ({ part, onView, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action) => {
    setIsOpen(false);
    switch(action) {
      case 'view':
        onView(part);
        break;
      case 'edit':
        onEdit(part);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${part.partNumber}?`)) {
          onDelete(part);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          id="options-menu"
          aria-haspopup="true"
          aria-expanded="true"
        >
          <span className="sr-only">Open options</span>
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleAction('view')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              View Details
            </button>
            <button
              onClick={() => handleAction('edit')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
            >
              Edit
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-800"
              role="menuitem"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = observer(() => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [expandedRow, setExpandedRow] = useState(null);
  const [editingPart, setEditingPart] = useState(null);
  const [editedPart, setEditedPart] = useState({
    partNumber: '',
    drawing2D: null,
    drawing3D: null
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = parts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(parts.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fetch all parts on component mount
  useEffect(() => {
    const fetchAllParts = async () => {
      try {
        setIsLoading(true);
        const partsData = await createPartStore.getAllParts();
        console.log('Fetched parts data:', JSON.parse(JSON.stringify(partsData))); // Add this line to log the exact structure
        setParts(partsData);
        setCurrentPage(1); // Reset to first page when data changes
      } catch (error) {
        console.error('Failed to fetch parts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllParts();
  }, []);

  // Function to refresh parts list
  const refreshParts = async () => {
    try {
      setIsLoading(true);
      const partsData = await createPartStore.getAllParts();
      setParts(partsData);
      setCurrentPage(1); // Reset to first page on refresh
    } catch (error) {
      console.error('Failed to refresh parts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful part creation
  const handlePartCreated = async () => {
    await refreshParts();
  };

  const handleViewPart = (part) => {
    console.log('View part:', part.partNumber);
    // Add your view logic here
  };

  const handleEditPart = (part) => {
    console.log('Edit part:', part.partNumber);
    // Add your edit logic here
  };

  const handleDeletePart = async (part) => {
    try {
      console.log('Delete part:', part.partNumber);
      // Add your delete logic here
      // Example: await api.delete(`/parts/${part.id}`);
      // Refresh the parts list after deletion
      await refreshParts();
    } catch (error) {
      console.error('Error deleting part:', error);
    }
  };

  const handleAddClick = (partNumber) => {
    setExpandedRow(expandedRow === partNumber ? null : partNumber);
  };

  const handleAddOperation = (partNumber) => {
    console.warn('Operations functionality has been removed');
  };

  const handleFileChange = (e, type) => {
    console.warn('File change handling has been modified due to operations removal');
  };

  const handleEditClick = (part) => {
    setEditingPart(part.partNumber);
    setEditedPart({
      partNumber: part.partNumber,
      drawing2D: part.drawing2D || null,
      drawing3D: part.drawing3D || null
    });
  };

  const handleSaveEdit = async (partNumber) => {
    try {
      setIsLoading(true);
      await createPartStore.updatePart(partNumber, editedPart);
      await refreshParts();
      setEditingPart(null);
    } catch (error) {
      console.error('Failed to update part:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPart(null);
  };

  const handleEditedPartChange = (e) => {
    const { name, value } = e.target;
    setEditedPart(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditedFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setEditedPart(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          file,
          name: file.name
        }
      }));
    }
  };

  const handleViewPlan = async (partNumber) => {
    try {
      // Show loading state
      setIsLoading(true);
      
      // Get the 2D drawing as a blob
      const blob = await createPartStore.get2DDrawingBlob(partNumber);
      
      // Create a blob URL for the PDF
      const drawingUrl = URL.createObjectURL(blob);
      
      // Navigate to InspectionPlans with the drawing data
      navigate('/inspection', { 
        state: { 
          partNumber,
          drawing2D: drawingUrl,
          drawingType: '2d',
          blobData: blob,
          fileName: `drawing_${partNumber}.pdf`
        } 
      });
    } catch (error) {
      console.error('Error handling view plan:', error);
      // Optionally show an error message to the user
      alert('Failed to load the drawing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Parts Management</h1>
          <div className="flex space-x-3">
            <button
              onClick={refreshParts}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              <svg className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Part
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 h-[calc(100vh-80px)]">
        {/* Pagination Controls - Moved to top */}
        {!isLoading && parts.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-t-lg mb-0">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, parts.length)}
                  </span>{' '}
                  of <span className="font-medium">{parts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                    </svg>
                  </button>
                  
                  {pageNumbers.map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === number 
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg w-full max-w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Part Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    2D Drawing
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    3D Model
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                    Actions
                  </th>
                
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length > 0 ? (
                  currentItems.map((part) => (
                    <React.Fragment key={part.partNumber}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingPart === part.partNumber ? (
                            <input
                              type="text"
                              name="partNumber"
                              value={editedPart.partNumber}
                              onChange={handleEditedPartChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 px-2 border"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{part.partNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingPart === part.partNumber ? (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="file"
                                  accept=".pdf,.dwg,.dxf"
                                  onChange={(e) => handleEditedFileChange(e, 'drawing2D')}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {editedPart.drawing2D?.name && (
                                  <span className="ml-2 text-sm text-gray-600">{editedPart.drawing2D.name}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">
                              {part.drawing2D?.name ? (
                                <div>
                                  <div className="font-medium mb-1">
                                    {part.drawing2D.name}
                                  </div>
                                  <button
                                    onClick={() => handleViewPlan(part.partNumber)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                  >
                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    View Plan
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-500">No file</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingPart === part.partNumber ? (
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="file"
                                  accept=".stp,.step,.stl,.3ds"
                                  onChange={(e) => handleEditedFileChange(e, 'drawing3D')}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {editedPart.drawing3D?.name && (
                                  <span className="ml-2 text-sm text-gray-600">{editedPart.drawing3D.name}</span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">
                              {part.drawing3D?.name ? (
                                <div className="font-medium">
                                  {part.drawing3D.name}
                                </div>
                              ) : (
                                <span className="text-gray-500">No file</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.createdAt ? new Date(part.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center w-32">
                          <div className="flex justify-center space-x-2">
                            {editingPart === part.partNumber ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(part.partNumber)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Save"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Cancel"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditClick(part)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    // View action
                                    console.log('View part:', part.partNumber);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View"
                                >
                                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    // Delete action
                                    console.log('Delete part:', part.partNumber);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRow === part.partNumber && (
                        <tr className="bg-gray-50">
                          <td colSpan="5" className="px-0">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-gray-800">Part Details for {part.partNumber}</h3>
                                  <button
                                    onClick={() => setExpandedRow(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-2"
                                    title="Close"
                                  >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                          </svg>
                                          Part Details
                                        </div>
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          2D File
                                        </div>
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                          </svg>
                                          3D File
                                        </div>
                                      </th>
                                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center">
                                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                          Created At
                                        </div>
                                      </th>
                                      <th scope="col" className="relative px-4 py-3 w-24">
                                        <span className="sr-only">Actions</span>
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    <tr className="bg-white hover:bg-blue-50 transition-colors">
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0 h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center mr-3">
                                            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {part.partNumber}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {part.drawing2D?.name ? (
                                          <a href="#" className="flex items-center text-blue-600 hover:text-blue-800 hover:underline">
                                            <svg className="h-4 w-4 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            {part.drawing2D.name}
                                          </a>
                                        ) : (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            No file
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap">
                                        {part.drawing3D?.name ? (
                                          <a href="#" className="flex items-center text-blue-600 hover:text-blue-800 hover:underline">
                                            <svg className="h-4 w-4 mr-1.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            {part.drawing3D.name}
                                          </a>
                                        ) : (
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            No file
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {part.createdAt ? new Date(part.createdAt).toLocaleDateString() : 'N/A'}
                                      </td>
                                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-1">
                                          <button
                                            onClick={() => handleViewPlan(part.partNumber)}
                                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50"
                                            title="View Plan"
                                          >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No parts found. Create a new part to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Pagination Controls - Kept at bottom for mobile */}
        {!isLoading && parts.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-b border-gray-200 sm:hidden">
            <div className="flex-1 flex justify-between">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Part Modal */}
      <CreatePartModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handlePartCreated}
        onViewPlan={refreshParts}
      />
    </div>
  );
});

export default Dashboard;