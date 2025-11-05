// Worker must be in src/workers folder
// @ts-check
import initOCCT from 'occt-import-js';

let occt;
let isInitialized = false;

// Initialize OCCT first
initOCCT()
  .then((module) => {
    occt = module;
    isInitialized = true;
    self.postMessage({ status: 'ready' });
  })
  .catch((error) => {
    console.error('OCCT initialization error:', error);
    self.postMessage({ 
      error: `3D processor failed to initialize: ${error.message}` 
    });
  });

self.onmessage = async (event) => {
  if (!isInitialized) {
    self.postMessage({ 
      error: '3D processor is still initializing - please try again' 
    });
    return;
  }

  try {
    const { arrayBuffer, fileName } = event.data;
    
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Received empty file content');
    }
    
    console.log('Processing STEP file:', fileName);
    const result = occt.ReadStepFile(arrayBuffer, {
      linearDeflection: 0.1,
      angularDeflection: 0.5,
      linearDeflectionType: 'bounding_box_ratio'
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process STEP file');
    }
    
    self.postMessage(result);
  } catch (error) {
    console.error('Worker processing error:', error);
    self.postMessage({ 
      error: `Failed to process 3D model: ${error.message}` 
    });
  }
};
