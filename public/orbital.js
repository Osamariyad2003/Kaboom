// === KEEPING ALL ORIGINAL PIECES, + FIXES & UPGRADES ===

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing enhanced THREE.js orbital visualization...');
  
  // Check if THREE.js is available
  if (typeof THREE === 'undefined') {
    console.error('❌ THREE.js not loaded');
    return;
  }
  
  initOrbitVisualization();
});

function initOrbitVisualization() {
  try {
    //scaling factor (original)
    const scale = 1e-8; // 1km real= 10^-8 units

    // --- SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);

    // get canvas from DOM (original uses this id)
    const canvas = document.getElementById('orbitCanvas');
    if (!canvas) {
      console.error('❌ Canvas #orbitCanvas not found');
      return;
    }

    // --- RENDERER (do NOT set canvas.width/height directly) ---
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);

    // helper to set renderer size to a square based on window width
    function setRendererSize() {
      const size = Math.floor(window.innerWidth * 0.6); // responsive size
      renderer.setSize(size, size, true); // update style too
      // keep canvas style consistent
      canvas.style.display = 'block';
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
    }
    setRendererSize();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      45,                       // field of view in degrees
      1,                        // aspect ratio (square)
      0.1,                      // near clipping plane
      1e9                       // far clipping plane (very large so big orbits don't get clipped)
    );
    camera.position.set(0, -3e8, 2e8); // starting position of camera

    // --- ORBIT CONTROLS (zoom & rotate) ---
    let controls;
    if (window.THREE && window.THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
    } else if (typeof OrbitControls !== 'undefined') {
      controls = new OrbitControls(camera, renderer.domElement);
    } else {
      console.warn('⚠️ OrbitControls not found: rotation & zoom may not work');
    }
    
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enableZoom = true;
      controls.zoomSpeed = 1.2;
      controls.enablePan = true;
      controls.panSpeed = 0.8;
      controls.target.set(0, 0, 0);
    }

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffff99, 2, 100);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // --- OBJECT (Sun) ---
    const sunRadiusReal = 700_000; // km
    const sunRadius = sunRadiusReal * scale; // scaled
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
    
    // Create a glowing sun material
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5
    });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    // Add sun glow effect
    const glowGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sunMesh.add(glow);

    // --- Earth orbit (reference) ---
    const earthPoints = [];
    const aReal = 149_600_000; // km
    const aEarthScaled = aReal * scale;
    const eEarth = 0.0167;
    
    for (let i = 0; i <= 360; i++) {
      const theta = (i * Math.PI) / 180;
      const x = aEarthScaled * Math.cos(theta);
      const y = aEarthScaled * Math.sqrt(1 - eEarth*eEarth) * Math.sin(theta);
      earthPoints.push(new THREE.Vector3(x, y, 0));
    }
    
    const earthOrbitGeometry = new THREE.BufferGeometry().setFromPoints(earthPoints);
    const earthOrbitMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4DD0E1, 
      transparent: true, 
      opacity: 0.8 
    });
    const earthOrbit = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
    scene.add(earthOrbit);

    // Add Earth
    const earthGeometry = new THREE.SphereGeometry(sunRadius * 0.3, 32, 32);
    const earthMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x6b93d6,
      emissive: 0x112244,
      emissiveIntensity: 0.1
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(aEarthScaled, 0, 0); // 1 AU from sun
    scene.add(earth);

    //asteroid (Icarus) - keep global var as you had
    let icarusOrbit;

    // === drawIcarusOrbit ===
    // Preserves your ellipse generation (centered at focus using x = a*(cos - e))
    // Adds full 3D rotation using orbital elements with the conventional transform:
    // r_inertial = Rz(Omega) * Rx(inclination) * Rz(omega) * r_orbital
    function drawIcarusOrbit(aAU, e, incDeg = 0, omegaDeg = 45, OmegaDeg = 60) {
      const aRealLocal = aAU * 149_600_000; // AU -> km
      const aScaled = aRealLocal * scale;
      const b = aScaled * Math.sqrt(Math.max(0, 1 - e*e));
      const points = [];

      const omega = THREE.MathUtils.degToRad(omegaDeg);
      const inc = THREE.MathUtils.degToRad(incDeg);
      const Omega = THREE.MathUtils.degToRad(OmegaDeg);

      const cosw = Math.cos(omega), sinw = Math.sin(omega);
      const cosi = Math.cos(inc), sini = Math.sin(inc);
      const cosO = Math.cos(Omega), sinO = Math.sin(Omega);

      for (let i = 0; i <= 360; i++) {
        const theta = (i * Math.PI) / 180;

        // orbital-plane coordinates (focused ellipse)
        let x_orb = aScaled * (Math.cos(theta) - e);
        let y_orb = b * Math.sin(theta);
        let z_orb = 0;

        // 1) rotate by omega around z-axis -> (Rz(omega) * r_orb)
        const x1 =  x_orb * cosw - y_orb * sinw;
        const y1 =  x_orb * sinw + y_orb * cosw;
        const z1 =  z_orb;

        // 2) rotate by inclination around x-axis -> (Rx(i) * previous)
        const x2 = x1;
        const y2 = y1 * cosi - z1 * sini;
        const z2 = y1 * sini + z1 * cosi;

        // 3) rotate by Omega around z-axis -> (Rz(Omega) * previous)
        const x3 = x2 * cosO - y2 * sinO;
        const y3 = x2 * sinO + y2 * cosO;
        const z3 = z2;

        points.push(new THREE.Vector3(x3, y3, z3));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xFFC107, 
        transparent: true, 
        opacity: 0.9,
        linewidth: 3
      });

      if (icarusOrbit) scene.remove(icarusOrbit);
      icarusOrbit = new THREE.Line(geometry, material);
      scene.add(icarusOrbit);
    }

    // --- HTML ELEMENTS ---
    const eccLabel = document.getElementById("eccLabel");
    const aLabel = document.getElementById("aLabel");
    const eccSlider = document.getElementById("eccSlider");
    const aSlider = document.getElementById("aSlider");
    const eccVal = document.getElementById("eccVal");
    const aVal = document.getElementById("aVal");
    const infoBox = document.getElementById("infoBox");
    const incLabel = document.getElementById("incLabel");
    const omegaLabel = document.getElementById("omegaLabel");
    const OmegaLabel = document.getElementById("OmegaLabel");

    // added sliders/labels from your HTML
    const incSlider = document.getElementById("incSlider");
    const omegaSlider = document.getElementById("omegaSlider");
    const OmegaSlider = document.getElementById("OmegaSlider");

    const incVal = document.getElementById("incVal");
    const omegaVal = document.getElementById("omegaVal");
    const OmegaVal = document.getElementById("OmegaVal");

    // Get tick elements
    const eccTick = document.getElementById("eccTick");
    const eccTickLabel = document.getElementById("eccTickLabel");
    const aTick = document.getElementById("aTick");
    const aTickLabel = document.getElementById("aTickLabel");

    // Actual/original values
    const actualEcc = 0.827;
    const actualA = 1.078;

    // --- Definitions ---
    const definitions = {
      eccentricity: "Eccentricity measures how stretched out an orbit is. 0 = circle, closer to 1 = elongated.",
      semimajor: "Semi-major axis is half the longest diameter of the orbit, representing the average distance from the Sun.",
      inclination: "Inclination measures the tilt of the orbital plane relative to the reference plane (usually the ecliptic).",
      argumentOfPeriapsis: "The argument of periapsis tells how the ellipse is rotated inside the orbital plane. It is the angle measured from the ascending node along the orbit to the periapsis.",
      longitudeOfAscendingNode: "Longitude of the ascending node is the angle from the reference direction to the ascending node, defining how the orbital plane is oriented in the reference plane."
    };

    // --- Info box toggle ---
    if (eccLabel && infoBox) {
      eccLabel.addEventListener("click", (ev) => {
        ev.stopPropagation();
        infoBox.textContent = definitions.eccentricity;
        infoBox.style.display = "block";
      });
    }
    
    if (aLabel && infoBox) {
      aLabel.addEventListener("click", (ev) => {
        ev.stopPropagation();
        infoBox.textContent = definitions.semimajor;
        infoBox.style.display = "block";
      });
    }
    
    if (incLabel && infoBox) {
      incLabel.addEventListener("click", () => {
        infoBox.textContent = definitions.inclination;
        infoBox.style.display = "block";
      });
    }

    if (omegaLabel && infoBox) {
      omegaLabel.addEventListener("click", () => {
        infoBox.textContent = definitions.argumentOfPeriapsis;
        infoBox.style.display = "block";
      });
    }

    if (OmegaLabel && infoBox) {
      OmegaLabel.addEventListener("click", () => {
        infoBox.textContent = definitions.longitudeOfAscendingNode;
        infoBox.style.display = "block";
      });
    }

    // Hide info if clicking outside labels
    document.addEventListener("click", (e) => {
      if (infoBox && 
        !e.target.closest("#eccLabel") &&
        !e.target.closest("#aLabel") &&
        !e.target.closest("#incLabel") &&
        !e.target.closest("#omegaLabel") &&
        !e.target.closest("#OmegaLabel")
      ) {
        infoBox.style.display = "none";
      }
    });

    // --- Tick positioning function ---
    function positionTick(slider, tick, labelEl, actualValue) {
      if (!slider || !tick) return;
      const trackWidth = slider.clientWidth || slider.offsetWidth || 160;
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const pct = (actualValue - min) / (max - min);
      const clippedPct = Math.max(0, Math.min(1, pct));
      const leftPx = clippedPct * trackWidth;
      tick.style.left = (leftPx - 1) + "px";
      if (labelEl) labelEl.style.left = (leftPx - 12) + "px";
    }

    // initial tick positioning
    positionTick(eccSlider, eccTick, eccTickLabel, actualEcc);
    positionTick(aSlider, aTick, aTickLabel, actualA);

    // --- Orbit update function ---
    function updateOrbitFromSliders() {
      const e = parseFloat(eccSlider ? eccSlider.value : 0.827);
      const a = parseFloat(aSlider ? aSlider.value : 1.078);
      const inc = parseFloat(incSlider ? incSlider.value : 30);
      const omega = parseFloat(omegaSlider ? omegaSlider.value : 45);
      const Omega = parseFloat(OmegaSlider ? OmegaSlider.value : 60);

      // update textual displays
      if (eccVal) eccVal.innerText = e.toFixed(3);
      if (aVal) aVal.innerText = a.toFixed(3);
      if (incVal) incVal.innerText = inc.toFixed(1);
      if (omegaVal) omegaVal.innerText = omega.toFixed(1);
      if (OmegaVal) OmegaVal.innerText = Omega.toFixed(1);

      // reposition tick markers
      positionTick(eccSlider, eccTick, eccTickLabel, actualEcc);
      positionTick(aSlider, aTick, aTickLabel, actualA);

      // draw Icarus orbit with the new parameters
      drawIcarusOrbit(a, e, inc, omega, Omega);
    }

    // --- Bind sliders ---
    [eccSlider, aSlider, incSlider, omegaSlider, OmegaSlider].forEach(slider => {
      if (!slider) return;
      slider.addEventListener("input", updateOrbitFromSliders);
      slider.addEventListener("input", () => {
        if (slider === eccSlider) positionTick(eccSlider, eccTick, eccTickLabel, actualEcc);
        if (slider === aSlider) positionTick(aSlider, aTick, aTickLabel, actualA);
      });
    });

    // --- Control buttons ---
    const resetBtn = document.getElementById('resetView');
    const toggleEarthBtn = document.getElementById('toggleEarth');
    const screenshotBtn = document.getElementById('screenshot');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Reset camera position
        camera.position.set(0, -3e8, 2e8);
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.reset();
        }
        
        // Reset orbital parameters
        if (eccSlider) eccSlider.value = 0.827;
        if (aSlider) aSlider.value = 1.078;
        if (incSlider) incSlider.value = 30;
        if (omegaSlider) omegaSlider.value = 45;
        if (OmegaSlider) OmegaSlider.value = 60;
        
        updateOrbitFromSliders();
      });
    }

    if (toggleEarthBtn) {
      toggleEarthBtn.addEventListener('click', () => {
        earth.visible = !earth.visible;
        earthOrbit.visible = !earthOrbit.visible;
        toggleEarthBtn.textContent = earth.visible ? 'Hide Earth' : 'Show Earth';
      });
    }

    if (screenshotBtn) {
      screenshotBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'orbital-visualization.png';
        link.href = renderer.domElement.toDataURL();
        link.click();
      });
    }

    // --- INITIAL DRAW ---
    drawIcarusOrbit(1.078, 0.827, 30, 45, 60);
    updateOrbitFromSliders();

    // --- Camera initial placement ---
    (function placeCameraInitially() {
      const initialAU = parseFloat(aSlider ? aSlider.value : 1.078);
      const initialAScaled = initialAU * 149_600_000 * scale;
      const distance = Math.max(initialAScaled * 3, sunRadius * 8, 5);
      camera.position.set(0, 0, distance);
      camera.lookAt(0, 0, 0);
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }
    })();

    // --- Resize handler ---
    window.addEventListener("resize", () => {
      setRendererSize();
      camera.aspect = 1; // square aspect
      camera.updateProjectionMatrix();
      positionTick(eccSlider, eccTick, eccTickLabel, actualEcc);
      positionTick(aSlider, aTick, aTickLabel, actualA);
    });

    // --- ANIMATION LOOP ---
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotate sun
      sunMesh.rotation.y += 0.01;
      
      // Animate Earth
      if (earth.visible) {
        const time = Date.now() * 0.001;
        earth.position.x = aEarthScaled * Math.cos(time * 0.1);
        earth.position.y = aEarthScaled * Math.sin(time * 0.1);
        earth.rotation.y += 0.02;
      }
      
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    console.log('✅ Enhanced THREE.js orbital visualization initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize THREE.js orbital visualization:', error);
  }
}

// Export for global access
window.initOrbitVisualization = initOrbitVisualization;