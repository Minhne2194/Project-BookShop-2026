import React, { useState } from 'react';
import { ShoppingCart, Search, User, Menu, X, BookOpen, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Văn học', 'Kinh tế', 'Tâm lý - Kỹ năng sống', 'Sách thiếu nhi', 'Ngoại ngữ'];

export function Header() {
  // --- STATES CHO GIAO DIỆN ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- LẤY DỮ LIỆU TỪ CONTEXT ---
  const { token, setToken, cartCount } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/'); // Đẩy về trang chủ sau khi đăng xuất
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-indigo-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4 md:gap-8">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-indigo-900 -ml-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-indigo-950 shrink-0">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <span className="text-xl md:text-2xl font-bold font-serif tracking-tight">
            Modern Book
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:block flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sách, tác giả, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-2.5 bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all font-sans text-sm text-slate-700 placeholder:text-slate-500"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-indigo-600 transition-colors rounded-full">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Xử lý Đăng nhập / Đã đăng nhập cho Desktop */}
          {token ? (
            <div className="hidden sm:flex items-center gap-4">
              {/* Đã cập nhật: Trỏ thẳng vào trang /account */}
              <Link to="/account" className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                <User className="w-5 h-5 text-indigo-600" /> Tài khoản
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 font-medium">
                Thoát
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Đăng nhập
            </Link>
          )}

          <Link to="/cart" className="p-2 text-slate-600 hover:text-indigo-600 transition-colors relative flex items-center">
            <ShoppingCart className="w-6 h-6 stroke-[1.5]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Nav - Bottom Row */}
      <nav className="hidden md:flex border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-center gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              to={`/search?category=${encodeURIComponent(cat)}`}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Search Bar Dropdown */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-indigo-50 bg-white overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-sans text-sm"
                  autoFocus
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors">
                  Tìm
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-[80px] left-0 right-0 bg-white border-b border-indigo-100 shadow-xl"
          >
            <div className="flex flex-col p-4 gap-4">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat}
                  to={`/search?category=${encodeURIComponent(cat)}`}
                  className="text-lg font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {cat}
                </Link>
              ))}

              <div className="h-px bg-slate-100 w-full my-2" />

              {/* Trạng thái đăng nhập trên Mobile */}
              {token ? (
                <>
                  {/* Đã cập nhật: Thêm link tới trang tài khoản cho Mobile */}
                  <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-lg font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <User className="w-5 h-5" /> Tài khoản
                  </Link>
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-lg font-medium text-red-500 hover:text-red-700 transition-colors">
                    <LogOut className="w-5 h-5" /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-lg font-medium text-slate-700 hover:text-indigo-600">
                  <User className="w-5 h-5" /> Đăng nhập
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}