import React, { useEffect, useState } from 'react';
import mondaySdk from 'monday-sdk-js';
import "monday-ui-react-core/dist/main.css";
import { Button, Dropdown, Loader } from "monday-ui-react-core";

const monday = mondaySdk();

// Wrapper for Monday API calls with timeout and error handling
const mondayApiCall = async (query, timeoutMs = 10000) => {
  try {
    if (!monday || typeof monday.api !== 'function') {
      throw new Error('Monday SDK not available');
    }
    
    const apiPromise = monday.api(query);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Monday API timeout')), timeoutMs)
    );
    
    const result = await Promise.race([apiPromise, timeoutPromise]);
    
    // Check for service unavailable error
    if (result?.error_code === 'ServiceUnavailable' || 
        result?.error_message?.includes('service unavailable')) {
      throw new Error('Monday service unavailable');
    }
    
    return result;
  } catch (error) {
    console.error('Monday API call failed:', error);
    throw error;
  }
};

function TimelineSettingsPanel({ onSave, onCancel, initialSettings }) {
  const [columns, setColumns] = useState([]);
  const [selectedDateCol, setSelectedDateCol] = useState(initialSettings?.dateColId || '');
  const [selectedGenreCol, setSelectedGenreCol] = useState(initialSettings?.genreColId || '');
  const [selectedRevenueCol, setSelectedRevenueCol] = useState(initialSettings?.revenueColId || '');
  const [selectedTitleCol, setSelectedTitleCol] = useState(initialSettings?.titleColId || '');
  const [loading, setLoading] = useState(false);
  const [boardId, setBoardId] = useState(initialSettings?.boardId || '');

  // Fetch boardId from context on mount
  useEffect(() => {
    monday.get('context').then(res => {
      const contextBoardId = res.data?.boardId || (res.data?.boardIds && res.data.boardIds[0]);
      setBoardId(contextBoardId);
    });
  }, []);

  // Fetch columns when boardId is set
  useEffect(() => {
    if (!boardId) return;
    setLoading(true);
    mondayApiCall(`query { boards (ids: [${boardId}]) { columns { id title type } } }`).then(res => {
      setColumns(res.data.boards[0]?.columns || []);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch columns:', err);
      setLoading(false);
      // Still allow saving with empty columns
      setColumns([]);
    });
  }, [boardId]);

  const handleSave = () => {
    onSave && onSave({
      boardId,
      dateColId: selectedDateCol,
      genreColId: selectedGenreCol,
      revenueColId: selectedRevenueCol,
      titleColId: selectedTitleCol,
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 480, margin: '0 auto' }}>
      <h2>Timeline Settings</h2>
      <div style={{ marginBottom: 18 }}>
        <label>Date Column:</label>
        <Dropdown
          placeholder="Select date column"
          value={selectedDateCol}
          onChange={setSelectedDateCol}
          options={columns.filter(col => col.type === 'date').map(col => ({ label: col.title, value: col.id }))}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label>Genre Column:</label>
        <Dropdown
          placeholder="Select genre column"
          value={selectedGenreCol}
          onChange={setSelectedGenreCol}
          options={columns.map(col => ({ label: col.title, value: col.id }))}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label>Revenue Column:</label>
        <Dropdown
          placeholder="Select revenue column"
          value={selectedRevenueCol}
          onChange={setSelectedRevenueCol}
          options={columns.map(col => ({ label: col.title, value: col.id }))}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label>Title Column:</label>
        <Dropdown
          placeholder="Select title column"
          value={selectedTitleCol}
          onChange={setSelectedTitleCol}
          options={columns.map(col => ({ label: col.title, value: col.id }))}
        />
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <Button kind="primary" onClick={handleSave}>Save</Button>
        <Button kind="secondary" onClick={onCancel}>Cancel</Button>
      </div>
      {loading && <Loader size={32} color="primary" style={{ margin: '24px auto', display: 'block' }} />}
    </div>
  );
}

export default TimelineSettingsPanel; 