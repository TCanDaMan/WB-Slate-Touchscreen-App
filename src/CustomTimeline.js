import React, { useEffect, useState, useRef } from 'react';
import mondaySdk from 'monday-sdk-js';
import './custom-timeline.css';
import TimelineSettingsPanel from './TimelineSettingsPanel';

const monday = mondaySdk();

// Mock genres and colors
const GENRE_COLORS = {
  Action: '#4F8EF7',
  Comedy: '#F7B32B',
  Drama: '#E4572E',
  SciFi: '#76B041',
  Romance: '#B857F8',
};

// Mock data for demonstration
const MOCK_TITLES = [
  { id: 1, title: 'Movie Alpha', genre: 'Action', revenue: '$100M', date: '2024-06-01' },
  { id: 2, title: 'Movie Beta', genre: 'Comedy', revenue: '$80M', date: '2024-06-10' },
  { id: 3, title: 'Movie Gamma', genre: 'Drama', revenue: '$120M', date: '2024-07-05' },
  { id: 4, title: 'Movie Delta', genre: 'SciFi', revenue: '$90M', date: '2024-08-15' },
  { id: 5, title: 'Movie Epsilon', genre: 'Romance', revenue: '$60M', date: '2024-09-01' },
];

// Helper: parse date string to Date object
function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function getTimeTicks(start, end, zoomLevel) {
  if (!start || !end) return [];
  const ticks = [];
  if (zoomLevel === 'year') {
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
      ticks.push(new Date(y, 0, 1));
    }
  } else if (zoomLevel === 'month') {
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      ticks.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }
  } else if (zoomLevel === 'day') {
    let d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (d <= end) {
      ticks.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
  }
  return ticks;
}

function getDayTicks(start, end) {
  // Only show 1st and 15th of each month
  if (!start || !end) return [];
  const ticks = [];
  let d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    // 1st
    ticks.push({ date: new Date(d), label: d.getDate().toString() });
    // 15th
    let fifteenth = new Date(d.getFullYear(), d.getMonth(), 15);
    if (fifteenth >= start && fifteenth <= end) {
      ticks.push({ date: fifteenth, label: '15' });
    }
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

function getMonthTicks(start, end) {
  if (!start || !end) return [];
  const ticks = [];
  let d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    ticks.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

function CustomTimeline({ items: propItems, settings, loading }) {
  // Use real items if provided, otherwise fallback to mock data (for local dev)
  const isLocal = !window?.monday || window.location.hostname === 'localhost';
  const items = (propItems && propItems.length > 0) ? propItems : (isLocal ? MOCK_TITLES : []);

  // Extract column IDs from settings
  const dateColId = settings?.dateColId || 'date';
  const genreColId = settings?.genreColId || 'genre';
  const revenueColId = settings?.revenueColId || 'revenue';
  const titleColId = settings?.titleColId || 'title';

  // Map items to timeline pill structure
  const titles = items.map(item => ({
    id: item.id,
    title: item[titleColId] || item.name || '',
    genre: item[genreColId] || 'Other',
    revenue: item[revenueColId] ? `$${item[revenueColId]}` : '',
    date: item[dateColId] || '',
  }));

  // Debug logs for timeline data
  console.log('Timeline titles:', titles);

  // All hooks at the top
  const [zoom, setZoom] = useState(1); // 0.7 (year) to 2 (day)
  const [zoomLevel, setZoomLevel] = useState('month'); // 'year', 'month', 'day'
  const [settingsMode, setSettingsMode] = useState(false);
  const containerRef = useRef();

  // Listen for settings/context mode from Monday
  useEffect(() => {
    monday.listen('context', res => {
      if (res.data?.viewMode === 'settings') setSettingsMode(true);
      else setSettingsMode(false);
    });
    monday.listen('settings', res => {
      if (res.data?.isSettingsMode) setSettingsMode(true);
      else setSettingsMode(false);
    });
  }, []);

  // Adjust zoom level based on zoom value
  useEffect(() => {
    if (zoom <= 0.9) setZoomLevel('year');
    else if (zoom <= 1.4) setZoomLevel('month');
    else setZoomLevel('day');
  }, [zoom]);

  // Mouse wheel zoom handler
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref) return;
    const onWheel = (e) => {
      if (e.ctrlKey) return; // let browser handle pinch-zoom
      if (e.deltaY < 0) setZoom(z => Math.min(2, z + 0.1));
      else if (e.deltaY > 0) setZoom(z => Math.max(0.7, z - 0.1));
      e.preventDefault();
    };
    ref.addEventListener('wheel', onWheel, { passive: false });
    return () => ref.removeEventListener('wheel', onWheel);
  }, []);

  // Handle save from settings panel
  const handleSettingsSave = (newSettings) => {
    monday.setSettings(newSettings);
    setSettingsMode(false);
  };
  const handleSettingsCancel = () => {
    setSettingsMode(false);
  };

  // Conditional rendering comes after all hooks
  if (settingsMode) {
    return <TimelineSettingsPanel onSave={handleSettingsSave} onCancel={handleSettingsCancel} initialSettings={settings} />;
  }
  if (!settings) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#FFD700', fontWeight: 700 }}>Please configure the timeline widget settings.</div>;
  }

  // TODO: Use settings to fetch real data from Monday
  // For now, just show a summary of the selected settings

  // Get all dates
  const allDates = titles.map(t => parseDate(t.date)).filter(Boolean);
  const minDate = allDates.length ? new Date(Math.min(...allDates)) : null;
  const maxDate = allDates.length ? new Date(Math.max(...allDates)) : null;

  // Debug logs for date range
  console.log('Timeline minDate:', minDate, 'maxDate:', maxDate);

  // Dynamic ticks
  const ticks = getTimeTicks(minDate, maxDate, zoomLevel);
  const dayTicks = zoomLevel === 'day' ? getDayTicks(minDate, maxDate) : [];
  const monthTicks = zoomLevel === 'day' ? getMonthTicks(minDate, maxDate) : [];

  // Group titles by genre for swimlanes
  const genres = Array.from(new Set(titles.map(t => t.genre)));
  const titlesByGenre = genres.reduce((acc, genre) => {
    acc[genre] = titles.filter(t => t.genre === genre);
    return acc;
  }, {});

  // Timeline width scales with zoom
  const BASE_TIMELINE_WIDTH = 1200; // px at 1x zoom
  const timelineWidth = BASE_TIMELINE_WIDTH * zoom;

  // Calculate pill position in px based on timeline width
  function getPillPositionPx(date) {
    if (!minDate || !maxDate || !date) return timelineWidth / 2; // Center if missing
    const total = maxDate.getTime() - minDate.getTime();
    if (total === 0) return timelineWidth / 2; // Center if all dates are the same
    const pos = date.getTime() - minDate.getTime();
    return (pos / total) * timelineWidth;
  }

  // Axis label color for dark/light mode
  const axisLabelStyle = {
    color: 'var(--timeline-axis-label, #222)',
    background: 'var(--timeline-axis-bg, #fff)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  };

  return (
    <div
      className="timeline-container wb-timeline-bg"
      ref={containerRef}
      tabIndex={0}
      style={{
        '--timeline-axis-label': 'var(--wbd-gold)',
        '--timeline-axis-bg': 'rgba(24,31,42,0.92)',
        '--timeline-bg': 'rgba(24,31,42,0.60)',
        '--timeline-bg-light': 'rgba(255,255,255,0.60)',
        '--timeline-border': 'rgba(255,255,255,0.08)',
        '--timeline-border-dark': 'rgba(24,31,42,0.18)',
      }}
    >
      {/* Month labels above days (only in day zoom) */}
      {zoomLevel === 'day' && (
        <div className="timeline-month-labels" style={{ width: timelineWidth, minWidth: 600, margin: '0 auto 0 auto' }}>
          {monthTicks.map((tick, idx) => (
            <div
              key={tick.toISOString()}
              className="timeline-month-label"
              style={{
                left: `${((tick.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100}%`,
              }}
            >
              {tick.toLocaleString('default', { month: 'short', year: '2-digit' })}
            </div>
          ))}
        </div>
      )}
      {/* Time axis */}
      <div className="timeline-axis" style={{ width: timelineWidth, minWidth: 600, margin: '0 auto 32px auto' }}>
        {zoomLevel === 'day'
          ? dayTicks.map((tick, idx) => (
              <div
                key={tick.date.toISOString() + tick.label}
                className="timeline-axis-tick timeline-axis-tick-day"
                style={{
                  left: `${((tick.date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100}%`,
                  ...axisLabelStyle,
                  minWidth: 24,
                  maxWidth: 32,
                  fontSize: '0.95em',
                  opacity: tick.label === '1' || tick.label === '15' || idx === dayTicks.length - 1 ? 0.8 : 0.5,
                  fontWeight: 600,
                  background: 'transparent',
                  color: 'var(--timeline-axis-label, #ffd700)',
                  boxShadow: 'none',
                  border: 'none',
                  padding: 0,
                  textAlign: 'center',
                }}
              >
                {tick.label}
              </div>
            ))
          : ticks.map((tick, idx) => (
              <div
                key={tick.toISOString()}
                className="timeline-axis-tick"
                style={{
                  left: `${((tick.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * 100}%`,
                  ...axisLabelStyle,
                  minWidth: 60,
                  maxWidth: 120,
                  textAlign: 'center',
                }}
              >
                {zoomLevel === 'year' && tick.getFullYear()}
                {zoomLevel === 'month' && tick.toLocaleString('default', { month: 'short', year: '2-digit' })}
              </div>
            ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 18px 8%' }}>
        <button className="timeline-zoom-btn" onClick={() => setZoom(z => Math.max(0.7, z - 0.1))}>-</button>
        <span className="zoom-level-indicator">Zoom: {zoom.toFixed(1)}x ({zoomLevel})</span>
        <button className="timeline-zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
      </div>
      <div className="timeline-swimlanes" style={{ overflowX: 'auto', width: '100%' }}>
        {genres.map(genre => (
          <div className="timeline-swimlane" key={genre}>
            <div className="swimlane-label">{genre}</div>
            <div className="swimlane-pills timeline-swimlane-track" style={{ width: timelineWidth, minWidth: 600, position: 'relative', margin: '0 auto' }}>
              {titlesByGenre[genre].map(title => {
                const date = parseDate(title.date);
                const leftPx = getPillPositionPx(date);
                // Debug log for each pill
                console.log('Pill:', title.title, 'Date:', title.date, 'LeftPx:', leftPx);
                return (
                  <div
                    className="timeline-pill"
                    key={title.id}
                    style={{
                      background: GENRE_COLORS[genre] || '#ccc',
                      boxShadow: `0 0 0 4px rgba(0,0,0,0.08), 0 0 12px 2px ${GENRE_COLORS[genre] || '#ccc'}33`,
                      position: 'absolute',
                      left: leftPx,
                      top: 0,
                      transform: 'translate(-50%, 0)',
                      zIndex: 2
                    }}
                  >
                    <div className="pill-title">{title.title}</div>
                    <div className="pill-genre">{title.genre}</div>
                    <div className="pill-revenue">{title.revenue}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {/* TODO: Add zoom controls and grouping logic */}
    </div>
  );
}

export default CustomTimeline; 