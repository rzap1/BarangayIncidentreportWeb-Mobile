import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Incident_Report.css";

const Incident_Report = () => {
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
  fetch("http://localhost:3001/api/incidents") // Fetch data from the backend API
    .then((res) => res.json())
    .then((data) => {
      console.log(data); // Check the fetched data
      setReports(data); // Assuming the backend sends name and description
    })
    .catch((err) => {
      console.error("Failed to fetch incidents:", err);
      setReports([]); // Fallback to empty array if there's an error
    });
}, []);


  const handleBackClick = () => {
    navigate("/dashboard");
  };

  return (
    <div className="incident-container">
      <div className="incident-header">
        <FaArrowLeft className="back-icon" onClick={handleBackClick} />
        <h2>Incident Report</h2>
        <span className="mark-read">Mark all Read</span>
      </div>

      <div className="incident-list">
        {reports.length === 0 ? (
          <p className="no-data">No reports found.</p>
        ) : (
          reports.map((report, index) => (
            <div key={index} className="incident-item">
              {report.NAME} sent a report of {report.Incident_Report}
            </div>
          ))
        )}
      </div>

      <div className="incident-footer">
        <button className="delete-btn">Delete</button>
      </div>
    </div>
  );
};

export default Incident_Report;
