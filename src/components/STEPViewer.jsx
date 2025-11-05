import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function STEPViewer({ stepFile }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [occt, setOcct] = useState(null);
  const [modelData, setModelData] = useState(null);

  // Initialize occt-import-js
  useEffect(() => {
    const initOcct = async () => {
      try {
        // First try CDN approach (more reliable with Vite)
        if (!window.occtimportjs) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (window.occtimportjs) {
          const occtInstance = await window.occtimportjs();
          setOcct(occtInstance);
        } else {
          throw new Error('occtimportjs not available');
        }
      } catch (err) {
        console.error('Failed to initialize OCCT:', err);
        // Fallback: try npm import
        try {
          const occtModule = await import('occt-import-js');
          const occtInstance = await occtModule.default();
          setOcct(occtInstance);
        } catch (fallbackErr) {
          console.error('All OCCT loading methods failed:', fallbackErr);
          setError('Failed to load 3D viewer library. This might be due to WebAssembly loading issues in your browser or development server.');
        }
      }
    };

    initOcct();
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !occt) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Check for WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      setError('WebGL is not supported in your browser. Please try using a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    let renderer;
    try {
      // Scene with clean white background
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8fafc);
      scene.fog = new THREE.Fog(0xf8fafc, 2000, 5000);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
      camera.position.set(500, 500, 500);
      cameraRef.current = camera;

      // Renderer with error handling
      renderer = new THREE.WebGLRenderer({ 
        antialias: false, // Disable for better performance
        alpha: true,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        precision: "mediump" // Use medium precision for better performance
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
      renderer.shadowMap.enabled = false; // Disable shadows for better performance
      rendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Enhanced Lighting Setup for white background
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      // Main light
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
      mainLight.position.set(1000, 1000, 1000);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 4096;
      mainLight.shadow.mapSize.height = 4096;
      mainLight.shadow.camera.near = 0.5;
      mainLight.shadow.camera.far = 5000;
      scene.add(mainLight);

      // Fill lights for better illumination
      const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight1.position.set(-500, 500, -500);
      scene.add(fillLight1);

      const fillLight2 = new THREE.DirectionalLight(0xffd9a8, 0.3);
      fillLight2.position.set(500, -300, 500);
      scene.add(fillLight2);

      // Rim light for edge definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
      rimLight.position.set(0, 1000, -1000);
      scene.add(rimLight);

      // Hemisphere light for natural sky/ground coloring
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe0e0e0, 0.4);
      scene.add(hemiLight);

      // Stylized grid and axes
      const gridHelper = new THREE.GridHelper(2000, 40, 0x3b82f6, 0xdde1e8);
      gridHelper.material.opacity = 0.4;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);

      const axesHelper = new THREE.AxesHelper(300);
      axesHelper.material.linewidth = 2;
      scene.add(axesHelper);

      // Mount renderer
      mountRef.current.appendChild(renderer.domElement);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!mountRef.current) return;
        const newWidth = mountRef.current.clientWidth;
        const newHeight = mountRef.current.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        if (renderer) {
          renderer.dispose();
        }
      };
    } catch (err) {
      console.error('Failed to initialize Three.js:', err);
      setError(`Failed to initialize 3D viewer: ${err.message}. Your browser may not support WebGL or hardware acceleration may be disabled.`);
      if (renderer) {
        renderer.dispose();
      }
    }
  }, [occt]);

  // Load STEP file
  useEffect(() => {
    if (!stepFile || !occt || !sceneRef.current) return;

    const loadSTEPFile = async () => {
      // Handle both raw File objects (new format) and wrapper objects (old format)
      const actualFile = stepFile instanceof File ? stepFile : stepFile?.file;
      const fileName = stepFile instanceof File ? stepFile.name : stepFile?.name;
      
      console.log('STEPViewer - stepFile:', stepFile);
      console.log('STEPViewer - actualFile:', actualFile);
      console.log('STEPViewer - fileName:', fileName);
      
      if (!actualFile) {
        setError('No valid STEP file provided');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Check if file is a valid STEP file
        if (!fileName.toLowerCase().endsWith('.step') && 
            !fileName.toLowerCase().endsWith('.stp')) {
          throw new Error('Invalid file format - only .step and .stp files are supported');
        }
        
        // Read file content
        const arrayBuffer = await actualFile.arrayBuffer();
        
        // Verify file size
        if (arrayBuffer.byteLength === 0) {
          throw new Error('Empty file content');
        }
        
        // Process with OCCT
        const worker = new Worker(new URL('/workers/stepWorker.js', import.meta.url), {
          type: 'module'
        });
        
        worker.postMessage({
          arrayBuffer,
          fileName: fileName
        }, [arrayBuffer]);
        
        worker.onmessage = (event) => {
          if (event.data.error) {
            throw new Error(event.data.error);
          }
          setModelData(event.data);
          setIsLoading(false);
          worker.terminate();
        };
        
        worker.onerror = (error) => {
          console.error('Worker error event:', error);
          
          let errorMessage = 'Failed to process 3D model';
          
          // Handle cases where error object might be undefined
          if (error && error.message) {
            console.error('Worker error details:', {
              message: error.message,
              filename: error.filename,
              lineno: error.lineno,
              colno: error.colno
            });
            
            if (error.message.includes('Unexpected token') || 
                error.message.includes('SyntaxError')) {
              errorMessage = 'Worker configuration error - please check console';
            } else if (error.message.includes('404')) {
              errorMessage = 'Worker file not found';
            }
          } else {
            console.error('Undefined worker error - possible initialization failure');
            errorMessage = '3D processor failed to initialize';
          }
          
          setError(errorMessage);
          setIsLoading(false);
          
          try {
            worker.terminate();
          } catch (e) {
            console.error('Error terminating worker:', e);
          }
        };
      } catch (err) {
        setError(`Failed to load model: ${err.message}`);
        setIsLoading(false);
        
        // Log detailed error for debugging
        console.error('STEP file loading error:', {
          error: err,
          file: stepFile,
          fileType: stepFile?.file?.type,
          fileSize: stepFile?.file?.size
        });
      }
    };

    loadSTEPFile();
  }, [stepFile, occt]);

  const createMeshFromSTEPData = (meshData) => {
    try {
      const geometry = new THREE.BufferGeometry();

      // Set positions
      if (meshData.attributes.position) {
        geometry.setAttribute('position',
          new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
      }

      // Set normals
      if (meshData.attributes.normal) {
        geometry.setAttribute('normal',
          new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
      }

      // Set indices
      if (meshData.index) {
        const index = Uint32Array.from(meshData.index.array);
        geometry.setIndex(new THREE.BufferAttribute(index, 1));
      }

      // Create material with modern appearance
      const color = meshData.color
        ? new THREE.Color(meshData.color[0], meshData.color[1], meshData.color[2])
        : new THREE.Color(0x3b82f6); // Modern blue

      const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.4,
        envMapIntensity: 1.0,
        side: THREE.DoubleSide,
        flatShading: false
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = meshData.name || 'STEP Mesh';

      return mesh;
    } catch (err) {
      console.error('Error creating mesh:', err);
      return null;
    }
  };

  const processNodeHierarchy = (node, meshes, parentGroup) => {
    // Create group for this node
    const nodeGroup = new THREE.Group();
    nodeGroup.name = node.name || 'STEP Node';

    // Add meshes for this node
    if (node.meshes) {
      for (let meshIndex of node.meshes) {
        const meshData = meshes[meshIndex];
        if (meshData) {
          const mesh = createMeshFromSTEPData(meshData);
          if (mesh) {
            nodeGroup.add(mesh);
          }
        }
      }
    }

    // Process children
    if (node.children) {
      for (let child of node.children) {
        processNodeHierarchy(child, meshes, nodeGroup);
      }
    }

    parentGroup.add(nodeGroup);
  };

  const fitCameraToObject = (object) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;

    cameraRef.current.position.copy(center);
    cameraRef.current.position.x += distance;
    cameraRef.current.position.y += distance;
    cameraRef.current.position.z += distance;
    cameraRef.current.lookAt(center);

    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  useEffect(() => {
    if (modelData) {
      const stepGroup = new THREE.Group();
      stepGroup.userData.isSTEPGeometry = true;

      // Process meshes
      for (let meshData of modelData.meshes) {
        const mesh = createMeshFromSTEPData(meshData);
        if (mesh) {
          stepGroup.add(mesh);
        }
      }

      // Process hierarchy if available
      if (modelData.root) {
        processNodeHierarchy(modelData.root, modelData.meshes, stepGroup);
      }

      sceneRef.current.add(stepGroup);

      // Fit camera to geometry
      fitCameraToObject(stepGroup);
    }
  }, [modelData]);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div ref={mountRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center space-y-4 bg-white px-8 py-6 rounded-2xl shadow-2xl border-2 border-blue-200">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 absolute top-0"></div>
            </div>
            <div className="text-center">
              <span className="text-slate-900 font-semibold text-lg">Loading STEP file...</span>
              <p className="text-slate-600 text-sm mt-1">Processing 3D geometry</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-10">
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 px-6 py-5 rounded-2xl shadow-2xl max-w-lg mx-4">
            <div className="flex items-center mb-3">
              <div className="bg-red-500 rounded-full p-2 mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-red-900 font-bold text-lg">Error Loading Model</span>
            </div>
            <p className="text-red-800 text-sm leading-relaxed mb-3">{error}</p>
            {error.includes('WebGL') && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                <p className="text-xs text-slate-700 font-semibold mb-2">Troubleshooting Steps:</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Make sure hardware acceleration is enabled in your browser settings</li>
                  <li>Try updating your graphics drivers</li>
                  <li>Try using a different browser (Chrome, Firefox, or Edge)</li>
                  <li>Restart your browser</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!stepFile && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 z-10">
          <div className="text-center max-w-md px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-400 opacity-10 blur-3xl rounded-full"></div>
              <svg className="w-24 h-24 text-blue-500 mx-auto relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              STEP File Viewer
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Upload a STEP file to visualize your 3D CAD model with advanced rendering
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-600">
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">STEP</span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">STP</span>
              <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg font-medium">STEP-NC</span>
            </div>
          </div>
        </div>
      )}

      {/* Viewer Info Overlay */}
      {stepFile && !isLoading && !error && (
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-300 shadow-lg">
          <p className="text-slate-900 text-sm font-medium">
            <span className="text-green-500">â—</span> Model Loaded
          </p>
        </div>
      )}

      {/* Controls Info */}
      {stepFile && !isLoading && !error && (
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-md px-4 py-3 rounded-lg border border-slate-300 shadow-lg">
          <div className="text-xs text-slate-700 space-y-1">
            <p><span className="text-blue-600 font-semibold">Left Click:</span> Rotate</p>
            <p><span className="text-blue-600 font-semibold">Right Click:</span> Pan</p>
            <p><span className="text-blue-600 font-semibold">Scroll:</span> Zoom</p>
          </div>
        </div>
      )}
    </div>
  );
}

