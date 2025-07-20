// src/App.js - Enhanced WBD Executive Slate Dashboard
import React, { useState, useEffect, useCallback, useRef } from 'react';
import mondaySdk from 'monday-sdk-js';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './App.css';
import PptxGenJS from 'pptxgenjs';
import html2canvas from 'html2canvas';
// import { Timeline } from 'vis-timeline';
// import 'vis-timeline/dist/vis-timeline-graph2d.css';
// import CustomTimeline from './CustomTimeline';
// Use lightweight UI components instead of heavy Monday UI library
import { Box, Button, Dropdown, Dialog, Loader, IconButton } from './SimpleUI';
// import { motion } from 'framer-motion'; // Removed - using custom drag implementation
// Chart and Icon Components (fallbacks for local development)
const SimpleChart = ({ data }) => (
  <div className="simple-chart">
    <div className="chart-bars">
      {data.map((item, index) => (
        <div key={index} className="chart-year">
          <div className="chart-label">{item.year}</div>
          <div className="chart-bar-container">
            <div 
              className="chart-bar revenue" 
              style={{ height: `${Math.max((item.revenue / 1500) * 100, 5)}%` }}
              title={`Revenue: ${item.revenue}M`}
            />
            <div 
              className="chart-bar investment" 
              style={{ height: `${Math.max((item.investment / 1500) * 100, 5)}%` }}
              title={`Investment: ${item.investment}M`}
            />
          </div>
          <div className="chart-roi">{item.roi.toFixed(0)}%</div>
        </div>
      ))}
    </div>
  </div>
);

// Simple icon components
// Icons removed - using emoji directly

// Helper: assign a color to each genre
const GENRE_COLORS = [
  '#d4af37', // Drama (gold)
  '#27ae60', // Sci-Fi (green)
  '#1a6dcc', // Action (blue)
  '#e74c3c', // Comedy (red)
  '#8e44ad', // Fantasy (purple)
  '#f39c12', // Adventure (orange)
  '#e67e22', // Horror (dark orange)
  '#34495e', // Other (dark gray)
];
const genres = ['Drama', 'Sci-Fi', 'Action', 'Comedy', 'Fantasy', 'Adventure', 'Horror', 'Other'];
const getGenreColor = (genre) => {
  const idx = genres.indexOf(genre);
  return GENRE_COLORS[idx >= 0 ? idx : GENRE_COLORS.length - 1];
};

// TimelineComponent removed - not currently used

const monday = mondaySdk();

// Helper for safe Monday API calls with timeout
const safeApiCall = async (query, timeout = 10000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const res = await monday.api(query);
    clearTimeout(timeoutId);
    return res;
  } catch (error) {
    console.error('Monday API error:', error);
    throw error;
  }
};

// Enhanced WBD Brand Theme with Modern Colors
const WBD_THEME = {
  colors: {
    primary: '#1a6dcc',
    primaryDeep: '#004eb4', 
    primaryLight: '#4a90e2',
    gold: '#d4af37',
    goldLight: '#f4d03f',
    dark: '#0a0e1a',
    gray: '#2c3e50',
    grayLight: '#34495e',
    success: '#27ae60',
    warning: '#f39c12',
    danger: '#e74c3c',
    white: '#ffffff',
    lightGray: '#f8f9fa',
    chartColors: ['#1a6dcc', '#d4af37', '#27ae60', '#f39c12', '#e74c3c', '#8e44ad']
  }
};

// Available column configurations
const AVAILABLE_COLUMNS = {
  productionBudget: { label: 'Production Budget', key: 'productionBudget', type: 'financial', default: true },
  marketingBudget: { label: 'Marketing Budget', key: 'marketingBudget', type: 'financial', default: false },
  projectedRevenue: { label: 'Projected Revenue', key: 'projectedRevenue', type: 'financial', default: true },
  genre: { label: 'Genre', key: 'genre', type: 'detail', default: true },
  director: { label: 'Director', key: 'director', type: 'detail', default: false },
  status: { label: 'Status', key: 'status', type: 'detail', default: true },
  type: { label: 'Content Type', key: 'type', type: 'detail', default: false },
  productionCompany: { label: 'Production Company', key: 'productionCompany', type: 'detail', default: false },
  distributionPartner: { label: 'Distribution Partner', key: 'distributionPartner', type: 'detail', default: false },
  priority: { label: 'Priority', key: 'priority', type: 'meta', default: false },
  riskLevel: { label: 'Risk Level', key: 'riskLevel', type: 'meta', default: false },
  releaseDate: { label: 'Release Date', key: 'releaseDate', type: 'date', default: false },
  startDate: { label: 'Start Date', key: 'startDate', type: 'date', default: false },
  endDate: { label: 'End Date', key: 'endDate', type: 'date', default: false }
};

const COLUMN_PRESETS = {
  executive: {
    label: 'Executive Summary',
    columns: ['productionBudget', 'projectedRevenue', 'genre', 'status']
  },
  financial: {
    label: 'Financial Analysis', 
    columns: ['productionBudget', 'marketingBudget', 'projectedRevenue', 'priority', 'riskLevel']
  },
  production: {
    label: 'Production Planning',
    columns: ['status', 'director', 'productionCompany', 'type', 'priority']
  },
  detailed: {
    label: 'Complete View',
    columns: Object.keys(AVAILABLE_COLUMNS)
  }
};

// Custom Pie label for word wrapping
const PieLabel = ({ name, percent, x, y, cx, cy, midAngle, outerRadius, index }) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 24;
  const angle = -midAngle;
  const sx = cx + radius * Math.cos(-angle * RADIAN);
  const sy = cy + radius * Math.sin(-angle * RADIAN);
  const pct = `${(percent * 100).toFixed(0)}%`;
  return (
    <text x={sx} y={sy} textAnchor="middle" dominantBaseline="central" className="recharts-pie-label-text" style={{ pointerEvents: 'none' }}>
      <tspan x={sx} dy={0} fontSize="1.05em" fontWeight="700" fill="#fff" style={{ textShadow: '0 2px 8px #000, 0 0 2px #000' }}>{name}</tspan>
      <tspan x={sx} dy={20} fontSize="1.35em" fontWeight="900" fill="#fff" style={{ textShadow: '0 3px 12px #000, 0 0 2px #000' }}>{pct}</tspan>
    </text>
  );
};

const COMMON_COLUMN_NAMES = {
  year: ['year', 'date', 'release year', 'release_date'],
  genre: ['genre', 'type', 'category'],
  title: ['title', 'name'],
  revenue: ['revenue', 'projected revenue', 'box office', 'gross'],
  productionBudget: ['production budget', 'budget', 'prod budget'],
  marketingBudget: ['marketing budget', 'mktg budget', 'marketing'],
};

const autoMapColumns = (columns) => {
  const mapping = {};
  for (const key in COMMON_COLUMN_NAMES) {
    const possibleNames = COMMON_COLUMN_NAMES[key];
    const found = columns.find(col => possibleNames.some(name => col.title.toLowerCase().includes(name)));
    if (found) mapping[key] = found.id;
  }
  return mapping;
};

// Defensive currency formatter for millions
function formatCurrency(value) {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `$${num.toFixed(0)}M`;
}

// Defensive getTotalMetrics
function getTotalMetrics(yearTotals = {}, items = [], columnMapping = {}) {
  const safeYearTotals = yearTotals || {};
  const totalRevenue = Object.values(safeYearTotals).reduce((sum, year) => sum + (year.revenue || 0), 0);
  const totalInvestment = Object.values(safeYearTotals).reduce((sum, year) => sum + (year.production || 0) + (year.marketing || 0), 0);
  const totalTitles = Object.values(safeYearTotals).reduce((sum, year) => sum + (year.titles || 0), 0);
  return { totalRevenue, totalInvestment, totalTitles };
}

const REQUIRED_COLUMNS = [
  // No required columns - using flexible mapping
];
console.log('REQUIRED_COLUMNS at definition:', REQUIRED_COLUMNS);

const WBDExecutiveSlateDashboard = () => {
  console.log('Widget loaded!');
  const [items, setItems] = useState([]);
  const [yearTotals, setYearTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [boardId, setBoardId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Default to executive preset
    return COLUMN_PRESETS.executive.columns;
  });
  const [activePreset, setActivePreset] = useState('executive');
  const [draggedItem, setDraggedItem] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [filterYear, setFilterYear] = useState('All');
  const [filterGenre, setFilterGenre] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [themeMode, setThemeMode] = useState('regular'); // regular, dark, night
  const [activeTab, setActiveTab] = useState('summary');
  const [showCustomization, setShowCustomization] = useState(false);
  const [showRevenue, setShowRevenue] = useState(true);
  const [showInvestment, setShowInvestment] = useState(true);
  const [showTrends, setShowTrends] = useState(true);
  const [yearRange, setYearRange] = useState([2024, 2025, 2026]);
  // const [selectedDateKey, setSelectedDateKey] = useState(); // Removed - not used
  const [columnMapping, setColumnMapping] = useState({});
  const [error, setError] = useState('');
  const [autoMapped, setAutoMapped] = useState(false);
  const [bypassedTroubleshooter, setBypassedTroubleshooter] = useState(false);

  const scrollContainerRef = useRef(null);
  const chartRef = useRef(null);
  const YEARS = ['2025', '2026', '2027', '2028', '2029'];

  // Helper to detect dev mode (localhost or tunnel)
  const isDevMode = window.location.hostname === 'localhost' || 
    window.location.hostname.endsWith('.trycloudflare.com') || 
    window.location.hostname.endsWith('.ngrok.io') ||
    window.location.hostname.endsWith('.ngrok-free.app');
  
  // Check if we're in Monday.com environment
  const isMondayEnvironment = () => {
    return window.location.hostname.includes('monday') || 
           window.location.hostname.includes('d10cf') ||
           window.location.hostname.includes('mndy') ||
           window.parent !== window;
  };

  useEffect(() => {
    console.log('App initializing...', {
      hostname: window.location.hostname,
      isMonday: isMondayEnvironment(),
      mondaySDKLoaded: window.mondaySDKLoaded,
      mondaySDKError: window.mondaySDKError
    });
    
    // For local dev, load demo data
    if (isDevMode && !isMondayEnvironment()) {
      console.log('Dev mode - loading demo data');
      loadSampleData();
      setBypassedTroubleshooter(true);
      return;
    }
    
    // Check if Monday SDK failed to load
    if (window.mondaySDKError || !monday) {
      console.error('Monday SDK not available - loading demo mode');
      loadSampleData();
      setBypassedTroubleshooter(true);
      return;
    }
    
    // In Monday.com, try to get context with fallback
    const initializeApp = async () => {
      let initialized = false;
      
      try {
        // Set a timeout for the entire initialization
        const timeoutId = setTimeout(() => {
          if (!initialized) {
            console.log('Initialization timeout - loading demo mode');
            loadSampleData();
            setBypassedTroubleshooter(true);
            initialized = true;
          }
        }, 3000); // 3 second timeout
        
        // Try to get context
        const context = await monday.get('context');
        
        if (initialized) return; // Timeout already triggered
        clearTimeout(timeoutId);
        initialized = true;
        
        console.log('Monday context received:', context);
        const data = context.data || {};
        const boardIds = data.boardIds || [];
        const boardId = data.boardId || (boardIds.length > 0 ? boardIds[0] : null);
        
        console.log('Board detection:', { boardIds, boardId, dataKeys: Object.keys(data) });
        
        if (boardId) {
          setBoardId(boardId);
          // Skip column mapping check and fetch board data directly
          setBypassedTroubleshooter(true);
          // Try to fetch board data
          try {
            await fetchBoardData(boardId);
          } catch (error) {
            console.error('Failed to fetch board data:', error);
            loadSampleData();
            setBypassedTroubleshooter(true);
          }
        } else {
          console.log('No board selected - loading demo mode');
          loadSampleData();
          setBypassedTroubleshooter(true);
        }
      } catch (error) {
        if (!initialized) {
          console.error('Failed to initialize:', error);
          loadSampleData();
          setBypassedTroubleshooter(true);
          initialized = true;
        }
      }
    };
    
    // Delay initialization slightly to ensure SDK is ready
    setTimeout(initializeApp, 100);
    
    // Listen for context changes
    try {
      monday.listen('context', (res) => {
        console.log('Context updated:', res.data);
        const data = res.data || {};
        const boardIds = data.boardIds || [];
        const newBoardId = data.boardId || (boardIds.length > 0 ? boardIds[0] : null);
        
        if (newBoardId && newBoardId !== boardId) {
          setBoardId(newBoardId);
          fetchBoardData(newBoardId).catch(error => {
            console.error('Failed to fetch board data on context change:', error);
          });
        }
      });
    } catch (error) {
      console.error('Failed to set up context listener:', error);
    }
  }, []);

  // Remove all the complex Monday.com logic
  /*
    
    // Set up global error handler for 503 errors
    const handleGlobalError = (event) => {
      console.log('Global error detected:', event);
      if (event.message?.includes('503') || event.message?.includes('Service Unavailable')) {
        console.log('503 error detected, loading demo mode immediately');
        loadSampleData();
        setBypassedTroubleshooter(true);
        setError('');
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalError);
    
    // Check for demo mode via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('demo') === 'true' || 
                      urlParams.has('demo') || 
                      window.location.hash.includes('demo');
    
    // Debug logging
    console.log('App Environment:', {
      hostname: window.location.hostname,
      search: window.location.search,
      isDemoMode,
      isDevMode,
      userAgent: navigator.userAgent,
      isMonday: window.location.hostname.includes('monday.com') || window.location.hostname.includes('monday.app')
    });
    
    if (window.location.hostname === 'localhost' || isDemoMode || isDevMode) {
      console.log('Loading demo data...');
      loadSampleData();
      setBypassedTroubleshooter(true);
      return () => {
        window.removeEventListener('error', handleGlobalError);
        window.removeEventListener('unhandledrejection', handleGlobalError);
      };
    }
    
    // iPad Safari fallback - auto-load demo on ngrok after 2 seconds
    const isIPad = navigator.userAgent.includes('iPad') || 
                   (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1);
    
    if (isIPad && window.location.hostname.endsWith('.ngrok-free.app')) {
      console.log('iPad detected on ngrok - auto-loading demo in 2 seconds...');
      setTimeout(() => {
        loadSampleData();
        setBypassedTroubleshooter(true);
      }, 2000);
      return;
    }
    const fetchContext = async () => {
      try {
        // Check if we're in Monday.com environment
        const isInMondayEnv = isMondayEnvironment();
        
        console.log('Monday.com environment check:', {
          isInIframe: window.parent !== window,
          hostname: window.location.hostname,
          origin: window.location.origin,
          referrer: document.referrer,
          isInMondayEnv,
          mondaySDKAvailable: typeof monday !== 'undefined',
          mondayAPIAvailable: typeof monday?.api === 'function'
        });

        // Add timeout for Monday API
        const contextPromise = monday.get('context');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Monday context timeout')), 5000)
        );
        
        const context = await Promise.race([contextPromise, timeoutPromise]);
        console.log('Monday context:', context.data);
        const boardIds = context.data?.boardIds || [];
        const mapping = context.data?.columnMapping || {};
        setBoardId(boardIds[0]);
        setColumnMapping(mapping);
        setAutoMapped(false);
        if (!boardIds[0]) {
          setError('No board selected in dashboard context.');
          setLoading(false);
        } else if (!mapping || Object.keys(mapping).length === 0) {
          // We'll try to auto-map in the next effect
          setError('');
        }
      } catch (err) {
        console.error('Error fetching context:', err);
        setError('Could not connect to Monday.com. Loading demo mode...');
        
        // Fallback to demo mode immediately for Monday.com environment
        if (isMondayEnvironment()) {
          console.log('In Monday.com environment, loading demo mode immediately');
          loadSampleData();
          setBypassedTroubleshooter(true);
          setError('');
        } else {
          // Fallback to demo mode after 3 seconds for other environments
          setTimeout(() => {
            console.log('Falling back to demo mode due to Monday.com connection issues');
            loadSampleData();
            setBypassedTroubleshooter(true);
            setError('');
          }, 3000);
        }
      }
    };
    
    // Set a hard timeout for Monday.com environments
    const mondayTimeout = setTimeout(() => {
      if (isMondayEnvironment() && !bypassedTroubleshooter) {
        console.log('Monday.com load timeout - falling back to demo mode');
        loadSampleData();
        setBypassedTroubleshooter(true);
        setError('');
      }
    }, 2000); // 2 second timeout
    
    // Check if Monday SDK is available
    if (typeof monday !== 'undefined' && monday.api) {
      fetchContext();
    } else {
      console.error('Monday SDK not loaded');
      // Try to wait for SDK to load if in Monday environment
      if (isMondayEnvironment()) {
        console.log('In Monday environment but SDK not loaded - loading demo mode');
        loadSampleData();
        setBypassedTroubleshooter(true);
      } else {
        // Not in Monday environment, fall back to demo mode
        loadSampleData();
        setBypassedTroubleshooter(true);
      }
    }
    
    return () => {
      clearTimeout(mondayTimeout);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalError);
    };
    monday.listen('context', res => {
      console.log('Monday context (listen):', res.data);
      const boardIds = res.data?.boardIds || [];
      const mapping = res.data?.columnMapping || {};
      setBoardId(boardIds[0]);
      setColumnMapping(mapping);
      setAutoMapped(false);
      if (!boardIds[0]) {
        setError('No board selected in dashboard context.');
        setLoading(false);
      } else if (!mapping || Object.keys(mapping).length === 0) {
        setError('');
      }
    });
  */

  // Disable Monday column mapping
  /*
  useEffect(() => {
    if (window.location.hostname === 'localhost') return;
    if (!boardId) return;
    if (columnMapping && Object.keys(columnMapping).length > 0) return;
    if (autoMapped) return;
    setLoading(true);
    setError('');
    console.log('Attempting to auto-map columns for boardId:', boardId);
    const query = `query { boards(ids: [${boardId}]) { columns { id title type } } }`;
    safeApiCall(query).then(res => {
      try {
        const columns = res.data.boards[0]?.columns || [];
        console.log('Fetched columns for auto-mapping:', columns);
        const mapping = autoMapColumns(columns);
        if (Object.keys(mapping).length > 0) {
          setColumnMapping(mapping);
          setAutoMapped(true);
          setError('');
        } else {
          setError('Could not auto-map columns. Please use the native column matching.');
        }
        setLoading(false);
      } catch (err) {
        setError('Error processing columns for auto-mapping.');
        setLoading(false);
        console.error('Error processing columns:', err);
      }
    }).catch(err => {
      setError('Failed to fetch columns for auto-mapping.');
      setLoading(false);
      console.error('API error (columns):', err);
    });
  }, [boardId, columnMapping, autoMapped]);
  */

  // Touch debugging for iPad testing
  useEffect(() => {
    if (!isDevMode) return;
    
    const touchDebugger = {
      touches: [],
      
      handleTouchStart: (e) => {
        console.log('🟢 Touch Start:', {
          touches: e.touches.length,
          x: e.touches[0]?.clientX,
          y: e.touches[0]?.clientY,
          target: e.target.className
        });
      },
      
      handleTouchMove: (e) => {
        console.log('🟡 Touch Move:', {
          touches: e.touches.length,
          x: e.touches[0]?.clientX,
          y: e.touches[0]?.clientY
        });
      },
      
      handleTouchEnd: (e) => {
        console.log('🔴 Touch End:', {
          changedTouches: e.changedTouches.length,
          remaining: e.touches.length
        });
      }
    };
    
    // Add event listeners
    document.addEventListener('touchstart', touchDebugger.handleTouchStart, { passive: false });
    document.addEventListener('touchmove', touchDebugger.handleTouchMove, { passive: false });
    document.addEventListener('touchend', touchDebugger.handleTouchEnd, { passive: false });
    
    // Add visual touch indicator
    const touchIndicator = document.createElement('div');
    touchIndicator.id = 'touch-indicator';
    touchIndicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(touchIndicator);
    
    // Update indicator on touch
    const updateIndicator = (e) => {
      if (e.touches.length > 0) {
        touchIndicator.style.display = 'block';
        touchIndicator.innerHTML = `
          Touch: ${Math.round(e.touches[0].clientX)}, ${Math.round(e.touches[0].clientY)}<br>
          Touches: ${e.touches.length}
        `;
      } else {
        touchIndicator.style.display = 'none';
      }
    };
    
    document.addEventListener('touchstart', updateIndicator);
    document.addEventListener('touchmove', updateIndicator);
    document.addEventListener('touchend', () => {
      touchIndicator.style.display = 'none';
    });
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', touchDebugger.handleTouchStart);
      document.removeEventListener('touchmove', touchDebugger.handleTouchMove);
      document.removeEventListener('touchend', touchDebugger.handleTouchEnd);
      document.removeEventListener('touchstart', updateIndicator);
      document.removeEventListener('touchmove', updateIndicator);
      document.getElementById('touch-indicator')?.remove();
    };
  }, [isDevMode]);

  // Disable Monday board data fetching
  /*
  useEffect(() => {
    if (window.location.hostname === 'localhost') return;
    if (!boardId || !columnMapping || Object.keys(columnMapping).length === 0) return;
    setLoading(true);
    setError('');
    console.log('Fetching board data for boardId:', boardId, 'with mapping:', columnMapping);
    const query = `
      query {
        boards(ids: [${boardId}]) {
          items_page(limit: 100) {
            items {
              id
              name
              column_values { id text value }
            }
          }
        }
      }
    `;
    safeApiCall(query).then(res => {
      try {
        const board = res.data.boards[0];
        const boardItems = board?.items_page?.items || [];
        console.log('Board API response:', boardItems);
        // Map items using columnMapping
        const mappedItems = boardItems.map(item => {
          const colMap = {};
          item.column_values.forEach(cv => {
            colMap[cv.id] = cv.text || cv.value || '';
          });
          // Try both generic and user-defined mapping keys
          const getMapped = (key, fallback) => {
            const colId = columnMapping[key] || columnMapping[key.toLowerCase()] || columnMapping[key.charAt(0).toUpperCase() + key.slice(1)] || '';
            return colId ? colMap[colId] : fallback;
          };
          return {
            ...item,
            year: String(getMapped('year', '')),
            genre: getMapped('genre', ''),
            revenue: Number(getMapped('projectedRevenue', getMapped('revenue', 0))),
            projectedRevenue: Number(getMapped('projectedRevenue', 0)),
            title: getMapped('title', item.name),
            productionBudget: Number(getMapped('productionBudget', 0)),
            marketingBudget: Number(getMapped('marketingBudget', 0)),
            // Add more fields as needed
          };
        });
        console.log('Mapped items:', mappedItems);
        setItems(mappedItems);
        setYearTotals(calculateYearTotals(mappedItems));
        setLoading(false);
      } catch (err) {
        setError('Error processing board data.');
        setLoading(false);
        console.error('Error processing board data:', err);
      }
    }).catch(err => {
      setError('Failed to fetch board data from monday.com.');
      setLoading(false);
      console.error('API error:', err);
    });
  }, [boardId, columnMapping]);
  */

  // Disable Monday settings
  /*
  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRes = await monday.get('settings');
      setSettings(settingsRes.data || {});
    };
    fetchSettings();
    monday.listen('settings', res => {
      setSettings(res.data || {});
    });
  }, []);

  const loadBoardData = useCallback(async () => {
    try {
      setLoading(true);
      const query = `
        query {
          boards(ids: [${boardId}]) {
            name
            description
            items_page(limit: 100) {
              items {
                id
                name
                column_values {
                  column {
                    id
                    title
                    type
                  }
                  text
                  value
                }
                genre: column_values (ids: ["genre"]) { text }
              }
            }
            columns {
              id
              title
              type
            }
          }
        }
      `;
      const response = await safeApiCall(query);
      const board = response.data.boards[0];
      const boardItems = board?.items_page?.items || [];
      if (boardItems.length === 0) throw new Error('No board data found');
      // Get date columns
      const dateCols = board.columns.filter(col => col.type === 'date').map(col => ({ key: col.id, label: col.title }));
      // setSelectedDateKey(dateCols[0]?.key); // Removed - not used
      // Map items: flatten column_values for easy access
      const mappedItems = boardItems.map(item => {
        const colMap = {};
        item.column_values.forEach(cv => {
          colMap[cv.column.id] = cv.text || cv.value || '';
        });
        return {
          ...item,
          ...colMap,
          genre: item.genre?.[0]?.text || colMap['genre'] || 'Other',
        };
      });
      setItems(mappedItems);
      calculateYearTotals(mappedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error loading board data:', error);
      loadSampleData();
    }
  }, [boardId]);
  */

  const fetchBoardData = async (boardId) => {
    try {
      setLoading(true);
      const query = `
        query {
          boards(ids: [${boardId}]) {
            name
            items_page(limit: 500) {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                }
              }
            }
          }
        }
      `;
      
      const response = await safeApiCall(query);
      
      if (!response || !response.data) {
        throw new Error('Invalid API response');
      }
      
      const board = response.data?.boards?.[0];
      
      if (!board || !board.items_page?.items) {
        throw new Error('No board data found');
      }
      
      // Map Monday items to our format
      const mappedItems = board.items_page.items.map(item => {
        // Create a map of column values
        const columnValues = {};
        item.column_values.forEach(cv => {
          columnValues[cv.id] = cv.text || '';
        });
        
        // Try to extract data with common column names (case-insensitive)
        const getValue = (keys) => {
          for (const key of keys) {
            const value = Object.entries(columnValues).find(([k, v]) => 
              k.toLowerCase().includes(key.toLowerCase())
            )?.[1];
            if (value) return value;
          }
          return null;
        };
        
        const year = getValue(['year', 'date', 'release']) || '2025';
        const yearMatch = year.match(/\d{4}/);
        
        return {
          id: item.id,
          name: item.name,
          year: yearMatch ? yearMatch[0] : '2025',
          genre: getValue(['genre', 'category', 'type']) || 'Drama',
          productionBudget: parseInt(getValue(['production_budget', 'prod_budget', 'budget'])) || 100,
          marketingBudget: parseInt(getValue(['marketing_budget', 'marketing', 'mktg'])) || 50,
          projectedRevenue: parseInt(getValue(['projected_revenue', 'revenue', 'box_office'])) || 200,
          status: getValue(['status', 'stage']) || 'Development',
          director: getValue(['director', 'filmmaker']) || 'TBD',
          type: getValue(['type', 'format']) || 'Feature Film',
          priority: getValue(['priority', 'importance']) || 'Medium',
          riskLevel: getValue(['risk_level', 'risk']) || 'Medium'
        };
      });
      
      if (mappedItems.length === 0) {
        throw new Error('No items found in board');
      }
      
      setItems(mappedItems);
      calculateYearTotals(mappedItems);
      setLoading(false);
      setError('');
      
      monday.execute('notice', {
        message: `Loaded ${mappedItems.length} items from board`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error fetching board data:', error);
      // Fall back to demo data
      loadSampleData();
    }
  };

  const loadSampleData = () => {
    console.log('Loading sample data...');
    setLoading(false); // Immediately stop loading
    const sampleItems = [
      // 2024 Releases
      {
        id: 'sample1',
        name: 'Aquaman: Lost Kingdom',
        year: '2024',
        type: 'Feature Film',
        productionBudget: 205,
        marketingBudget: 160,
        projectedRevenue: 650,
        genre: 'Action',
        status: 'Released',
        director: 'James Wan',
        priority: 'High',
        riskLevel: 'Medium',
        productionCompany: 'DC Studios',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample2',
        name: 'Dune: Part Two',
        year: '2024',
        type: 'Feature Film',
        productionBudget: 190,
        marketingBudget: 140,
        projectedRevenue: 850,
        genre: 'Sci-Fi',
        status: 'Released',
        director: 'Denis Villeneuve',
        priority: 'High',
        riskLevel: 'Low',
        productionCompany: 'Legendary',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample3',
        name: 'House of the Dragon S2',
        year: '2024',
        type: 'Series',
        productionBudget: 200,
        marketingBudget: 80,
        projectedRevenue: 600,
        genre: 'Drama',
        status: 'Released',
        director: 'Ryan Condal',
        priority: 'High',
        riskLevel: 'Low',
        productionCompany: 'HBO',
        distributionPartner: 'Max'
      },
      {
        id: 'sample4',
        name: 'The Penguin',
        year: '2024',
        type: 'Series',
        productionBudget: 85,
        marketingBudget: 45,
        projectedRevenue: 280,
        genre: 'Drama',
        status: 'Released',
        director: 'Lauren LeFranc',
        priority: 'Medium',
        riskLevel: 'Low',
        productionCompany: 'DC Studios',
        distributionPartner: 'Max'
      },
      
      // 2025 Releases
      {
        id: 'sample5',
        name: 'Superman: Legacy',
        year: '2025',
        type: 'Feature Film',
        productionBudget: 200,
        marketingBudget: 150,
        projectedRevenue: 800,
        genre: 'Action',
        status: 'Post-Production',
        director: 'James Gunn',
        priority: 'High',
        riskLevel: 'Medium',
        productionCompany: 'DC Studios',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample6',
        name: 'Game of Thrones: Knight of Seven Kingdoms',
        year: '2025',
        type: 'Series',
        productionBudget: 120,
        marketingBudget: 80,
        projectedRevenue: 400,
        genre: 'Drama',
        status: 'Production',
        director: 'George R.R. Martin',
        priority: 'High',
        riskLevel: 'Low',
        productionCompany: 'HBO',
        distributionPartner: 'Max'
      },
      {
        id: 'sample7',
        name: 'Peacemaker Season 2',
        year: '2025',
        type: 'Series',
        productionBudget: 60,
        marketingBudget: 40,
        projectedRevenue: 200,
        genre: 'Comedy',
        status: 'Production',
        director: 'James Gunn',
        priority: 'Medium',
        riskLevel: 'Low',
        productionCompany: 'DC Studios',
        distributionPartner: 'Max'
      },
      {
        id: 'sample8',
        name: 'The Batman: Arkham',
        year: '2025',
        type: 'Series',
        productionBudget: 90,
        marketingBudget: 50,
        projectedRevenue: 320,
        genre: 'Action',
        status: 'Production',
        director: 'Antonio Campos',
        priority: 'Medium',
        riskLevel: 'Medium',
        productionCompany: 'DC Studios',
        distributionPartner: 'Max'
      },
      {
        id: 'sample9',
        name: 'Wonka',
        year: '2025',
        type: 'Feature Film',
        productionBudget: 125,
        marketingBudget: 100,
        projectedRevenue: 450,
        genre: 'Fantasy',
        status: 'Post-Production',
        director: 'Paul King',
        priority: 'Medium',
        riskLevel: 'Low',
        productionCompany: 'Warner Bros.',
        distributionPartner: 'Warner Bros. Pictures'
      },
      
      // 2026 Releases
      {
        id: 'sample10',
        name: 'The Batman Part II',
        year: '2026',
        type: 'Feature Film',
        productionBudget: 180,
        marketingBudget: 130,
        projectedRevenue: 750,
        genre: 'Action',
        status: 'Pre-Production',
        director: 'Matt Reeves',
        priority: 'High',
        riskLevel: 'Low',
        productionCompany: 'DC Studios',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample11',
        name: 'Dune: Part Three',
        year: '2026',
        type: 'Feature Film',
        productionBudget: 275,
        marketingBudget: 200,
        projectedRevenue: 1200,
        genre: 'Sci-Fi',
        status: 'Development',
        director: 'Denis Villeneuve',
        priority: 'High',
        riskLevel: 'Medium',
        productionCompany: 'Legendary',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample12',
        name: 'The Lord of the Rings: War of the Rohirrim',
        year: '2026',
        type: 'Feature Film',
        productionBudget: 150,
        marketingBudget: 120,
        projectedRevenue: 600,
        genre: 'Fantasy',
        status: 'Pre-Production',
        director: 'Kenji Kamiyama',
        priority: 'High',
        riskLevel: 'Medium',
        productionCompany: 'New Line Cinema',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample13',
        name: 'Succession: The Movie',
        year: '2026',
        type: 'Feature Film',
        productionBudget: 80,
        marketingBudget: 60,
        projectedRevenue: 300,
        genre: 'Drama',
        status: 'Development',
        director: 'Jesse Armstrong',
        priority: 'Medium',
        riskLevel: 'Low',
        productionCompany: 'HBO',
        distributionPartner: 'Warner Bros. Pictures'
      },
      
      // 2027 Releases
      {
        id: 'sample14',
        name: 'Justice League: New Dawn',
        year: '2027',
        type: 'Feature Film',
        productionBudget: 220,
        marketingBudget: 180,
        projectedRevenue: 900,
        genre: 'Action',
        status: 'Development',
        director: 'TBD',
        priority: 'High',
        riskLevel: 'High',
        productionCompany: 'DC Studios',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample15',
        name: 'The Sandman Season 3',
        year: '2027',
        type: 'Series',
        productionBudget: 75,
        marketingBudget: 45,
        projectedRevenue: 250,
        genre: 'Fantasy',
        status: 'Development',
        director: 'Neil Gaiman',
        priority: 'Medium',
        riskLevel: 'Medium',
        productionCompany: 'Netflix',
        distributionPartner: 'Netflix'
      },
      {
        id: 'sample16',
        name: 'Mad Max: Furiosa',
        year: '2027',
        type: 'Feature Film',
        productionBudget: 160,
        marketingBudget: 120,
        projectedRevenue: 550,
        genre: 'Action',
        status: 'Development',
        director: 'George Miller',
        priority: 'Medium',
        riskLevel: 'Medium',
        productionCompany: 'Warner Bros.',
        distributionPartner: 'Warner Bros. Pictures'
      },
      
      // 2028 Releases
      {
        id: 'sample17',
        name: 'The Flash: Speed Force',
        year: '2028',
        type: 'Feature Film',
        productionBudget: 190,
        marketingBudget: 150,
        projectedRevenue: 700,
        genre: 'Action',
        status: 'Development',
        director: 'TBD',
        priority: 'Medium',
        riskLevel: 'High',
        productionCompany: 'DC Studios',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample18',
        name: 'Game of Thrones: Snow',
        year: '2028',
        type: 'Series',
        productionBudget: 150,
        marketingBudget: 90,
        projectedRevenue: 500,
        genre: 'Drama',
        status: 'Development',
        director: 'Kit Harington',
        priority: 'High',
        riskLevel: 'Medium',
        productionCompany: 'HBO',
        distributionPartner: 'Max'
      },
      {
        id: 'sample19',
        name: 'The Matrix: Resurrection',
        year: '2028',
        type: 'Feature Film',
        productionBudget: 200,
        marketingBudget: 160,
        projectedRevenue: 750,
        genre: 'Sci-Fi',
        status: 'Development',
        director: 'Lana Wachowski',
        priority: 'High',
        riskLevel: 'High',
        productionCompany: 'Warner Bros.',
        distributionPartner: 'Warner Bros. Pictures'
      },
      {
        id: 'sample20',
        name: 'The Conjuring: Final Chapter',
        year: '2028',
        type: 'Feature Film',
        productionBudget: 45,
        marketingBudget: 35,
        projectedRevenue: 180,
        genre: 'Horror',
        status: 'Development',
        director: 'James Wan',
        priority: 'Medium',
        riskLevel: 'Low',
        productionCompany: 'New Line Cinema',
        distributionPartner: 'Warner Bros. Pictures'
      }
    ];

    setItems(sampleItems);
    calculateYearTotals(sampleItems);
    setLoading(false);
    setError('');
    console.log('Sample data loaded successfully');

    // Only show notice if Monday SDK is available
    if (monday && monday.execute) {
      try {
        monday.execute('notice', {
          message: '🎬 Preview Mode: Showing sample WBD slate data',
          type: 'info'
        });
      } catch (e) {
        console.log('Could not show Monday notice:', e);
      }
    }
  };

  const calculateYearTotals = (itemsData) => {
    const totals = {};
    const chartDataArray = [];
    
    YEARS.forEach(year => {
      totals[year] = {
        production: 0,
        marketing: 0,
        revenue: 0,
        titles: 0,
        roi: 0
      };
    });
    
    itemsData.forEach(item => {
      const year = item.year;
      if (totals[year]) {
        totals[year].production += item.productionBudget || 0;
        totals[year].marketing += item.marketingBudget || 0;
        totals[year].revenue += item.projectedRevenue || item.revenue || 0;
        totals[year].titles += 1;
      }
    });

    // Calculate ROI and prepare chart data
    YEARS.forEach(year => {
      const data = totals[year];
      const investment = data.production + data.marketing;
      data.roi = investment > 0 ? ((data.revenue - investment) / investment * 100) : 0;
      
      chartDataArray.push({
        year,
        revenue: data.revenue,
        investment: investment,
        titles: data.titles,
        roi: data.roi
      });
    });

    setYearTotals(totals);
    setChartData(chartDataArray);
  };

  const handleTitleMove = async (itemId, newYear) => {
    try {
      setUpdating(true);
      const item = items.find(i => i.id === itemId);
      
      // Optimistic update
      const updatedItems = items.map(i => 
        i.id === itemId ? { ...i, year: newYear } : i
      );
      setItems(updatedItems);
      calculateYearTotals(updatedItems);
      
      if (item.id.startsWith('sample')) {
        // Sample data - show preview notice
        setTimeout(() => {
          monday.execute('notice', {
            message: `🎬 "${item.name}" moved to ${newYear} (Preview Mode)`,
            type: 'success'
          });
          setUpdating(false);
        }, 300);
        return;
      }

      // Real board update
      const yearColumnId = 'color_mksdwj50'; // Your year column ID
      
      const mutation = `
        mutation {
          change_column_value(
            item_id: ${itemId}
            board_id: ${boardId}
            column_id: "${yearColumnId}"
            value: "{\\"label\\":\\"${newYear}\\"}"
          ) {
            id
          }
        }
      `;

      await safeApiCall(mutation);
      
      setTimeout(() => {
        monday.execute('notice', {
          message: `🎬 "${item.name}" moved to ${newYear} slate`,
          type: 'success'
        });
        setUpdating(false);
      }, 300);

    } catch (error) {
      console.error('Error moving title:', error);
      // Rollback optimistic update
      // await loadBoardData();
      await fetchBoardData(boardId);
      
      monday.execute('notice', {
        message: '⚠️ Error updating slate',
        type: 'error'
      });
      setUpdating(false);
    }
  };

  // Touch-compatible drag and drop state
  // const [draggedOverYear, setDraggedOverYear] = useState(null); // Removed - not used
  const dragConstraintsRef = useRef(null);

  // Enhanced drag and drop with touch support
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', itemId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = (e) => {
    setDraggedItem(null);
    // setDraggedOverYear(null); // Removed - not used
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e, year) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    let itemId = draggedItem;
    if (e.dataTransfer && e.dataTransfer.getData('text/plain')) {
      itemId = e.dataTransfer.getData('text/plain');
    }
    
    if (itemId) {
      handleTitleMove(itemId, year);
    }
    setDraggedItem(null);
    // setDraggedOverYear(null); // Removed - not used
  };

  // Touch-specific handlers for Framer Motion
  const handleDragMotionStart = (itemId) => {
    setDraggedItem(itemId);
  };

  const handleDragMotionEnd = (event, info, itemId) => {
    // Find which year column the item was dropped on
    const dropTarget = document.elementFromPoint(
      event.clientX || info.point.x,
      event.clientY || info.point.y
    );
    
    if (dropTarget) {
      const yearColumn = dropTarget.closest('.year-column');
      if (yearColumn) {
        const year = yearColumn.getAttribute('data-year');
        if (year && year !== items.find(item => item.id === itemId)?.[columnMapping.year]) {
          handleTitleMove(itemId, year);
        }
      }
    }
    
    setDraggedItem(null);
    // setDraggedOverYear(null); // Removed - not used
  };

  // Column visibility controls
  const handleColumnToggle = async (columnKey) => {
    const newVisibleColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter(col => col !== columnKey)
      : [...visibleColumns, columnKey];
    
    setVisibleColumns(newVisibleColumns);
    setActivePreset('custom');
    
    // Save to Monday.com settings
    try {
      await monday.execute('set-settings', {
        visibleColumns: JSON.stringify(newVisibleColumns),
        activePreset: 'custom'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handlePresetChange = async (presetKey) => {
    const preset = COLUMN_PRESETS[presetKey];
    if (preset) {
      setVisibleColumns(preset.columns);
      setActivePreset(presetKey);
      
      try {
        await monday.execute('set-settings', {
          visibleColumns: JSON.stringify(preset.columns),
          activePreset: presetKey
        });
      } catch (error) {
        console.error('Error saving preset:', error);
      }
    }
  };

  // Utility functions
  const calculateROI = (revenue, production, marketing) => {
    const investment = production + marketing;
    return investment > 0 ? ((revenue - investment) / investment * 100).toFixed(0) : 0;
  };

  // Defensive helpers
  const safeObject = obj => obj || {};
  const safeArray = arr => Array.isArray(arr) ? arr : [];

  // Defensive wrapper for getTotalMetrics and similar functions
  let summaryError = '';
  let safeYearTotals = safeObject(yearTotals);
  let safeItems = safeArray(items);
  let safeColumnMapping = safeObject(columnMapping);
  let totalMetrics = {};
  try {
    // If you have a getTotalMetrics or similar, wrap it here
    if (typeof getTotalMetrics === 'function') {
      totalMetrics = getTotalMetrics(safeYearTotals, safeItems, safeColumnMapping);
    }
  } catch (err) {
    summaryError = 'Error calculating summary metrics: ' + err.message;
    console.error('Summary error:', err);
  }

  // Get unique values for filters
  const uniqueYears = ['All', ...Array.from(new Set(items.map(item => item.year)).values())];
  const uniqueGenres = ['All', ...Array.from(new Set(items.map(item => item.genre).filter(Boolean)).values())];
  const uniqueStatuses = ['All', ...Array.from(new Set(items.map(item => item.status).filter(Boolean)).values())];

  // Filter items based on selected filters
  const filteredItems = items.filter(item => {
    return (filterYear === 'All' || item.year === filterYear) &&
           (filterGenre === 'All' || item.genre === filterGenre) &&
           (filterStatus === 'All' || item.status === filterStatus);
  });

  const handleOpenItemCard = (itemId) => {
    if (!itemId || itemId.startsWith('sample')) return;
    monday.execute('openItemCard', { itemId });
  };

  const handleEditStart = (item, e) => {
    e.stopPropagation(); // Prevent opening item card
    setEditingItem(item.id);
    setEditValues({
      productionBudget: item.productionBudget,
      marketingBudget: item.marketingBudget,
      projectedRevenue: item.projectedRevenue,
      status: item.status
    });
  };

  const handleEditSave = async (itemId) => {
    try {
      setUpdating(true);
      
      if (itemId.startsWith('sample')) {
        // Sample data - show preview notice
        setTimeout(() => {
          monday.execute('notice', {
            message: `🎬 Updated "${items.find(i => i.id === itemId)?.name}" (Preview Mode)`,
            type: 'success'
          });
          setUpdating(false);
        }, 300);
        setEditingItem(null);
        return;
      }

      // Build column values for Monday.com, only include mapped columns
      const columnValues = {};
      if (columnMapping.productionBudget) columnValues[columnMapping.productionBudget] = String(editValues.productionBudget);
      if (columnMapping.marketingBudget) columnValues[columnMapping.marketingBudget] = String(editValues.marketingBudget);
      if (columnMapping.projectedRevenue) columnValues[columnMapping.projectedRevenue] = String(editValues.projectedRevenue);
      if (columnMapping.status) columnValues[columnMapping.status] = JSON.stringify({ label: editValues.status });
      // Add more as needed

      console.log('columnMapping:', columnMapping);
      console.log('columnValues:', columnValues);
      console.log('itemId:', itemId, 'boardId:', boardId);

      const mutation = `
        mutation {
          change_multiple_column_values(
            item_id: ${itemId},
            board_id: ${boardId},
            column_values: ${JSON.stringify(JSON.stringify(columnValues))}
          ) {
            id
          }
        }
      `;
      console.log('Update mutation:', mutation);
      await safeApiCall(mutation);
      // Update local state as before
      const updatedItems = items.map(item => 
        item.id === itemId 
          ? { ...item, ...editValues }
          : item
      );
      setItems(updatedItems);
      calculateYearTotals(updatedItems);
      setEditingItem(null);
      setTimeout(() => {
        monday.execute('notice', {
          message: `🎬 Updated "${items.find(i => i.id === itemId)?.name}"`,
          type: 'success'
        });
        setUpdating(false);
      }, 300);
    } catch (error) {
      console.error('Error updating item:', error?.error_message || error?.message || error, error);
      monday.execute('notice', {
        message: '⚠️ Error updating item',
        type: 'error'
      });
      setUpdating(false);
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditValues({});
  };

  const handleEditChange = (field, value) => {
    setEditValues(prev => ({
      ...prev,
      [field]: field.includes('Budget') || field.includes('Revenue') ? parseFloat(value) || 0 : value
    }));
  };

  const cycleTheme = () => {
    const themes = ['regular', 'dark', 'night'];
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    setThemeMode(nextTheme);
    
    // Remove all theme classes
    document.body.classList.remove('dark-mode', 'night-mode');
    
    // Add appropriate class
    if (nextTheme === 'dark') {
      document.body.classList.add('dark-mode');
    } else if (nextTheme === 'night') {
      document.body.classList.add('night-mode');
    }
  };

  // Helper to calculate YoY growth
  const getYoYGrowth = (data, key) => {
    if (data.length < 2) return 0;
    const last = data[data.length - 1][key];
    const prev = data[data.length - 2][key];
    if (!prev || prev === 0) return 0;
    return ((last - prev) / prev) * 100;
  };

  // Helper to calculate moving average
  const getMovingAverage = (data, key, windowSize = 2) => {
    return data.map((row, idx, arr) => {
      const start = Math.max(0, idx - windowSize + 1);
      const window = arr.slice(start, idx + 1);
      const avg = window.reduce((sum, r) => sum + r[key], 0) / window.length;
      return { ...row, [`${key}MA`]: avg };
    });
  };

  // Helper to export to PPTX
  const exportFinancialChartToPPTX = async () => {
    const pptx = new PptxGenJS();
    const slide = pptx.addSlide();

    // Executive summary
    const revenueYoY = getYoYGrowth(chartData, 'revenue');
    const roiYoY = getYoYGrowth(chartData, 'roi');
    slide.addText(`Financial Executive Summary`, { x: 0.5, y: 0.2, fontSize: 24, bold: true, color: '363636' });
    slide.addText(`Year: ${chartData[chartData.length - 1].year}`, { x: 0.5, y: 0.7, fontSize: 18 });
    slide.addText(`Revenue YoY: ${(revenueYoY >= 0 ? '▲' : '▼') + Math.abs(revenueYoY).toFixed(1)}%`, { x: 0.5, y: 1.1, fontSize: 16, color: revenueYoY >= 0 ? '27ae60' : 'e74c3c' });
    slide.addText(`ROI YoY: ${(roiYoY >= 0 ? '▲' : '▼') + Math.abs(roiYoY).toFixed(1)}%`, { x: 0.5, y: 1.4, fontSize: 16, color: roiYoY >= 0 ? '27ae60' : 'e74c3c' });

    // Chart image
    if (chartRef.current) {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: null, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      slide.addImage({ data: imgData, x: 0.5, y: 1.8, w: 8.5, h: 3.2 });
    }

    // Table of year-by-year data
    const tableRows = [
      ['Year', 'Revenue', 'Investment', 'ROI %', 'Titles'],
      ...chartData.map(row => [row.year, `${row.revenue}M`, `${row.investment}M`, `${row.roi.toFixed(1)}%`, row.titles])
    ];
    slide.addTable(tableRows, {
      x: 0.5, y: 5.1, w: 8.5, fontSize: 14, border: { pt: '1', color: 'cccccc' },
      fill: 'f8f9fa', color: '363636', bold: true, align: 'center',
      valign: 'middle',
      rowH: 0.5,
      colW: [1.2, 2, 2, 1.2, 1.2]
    });

    // Export
    pptx.writeFile({ fileName: 'WBD_Financial_Executive_Summary.pptx' });
  };

  const missingColumns = REQUIRED_COLUMNS.filter(col => !columnMapping[col.key]);

  // Always show demo button on ngrok/dev environments
  const shouldShowDemoButton = isDevMode || window.location.search.includes('demo');
  
  // Debug logging
  console.log('Column check:', {
    missingColumns,
    bypassedTroubleshooter,
    itemsLoaded: items.length,
    REQUIRED_COLUMNS_length: REQUIRED_COLUMNS.length,
    shouldShowMissingScreen: missingColumns.length > 0 && !bypassedTroubleshooter && items.length === 0
  });
  
  // Skip missing columns screen - we have no required columns and items are loaded
  if (false) { // Disabled - no required columns
    return (
      <div style={{
        background: '#fffbe6',
        border: '1.5px solid #ffe58f',
        color: '#ad6800',
        borderRadius: 12,
        padding: 32,
        margin: 32,
        maxWidth: 600,
        marginLeft: 'auto',
        marginRight: 'auto',
        fontSize: 18,
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        position: 'relative',
      }}>
        <b style={{ fontSize: 22, display: 'block', marginBottom: 12 }}>⚠️ Missing Column Mappings</b>
        <div style={{ marginBottom: 12 }}>
          The following required fields are not mapped to board columns:
          <ul style={{ margin: '12px 0 0 24px' }}>
            {missingColumns.map(col => (
              <li key={col.key} style={{ marginBottom: 4 }}>{col.label}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>How to fix:</b>
          <ol style={{ margin: '8px 0 0 24px' }}>
            <li>Click the <b>gear/settings</b> icon on this widget.</li>
            <li>Open the <b>column matching</b> dialog.</li>
            <li>Map each missing field to the appropriate board column.</li>
            <li>Save and reload the dashboard.</li>
          </ol>
        </div>
        <div style={{ fontSize: 15, marginTop: 10, color: '#ad6800', opacity: 0.8 }}>
          Once all required fields are mapped, your dashboard will load automatically.
        </div>
        {/* Bypass button for dev mode - touch optimized */}
        {shouldShowDemoButton && (
          <button
            style={{
              marginTop: 32,
              background: '#ffd700',
              color: '#222',
              border: 'none',
              borderRadius: 12,
              padding: '24px 48px', // Much larger for touch
              fontWeight: 700,
              fontSize: 22,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.2s',
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              minHeight: '70px', // Minimum touch target
              minWidth: '300px',
              touchAction: 'manipulation', // Prevent zoom on double tap
              WebkitTapHighlightColor: 'transparent',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
              e.currentTarget.style.background = '#ffcc00';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = '#ffd700';
            }}
            onClick={() => {
              setBypassedTroubleshooter(true);
              loadSampleData();
            }}
          >
            🚀 Load Demo Dashboard
          </button>
        )}
      </div>
    );
  }

  // Floating label to reopen troubleshooter if bypassed
  const floatingLabelStyle = {
    position: 'fixed',
    bottom: 24,
    left: 24,
    background: '#fffbe6',
    color: '#ad6800',
    border: '1.5px solid #ffe58f',
    borderRadius: 8,
    padding: '8px 18px',
    fontWeight: 700,
    fontSize: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    cursor: 'pointer',
    zIndex: 2000,
    opacity: 0.95,
    transition: 'opacity 0.2s',
  };

  if (error || summaryError) {
    return <div style={{ color: 'red', padding: 24 }}><b>Error:</b> {error || summaryError}</div>;
  }
  if (loading) {
    return (
      <div className="wbd-loading">
        <div className="simple-loader">Loading...</div>
        <p style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading dashboard...</p>
        {isMondayEnvironment() && (
          <div style={{ marginTop: 30 }}>
            <p style={{ fontSize: 14, color: '#999' }}>Having trouble loading?</p>
            <button 
              onClick={() => {
                console.log('Manual demo mode activation');
                loadSampleData();
                setBypassedTroubleshooter(true);
                setLoading(false);
                setError('');
              }}
              style={{
                marginTop: 10,
                padding: '10px 20px',
                fontSize: 16,
                backgroundColor: '#1a6dcc',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Load Demo Mode
            </button>
          </div>
        )}
      </div>
    );
  }

  const itemsByYear = filteredItems.reduce((acc, item) => {
    if (!acc[item.year]) acc[item.year] = [];
    acc[item.year].push(item);
    return acc;
  }, {});

  return (
    <div className="wbd-dashboard">
      {/* Show demo mode indicator */}
      {bypassedTroubleshooter && items.length > 0 && items[0].id.includes('sample') && (
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          backgroundColor: '#f39c12',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          zIndex: 10000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          Demo Mode
        </div>
      )}
      {/* Floating label for dev bypass */}
      {isDevMode && bypassedTroubleshooter && (
        <div style={floatingLabelStyle} onClick={() => setBypassedTroubleshooter(false)}>
          ⚠️ Column Mapping
        </div>
      )}
      {/* Executive Header with Settings */}
      <Box className="card" style={{ marginBottom: 32, padding: 32 }}>
        <div className="wbd-header">
          <div className="wbd-logo-area">
            <div className="wbd-shield">WB</div>
            <div className="header-content">
              <h1 className="dashboard-title">Executive Slate Planning</h1>
              <p className="dashboard-subtitle">Strategic content portfolio management • 2025-2029</p>
            </div>
          </div>
          <div className="header-controls">
            <div className="executive-metrics">
              <div className="card badge financial">
                <span role="img" aria-label="calendar">📅</span> {totalMetrics.totalTitles} Titles
              </div>
              <div className="card badge financial">
                <span role="img" aria-label="dollar">💰</span> {formatCurrency(totalMetrics.totalInvestment)} Investment
              </div>
              <div className="card badge financial">
                <span role="img" aria-label="trending">📈</span> {formatCurrency(totalMetrics.totalRevenue)} Revenue
              </div>
              <div className="card badge financial">
                <span role="img" aria-label="users">👥</span> {calculateROI(totalMetrics.totalRevenue, totalMetrics.totalInvestment * 0.6, totalMetrics.totalInvestment * 0.4)}% ROI
              </div>
            </div>
            <div className="dashboard-filters" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginRight: 16 }}>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="monday-style-dropdown">
                {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
              <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="monday-style-dropdown">
                {uniqueGenres.map(genre => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="monday-style-dropdown">
                {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <button 
              onClick={cycleTheme} 
              title={`Current: ${themeMode} mode`} 
              className="icon-button theme-button"
              style={{ minWidth: '60px', minHeight: '60px' }}
            >
              {themeMode === 'regular' ? '☀️' : themeMode === 'dark' ? '🌙' : '🌌'}
            </button>
            <button 
              onClick={() => {
                console.log('Customize button clicked, current state:', showCustomization);
                setShowCustomization(!showCustomization);
              }} 
              className="customize-trigger-button"
              style={{
                background: 'linear-gradient(135deg, var(--wbd-primary) 0%, var(--wbd-primary-light) 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 20px rgba(26, 109, 204, 0.3)',
                transition: 'all 0.3s ease',
                minHeight: '60px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 30px rgba(26, 109, 204, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(26, 109, 204, 0.3)';
              }}
            >
              <span style={{ fontSize: '24px' }}>✨</span>
              <span>Customize</span>
            </button>
          </div>
        </div>
      </Box>


      {/* Touch-friendly Tab Navigation */}
      <div className="dashboard-tabs touch-optimized">
        <button 
          className={activeTab === 'summary' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('summary')}
          style={{ minHeight: '60px', fontSize: '18px' }}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Summary</span>
        </button>
        <button 
          className={activeTab === 'financial' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('financial')}
          style={{ minHeight: '60px', fontSize: '18px' }}
        >
          <span className="tab-icon">💰</span>
          <span className="tab-label">Financial Chart</span>
        </button>
        <button 
          className={activeTab === 'timeline' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('timeline')}
          style={{ minHeight: '60px', fontSize: '18px' }}
        >
          <span className="tab-icon">📅</span>
          <span className="tab-label">Timeline</span>
        </button>
        <button 
          className={activeTab === 'customize' ? 'tab active' : 'tab'} 
          onClick={() => setActiveTab('customize')}
          style={{ minHeight: '60px', fontSize: '18px' }}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">Customize</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div>
          {/* Year Planning Grid */}
          <div style={{ position: 'relative', zIndex: 100 }}>
          <div className="years-container" ref={(el) => {
            scrollContainerRef.current = el;
            dragConstraintsRef.current = el;
          }}>
            <div className="years-grid">
              {YEARS.map(year => {
                const yearData = safeYearTotals[year] || { production: 0, marketing: 0, revenue: 0, titles: 0 };
                const roi = calculateROI(yearData.revenue, yearData.production, yearData.marketing);
                
                return (
                  <div 
                    key={year}
                    className="year-column card"
                    data-year={year}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, year)}
                  >
                    <div className="year-header">
                      <h2 className="year-title">{year}</h2>
                      
                      <div className="year-financials">
                        <div className="financial-metric">
                          <div className="label">Production</div>
                          <div className="value">{formatCurrency(yearData.production)}</div>
                        </div>
                        <div className="financial-metric">
                          <div className="label">Marketing</div>
                          <div className="value">{formatCurrency(yearData.marketing)}</div>
                        </div>
                        <div className="financial-metric">
                          <div className="label">Revenue</div>
                          <div className="value">{formatCurrency(yearData.revenue)}</div>
                        </div>
                        <div className="financial-metric">
                          <div className="label">ROI</div>
                          <div className={`value ${parseInt(roi) > 0 ? 'positive' : 'negative'}`}>
                            {roi}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="year-summary">
                        {yearData.titles} titles • {formatCurrency(yearData.production + yearData.marketing)} investment
                      </div>
                    </div>

                    <div className="titles-list">
                      {(itemsByYear[year] || []).map(item => (
                        <div
                          key={item.id}
                          className={`title-card ${draggedItem === item.id ? 'dragging' : ''} ${editingItem === item.id ? 'editing' : ''}`}
                          draggable={editingItem !== item.id}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => editingItem !== item.id && handleOpenItemCard(item.id)}
                          onTouchStart={(e) => {
                            if (editingItem === item.id) return;
                            const touch = e.touches[0];
                            const element = e.currentTarget;
                            const rect = element.getBoundingClientRect();
                            
                            // Store initial touch info
                            element.dataset.touchStartX = touch.clientX;
                            element.dataset.touchStartY = touch.clientY;
                            element.dataset.offsetX = touch.clientX - rect.left;
                            element.dataset.offsetY = touch.clientY - rect.top;
                            element.dataset.itemId = item.id;
                            
                            // Clone for dragging
                            const clone = element.cloneNode(true);
                            clone.id = 'drag-clone';
                            clone.style.position = 'fixed';
                            clone.style.left = `${rect.left}px`;
                            clone.style.top = `${rect.top}px`;
                            clone.style.width = `${rect.width}px`;
                            clone.style.height = `${rect.height}px`;
                            clone.style.zIndex = '99999';
                            clone.style.pointerEvents = 'none';
                            clone.style.opacity = '0.8';
                            clone.style.transform = 'scale(0.95)';
                            clone.classList.add('dragging-clone');
                            document.body.appendChild(clone);
                            
                            setDraggedItem(item.id);
                            element.style.opacity = '0.3';
                          }}
                          onTouchMove={(e) => {
                            if (editingItem === item.id) return;
                            e.preventDefault();
                            const touch = e.touches[0];
                            const clone = document.getElementById('drag-clone');
                            if (clone) {
                              const offsetX = parseFloat(e.currentTarget.dataset.offsetX);
                              const offsetY = parseFloat(e.currentTarget.dataset.offsetY);
                              clone.style.left = `${touch.clientX - offsetX}px`;
                              clone.style.top = `${touch.clientY - offsetY}px`;
                              
                              // Check for drop target
                              clone.style.pointerEvents = 'none';
                              const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                              const yearColumn = elementBelow?.closest('.year-column');
                              
                              // Remove previous hover states
                              document.querySelectorAll('.year-column').forEach(col => col.classList.remove('drag-over'));
                              if (yearColumn) {
                                yearColumn.classList.add('drag-over');
                              }
                            }
                          }}
                          onTouchEnd={(e) => {
                            if (editingItem === item.id) return;
                            const clone = document.getElementById('drag-clone');
                            if (clone) {
                              const touch = e.changedTouches[0];
                              clone.style.pointerEvents = 'none';
                              const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                              const yearColumn = elementBelow?.closest('.year-column');
                              
                              if (yearColumn) {
                                const year = yearColumn.getAttribute('data-year');
                                if (year) {
                                  handleTitleMove(item.id, year);
                                }
                              }
                              
                              clone.remove();
                              document.querySelectorAll('.year-column').forEach(col => col.classList.remove('drag-over'));
                              e.currentTarget.style.opacity = '1';
                              setDraggedItem(null);
                            }
                          }}
                          style={{ 
                            cursor: editingItem === item.id ? 'default' : 'grab',
                            position: 'relative'
                          }}
                        >
                          <div className="title-name">{item.name}</div>
                          
                          {editingItem === item.id ? (
                            // Edit Mode
                            <div className="edit-mode">
                              <div className="edit-fields">
                                <div className="edit-field">
                                  <label>Production Budget ($M)</label>
                                  <input
                                    type="number"
                                    value={editValues.productionBudget || 0}
                                    onChange={(e) => handleEditChange('productionBudget', e.target.value)}
                                    className="edit-input"
                                  />
                                </div>
                                <div className="edit-field">
                                  <label>Marketing Budget ($M)</label>
                                  <input
                                    type="number"
                                    value={editValues.marketingBudget || 0}
                                    onChange={(e) => handleEditChange('marketingBudget', e.target.value)}
                                    className="edit-input"
                                  />
                                </div>
                                <div className="edit-field">
                                  <label>Projected Revenue ($M)</label>
                                  <input
                                    type="number"
                                    value={editValues.projectedRevenue || 0}
                                    onChange={(e) => handleEditChange('projectedRevenue', e.target.value)}
                                    className="edit-input"
                                  />
                                </div>
                                <div className="edit-field">
                                  <label>Status</label>
                                  <select
                                    value={editValues.status || ''}
                                    onChange={(e) => handleEditChange('status', e.target.value)}
                                    className="edit-select"
                                  >
                                    <option value="Development">Development</option>
                                    <option value="Pre-Production">Pre-Production</option>
                                    <option value="Production">Production</option>
                                    <option value="Post-Production">Post-Production</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>
                              <div className="edit-actions">
                                <button onClick={() => handleEditSave(item.id)} className="save-button">
                                  💾 Save
                                </button>
                                <button onClick={handleEditCancel} className="cancel-button">
                                  ❌ Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <>
                              <div className="badges-row" style={{ marginBottom: 8 }}>
                                {item.status && <span className="badge status">{item.status}</span>}
                                {item.type && <span className="badge type">{item.type}</span>}
                                {item.priority && <span className="badge meta">{item.priority}</span>}
                                {item.riskLevel && <span className="badge meta">{item.riskLevel}</span>}
                                {/* Add more badges as needed */}
                              </div>
                              
                              <div className="title-details">
                                {visibleColumns.map(columnKey => {
                                  const column = AVAILABLE_COLUMNS[columnKey];
                                  const value = item[columnKey];
                                  
                                  if (!column || !value) return null;
                                  
                                  return (
                                    <div key={columnKey} className="detail">
                                      <span className="detail-label">{column.label}</span>
                                      <span className="detail-value">
                                        {column.type === 'financial' ? formatCurrency(value) : value}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="title-meta">
                                <span className="title-type">{item.type}</span>
                                <button 
                                  onClick={(e) => handleEditStart(item, e)}
                                  className="edit-button"
                                  title="Edit item"
                                >
                                  🫳
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </div>
      )}
      {activeTab === 'financial' && (
        <div>
          <button className="pptx-export-button" onClick={exportFinancialChartToPPTX} style={{ float: 'right', marginBottom: 16 }}>
            Export to PPTX
          </button>
          {/* Executive Summary */}
          {chartData.length > 1 && (() => {
            const revenueYoY = getYoYGrowth(chartData, 'revenue');
            const roiYoY = getYoYGrowth(chartData, 'roi');
            return (
              <div className="executive-summary">
                <span>
                  <strong>{chartData[chartData.length - 1].year} Revenue</strong> {revenueYoY >= 0 ? '▲' : '▼'}
                  <span style={{ color: revenueYoY >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 700 }}>
                    {Math.abs(revenueYoY).toFixed(1)}% YoY
                  </span>
                </span>
                <span style={{ marginLeft: 24 }}>
                  <strong>ROI</strong> {roiYoY >= 0 ? '▲' : '▼'}
                  <span style={{ color: roiYoY >= 0 ? '#27ae60' : '#e74c3c', fontWeight: 700 }}>
                    {Math.abs(roiYoY).toFixed(1)}% YoY
                  </span>
                </span>
              </div>
            );
          })()}
          {/* Financial Analytics Chart */}
          <div className="analytics-section">
            <div className="analytics-header">
              <h3 className="analytics-title">5-Year Financial Projection</h3>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: WBD_THEME.colors.primary }}></div>
                  <span>Revenue</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: WBD_THEME.colors.gold }}></div>
                  <span>Investment</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: WBD_THEME.colors.success }}></div>
                  <span>ROI %</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#8e44ad' }}></div>
                  <span>Revenue Moving Avg</span>
                </div>
              </div>
            </div>
            <div className="chart-container" ref={chartRef}>
              {ResponsiveContainer && ComposedChart ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={getMovingAverage(chartData, 'revenue', 2)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={WBD_THEME.colors.grayLight} opacity={0.3} />
                    <XAxis 
                      dataKey="year" 
                      stroke={WBD_THEME.colors.white}
                      fontSize={14}
                      fontFamily="Inter, sans-serif"
                    />
                    <YAxis 
                      yAxisId="financial"
                      stroke={WBD_THEME.colors.white}
                      fontSize={12}
                      fontFamily="Inter, sans-serif"
                    />
                    <YAxis 
                      yAxisId="roi"
                      orientation="right"
                      stroke={WBD_THEME.colors.success}
                      fontSize={12}
                      fontFamily="Inter, sans-serif"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: WBD_THEME.colors.dark,
                        border: `1px solid ${WBD_THEME.colors.gold}`,
                        borderRadius: '8px',
                        color: WBD_THEME.colors.white,
                        fontFamily: "Inter, sans-serif"
                      }}
                      formatter={(value, name, props) => {
                        if (name === 'roi') return [`${value.toFixed(1)}%`, 'ROI'];
                        if (name === 'revenue') {
                          const idx = props.payload && props.payload.year ? chartData.findIndex(d => d.year === props.payload.year) : -1;
                          let yoy = 0;
                          if (idx > 0) {
                            const prev = chartData[idx - 1].revenue;
                            yoy = prev ? ((value - prev) / prev) * 100 : 0;
                          }
                          return [`${value}M (${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}% YoY)`, 'Revenue'];
                        }
                        if (name === 'investment') return [`${value}M`, 'Investment'];
                        if (name === 'revenueMA') return [`${value.toFixed(1)}M`, 'Revenue MA'];
                        return [value, name];
                      }}
                    />
                    <Bar 
                      yAxisId="financial"
                      dataKey="investment" 
                      fill={WBD_THEME.colors.gold}
                      opacity={0.8}
                    />
                    <Bar 
                      yAxisId="financial"
                      dataKey="revenue" 
                      fill={WBD_THEME.colors.primary}
                      radius={[4, 4, 0, 0]}
                      opacity={0.9}
                    />
                    <Line 
                      yAxisId="roi"
                      type="monotone" 
                      dataKey="roi" 
                      stroke={WBD_THEME.colors.success}
                      strokeWidth={3}
                      dot={{ fill: WBD_THEME.colors.success, strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: WBD_THEME.colors.success, strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="financial"
                      type="monotone"
                      dataKey="revenueMA"
                      stroke="#8e44ad"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 4"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <SimpleChart data={chartData} />
              )}
            </div>
          </div>
          {/* --- Finance Pie Charts Section --- */}
          <div className="finance-pies-section" style={{ display: 'flex', gap: 32, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Budget Breakdown Pie */}
            <div className="finance-pie-card">
              <h4 className="finance-pie-title">Budget Breakdown</h4>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={[
                    { name: 'Production', value: filteredItems.reduce((sum, i) => sum + (i.productionBudget || 0), 0) },
                    { name: 'Marketing', value: filteredItems.reduce((sum, i) => sum + (i.marketingBudget || 0), 0) }
                  ]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={PieLabel} labelLine={false}>
                    <Cell key="prod" fill={WBD_THEME.colors.primary} />
                    <Cell key="mkt" fill={WBD_THEME.colors.gold} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Revenue by Genre Pie */}
            <div className="finance-pie-card">
              <h4 className="finance-pie-title">Revenue by Genre</h4>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={
                    Object.entries(filteredItems.reduce((acc, i) => {
                      if (!i.genre) return acc;
                      acc[i.genre] = (acc[i.genre] || 0) + (i.projectedRevenue || 0);
                      return acc;
                    }, {})).map(([genre, value]) => ({ name: genre, value }))
                  } dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={PieLabel} labelLine={false}>
                    {Object.entries(filteredItems.reduce((acc, i) => {
                      if (!i.genre) return acc;
                      acc[i.genre] = (acc[i.genre] || 0) + (i.projectedRevenue || 0);
                      return acc;
                    }, {})).map(([genre], idx) => (
                      <Cell key={genre} fill={GENRE_COLORS[idx % GENRE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Titles by Status Pie */}
            <div className="finance-pie-card">
              <h4 className="finance-pie-title">Titles by Status</h4>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={
                    Object.entries(filteredItems.reduce((acc, i) => {
                      if (!i.status) return acc;
                      acc[i.status] = (acc[i.status] || 0) + 1;
                      return acc;
                    }, {})).map(([status, value]) => ({ name: status, value }))
                  } dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={PieLabel} labelLine={false}>
                    {Object.entries(filteredItems.reduce((acc, i) => {
                      if (!i.status) return acc;
                      acc[i.status] = (acc[i.status] || 0) + 1;
                      return acc;
                    }, {})).map(([status], idx) => (
                      <Cell key={status} fill={WBD_THEME.colors.chartColors[idx % WBD_THEME.colors.chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'timeline' && (
        <div className="timeline-section">
          <div className="timeline-header">
            <h3>Release Timeline</h3>
            <p>Interactive horizontal timeline with genre color-coding</p>
          </div>
          {loading ? (
            <div className="wbd-loading"><div className="loading-spinner" /><div className="loading-text">Loading timeline...</div></div>
          ) : (
            <div className="timeline-placeholder">
              <p>Timeline view is temporarily disabled</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'customize' && (
        <div className="customize-section">
          <h3 className="section-title">Customize Dashboard</h3>
          
          <div className="customize-grid">
            {/* Theme Selection */}
            <div className="customize-card">
              <h4>Theme Mode</h4>
              <div className="theme-selector">
                <button 
                  className={`theme-option ${themeMode === 'regular' ? 'active' : ''}`}
                  onClick={() => {
                    setThemeMode('regular');
                    document.body.classList.remove('dark-mode', 'night-mode');
                  }}
                >
                  ☀️ Regular
                </button>
                <button 
                  className={`theme-option ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => {
                    setThemeMode('dark');
                    document.body.classList.remove('night-mode');
                    document.body.classList.add('dark-mode');
                  }}
                >
                  🌙 Dark
                </button>
                <button 
                  className={`theme-option ${themeMode === 'night' ? 'active' : ''}`}
                  onClick={() => {
                    setThemeMode('night');
                    document.body.classList.remove('dark-mode');
                    document.body.classList.add('night-mode');
                  }}
                >
                  🌌 Night
                </button>
              </div>
            </div>

            {/* Display Options */}
            <div className="customize-card">
              <h4>Display Options</h4>
              <div className="option-list">
                <label className="touch-checkbox">
                  <input 
                    type="checkbox" 
                    checked={showRevenue} 
                    onChange={(e) => setShowRevenue(e.target.checked)}
                  />
                  <span>Show Revenue Data</span>
                </label>
                <label className="touch-checkbox">
                  <input 
                    type="checkbox" 
                    checked={showInvestment} 
                    onChange={(e) => setShowInvestment(e.target.checked)}
                  />
                  <span>Show Investment Data</span>
                </label>
                <label className="touch-checkbox">
                  <input 
                    type="checkbox" 
                    checked={showTrends} 
                    onChange={(e) => setShowTrends(e.target.checked)}
                  />
                  <span>Show Trend Indicators</span>
                </label>
              </div>
            </div>

            {/* Year Range */}
            <div className="customize-card">
              <h4>Year Range</h4>
              <div className="year-range-selector">
                <button 
                  className="year-range-btn"
                  onClick={() => setYearRange([2024, 2025, 2026])}
                >
                  2024-2026
                </button>
                <button 
                  className="year-range-btn"
                  onClick={() => setYearRange([2024, 2025, 2026, 2027])}
                >
                  2024-2027
                </button>
                <button 
                  className="year-range-btn"
                  onClick={() => setYearRange([2025, 2026, 2027, 2028])}
                >
                  2025-2028
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update indicator */}
      {updating && (
        <div className="update-indicator">
          <div className="update-pulse"></div>
          <span>Syncing changes...</span>
        </div>
      )}

      {/* Modern Slide-out Customization Panel */}
      <div className={`customization-panel ${showCustomization ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>Customize Dashboard</h2>
          <button 
            className="panel-close"
            onClick={() => setShowCustomization(false)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              padding: '16px',
              color: 'var(--wbd-white)',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0)'}
          >
            ✕
          </button>
        </div>

        <div className="panel-content">
          {/* Theme Selection */}
          <div className="panel-section">
            <h3>Theme Mode</h3>
            <div className="theme-grid">
              <button 
                className={`theme-card ${themeMode === 'regular' ? 'active' : ''}`}
                onClick={() => {
                  setThemeMode('regular');
                  document.body.classList.remove('dark-mode', 'night-mode');
                }}
              >
                <div className="theme-preview regular-preview"></div>
                <span>☀️ Regular</span>
              </button>
              <button 
                className={`theme-card ${themeMode === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setThemeMode('dark');
                  document.body.classList.remove('night-mode');
                  document.body.classList.add('dark-mode');
                }}
              >
                <div className="theme-preview dark-preview"></div>
                <span>🌙 Dark</span>
              </button>
              <button 
                className={`theme-card ${themeMode === 'night' ? 'active' : ''}`}
                onClick={() => {
                  setThemeMode('night');
                  document.body.classList.remove('dark-mode');
                  document.body.classList.add('night-mode');
                }}
              >
                <div className="theme-preview night-preview"></div>
                <span>🌌 Night</span>
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div className="panel-section">
            <h3>Display Options</h3>
            <div className="toggle-list">
              <label className="toggle-item">
                <span>Show Revenue Data</span>
                <input 
                  type="checkbox" 
                  checked={showRevenue} 
                  onChange={(e) => setShowRevenue(e.target.checked)}
                  className="toggle-switch"
                />
              </label>
              <label className="toggle-item">
                <span>Show Investment Data</span>
                <input 
                  type="checkbox" 
                  checked={showInvestment} 
                  onChange={(e) => setShowInvestment(e.target.checked)}
                  className="toggle-switch"
                />
              </label>
              <label className="toggle-item">
                <span>Show Trend Indicators</span>
                <input 
                  type="checkbox" 
                  checked={showTrends} 
                  onChange={(e) => setShowTrends(e.target.checked)}
                  className="toggle-switch"
                />
              </label>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="panel-section">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button 
                className="action-button"
                onClick={() => {
                  setFilterStatus('All');
                  setFilterGenre('All');
                  setActiveTab('summary');
                  setShowCustomization(false);
                }}
              >
                🔄 Reset Filters
              </button>
              <button 
                className="action-button"
                onClick={() => {
                  exportToPPTX();
                  setShowCustomization(false);
                }}
              >
                📊 Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for panel */}
      {showCustomization && (
        <div 
          className="customization-overlay"
          onClick={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default WBDExecutiveSlateDashboard;