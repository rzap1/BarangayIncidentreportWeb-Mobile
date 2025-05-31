import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Assuming you have a CSS file for styling

const Navbar = ({ currentUser }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const location = useLocation();

  const navigationItems = [
    { path: '/Dashboard', label: 'Dashboard' },
    { path: '/incident-report', label: 'Incident Report' },
    { path: '/scheduling', label: 'Scheduling & Assessment' },
    { path: '/gis-mapping', label: 'GIS Mapping' },
    { path: '/patrol-logs', label: 'Patrol Logs' },
    { path: '/accounts', label: 'Accounts' },
  ];

  // Fetch user profile data including image
  useEffect(() => {
    const fetchUserProfile = async () => {
      const username = localStorage.getItem('username') || currentUser?.username;
      console.log('=== DEBUG INFO ===');
      console.log('localStorage username:', localStorage.getItem('username'));
      console.log('currentUser:', currentUser);
      console.log('Final username to fetch:', username);
      console.log('Stored userImage:', localStorage.getItem('userImage'));
      
      if (username) {
        try {
          const url = `http://192.168.125.28:3001/api/user/${username}`;
          console.log('Fetching from URL:', url);
          
          const response = await fetch(url);
          console.log('Response status:', response.status);
          
          if (response.ok) {
            const userData = await response.json();
            console.log('Fetched user data:', userData);
            setUserProfile(userData);
            
            // Store the IMAGE in localStorage if it exists and isn't already stored
            if (userData.IMAGE && !localStorage.getItem('userImage')) {
              localStorage.setItem('userImage', userData.IMAGE);
            }
          } else {
            const errorData = await response.text();
            console.error('Failed to fetch user profile. Status:', response.status);
            console.error('Error response:', errorData);
          }
        } catch (error) {
          console.error('Network error fetching user profile:', error);
        }
      } else {
        console.error('No username found for profile fetch');
        console.log('Available localStorage keys:', Object.keys(localStorage));
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.user-avatar-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userImage');
    
    // Optional: Clear all localStorage
    localStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login';
    setShowProfileDropdown(false);
  };

  const handleProfileClick = () => {
    alert('Profile feature coming soon');
    setShowProfileDropdown(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Function to get avatar source
  const getAvatarSrc = () => {
    // First, try to get from localStorage (faster)
    const storedImage = localStorage.getItem('userImage');
    if (storedImage && storedImage.trim() !== '') {
      console.log('Using stored image:', storedImage);
      return `http://192.168.125.28:3001/uploads/${storedImage}`;
    }
    
    // Then check if userProfile exists and has IMAGE field with actual value
    if (userProfile && userProfile.IMAGE && userProfile.IMAGE.trim() !== '') {
      console.log('Using profile image:', userProfile.IMAGE);
      return `http://192.168.125.28:3001/uploads/${userProfile.IMAGE}`;
    }
    
    console.log('No user image found, using placeholder');
    return "https://via.placeholder.com/32";
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <nav className="ml-6 flex space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    isActiveRoute(item.path)
                      ? 'border-indigo-500 text-indigo-600 hover:text-indigo-700'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center">
            <div className="user-avatar-container">
              <div className="avatar-wrapper" onClick={toggleProfileDropdown}>
                <img
                  className="avatar-image"
                  src={getAvatarSrc()}
                  alt="User avatar"
                  onError={(e) => {
                    console.log('Image failed to load, using placeholder');
                    // Fallback to placeholder if image fails to load
                    e.target.src = "https://via.placeholder.com/32";
                  }}
                />
                <div className="online-indicator"></div>
              </div>

              {showProfileDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-name">
                        {userProfile?.NAME || currentUser?.username || localStorage.getItem('username') || 'User'}
                      </div>
                      <div className="user-role">
                        {userProfile?.ROLE || currentUser?.role || localStorage.getItem('userRole') || 'Current User'}
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <span className="dropdown-icon">👤</span>
                    Profile
                  </button>
                  <button 
                    className="dropdown-item logout-item" 
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;