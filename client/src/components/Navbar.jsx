import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Assuming you have a CSS file for styling

// Profile Modal Component
const UserProfileModal = ({ isOpen, onClose, userProfile, onSave }) => {
  const [formData, setFormData] = useState({
    image: '',
    imageFile: null, // Store the actual file for upload
    fullName: userProfile?.NAME || '',
    username: userProfile?.USERNAME || localStorage.getItem('username') || '',
    password: '',
    address: userProfile?.ADDRESS || '',
    email: userProfile?.EMAIL || ''
  });

  // Update form data when userProfile changes
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
      // Create FormData for multipart form submission (to handle image upload)
      const formDataToSend = new FormData();
      
      // Only add fields that have values and are different from original
      const originalData = {
        name: userProfile?.NAME || '',
        username: userProfile?.USERNAME || '',
        address: userProfile?.ADDRESS || '',
        email: userProfile?.EMAIL || ''
      };

      // Check and add only changed fields
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
      
      // Add image if selected
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      // Check if there's anything to update
      const hasChanges = Array.from(formDataToSend.keys()).length > 0;
      if (!hasChanges) {
        alert('No changes detected.');
        onClose();
        return;
      }

      console.log('FormData to send:', Array.from(formDataToSend.entries()));

      const response = await fetch(`http://192.168.125.28:3001/api/user/${username}`, {
        method: 'PUT',
        body: formDataToSend, // Don't set Content-Type header for FormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Profile updated successfully:', result);
        
        // Update localStorage if username changed
        if (formData.username.trim() && formData.username.trim() !== originalData.username) {
          localStorage.setItem('username', formData.username.trim());
        }
        
        // Update userImage in localStorage if image was updated
        if (result.image) {
          localStorage.setItem('userImage', result.image);
        }
        
        // Call the onSave callback to refresh the parent component
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
    // Close modal only if clicking on the backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
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
        {/* Blue Header */}
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

        {/* Modal Content */}
        <div className="modal">
          <div className="modal-form">
            {/* Image Upload Section */}
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

            {/* Form Fields */}
            <div className="form-field">
              <label className="field-label">
                Full Name
              </label>
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
              <label className="field-label">
                Username
              </label>
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
              <label className="field-label">
                Password
              </label>
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
              <label className="field-label">
                Address
              </label>
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
              <label className="field-label">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter email address (leave empty to keep current)"
              />
            </div>

            {/* Action Buttons */}
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
  const location = useLocation();

  const navigationItems = [
    { path: '/incident-report', label: 'Incident Report' },
    { path: '/scheduling', label: 'Scheduling & Assessment' },
    { path: '/gis-mapping', label: 'GIS Mapping' },
    { path: '/patrol-logs', label: 'Patrol Logs' },
    { path: '/accounts', label: 'Accounts' },
  ];

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
    setShowProfileModal(true);
    setShowProfileDropdown(false);
  };

  const handleProfileSave = () => {
    // Refresh user profile data after successful update
    fetchUserProfile();
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