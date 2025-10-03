import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function OrbitSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const icarusOrbitRef = useRef<THREE.Line | null>(null);

  const [eccentricity, setEccentricity] = useState(0.827);
  const [semiMajorAxis, setSemiMajorAxis] = useState(1.078);
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const scale = 1e-8;
  const actualEcc = 0.827;
  const actualA = 1.078;

  const definitions: Record<string, string> = {
    eccentricity: 'Eccentricity measures how stretched out an orbit is. 0 = circle, closer to 1 = elongated.',
    semimajor: "Semi-major axis is half the longest diameter of the orbit, representing the average distance from the Sun."
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    renderer.setSize(800, 800);
    renderer.setClearColor(0x111111);
    renderer.setPixelRatio(window.devicePixelRatio);

    const sunRadiusReal = 700_000;
    const sunRadius = sunRadiusReal * scale;
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunTexture = new THREE.TextureLoader().load(
      'https://i.postimg.cc/vBzT1FbY/IMG-4526.jpg'
    );
    const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    const aReal = 149_600_000;
    const a = aReal * scale;
    const e = 0.0167;
    const earthPoints = [];
    for (let i = 0; i <= 360; i++) {
      const theta = (i * Math.PI) / 180;
      const x = a * Math.cos(theta);
      const y = a * Math.sqrt(1 - e * e) * Math.sin(theta);
      earthPoints.push(new THREE.Vector3(x, y, 0));
    }

    const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthPoints);
    const earthOrbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const earthOrbit = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
    scene.add(earthOrbit);

    camera.position.z = a * 3;
    camera.lookAt(0, 0, 0);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    function animate() {
      requestAnimationFrame(animate);
      sunMesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const drawIcarusOrbit = (aAU: number, e: number) => {
      const aReal = aAU * 149_600_000;
      const a = aReal * scale;
      const b = a * Math.sqrt(1 - e * e);
      const points = [];

      for (let i = 0; i <= 360; i++) {
        const theta = (i * Math.PI) / 180;
        const x = a * (Math.cos(theta) - e);
        const y = b * Math.sin(theta);
        points.push(new THREE.Vector3(x, y, 0));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x3873b2 });

      if (icarusOrbitRef.current) {
        sceneRef.current!.remove(icarusOrbitRef.current);
      }

      const icarusOrbit = new THREE.Line(geometry, material);
      sceneRef.current!.add(icarusOrbit);
      icarusOrbitRef.current = icarusOrbit;
    };

    drawIcarusOrbit(semiMajorAxis, eccentricity);
  }, [eccentricity, semiMajorAxis]);

  const getSliderPosition = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <section className="bg-white px-24 py-16">
      <div className="flex justify-center">
        <div className="relative inline-block">
          <canvas ref={canvasRef} width={800} height={800} className="rounded-lg shadow-xl" />

          <div className="absolute top-5 right-5 bg-black/70 text-white p-4 rounded-lg min-w-[260px]">
            <div className="mb-5 relative">
              <label className="block mb-2">
                <span
                  className="cursor-pointer underline font-semibold"
                  onClick={() => setShowInfo(showInfo === 'eccentricity' ? null : 'eccentricity')}
                >
                  Eccentricity
                </span>
                : <span>{eccentricity.toFixed(3)}</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.001"
                  value={eccentricity}
                  onChange={(e) => setEccentricity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div
                  className="absolute top-0 w-0.5 h-6 bg-yellow-400"
                  style={{ left: `${getSliderPosition(actualEcc, 0, 0.99)}%` }}
                />
                <div
                  className="absolute -top-5 text-xs text-yellow-400"
                  style={{ left: `${getSliderPosition(actualEcc, 0, 0.99)}%` }}
                >
                  {actualEcc}
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block mb-2">
                <span
                  className="cursor-pointer underline font-semibold"
                  onClick={() => setShowInfo(showInfo === 'semimajor' ? null : 'semimajor')}
                >
                  Semi-major axis (AU)
                </span>
                : <span>{semiMajorAxis.toFixed(3)}</span>
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.001"
                  value={semiMajorAxis}
                  onChange={(e) => setSemiMajorAxis(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div
                  className="absolute top-0 w-0.5 h-6 bg-yellow-400"
                  style={{ left: `${getSliderPosition(actualA, 0.1, 3)}%` }}
                />
                <div
                  className="absolute -top-5 text-xs text-yellow-400"
                  style={{ left: `${getSliderPosition(actualA, 0.1, 3)}%` }}
                >
                  {actualA}
                </div>
              </div>
            </div>

            {showInfo && (
              <div className="mt-3 bg-black/85 p-2 rounded text-sm text-gray-300 leading-tight">
                {definitions[showInfo]}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
