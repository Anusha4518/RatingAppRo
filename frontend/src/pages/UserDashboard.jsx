import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('stores');

  // Stores & search
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [loading, setLoading] = useState(true);

  // Password update modal/form
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

  // Verify normal user session
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenVal = localStorage.getItem('token');
    if (!userStr || !tokenVal) {
      navigate('/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'NORMAL_USER') {
        navigate('/');
        return;
      }
      setToken(tokenVal);
      setCurrentUser(user);
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const fetchStores = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        sortBy,
        order: sortOrder
      }).toString();
      const res = await fetch(`http://127.0.0.1:5000/api/stores?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) setStores(data);
    } catch (err) {
      console.error('Fetch stores error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [token, search, sortBy, sortOrder]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(col);
      setSortOrder('ASC');
    }
  };

  const handleRateStore = async (storeId, newRating) => {
    if (!token) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/stores/${storeId}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating: newRating })
      });
      if (res.status === 401) {
        localStorage.clear();
        navigate('/login');
        return;
      }
      if (res.ok) {
        fetchStores();
      }
    } catch (err) {
      console.error('Rating error:', err);
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
      setPasswordError('Password must include at least 1 uppercase letter and 1 special character.');
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

  function StarRating({ currentRating, onRate }) {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center space-x-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition transform hover:scale-110"
          >
            <span
              className={`text-2xl leading-none ${
                star <= (hoverRating || currentRating) ? 'text-amber-500' : 'text-slate-200'
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
    );
  }

  function StoreCard({ store, onRate }) {
    const [selectedRating, setSelectedRating] = useState(store.userRating || 0);

    useEffect(() => {
      setSelectedRating(store.userRating || 0);
    }, [store.userRating]);

    const hasExistingRating = store.userRating > 0;
    const isChanged = selectedRating !== store.userRating && selectedRating > 0;

    return (
      <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug">{store.name}</h3>
            <span className="bg-amber-50 border border-amber-200/60 text-amber-700 text-xs px-2.5 py-0.5 rounded-full font-extrabold shrink-0 flex items-center gap-0.5 shadow-sm">
              ★ {store.averageRating.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-600">Owner:</span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold text-slate-800">
              {store.ownerName}
            </span>
          </div>
          <p className="text-[10px] text-slate-700 font-bold tracking-wider uppercase mb-2">{store.email}</p>
          <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1">
            <span className="text-slate-700">📍</span>
            <span>{store.address}</span>
          </p>
        </div>

        <div className="border-t border-slate-100 mt-6 pt-4 flex justify-between items-end">
          <div>
            <div className="text-[10px] text-slate-400 block mb-1 font-bold uppercase tracking-wider">
              {hasExistingRating ? (
                <span>Your Rating: <strong className="text-amber-500">★ {store.userRating} / 5</strong></span>
              ) : (
                <span>Rate this store (1 to 5)</span>
              )}
            </div>
            <StarRating
              currentRating={selectedRating}
              onRate={(newRating) => setSelectedRating(newRating)}
            />
          </div>
          <div className="flex items-center space-x-2">
            {isChanged ? (
              <button
                onClick={() => onRate(store.id, selectedRating)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {hasExistingRating ? 'Modify Rating' : 'Submit Rating'}
              </button>
            ) : hasExistingRating ? (
              <span className="text-xs text-slate-700 font-bold bg-slate-100 border border-slate-200 rounded-md px-2 py-1 flex items-center select-none">
                Rated: {store.userRating} / 5
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
  
  const ratedStores = stores.filter(s => s.userRating > 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 select-none shrink-0 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            <div className="flex items-center space-x-3 shrink-0">
              <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-slate-700">RS</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xl font-bold text-slate-800 tracking-tight leading-none">RatingApp</span>
                <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded font-extrabold tracking-wider uppercase scale-90 origin-left mt-0.5">
                  User
                </span>
              </div>
            </div>

            {/* Search Bar (searches by Name and Address) */}
            <div className="relative w-80 flex items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stores by Name or Address..."
                className="w-full bg-[#f3f7f5] border border-transparent rounded-full px-4 py-1.5 text-xs outline-none transition focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 text-slate-700"
              />
              <button className="absolute right-1 hover:bg-slate-200/50 p-1.5 rounded-full text-slate-400 hover:text-emerald-700 transition">
                🔍
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-sm text-slate-700">
            <div className="flex items-center space-x-2">
              <span>Welcome, </span>
              <span className="font-normal text-slate-700">
                {currentUser ? currentUser.name : 'User'}
              </span>
            </div>

            <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#deeae3] text-slate-900 rounded-lg text-xs transition font-bold"
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

      {/* Main Content Area */}
      <main className="flex-1 p-8 space-y-8 max-w-[1440px] w-full mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 space-x-8 text-sm font-semibold select-none">
          <button
            onClick={() => setActiveTab('stores')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'stores'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Registered Stores Catalog
          </button>

          <button
            onClick={() => setActiveTab('ratings')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'ratings'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            All Stores Table View
          </button>

          <button
            onClick={() => setActiveTab('my-feedback')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'my-feedback'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Submitted Ratings ({ratedStores.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-800 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Profile
          </button>
        </div>

        {/* Tab 1: Store Directory Cards */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Registered Stores Directory</h1>
                <p className="text-xs text-slate-500 mt-0.5">Submit ratings (1 to 5) or modify your submitted ratings for any store</p>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500 font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-bold outline-none"
                >
                  <option value="name">Store Name</option>
                  <option value="address">Address</option>
                  <option value="averageRating">Overall Rating</option>
                  <option value="userRating">My Rating</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  {sortOrder === 'ASC' ? 'Ascending ↑' : 'Descending ↓'}
                </button>
              </div>
            </div>

            {loading && stores.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-semibold">Loading stores...</div>
            ) : stores.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-sm">
                <p className="text-slate-500 font-semibold">No registered stores found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stores.map((store) => (
                  <StoreCard
                    key={store.id}
                    store={store}
                    onRate={handleRateStore}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Stores Table View with Sorting */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Stores Overview Table</h1>
              <p className="text-xs text-slate-500 mt-0.5">Click column headers to sort stores ascending or descending</p>
            </div>

            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-655">
                <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('name')}>
                      Store Name {sortBy === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('address')}>
                      Location Address {sortBy === 'address' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3.5 cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('averageRating')}>
                      Overall Rating {sortBy === 'averageRating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3.5 text-right font-bold cursor-pointer hover:text-slate-700 transition" onClick={() => toggleSort('userRating')}>
                      Your Submitted Rating {sortBy === 'userRating' && (sortOrder === 'ASC' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-450 font-medium">No stores available.</td>
                    </tr>
                  ) : (
                    stores.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                        <td className="px-6 py-4 font-bold text-amber-500">★ {s.averageRating.toFixed(1)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-700">{s.userRating > 0 ? `★ ${s.userRating} / 5` : 'Not Rated'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: My Rating Feedbacks */}
        {activeTab === 'my-feedback' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Rating Feedbacks</h1>
              <p className="text-xs text-slate-500 mt-0.5">Reviews and star ratings you have submitted</p>
            </div>

            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-slate-655">
                <thead className="bg-[#f7faf8] border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Store Name</th>
                    <th className="px-6 py-3.5">Store Email</th>
                    <th className="px-6 py-3.5">Store Address</th>
                    <th className="px-6 py-3.5 text-right font-bold">Your Submitted Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ratedStores.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-10 text-center text-slate-450 font-medium">You have not submitted ratings for any stores yet.</td>
                    </tr>
                  ) : (
                    ratedStores.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                        <td className="px-6 py-4 text-slate-700 font-semibold text-xs">{s.email}</td>
                        <td className="px-6 py-4 max-w-xs truncate">{s.address}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-amber-500">★ {s.userRating} / 5</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Profile Details */}
        {activeTab === 'profile' && (
          <div className="bg-white border border-slate-200/50 rounded-2xl p-8 max-w-xl mx-auto shadow-sm space-y-6">
            <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
              <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-xl shadow-inner select-none">
                {(currentUser ? currentUser.name : 'U').charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">User Account Profile</h3>
                <p className="text-xs text-slate-400">Your account identity details</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                <span className="text-base font-bold text-slate-900">{currentUser ? currentUser.name : 'User'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                <span className="text-sm font-semibold text-slate-750">{currentUser ? currentUser.email : 'user@ratestore.com'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Home Address</span>
                <span className="text-sm text-slate-650 leading-relaxed">{currentUser ? currentUser.address : 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider font-semibold">Account Role Privilege</span>
                <span className="inline-block mt-1.5 px-3 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-50 text-slate-700 border border-slate-200/60">
                  Normal User
                </span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Change Password Dialog Modal */}
      {changePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white border border-slate-205 rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Change Password</h3>
              <button onClick={() => setChangePasswordOpen(false)} className="text-slate-400 hover:text-slate-655 font-bold transition-colors">✕</button>
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-450 hover:text-slate-650 focus:outline-none transition-colors"
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
                    className="w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-sm outline-none transition focus:border-emerald-500 bg-slate-50/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-450 hover:text-slate-655 focus:outline-none transition-colors"
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
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-xs font-semibold transition shadow-sm"
                >
                  {passwordLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
