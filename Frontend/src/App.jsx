import React, { useState, useEffect, useRef } from 'react'
import { 
  ShieldAlert, LayoutDashboard, ScanFace, MapPin, Calendar, BookOpen, 
  Sun, Moon, Droplets, Thermometer, Sprout, AlertTriangle, CheckCircle, 
  Info, TrendingDown, Upload, Activity, AlertCircle, RefreshCw, Send, Check, Trash2
} from 'lucide-react'

// Library encyclopedia data
const ENCYCLOPEDIA = [
  {
    id: "tomato_blight",
    crop: "Tomato",
    disease: "Late Blight",
    scientific: "Phytophthora infestans",
    pathogen: "Oomycete (Fungal-like)",
    severity: "Severe",
    velocity: "High (Spreads within 48h)",
    pesticide: "Copper Oxychloride (Fungicide)",
    dosage: "2.5 ml/L base, reduced in heat/dry conditions",
    description: "Late blight is a highly destructive oomycete disease. It thrives in humid, cool conditions, causing dark water-soaked lesions on leaves and stems, leading to rapid tissue death.",
    symptoms: [
      "Irregular dark-brown to black spots on leaf edges with pale halos.",
      "Fuzzy white mold-like sporulation on the leaf undersides in damp weather.",
      "Firm, dark, greasy bronze lesions on green and ripening fruits."
    ]
  },
  {
    id: "apple_scab",
    crop: "Apple",
    disease: "Apple Scab",
    scientific: "Venturia inaequalis",
    pathogen: "Ascomycete Fungus",
    severity: "Moderate",
    velocity: "Medium (Slow foliar decline)",
    pesticide: "Myclobutanil (Systemic Fungicide)",
    dosage: "1.2 ml/L base, calibrated to environment",
    description: "Apple scab is a major fungal disease affecting leaves and fruit, causing olive-green to black velvety spots, leading to premature leaf drop and deformed fruit.",
    symptoms: [
      "Velvety, olive-green spots on leaves that turn dark brown to black over time.",
      "Raised, corky, brown lesions on apples that crack as fruit swells.",
      "Premature leaf drop in severe outbreaks, weakening the tree."
    ]
  },
  {
    id: "corn_rust",
    crop: "Corn",
    disease: "Common Rust",
    scientific: "Puccinia sorghi",
    pathogen: "Basidiomycete Fungus",
    severity: "Moderate",
    velocity: "Medium (Wind-borne spread)",
    pesticide: "Propiconazole (Triazole Fungicide)",
    dosage: "2.0 ml/L base, adjusted for humidity",
    description: "Common rust releases orange-red powdery spores. While rarely fatal, severe infections deplete plant carbohydrates, causing lower yield.",
    symptoms: [
      "Small, powdery, cinnamon-brown pustules on both upper and lower leaf surfaces.",
      "Elongated rusty streaks that erupt, releasing powdery orange spores.",
      "Chlorosis (yellowing) of leaves when rust density is extremely high."
    ]
  },
  {
    id: "grape_rot",
    crop: "Grape",
    disease: "Black Rot",
    scientific: "Guignardia bidwellii",
    pathogen: "Ascomycete Fungus",
    severity: "Severe",
    velocity: "High (Ruins fruit yield)",
    pesticide: "Mancozeb (Broad-spectrum Fungicide)",
    dosage: "3.0 ml/L base, monitored closely",
    description: "Black rot is a highly destructive fungal disease of grapes. It can cause complete crop loss under wet conditions, turning plump grapes into hard, shriveled black mummies.",
    symptoms: [
      "Small, circular, tan spots on leaves with dark brown borders.",
      "Tiny black pimple-like fruiting bodies (pycnidia) arranged in rings inside leaf spots.",
      "Sunken purple-black lesions on young shoots and shriveled fruit mummies."
    ]
  }
];

// Preset Leaf Demos for easy offline scanning testing
const PRESET_LEAVES = [
  { id: "tomato_blight.jpg", name: "Tomato Leaf - Late Blight Presets", crop: "Tomato", disease: "Late Blight", severity: "Severe" },
  { id: "apple_scab.jpg", name: "Apple Leaf - Scab Presets", crop: "Apple", disease: "Apple Scab", severity: "Moderate" },
  { id: "corn_rust.jpg", name: "Corn Foliage - Rust Presets", crop: "Corn", disease: "Common Rust", severity: "Moderate" },
  { id: "grape_rot.jpg", name: "Grape Canopy - Black Rot Presets", crop: "Grape", disease: "Black Rot", severity: "Severe" },
  { id: "tomato_healthy.jpg", name: "Tomato Leaf - Healthy Controls", crop: "Tomato", disease: "Healthy", severity: "Optimal" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [theme, setTheme] = useState("dark")
  const [selectedRegion, setSelectedRegion] = useState("north")
  const [currentTime, setCurrentTime] = useState("")
  
  // Database metrics states
  const [telemetry, setTelemetry] = useState({
    temperature: 24.5,
    humidity: 84.0,
    soil_moisture: 38.0,
    solar_radiation: 5.2,
    status_label: "High Humidity"
  })
  const [scansHistory, setScansHistory] = useState([])
  const [tasks, setTasks] = useState([])
  const [hotspots, setHotspots] = useState([])

  // Scanner States
  const [isScanning, setIsScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [uploadPreview, setUploadPreview] = useState("")
  
  // Task Creation State
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDesc, setNewTaskDesc] = useState("")
  const [newTaskType, setNewTaskType] = useState("chemical")
  const [newTaskDate, setNewTaskDate] = useState("")

  // Search State for library
  const [libraryQuery, setLibraryQuery] = useState("")

  // References
  const fileInputRef = useRef(null)

  // Initialize Clock & Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const updateClock = () => {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      setCurrentTime(new Date().toLocaleDateString('en-US', options));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTelemetry();
    fetchScans();
    fetchTasks();
    fetchHotspots();

    // Poll live sensor telemetry every 5 seconds
    const telemetryInterval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(telemetryInterval);
  }, []);

  // Re-fetch telemetry when region changes
  useEffect(() => {
    fetchTelemetry();
  }, [selectedRegion]);

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
        return;
      }
    } catch (e) {
      console.warn("Failed fetching telemetry from backend, using simulated local state", e);
    }
    // Simulate telemetry locally when backend is unavailable
    const base = {
      north: { temperature: 24.5, humidity: 84, soil_moisture: 38, solar_radiation: 5.2, status_label: "High Humidity" },
      south: { temperature: 26.8, humidity: 68, soil_moisture: 44, solar_radiation: 7.1, status_label: "Moderate" },
      east: { temperature: 22.1, humidity: 55, soil_moisture: 32, solar_radiation: 6.4, status_label: "Optimal" }
    };
    const b = base[selectedRegion] || base.north;
    setTelemetry({
      temperature: b.temperature + (Math.random() * 2 - 1),
      humidity: Math.round(b.humidity + (Math.random() * 10 - 5)),
      soil_moisture: Math.round(b.soil_moisture + (Math.random() * 8 - 4)),
      solar_radiation: +(b.solar_radiation + (Math.random() * 1 - 0.5)).toFixed(1),
      status_label: b.humidity >= 80 ? "High Humidity" : (b.humidity >= 65 ? "Mild Humidity" : "Optimal")
    });
  }

  const fetchScans = async () => {
    try {
      const res = await fetch('/api/scans');
      if (res.ok) {
        const data = await res.json();
        setScansHistory(data);
      }
    } catch (e) {
      console.warn("Error fetching scans history", e);
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.warn("Error fetching calendar tasks", e);
    }
  }

  const fetchHotspots = async () => {
    try {
      const res = await fetch('/api/hotspots');
      if (res.ok) {
        const data = await res.json();
        setHotspots(data);
      }
    } catch (e) {
      console.warn("Error fetching field risk hotspots", e);
    }
  }

  // Trigger scanning upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setScanResult(null);
    }
  }

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  // Region-aware mock result generator
  const mockDiseases = {
    Tomato: {
      crop_type: "Tomato",
      disease_name: "Tomato Late Blight",
      scientific_name: "Phytophthora infestans",
      pathogen_type: "Oomycete (Fungal-like)",
      severity_percentage: 64.5,
      severity_level: "Severe",
      confidence: 0.954,
      bounding_boxes: [{ x: 50, y: 40, w: 120, h: 90, label: "Late Blight (95%)" }],
      pesticide_name: "Copper Oxychloride (Fungicide)",
      pesticide_dosage: "1.75 ml per Liter of water",
      pesticide_safety_instructions: "High temperature/soil moisture stress: Dose calibrated lower by 30%.",
      cultural_care_instructions: "CULTURAL PRACTICES:\n* Prune infected foliage immediately.\n* Switch irrigation to drip lines."
    },
    Apple: {
      crop_type: "Apple",
      disease_name: "Apple Scab",
      scientific_name: "Venturia inaequalis",
      pathogen_type: "Ascomycete Fungus",
      severity_percentage: 28.2,
      severity_level: "Moderate",
      confidence: 0.887,
      bounding_boxes: [{ x: 90, y: 80, w: 100, h: 80, label: "Apple Scab (88%)" }],
      pesticide_name: "Myclobutanil (Systemic Fungicide)",
      pesticide_dosage: "1.2 ml per Liter of water",
      pesticide_safety_instructions: "Apply under calm weather conditions.",
      cultural_care_instructions: "CULTURAL PRACTICES:\n* Rake and destroy fallen orchard leaves.\n* Prune canopy for air circulation."
    },
    Corn: {
      crop_type: "Corn",
      disease_name: "Corn Common Rust",
      scientific_name: "Puccinia sorghi",
      pathogen_type: "Basidiomycete Fungus",
      severity_percentage: 38.5,
      severity_level: "Moderate",
      confidence: 0.912,
      bounding_boxes: [{ x: 40, y: 60, w: 180, h: 110, label: "Common Rust (91%)" }],
      pesticide_name: "Propiconazole (Triazole Fungicide)",
      pesticide_dosage: "2.0 ml per Liter of water",
      pesticide_safety_instructions: "Do not apply within 30 days of harvest.",
      cultural_care_instructions: "CULTURAL PRACTICES:\n* Plan rotation with soybeans next cycle.\n* Manage nitrogen fertilization."
    },
    Grape: {
      crop_type: "Grape",
      disease_name: "Grape Black Rot",
      scientific_name: "Guignardia bidwellii",
      pathogen_type: "Ascomycete Fungus",
      severity_percentage: 72.1,
      severity_level: "Severe",
      confidence: 0.938,
      bounding_boxes: [{ x: 80, y: 60, w: 150, h: 140, label: "Black Rot (93%)" }],
      pesticide_name: "Mancozeb (Broad-spectrum Fungicide)",
      pesticide_dosage: "3.0 ml per Liter of water",
      pesticide_safety_instructions: "Wear gloves and respirator.",
      cultural_care_instructions: "CULTURAL PRACTICES:\n* Remove and burn all grape mummies.\n* Clear vineyard floor of weeds."
    },
    Healthy: {
      crop_type: "Tomato",
      disease_name: "Tomato Healthy",
      scientific_name: "Solanum lycopersicum",
      pathogen_type: "None",
      severity_percentage: 0.0,
      severity_level: "Optimal",
      confidence: 0.991,
      bounding_boxes: [],
      pesticide_name: "No Chemical Treatment",
      pesticide_dosage: "0 ml/L",
      pesticide_safety_instructions: "Foliage shows optimal health levels.",
      cultural_care_instructions: "CULTURAL PRACTICES:\n* Continue current irrigation cycles.\n* Inspect visual nodes every 5 days."
    }
  };

  const getMockResult = (region, preset = null) => {
    if (preset) {
      const key = preset.disease === "Healthy" ? "Healthy" : preset.crop;
      return mockDiseases[key];
    }
    const regionPool = {
      north: ['Tomato', 'Apple', 'Tomato'],
      south: ['Apple', 'Grape', 'Tomato'],
      east: ['Corn', 'Healthy', 'Corn']
    };
    const pool = regionPool[region] || ['Tomato'];
    const key = pool[Math.floor(Math.random() * pool.length)];
    return mockDiseases[key];
  };

  // Submit scan to backend
  const handleScanSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        fetchScans();
        fetchTasks();
        fetchHotspots();
      } else {
        alert("Scan failed. Backend returned error.");
      }
    } catch (err) {
      console.error(err);
      setTimeout(() => {
        const mockResult = getMockResult(selectedRegion);
        setScanResult(mockResult);
      }, 1500);
    } finally {
      setIsScanning(false);
    }
  }

  // Trigger quick scan from a preset template file (creates a mock file object)
  const handlePresetScan = async (preset) => {
    setIsScanning(true);
    setScanResult(null);
    
    // Create a mock image file with the preset file name so backend heuristics or image processing works
    const mockBlob = new Blob(["mock data"], { type: "image/jpeg" });
    const mockFile = new File([mockBlob], preset.id, { type: "image/jpeg" });
    
    setSelectedFile(mockFile);
    // Draw a procedural preview leaf representation using SVGs
    setUploadPreview(`/api/placeholder/400/320`);

    const formData = new FormData();
    formData.append("image", mockFile);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        fetchScans();
        fetchTasks();
        fetchHotspots();
      }
    } catch (e) {
      console.error("Preset scan connection error", e);
      setTimeout(() => {
        setScanResult(getMockResult(selectedRegion, preset));
      }, 1500);
    } finally {
      setIsScanning(false);
    }
  }

  // Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) return;

    const taskData = {
      title: newTaskTitle,
      description: newTaskDesc,
      type: newTaskType,
      due_date: newTaskDate,
      status: "pending"
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        fetchTasks();
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskDate("");
      }
    } catch (err) {
      console.warn("Backend unavailable, adding task locally", err);
      const mockTask = {
        ...taskData,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      setTasks([mockTask, ...tasks]);
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskDate("");
    }
  }

  // Delete a task
  const handleDeleteTask = async (id) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend error on delete, removing locally', err);
    }
    setTasks(tasks.filter(t => t.id !== id));
  }

  // Mark task as completed
  const handleToggleTaskStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "pending" ? "completed" : "pending";
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.warn("Backend error, toggling task state in React memory state", err);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    }
  }

  // Helper to resolve severity badge colors
  const getSeverityClass = (lvl) => {
    switch (lvl?.toLowerCase()) {
      case "severe": return "red";
      case "moderate": return "orange";
      case "low": return "yellow";
      default: return "green";
    }
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <ShieldAlert className="brand-logo-icon" />
          </div>
          <div className="brand-text">
            <h1>AgriShield</h1>
            <span>CROP AI DIAGNOSIS</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            <ScanFace size={20} />
            <span>AI Scanner</span>
            <span className="badge pulse-badge">Live</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={20} />
            <span>Field Risk Map</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <Calendar size={20} />
            <span>Treatment Planner</span>
            <span className="badge count-badge">
              {tasks.filter(t => t.status === 'pending').length}
            </span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <BookOpen size={20} />
            <span>Agronomy Library</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">DK</div>
            <div className="profile-info">
              <span className="user-name">Deepak Kumar</span>
              <span className="user-role">Lead Agronomist</span>
            </div>
          </div>
          <button 
            className="theme-toggle-btn" 
            id="theme-toggle" 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} className="sun-icon" /> : <Moon size={18} className="moon-icon" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-search">
            <div className="region-selector-wrapper">
              <Sprout size={16} className="search-icon" />
              <select 
                id="region-selector" 
                className="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="north">North Farm Sector (Tomato Fields)</option>
                <option value="south">South Orchard Sector (Apple Groves)</option>
                <option value="east">East Grain Fields (Corn Fields)</option>
              </select>
            </div>
          </div>
          <div className="header-actions">
            <div className="system-status">
              <span className="status-dot online"></span>
              <span className="status-text">AI Diagnostics Core: Active</span>
            </div>
            <div className="header-divider"></div>
            <div className="time-display">{currentTime}</div>
          </div>
        </header>

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <section className="tab-panel active">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Welcome back, Deepak</h2>
                <p>Telemetry metrics are live. Environmental variables indicate <b>{telemetry.status_label}</b>, presenting a moderate risk rating for leaf pathogens.</p>
              </div>
              <div className="banner-action">
                <button className="btn btn-primary" onClick={() => setActiveTab('scanner')}>
                  <ScanFace size={16} style={{ marginRight: '8px' }} /> Run AI Diagnosis
                </button>
              </div>
            </div>

            {/* Sensor Telemetries */}
            <div className="telemetry-grid">
              <div className={`telemetry-card ${telemetry.humidity > 80 ? 'alert-high' : ''}`}>
                <div className="card-header">
                  <div className="card-icon-wrapper"><Droplets /></div>
                  <span className={`status-label ${telemetry.humidity > 80 ? 'high' : 'optimal'}`}>
                    {telemetry.humidity > 80 ? 'High Humidity' : 'Optimal'}
                  </span>
                </div>
                <div className="card-body">
                  <span className="telemetry-value">{telemetry.humidity}%</span>
                  <span className="telemetry-title">Rel. Humidity</span>
                </div>
                <div className="card-footer">
                  <AlertTriangle size={14} style={{ marginRight: '6px' }} />
                  {telemetry.humidity > 80 ? 'Favorable for fungal sporulation.' : 'Leaves dry quickly.'}
                </div>
              </div>

              <div className="telemetry-card">
                <div className="card-header">
                  <div className="card-icon-wrapper"><Thermometer /></div>
                  <span className="status-label optimal">Optimal</span>
                </div>
                <div className="card-body">
                  <span className="telemetry-value">{telemetry.temperature}°C</span>
                  <span className="telemetry-title">Ambient Temp</span>
                </div>
                <div className="card-footer">
                  <CheckCircle size={14} style={{ marginRight: '6px' }} /> Safe diurnal temperature averages.
                </div>
              </div>

              <div className={`telemetry-card ${telemetry.soil_moisture < 40 ? 'alert-warning' : ''}`}>
                <div className="card-header">
                  <div className="card-icon-wrapper"><Sprout /></div>
                  <span className={`status-label ${telemetry.soil_moisture < 40 ? 'warning' : 'optimal'}`}>
                    {telemetry.soil_moisture < 40 ? 'Dry Soil' : 'Ideal Moisture'}
                  </span>
                </div>
                <div className="card-body">
                  <span className="telemetry-value">{telemetry.soil_moisture}%</span>
                  <span className="telemetry-title">Soil Moisture</span>
                </div>
                <div className="card-footer">
                  <Info size={14} style={{ marginRight: '6px' }} />
                  {telemetry.soil_moisture < 40 ? 'Rootzone irrigation recommended.' : 'Soil hydration levels stable.'}
                </div>
              </div>

              <div className="telemetry-card">
                <div className="card-header">
                  <div className="card-icon-wrapper"><Sun /></div>
                  <span className="status-label optimal">Moderate</span>
                </div>
                <div className="card-body">
                  <span className="telemetry-value">{telemetry.solar_radiation} UV</span>
                  <span className="telemetry-title">Solar Radiation</span>
                </div>
                <div className="card-footer">
                  <TrendingDown size={14} style={{ marginRight: '6px' }} /> Light overcast filter.
                </div>
              </div>
            </div>

            {/* Dashboard Analytics & Recent Diagnoses */}
            <div className="dashboard-rows" style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="card analytics-container">
                <div className="card-title-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Crop Health Diagnostic Index</h3>
                  <div className="chart-legend" style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#ef4444' }}>● Tomato</span>
                    <span style={{ color: '#f59e0b' }}>● Corn</span>
                    <span style={{ color: '#06b6d4' }}>● Apple</span>
                  </div>
                </div>
                
                {/* SVG Graph */}
                <div style={{ height: '220px', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <path d="M 0 160 Q 120 120 250 140 T 500 80" fill="none" stroke="#ef4444" strokeWidth="3" />
                    <path d="M 0 180 Q 150 150 300 90 T 500 40" fill="none" stroke="#06b6d4" strokeWidth="3" />
                    <path d="M 0 130 Q 180 80 320 110 T 500 60" fill="none" stroke="#f59e0b" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              {/* History Scans Sidebar */}
              <div className="card recent-alerts" style={{ maxHeight: '315px', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '16px' }}>Recent AI Scans</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {scansHistory.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                      No scan history logged yet. Run a leaf diagnosis scan!
                    </div>
                  ) : (
                    scansHistory.slice(0, 4).map((scan) => (
                      <div key={scan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid var(--color-${getSeverityClass(scan.severity_level)})` }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem' }}>{scan.disease_name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{scan.crop_type} • {new Date(scan.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className={`status-label ${getSeverityClass(scan.severity_level)}`} style={{ alignSelf: 'center' }}>
                          {scan.severity_level}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: AI Scanner */}
        {activeTab === 'scanner' && (
          <section className="tab-panel active">
            <div className="scanner-container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
              
              {/* Left Panel: Image Upload & Preset samples */}
              <div className="card upload-panel">
                <h3>Plant Specimen Input</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Upload a crop foliage leaf image to detect lesions, classify disease, and run agent safety dose tuning.
                </p>

                <div 
                  className="upload-dropzone" 
                  onClick={triggerUpload}
                  style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'rgba(16, 185, 129, 0.02)' }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                  {uploadPreview ? (
                    <img 
                      src={uploadPreview} 
                      alt="Upload Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <Upload size={36} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Click to browse files</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports JPG, PNG, WebP</span>
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleScanSubmit} 
                    disabled={isScanning}
                    style={{ width: '100%', marginTop: '16px' }}
                  >
                    {isScanning ? <Activity className="spin" size={16} /> : <ScanFace size={16} />}
                    {isScanning ? " Running AI Models..." : " Scan Crop Foliage"}
                  </button>
                )}

                <div className="preset-selector" style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Quick-Scan Demo Presets
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {PRESET_LEAVES.map((preset) => (
                      <button 
                        key={preset.id}
                        className="btn"
                        onClick={() => handlePresetScan(preset)}
                        disabled={isScanning}
                        style={{ justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border-color)', background: 'transparent', textAlign: 'left', width: '100%', fontSize: '0.85rem' }}
                      >
                        <span>{preset.name}</span>
                        <span className={`status-label ${getSeverityClass(preset.severity)}`} style={{ fontSize: '0.7rem' }}>
                          {preset.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel: Bounding box visuals and agent reports */}
              <div className="card report-panel" style={{ minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
                {isScanning ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
                    <RefreshCw className="spin" size={48} style={{ color: 'var(--primary)' }} />
                    <h4>Orchestrating Model Agents...</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', maxWidth: '300px' }}>
                      1. YOLOv11 identifying leaf lesions<br/>
                      2. ResNet50 classifying disease pathogen<br/>
                      3. CNN+XGBoost predicting severity scale<br/>
                      4. LangGraph Agent calculating safe pesticide dosing
                    </p>
                  </div>
                ) : scanResult ? (
                  <div>
                    {/* BBox visualization layout */}
                    <div className="visualization-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Diagnostics Synthesis Report
                        </span>
                        <h2>{scanResult.disease_name}</h2>
                        <span style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {scanResult.scientific_name} • Pathogen: {scanResult.pathogen_type}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>
                            {Math.round(scanResult.confidence * 100)}%
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Severity</span>
                          <span className={`telemetry-value ${getSeverityClass(scanResult.severity_level)}`} style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                            {scanResult.severity_percentage}% ({scanResult.severity_level})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Image canvas with actual photo + heatmap + BBox overlays */}
                    <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#070d0a', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        
                        {/* Show real uploaded image if available, else animated SVG leaf */}
                        {uploadPreview && !uploadPreview.includes('/api/placeholder') ? (
                          <img
                            src={uploadPreview}
                            alt="Analyzed leaf"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px' }}
                          />
                        ) : (
                          <svg width="220" height="180" viewBox="0 0 100 100" style={{ fill: 'none', stroke: '#10b981', strokeWidth: '1.5' }}>
                            <path d="M50,10 C65,30 90,40 50,90 C10,40 35,30 50,10 Z" fill="rgba(16,185,129,0.1)" />
                            <path d="M50,10 Q50,50 50,90" stroke="#059669" />
                            <path d="M50,30 Q65,40 80,42" stroke="#059669" />
                            <path d="M50,45 Q65,55 75,60" stroke="#059669" />
                            <path d="M50,30 Q35,40 20,42" stroke="#059669" />
                            <path d="M50,45 Q35,55 25,60" stroke="#059669" />
                          </svg>
                        )}

                        {/* Disease Severity Heatmap overlay */}
                        {scanResult.severity_percentage > 0 && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `radial-gradient(circle at 45% 40%, rgba(239, 68, 68, ${Math.min(0.55, scanResult.severity_percentage * 0.007)}) 0%, rgba(245, 158, 11, 0) 60%)`,
                            pointerEvents: 'none'
                          }} />
                        )}

                        {/* YOLO BBox overlays */}
                        {scanResult.bounding_boxes?.map((box, index) => (
                          <div 
                            key={index} 
                            style={{
                              position: 'absolute',
                              border: '2px solid #ef4444',
                              backgroundColor: 'rgba(239, 68, 68, 0.12)',
                              left: `${box.x / 1.5}px`,
                              top: `${box.y / 1.5}px`,
                              width: `${box.w / 1.5}px`,
                              height: `${box.h / 1.5}px`,
                              borderRadius: '3px'
                            }}
                          >
                            <span style={{ position: 'absolute', top: '-20px', left: '-2px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                              {box.label} {box.confidence ? `(${Math.round(box.confidence * 100)}%)` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Agent Outputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Dosing Agent Node output */}
                      <div className="agent-card" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                          <ShieldAlert size={18} style={{ color: 'var(--primary)' }} />
                          <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dosing Agent Recommendation</h4>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calibrated Pesticide</span>
                          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{scanResult.pesticide_name}</div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dosing Level</span>
                          <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--color-warning)' }}>{scanResult.pesticide_dosage}</div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {scanResult.pesticide_safety_instructions}
                        </p>
                      </div>

                      {/* Agronomist Node output */}
                      <div className="agent-card" style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.04)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                          <Sprout size={18} style={{ color: '#06b6d4' }} />
                          <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cultural Care Protocols</h4>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                          {scanResult.cultural_care_instructions}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                    <Activity size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p>Select or upload a plant leaf image in the left panel to begin diagnosis</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Field Risk Map */}
        {activeTab === 'map' && (
          <section className="tab-panel active">
            <div className="map-view-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="card">
                <h3>Geotargeting Field Risk Map</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                   Farm grid mapping of current localized crop threats. Active blinking pulses indicate sectors containing moderate-to-severe disease log events.
                </p>

                {/* SVG Map of Sectors */}
                <div style={{ backgroundColor: '#070d0a', borderRadius: '12px', border: '1px solid var(--border-color)', height: '360px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="80%" height="80%" viewBox="0 0 400 240">
                    {/* North Tomato Fields A1-B3 */}
                    <rect x="20" y="20" width="160" height="90" rx="6" fill="rgba(16, 185, 129, 0.05)" stroke="var(--border-color)" strokeWidth="1.5" />
                    <text x="30" y="40" fill="var(--text-primary)" fontSize="12" fontWeight="600">North Sector - Tomato (A1-B3)</text>
                    
                    {/* South Apple Orchards S1-S6 */}
                    <rect x="20" y="130" width="160" height="90" rx="6" fill="rgba(6, 182, 212, 0.05)" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1.5" />
                    <text x="30" y="150" fill="var(--text-primary)" fontSize="12" fontWeight="600">South Sector - Apple (S1-S6)</text>
                    
                    {/* East Corn Fields E1-E8 */}
                    <rect x="200" y="20" width="180" height="200" rx="6" fill="rgba(245, 158, 11, 0.05)" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1.5" />
                    <text x="210" y="40" fill="var(--text-primary)" fontSize="12" fontWeight="600">East Sector - Corn (E1-E8)</text>

                    {/* Active Hotspot Pulses */}
                    {hotspots.map((spot, index) => {
                      const isTomato = spot.crop === "Tomato";
                      const isApple = spot.crop === "Apple";
                      const x = isTomato ? 100 : (isApple ? 100 : 290);
                      const y = isTomato ? 70 : (isApple ? 180 : 120);
                      const color = spot.severity === "Severe" ? "#ef4444" : "#f59e0b";
                      
                      return (
                        <g key={index}>
                          <circle cx={x} cy={y} r="8" fill={color} opacity="0.8" className="pulse-dot" />
                          <circle cx={x} cy={y} r="16" fill="none" stroke={color} strokeWidth="1.5" className="pulse-ring" />
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>

              {/* Map Info sidebar */}
              <div className="card">
                <h3>Active Sector Risks</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Select an infected region coordinates to queue diagnosis.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hotspots.map((spot) => (
                    <div key={spot.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{spot.sector}</span>
                        <span className={`status-label ${getSeverityClass(spot.severity)}`} style={{ fontSize: '0.7rem' }}>
                          {spot.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Crop: <b>{spot.crop}</b> • {spot.disease} ({spot.percentage}%)
                      </div>
                      <button className="btn" onClick={() => setActiveTab('scanner')} style={{ marginTop: '10px', fontSize: '0.75rem', padding: '6px 10px', width: '100%', justifyContent: 'center' }}>
                        Scan Sector Specimen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 4: Treatment Planner */}
        {activeTab === 'calendar' && (
          <section className="tab-panel active">
            <div className="treatment-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.10fr 1.90fr', gap: '24px' }}>
              
              {/* Add Calendar event task form */}
              <div className="card">
                <h3>Schedule Treatment Task</h3>
                <form onSubmit={handleCreateTask} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Task Title</label>
                    <input 
                      type="text" 
                      value={newTaskTitle} 
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Spray copper Sector A2" 
                      style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Protocol Details</label>
                    <textarea 
                      value={newTaskDesc} 
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      placeholder="Dosage levels, chemical instructions, safety protocols..." 
                      style={{ width: '100%', height: '80px', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Treatment Type</label>
                      <select 
                        value={newTaskType} 
                        onChange={(e) => setNewTaskType(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                      >
                        <option value="chemical">Chemical Spray</option>
                        <option value="organic">Organic Bio-spray</option>
                        <option value="cultural">Cultural / Raking / Pruning</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Schedule Date</label>
                      <input 
                        type="date" 
                        value={newTaskDate} 
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }}
                        required
                      />
                    </div>
                  </div>

                  <button className="btn btn-primary" type="submit" style={{ justifyContent: 'center' }}>
                    <Calendar size={16} style={{ marginRight: '8px' }} /> Schedule Treatment
                  </button>
                </form>
              </div>

              {/* Tasks List */}
              <div className="card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3>Field Treatment Planner</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {tasks.filter(t => t.status === 'pending').length} Tasks Pending
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tasks.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', padding: '32px', textAlign: 'center' }}>
                      No treatment events scheduled. Run a crop leaf scan containing pathogen signatures to automatically map schedule calendar lines.
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id} 
                        style={{ 
                          padding: '16px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)', 
                          background: task.status === 'completed' ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255, 255, 255, 0.01)',
                          opacity: task.status === 'completed' ? 0.7 : 1,
                          display: 'flex',
                          gap: '16px'
                        }}
                      >
                        <button 
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
                          title={task.status === 'completed' ? 'Mark pending' : 'Mark complete'}
                          style={{
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '6px', 
                            border: `2px solid ${task.status === 'completed' ? 'var(--primary)' : 'var(--text-muted)'}`,
                            background: task.status === 'completed' ? 'var(--primary)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            alignSelf: 'flex-start',
                            flexShrink: 0
                          }}
                        >
                          {task.status === 'completed' && <Check size={14} />}
                        </button>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <h4 style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', fontSize: '0.95rem', flex: 1 }}>{task.title}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{task.due_date}</span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                title="Delete task"
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '2px',
                                  borderRadius: '4px',
                                  transition: 'color 0.15s'
                                }}
                                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{task.description}</p>
                          <span className={`status-label`} style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.65rem', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.05)', color: task.type === 'cultural' ? '#06b6d4' : (task.type === 'organic' ? '#10b981' : '#f59e0b') }}>
                            {task.type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Tab 5: Library */}
        {activeTab === 'library' && (
          <section className="tab-panel active">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3>Agronomy Encyclopedia Library</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Reference manuals for crop disease symptoms, diagnostic rules, and chemical safety limits.
                  </p>
                </div>
                
                <input 
                  type="text" 
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  placeholder="Search diseases or crops..." 
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '24px', color: '#fff', width: '220px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {ENCYCLOPEDIA.filter(item => 
                  item.disease.toLowerCase().includes(libraryQuery.toLowerCase()) || 
                  item.crop.toLowerCase().includes(libraryQuery.toLowerCase())
                ).map((item) => (
                  <div key={item.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>{item.crop} Disease File</span>
                        <h4 style={{ fontSize: '1.1rem' }}>{item.disease}</h4>
                        <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{item.scientific}</span>
                      </div>
                      <span className="status-label info" style={{ fontSize: '0.7rem' }}>
                        {item.pathogen}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                      {item.description}
                    </p>

                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Symptoms:</span>
                      <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', paddingLeft: '16px' }}>
                        {item.symptoms.map((s, idx) => <li key={idx} style={{ marginBottom: '3px' }}>{s}</li>)}
                      </ul>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Safe Pesticide:</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.pesticide}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Standard Dose:</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-warning)' }}>{item.dosage}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
