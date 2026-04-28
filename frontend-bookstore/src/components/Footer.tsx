import { BookOpen, Globe, Heart, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 text-white mb-6">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span className="text-xl font-bold font-serif tracking-tight">
              Modern Book
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Đồng hành cùng bạn trên mọi trang sách. Giao hàng tận nơi, uy tín và chất lượng.
          </p>
          <div className="flex gap-4">
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-indigo-600 hover:text-white transition-all">
              <Globe className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-rose-500 hover:text-white transition-all">
              <Heart className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 bg-slate-800 rounded-full hover:bg-slate-600 hover:text-white transition-all flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div>
          <h3 className="text-white font-semibold mb-4 text-lg">Danh mục</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/search?category=Sách văn học" className="hover:text-indigo-400 transition-colors">Sách văn học</Link></li>
            <li><Link to="/search?category=Sách kinh tế" className="hover:text-indigo-400 transition-colors">Sách kinh tế</Link></li>
            <li><Link to="/search?category=Sách Tâm lý - Giới tính" className="hover:text-indigo-400 transition-colors">Sách Tâm lý - Giới tính</Link></li>
            <li><Link to="/search?category=Sách thiếu nhi" className="hover:text-indigo-400 transition-colors">Sách thiếu nhi</Link></li>
            <li><Link to="/search?category=Sách Học Ngoại Ngữ" className="hover:text-indigo-400 transition-colors">Sách Học Ngoại Ngữ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-lg">Hỗ trợ khách hàng</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="#" className="hover:text-indigo-400 transition-colors">Trung tâm trợ giúp</Link></li>
            <li><Link to="#" className="hover:text-indigo-400 transition-colors">Chính sách đổi trả</Link></li>
            <li><Link to="#" className="hover:text-indigo-400 transition-colors">Theo dõi đơn hàng</Link></li>
            <li><Link to="#" className="hover:text-indigo-400 transition-colors">Câu hỏi thường gặp</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4 text-lg">Đăng ký nhận tin</h3>
          <p className="text-sm text-slate-400 mb-4">Nhận thông tin sách mới và ưu đãi đặc biệt.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email của bạn..." 
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:outline-none focus:border-indigo-500 text-sm placeholder:text-slate-500"
              required
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors">
              <Mail className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 Modern Book. All Rights Reserved.</p>
        <div className="flex gap-4">
          <Link to="#" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
          <Link to="#" className="hover:text-white transition-colors">Bảo mật</Link>
        </div>
      </div>
    </footer>
  );
}