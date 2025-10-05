// === INTERACTIVE NAVIGATION FUNCTIONS ===

/**
 * Smooth scroll to any section by ID
 * @param {string} sectionId - The ID of the section to scroll to
 */
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Show the section if it's hidden
    section.style.display = 'flex';
    
    // Smooth scroll to the section
    section.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  } else {
    console.warn(`Section with ID "${sectionId}" not found`);
  }
}

/**
 * Handles the Earth resident question response
 * @param {string} answer - Either 'yes' or 'no'
 */
function answerResident(answer) {
  const response = document.getElementById('resident-response');
  const coincidencePage = document.getElementById('page-coincidence');
  
  if (!response) {
    console.warn('Response element not found');
    return;
  }
  
  if (answer === 'yes') {
    // Positive response - show encouragement
    response.textContent = "Brave soul. Okay — onward.";
    response.style.color = 'var(--secondary-cyan)';
    response.style.fontWeight = '600';
    
    // After 1.5 seconds, show the coincidence page
    setTimeout(() => {
      if (coincidencePage) {
        coincidencePage.style.display = 'flex';
        coincidencePage.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 1500);
  } else if (answer === 'no') {
    // Sarcastic response for non-Earth residents
    response.innerHTML = '<span style="color: #ff8c8c; font-weight: 700;">Good for you. 🌌</span>';
  }
}

/**
 * Shows the simulation/features section
 */
function showSimulation() {
  const featuresSection = document.getElementById('features');
  
  if (featuresSection) {
    featuresSection.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  } else {
    console.warn('Features section not found');
  }
}

/**
 * Shows a sarcastic "good luck" message
 */
function showGoodLuck() {
  const response = document.getElementById('coincidence-response');
  
  if (response) {
    response.innerHTML = '<span style="color: #ff8c8c; font-weight: 700;">Well then, count your lucky craters. 🌠</span>';
  } else {
    console.warn('Coincidence response element not found');
  }
}

/**
 * Shows the astrophysics introduction after coincidence page
 */
function showAstrophysicsIntro() {
  const astrophysicsPage = document.getElementById('astrophysics-intro');
  
  if (astrophysicsPage) {
    astrophysicsPage.style.display = 'flex';
    astrophysicsPage.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  } else {
    console.warn('Astrophysics intro page not found');
  }
}

/**
 * Initialize all pages hidden initially
 */
function initializeQuestionPages() {
  const hiddenPages = ['page-coincidence', 'astrophysics-intro'];
  
  hiddenPages.forEach(pageId => {
    const page = document.getElementById(pageId);
    if (page) {
      page.style.display = 'none';
    }
  });
}

// Make all functions globally available
window.scrollToSection = scrollToSection;
window.answerResident = answerResident;
window.showSimulation = showSimulation;
window.showGoodLuck = showGoodLuck;
window.showAstrophysicsIntro = showAstrophysicsIntro;
window.initializeQuestionPages = initializeQuestionPages;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeQuestionPages();
  
  console.log('KABOOM app initialized successfully! 🚀');
});

// === DEFLECTION SIMULATION PHYSICS ===

let canvas, ctx, animationId;
let asteroidParams = {
  orbitRadius: 1.5, // AU
  mass: 1e12, // kg
  velocity: 25, // km/s
  impactAngle: 45, // degrees
  ejectaFactor: 1.5
};

// Physical constants
const G = 6.67430e-11; // m³/kg⋅s²
const M_sun = 1.989e30; // kg
const AU = 1.496e11; // meters

/**
 * Calculate orbital velocity at given radius
 */
function getOrbitalVelocity(radius_AU) {
  const radius_m = radius_AU * AU;
  return Math.sqrt(G * M_sun / radius_m) / 1000; // km/s
}

/**
 * Calculate deflection based on kinetic impactor physics
 */
function calculateDeflection() {
  const { orbitRadius, mass, velocity, impactAngle, ejectaFactor } = asteroidParams;
  
  // DART mission parameters (scaled)
  const impactorMass = 610; // kg
  const impactorVelocity = 6.14; // km/s
  
  // Momentum transfer calculation
  const impactorMomentum = impactorMass * impactorVelocity * 1000; // kg⋅m/s
  const angleRad = (impactAngle * Math.PI) / 180;
  const effectiveMomentum = impactorMomentum * Math.cos(angleRad);
  
  // Enhanced momentum from ejecta
  const totalMomentum = effectiveMomentum * ejectaFactor;
  
  // Velocity change (Δv)
  const deltaV = totalMomentum / mass; // m/s
  
  // Orbital velocity at current radius
  const orbitalVel = getOrbitalVelocity(orbitRadius) * 1000; // m/s
  
  // Change in orbital period (simplified)
  const periodChange = (2 * Math.PI * orbitRadius * AU * deltaV) / (orbitalVel * orbitalVel);
  const periodChangeMinutes = Math.abs(periodChange) / 60;
  
  // Deflection distance after one orbit
  const deflectionDistance = Math.abs(deltaV * periodChange) / 1000; // km
  
  // Update results display
  updateResults({
    deltaV: deltaV,
    periodChange: periodChangeMinutes,
    deflectionDistance: deflectionDistance,
    momentum: totalMomentum,
    efficiency: (totalMomentum / impactorMomentum).toFixed(2)
  });
  
  return { deltaV, deflectionDistance, periodChange: periodChangeMinutes };
}

/**
 * Update results display
 */
function updateResults(results) {
  const elements = {
    deltaV: document.getElementById('deltaVt'),
    deflectionRatio: document.getElementById('deltaA_A')
  };
  
  if (elements.deltaV) elements.deltaV.textContent = `${(results.deltaV * 1000).toFixed(3)}`;
  if (elements.deflectionRatio) {
    const ratio = (results.deflectionDistance / (asteroidParams.orbitRadius * AU / 1000)) * 100;
    elements.deflectionRatio.textContent = `${ratio.toFixed(6)}`;
  }
  
  console.log('Deflection Results:', {
    deltaV: `${(results.deltaV * 1000).toFixed(3)} mm/s`,
    periodChange: `${results.periodChange.toFixed(2)} minutes`,
    deflectionDistance: `${results.deflectionDistance.toFixed(1)} km`,
    momentum: `${(results.momentum / 1000).toFixed(1)} kN⋅s`,
    efficiency: `${results.efficiency}x`
  });
}

/**
 * Initialize deflection canvas
 */
function initDeflectionCanvas() {
  canvas = document.getElementById('impactCanvas'); // Fixed: Use correct canvas ID
  if (!canvas) {
    console.warn('Deflection canvas not found');
    return;
  }
  
  ctx = canvas.getContext('2d');
  canvas.width = 600;
  canvas.height = 400;
  
  // Start animation
  animate();
}

/**
 * Animation loop for deflection visualization
 */
function animate() {
  if (!ctx || !canvas) return;
  
  // Clear canvas with space background
  const gradient = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, 0,
    canvas.width/2, canvas.height/2, canvas.width/2
  );
  gradient.addColorStop(0, '#001122');
  gradient.addColorStop(0.7, '#000818');
  gradient.addColorStop(1, '#000000');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add stars
  drawStars();
  
  // Draw orbit
  drawOrbit();
  
  // Draw asteroid
  drawAsteroid();
  
  // Draw impactor
  drawImpactor();
  
  // Draw deflection vector
  drawDeflectionVector();
  
  // Draw labels
  drawLabels();
  
  animationId = requestAnimationFrame(animate);
}

/**
 * Draw background stars
 */
function drawStars() {
  const numStars = 50;
  ctx.fillStyle = '#ffffff';
  
  for (let i = 0; i < numStars; i++) {
    const x = (i * 137.5) % canvas.width; // Pseudo-random positions
    const y = (i * 73.2) % canvas.height;
    const size = Math.random() * 1.5;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * Draw orbital path
 */
function drawOrbit() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = asteroidParams.orbitRadius * 80; // Scale for display
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = '#4DD0E1';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Draw Sun
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
  ctx.fillStyle = '#FFD700';
  ctx.fill();
}

/**
 * Draw asteroid
 */
function drawAsteroid() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = asteroidParams.orbitRadius * 80;
  const time = Date.now() * 0.001;
  
  const asteroidX = centerX + radius * Math.cos(time * 0.5);
  const asteroidY = centerY + radius * Math.sin(time * 0.5);
  
  ctx.beginPath();
  ctx.arc(asteroidX, asteroidY, 6, 0, 2 * Math.PI);
  ctx.fillStyle = '#8B4513';
  ctx.fill();
  ctx.strokeStyle = '#CD853F';
  ctx.stroke();
}

/**
 * Draw impactor
 */
function drawImpactor() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = asteroidParams.orbitRadius * 80;
  const time = Date.now() * 0.001;
  
  const asteroidX = centerX + radius * Math.cos(time * 0.5);
  const asteroidY = centerY + radius * Math.sin(time * 0.5);
  
  // Draw impactor trail
  ctx.beginPath();
  ctx.moveTo(asteroidX - 30, asteroidY - 30);
  ctx.lineTo(asteroidX, asteroidY);
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw impactor
  ctx.beginPath();
  ctx.arc(asteroidX - 15, asteroidY - 15, 3, 0, 2 * Math.PI);
  ctx.fillStyle = '#FF6600';
  ctx.fill();
}

/**
 * Draw deflection vector
 */
function drawDeflectionVector() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = asteroidParams.orbitRadius * 80;
  const time = Date.now() * 0.001;
  
  const asteroidX = centerX + radius * Math.cos(time * 0.5);
  const asteroidY = centerY + radius * Math.sin(time * 0.5);
  
  // Calculate deflection vector
  const deflectionMagnitude = Math.min(asteroidParams.velocity * 2, 50);
  const angleRad = (asteroidParams.impactAngle * Math.PI) / 180;
  
  const endX = asteroidX + deflectionMagnitude * Math.cos(angleRad);
  const endY = asteroidY + deflectionMagnitude * Math.sin(angleRad);
  
  // Draw vector arrow
  ctx.beginPath();
  ctx.moveTo(asteroidX, asteroidY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw arrowhead
  const headLength = 10;
  const headAngle = Math.PI / 6;
  
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angleRad - headAngle),
    endY - headLength * Math.sin(angleRad - headAngle)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angleRad + headAngle),
    endY - headLength * Math.sin(angleRad + headAngle)
  );
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Draw labels and text
 */
function drawLabels() {
  ctx.fillStyle = '#FFD700';
  ctx.font = '14px Montserrat';
  ctx.textAlign = 'left';
  
  // Sun label
  ctx.fillText('☉ Sun', 20, 30);
  
  // Asteroid info
  ctx.fillStyle = '#FFC107';
  ctx.fillText(`🌑 Asteroid (${asteroidParams.orbitRadius.toFixed(2)} AU)`, 20, 50);
  
  // Impact info
  ctx.fillStyle = '#4DD0E1';
  ctx.fillText(`🚀 Kinetic Impactor`, 20, 70);
  
  // Deflection info
  ctx.fillStyle = '#00FF00';
  ctx.fillText(`→ Deflection Vector`, 20, 90);
}

/**
 * Create ejecta particles animation
 */
function createEjectaParticles() {
  // This would create particle effects for ejecta
  // Implementation can be added for enhanced visualization
  console.log('Ejecta particles created');
}

/**
 * Setup deflection control listeners
 */
function setupDeflectionControls() {
  const controls = {
    'aSlider': (value) => {
      asteroidParams.orbitRadius = parseFloat(value) / 100; // Convert to AU
      document.getElementById('aValue').textContent = `${(asteroidParams.orbitRadius).toFixed(3)} AU`;
      // Update orbital velocity
      const orbitalVel = getOrbitalVelocity(asteroidParams.orbitRadius);
      document.getElementById('vValue').textContent = `${orbitalVel.toFixed(2)} km/s`;
      calculateDeflection();
    },
    'massSlider': (value) => {
      asteroidParams.mass = parseFloat(value) * 1e11; // Convert to proper mass scale
      document.getElementById('massValue').textContent = `${value} kg`;
      calculateDeflection();
    },
    'velocitySlider': (value) => {
      asteroidParams.velocity = parseFloat(value) / 1000; // Convert m/s to km/s
      document.getElementById('velocityValue').textContent = `${value} m/s`;
      calculateDeflection();
    },
    'phiSlider': (value) => {
      asteroidParams.impactAngle = parseFloat(value);
      const angleDesc = value == 0 ? "Head-on" : value > 0 ? "Oblique +" : "Oblique -";
      document.getElementById('phiValue').textContent = `${value}° (${angleDesc})`;
      calculateDeflection();
    },
    'betaSlider': (value) => {
      asteroidParams.ejectaFactor = parseFloat(value);
      const ejectaDesc = value == 1 ? "No Ejecta" : value == 2 ? "Low Ejecta" : value == 3 ? "High Ejecta" : "Max Ejecta";
      document.getElementById('betaValue').textContent = `${value} (${ejectaDesc})`;
      calculateDeflection();
    }
  };
  
  Object.keys(controls).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', (e) => controls[id](e.target.value));
      // Initialize with current value
      controls[id](element.value);
    } else {
      console.warn(`Control element ${id} not found`);
    }
  });
}

// Initialize deflection tool when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('App.js DOM loaded, initializing deflection tool...');
  
  // Wait for elements to be available
  setTimeout(() => {
    const canvas = document.getElementById('impactCanvas');
    console.log('Looking for impactCanvas:', canvas);
    
    if (canvas) {
      console.log('Canvas found, initializing deflection visualization...');
      initDeflectionCanvas();
      setupDeflectionControls();
      calculateDeflection(); // Initial calculation
    } else {
      console.warn('impactCanvas not found, retrying...');
      setTimeout(() => {
        const retryCanvas = document.getElementById('impactCanvas');
        if (retryCanvas) {
          console.log('Canvas found on retry, initializing...');
          initDeflectionCanvas();
          setupDeflectionControls();
          calculateDeflection();
        } else {
          console.error('impactCanvas still not found after retry');
        }
      }, 2000);
    }
  }, 1000);
});

// Make functions globally available
window.calculateDeflection = calculateDeflection;
window.initDeflectionCanvas = initDeflectionCanvas;
window.setupDeflectionControls = setupDeflectionControls;
window.scrollToSection = scrollToSection;
window.answerResident = answerResident;
window.showSimulation = showSimulation;
window.showGoodLuck = showGoodLuck;
window.showAstrophysicsIntro = showAstrophysicsIntro;
window.initializeQuestionPages = initializeQuestionPages;