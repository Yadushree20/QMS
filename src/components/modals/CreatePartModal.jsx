import { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import createPartStore from '../../store/createPart';

const CreatePartModal = observer(({ isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    part_number: '',
    drawing_2d: null,
    drawing_2d_name: '',
    drawing_2d_version: '',
    drawing_3d: null,
    drawing_3d_name: '',
    drawing_3d_version: ''
  });
  
  const file2dInputRef = useRef(null);
  const file3dInputRef = useRef(null);

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === '2d' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('2D Drawing must be a PDF file');
        return;
      }
      if (type === '3d' && !file.name.toLowerCase().endsWith('.step') && !file.name.toLowerCase().endsWith('.stp')) {
        setError('3D Drawing must be a STEP file');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        [`drawing_${type}`]: file,
        [`drawing_${type}_name`]: file.name
      }));
      setError(null);
    }
  };

  const handleRemoveFile = (type) => {
    setFormData(prev => ({
      ...prev,
      [`drawing_${type}`]: null,
      [`drawing_${type}_name`]: ''
    }));
    
    const ref = type === '2d' ? file2dInputRef : file3dInputRef;
    if (ref.current) {
      ref.current.value = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.part_number) {
      setError('Part Number is required');
      return;
    }
    
    if (!formData.drawing_2d) {
      setError('2D Drawing is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('part_number', formData.part_number);
      formDataToSend.append('drawing_2d', formData.drawing_2d);
      formDataToSend.append('drawing_2d_name', formData.drawing_2d_name || formData.drawing_2d.name);
      formDataToSend.append('drawing_2d_version', formData.drawing_2d_version || '1.0');
      
      if (formData.drawing_3d) {
        formDataToSend.append('drawing_3d', formData.drawing_3d);
        formDataToSend.append('drawing_3d_name', formData.drawing_3d_name || formData.drawing_3d.name);
        formDataToSend.append('drawing_3d_version', formData.drawing_3d_version || '1.0');
      }

      // Log the form data being sent
      console.log('Sending form data:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
      }
      
      const response = await fetch('http://172.18.7.93:8800/drawings/parts/', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create part';
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          // Handle validation errors (422)
          if (response.status === 422 && errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => 
                `${err.loc?.join('.') || 'Field'}: ${err.msg || 'Invalid value'}`
              ).join('\n');
            } else if (typeof errorData.detail === 'string') {
              errorMessage = errorData.detail;
            }
          } else {
            errorMessage = errorData.message || errorData.detail || errorMessage;
          }
        } catch (e) {
          const errorText = await response.text();
          console.error('Error parsing error response:', e, 'Response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('Part created successfully:', result);
      
      if (onSave) await onSave(result);
      onClose();
      
      // Reset form
      setFormData({
        part_number: '',
        drawing_2d: null,
        drawing_2d_name: '',
        drawing_2d_version: '',
        drawing_3d: null,
        drawing_3d_name: '',
        drawing_3d_version: ''
      });
      
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err?.message || 'Failed to create part');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Part</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Part Number */}
            <div>
              <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 mb-1">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="part_number"
                name="part_number"
                value={formData.part_number}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* 2D Drawing Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">2D Drawing</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2D Drawing (PDF) <span className="text-red-500">*</span>
                </label>
                {!formData.drawing_2d ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-2d-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-2d-upload"
                            name="file-2d-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, '2d')}
                            ref={file2dInputRef}
                            disabled={isSubmitting}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md">
                    <div className="flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-sm font-medium text-gray-900 truncate max-w-xs">
                        {formData.drawing_2d_name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('2d')}
                      className="ml-4 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="drawing_2d_name" className="block text-sm font-medium text-gray-700 mb-1">
                    2D Drawing Name
                  </label>
                  <input
                    type="text"
                    id="drawing_2d_name"
                    name="drawing_2d_name"
                    value={formData.drawing_2d_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="drawing_2d_version" className="block text-sm font-medium text-gray-700 mb-1">
                    2D Drawing Version
                  </label>
                  <input
                    type="text"
                    id="drawing_2d_version"
                    name="drawing_2d_version"
                    value={formData.drawing_2d_version}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 1.0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* 3D Drawing Section */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">3D Drawing (Optional)</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  3D Drawing (STEP)
                </label>
                {!formData.drawing_3d ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-3d-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-3d-upload"
                            name="file-3d-upload"
                            type="file"
                            className="sr-only"
                            accept=".step,.stp"
                            onChange={(e) => handleFileChange(e, '3d')}
                            ref={file3dInputRef}
                            disabled={isSubmitting}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">STEP file up to 50MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md">
                    <div className="flex items-center">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-2 text-sm font-medium text-gray-900 truncate max-w-xs">
                        {formData.drawing_3d_name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile('3d')}
                      className="ml-4 text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="drawing_3d_name" className="block text-sm font-medium text-gray-700 mb-1">
                    3D Drawing Name
                  </label>
                  <input
                    type="text"
                    id="drawing_3d_name"
                    name="drawing_3d_name"
                    value={formData.drawing_3d_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="drawing_3d_version" className="block text-sm font-medium text-gray-700 mb-1">
                    3D Drawing Version
                  </label>
                  <input
                    type="text"
                    id="drawing_3d_version"
                    name="drawing_3d_version"
                    value={formData.drawing_3d_version}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 1.0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting || !formData.part_number || !formData.drawing_2d}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : 'Create Part'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CreatePartModal;
