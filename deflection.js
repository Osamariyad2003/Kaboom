// JavaScript: Logic, Physics, and Animation

// Function to initialize KaTeX rendering
function initializeKaTeX() {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
            ]
        });
    } else {
        console.error("KaTeX auto-render function not found.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('impactCanvas');
    if (!canvas) {
        console.warn('Impact canvas not found, deflection tool not initialized');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const CENTER_X = W / 2;
    const CENTER_Y = H / 2;

    // --- PHYSICS CONSTANTS ---
    const G = 6.67430e-11;                                    
    const M_SUN = 1.989e30;                                   
    const M_ASTEROID_PROXY = 4.3e10;                          
    const AU_METERS = 149.6e9;                                
    const VISUAL_DEFLECTION_MULTIPLIER = 1e8;                 
    
    // --- SCALING CONSTANTS ---
    // The visual radius of 250 pixels corresponds to a realistic orbital distance of 1.5 AU.
    const DEFAULT_VISUAL_RADIUS = 250;
    const DEFAULT_ASTEROID_DISTANCE = 1.5 * AU_METERS; 
    // Factor to map 1 visual unit (pixel) to meters in space.
    const RADIUS_SCALING_FACTOR = DEFAULT_ASTEROID_DISTANCE / DEFAULT_VISUAL_RADIUS; 
    // Factor to map 1 visual unit (pixel) to Astronomical Units (AU)
    const VISUAL_TO_AU_RATIO = DEFAULT_ASTEROID_DISTANCE / DEFAULT_VISUAL_RADIUS / AU_METERS; // Calculated as 1.5 / 250 = 0.006 AU/pixel

    // DART Initial Values
    const DART_INITIALS = {
        mass: 500,                                            
        velocity: 6100,                                       
        a_slider_value: 250,                                  
        beta: 3,                                              
        phi: 0                                                
    };

    // --- SIMULATION STATE ---
    let state = {
        mass: DART_INITIALS.mass,
        velocity: DART_INITIALS.velocity,
        a: DART_INITIALS.a_slider_value,
        beta: DART_INITIALS.beta,
        phi: DART_INITIALS.phi,
        animationPhase: 'initial',
        impactorDistance: 1.5 * DART_INITIALS.a_slider_value,
        animationFrameId: null,
        ejectaParticles: [],
        new_a: DART_INITIALS.a_slider_value,
        a_start: DART_INITIALS.a_slider_value,
        animationSpeed: 5,
        lastTime: 0
    };

    // --- DOM Elements ---
    const sliders = {
        a: document.getElementById('aSlider'),
        mass: document.getElementById('massSlider'),
        velocity: document.getElementById('velocitySlider'),
        phi: document.getElementById('phiSlider'),
        beta: document.getElementById('betaSlider'),
        speed: document.getElementById('speedSlider')
    };
    const values = {
        a: document.getElementById('aValue'),
        mass: document.getElementById('massValue'),
        velocity: document.getElementById('velocityValue'),
        phi: document.getElementById('phiValue'),
        beta: document.getElementById('betaValue'),
        speed: document.getElementById('speedValue')
    };
    const results = {
        vValue: document.getElementById('vValue'),
        deltaVt: document.getElementById('deltaVt'),
        deltaA_A: document.getElementById('deltaA_A')
    };
    const playButton = document.getElementById('playButton');

    // Check if all required elements exist
    const requiredElements = [...Object.values(sliders), ...Object.values(values), ...Object.values(results), playButton];
    const missingElements = requiredElements.filter(el => !el);
    
    if (missingElements.length > 0) {
        console.warn('Some deflection tool elements not found:', missingElements);
        return;
    }

    // --- PHYSICS CALCULATION CORE ---

    /**
     * Calculates the physical and visual deflection parameters based on current state.
     */
    function calculateDeflection(mi, u, Ma, a_canvas, phi_deg, beta) {
        const phi_rad = phi_deg * Math.PI / 180;
        
        // 1. Calculate Initial Orbital Velocity (v) 
        const r_actual = a_canvas * RADIUS_SCALING_FACTOR;
        const v = Math.sqrt(G * M_SUN / r_actual); 

        // 2. Calculate Delta v_t (Tangential velocity change)
        const magnitude_dv = (mi * u / Ma) * (2 - beta);
        const delta_vt = magnitude_dv * Math.cos(phi_rad);

        // 3. Calculate Delta a/a (PHYSICALLY ACCURATE)
        const delta_a_a_physical = 2 * delta_vt / v;

        // 4. Calculate New Visual Radius (a' visual)
        const delta_a_a_visual = delta_a_a_physical * VISUAL_DEFLECTION_MULTIPLIER;
        let new_a_visual = a_canvas * (1 + delta_a_a_visual);
        
        // Constrain the new orbit to be visible and within bounds
        new_a_visual = Math.max(50, Math.min(W/2 - 10, new_a_visual));

        return { 
            v: v,
            dvt: delta_vt, 
            da_a_phys: delta_a_a_physical, 
            new_a_visual: new_a_visual
        };
    }

    function updatePhysicsAndUI() {
        // Use state.a_start as the base radius for physics calculation
        const { v, dvt, da_a_phys, new_a_visual } = calculateDeflection(
            state.mass,
            state.velocity,
            M_ASTEROID_PROXY,
            state.a_start, 
            state.phi,
            state.beta
        );

        // Update state with calculated visual orbit
        state.new_a = new_a_visual;

        // Update UI results
        results.vValue.textContent = (v / 1000).toFixed(2); // Display v in km/s
        results.deltaVt.textContent = dvt.toFixed(6);
        
        const da_a_percent = (da_a_phys * 100).toExponential(3);
        results.deltaA_A.textContent = da_a_percent;

        // Color based on deflection direction
        results.deltaA_A.style.color = dvt > 0 ? '#008000' : (dvt < 0 ? '#CC3700' : '#000080');

        draw(); // Redraw visualization
    }

    // --- DRAWING AND ANIMATION HELPERS ---

    /** Converts polar coordinates (r, theta_deg) centered at (centerX, centerY) to Cartesian. */
    function polarToCartesian(r, theta_deg, centerX, centerY) {
        const theta_rad = (theta_deg - 90) * Math.PI / 180;
        return {
            x: centerX + r * Math.cos(theta_rad),
            y: centerY + r * Math.sin(theta_rad)
        };
    }

    /** Draws a labeled arrow vector with a manually drawn hat symbol. */
    function drawVector(x_start, y_start, angle_deg, length, color, label) {
        const end = polarToCartesian(length, angle_deg, x_start, y_start);
        const angle_rad = (angle_deg - 90) * Math.PI / 180;
        const head_length = 8;
        const label_offset = length + 10;

        // Draw line
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x_start, y_start);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - head_length * Math.cos(angle_rad - Math.PI / 6), end.y - head_length * Math.sin(angle_rad - Math.PI / 6));
        ctx.lineTo(end.x - head_length * Math.cos(angle_rad + Math.PI / 6), end.y - head_length * Math.sin(angle_rad + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Draw Label (Character + Hat)
        ctx.fillStyle = color;
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const label_x = x_start + label_offset * Math.cos(angle_rad);
        const label_y = y_start + label_offset * Math.sin(angle_rad);
        
        // Draw the character
        ctx.fillText(label, label_x, label_y);

        // Draw the 'hat' (caret) manually above the character
        const hat_width = 8;
        const hat_height = 4;
        const hat_startX = label_x; 
        const hat_Y_base = label_y - 13; 

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hat_startX - hat_width / 2, hat_Y_base);
        ctx.lineTo(hat_startX, hat_Y_base - hat_height);
        ctx.lineTo(hat_startX + hat_width / 2, hat_Y_base);
        ctx.stroke();
    }

    // --- MAIN DRAW FUNCTION ---
    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#000080'; // Dark Blue Canvas Background
        ctx.fillRect(0, 0, W, H);

        // 1. Draw the Sun
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Asteroid's current position (moves during 'shrinking' phase)
        const ASTEROID_POS = polarToCartesian(state.a, 90, CENTER_X, CENTER_Y); 
        
        // Asteroid's impact position (fixed at the top of the initial orbit)
        const ASTEROID_IMPACT_POS = polarToCartesian(state.a_start, 90, CENTER_X, CENTER_Y);

        // 2. Draw Orbits
        // Final Orbit (Solid)
        if (state.animationPhase === 'complete' || state.animationPhase === 'shrinking') {
            ctx.setLineDash([]);
            ctx.strokeStyle = state.new_a > state.a_start ? 'lime' : 'red'; 
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(CENTER_X, CENTER_Y, state.new_a, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Initial Orbit (Dotted - Pure White)
        if (state.animationPhase === 'complete' || state.animationPhase === 'shrinking') {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'white'; 
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(CENTER_X, CENTER_Y, state.a_start, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.setLineDash([]); 
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(CENTER_X, CENTER_Y, state.a, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]); 

        // 3. Draw the Target Asteroid
        const ASTEROID_VISUAL_RADIUS = 10;
        ctx.fillStyle = '#6A0505';
        ctx.beginPath();
        ctx.arc(ASTEROID_POS.x, ASTEROID_POS.y, ASTEROID_VISUAL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Draw Unit Vectors (centered on the fixed impact position)
        const VEC_LEN = 40;
        
        // t hat (Tangent: Right, 0 degrees)
        drawVector(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y, 0, VEC_LEN, 'lime', 't');

        // n hat (Normal: Up/Outward, 90 degrees)
        drawVector(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y, 90, VEC_LEN, 'yellow', 'n');

        // s hat (Impactor Velocity: angle phi from t hat)
        const s_hat_angle = state.phi; 
        drawVector(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y, s_hat_angle, VEC_LEN, 'cyan', 's');

        // e hat (Ejecta Recoil: opposite s hat)
        const e_hat_angle = s_hat_angle + 180; 
        drawVector(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y, e_hat_angle, VEC_LEN, 'orange', 'e');
        
        // 5. Draw the Impactor and Path
        if (state.animationPhase === 'initial' || state.animationPhase === 'impact') {
            const imp_r = state.impactorDistance;
            const imp_angle = s_hat_angle + 180; 
            const imp_pos = polarToCartesian(imp_r, imp_angle, ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y);

            // Draw dashed line path
            if (state.animationPhase === 'initial' && state.impactorDistance > ASTEROID_VISUAL_RADIUS) {
                ctx.setLineDash([2, 4]);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.moveTo(imp_pos.x, imp_pos.y);
                ctx.lineTo(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw Impactor
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(imp_pos.x, imp_pos.y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw Impact BOOM!
            if (state.impactorDistance < ASTEROID_VISUAL_RADIUS) { 
                ctx.fillStyle = 'yellow';
                ctx.globalAlpha = (ASTEROID_VISUAL_RADIUS - state.impactorDistance) / ASTEROID_VISUAL_RADIUS * 0.8; 
                ctx.beginPath();
                ctx.arc(ASTEROID_IMPACT_POS.x, ASTEROID_IMPACT_POS.y, 25, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        // 6. Draw Ejecta Particles
        if (state.ejectaParticles.length > 0) {
            state.ejectaParticles.forEach(p => {
                ctx.fillStyle = `rgba(200, 200, 200, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // --- ANIMATION ENGINE ---

    function createEjectaParticles() {
        const numParticles = [0, 50, 100, 150][state.beta - 1]; 
        if (numParticles === 0) return;

        const ASTEROID_POS = polarToCartesian(state.a_start, 90, CENTER_X, CENTER_Y);
        const e_hat_angle = state.phi + 180; 
        
        state.ejectaParticles = [];
        for (let i = 0; i < numParticles; i++) {
            const angle_offset = (Math.random() - 0.5) * 40; 
            const angle_deg = e_hat_angle + angle_offset;
            const angle_rad = (angle_deg - 90) * Math.PI / 180;
            const speed = 1.5 + Math.random() * 2.5; 

            state.ejectaParticles.push({
                x: ASTEROID_POS.x,
                y: ASTEROID_POS.y,
                vx: speed * Math.cos(angle_rad),
                vy: speed * Math.sin(angle_rad),
                size: 1 + Math.random() * 1.5,
                opacity: 1,
                life: 0 
            });
        }
    }

    function updateEjecta(dt) {
        state.ejectaParticles = state.ejectaParticles.filter(p => p.opacity > 0);

        state.ejectaParticles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life += dt;
            p.opacity = Math.max(0, 1 - p.life / 4); 
        });
    }

    function animate(currentTime) {
        if (!state.lastTime) state.lastTime = currentTime;
        const deltaTime = (currentTime - state.lastTime) / 1000 * state.animationSpeed; 
        state.lastTime = currentTime;

        let shouldContinue = true;
        const ASTEROID_VISUAL_RADIUS = 10;

        if (state.animationPhase === 'initial') {
            const speed_factor = 100;
            const step = speed_factor * deltaTime; 
            state.impactorDistance -= step;

            if (state.impactorDistance <= ASTEROID_VISUAL_RADIUS) {
                state.impactorDistance = ASTEROID_VISUAL_RADIUS / 2; 
                state.animationPhase = 'impact';
                createEjectaParticles();
            }
        } else if (state.animationPhase === 'impact') {
            if (state.impactorDistance < 25) {
                state.impactorDistance += 20 * deltaTime; 
            }
            updateEjecta(deltaTime);

            if (state.impactorDistance >= 25) {
                state.animationPhase = 'shrinking';
                state.a_time_elapsed = 0;
            }

        } else if (state.animationPhase === 'shrinking') {
            const change_duration = 3; 
            state.a_time_elapsed += deltaTime;

            updateEjecta(deltaTime); 

            if (state.a_time_elapsed < change_duration) {
                const ratio = state.a_time_elapsed / change_duration;
                state.a = state.a_start + (state.new_a - state.a_start) * ratio;
            } else {
                state.a = state.new_a;
                state.animationPhase = 'complete';
            }
        } else if (state.animationPhase === 'complete') {
            updateEjecta(deltaTime); 
            shouldContinue = state.ejectaParticles.length > 0;
            if (!shouldContinue) {
                cancelAnimationFrame(state.animationFrameId);
                playButton.disabled = false;
                playButton.textContent = 'REPLAY';
                return;
            }
        }

        draw();

        if (shouldContinue) {
            state.animationFrameId = requestAnimationFrame(animate);
        }
    }

    // --- INITIALIZATION AND CONTROLS ---

    function resetToInitialState() {
        // DART initial settings
        sliders.mass.value = 500; 
        sliders.velocity.value = 6100; 
        sliders.a.value = 250; 
        sliders.beta.value = 3; 
        sliders.phi.value = 0; 
        
        // Reset state variables
        state.mass = 500;
        state.velocity = 6100;
        state.a = 250;
        state.a_start = 250;
        state.beta = 3;
        state.phi = 0;
        
        state.impactorDistance = 1.5 * state.a;
        state.animationPhase = 'initial';
        state.ejectaParticles = [];
        state.lastTime = 0;
        state.new_a = state.a;

        // Update all UI elements
        Object.keys(sliders).forEach(updateSliderValue);

        playButton.textContent = 'RUN IMPACT SIMULATION';
        playButton.disabled = false;
    }

    /**
     * Updates the state and UI when a slider is moved.
     */
    function updateSliderValue(name) {
        const slider = sliders[name];
        const valueSpan = values[name];
        let val = parseFloat(slider.value);

        state[name] = val; 

        // ONLY the 'a' slider should update the orbit radius values
        if (name === 'a') { 
            state.a = val;
            state.a_start = val;
            state.impactorDistance = 1.5 * val;
            state.animationPhase = 'initial'; 
        }

        let unit = '';
        let displayVal = val;
        switch (name) {
            case 'mass': unit = ' kg'; break;
            case 'velocity': unit = ' m/s'; break;
            case 'a':
                const a_au = val * VISUAL_TO_AU_RATIO;
                unit = ' AU'; 
                displayVal = a_au.toExponential(3); 
                break;
            case 'beta': unit = ` (${['None', 'Low', 'Medium', 'High'][val - 1]} Ejecta)`; break;
            case 'phi': unit = '°'; displayVal = `${val}°`; break;
            case 'speed':
                state.animationSpeed = val;
                unit = val == 10 ? 'Fast' : (val == 5 ? 'Normal' : 'Slow');
                valueSpan.textContent = unit;
                return;
        }

        valueSpan.textContent = displayVal + unit;
        updatePhysicsAndUI();
    }

    // Attach listeners
    Object.keys(sliders).forEach(name => {
        const slider = sliders[name];
        if (slider) {
            slider.addEventListener('input', () => updateSliderValue(name));
        }
    });

    playButton.addEventListener('click', () => {
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);

        if (playButton.textContent === 'REPLAY') {
            resetToInitialState();
            return;
        }

        playButton.disabled = true;
        playButton.textContent = 'IMPACT IN PROGRESS...';

        state.lastTime = null;
        state.animationPhase = 'initial';
        state.impactorDistance = state.a_start * 1.5; 
        state.ejectaParticles = [];
        
        updatePhysicsAndUI(); 

        state.animationFrameId = requestAnimationFrame(animate);
    });

    // Initial setup
    resetToInitialState();
    
    // Explicitly call KaTeX renderer
    setTimeout(() => {
        initializeKaTeX();
    }, 100);
    
    console.log('✅ Enhanced deflection tool initialized successfully!');
});

// Export for global access
window.initializeDeflectionTool = () => {
    console.log('Deflection tool initialization called');
};