import React from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

// Helper: assign a color to each genre
const GENRE_COLORS = {
  Drama: '#d4af37', // gold
  'Sci-Fi': '#27ae60', // green
  Action: '#1a6dcc', // blue
  Comedy: '#e74c3c', // red
  Fantasy: '#8e44ad', // purple
  Adventure: '#f39c12', // orange
  Other: '#34495e', // dark gray
};
const getGenreColor = (genre) => GENRE_COLORS[genre] || GENRE_COLORS['Other'];

const VerticalTimelineWB = ({ items }) => (
  <VerticalTimeline animate={false}>
    {items.map((item) => (
      <VerticalTimelineElement
        key={item.id}
        date={item.year}
        contentStyle={{
          background: getGenreColor(item.genre),
          color: '#fff',
          borderRadius: '32px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '24px 32px',
        }}
        contentArrowStyle={{ borderRight: `7px solid ${getGenreColor(item.genre)}` }}
        iconStyle={{ background: getGenreColor(item.genre), color: '#fff' }}
      >
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2em' }}>{item.name}</h3>
        <h4 style={{ margin: '8px 0 0 0', fontWeight: 600, fontSize: '1em', opacity: 0.9 }}>{item.genre}</h4>
        <div style={{ marginTop: 8, fontWeight: 500, fontSize: '1em', opacity: 0.92 }}>
          ${item.productionBudget}M
        </div>
      </VerticalTimelineElement>
    ))}
  </VerticalTimeline>
);

export default VerticalTimelineWB; 