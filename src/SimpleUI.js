// Lightweight replacements for Monday UI components
import React from 'react';

export const Loader = ({ size = 32, color = 'primary' }) => (
  <div className="simple-loader" style={{ fontSize: size }}>
    <div className="loader-spinner" />
  </div>
);

export const Box = ({ children, className, style, ...props }) => (
  <div className={className} style={style} {...props}>
    {children}
  </div>
);

export const Button = ({ children, kind = 'primary', onClick, style, ...props }) => (
  <button 
    className={kind === 'primary' ? 'primary-button' : 'secondary-button'}
    onClick={onClick}
    style={style}
    {...props}
  >
    {children}
  </button>
);

export const IconButton = ({ iconName, onClick, title }) => (
  <button className="icon-button" onClick={onClick} title={title}>
    {iconName === 'sun' ? '☀️' : iconName === 'moon' ? '🌙' : '⚙️'}
  </button>
);

export const Dropdown = ({ placeholder, value, onChange, options, className }) => (
  <select 
    value={value} 
    onChange={(e) => onChange(e.target.value)} 
    className={className || 'monday-style-dropdown'}
  >
    <option value="All">{placeholder || 'All'}</option>
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

export const Dialog = ({ children }) => children;