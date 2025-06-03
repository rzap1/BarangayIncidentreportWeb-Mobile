import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

// Profile Modal Component (keeping the same as before)
const UserProfileModal = ({ isOpen, onClose, userProfile, onSave }) => {
  const [formData, setFormData] = useState({
    image: '',
    imageFile: null,
    fullName: userProfile?.NAME || '',
    username: userProfile?.USERNAME || localStorage.getItem('username') || '',
    password: '',
    address: userProfile?.ADDRESS || '',
    email: userProfile?.EMAIL || ''
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        image: userProfile.IMAGE ? `http://192.168.125.28:3001/uploads/${userProfile.IMAGE}` : '',
        imageFile: null,
        fullName: userProfile.NAME || '',
        username: userProfile.USERNAME || localStorage.getItem('username') || '',
        password: '',
        address: userProfile.ADDRESS || '',
        email: userProfile.EMAIL || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          image: e.target.result,
          imageFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    console.log('Saving profile data:', formData);
    
    const username = localStorage.getItem('username');
    if (!username) {
      alert('Error: No username found. Please log in again.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      const originalData = {
        name: userProfile?.NAME || '',
        username: userProfile?.USERNAME || '',
        address: userProfile?.ADDRESS || '',
        email: userProfile?.EMAIL || ''
      };

      if (formData.fullName.trim() && formData.fullName.trim() !== originalData.name) {
        formDataToSend.append('name', formData.fullName.trim());
      }
      
      if (formData.username.trim() && formData.username.trim() !== originalData.username) {
        formDataToSend.append('username', formData.username.trim());
      }
      
      if (formData.password.trim()) {
        formDataToSend.append('password', formData.password.trim());
      }
      
      if (formData.address.trim() && formData.address.trim() !== originalData.address) {
        formDataToSend.append('address', formData.address.trim());
      }
      
      if (formData.email.trim() && formData.email.trim() !== originalData.email) {
        formDataToSend.append('email', formData.email.trim());
      }
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const hasChanges = Array.from(formDataToSend.keys()).length > 0;
      if (!hasChanges) {
        alert('No changes detected.');
        onClose();
        return;
      }

      console.log('FormData to send:', Array.from(formDataToSend.entries()));

      const response = await fetch(`http://192.168.125.28:3001/api/user/${username}`, {
        method: 'PUT',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Profile updated successfully:', result);
        
        if (formData.username.trim() && formData.username.trim() !== originalData.username) {
          localStorage.setItem('username', formData.username.trim());
        }
        
        if (result.image) {
          localStorage.setItem('userImage', result.image);
        }
        
        if (onSave) {
          onSave();
        }
        
        alert('Profile updated successfully!');
        onClose();
      } else {
        console.error('Failed to update profile:', result);
        alert(result.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">User Profile</h2>
          <button 
            onClick={onClose}
            className="modal-close-btn"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="modal">
          <div className="modal-form">
            <div className="image-upload-section">
              <div className="image-preview-container">
                <div className="image-preview">
                  {formData.image ? (
                    <img 
                      src={formData.image} 
                      alt="Profile" 
                      className="profile-image"
                    />
                  ) : (
                    <svg className="default-avatar-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <label htmlFor="image-upload" className="upload-label">
                  Change Picture
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="field-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter full name (leave empty to keep current)"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter username (leave empty to keep current)"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter new password (leave blank to keep current)"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows="3"
                className="form-textarea"
                placeholder="Enter address (leave empty to keep current)"
              />
            </div>

            <div className="form-field">
              <label className="field-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter email address (leave empty to keep current)"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={onClose}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="save-btn"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Navbar = ({ currentUser }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [newIncidentCount, setNewIncidentCount] = useState(0);
  const location = useLocation();

  // Alert system state and refs
  const previousIncidentsCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  const navigationItems = [
    { path: '/incident-report', label: 'Incident Report' },
    { path: '/scheduling', label: 'Scheduling & Assessment' },
    { path: '/gis-mapping', label: 'GIS Mapping' },
    { path: '/patrol-logs', label: 'Patrol Logs' },
    { path: '/accounts', label: 'Accounts' },
  ];

  // Emergency alert sound function - CENTRALIZED HERE
  const playAlertSound = async () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const createUrgentBeep = (frequency, startTime, duration, volume = 0.5) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      
      // 🚨 EMERGENCY ALERT PATTERN 🚨
      createUrgentBeep(1200, now, 0.1);        // High beep 1
      createUrgentBeep(1200, now + 0.15, 0.1); // High beep 2  
      createUrgentBeep(1200, now + 0.3, 0.1);  // High beep 3
      
      createUrgentBeep(700, now + 0.6, 0.3);   // Lower warning tone
      
      createUrgentBeep(1200, now + 1.0, 0.1);  // High beep 4
      createUrgentBeep(1200, now + 1.15, 0.1); // High beep 5
      createUrgentBeep(1200, now + 1.3, 0.1);  // High beep 6
      
      console.log('🚨 EMERGENCY INCIDENT ALERT PLAYED 🚨');
      
      // Browser notification as backup
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 NEW INCIDENT ALERT', {
          body: 'Emergency: New incident report requires immediate attention!',
          icon: '🚨',
          tag: 'emergency-incident',
          requireInteraction: true,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.warn('Could not play emergency alert:', error);
      
      // Fallback: Browser notification only
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 NEW INCIDENT ALERT', {
          body: 'New incident report requires attention (audio failed)',
          icon: '🚨',
          tag: 'emergency-incident'
        });
      }
      
      // Visual fallback
      const originalTitle = document.title;
      document.title = '🚨 EMERGENCY INCIDENT!';
      setTimeout(() => {
        document.title = originalTitle;
      }, 5000);
    }
  };

  // Monitor incidents for new alerts - CENTRALIZED HERE
  useEffect(() => {
    // Request notification permission on component mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const monitorIncidents = () => {
      fetch("http://192.168.125.28:3001/api/incidents")
        .then(res => res.json())
        .then(data => {
          const currentCount = data.length;
          
          // Check if there are new incidents (only after initial load)
          if (!isInitialLoadRef.current && currentCount > previousIncidentsCountRef.current) {
            const newIncidentsCount = currentCount - previousIncidentsCountRef.current;
            console.log(`${newIncidentsCount} new incident(s) detected!`);
            
            // Update notification badge
            setNewIncidentCount(prev => prev + newIncidentsCount);
            
            // Play alert sound - THIS WILL NOW WORK FROM ANY PAGE
            playAlertSound();
          }
          
          // Update the previous count
          previousIncidentsCountRef.current = currentCount;
          
          // Mark that initial load is complete
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }
        })
        .catch(err => {
          console.error("Failed to fetch incidents:", err);
        });
    };

    // Initial fetch
    monitorIncidents();

    // Set interval for auto-refresh (every 3 seconds)
    const intervalId = setInterval(monitorIncidents, 3000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Clear notification count when visiting incident report page
  useEffect(() => {
    if (location.pathname === '/incident-report' && newIncidentCount > 0) {
      // Clear the notification count after a short delay to allow page load
      const timeoutId = setTimeout(() => {
        setNewIncidentCount(0);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, newIncidentCount]);

  // Fetch user profile data including image
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

  useEffect(() => {
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
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userImage');
    localStorage.clear();
    
    window.location.href = '/login';
    setShowProfileDropdown(false);
  };

  const handleProfileClick = () => {
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleProfileSave = () => {
    fetchUserProfile();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const getAvatarSrc = () => {
    const storedImage = localStorage.getItem('userImage');
    if (storedImage && storedImage.trim() !== '') {
      console.log('Using stored image:', storedImage);
      return `http://192.168.125.28:3001/uploads/${storedImage}`;
    }
    
    if (userProfile && userProfile.IMAGE && userProfile.IMAGE.trim() !== '') {
      console.log('Using profile image:', userProfile.IMAGE);
      return `http://192.168.125.28:3001/uploads/${userProfile.IMAGE}`;
    }
    
    console.log('No user image found, using placeholder');
    return "https://via.placeholder.com/32";
  };

  return (
    <>
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
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium relative`}
                  >
                    {item.label}
                    {/* Show notification badge on Incident Report link */}
                    {item.path === '/incident-report' && newIncidentCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full animate-pulse">
                        {newIncidentCount > 99 ? '99+' : newIncidentCount}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center">
              {/* Alert indicator */}
              {newIncidentCount > 0 && (
                <div className="mr-4 flex items-center space-x-2 text-red-600 animate-pulse">
                  <span className="text-lg">🚨</span>
                  <span className="text-sm font-medium">
                    {newIncidentCount} New Alert{newIncidentCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              <div className="user-avatar-container">
                <div className="avatar-wrapper" onClick={toggleProfileDropdown}>
                  <img
                    className="avatar-image"
                    src={getAvatarSrc()}
                    alt="User avatar"
                    onError={(e) => {
                      console.log('Image failed to load, using placeholder');
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

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile}
        onSave={handleProfileSave}
      />
    </>
  );
};

export default Navbar;