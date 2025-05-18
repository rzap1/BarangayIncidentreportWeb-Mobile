import React from 'react';
import './IncidentReport.css'; // optional
import './Dashboard.jsx';
import './Dashboard.css';

const messages = [
  { id: 1, msg: 'Reported Sunog', action: 'VIEW' },
  { id: 2, msg: 'Reported Suntukan sa highway', action: 'RESOLVED' },
  { id: 3, msg: 'Reported Banggaan ng Sasakyan', action: 'Tanod is On the way!' },
];

function IncidentReport() {
  return (
    <div className="incident-container">
      <h3>Message</h3>
      {messages.map((item) => (
        <div key={item.id} className="incident-row">
          <img src="/user-icon.png" alt="icon" className="incident-icon" />
          <span className="incident-message">{item.msg}</span>
          <span className="incident-time">{item.time}</span>
          <span className="incident-action">{item.action}</span>
        </div>
      ))}
    </div>
  );
}

export default IncidentReport;
