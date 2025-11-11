import { makeAutoObservable } from 'mobx';

class CreatePartStore {
  isLoading = false;
  error = null;
  success = false;
  pdfList = [];

  constructor() {
    makeAutoObservable(this);
    this.fetchAllPDFs();
  }

  fetchAllPDFs = async () => {
    this.isLoading = true;
    this.error = null;
    
    try {
      console.log('Fetching PDFs from: http://172.18.100.67:8987/api/pdfs');
      const response = await fetch('http://172.18.100.67:8987/api/pdfs');
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch PDFs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched PDFs data:', data);
      
      // Extract the pdfs array from the response
      const pdfs = data.pdfs || [];
      this.pdfList = Array.isArray(pdfs) ? pdfs : [];
      
      console.log('Updated pdfList:', this.pdfList);
      return this.pdfList;
      
    } catch (error) {
      console.error('Error in fetchAllPDFs:', error);
      this.error = error.message;
      this.pdfList = [];
      return [];
    } finally {
      this.isLoading = false;
    }
  };

  createPart = async (formData) => {
    this.isLoading = true;
    this.error = null;
    this.success = false;
    
    try {
      console.log('Sending part data to server...');
      
      // Log form data for debugging
      for (let [key, value] of formData.entries()) {
        // Don't log file contents, just their metadata
        if (value instanceof File) {
          console.log(key, `[File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(key, value);
        }
      }

      const response = await fetch('http://172.18.7.93:8800/drawings/parts/', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      // Handle 422 Unprocessable Entity (validation errors)
      if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Validation errors:', errorData);
        
        // Format validation errors into a readable message
        let errorMessage = 'Validation failed:';
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorData.detail.forEach((error, index) => {
            const field = error.loc ? error.loc[error.loc.length - 1] : 'field';
            errorMessage += `\n${index + 1}. ${field}: ${error.msg || 'Invalid value'}`;
          });
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else {
          errorMessage = 'Please check the form for errors';
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle other error statuses
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorMessage = errorData.detail || errorData.message || errorData.msg || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await response.json();
        console.log('Create part successful:', result);
      } catch (e) {
        // If response is not JSON but the request was successful
        const text = await response.text();
        console.log('Non-JSON response:', text);
        result = { success: true, message: 'Part created successfully' };
      }
      
      // Refresh the parts list after successful creation
      await this.fetchAllPDFs();
      
      this.success = true;
      return result;
      
    } catch (error) {
      console.error('Error in createPart:', error);
      this.error = error.message || 'Failed to create part';
      throw error;
    } finally {
      this.isLoading = false;
    }
  };

  getAllParts = async () => {
    if (this.pdfList.length === 0) {
      await this.fetchAllPDFs();
    }
    return this.pdfList;
  };

  getPartByNumber = async (partNumber) => {
    return this.pdfList.find(pdf => pdf.filename === partNumber) || null;
  };

  download2DDrawing = async (filename) => {
    // Implementation for downloading 2D drawing
    return null;
  };

  download3DDrawing = async (filename) => {
    // Implementation for downloading 3D model
    return null;
  };

  updatePart = async (filename, data) => {
    // Implementation for updating a part
    return {};
  };

  deletePart = async (filename) => {
    try {
      const response = await fetch(`http://172.18.100.67:8987/api/pdfs/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete PDF: ${response.status}`);
      }

      // Refresh the PDF list after deletion
      await this.fetchAllPDFs();
      return true;
      
    } catch (error) {
      console.error('Error deleting PDF:', error);
      this.error = error.message;
      throw error;
    }
  };

  handleError = (error) => {
    console.error('Error:', error);
    this.error = error.message || 'An error occurred';
    this.success = false;
  };

  reset() {
    this.isLoading = false;
    this.error = null;
    this.success = false;
  }

  getPdfUrl = (filename) => {
    // Use the correct endpoint for viewing a specific PDF
    return `http://172.18.100.67:8987/api/pdf/${encodeURIComponent(filename)}`;
  };

  getPdfInfo = async (filename) => {
    try {
      const response = await fetch(`http://172.18.100.67:8987/api/pdf/${encodeURIComponent(filename)}/info`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF info: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching PDF info:', error);
      throw error;
    }
  };

  getPdfBoundingBoxes = async (filename) => {
    try {
      const response = await fetch(`http://172.18.100.67:8987/api/bounding-boxes/${encodeURIComponent(filename)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF bounding boxes: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching PDF bounding boxes:', error);
      throw error;
    }
  };

  saveBoundingBox = async (filename, pageNumber, boundingBox) => {
    this.isLoading = true;
    this.error = null;
    this.success = false;
    
    try {
      console.log('Sending bounding box to server:', {
        filename,
        pageNumber,
        boundingBox
      });
      
      // Validate input
      if (!filename) throw new Error('Filename is required');
      if (typeof pageNumber !== 'number' || pageNumber < 1) throw new Error('Invalid page number');
      if (!boundingBox || typeof boundingBox !== 'object') throw new Error('Invalid bounding box data');
      
      // Ensure bounding box has required properties
      const requiredProps = ['x', 'y', 'width', 'height'];
      for (const prop of requiredProps) {
        if (typeof boundingBox[prop] !== 'number') {
          throw new Error(`Missing or invalid property in bounding box: ${prop}`);
        }
      }
      
      const response = await fetch('http://172.18.100.67:8987/api/bounding-box', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          pageNumber,
          boundingBox: {
            x: parseFloat(boundingBox.x.toFixed(2)),
            y: parseFloat(boundingBox.y.toFixed(2)),
            width: parseFloat(boundingBox.width.toFixed(2)),
            height: parseFloat(boundingBox.height.toFixed(2)),
            page: pageNumber
          }
        }),
      });

      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorMessage;
          if (errorData.error) errorMessage += ` (${errorData.error})`;
        } catch (e) {
          const errorText = await response.text();
          console.error('Error response text:', errorText);
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      try {
        const result = await response.json();
        console.log('Bounding box saved successfully:', result);
        this.success = true;
        return result;
      } catch (e) {
        console.log('No JSON response, but status is OK');
        this.success = true;
        return { success: true, message: 'Bounding box saved successfully' };
      }
      
    } catch (error) {
      console.error('Error in saveBoundingBox:', {
        error: error.message,
        stack: error.stack,
        filename,
        pageNumber,
        boundingBox: boundingBox ? {
          x: boundingBox.x,
          y: boundingBox.y,
          width: boundingBox.width,
          height: boundingBox.height,
          page: boundingBox.page
        } : 'undefined'
      });
      
      this.error = error.message || 'Failed to save bounding box';
      throw error;
    } finally {
      this.isLoading = false;
    }
  };

  getPdfInspectionData = async (filename) => {
    try {
      this.isLoading = true;
      this.error = null;
      
      const [info, boundingBoxes] = await Promise.all([
        this.getPdfInfo(filename),
        this.getPdfBoundingBoxes(filename)
      ]);
      
      return {
        filename,
        pdfUrl: this.getPdfUrl(filename),
        info,
        boundingBoxes
      };
      
    } catch (error) {
      console.error('Error fetching PDF inspection data:', error);
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  };
}

const createPartStore = new CreatePartStore();
export default createPartStore;