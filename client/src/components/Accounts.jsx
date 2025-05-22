import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Accounts.css';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [newAccount, setNewAccount] = useState({
    type: 'Resident',
    name: '',
    username: '',
    email: '',
    password: '',
    address: '',
    status: 'Pending'
  });

  const [editAccount, setEditAccount] = useState({
    id: null,
    type: '',
    name: '',
    username: '',
    email: '',
    address: '',
    status: ''
  });

  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');

  // Fetch users data from database
  useEffect(() => {
  // Initial fetch
  fetchUsers();
  
  // Set up interval for automatic refresh every 3 seconds
  const interval = setInterval(() => {
    fetchUsers();
  }, 3000);
  
  // Cleanup interval on component unmount
  return () => clearInterval(interval);
}, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://192.168.177.28:3001/api/users');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditAccount((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name || !newAccount.username || !newAccount.password) return;
    
    try {
      const response = await fetch('http://192.168.177.28:3001/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newAccount.username,
          password: newAccount.password,
          role: newAccount.type,
          name: newAccount.name,
          email: newAccount.email,
          address: newAccount.address,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Account created successfully!');
        // Refresh the user list
        fetchUsers();
        // Reset form
        setNewAccount({
          type: 'Resident',
          name: '',
          username: '',
          email: '',
          password: '',
          status: 'Pending'
        });
        setShowForm(false);
      } else {
        alert(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error("Failed to create account:", error);
      alert('Failed to create account. Please try again.');
    }
  };

  // Improved handleEditAccount function for the frontend

const handleEditAccount = async (e) => {
  e.preventDefault();
  if (!editAccount.name || !editAccount.username) return;
  
  try {
    const response = await fetch(`http://192.168.177.28:3001/api/users/${editAccount.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: editAccount.username,
        role: editAccount.type,
        name: editAccount.name,
        email: editAccount.email || '',
        address: editAccount.address || '',
        status: editAccount.status
      }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('Account updated successfully!');
      
      // Refresh the user list
      fetchUsers();
      
      // Reset form and close
      setEditAccount({
        id: null,
        type: '',
        name: '',
        username: '',
        email: '',
        status: ''
      });
      setShowEditForm(false);
    } else {
      alert(data.message || 'Failed to update account');
    }
  } catch (error) {
    console.error("Failed to update account:", error);
    alert('Failed to update account. Please try again.');
  }
}

  const handleEditClick = (account) => {
    setEditAccount({
      id: account.ID,
      type: account.ROLE,
      name: account.NAME || '',
      username: account.USER,
      email: account.EMAIL || '',
      address: account.ADDRESS || '',
      status: account.STATUS
    });
    setShowEditForm(true);
  };

  const handleDeleteAccount = async (accountId) => {
  if (!window.confirm('Are you sure you want to delete this account?')) {
    return;
  }
  
  try {
    const response = await fetch(`http://192.168.177.28:3001/api/users/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Show success message
      alert('Account deleted successfully!');
      
      // Refresh the user list
      fetchUsers();
    } else {
      alert(data.message || 'Failed to delete account');
    }
  } catch (error) {
    console.error("Failed to delete account:", error);
    alert('Failed to delete account. Please try again.');
  }
};

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.USER?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.EMAIL?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'All') return matchesSearch;
    return matchesSearch && account.ROLE === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link to="/Dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Home
                </Link>
                <Link to="/incident-report" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Incident Report
                </Link>
                <Link to="/scheduling" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Scheduling & Assessment
                </Link>
                <Link to="/gis-mapping" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  GIS Mapping
                </Link>
                <Link to="/patrol-logs" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Patrol Logs
                </Link>
                <Link to="/accounts" className="border-indigo-500 text-indigo-600 hover:text-indigo-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Accounts
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="relative inline-block">
                  <img
                    className="h-8 w-8 rounded-full"
                    src="/api/placeholder/150/150"
                    alt="User avatar"
                  />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white"></span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <svg className="mr-2 h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    User Accounts Management
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage system users, assign roles and permissions
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() => {
                      setShowForm(!showForm);
                      setShowEditForm(false);
                    }}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      showForm ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {showForm ? (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Cancel
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Account
                      </>
                    )}
                  </button>
                </div>
              </div>

              {showForm && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Create New Account</h3>
                  <form className="space-y-4" onSubmit={handleAddAccount}>
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                     
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          value={newAccount.name}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                          Account Type
                        </label>
                        <select
                          id="type"
                          name="type"
                          value={newAccount.type}
                          onChange={handleInputChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="Resident">Resident</option>
                          <option value="Tanod">Tanod</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      

                      <div className="sm:col-span-3">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          value={newAccount.username}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                        <div className="sm:col-span-3">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          value={newAccount.password}
                          onChange={handleInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          value={newAccount.email}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="sm:col-span-3">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={newAccount.address}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Save Account
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showEditForm && (
                <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Edit Account</h3>
                  <form className="space-y-4" onSubmit={handleEditAccount}>
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-6">
                      
                      <div className="sm:col-span-3">
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="edit-name"
                          value={editAccount.name}
                          onChange={handleEditInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      <div className="sm:col-span-1">
                        <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700">
                          Account Type
                        </label>
                        <select
                          id="edit-type"
                          name="type"
                          value={editAccount.type}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="Resident">Resident</option>
                          <option value="Tanod">Tanod</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1">
                        <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
                          Account Status
                        </label>
                        <select
                          id="edit-status"
                          name="status"
                          value={editAccount.status}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Verified">Verified</option>
                        </select>
                      </div>

                      

                      <div className="sm:col-span-3">
                        <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700">
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          id="edit-username"
                          value={editAccount.username}
                          onChange={handleEditInputChange}
                          required
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="edit-email"
                          value={editAccount.email}
                          onChange={handleEditInputChange}
                          className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="sm:col-span-3">
                          <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700">
                            Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            id="edit-address"
                            value={editAccount.address}
                            onChange={handleEditInputChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowEditForm(false)}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Update Account
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 mb-4">
                  <div className="w-full md:w-64 flex items-center relative">
                    <svg className="h-4 w-4 absolute left-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search accounts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-3 py-2 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <div className="relative inline-block text-left">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="All">All Types</option>
                        <option value="Resident">Resident</option>
                        <option value="Tanod">Tanod</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                ID
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                ACCOUNT
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                USER
                              </th>
                              
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                TYPE
                              </th>
                              <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  EMAIL
                                </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                ADDRESS
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                STATUS
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAccounts.length > 0 ? (
                              filteredAccounts.map((account) => (
                                <tr key={account.ID} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    #{account.ID}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                          {account.ROLE === 'Tanod' ? (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                            </svg>
                                          ) : (
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{account.NAME || account.USER}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {account.USER}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      account.ROLE === 'Tanod' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : account.ROLE === 'Admin'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {account.ROLE}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {account.EMAIL || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {account.ADDRESS
                                        ? account.ADDRESS.length > 15
                                          ? account.ADDRESS.slice(0, 15) + '...'
                                          : account.ADDRESS
                                        : '-'}
                                    </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      account.STATUS === 'Active' || account.STATUS === 'Verified'
                                        ? 'bg-green-100 text-green-800' 
                                        : account.STATUS === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {account.STATUS}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                                      onClick={() => handleEditClick(account)}
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      className="text-red-600 hover:text-red-900"
                                      onClick={() => handleDeleteAccount(account.ID)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                  No accounts found matching your search criteria
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Accounts;