import { useState, useRef, useEffect } from 'react';

const generatePartNumber = () => {
  const prefix = 'PN-';
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
};

export default function CreatePartModal({ isOpen, onClose, onSave, onViewPlan }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploaded2DFile, setUploaded2DFile] = useState(null);
  const [uploaded3DFile, setUploaded3DFile] = useState(null);
  const [uploading, setUploading] = useState({ type: '', inProgress: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    partNumber: generatePartNumber(),
    project: '',
    customer: '',
    category: '',
    type: '',
    location: '',
    units: 'mm',
    material: '',
    description: '',
    manufacturingProcess: '',
    processNotes: '',
    qualityRequirements: '',
    specialInstructions: ''
  });

  const file2DInputRef = useRef(null);
  const file3DInputRef = useRef(null);

  const handleFileChange = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      setUploading({ type, inProgress: true });
      
      // Store the actual File object along with metadata
      const fileData = {
        file: file, // Keep the actual File object
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        lastModified: new Date(file.lastModified).toLocaleDateString()
      };
      
      if (type === '2d') {
        setUploaded2DFile(fileData);
      } else {
        setUploaded3DFile(fileData);
      }
      
      setUploading({ type: '', inProgress: false });
    }
  };

  const handleSubmit = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const partData = {
        ...formData,
        drawing2D: uploaded2DFile?.file || null,  // Extract the actual File object
        drawing3D: uploaded3DFile?.file || null,  // Extract the actual File object
        status: 'Draft'
      };
      
      console.log('CreatePartModal - Saving part with drawing2D:', partData.drawing2D);
      console.log('CreatePartModal - Saving part with drawing3D:', partData.drawing3D);
      
      onSave(partData);
      onClose();
    } catch (err) {
      setError('Failed to create part');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const renderFileUpload = (type) => {
    const file = type === '2d' ? uploaded2DFile : uploaded3DFile;
    const isUploading = uploading.inProgress && uploading.type === type;
    const accept = type === '2d' ? '.pdf,.dwg,.dxf' : '.step,.stp,.sldprt,.prt';
    const title = type === '2d' ? '2D Drawing' : '3D Model';
    const description = type === '2d' 
      ? 'Upload 2D drawings in PDF, DWG, or DXF format' 
      : 'Upload 3D models in STEP, STP, SLDPRT, or PRT format';

    return (
      <div className="h-full flex flex-col">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="flex-1 border-2 border-dashed rounded-lg flex items-center justify-center">
          <input
            type="file"
            ref={type === '2d' ? file2DInputRef : file3DInputRef}
            onChange={(e) => handleFileChange(e, type)}
            className="hidden"
            accept={accept}
          />
          
          {isUploading ? (
            <div className="text-center p-6">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Uploading file...</p>
            </div>
          ) : !file ? (
            <div className="text-center p-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-4 text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => (type === '2d' ? file2DInputRef : file3DInputRef).current?.click()}
                  className="text-blue-600 hover:text-blue-700 focus:outline-none"
                >
                  Click to upload
                </button>
                {" "}or drag and drop
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {description}
              </p>
            </div>
          ) : (
            <div className="w-full p-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => type === '2d' ? setUploaded2DFile(null) : setUploaded3DFile(null)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Part Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Part Number *</label>
                <input
                  type="text"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                <input
                  type="text"
                  name="project"
                  value={formData.project}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer *</label>
                <select
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Customer</option>
                  <option>High QA Engineering</option>
                  <option>ACME Corp</option>
                  <option>Global Industries</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  <option>Mechanical</option>
                  <option>Electrical</option>
                  <option>Assembly</option>
                  <option>Prototype</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Material</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Units</label>
                <select
                  name="units"
                  value={formData.units}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="in">Inches (in)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>
          </div>
        );
      case 2:
        return renderFileUpload('2d');
      case 3:
        return renderFileUpload('3d');
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Manufacturing Process</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturing Process *</label>
                <select
                  name="manufacturingProcess"
                  value={formData.manufacturingProcess}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Process</option>
                  <option>CNC Machining</option>
                  <option>3D Printing</option>
                  <option>Injection Molding</option>
                  <option>Sheet Metal</option>
                  <option>Castings</option>
                  <option>Fabrication</option>
                </select>
              </div>

            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create New Part</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}
                >
                  {step}
                </div>
                <span className={`text-xs mt-2 ${
                  currentStep >= step ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step === 1 ? 'Part Info' : 
                   step === 2 ? '2D Drawing' : 
                   step === 3 ? '3D Model' : 'Manufacturing'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                (currentStep === 1 && (!formData.partNumber || !formData.project || !formData.customer || !formData.category)) ||
                (currentStep === 4 && !formData.manufacturingProcess) || isSubmitting
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={
                (currentStep === 1 && (!formData.partNumber || !formData.project || !formData.customer || !formData.category)) ||
                (currentStep === 4 && !formData.manufacturingProcess) || isSubmitting
              }
            >
              {currentStep === 4 ? 'Create Part' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
