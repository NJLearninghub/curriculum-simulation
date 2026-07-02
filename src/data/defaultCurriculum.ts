import { Standard, Subject, Topic, Chapter, Simulation } from "../types";

export const DEFAULT_STANDARDS: Standard[] = [
  { id: "std-11", name: "Std 11", order: 1 },
  { id: "std-12", name: "Std 12", order: 2 }
];

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "s11-physics", standardId: "std-11", name: "Physics", order: 1 },
  { id: "s11-chemistry", standardId: "std-11", name: "Chemistry", order: 2 },
  { id: "s11-math", standardId: "std-11", name: "Mathematics", order: 3 },
  { id: "s12-physics", standardId: "std-12", name: "Physics", order: 1 },
  { id: "s12-chemistry", standardId: "std-12", name: "Chemistry", order: 2 },
  { id: "s12-math", standardId: "std-12", name: "Mathematics", order: 3 }
];

export const DEFAULT_CHAPTERS: Chapter[] = [
  // Std 11 Physics
  { id: "s11-phys-mechanics", subjectId: "s11-physics", name: "Mechanics & Gravity", order: 1 },
  { id: "s11-phys-waves", subjectId: "s11-physics", name: "Waves & Sound", order: 2 },
  // Std 11 Math
  { id: "s11-math-trig", subjectId: "s11-math", name: "Trigonometry Basics", order: 1 },
  // Std 12 Physics
  { id: "s12-phys-optics", subjectId: "s12-physics", name: "Optics & Light", order: 1 }
];

export const DEFAULT_TOPICS: Topic[] = [
  // Std 11 Physics -> Mechanics & Gravity
  { id: "gravity-simulation", chapterId: "s11-phys-mechanics", name: "Universal Gravitation", order: 1, hasSimulation: true },
  { id: "pendulum-simulation", chapterId: "s11-phys-mechanics", name: "Simple Pendulum Motion", order: 2, hasSimulation: true },
  // Std 11 Math -> Trigonometry Basics
  { id: "trig-simulation", chapterId: "s11-math-trig", name: "Interactive Unit Circle", order: 1, hasSimulation: true }
];

// High-fidelity HTML simulations!
export const DEFAULT_SIMULATIONS: Record<string, Omit<Simulation, "uploadedBy" | "uploadedAt">> = {
  "gravity-simulation": {
    id: "gravity-simulation",
    topicId: "gravity-simulation",
    fileName: "gravity_sim.html",
    type: "html",
    version: 1,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Universal Gravitation Simulation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body class="p-6">
  <div class="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-sky-400">Universal Gravitation</h1>
        <p class="text-xs text-slate-400 mt-1">Explore Newton's Law: F = G * (m1 * m2) / r²</p>
      </div>
      <div class="mt-4 md:mt-0 flex gap-4 text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
        <div><span class="text-emerald-400">G</span> = 6.674 &times; 10⁻¹¹ N&middot;m²/kg²</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Simulation Canvas Area -->
      <div class="lg:col-span-2 bg-slate-950 rounded-xl p-4 border border-slate-800 relative flex flex-col items-center justify-center min-h-[300px]">
        <canvas id="simCanvas" width="500" height="260" class="w-full max-w-[500px] bg-slate-950 rounded"></canvas>
        <div id="vectorLegend" class="absolute bottom-4 left-4 text-[10px] text-slate-400 font-mono space-y-1 bg-slate-900/80 p-2 rounded border border-slate-800">
          <div class="flex items-center gap-1">
            <span class="inline-block w-3 h-1 bg-amber-500"></span> Force Vector (F₁₂)
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400">Parameters</h2>
        
        <!-- Mass 1 Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Mass 1 (Blue):</span>
            <span class="text-sky-400" id="m1Val">50 kg</span>
          </div>
          <input type="range" id="m1Range" min="10" max="150" value="50" class="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Mass 2 Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Mass 2 (Red):</span>
            <span class="text-red-400" id="m2Val">80 kg</span>
          </div>
          <input type="range" id="m2Range" min="10" max="150" value="80" class="w-full accent-red-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Distance Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Distance (r):</span>
            <span class="text-emerald-400" id="rVal">120 m</span>
          </div>
          <input type="range" id="rRange" min="40" max="250" value="120" class="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Calculated Force display -->
        <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-6">
          <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Gravitational Force (F)</div>
          <div class="text-2xl font-bold font-mono text-amber-400 mt-1" id="forceDisplay">1.85 &times; 10⁻⁸ N</div>
          <p class="text-[10px] text-slate-500 mt-2">Forces are equal in magnitude and opposite in direction (Newton's Third Law).</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    const m1Range = document.getElementById('m1Range');
    const m2Range = document.getElementById('m2Range');
    const rRange = document.getElementById('rRange');

    const m1Val = document.getElementById('m1Val');
    const m2Val = document.getElementById('m2Val');
    const rVal = document.getElementById('rVal');
    const forceDisplay = document.getElementById('forceDisplay');

    function draw() {
      const m1 = parseFloat(m1Range.value);
      const m2 = parseFloat(m2Range.value);
      const r = parseFloat(rRange.value);

      // Update values
      m1Val.textContent = m1 + ' kg';
      m2Val.textContent = m2 + ' kg';
      rVal.textContent = r + ' m';

      // Newton's law of gravitation calculation
      // For visual clarity, we multiply by a factor to make the force display friendly
      const G = 6.674e-11;
      const forceVal = G * (m1 * m2) / (r * r);
      forceDisplay.innerHTML = forceVal.toExponential(3) + ' N';

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const startX = canvas.width / 2 - r / 2;
      const endX = canvas.width / 2 + r / 2;

      // Draw dashed distance line
      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.setLineDash([5, 5]);
      ctx.moveTo(startX, centerY);
      ctx.lineTo(endX, centerY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Draw Distance label
      ctx.fillStyle = '#10b981';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('r = ' + r + 'm', canvas.width / 2, centerY - 15);

      // Mass 1 (Blue Planet) radius proportional to mass
      const r1 = 8 + Math.sqrt(m1) * 1.5;
      ctx.beginPath();
      ctx.arc(startX, centerY, r1, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText('m₁', startX, centerY + 3);

      // Mass 2 (Red Planet) radius proportional to mass
      const r2 = 8 + Math.sqrt(m2) * 1.5;
      ctx.beginPath();
      ctx.arc(endX, centerY, r2, 0, Math.PI * 2);
      ctx.fillStyle = '#f87171';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#f87171';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.fillText('m₂', endX, centerY + 3);

      // Force Vector Representation
      // Size proportional to logarithm of force to prevent screen overflow
      const vectorSize = Math.max(15, Math.min(100, Math.log10(forceVal * 1e12) * 15));

      // Force on m1 pulling to right (towards m2)
      drawArrow(startX + r1, centerY, startX + r1 + vectorSize, centerY, '#f59e0b');
      // Force on m2 pulling to left (towards m1)
      drawArrow(endX - r2, centerY, endX - r2 - vectorSize, centerY, '#f59e0b');
    }

    function drawArrow(fromx, fromy, tox, toy, color) {
      const headlen = 8; 
      const dx = tox - fromx;
      const dy = toy - fromy;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.moveTo(fromx, fromy);
      ctx.lineTo(tox, toy);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.moveTo(tox, toy);
      ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
      ctx.fill();
    }

    m1Range.addEventListener('input', draw);
    m2Range.addEventListener('input', draw);
    rRange.addEventListener('input', draw);

    // Initial call
    draw();
  </script>
</body>
</html>`
  },
  "pendulum-simulation": {
    id: "pendulum-simulation",
    topicId: "pendulum-simulation",
    fileName: "pendulum_sim.html",
    type: "html",
    version: 1,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Simple Pendulum Simulation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body class="p-6">
  <div class="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-teal-400">Simple Pendulum</h1>
        <p class="text-xs text-slate-400 mt-1">Explore Simple Harmonic Motion (SHM). Period T &approx; 2&pi;&radic;(L/g)</p>
      </div>
      <div class="mt-4 md:mt-0 flex gap-4 text-xs font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
        <button id="resetBtn" class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded font-semibold transition">Reset Angle</button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Canvas -->
      <div class="lg:col-span-2 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[300px] relative">
        <canvas id="simCanvas" width="500" height="300" class="w-full max-w-[500px] bg-slate-950 rounded"></canvas>
      </div>

      <!-- Controls Panel -->
      <div class="space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400">Controls</h2>
        
        <!-- Length Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>String Length (L):</span>
            <span class="text-teal-400" id="lVal">150 cm</span>
          </div>
          <input type="range" id="lRange" min="50" max="220" value="150" class="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Gravity Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Gravity (g):</span>
            <span class="text-orange-400" id="gVal">9.8 m/s²</span>
          </div>
          <input type="range" id="gRange" min="2" max="25" step="0.1" value="9.8" class="w-full accent-orange-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Dampening (friction) Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Air Resistance:</span>
            <span class="text-sky-400" id="fVal">Low</span>
          </div>
          <input type="range" id="fRange" min="0" max="0.05" step="0.001" value="0.002" class="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Calculated Period display -->
        <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 mt-6 space-y-3">
          <div>
            <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Theoretical Period (T)</div>
            <div class="text-2xl font-bold font-mono text-teal-400 mt-1" id="periodDisplay">2.46 s</div>
          </div>
          <div class="border-t border-slate-800 pt-2">
            <div class="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Current Angle (&theta;)</div>
            <div class="text-sm font-bold font-mono text-amber-400 mt-0.5" id="angleDisplay">0.0°</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    const lRange = document.getElementById('lRange');
    const gRange = document.getElementById('gRange');
    const fRange = document.getElementById('fRange');
    const resetBtn = document.getElementById('resetBtn');

    const lVal = document.getElementById('lVal');
    const gVal = document.getElementById('gVal');
    const fVal = document.getElementById('fVal');
    const periodDisplay = document.getElementById('periodDisplay');
    const angleDisplay = document.getElementById('angleDisplay');

    // Physical variables
    let angle = Math.PI / 4; // Start at 45 degrees
    let angleVelocity = 0.0;
    let angleAcceleration = 0.0;

    let lastTime = performance.now();

    function updateAndDraw() {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1); // cap time step to prevent tunneling
      lastTime = now;

      const L = parseFloat(lRange.value) / 100; // to meters
      const g = parseFloat(gRange.value);
      const damping = parseFloat(fRange.value);

      // Physics math: angular acceleration is - (g / L) * sin(theta)
      angleAcceleration = - (g / L) * Math.sin(angle);
      angleVelocity += angleAcceleration * dt;
      
      // Apply simple air resistance/friction
      angleVelocity *= (1 - damping);
      
      angle += angleVelocity * dt;

      // Update values
      lVal.textContent = Math.round(L * 100) + ' cm';
      gVal.textContent = g.toFixed(1) + ' m/s²';
      
      let resistanceStr = 'None';
      if (damping > 0.03) resistanceStr = 'High';
      else if (damping > 0.01) resistanceStr = 'Medium';
      else if (damping > 0.0) resistanceStr = 'Low';
      fVal.textContent = resistanceStr;

      // Theoretical Period: T = 2 * PI * sqrt(L / g)
      const T = 2 * Math.PI * Math.sqrt(L / g);
      periodDisplay.textContent = T.toFixed(2) + ' s';
      angleDisplay.textContent = (angle * 180 / Math.PI).toFixed(1) + '°';

      // Drawing Simple Pendulum
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const pivotX = canvas.width / 2;
      const pivotY = 30;
      
      // Convert polar coordinates (L, angle) to cartesian (x, y)
      // Visual scaling: multiply L (meters) by 100 for canvas pixels
      const drawL = L * 100; 
      const bobX = pivotX + drawL * Math.sin(angle);
      const bobY = pivotY + drawL * Math.cos(angle);

      // Draw Support Beam
      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.moveTo(pivotX - 40, pivotY);
      ctx.lineTo(pivotX + 40, pivotY);
      ctx.stroke();

      // Draw Pivot Point
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();

      // Draw String
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Draw Pendulum Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#14b8a6';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#14b8a6';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow

      // Request next frame
      requestAnimationFrame(updateAndDraw);
    }

    resetBtn.addEventListener('click', () => {
      angle = Math.PI / 4;
      angleVelocity = 0.0;
      angleAcceleration = 0.0;
    });

    // Start simulation
    updateAndDraw();
  </script>
</body>
</html>`
  },
  "trig-simulation": {
    id: "trig-simulation",
    topicId: "trig-simulation",
    fileName: "trig_sim.html",
    type: "html",
    version: 1,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Interactive Trigonometric Unit Circle</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #0f172a;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body class="p-6">
  <div class="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
    <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-violet-400">Trigonometric Unit Circle</h1>
        <p class="text-xs text-slate-400 mt-1">Visualize Angle relationships on a circle of radius R = 1</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Unit Circle Canvas -->
      <div class="lg:col-span-7 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
        <canvas id="circleCanvas" width="320" height="320" class="bg-slate-950 rounded"></canvas>
      </div>

      <!-- Controls Panel -->
      <div class="lg:col-span-5 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">Controls</h2>
        
        <!-- Angle Control -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-mono">
            <span>Angle (&theta;):</span>
            <span class="text-violet-400" id="thetaVal">45° / 0.79 rad</span>
          </div>
          <input type="range" id="thetaRange" min="0" max="360" value="45" class="w-full accent-violet-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Metric Readouts -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span class="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Cosine (x)</span>
            <div class="text-lg font-bold font-mono text-emerald-400" id="cosDisplay">0.707</div>
          </div>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <span class="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Sine (y)</span>
            <div class="text-lg font-bold font-mono text-rose-400" id="sinDisplay">0.707</div>
          </div>
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 col-span-2">
            <span class="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Tangent (sin/cos)</span>
            <div class="text-lg font-bold font-mono text-sky-400" id="tanDisplay">1.000</div>
          </div>
        </div>

        <div class="text-[10px] text-slate-500 font-mono space-y-1 bg-slate-950 border border-slate-800 p-3 rounded-xl mt-4">
          <div class="flex items-center gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full bg-violet-500"></span> Radius (Hypotenuse = 1)</div>
          <div class="flex items-center gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span> Sine Projection (Vertical)</div>
          <div class="flex items-center gap-2"><span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Cosine Projection (Horizontal)</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('circleCanvas');
    const ctx = canvas.getContext('2d');
    const thetaRange = document.getElementById('thetaRange');
    const thetaVal = document.getElementById('thetaVal');

    const cosDisplay = document.getElementById('cosDisplay');
    const sinDisplay = document.getElementById('sinDisplay');
    const tanDisplay = document.getElementById('tanDisplay');

    function draw() {
      const angleDeg = parseInt(thetaRange.value);
      const angleRad = angleDeg * Math.PI / 180;

      // Trig calculations
      const cosVal = Math.cos(angleRad);
      const sinVal = Math.sin(angleRad);
      const tanVal = Math.abs(cosVal) > 0.0001 ? Math.tan(angleRad) : Infinity;

      // Update text
      thetaVal.textContent = angleDeg + '° / ' + angleRad.toFixed(2) + ' rad';
      cosDisplay.textContent = cosVal.toFixed(3);
      sinDisplay.textContent = sinVal.toFixed(3);
      tanDisplay.textContent = Math.abs(tanVal) === Infinity ? 'Undefined' : tanVal.toFixed(3);

      // Draw circles and projections
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100; // scale factor

      // 1. Draw X & Y Axes
      ctx.beginPath();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.moveTo(10, centerY);
      ctx.lineTo(canvas.width - 10, centerY);
      ctx.moveTo(centerX, 10);
      ctx.lineTo(centerX, canvas.height - 10);
      ctx.stroke();

      // Axes Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText('X (cos)', canvas.width - 45, centerY - 5);
      ctx.fillText('Y (sin)', centerX + 5, 20);

      // 2. Draw Unit Circle (Radius = 100)
      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Coordinate Points mapping (in canvas, y is downwards, so we flip y projection)
      const targetX = centerX + radius * cosVal;
      const targetY = centerY - radius * sinVal; // Flip sign for visual canvas coordinate space

      // 3. Draw Cosine Projection (X line on axis)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.lineWidth = 3;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, centerY);
      ctx.stroke();

      // 4. Draw Sine Projection (Y line from X to point)
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e'; // Rose
      ctx.lineWidth = 3;
      ctx.moveTo(targetX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // 5. Draw Radius vector (Hypotenuse)
      ctx.beginPath();
      ctx.strokeStyle = '#8b5cf6'; // Violet
      ctx.lineWidth = 2.5;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      // 6. Draw point at the tip
      ctx.beginPath();
      ctx.arc(targetX, targetY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Draw angle sector curve
      ctx.beginPath();
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 1.5;
      ctx.arc(centerX, centerY, 20, 0, -angleRad, true); // True to sweep upwards counter-clockwise
      ctx.stroke();
    }

    thetaRange.addEventListener('input', draw);
    draw();
  </script>
</body>
</html>`
  }
};
