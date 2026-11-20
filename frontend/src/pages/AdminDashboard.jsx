import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Stats
  const [stats, setStats] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });

  // Data lists
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState([]);

  // User table search, filters & sort
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSortBy, setUserSortBy] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState('ASC');

  // Store table search & sort
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSortBy, setStoreSortBy] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('ASC');

  // Ratings table search & sort
  const [ratingsSearch, setRatingsSearch] = useState('');
  const [ratingsSortBy, setRatingsSortBy] = useState('createdAt');
  const [ratingsSortOrder, setRatingsSortOrder] = useState('DESC');

  // User details modal state
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false);

  // New user modal form state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('NORMAL_USER');
  const [userModalError, setUserModalError] = useState('');
  const [userModalSuccess, setUserModalSuccess] = useState('');
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);

  // New store modal form state
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreEmail, setNewStoreEmail] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreOwner, setNewStoreOwner] = useState('');
  const [storeModalError, setStoreModalError] = useState('');
  const [storeModalSuccess, setStoreModalSuccess] = useState('');
  const [storeModalLoading, setStoreModalLoading] = useState(false);

  const [storeOwners, setStoreOwners] = useState([]);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verify Admin Authentication
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenVal = localStorage.getItem('token');
    if (!userStr || !tokenVal) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'SYSTEM_ADMIN') {
        navigate('/');
        return;
      }
      setToken(tokenVal);
      setCurrentUser(user);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch Dashboard Statistics
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthFailure();
        return;
      }
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // Fetch Users with Search, Role Filter, and Sorting
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const query = new URLSearchParams({
        search: userSearch,
        role: userRoleFilter,
        sortBy: userSortBy,
        order: userSortOrder
      }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/admin/users?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthFailure();
        return;
      }
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, userSearch, userRoleFilter, userSortBy, userSortOrder]);

  // Fetch Stores with Search and Sorting
  const fetchStores = async () => {
    if (!token) return;
    try {
      const query = new URLSearchParams({
        search: storeSearch,
        sortBy: storeSortBy,
        order: storeSortOrder
      }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/admin/stores?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthFailure();
        return;
      }
      const data = await res.json();
      if (res.ok) setStores(data);
    } catch (err) {
      console.error('Fetch stores error:', err);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [token, storeSearch, storeSortBy, storeSortOrder]);

  // Fetch Ratings with Search and Sorting
  const fetchRatings = async () => {
    if (!token) return;
    try {
      const query = new URLSearchParams({
        search: ratingsSearch,
        sortBy: ratingsSortBy,
        order: ratingsSortOrder
      }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/admin/ratings?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleAuthFailure();
        return;
      }
      const data = await res.json();
      if (res.ok) setRatings(data);
    } catch (err) {
      console.error('Fetch ratings error:', err);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [token, ratingsSearch, ratingsSortBy, ratingsSortOrder]);

  // Fetch Store Owners for dropdown
  useEffect(() => {
    if (!token) return;
    const fetchOwners = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/users?role=STORE_OWNER', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setStoreOwners(data);
      } catch (err) {
        console.error('Fetch owners error:', err);
      }
    };
    fetchOwners();
  }, [token, users]);

  const handleAuthFailure = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('http://127.0.0.1:5000/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
      setPasswordError('Password must be 8-16 characters.');
      return;
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUppercase || !hasSpecial) {
      setPasswordError('Password must include 1 uppercase letter and 1 special character.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password.');
      } else {
        setPasswordSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('Connection error.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleUserSort = (column) => {
    if (userSortBy === column) {
      setUserSortOrder(userSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setUserSortBy(column);
      setUserSortOrder('ASC');
    }
  };

  const toggleStoreSort = (column) => {
    if (storeSortBy === column) {
      setStoreSortOrder(storeSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setStoreSortBy(column);
      setStoreSortOrder('ASC');
    }
  };

  const toggleRatingsSort = (column) => {
    if (ratingsSortBy === column) {
      setRatingsSortOrder(ratingsSortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setRatingsSortBy(column);
      setRatingsSortOrder('ASC');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserModalError('');
    setUserModalSuccess('');

    // Validations: Name min 20 max 60, Address max 400, Password 8-16 with uppercase & special char
    if (newUserName.trim().length < 20 || newUserName.length > 60) {
      setUserModalError('Name must be between 20 and 60 characters.');
      return;
    }
    if (!newUserAddress || newUserAddress.trim().length === 0 || newUserAddress.length > 400) {
      setUserModalError('Address is required and must not exceed 400 characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newUserEmail || !emailRegex.test(newUserEmail)) {
      setUserModalError('Email must follow standard email validation rules.');
      return;
    }
    if (newUserPassword.length < 8 || newUserPassword.length > 16) {
      setUserModalError('Password must be 8-16 characters.');
      return;
    }
    const hasUppercase = /[A-Z]/.test(newUserPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newUserPassword);
    if (!hasUppercase || !hasSpecial) {
      setUserModalError('Password must include at least 1 uppercase letter and 1 special character.');
      return;
    }

    setUserModalLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          address: newUserAddress.trim(),
          role: newUserRole
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setUserModalError(data.error || 'Failed to create user.');
      } else {
        setUserModalSuccess('User created successfully!');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserAddress('');
        setNewUserPassword('');
        setNewUserRole('NORMAL_USER');
        
        fetchUsers();
        fetchStats();

        setTimeout(() => {
          setUserModalOpen(false);
          setUserModalSuccess('');
        }, 1000);
      }
    } catch (err) {
      setUserModalError('Error connecting to server.');
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setStoreModalError('');
    setStoreModalSuccess('');

    if (newStoreName.trim().length < 20 || newStoreName.length > 60) {
      setStoreModalError('Store name must be between 20 and 60 characters.');
      return;
    }
    if (!newStoreAddress || newStoreAddress.trim().length === 0 || newStoreAddress.length > 400) {
      setStoreModalError('Store address is required and must not exceed 400 characters.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newStoreEmail || !emailRegex.test(newStoreEmail)) {
      setStoreModalError('Store email must be a valid email address.');
      return;
    }
    if (!newStoreOwner) {
      setStoreModalError('Please select a Store Owner.');
      return;
    }

    setStoreModalLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newStoreName.trim(),
          email: newStoreEmail.trim(),
          address: newStoreAddress.trim(),
          ownerId: newStoreOwner
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setStoreModalError(data.error || 'Failed to create store.');
      } else {
        setStoreModalSuccess('Store created successfully!');
        setNewStoreName('');
        setNewStoreEmail('');
        setNewStoreAddress('');
        setNewStoreOwner('');

        fetchStores();
        fetchStats();

        setTimeout(() => {
          setStoreModalOpen(false);
          setStoreModalSuccess('');
        }, 1000);
      }
    } catch (err) {
      setStoreModalError('Error connecting to server.');
    } finally {
      setStoreModalLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 text-slate-800 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="px-6 py-6 flex items-center space-x-3.5 border-b border-slate-100">
            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xs font-bold text-slate-700">RS</span>
            </div>
            <div className="flex flex-col items-start space-y-1">
              <span className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">RatingApp</span>
              <span className="border border-slate-200 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase scale-90 origin-left">
                Admin
              </span>
            </div>
          </div>

          <nav className="mt-6 px-4 space-y-7">
            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Management
              </div>
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'dashboard' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                  </svg>
                  <span>Overview Dashboard</span>
                </div>
                {activeTab === 'dashboard' && <span className="text-xs">➔</span>}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'users' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Users Directory</span>
                </div>
                {activeTab === 'users' && <span className="text-xs">➔</span>}
              </button>
              
              <button
                onClick={() => setActiveTab('stores')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'stores' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Stores Directory</span>
                </div>
                {activeTab === 'stores' && <span className="text-xs">➔</span>}
              </button>
              
              <button
                onClick={() => setActiveTab('ratings')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'ratings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.242.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 12.08c-.772-.568-.372-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <span>Ratings Logs</span>
                </div>
                {activeTab === 'ratings' && <span className="text-xs">➔</span>}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                System
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'profile' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>My Profile</span>
                </div>
                {activeTab === 'profile' && <span className="text-xs">➔</span>}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-slate-100 hover:text-slate-900 ${
                  activeTab === 'settings' ? 'text-slate-900 bg-slate-100 shadow-sm' : 'text-slate-650'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Security</span>
                </div>
                {activeTab === 'settings' && <span className="text-xs">➔</span>}
              </button>
            </div>
          </nav>
        </div>

        <div className="p-5 select-none border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          RateStore Platform Engine v2.0
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 select-none shrink-0 sticky top-0 z-30">
          <div className="max-w-[1440px] w-full mx-auto px-8 flex items-center justify-between h-full">
            <div className="flex-1 max-w-md flex items-center">
              {['users', 'stores', 'ratings'].includes(activeTab) && (
                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    value={
                      activeTab === 'users' ? userSearch :
                      activeTab === 'stores' ? storeSearch :
                      activeTab === 'ratings' ? ratingsSearch : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (activeTab === 'users') setUserSearch(val);
                      else if (activeTab === 'stores') setStoreSearch(val);
                      else if (activeTab === 'ratings') setRatingsSearch(val);
                    }}
                    placeholder={
                      activeTab === 'users' ? 'Filter users by Name, Email, or Address...' :
                      activeTab === 'stores' ? 'Filter stores by Name, Email, or Address...' :
                      activeTab === 'ratings' ? 'Filter ratings by Customer, Store, or Email...' : ''
                    }
                    className="w-full bg-[#f3f7f5] border border-transparent rounded-full px-5 py-2 text-xs outline-none transition focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 text-slate-700"
                  />
                  <button className="absolute right-1 hover:bg-slate-200/50 p-1.5 rounded-full text-slate-400 hover:text-slate-650 transition">
                    🔍
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-700">
              <div className="flex items-center space-x-2">
                <span>Admin: </span>
                <span className="font-normal text-slate-700">
                  {currentUser ? currentUser.name : 'Administrator'}
                </span>
              </div>

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition font-bold"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 max-w-[1440px] w-full mx-auto">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
                <p className="text-xs text-slate-500 mt-0.5">Key metrics and platform administration statistics</p>
              </div>

              <section className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-xs text-slate-500 uppercase font-medium tracking-wider mb-1">Total Users</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalUsers}</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-xs text-slate-500 uppercase font-medium tracking-wider mb-1">Total Stores</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalStores}</div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-xs text-slate-500 uppercase font-medium tracking-wider mb-1">Total Ratings</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalRatings}</div>
                </div>
              </section>

              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 select-none">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setUserModalOpen(true)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 font-semibold transition shadow-sm text-xs"
                  >
                    <span>+ Add User</span>
                  </button>
                  <button
                    onClick={() => setStoreModalOpen(true)}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 font-semibold transition shadow-sm text-xs"
                  >
                    <span>+ Add Store</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Users Directory */}
          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-[#f7faf8] px-6 py-5 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">User Accounts Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter by Name, Email, Address, and Role</p>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2.5 py-2 outline-none bg-white text-slate-650 font-bold text-xs"
                  >
                    <option value="">All Roles</option>
                    <option value="SYSTEM_ADMIN">System Administrator</option>
                    <option value="NORMAL_USER">Normal User</option>
                    <option value="STORE_OWNER">Store Owner</option>
                  </select>
                  <button
                    onClick={() => setUserModalOpen(true)}
                    className="flex items-center bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4.5 py-2 font-bold transition shadow-sm text-xs"
                  >
                    <span>+ Add User</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleUserSort('name')}>
                        Name {userSortBy === 'name' && (userSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleUserSort('email')}>
                        Email {userSortBy === 'email' && (userSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleUserSort('address')}>
                        Address {userSortBy === 'address' && (userSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleUserSort('role')}>
                        Role {userSortBy === 'role' && (userSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right font-bold">Store Owner Rating</th>
                      <th className="px-6 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-slate-450 font-medium">No users found matching current filters.</td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs shrink-0 select-none text-slate-800 font-bold uppercase">
                                {u.name.charAt(0)}
                              </div>
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{u.email}</td>
                          <td className="px-6 py-4 max-w-xs truncate">{u.address}</td>
                          <td className="px-6 py-4 font-medium select-none">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.role === 'SYSTEM_ADMIN' ? 'bg-red-50 text-red-700 border border-red-100/60' :
                              u.role === 'STORE_OWNER' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                              'bg-slate-100 text-slate-655 border border-slate-200'
                            }`}>
                              {u.role === 'SYSTEM_ADMIN' ? 'Admin' : u.role === 'STORE_OWNER' ? 'Store Owner' : 'Normal User'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-medium">
                            {u.role === 'STORE_OWNER' ? (
                              u.store ? (
                                <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md text-slate-800">
                                  {u.store.name} <span className="text-amber-500 font-bold ml-1">★ {u.store.rating > 0 ? u.store.rating.toFixed(1) : 'Unrated'}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No store assigned</span>
                              )
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedUserDetails(u);
                                setUserDetailsModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold transition"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stores Directory */}
          {activeTab === 'stores' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-[#f7faf8] px-6 py-5 flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Registered Store Outlets</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter by Name, Email, or Address</p>
                </div>
                <button
                  onClick={() => setStoreModalOpen(true)}
                  className="flex items-center bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4.5 py-2 font-bold transition shadow-sm text-xs"
                >
                  <span>+ Add Store</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleStoreSort('name')}>
                        Store Name {storeSortBy === 'name' && (storeSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleStoreSort('email')}>
                        Email {storeSortBy === 'email' && (storeSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleStoreSort('address')}>
                        Address {storeSortBy === 'address' && (storeSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleStoreSort('rating')}>
                        Overall Rating {storeSortBy === 'rating' && (storeSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 font-bold">Store Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stores.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-10 text-center text-slate-450 font-medium">No stores found.</td>
                      </tr>
                    ) : (
                      stores.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <span>{s.name}</span>
                          </td>
                          <td className="px-6 py-4">{s.email}</td>
                          <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                          <td className="px-6 py-4 font-bold text-amber-500">★ {s.averageRating.toFixed(1)}</td>
                          <td className="px-6 py-4 font-semibold text-slate-850">{s.ownerName || 'Unassigned'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ratings Logs */}
          {activeTab === 'ratings' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-[#f7faf8] px-6 py-5 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800">Customer Ratings & Reviews Logs</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Click column headers to sort ascending / descending</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-655">
                  <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('userName')}>
                        Customer Name {ratingsSortBy === 'userName' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('userEmail')}>
                        Customer Email {ratingsSortBy === 'userEmail' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('userAddress')}>
                        Customer Address {ratingsSortBy === 'userAddress' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('storeName')}>
                        Store Rated {ratingsSortBy === 'storeName' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('rating')}>
                        Score Given {ratingsSortBy === 'rating' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3.5 text-right cursor-pointer hover:text-slate-700 transition" onClick={() => toggleRatingsSort('createdAt')}>
                        Submitted Date {ratingsSortBy === 'createdAt' && (ratingsSortOrder === 'ASC' ? '↑' : '↓')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ratings.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-10 text-center text-slate-450 font-medium">No ratings logged yet.</td>
                      </tr>
                    ) : (
                      ratings.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{r.userName}</td>
                          <td className="px-6 py-4">{r.userEmail}</td>
                          <td className="px-6 py-4 max-w-xs truncate">{r.userAddress}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{r.storeName}</td>
                          <td className="px-6 py-4 font-extrabold text-amber-500">★ {r.rating} / 5</td>
                          <td className="px-6 py-4 text-right text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xl shadow-inner select-none">
                  {(currentUser ? currentUser.name : 'A').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Administrative Profile</h3>
                  <p className="text-xs text-slate-400">System account credentials details</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                  <span className="text-base font-bold text-slate-900">{currentUser ? currentUser.name : 'Administrator'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-slate-750">{currentUser ? currentUser.email : 'admin@ratestore.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Physical Address</span>
                  <span className="text-sm text-slate-650 leading-relaxed">{currentUser ? currentUser.address : 'Not Configured'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Account Role Privilege</span>
                  <span className="inline-block mt-1.5 px-3 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-50 text-red-700 border border-red-100/60">
                    {currentUser ? currentUser.role : 'SYSTEM_ADMIN'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3.5 mb-6">Security Settings</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{passwordError}</div>}
                {passwordSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{passwordSuccess}</div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Old Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 text-slate-450 hover:text-slate-600 focus:outline-none transition"
                    >
                      {showOldPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password (8-16 chars, 1 uppercase, 1 special char)</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-slate-450 hover:text-slate-600 focus:outline-none transition"
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-205 rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10 bg-slate-50/50"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-slate-450 hover:text-slate-600 focus:outline-none transition"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg py-2.5 text-xs font-bold transition shadow-sm"
                  >
                    {passwordLoading ? 'Saving Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* User Details Modal (Viewing details of all users + Store Owner rating) */}
      {userDetailsModalOpen && selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">User Details</h3>
              <button
                onClick={() => {
                  setUserDetailsModalOpen(false);
                  setSelectedUserDetails(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                <span className="text-base font-bold text-slate-900">{selectedUserDetails.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                <span className="text-sm font-semibold text-slate-800">{selectedUserDetails.email}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Physical Address</span>
                <span className="text-sm text-slate-700 leading-relaxed">{selectedUserDetails.address}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Account Role</span>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                  selectedUserDetails.role === 'SYSTEM_ADMIN' ? 'bg-red-50 text-red-700 border border-red-100/60' :
                  selectedUserDetails.role === 'STORE_OWNER' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' :
                  'bg-slate-100 text-slate-655 border border-slate-200'
                }`}>
                  {selectedUserDetails.role === 'SYSTEM_ADMIN' ? 'System Administrator' : selectedUserDetails.role === 'STORE_OWNER' ? 'Store Owner' : 'Normal User'}
                </span>
              </div>

              {selectedUserDetails.role === 'STORE_OWNER' && (
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 mt-3 space-y-2">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Store Owner Details</div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Assigned Store</span>
                    <span className="font-bold text-slate-800">{selectedUserDetails.store ? selectedUserDetails.store.name : 'No store assigned yet'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase block">Store Overall Rating</span>
                    <span className="font-extrabold text-amber-600 text-base">
                      {selectedUserDetails.store ? `★ ${selectedUserDetails.store.rating > 0 ? selectedUserDetails.store.rating.toFixed(2) : '0.00'} / 5` : 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setUserDetailsModalOpen(false);
                    setSelectedUserDetails(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Add New User</h3>
              <button onClick={() => { setUserModalOpen(false); setUserModalError(''); }} className="text-slate-400 hover:text-slate-600 font-bold transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {userModalError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{userModalError}</div>}
              {userModalSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{userModalSuccess}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name (Min 20 characters, Max 60)</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Min 20 characters..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 text-right">{newUserName.length}/60</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address (Max 400 characters)</label>
                <textarea
                  required
                  rows={2}
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  placeholder="Street address, city, zip code..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50 resize-none"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 text-right">{newUserAddress.length}/400</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password (8-16 chars, 1 uppercase, 1 special char)</label>
                <div className="relative flex items-center">
                  <input
                    type={showUserPassword ? "text" : "password"}
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-605 focus:outline-none transition-colors"
                  >
                    {showUserPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none transition focus:border-emerald-500 bg-white text-slate-650 font-bold"
                >
                  <option value="NORMAL_USER">Normal User</option>
                  <option value="STORE_OWNER">Store Owner</option>
                  <option value="SYSTEM_ADMIN">System Administrator</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="flex-1 border border-slate-200 rounded-lg text-slate-700 px-3 py-2 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userModalLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
                >
                  {userModalLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Store Modal */}
      {storeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Add New Store</h3>
              <button onClick={() => { setStoreModalOpen(false); setStoreModalError(''); }} className="text-slate-400 hover:text-slate-600 font-bold transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreateStore} className="space-y-3.5">
              {storeModalError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{storeModalError}</div>}
              {storeModalSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{storeModalSuccess}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Store Name (Min 20 characters, Max 60)</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Min 20 characters..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 text-right">{newStoreName.length}/60</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 mb-1">Store Email</label>
                <input
                  type="email"
                  required
                  value={newStoreEmail}
                  onChange={(e) => setNewStoreEmail(e.target.value)}
                  placeholder="store@example.com"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Store Address (Max 400 characters)</label>
                <textarea
                  required
                  rows={2}
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  placeholder="Full store street address..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-slate-50/50 resize-none"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5 text-right">{newStoreAddress.length}/400</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Store Owner</label>
                <select
                  required
                  value={newStoreOwner}
                  onChange={(e) => setNewStoreOwner(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-sm outline-none transition focus:border-emerald-500 bg-white text-slate-650 font-bold"
                >
                  <option value="">Select Owner</option>
                  {storeOwners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStoreModalOpen(false)}
                  className="flex-1 border border-slate-205 rounded-lg text-slate-700 px-3 py-2 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={storeModalLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
                >
                  {storeModalLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
