/**
 * AgriShield Crop AI - Core Application Logic
 * Implements SPA navigation, simulated sensor telemetry, procedural canvas leaf generation,
 * AI scanning simulation with visual heatmaps, interactive map inspection, and a task planner calendar.
 */

// ==========================================================================
// 1. Data Definitions (Crops & Diseases Encyclopedia)
// ==========================================================================
const DISEASES_DATABASE = {
    tomato_blight: {
        id: "tomato_blight",
        crop: "Tomato",
        disease: "Late Blight",
        scientific: "Phytophthora infestans",
        pathogen: "Oomycete (Fungal-like)",
        severity: "Severe",
        severityClass: "red",
        velocity: "High (Spreads within 48h)",
        confidence: "95.4%",
        confidenceVal: 95.4,
        description: "Late blight is a highly destructive oomycete disease. It thrives in humid, cool conditions, causing dark water-soaked lesions on leaves and stems. A white fungal-like growth often appears on the underside of infected foliage under high humidity, leading to rapid tissue death and crop failure.",
        symptoms: [
            "Irregular dark-brown to black spots on leaf edges with pale halos.",
            "Water-soaked lesions on stems that quickly turn brown and brittle.",
            "Fuzzy white mold-like sporulation on the leaf undersides in damp weather.",
            "Firm, dark, greasy bronze lesions on green and ripening fruits."
        ],
        remediations: [
            { id: "tb_prune", text: "Prune and destroy infected foliage immediately (do not compost).", type: "cultural" },
            { id: "tb_fungicide", text: "Apply copper-based protectant fungicide to surrounding healthy plants.", type: "chemical" },
            { id: "tb_drip", text: "Switch to drip-irrigation to keep leaves dry.", type: "cultural" },
            { id: "tb_neem", text: "Spray bio-fungicide containing Bacillus subtilis or Neem oil for organic defense.", type: "organic" }
        ],
        heatmapPoints: [
            { x: 120, y: 80, r: 25 },
            { x: 70, y: 150, r: 35 },
            { x: 230, y: 110, r: 30 }
        ],
        bbox: { x: 40, y: 50, w: 220, h: 160, label: "Late Blight (95%)" }
    },
    apple_scab: {
        id: "apple_scab",
        crop: "Apple",
        disease: "Apple Scab",
        scientific: "Venturia inaequalis",
        pathogen: "Ascomycete Fungus",
        severity: "Moderate",
        severityClass: "orange",
        velocity: "Medium (Slow foliar decline)",
        confidence: "88.7%",
        confidenceVal: 88.7,
        description: "Apple scab is a major fungal disease affecting wild and cultivated apples. It overwinters in fallen leaves and releases ascopores in spring. It primarily attacks leaves and fruit, causing olive-green to black velvety spots, leading to premature leaf drop and deformed fruit.",
        symptoms: [
            "Velvety, olive-green spots on leaves that turn dark brown to black over time.",
            "Raised, corky, brown lesions on apples that crack as fruit swells.",
            "Yellowing leaves that drop early in the season, weakening the tree.",
            "Puckering and curling of leaf tissue surrounding infection points."
        ],
        remediations: [
            { id: "as_rake", text: "Rake and burn/shred fallen apple leaves to reduce overwintering spore load.", type: "cultural" },
            { id: "as_sulfur", text: "Apply organic wettable sulfur sprays during bud burst.", type: "organic" },
            { id: "as_fungicide", text: "Schedule targeted applications of systemic fungicides (myclobutanil).", type: "chemical" },
            { id: "as_prune", text: "Prune tree canopy to maximize air circulation and sunlight penetration.", type: "cultural" }
        ],
        heatmapPoints: [
            { x: 100, y: 110, r: 15 },
            { x: 130, y: 90, r: 18 },
            { x: 170, y: 140, r: 12 },
            { x: 190, y: 170, r: 16 }
        ],
        bbox: { x: 75, y: 70, w: 150, h: 130, label: "Apple Scab (88%)" }
    },
    corn_rust: {
        id: "corn_rust",
        crop: "Corn",
        disease: "Common Rust",
        scientific: "Puccinia sorghi",
        pathogen: "Basidiomycete Fungus",
        severity: "Moderate",
        severityClass: "orange",
        velocity: "Medium (Wind-borne spread)",
        confidence: "91.2%",
        confidenceVal: 91.2,
        description: "Common rust occurs wherever corn is grown. It is caused by Puccinia sorghi, which releases orange-red powdery spores. Warm, humid conditions favor rust development. While rarely fatal, severe infections deplete plant carbohydrates, causing lower yield.",
        symptoms: [
            "Small, powdery, cinnamon-brown pustules on both upper and lower leaf surfaces.",
            "Elongated rusty streaks that erupt, releasing powdery orange spores.",
            "Chlorosis (yellowing) of leaves when rust density is extremely high.",
            "Premature drying and death of leaves in severe outbreaks."
        ],
        remediations: [
            { id: "cr_resistant", text: "Plant rust-resistant hybrids in the upcoming planting cycle.", type: "cultural" },
            { id: "cr_nitrogen", text: "Ensure adequate nitrogen fertilization to encourage vegetative growth.", type: "cultural" },
            { id: "cr_spray", text: "Apply foliar triazole fungicides if pustules appear prior to tasseling.", type: "chemical" }
        ],
        heatmapPoints: [
            { x: 60, y: 70, r: 8 },
            { x: 90, y: 100, r: 10 },
            { x: 140, y: 120, r: 9 },
            { x: 190, y: 160, r: 12 },
            { x: 220, y: 190, r: 11 }
        ],
        bbox: { x: 45, y: 50, w: 210, h: 160, label: "Corn Rust (91%)" }
    },
    grape_rot: {
        id: "grape_rot",
        crop: "Grape",
        disease: "Black Rot",
        scientific: "Guignardia bidwellii",
        pathogen: "Ascomycete Fungus",
        severity: "Severe",
        severityClass: "red",
        velocity: "High (Ruins fruit yield)",
        confidence: "93.8%",
        confidenceVal: 93.8,
        description: "Black rot is a highly destructive fungal disease of grapes. It can cause complete crop loss under wet conditions. The fungus attacks all green parts of the vine: leaves, shoots, tendrils, and berries, transforming plump grapes into hard, shriveled black mummies.",
        symptoms: [
            "Small, circular, tan spots on leaves with dark brown borders.",
            "Tiny black pimple-like fruiting bodies (pycnidia) arranged in rings inside leaf spots.",
            "Purple-black sunken lesions on young shoots and petioles.",
            "Berries rotting, shriveling, turning into hard black mummies covered in spore cases."
        ],
        remediations: [
            { id: "gr_sanitize", text: "Prune and dispose of infected shoots and shriveled mummified grapes.", type: "cultural" },
            { id: "gr_fungicide", text: "Apply copper fungicide or biological agents early in spring at bud break.", type: "organic" },
            { id: "gr_chemical", text: "Apply synthetic fungicides (mancozeb or sterol inhibitors) from pre-bloom to harvest.", type: "chemical" },
            { id: "gr_weed", text: "Keep vineyard weeded to reduce moisture retention around lower leaves.", type: "cultural" }
        ],
        heatmapPoints: [
            { x: 90, y: 90, r: 20 },
            { x: 180, y: 130, r: 25 },
            { x: 140, y: 170, r: 22 }
        ],
        bbox: { x: 60, y: 60, w: 170, h: 150, label: "Black Rot (93%)" }
    },
    tomato_healthy: {
        id: "tomato_healthy",
        crop: "Tomato",
        disease: "Healthy Leaf",
        scientific: "Solanum lycopersicum",
        pathogen: "None (Healthy)",
        severity: "Optimal",
        severityClass: "green",
        velocity: "None",
        confidence: "99.1%",
        confidenceVal: 99.1,
        description: "The crop shows optimal physiological indices. Leaf chlorophyll distribution is uniform with no necrotic patches, viral chlorosis, or oomycete hyphae. Stomatal distribution is normal and water turgor pressure is ideal.",
        symptoms: [
            "Uniform rich green color across the leaf blade.",
            "Clean veins with no discoloration or vascular browning.",
            "Stiff, turgid leaf petiole showing no signs of wilt.",
            "Absence of fungal sporulation, powdery spots, or insect chew-marks."
        ],
        remediations: [
            { id: "hl_irrigation", text: "Maintain current microclimatic parameters and soil moisture schedule.", type: "cultural" },
            { id: "hl_inspect", text: "Conduct regular visual checks every 5 days for early pathogen signs.", type: "cultural" }
        ],
        heatmapPoints: [],
        bbox: { x: 30, y: 35, w: 240, h: 190, label: "Healthy (99%)" }
    }
};


// ==========================================================================
// 2. Global State Management
// ==========================================================================
const AppState = {
    currentTab: "dashboard",
    currentTheme: "dark",
    currentRegion: "north",
    calendarDate: new Date(2026, 5, 23), // June 2026
    tasks: [],
    scannerLoadedPreset: null,
    telemetryInterval: null
};

// Initialize App on DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTimeClock();
    initNavigation();
    initTelemetrySimulator();
    initScanner();
    initFieldMap();
    initCalendar();
    initLibrary();
    
    // Load tasks from LocalStorage
    loadTasks();
    
    // Update Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// ==========================================================================
// 3. Navigation & Utilities
// ==========================================================================
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    AppState.currentTab = tabId;
    
    // Update sidebar UI state
    document.querySelectorAll(".nav-item").forEach(btn => {
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Update active panel view
    document.querySelectorAll(".tab-panel").forEach(panel => {
        if (panel.id === `${tabId}-tab`) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });

    // Specific triggers on tab load
    if (tabId === "calendar") {
        renderCalendar();
    }
}

// Global scope switchTab for inline HTML bindings
window.switchTab = switchTab;

function initTheme() {
    const themeBtn = document.getElementById("theme-toggle");
    
    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem("agrishield-theme") || "dark";
    setTheme(savedTheme);
    
    themeBtn.addEventListener("click", () => {
        const nextTheme = AppState.currentTheme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
    });
}

function setTheme(theme) {
    AppState.currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("agrishield-theme", theme);
}

function initTimeClock() {
    const timeDisplay = document.getElementById("current-time");
    const updateTime = () => {
        const now = new Date();
        const options = { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        timeDisplay.textContent = now.toLocaleDateString('en-US', options);
    };
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
}

// ==========================================================================
// 4. Simulated Real-time Telemetry
// ==========================================================================
function initTelemetrySimulator() {
    const getTelemetryValues = () => {
        // Base values slightly influenced by the region selected
        let tempBase = 24.5;
        let humidBase = 84;
        let moistureBase = 38;
        let uvBase = 5.2;

        if (AppState.currentRegion === "south") {
            tempBase = 26.8;
            humidBase = 68;
            moistureBase = 44;
            uvBase = 7.1;
        } else if (AppState.currentRegion === "east") {
            tempBase = 22.1;
            humidBase = 55;
            moistureBase = 32;
            uvBase = 6.4;
        }

        // Fluctuate slightly
        return {
            temp: (tempBase + (Math.random() * 2 - 1)).toFixed(1),
            humidity: Math.round(humidBase + (Math.random() * 10 - 5)),
            moisture: Math.round(moistureBase + (Math.random() * 8 - 4)),
            uv: (uvBase + (Math.random() * 1 - 0.5)).toFixed(1)
        };
    };

    const updateDashboardCards = () => {
        const metrics = getTelemetryValues();
        
        // Element references
        const tempEl = document.getElementById("val-temp");
        const humidEl = document.getElementById("val-humidity");
        const moistEl = document.getElementById("val-moisture");
        const uvEl = document.getElementById("val-uv");
        
        if (!tempEl) return; // Prevent errors if not in dashboard viewport

        tempEl.textContent = `${metrics.temp}°C`;
        humidEl.textContent = `${metrics.humidity}%`;
        moistEl.textContent = `${metrics.moisture}%`;
        uvEl.textContent = `${metrics.uv} UV`;

        // Update humidity card hazard levels based on simulated humidity threshold
        const humidCard = document.getElementById("soil-card");
        const humidLabel = humidCard.querySelector(".status-label");
        const humidFooter = humidCard.querySelector(".card-footer");

        if (metrics.humidity >= 80) {
            humidCard.className = "telemetry-card alert-high";
            humidLabel.className = "status-label high";
            humidLabel.textContent = "High Humidity";
            humidFooter.innerHTML = '<i data-lucide="alert-triangle"></i> Favorable for fungal sporulation.';
        } else if (metrics.humidity >= 65) {
            humidCard.className = "telemetry-card alert-warning";
            humidLabel.className = "status-label warning";
            humidLabel.textContent = "Mild Humidity";
            humidFooter.innerHTML = '<i data-lucide="info"></i> Standard monitoring.';
        } else {
            humidCard.className = "telemetry-card";
            humidLabel.className = "status-label optimal";
            humidLabel.textContent = "Optimal";
            humidFooter.innerHTML = '<i data-lucide="check-circle"></i> Spore dispersal suppressed.';
        }

        // Update moisture card warnings
        const moistCard = document.getElementById("soil-moist-card");
        const moistLabel = moistCard.querySelector(".status-label");
        const moistFooter = moistCard.querySelector(".card-footer");

        if (metrics.moisture < 35) {
            moistCard.className = "telemetry-card alert-warning";
            moistLabel.className = "status-label warning";
            moistLabel.textContent = "Dry Soil";
            moistFooter.innerHTML = '<i data-lucide="info"></i> Irrigation recommended for Sector A2.';
        } else if (metrics.moisture > 75) {
            moistCard.className = "telemetry-card alert-high";
            moistLabel.className = "status-label high";
            moistLabel.textContent = "Waterlogged";
            moistFooter.innerHTML = '<i data-lucide="alert-triangle"></i> Root rot danger in Sector C1.';
        } else {
            moistCard.className = "telemetry-card";
            moistLabel.className = "status-label optimal";
            moistLabel.textContent = "Optimal";
            moistFooter.innerHTML = '<i data-lucide="check-circle"></i> Ideal soil water tension.';
        }
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // Trigger region selector changes
    const regionSelector = document.getElementById("region-selector");
    regionSelector.addEventListener("change", (e) => {
        AppState.currentRegion = e.target.value;
        updateDashboardCards();
    });

    // Run interval
    updateDashboardCards();
    AppState.telemetryInterval = setInterval(updateDashboardCards, 6000);
}

// ==========================================================================
// 5. Automated AI Scanner Engine & Canvas
// ==========================================================================
function initScanner() {
    const canvas = document.getElementById("scanner-canvas");
    const ctx = canvas.getContext("2d");
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("image-upload");
    const browseBtn = document.getElementById("browse-btn");
    
    const uploadState = document.getElementById("upload-placeholder-state");
    const previewState = document.getElementById("scanner-preview-state");
    const resultsPlaceholder = document.getElementById("results-placeholder");
    const resultsContent = document.getElementById("results-content");
    const laserLine = document.getElementById("scanner-line");
    const scanLoader = document.getElementById("scanner-loader");

    // Configure canvas size
    canvas.width = 300;
    canvas.height = 240;

    // Set up upload triggers
    browseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    dropzone.addEventListener("click", () => {
        if (fileInput.files.length === 0 && !AppState.scannerLoadedPreset) {
            fileInput.click();
        }
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleUserFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleUserFile(e.target.files[0]);
        }
    });

    // Mock diagnosis selector based on current region
    function getMockDiseaseForRegion(region) {
        const candidates = {
            north: ['tomato_blight', 'apple_scab', 'tomato_healthy'],
            south: ['corn_rust', 'grape_rot', 'tomato_blight'],
            east: ['apple_scab', 'tomato_healthy', 'corn_rust']
        };
        const pool = candidates[region] || Object.keys(DISEASES_DATABASE).filter(k => k !== 'tomato_healthy');
        const id = pool[Math.floor(Math.random() * pool.length)];
        return DISEASES_DATABASE[id];
    }

    // User Upload File Processing
    function handleUserFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                AppState.scannerLoadedPreset = null;
                uploadState.classList.add("hidden");
                previewState.classList.remove("hidden");
                
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                ctx.drawImage(img, x, y, w, h);
                
                const mockDisease = getMockDiseaseForRegion(AppState.currentRegion);
                runAnalysisProcess(mockDisease, img, x, y, w, h);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Set up Presets Click triggers
    const presetBtns = document.querySelectorAll(".preset-btn");
    presetBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const presetId = btn.getAttribute("data-preset");
            loadPresetLeaf(presetId);
        });
    });

    // Procedural Leaf Generation on Canvas
    function loadPresetLeaf(presetId) {
        const dbEntry = DISEASES_DATABASE[presetId];
        if (!dbEntry) return;

        AppState.scannerLoadedPreset = dbEntry;
        
        // UI Visual Updates
        uploadState.classList.add("hidden");
        previewState.classList.remove("hidden");

        // Clear canvas
        ctx.fillStyle = "#0a0e0c";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw leaf procedurally
        drawProceduralLeaf(dbEntry);

        // Run analysis process
        runAnalysisProcess(dbEntry);
    }

    // Exported function for Map Tab to trigger scan directly
    window.loadPresetLeafDirect = (presetId) => {
        switchTab("scanner");
        loadPresetLeaf(presetId);
    };

    function drawProceduralLeaf(dbEntry) {
        ctx.save();
        ctx.translate(150, 120); // Move origin to center of canvas

        const isHealthy = dbEntry.id === "tomato_healthy";
        
        // Draw stem
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.quadraticCurveTo(5, 100, 10, 120);
        ctx.strokeStyle = "#4d7c0f";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Draw leaf blade shape (using overlapping bezier curves)
        ctx.beginPath();
        ctx.moveTo(0, 80); // Bottom tip of blade
        ctx.bezierCurveTo(-80, 50, -90, -50, 0, -100); // Left half of blade
        ctx.bezierCurveTo(90, -50, 80, 50, 0, 80); // Right half of blade
        
        // Leaf base coloring
        if (isHealthy) {
            ctx.fillStyle = "#15803d"; // Deep vibrant green
        } else {
            ctx.fillStyle = "#1e3a1e"; // Slightly duller yellow-green background
        }
        ctx.fill();
        ctx.strokeStyle = "#3f6212";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw veins
        ctx.beginPath();
        // Central vein
        ctx.moveTo(0, 80);
        ctx.lineTo(0, -95);
        
        // Side veins
        ctx.moveTo(0, 40); ctx.lineTo(-45, 10);
        ctx.moveTo(0, 40); ctx.lineTo(45, 10);
        ctx.moveTo(0, 10); ctx.lineTo(-55, -20);
        ctx.moveTo(0, 10); ctx.lineTo(55, -20);
        ctx.moveTo(0, -20); ctx.lineTo(-45, -50);
        ctx.moveTo(0, -20); ctx.lineTo(45, -50);
        ctx.moveTo(0, -50); ctx.lineTo(-25, -75);
        ctx.moveTo(0, -50); ctx.lineTo(25, -75);
        
        ctx.strokeStyle = isHealthy ? "#22c55e" : "#5b8423";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw pathological lesions/spots based on preset selected
        if (dbEntry.id === "tomato_blight") {
            // Draw dark lesions with necrotic zones
            drawFungalLesion(-35, 10, 18, "#3f1e09", "#eab308");
            drawFungalLesion(40, -10, 14, "#291507", "#ca8a04");
            drawFungalLesion(-10, -50, 22, "#3f1e09", "#eab308");
            drawFungalLesion(20, 40, 12, "#3f1e09", "#a16207");
        } else if (dbEntry.id === "apple_scab") {
            // Olive/black velvety cork spots
            drawScabLesion(-20, -10, 8);
            drawScabLesion(-10, 20, 12);
            drawScabLesion(30, 10, 10);
            drawScabLesion(20, -40, 7);
            drawScabLesion(-45, -20, 6);
            drawScabLesion(35, -20, 9);
        } else if (dbEntry.id === "corn_rust") {
            // Many small rust-brown spores
            drawRustSpore(-50, 0); drawRustSpore(-35, 20); drawRustSpore(-15, 30);
            drawRustSpore(10, 40); drawRustSpore(45, 20); drawRustSpore(30, 0);
            drawRustSpore(-40, -30); drawRustSpore(-20, -20); drawRustSpore(0, -10);
            drawRustSpore(20, -30); drawRustSpore(45, -20); drawRustSpore(-20, -60);
            drawRustSpore(20, -60); drawRustSpore(5, -75);
        } else if (dbEntry.id === "grape_rot") {
            // Tan spots with dark concentric rings
            drawRotLesion(-25, 30, 16);
            drawRotLesion(30, 20, 20);
            drawRotLesion(5, -30, 18);
        }

        ctx.restore();
    }

    // Helper: draw irregular oomycete lesions (Tomato Late Blight)
    function drawFungalLesion(lx, ly, radius, innerColor, haloColor) {
        ctx.beginPath();
        // Halo
        ctx.arc(lx, ly, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = haloColor;
        ctx.filter = "blur(4px)";
        ctx.fill();
        ctx.filter = "none";
        
        // Inner spot
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.fillStyle = innerColor;
        ctx.fill();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // Helper: draw apple scab patches
    function drawScabLesion(lx, ly, radius) {
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#1e293b";
        ctx.fill();
        
        // Draw scabby cracks inside
        ctx.beginPath();
        ctx.moveTo(lx - radius + 2, ly);
        ctx.lineTo(lx + radius - 2, ly);
        ctx.moveTo(lx, ly - radius + 2);
        ctx.lineTo(lx, ly + radius - 2);
        ctx.strokeStyle = "#020617";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Helper: draw corn rust pustules
    function drawRustSpore(lx, ly) {
        ctx.beginPath();
        ctx.ellipse(lx, ly, 3, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ea580c"; // Rust Orange
        ctx.fill();
        ctx.strokeStyle = "#7c2d12"; // Dark brown border
        ctx.lineWidth = 0.8;
        ctx.stroke();
    }

    // Helper: draw grape black rot lesion with rings
    function drawRotLesion(lx, ly, radius) {
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#a8a29e"; // Tan color
        ctx.fill();
        ctx.strokeStyle = "#57534e"; // Dark border
        ctx.lineWidth = 2;
        ctx.stroke();

        // Concentric ring of black fruiting bodies
        ctx.beginPath();
        ctx.arc(lx, ly, radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = "#292524";
        ctx.setLineDash([2, 4]); // Rings modeled as dashed lines
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
    }

    // Neural Network Scanner Animation Simulator
    function runAnalysisProcess(dbEntry, userImg = null, rx = 0, ry = 0, rw = 0, rh = 0) {
        resultsPlaceholder.classList.add("hidden");
        resultsContent.classList.add("hidden");
        laserLine.classList.remove("hidden");
        scanLoader.classList.remove("hidden");

        // Wait 2.5 seconds, then display diagnostic outputs
        setTimeout(() => {
            laserLine.classList.add("hidden");
            scanLoader.classList.add("hidden");
            
            // Draw diagnosis bounding boxes & heatmaps overlayed on the canvas
            if (userImg) {
                // If it was a user upload, redraw original first
                ctx.fillStyle = "#000000";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(userImg, rx, ry, rw, rh);
                
                // Draw mock target boxes at static regions
                drawDetectionOverlay(dbEntry.bbox, [{ x: rx + rw/2, y: ry + rh/2, r: 40 }]);
            } else {
                // For presets, redraw clean leaf, then apply visual heatspots & bounding boxes
                ctx.fillStyle = "#0a0e0c";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                drawProceduralLeaf(dbEntry);
                drawDetectionOverlay(dbEntry.bbox, dbEntry.heatmapPoints);
            }

            // Fill text details in the right results pane
            showDiagnosisReport(dbEntry);
        }, 2200);
    }

    function drawDetectionOverlay(bbox, heatmaps) {
        // Draw Heatspots overlay (Alpha layer semi-transparent red glows)
        heatmaps.forEach(spot => {
            // Radial gradient for hotspot glow
            const radGrad = ctx.createRadialGradient(spot.x, spot.y, 2, spot.x, spot.y, spot.r);
            radGrad.addColorStop(0, "rgba(239, 68, 68, 0.75)"); // Solid red center
            radGrad.addColorStop(0.5, "rgba(245, 158, 11, 0.45)"); // Amber middle
            radGrad.addColorStop(1, "rgba(239, 68, 68, 0)"); // Fading edge
            
            ctx.beginPath();
            ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
            ctx.fillStyle = radGrad;
            ctx.fill();
        });

        // Draw Bounding Box
        ctx.strokeStyle = bbox.label.includes("Healthy") ? "#10b981" : "#ef4444";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(bbox.x, bbox.y, bbox.w, bbox.h);
        ctx.setLineDash([]);

        // Label Tag
        ctx.fillStyle = bbox.label.includes("Healthy") ? "#10b981" : "#ef4444";
        ctx.fillRect(bbox.x, bbox.y - 20, 140, 20);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Inter";
        ctx.fillText(bbox.label, bbox.x + 8, bbox.y - 6);
    }

    // Populate Right Result Pane
    function showDiagnosisReport(dbEntry) {
        resultsContent.classList.remove("hidden");

        document.getElementById("res-crop-type").textContent = dbEntry.crop;
        document.getElementById("res-disease-name").textContent = `${dbEntry.disease} Detection`;
        document.getElementById("res-confidence-bar").style.width = dbEntry.confidence;
        document.getElementById("res-confidence-val").textContent = dbEntry.confidence;
        
        // Severity Pill
        const severityPill = document.getElementById("res-severity-pill");
        const severityVal = document.getElementById("res-severity-val");
        severityVal.textContent = dbEntry.severity;
        severityPill.className = `info-pill ${dbEntry.severityClass}`;

        document.getElementById("res-pathogen-val").textContent = dbEntry.pathogen;
        document.getElementById("res-velocity-val").textContent = dbEntry.velocity;
        document.getElementById("res-description").textContent = dbEntry.description;

        // Populate checklists
        const checklistContainer = document.getElementById("recommendations-list");
        checklistContainer.innerHTML = ""; // Clear existing

        dbEntry.remediations.forEach((item, index) => {
            const label = document.createElement("label");
            label.className = "task-checkbox-label";
            label.innerHTML = `
                <input type="checkbox" checked data-task-text="${item.text}" data-crop-tag="${dbEntry.crop}">
                <span>${item.text} <strong class="badge-success preset-badge">${item.type}</strong></span>
            `;
            checklistContainer.appendChild(label);
        });

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Clear Scanner Trigger
    const clearScanBtn = document.getElementById("clear-scan-btn");
    clearScanBtn.addEventListener("click", () => {
        fileInput.value = "";
        AppState.scannerLoadedPreset = null;
        uploadState.classList.remove("hidden");
        previewState.classList.add("hidden");
        resultsContent.classList.add("hidden");
        resultsPlaceholder.classList.remove("hidden");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // Add selected items to Treatment Scheduler
    const addToCalendarBtn = document.getElementById("add-to-calendar-btn");
    addToCalendarBtn.addEventListener("click", () => {
        const checkedInputs = document.querySelectorAll("#recommendations-list input:checked");
        if (checkedInputs.length === 0) return;

        // Schedule them for today
        const todayStr = getISOString(new Date());

        checkedInputs.forEach(input => {
            const taskText = input.getAttribute("data-task-text");
            const cropTag = input.getAttribute("data-crop-tag");
            
            // Add task object
            AppState.tasks.push({
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                title: taskText,
                crop: cropTag,
                date: todayStr,
                done: false
            });
        });

        saveTasks();
        renderCalendar();
        
        // Notify farmer with custom visual feedback
        addToCalendarBtn.innerHTML = '<i data-lucide="check"></i> Scheduled Successfully!';
        addToCalendarBtn.style.backgroundColor = "var(--color-success)";
        
        setTimeout(() => {
            addToCalendarBtn.innerHTML = '<i data-lucide="calendar-plus"></i> Add Selected to Treatment Plan';
            addToCalendarBtn.style.backgroundColor = "var(--primary)";
            if (window.lucide) window.lucide.createIcons();
        }, 1500);

        updatePendingTasksCountBadge();
    });
}

// Helper: Format Date to YYYY-MM-DD
function getISOString(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

// ==========================================================================
// 6. Interactive Field Outbreak Map
// ==========================================================================
function initFieldMap() {
    const fields = document.querySelectorAll(".map-field");
    const inspectDefaultMsg = document.getElementById("inspector-default-msg");
    const inspectDataView = document.getElementById("inspector-data-view");

    // Element bindings
    const inspectFieldId = document.getElementById("inspect-field-id");
    const inspectCropName = document.getElementById("inspect-crop-name");
    const inspectRiskBadge = document.getElementById("inspect-risk-badge");
    const inspectTemp = document.getElementById("inspect-temp");
    const inspectMoisture = document.getElementById("inspect-moisture");
    const inspectHumidity = document.getElementById("inspect-humidity");
    const inspectPathogen = document.getElementById("inspect-pathogen");
    
    let activeField = null;

    fields.forEach(field => {
        field.addEventListener("mouseenter", () => {
            showFieldDetailsInInspector(field);
        });

        field.addEventListener("click", () => {
            // Toggle selection class highlight
            fields.forEach(f => f.classList.remove("selected"));
            field.classList.add("selected");
            activeField = field;
            showFieldDetailsInInspector(field);
        });
    });

    function showFieldDetailsInInspector(fieldElement) {
        inspectDefaultMsg.classList.add("hidden");
        inspectDataView.classList.remove("hidden");

        const fieldId = fieldElement.getAttribute("data-field-id");
        const crop = fieldElement.getAttribute("data-crop");
        const risk = fieldElement.getAttribute("data-risk");
        const temp = fieldElement.getAttribute("data-temp");
        const moisture = fieldElement.getAttribute("data-moist");
        const humidity = fieldElement.getAttribute("data-humidity");

        inspectFieldId.textContent = `Field Sector ${fieldId}`;
        inspectCropName.textContent = `${crop} Cultivation`;
        
        inspectTemp.textContent = temp;
        inspectMoisture.textContent = moisture;
        inspectHumidity.textContent = humidity;

        // Pathogen risk labeling
        inspectRiskBadge.textContent = risk;
        const diseaseMatch = risk.match(/\(([^)]+)\)/);
        const diseaseName = diseaseMatch ? diseaseMatch[1] : 'None Detected';
        if (risk.includes("Critical")) {
            inspectRiskBadge.className = "risk-badge high";
        } else if (risk.includes("Moderate")) {
            inspectRiskBadge.className = "risk-badge mod";
        } else {
            inspectRiskBadge.className = "risk-badge low";
        }
        inspectPathogen.textContent = diseaseName;
    }

    // Inspector Action: Diagnose Crop Sample
    const inspectDiagnoseBtn = document.getElementById("inspect-diagnose-btn");
    inspectDiagnoseBtn.addEventListener("click", () => {
        if (!activeField) return;
        
        const crop = activeField.getAttribute("data-crop");
        const risk = activeField.getAttribute("data-risk");

        const diseaseMatch = risk.match(/\(([^)]+)\)/);
        const diseaseName = diseaseMatch ? diseaseMatch[1].toLowerCase() : '';
        let presetId = "tomato_healthy";
        if (diseaseName.includes('blight')) presetId = "tomato_blight";
        else if (diseaseName.includes('scab')) presetId = "apple_scab";
        else if (diseaseName.includes('rust')) presetId = "corn_rust";
        else if (diseaseName.includes('rot')) presetId = "grape_rot";
        else if (diseaseName.includes('spot') || diseaseName.includes('leaf')) presetId = "tomato_blight";
        else if (crop === "Potato") presetId = "tomato_blight";
        else if (crop === "Apple") presetId = "apple_scab";
        else if (crop === "Grape") presetId = "grape_rot";
        else if (crop === "Corn") presetId = "corn_rust";

        window.loadPresetLeafDirect(presetId);
    });

    // Inspector Action: Trigger targeted drip irrigation
    const inspectWaterBtn = document.getElementById("inspect-water-btn");
    inspectWaterBtn.addEventListener("click", () => {
        if (!activeField) return;

        // Simulating IoT call
        activeField.setAttribute("data-moist", "65%");
        inspectMoisture.textContent = "65%";
        inspectWaterBtn.innerHTML = '<i data-lucide="check"></i> Irrigation Triggered';
        inspectWaterBtn.style.backgroundColor = "var(--color-success)";

        // Revert map coloring if fields were dry
        activeField.classList.remove("field-warning");
        activeField.classList.add("field-healthy");
        
        setTimeout(() => {
            inspectWaterBtn.innerHTML = '<i data-lucide="droplet"></i> Trigger Targeted Drip Irrigation';
            inspectWaterBtn.style.backgroundColor = "";
            if (window.lucide) window.lucide.createIcons();
        }, 1500);
    });
}

// ==========================================================================
// 7. Localized Treatment Scheduler Calendar
// ==========================================================================
function initCalendar() {
    const prevMonthBtn = document.getElementById("prev-month-btn");
    const nextMonthBtn = document.getElementById("next-month-btn");
    const addTaskForm = document.getElementById("add-task-form");

    // Pre-populate input date with current date representation
    document.getElementById("task-date-input").value = getISOString(new Date());

    prevMonthBtn.addEventListener("click", () => {
        AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener("click", () => {
        AppState.calendarDate.setMonth(AppState.calendarDate.getMonth() + 1);
        renderCalendar();
    });

    addTaskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("task-title-input").value;
        const crop = document.getElementById("task-crop-input").value;
        const date = document.getElementById("task-date-input").value;

        AppState.tasks.push({
            id: Date.now().toString(),
            title,
            crop,
            date,
            done: false
        });

        // Reset title field
        document.getElementById("task-title-input").value = "";

        saveTasks();
        renderCalendar();
        updatePendingTasksCountBadge();
    });
}

function renderCalendar() {
    const daysContainer = document.getElementById("calendar-days-container");
    const monthYearLabel = document.getElementById("calendar-month-year");
    
    if (!daysContainer) return; // Prevent crashes if views aren't visible
    
    daysContainer.innerHTML = "";

    const date = AppState.calendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();

    // Set Month Year Title
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearLabel.textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and total days
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Render Previous Month Padding Days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dNum = prevMonthTotalDays - i;
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day other-month";
        dayDiv.innerHTML = `<span class="day-num">${dNum}</span>`;
        daysContainer.appendChild(dayDiv);
    }

    // Render Current Month Days
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayDiv = document.createElement("div");
        const dayDate = new Date(year, month, day);
        const dayStr = getISOString(dayDate);
        
        let isTodayClass = "";
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            isTodayClass = "today";
        }
        
        dayDiv.className = `calendar-day ${isTodayClass}`;
        
        // Find tasks scheduled on this specific day
        const dayTasks = AppState.tasks.filter(t => t.date === dayStr && !t.done);
        let dotsHtml = "";
        if (dayTasks.length > 0) {
            dotsHtml = '<div class="day-tasks-dots">';
            dayTasks.slice(0, 3).forEach(task => {
                const cropClass = task.crop.toLowerCase();
                dotsHtml += `<span class="task-dot ${cropClass}"></span>`;
            });
            if (dayTasks.length > 3) dotsHtml += '<span class="task-dot other"></span>';
            dotsHtml += '</div>';
        }

        dayDiv.innerHTML = `
            <span class="day-num">${day}</span>
            ${dotsHtml}
        `;

        // Click day cell: update date filter in adding tasks
        dayDiv.addEventListener("click", () => {
            document.getElementById("task-date-input").value = dayStr;
            renderTasksList(dayStr); // Filter tasks in sidebar to highlight this day
        });

        daysContainer.appendChild(dayDiv);
    }

    // Auto load current date tasks
    renderTasksList(getISOString(new Date()));
}

function renderTasksList(filterDateStr = null) {
    const container = document.getElementById("task-items-container");
    const countLabel = document.getElementById("tasks-counter-label");
    
    if (!container) return;

    container.innerHTML = "";

    // If filterDateStr matches, sort tasks to place matching tasks first, otherwise show all
    let tasksToRender = [...AppState.tasks];
    
    if (filterDateStr) {
        // Sort matching date tasks to the top
        tasksToRender.sort((a, b) => {
            if (a.date === filterDateStr && b.date !== filterDateStr) return -1;
            if (a.date !== filterDateStr && b.date === filterDateStr) return 1;
            return 0;
        });
    }

    const pendingCount = AppState.tasks.filter(t => !t.done).length;
    countLabel.textContent = `${pendingCount} pending total`;

    if (tasksToRender.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px;">No scheduled tasks. Diagnose a leaf or add one above!</p>`;
        return;
    }

    tasksToRender.forEach(task => {
        const itemDiv = document.createElement("div");
        const isDoneClass = task.done ? "done" : "";
        
        itemDiv.className = `task-item ${isDoneClass}`;
        if (filterDateStr && task.date === filterDateStr) {
            itemDiv.setAttribute("style", "border-color: var(--primary); background: var(--primary-glow);");
        }

        // Parse human-readable date display
        const dateObj = new Date(task.date);
        const dateStrHuman = dateObj.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });

        itemDiv.innerHTML = `
            <div class="task-left">
                <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}" class="task-toggle">
                <div class="task-content">
                    <span class="task-title">${task.title}</span>
                    <span class="task-meta">${task.crop} &bull; ${dateStrHuman}</span>
                </div>
            </div>
            <button class="task-delete-btn" data-id="${task.id}">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        // Toggle checkbox listener
        itemDiv.querySelector(".task-toggle").addEventListener("change", (e) => {
            toggleTask(task.id);
        });

        // Delete button listener
        itemDiv.querySelector(".task-delete-btn").addEventListener("click", () => {
            deleteTask(task.id);
        });

        container.appendChild(itemDiv);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function toggleTask(id) {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) {
        task.done = !task.done;
        saveTasks();
        renderCalendar();
        updatePendingTasksCountBadge();
    }
}

function deleteTask(id) {
    AppState.tasks = AppState.tasks.filter(t => t.id !== id);
    saveTasks();
    renderCalendar();
    updatePendingTasksCountBadge();
}

function loadTasks() {
    const stored = localStorage.getItem("agrishield-tasks");
    if (stored) {
        AppState.tasks = JSON.parse(stored);
    } else {
        // Inject sample starting tasks
        AppState.tasks = [
            { id: "s1", title: "Targeted drip irrigation adjustment", crop: "Potato", date: "2026-06-23", done: false },
            { id: "s2", title: "Visual inspections of Apple Scab zones", crop: "Apple", date: "2026-06-24", done: false }
        ];
    }
    updatePendingTasksCountBadge();
}

function saveTasks() {
    localStorage.setItem("agrishield-tasks", JSON.stringify(AppState.tasks));
}

function updatePendingTasksCountBadge() {
    const pendingCount = AppState.tasks.filter(t => !t.done).length;
    const badge = document.getElementById("pending-tasks-count");
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? "block" : "none";
    }
}

// ==========================================================================
// 8. Searchable Agronomy Encyclopedia Library
// ==========================================================================
function initLibrary() {
    const searchInput = document.getElementById("library-search-input");
    
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        renderLibraryCards(query);
    });

    renderLibraryCards();
}

function renderLibraryCards(query = "") {
    const grid = document.getElementById("library-grid");
    if (!grid) return;

    grid.innerHTML = "";

    // Convert database object to list
    const entries = Object.values(DISEASES_DATABASE);
    
    // Filter matching cards
    const filtered = entries.filter(item => {
        return (
            item.crop.toLowerCase().includes(query) ||
            item.disease.toLowerCase().includes(query) ||
            item.pathogen.toLowerCase().includes(query) ||
            item.scientific.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 40px;">No matching crop records found in database.</p>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "library-card card";
        
        let pathClass = "badge-danger";
        if (item.pathogen.includes("Fungus") || item.pathogen.includes("Oomycete")) pathClass = "badge-danger";
        else if (item.id.includes("healthy")) pathClass = "badge-success";
        else pathClass = "badge-warning";

        card.innerHTML = `
            <div class="lib-card-hero">
                <i data-lucide="leaf" class="lib-card-hero-icon"></i>
                <span class="lib-crop-badge">${item.crop}</span>
                <span class="lib-pathogen-badge ${pathClass}">${item.pathogen.split(' ')[0]}</span>
            </div>
            <div class="lib-card-content">
                <h3>${item.disease}</h3>
                <span class="scientific-name">${item.scientific}</span>
                <p>${item.description}</p>
                
                <div class="lib-details-drawer">
                    <div class="drawer-row">
                        <strong>Symptoms:</strong>
                        <span>${item.symptoms[0]}</span>
                    </div>
                    <div class="drawer-row" style="margin-top: 6px;">
                        <strong>Remediation:</strong>
                        <span>${item.remediations[0].text}</span>
                    </div>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
}
