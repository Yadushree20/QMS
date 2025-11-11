import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

const STEPViewer = ({ stepFile }) => {
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for Three.js objects
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const animationIdRef = useRef(null);
  const loaderRef = useRef(new STLLoader());

  // Clean up function
  useEffect(() => {
    return () => {
      if (rendererRef.current) rendererRef.current.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    };
  }, []);

  // Initialize Three.js scene and load model
  useEffect(() => {
    if (!mountRef.current || !stepFile) return;

    // Clear previous scene
    const scene = sceneRef.current;
    while(scene.children.length > 0) scene.remove(scene.children[0]);

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (rendererRef.current?.domElement?.parentNode) {
      rendererRef.current.domElement.parentNode.replaceChild(renderer.domElement, rendererRef.current.domElement);
    } else {
      mountRef.current.appendChild(renderer.domElement);
    }
    rendererRef.current = renderer;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;
    cameraRef.current = camera;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 1000;
    controlsRef.current = controls;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x0000ff, 0x808080);
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    // Load the model
    const loadModel = async () => {
      try {
        const url = URL.createObjectURL(stepFile);
        const loader = loaderRef.current;
        
        // Check file size
        if (stepFile.size > 50 * 1024 * 1024) { // 50MB
          throw new Error('File is too large. Please use files smaller than 50MB.');
        }

        // Read file as ArrayBuffer first
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(stepFile);
        });

        // Convert to string for STL parsing
        const decoder = new TextDecoder('utf-8');
        const stlString = decoder.decode(arrayBuffer.slice(0, 1000)); // Only read first 1000 bytes to check format
        const isBinary = !stlString.stWith('solid ');

        // Load the model
        const geometry = isBinary 
          ? loader.parse(arrayBuffer)
          : await new Promise((resolve, reject) => {
              const textLoader = new FileReader();
              textLoader.onload = (e) => {
                try {
                  resolve(loader.parse(e.target.result));
                } catch (err) {
                  reject(err);
                }
              };
              textLoader.onerror = reject;
              textLoader.readAsText(stepFile);
            });

        // Create material
        const material = new THREE.MeshPhongMaterial({
          color: 0x00a1cb,
          specular: 0x111111,
          shininess: 20,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Center and scale the model
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const center = new THREE.Vector3();
        box.getCenter(center);
        mesh.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3()).length();
        const maxDim = Math.max(size, 1);
        mesh.scale.setScalar(50 / maxDim);
        
        scene.add(mesh);
        modelRef.current = mesh;

        // Update camera
        camera.position.z = size * 2;
        controls.target.copy(center);
        controls.update();

        setIsLoading(false);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error loading model:', err);
        setError(`Failed to load 3D model: ${err.message}`);
        setIsLoading(false);
      }
    };

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationIdRef.current);
      if (modelRef.current) {
        scene.remove(modelRef.current);
        if (modelRef.current.geometry) modelRef.current.geometry.dispose();
        if (modelRef.current.material) {
          if (Array.isArray(modelRef.current.material)) {
            modelRef.current.material.forEach(m => m.dispose());
          } else {
            modelRef.current.material.dispose();
          }
        }
      }
    };
  }, [stepFile]);

  return (
    <div className="relative w-full h-full bg-white">
      <div ref={mountRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading 3D model...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Error Loading 3D Model</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {!isLoading && !error && stepFile && (
        <div className="absolute bottom-4 right-4 bg-white bg-opacity-80 rounded-lg p-2 text-xs text-gray-600 shadow-md">
          <div>Right-click + drag to rotate</div>
          <div>Scroll to zoom</div>
          <div>Left-click + drag to pan</div>
        </div>
      )}
    </div>
  );
};

export default STEPViewer;