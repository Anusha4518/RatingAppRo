import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [data, setData] = useState({ storeName: null, averageRating: 0, ratings: [] });
  const [loading, setLoading] = useState(true);

  // Sorting state for feedback table
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Change password modal/form state
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenVal = localStorage.getItem('token');
    if (!userStr || !tokenVal) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'STORE_OWNER') {
        navigate('/');
        return;
      }
      setToken(tokenVal);
      setCurrentUser(user);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchOwnerDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({ sortBy, order: sortOrder }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/owner/dashboard?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const result = await res.json();
      if (res.ok) setData(result);
    } catch (err) {
      console.error('Fetch owner stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerDashboard();
  }, [token, sortBy, sortOrder]);

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
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
      const resData = await res.json();

      if (!res.ok) {
        setPasswordError(resData.error || 'Failed to update password.');
      } else {
        setPasswordSuccess('Password successfully modified!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setChangePasswordOpen(false);
          setPasswordSuccess('');
        }, 1200);
      }
    } catch (err) {
      setPasswordError('Connection error.');
    } finally {
      setPasswordLoading(false);
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
                Store Owner
              </span>
            </div>
          </div>

          <nav className="mt-6 px-4 space-y-7">
            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Store Analytics
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
                  <span>Dashboard Stats</span>
                </div>
                {activeTab === 'dashboard' && <span className="text-xs">➔</span>}
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
                  <span>Customer Feedbacks</span>
                </div>
                {activeTab === 'ratings' && <span className="text-xs">➔</span>}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="px-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Store Account
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
                  <span>Account Details</span>
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
                  <span>Update Password</span>
                </div>
                {activeTab === 'settings' && <span className="text-xs">➔</span>}
              </button>
            </div>
          </nav>
        </div>

        <div className="p-5 select-none border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          RateStore Merchant Portal
        </div>
      </aside>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-100 select-none shrink-0 sticky top-0 z-30">
          <div className="max-w-[1440px] w-full mx-auto px-8 flex items-center justify-between h-full">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-slate-900">
                {data.storeName ? `Outlet: ${data.storeName}` : 'Store Owner Portal'}
              </span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-700">
              <div className="flex items-center space-x-2">
                <span>Owner: </span>
                <span className="font-normal text-slate-700">
                  {currentUser ? currentUser.name : 'Store Owner'}
                </span>
              </div>

              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs transition font-bold"
                >
                  Change Password
                </button>
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
          {/* Dashboard Stats Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Store Performance Overview</h1>
                <p className="text-xs text-slate-500 mt-0.5">Average customer satisfaction metrics and rating analytics</p>
              </div>

              <section className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-lg px-4 py-3 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Registered Store</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                    {data.storeName || 'Not Assigned'}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg px-4 py-3 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Avg Rating</div>
                  <div className="text-lg font-bold text-amber-500 mt-0.5 flex items-center gap-1">
                    <span>★</span>
                    <span>{data.averageRating > 0 ? data.averageRating.toFixed(2) : '0.00'}</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-lg px-4 py-3 shadow-sm hover:border-slate-300 transition-colors">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Total Ratings</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">{data.ratings.length}</div>
                </div>
              </section>

              {/* Feedbacks Preview on Dashboard */}
              <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-[#f7faf8] px-6 py-5 flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-slate-800">Recent Ratings from Customers</h3>
                  <button
                    onClick={() => setActiveTab('ratings')}
                    className="text-xs font-bold text-slate-700 hover:text-black transition"
                  >
                    View All →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Customer Name</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Address</th>
                        <th className="px-6 py-3.5">Rating Given</th>
                        <th className="px-6 py-3.5 text-right">Submitted Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.ratings.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-10 text-center text-slate-450 font-medium">
                            No ratings submitted for your store outlet yet.
                          </td>
                        </tr>
                      ) : (
                        data.ratings.slice(0, 5).map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{r.name}</td>
                            <td className="px-6 py-4 text-xs">{r.email}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-xs">{r.address}</td>
                            <td className="px-6 py-4 font-extrabold text-amber-500">★ {r.rating} / 5</td>
                            <td className="px-6 py-4 text-right text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Full Customer Ratings Tab with Interactive Sorting */}
          {activeTab === 'ratings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Feedbacks & Ratings</h1>
                <p className="text-xs text-slate-500 mt-1">Full list of users who submitted ratings for your store (click headers to sort)</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('name')}>
                          Customer Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('email')}>
                          Email {sortBy === 'email' && (sortOrder === 'ASC' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('address')}>
                          Address {sortBy === 'address' && (sortOrder === 'ASC' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('rating')}>
                          Rating Given {sortBy === 'rating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-3.5 text-right cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('createdAt')}>
                          Submitted Date {sortBy === 'createdAt' && (sortOrder === 'ASC' ? '↑' : '↓')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.ratings.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-semibold text-sm">
                            No customer ratings logged yet.
                          </td>
                        </tr>
                      ) : (
                        data.ratings.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">{r.name}</td>
                            <td className="px-6 py-4 text-xs">{r.email}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-xs">{r.address}</td>
                            <td className="px-6 py-4 font-extrabold text-amber-500">★ {r.rating} <span className="text-slate-400 text-xs font-normal">/ 5</span></td>
                            <td className="px-6 py-4 text-right text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Account Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xl shadow-inner select-none">
                  {(currentUser ? currentUser.name : 'O').charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Store Owner Profile</h3>
                  <p className="text-xs text-slate-400">Account and assigned business credentials</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                  <span className="text-base font-bold text-slate-900">{currentUser ? currentUser.name : 'Store Owner'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-slate-750">{currentUser ? currentUser.email : 'owner@ratestore.com'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Physical Address</span>
                  <span className="text-sm text-slate-650 leading-relaxed">{currentUser ? currentUser.address : 'Not Configured'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Account Role Privilege</span>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200/60">
                    Store Owner
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Assigned Outlet</span>
                  <span className="text-sm font-bold text-slate-900">{data.storeName || 'None'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Security / Password Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-6">Update Password</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{passwordError}</div>}
                {passwordSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{passwordSuccess}</div>}

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Old Password</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (8-16 chars, 1 uppercase, 1 special char)</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
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
                    {passwordLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Change Password Dialog Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Change Password</h3>
              <button
                onClick={() => { setChangePasswordOpen(false); setPasswordError(''); setPasswordSuccess(''); }}
                className="text-slate-400 hover:text-slate-600 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-3.5">
              {passwordError && <div className="text-red-655 text-xs font-semibold bg-red-50 border border-red-100 p-2 rounded">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-655 text-xs font-semibold bg-green-50 border border-green-100 p-2 rounded">{passwordSuccess}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Old Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-slate-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition"
                  >
                    {showOldPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (8-16 chars, 1 uppercase, 1 special char)</label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-slate-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition"
                  >
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password</label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-slate-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition"
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(false)}
                  className="flex-1 border border-slate-200 rounded-lg text-slate-700 px-3 py-2 hover:bg-slate-50 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
                >
                  {passwordLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
