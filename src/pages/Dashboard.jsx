import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatePartModal from '../components/modals/CreatePartModal.jsx';

export default function Dashboard() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  const [partsData, setPartsData] = useState([]);

  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    newExpanded.has(id) ? newExpanded.delete(id) : newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const addSubRow = (parentId) => {
    const newSubRow = {
      id: Date.now(),
      operationNumber: '',
      description: '',
      drawing: null,
      drawingUrl: '',
      partNumber: '',
      partName: 'New Operation',
      status: 'Draft',
      isEditing: true
    };

    setPartsData((prev) =>
      prev.map((part) =>
        part.id === parentId
          ? { ...part, subRows: [...part.subRows, newSubRow] }
          : part
      )
    );

    if (!expandedRows.has(parentId)) toggleRow(parentId);
  };

  const updateSubRow = (parentId, subId, field, value) => {
    setPartsData((prev) =>
      prev.map((part) =>
        part.id === parentId
          ? {
              ...part,
              subRows: part.subRows.map((sub) =>
                sub.id === subId
                  ? field === 'drawing'
                    ? {
                        ...sub,
                        drawing: value,
                        drawingUrl: value ? URL.createObjectURL(value) : ''
                      }
                    : { ...sub, [field]: value }
                  : sub
              )
            }
          : part
      )
    );
  };

  const saveSubRow = (parentId, subId) => {
    setPartsData((prev) =>
      prev.map((part) =>
        part.id === parentId
          ? {
              ...part,
              subRows: part.subRows.map((sub) =>
                sub.id === subId ? { ...sub, isEditing: false } : sub
              )
            }
          : part
      )
    );
  };

  const deleteSubRow = (parentId, subId) => {
    setPartsData((prev) =>
      prev.map((part) =>
        part.id === parentId
          ? {
              ...part,
              subRows: part.subRows.filter((sub) => sub.id !== subId)
            }
          : part
      )
    );
  };

  // Route to Inspection Plan (for main part or sub-operation)
  const handleInspectionPlanClick = (part) => {
    console.log('Dashboard - part object:', part);
    console.log('Dashboard - part.drawing2D:', part.drawing2D);
    console.log('Dashboard - part.drawing3D:', part.drawing3D);
    
    navigate(`/inspection/${part.id}`, {
      state: {
        drawing2D: part.drawing2D || part.drawing,
        drawing3D: part.drawing3D
      }
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800';
      case 'Draft': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    return () => {
      partsData.forEach((part) => {
        part.subRows.forEach((sub) => {
          if (sub.drawingUrl) URL.revokeObjectURL(sub.drawingUrl);
        });
      });
    };
  }, [partsData]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 flex items-center p-2 space-x-2 shadow-sm">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Part
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19" />
          </svg>
          Open
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-lg h-full overflow-hidden">
          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Inspection Data</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search parts..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Status</option>
                <option>Active</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12"></th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Project Name</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">2D</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">3D</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">RC</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partsData.map((part) => (
                  <React.Fragment key={part.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-3 py-4">
                        <button
                          onClick={() => toggleRow(part.id)}
                          className="text-gray-500 hover:text-gray-700 transition"
                        >
                          {expandedRows.has(part.id) ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </td>
                      {/* Project Name */}
                      <td className="px-6 py-4 font-medium text-gray-900">{part.project || '—'}</td>
                      
                      {/* 2D */}
                      <td className="px-6 py-4 text-center">
                        {part.drawing2D ? (
                          <span className="text-green-600 text-sm font-medium" title={part.drawing2D.name}>
                            {part.drawing2D.name.length > 15 
                              ? `${part.drawing2D.name.substring(0, 15)}...` 
                              : part.drawing2D.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      
                      {/* 3D */}
                      <td className="px-6 py-4 text-center">
                        {part.drawing3D ? (
                          <span className="text-blue-600 text-sm font-medium" title={part.drawing3D.name}>
                            {part.drawing3D.name.length > 15 
                              ? `${part.drawing3D.name.substring(0, 15)}...` 
                              : part.drawing3D.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      
                      {/* RC */}
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-400">—</span>
                      </td>
                      
                      {/* Plan */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleInspectionPlanClick(part)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          View Plan
                        </button>
                      </td>
                      
                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(part.status)}`}>
                          {part.status || 'Draft'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-4 text-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 font-medium p-1 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 font-medium p-1 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => addSubRow(part.id)}
                          className="text-green-600 hover:text-green-800 font-medium p-1 hover:bg-green-50 rounded"
                          title="Add Operation"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </td>
                    </tr>

                    {/* Sub Rows - One Row Each */}
                    {expandedRows.has(part.id) &&
                      part.subRows.map((sub) => (
                        <tr key={sub.id} className="bg-gradient-to-r from-indigo-50 to-white border-l-4 border-indigo-400">
                          {/* Arrow (empty) */}
                          <td className="px-3 py-3"></td>

                          {/* Operation # */}
                          <td className="px-6 py-3 text-sm font-medium text-indigo-700">
                            {sub.isEditing ? (
                              <input
                                type="text"
                                value={sub.operationNumber}
                                onChange={(e) => updateSubRow(part.id, sub.id, 'operationNumber', e.target.value)}
                                placeholder="10"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : (
                              sub.operationNumber || '—'
                            )}
                          </td>

                          {/* Description */}
                          <td className="px-6 py-3 text-sm text-gray-700" colSpan={2}>
                            {sub.isEditing ? (
                              <textarea
                                value={sub.description}
                                onChange={(e) => updateSubRow(part.id, sub.id, 'description', e.target.value)}
                                placeholder="Operation description..."
                                rows={1}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : (
                              sub.description || '—'
                            )}
                          </td>

                          {/* Upload Drawing (Edit Mode Only) */}
                          <td className="px-6 py-3 text-sm">
                            {sub.isEditing ? (
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => updateSubRow(part.id, sub.id, 'drawing', e.target.files[0])}
                                className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                            ) : null}
                          </td>

                          {/* View Plan Button (After Upload) */}
                          <td className="px-6 py-3">
                            {sub.drawingUrl ? (
                              <button
                                onClick={() => handleInspectionPlanClick(sub)}
                                className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
                              >
                                View Plan
                              </button>
                            ) : sub.isEditing ? (
                              <span className="text-gray-400 text-xs">Upload to view</span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>

                          {/* Part # */}
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {sub.isEditing ? (
                              <input
                                type="text"
                                value={sub.partNumber}
                                onChange={(e) => updateSubRow(part.id, sub.id, 'partNumber', e.target.value)}
                                placeholder="SUB-001"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              sub.partNumber || '—'
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-3">
                            {sub.isEditing ? (
                              <select
                                value={sub.status}
                                onChange={(e) => updateSubRow(part.id, sub.id, 'status', e.target.value)}
                                className="px-2 py-1 text-xs border border-gray-300 rounded"
                              >
                                <option>Draft</option>
                                <option>Active</option>
                                <option>Completed</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClass(sub.status)}`}>
                                {sub.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3 text-sm space-x-1">
                            {sub.isEditing ? (
                              <>
                                <button
                                  onClick={() => saveSubRow(part.id, sub.id)}
                                  className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => deleteSubRow(part.id, sub.id)}
                                  className="text-red-600 hover:text-red-800 font-medium text-xs"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => updateSubRow(part.id, sub.id, 'isEditing', true)}
                                  className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSubRow(part.id, sub.id)}
                                  className="text-red-600 hover:text-red-800 font-medium text-xs"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreatePartModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(newPart) => {
          setPartsData((prev) => [...prev, { ...newPart, id: prev.length + 1, subRows: [] }]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}