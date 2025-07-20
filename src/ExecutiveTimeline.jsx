import React, { useState, useMemo } from 'react';
import './executive-timeline.css';

// Sample date columns (replace with real Monday.com columns in production)
const SAMPLE_DATE_COLUMNS = [
  { key: 'releaseDate', label: 'Release Date' },
  { key: 'premiereDate', label: 'Premiere' },
  { key: 'wrapDate', label: 'Wrap Date' }
];

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

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function getTimeTicks(items, dateKey, zoomLevel) {
  // zoomLevel: 'year' | 'month' | 'day'
  const dates = items.map(i => parseDate(i[dateKey])).filter(Boolean);
  if (dates.length === 0) return [];
  const min = new Date(Math.min(...dates));
  const max = new Date(Math.max(...dates));
  let ticks = [];
  if (zoomLevel === 'year') {
    for (let y = min.getFullYear(); y <= max.getFullYear(); y++) {
      ticks.push({ label: y.toString(), value: new Date(y, 0, 1) });
    }
  } else if (zoomLevel === 'month') {
    let d = new Date(min.getFullYear(), min.getMonth(), 1);
    while (d <= max) {
      ticks.push({ label: d.toLocaleString('default', { month: 'short', year: 'numeric' }), value: new Date(d) });
      d.setMonth(d.getMonth() + 1);
    }
  } else if (zoomLevel === 'day') {
    let d = new Date(min.getFullYear(), min.getMonth(), min.getDate());
    while (d <= max) {
      ticks.push({ label: d.toLocaleDateString(), value: new Date(d) });
      d.setDate(d.getDate() + 1);
    }
  }
  return ticks;
}

const ExecutiveTimeline = ({ items = [], dateColumns = SAMPLE_DATE_COLUMNS }) => {
  const [zoom, setZoom] = useState(1);
  const [zoomLevel, setZoomLevel] = useState('year'); // 'year' | 'month' | 'day'
  const [selectedDateKey, setSelectedDateKey] = useState(dateColumns[0]?.key || 'releaseDate');

  // Adjust zoom level based on zoom value
  React.useEffect(() => {
    if (zoom <= 0.9) setZoomLevel('year');
    else if (zoom <= 1.4) setZoomLevel('month');
    else setZoomLevel('day');
  }, [zoom]);

  // Get ticks for the current zoom level
  const ticks = useMemo(() => getTimeTicks(items, selectedDateKey, zoomLevel), [items, selectedDateKey, zoomLevel]);

  // Get unique genres
  const genresList = useMemo(() => Array.from(new Set(items.map(item => item.genre || 'Other'))), [items]);

  // Map items to their date and genre
  const genreItems = useMemo(() => {
    const map = {};
    genresList.forEach(genre => { map[genre] = []; });
    items.forEach(item => {
      const genre = item.genre || 'Other';
      const date = parseDate(item[selectedDateKey]);
      if (genre && date) map[genre].push({ ...item, _date: date });
    });
    return map;
  }, [items, genresList, selectedDateKey]);

  // Calculate pill position (as a percentage between min/max date)
  const minDate = ticks[0]?.value;
  const maxDate = ticks[ticks.length - 1]?.value;
  function getPillPosition(date) {
    if (!minDate || !maxDate) return 0;
    const total = maxDate.getTime() - minDate.getTime();
    const pos = date.getTime() - minDate.getTime();
    return (pos / total) * 100;
  }

  return (
    <div className="exec-timeline-outer">
      {/* Date column selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, marginLeft: 24 }}>
        <label htmlFor="date-col-select" style={{ fontWeight: 700, color: '#ffd700', fontSize: '1.1em' }}>Date Column:</label>
        <select
          id="date-col-select"
          value={selectedDateKey}
          onChange={e => setSelectedDateKey(e.target.value)}
          style={{ fontSize: '1.1em', padding: '6px 18px', borderRadius: 8, border: '1.5px solid #ffd700', background: '#181f2a', color: '#ffd700', fontWeight: 700 }}
        >
          {dateColumns.map(col => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
      </div>
      {/* Zoom controls */}
      <div className="exec-timeline-zoom-controls">
        <button className="timeline-zoom-btn" onClick={() => setZoom(z => Math.max(0.7, z - 0.2))}>-</button>
        <span className="zoom-level-indicator">Zoom: {zoom.toFixed(1)}x ({zoomLevel})</span>
        <button className="timeline-zoom-btn" onClick={() => setZoom(z => Math.min(2, z + 0.2))}>+</button>
      </div>
      <div className="exec-timeline-container" style={{ position: 'relative' }}>
        {/* Timeline axis */}
        <div style={{ display: 'flex', position: 'relative', width: '100%', marginBottom: 12, marginLeft: 120 }}>
          {ticks.map((tick, idx) => (
            <div key={tick.label} style={{ flex: 1, textAlign: 'center', color: '#ffd700', fontWeight: 900, fontSize: `${1.18 * zoom}em`, letterSpacing: '0.01em' }}>{tick.label}</div>
          ))}
        </div>
        {/* Genre swim lanes */}
        <div style={{ position: 'relative', width: '100%' }}>
          {genresList.map((genre, gIdx) => (
            <div key={genre} style={{ position: 'relative', minHeight: 110 * zoom, marginBottom: 0 }}>
              {/* Swim lane line */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 0, borderBottom: '2.5px solid #ffd700', zIndex: 0 }} />
              {/* Genre label */}
              <div className="exec-timeline-genre-label" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 120, display: 'flex', alignItems: 'center', color: getGenreColor(genre), fontWeight: 800, fontSize: '1.1em', paddingLeft: 12, zIndex: 2, background: 'rgba(24,31,42,0.92)' }}>{genre}</div>
              {/* Pills */}
              <div style={{ position: 'relative', marginLeft: 120, minHeight: 110 * zoom, height: 110 * zoom, display: 'flex', alignItems: 'center', width: 'calc(100% - 120px)' }}>
                {genreItems[genre].map(item => (
                  <div
                    key={item.id}
                    className="exec-timeline-pill"
                    style={{
                      background: getGenreColor(genre),
                      boxShadow: '0 0 0 8px ' + getGenreColor(genre) + '33, 0 4px 18px rgba(0,0,0,0.13)',
                      minWidth: 120 * zoom,
                      maxWidth: 320 * zoom,
                      padding: `${22 * zoom}px ${40 * zoom}px`,
                      fontSize: `${1.1 * zoom}rem`,
                      position: 'absolute',
                      left: `${getPillPosition(item._date)}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 2
                    }}
                    tabIndex={0}
                    title={item.name}
                  >
                    <div className="pill-title" style={{ fontSize: `${1.32 * zoom}em` }}>{item.name}</div>
                    <div className="pill-genre" style={{ fontSize: `${1.08 * zoom}em` }}>{genre}</div>
                    <div className="pill-budget" style={{ fontSize: `${1.08 * zoom}em` }}>${item.productionBudget}M</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveTimeline; 