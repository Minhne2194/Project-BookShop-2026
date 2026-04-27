import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface Book {
  book_id: string;
  title: string;
  price: string | number;
  cover_url: string | null;
}

export function Home() {
  // --- 1. STATE & CONTEXT ---
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { handleAddToCart } = useCart();

  const newBooksScrollRef = useRef<HTMLDivElement>(null);
  const bestSellersScrollRef = useRef<HTMLDivElement>(null);

  // --- 2. FETCH DATA ---
  useEffect(() => {
    fetch('http://localhost:3000/books')
      .then((res) => res.json())
      .then((data) => {
        setBooks(data);
        setLoading(false);
      });
  }, []);

  // --- 3. CHUẨN BỊ DỮ LIỆU HIỂN THỊ CHO THANH CUỘN ---
  // Tạm thời chia mảng sách thật để giả lập Sách Mới và Bán Chạy
  const newBooksFiltered = books.slice(0, 5);
  const bestSellersFiltered = books.slice().reverse().slice(0, 5);

  // Nhân bản để thanh cuộn hoạt động mượt mà (như ý tưởng ban đầu của bạn)
  const scrollingNewBooks = [...newBooksFiltered, ...newBooksFiltered, ...newBooksFiltered, ...newBooksFiltered];
  const scrollingBestSellers = [...bestSellersFiltered, ...bestSellersFiltered, ...bestSellersFiltered, ...bestSellersFiltered];

  // --- 4. CÁC HÀM TIỆN ÍCH ---
  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 300;
      ref.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* --- HERO SECTION --- */}
      <section className="relative bg-indigo-950 text-white overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/id/1073/1920/1080')] bg-cover bg-center mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6 drop-shadow-md">
              Khám phá thế giới<br /><span className="text-indigo-400">qua từng trang sách</span>
            </h1>
            <p className="text-lg text-indigo-100 mb-8 max-w-md hidden md:block">
              Modern Book mang đến cho bạn không gian tri thức tuyệt vời với hàng ngàn tựa sách mới mỗi ngày.
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-950 font-bold rounded-full hover:bg-indigo-50 transition-colors"
            >
              Mua ngay <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex justify-end"
          >
            <div className="grid grid-cols-2 gap-4">
              <img src="https://picsum.photos/seed/book1/300/450" className="w-48 rounded-xl shadow-2xl -rotate-6 transform hover:rotate-0 transition-transform duration-500" alt="Book cover" />
              <img src="https://picsum.photos/seed/book2/300/450" className="w-48 rounded-xl shadow-2xl rotate-6 translate-y-8 transform hover:rotate-0 transition-transform duration-500" alt="Book cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURED SECTION (Banners & Tóm tắt) --- */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-11 mb-11">
          {/* Box Sách Mới */}
          <div className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-slate-200">
            <div className="flex gap-4 py-6 px-4 sm:px-6 items-center shrink-0 w-full sm:w-auto">
              <img src={scrollingNewBooks[0]?.cover_url || "https://picsum.photos/seed/nb1/200/300"} alt="New Book 1" className="w-20 md:w-28 object-cover rounded shadow-md aspect-2/3" />
              <img src={scrollingNewBooks[1]?.cover_url || "https://picsum.photos/seed/nb2/200/300"} alt="New Book 2" className="w-20 md:w-28 object-cover rounded shadow-md aspect-2/3" />
            </div>
            <div className="py-6 px-4 sm:py-8 sm:px-6 flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
                <span className="font-medium text-slate-700 text-base whitespace-nowrap">Modern Book</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">Sách mới</h3>
              <Link to="/search" className="text-indigo-600 hover:text-indigo-800 font-medium border-b border-indigo-600 inline-block w-max pb-0.5">
                Xem tất cả ({newBooksFiltered.length})
              </Link>
            </div>
          </div>

          {/* Box Bán Chạy */}
          <div className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-slate-200">
            <div className="flex gap-4 py-6 px-4 sm:px-6 items-center shrink-0 w-full sm:w-auto">
              <img src={scrollingBestSellers[0]?.cover_url || "https://picsum.photos/seed/bs1/200/300"} alt="Best Seller 1" className="w-20 md:w-28 object-cover rounded shadow-md aspect-2/3" />
              <img src={scrollingBestSellers[1]?.cover_url || "https://picsum.photos/seed/bs2/200/300"} alt="Best Seller 2" className="w-20 md:w-28 object-cover rounded shadow-md aspect-2/3" />
            </div>
            <div className="py-6 px-4 sm:py-8 sm:px-6 flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
                <span className="font-medium text-slate-700 text-base whitespace-nowrap">Modern Book</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">Bán chạy tuần này</h3>
              <Link to="/search" className="text-indigo-600 hover:text-indigo-800 font-medium border-b border-indigo-600 inline-block w-max pb-0.5">
                Xem tất cả ({bestSellersFiltered.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Promo Banners */}
        <div className="grid md:grid-cols-2 gap-11">
          <div className="bg-[#eff4fc] rounded-lg py-7 px-4 sm:py-8 sm:px-4 flex flex-col sm:flex-row relative border border-slate-200 mt-4">
            <div className="absolute -top-4 -left-2 bg-[#594d95] text-white font-bold text-xs tracking-wider uppercase px-3 py-1.5 shadow-sm">
              Sách nổi bật
              <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#3b3266] border-l-transparent"></div>
            </div>
            <div className="w-36 md:w-40 shrink-0 mx-auto sm:mx-0 mt-6 sm:mt-2 mb-5 sm:mb-0 sm:mr-6 text-center sm:text-left shadow-lg">
              <img src={books[0]?.cover_url || "https://picsum.photos/seed/feat3/300/450"} alt="Featured 1" className="w-full object-cover rounded-sm aspect-2/3" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">Mùa Xuân từ Putnam</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Một tựa sách mới từ nhà xuất bản danh tiếng. Những câu chuyện truyền cảm hứng và mang đến góc nhìn mới mẻ về cuộc sống và tình yêu.
              </p>
              <button className="bg-[#cc0f3a] hover:bg-[#a60b2e] text-white font-bold py-2.5 px-6 rounded-full transition-colors w-full sm:w-auto text-xs tracking-wide">
                TÌM HIỂU THÊM
              </button>
            </div>
          </div>

          <div className="bg-[#eff4fc] rounded-lg py-7 px-4 sm:py-8 sm:px-4 flex flex-col sm:flex-row relative border border-slate-200 mt-4">
            <div className="absolute -top-4 -left-2 bg-[#594d95] text-white font-bold text-xs tracking-wider uppercase px-3 py-1.5 shadow-sm">
              Sách nổi bật
              <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#3b3266] border-l-transparent"></div>
            </div>
            <div className="w-36 md:w-40 shrink-0 mx-auto sm:mx-0 mt-6 sm:mt-2 mb-5 sm:mb-0 sm:mr-6 text-center sm:text-left shadow-lg">
              <img src={books[1]?.cover_url || "https://picsum.photos/seed/feat4/300/450"} alt="Featured 2" className="w-full object-cover rounded-sm aspect-2/3" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">Câu Chuyện Hài Đen Tối</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Tám con người tham gia vào một chương trình thực tế kỳ lạ. Điều khởi đầu như một cơ hội nổi tiếng nhanh chóng trở nên đáng sợ.
              </p>
              <button className="bg-[#cc0f3a] hover:bg-[#a60b2e] text-white font-bold py-2.5 px-6 rounded-full transition-colors w-full sm:w-auto text-xs tracking-wide">
                TÌM HIỂU THÊM
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- DANH SÁCH CUỘN NGANG --- */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-[25px] font-serif font-bold text-black mb-4">Sách Mới Nhất</h2>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
            <span className="font-medium text-slate-700 text-base">Modern Book</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button onClick={() => scroll(newBooksScrollRef, 'left')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scroll(newBooksScrollRef, 'right')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div ref={newBooksScrollRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x no-scrollbar scroll-smooth">
          {scrollingNewBooks.map((book, idx) => (
            <Link key={`new-${book?.book_id}-${idx}`} to={`/book/${book?.book_id}`} className="min-w-[100px] md:min-w-[120px] shrink-0 snap-start bg-slate-100 rounded-md overflow-hidden aspect-2/3 shadow transition-transform hover:-translate-y-1">
              <img src={book?.cover_url || "https://placehold.co/200x300"} alt={book?.title} className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-[25px] font-serif font-bold text-black mb-4">Sách Bán Chạy</h2>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
            <span className="font-medium text-slate-700 text-base">Modern Book</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button onClick={() => scroll(bestSellersScrollRef, 'left')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => scroll(bestSellersScrollRef, 'right')} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div ref={bestSellersScrollRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x no-scrollbar scroll-smooth">
          {scrollingBestSellers.map((book, idx) => (
            <Link key={`bs-${book?.book_id}-${idx}`} to={`/book/${book?.book_id}`} className="min-w-[100px] md:min-w-[120px] shrink-0 snap-start bg-slate-100 rounded-md overflow-hidden aspect-2/3 shadow transition-transform hover:-translate-y-1">
              <img src={book?.cover_url || "https://placehold.co/200x300"} alt={book?.title} className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </section>

      {/* --- DANH SÁCH SẢN PHẨM CHÍNH (Kết hợp từ code cũ của bạn) --- */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-slate-200 mt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Gợi ý cho bạn</h2>
            <p className="text-slate-500">Khám phá những tựa sách nổi bật được chọn lọc kỹ lưỡng.</p>
          </div>
          <Link to="/search" className="hidden sm:block text-indigo-600 font-medium hover:text-indigo-800">
            Xem tất cả &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book) => (
              <div key={`grid-${book.book_id}`} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 group flex flex-col h-full hover:shadow-md transition-shadow">
                <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden rounded-lg mb-4 aspect-2/3">
                  <img
                    src={book.cover_url || "https://placehold.co/300x450"}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                <div className="flex flex-col grow">
                  <Link to={`/book/${book.book_id}`}>
                    <h3 className="font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                      {book.title}
                    </h3>
                  </Link>
                  <p className="text-indigo-600 font-bold mt-auto pt-3 text-lg">
                    {formatPrice(book.price)}
                  </p>
                </div>

                <button
                  onClick={() => handleAddToCart(book.book_id)}
                  className="w-full mt-4 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}