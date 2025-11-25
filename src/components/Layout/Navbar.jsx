import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, LogOut, User, History, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:inline">ExamPortal</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/history"
              className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </Link>

            <div className="flex items-center space-x-2 text-gray-700 border-l border-gray-300 pl-4">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium truncate max-w-[120px]">{user.username}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-md text-gray-700 hover:text-blue-600 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-gray-50 border-t border-gray-200 py-3 px-2">
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="truncate">{user.username}</span>
                </div>
              </div>

              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-sm font-medium transition-colors block w-full"
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
