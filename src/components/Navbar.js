import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationsApi } from '../services/notificationsApi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifError, setNotifError] = useState('');

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleNotif = async () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      try {
        const userId = user?.id ?? user?.email ?? null;
        if (!userId) return;
        const data = await notificationsApi.list(userId);
        setNotifications(Array.isArray(data) ? data : []);
        setNotifError('');
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setNotifError(err?.message || 'Failed to load notifications');
      }
    }
  };

  const unreadCount = (Array.isArray(notifications) ? notifications : []).filter((n) => !n?.isRead).length;

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="../logo.png" alt="GCTC Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-blue-700">CareerPortal</span>
          </Link>

          {/* Hamburger Icon */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-blue-700 text-2xl focus:outline-none"
              aria-label="Toggle Menu"
            >
              ☰
            </button>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition">
                  Dashboard
                </Link>

                <div className="relative">
                  <button
                    onClick={toggleNotif}
                    className="relative text-gray-700 hover:text-blue-600 transition"
                    aria-label="Notifications"
                    type="button"
                  >
                    <span className="text-xl">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-100 font-medium text-gray-800">
                        Notifications
                      </div>
                      {notifError && (
                        <div className="px-3 py-2 text-sm text-red-700 bg-red-50">{notifError}</div>
                      )}
                      <div className="max-h-96 overflow-auto">
                        {notifications.length === 0 ? (
                          <div className="px-3 py-3 text-sm text-gray-500">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`px-3 py-2 border-b border-gray-100 ${n.isRead ? 'bg-white' : 'bg-blue-50'}`}
                            >
                              <div className="text-sm text-gray-800">{n.message}</div>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                </div>
                                {!n.isRead && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await notificationsApi.markRead(n.id);
                                        setNotifications((prev) =>
                                          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
                                        );
                                      } catch (err) {
                                        console.error('Failed to mark as read:', err);
                                      }
                                    }}
                                    className="text-xs text-blue-700 hover:text-blue-800"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/signup" className="text-gray-700 hover:text-blue-600 transition">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link to="/" onClick={toggleMenu} className="block text-gray-700 hover:text-blue-600 transition">
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={toggleMenu}
                  className="block text-gray-700 hover:text-blue-600 transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await toggleNotif();
                  }}
                  className="w-full text-left text-gray-700 hover:text-blue-600 transition"
                  type="button"
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="w-full text-left text-gray-700 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={toggleMenu} className="block text-gray-700 hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/signup" onClick={toggleMenu} className="block text-gray-700 hover:text-blue-600 transition">
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
