import React from 'react';
import Timeline from 'react-calendar-timeline';
import './calendar-timeline.css';
import moment from 'moment';

const groups = [
  { id: 1, title: 'Test Group' }
];

const items = [
  {
    id: 1,
    group: 1,
    title: 'Test Item',
    start_time: moment().startOf('day'),
    end_time: moment().startOf('day').add(1, 'day'),
    itemProps: {
      style: {
        background: '#1a6dcc',
        color: '#fff',
        borderRadius: 32,
        fontWeight: 700,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '12px 20px',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        maxWidth: 320,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      },
    },
    content: (
      <div>
        <div style={{ fontWeight: 800, fontSize: '1.1em' }}>Test Item</div>
        <div style={{ fontWeight: 600, fontSize: '0.95em', opacity: 0.9 }}>Test Group</div>
        <div style={{ fontWeight: 500, fontSize: '0.95em', opacity: 0.92 }}>$100M</div>
      </div>
    ),
  }
];

const defaultTimeStart = moment().startOf('day').subtract(1, 'month');
const defaultTimeEnd = moment().startOf('day').add(1, 'month');

const CalendarTimeline = () => {
  return (
    <Timeline
      style={{ height: 600 }}
      groups={groups}
      items={items}
      defaultTimeStart={defaultTimeStart}
      defaultTimeEnd={defaultTimeEnd}
      lineHeight={80}
      itemHeightRatio={0.85}
      canMove={false}
      canResize={false}
      stackItems={false}
      sidebarWidth={120}
      itemRenderer={({ item }) => item.content}
    />
  );
};

export default CalendarTimeline; 