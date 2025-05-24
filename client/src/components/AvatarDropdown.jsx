import React, { useState, useEffect } from 'react';
import './AvatarDropdown.css';

const UserAvatarDropdown = ({ currentUser, onLogout }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-avatar-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    alert('Profile feature coming soon');
    setShowProfileDropdown(false);
  };

  const handleLogoutClick = () => {
    onLogout();
    setShowProfileDropdown(false);
  };

  return (
    <div className="user-avatar-container">
      <div className="avatar-wrapper" onClick={toggleProfileDropdown}>
        <img
          className="avatar-image"
          src={currentUser && currentUser.IMAGE 
            ? `http://192.168.164.28:3001/uploads/${currentUser.IMAGE}` 
            : "/api/placeholder/150/150"
          }
          alt="User avatar"
        />
        <span className="online-indicator"></span>
      </div>
      
      {showProfileDropdown && (
        <div className="user-dropdown">
        
          <div className="dropdown-divider"></div>
          <button className="dropdown-item" onClick={handleProfileClick}>
            <span className="dropdown-icon">👤</span>
            Profile
          </button>
          <button className="dropdown-item logout-item" onClick={handleLogoutClick}>
            <span className="dropdown-icon">🚪</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatarDropdown;