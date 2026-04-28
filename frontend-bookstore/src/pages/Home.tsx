import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SafeImage } from '../components/SafeImage';

interface Book {
  description: string;
  book_id: string;
  title: string;
  price: string | number;
  cover_url: string | null;
}

export function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [bestSellers, setBestSellers] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { handleAddToCart } = useCart();

  const newBooksScrollRef = useRef<HTMLDivElement>(null);
  const bestSellersScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      Promise.all([
        fetch('http://localhost:3000/books?limit=12').then(res => res.json()),
        fetch('http://localhost:3000/books?sort=newest&limit=10').then(res => res.json()),
        fetch('http://localhost:3000/books?sort=bestseller&limit=10').then(res => res.json())
      ]).then(([featuredRes, newRes, bsRes]) => {
        setFeaturedBooks(featuredRes.data || featuredRes);
        setNewBooks(newRes.data || newRes);
        setBestSellers(bsRes.data || bsRes);
        setLoading(false);
      }).catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
    }, []);

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
              {featuredBooks[0] && <SafeImage src={featuredBooks[0].cover_url || "https://placehold.co/300x450"} className="w-48 rounded-xl shadow-2xl -rotate-6 transform hover:rotate-0 transition-transform duration-500 object-cover aspect-2/3" alt={featuredBooks[0].title} />}
              {featuredBooks[1] && <SafeImage src={featuredBooks[1].cover_url || "https://placehold.co/300x450"} className="w-48 rounded-xl shadow-2xl rotate-6 translate-y-8 transform hover:rotate-0 transition-transform duration-500 object-cover aspect-2/3" alt={featuredBooks[1].title} />}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-11 mb-11">
          <div className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-slate-200">
            <div className="flex gap-3 py-6 px-4 sm:px-6 items-center shrink-0 w-full sm:w-auto">
              {newBooks[0] && (
                <SafeImage src={newBooks[0].cover_url || "https://placehold.co/200x300"} alt={newBooks[0].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
              )}
              {newBooks[1] && (
                <SafeImage src={newBooks[1].cover_url || "https://placehold.co/200x300"} alt={newBooks[1].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
              )}
            </div>
            <div className="py-6 px-4 sm:py-8 sm:px-6 flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
                <span className="font-medium text-slate-700 text-base whitespace-nowrap">Modern Book</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">Sách mới</h3>
              <Link to="/new-books" className="text-indigo-600 hover:text-indigo-800 font-medium border-b border-indigo-600 inline-block w-max pb-0.5">
                Xem tất cả
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-slate-200">
            <div className="flex gap-3 py-6 px-4 sm:px-6 items-center shrink-0 w-full sm:w-auto">
              {bestSellers[0] && (
                <SafeImage src={bestSellers[0].cover_url || "https://placehold.co/200x300"} alt={bestSellers[0].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
              )}
              {bestSellers[1] && (
                <SafeImage src={bestSellers[1].cover_url || "https://placehold.co/200x300"} alt={bestSellers[1].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
              )}
            </div>
            <div className="py-6 px-4 sm:py-8 sm:px-6 flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
                <span className="font-medium text-slate-700 text-base whitespace-nowrap">Modern Book</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">Bán chạy tuần này</h3>
              <Link to="/best-sellers" className="text-indigo-600 hover:text-indigo-800 font-medium border-b border-indigo-600 inline-block w-max pb-0.5">
                Xem tất cả
              </Link>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-11">
          {featuredBooks[2] && (
            <div className="bg-[#eff4fc] rounded-lg py-7 px-4 sm:py-8 sm:px-4 flex flex-col sm:flex-row relative border border-slate-200 mt-4">
              <div className="absolute -top-4 -left-2 bg-[#594d95] text-white font-bold text-xs tracking-wider uppercase px-3 py-1.5 shadow-sm">
                Sách nổi bật
                <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#3b3266] border-l-transparent"></div>
              </div>
              <div className="w-28 md:w-32 shrink-0 mx-auto sm:mx-0 mt-6 sm:mt-2 mb-5 sm:mb-0 sm:mr-6 text-center sm:text-left bg-white p-2 rounded-md shadow-sm">
                <SafeImage src={featuredBooks[2].cover_url || "https://placehold.co/300x450"} alt={featuredBooks[2].title} className="w-full object-contain mix-blend-multiply aspect-2/3" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{featuredBooks[2].title}</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed line-clamp-3">
                  {featuredBooks[2].description || "Một tác phẩm nổi bật với những câu chuyện truyền cảm hứng và mang đến góc nhìn mới mẻ về cuộc sống."}
                </p>
                <Link to={`/book/${featuredBooks[2].book_id}`} className="bg-[#cc0f3a] hover:bg-[#a60b2e] text-white font-bold py-2.5 px-6 rounded-full transition-colors w-full sm:w-auto text-xs tracking-wide text-center inline-block">
                  TÌM HIỂU THÊM
                </Link>
              </div>
            </div>
          )}

          {featuredBooks[3] && (
            <div className="bg-[#eff4fc] rounded-lg py-7 px-4 sm:py-8 sm:px-4 flex flex-col sm:flex-row relative border border-slate-200 mt-4">
              <div className="absolute -top-4 -left-2 bg-[#594d95] text-white font-bold text-xs tracking-wider uppercase px-3 py-1.5 shadow-sm">
                Sách nổi bật
                <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#3b3266] border-l-transparent"></div>
              </div>
              <div className="w-28 md:w-32 shrink-0 mx-auto sm:mx-0 mt-6 sm:mt-2 mb-5 sm:mb-0 sm:mr-6 text-center sm:text-left bg-white p-2 rounded-md shadow-sm">
                <SafeImage src={featuredBooks[3].cover_url || "https://placehold.co/300x450"} alt={featuredBooks[3].title} className="w-full object-contain mix-blend-multiply aspect-2/3" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight line-clamp-2">{featuredBooks[3].title}</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed line-clamp-3">
                  {featuredBooks[3].description || "Khám phá cuốn sách thú vị đang thu hút sự chú ý của đông đảo bạn đọc."}
                </p>
                <Link to={`/book/${featuredBooks[3].book_id}`} className="bg-[#cc0f3a] hover:bg-[#a60b2e] text-white font-bold py-2.5 px-6 rounded-full transition-colors w-full sm:w-auto text-xs tracking-wide text-center inline-block">
                  TÌM HIỂU THÊM
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-[25px] font-serif font-bold text-black mb-4">Sách Mới Nhất</h2>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-lg">M</div>
            <span className="font-medium text-slate-700 text-base">Modern Book</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/new-books" className="hidden sm:block text-indigo-600 font-medium hover:text-indigo-800 text-sm">Xem tất cả</Link>
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
          {newBooks.map((book, idx) => (
            <Link key={`new-${book?.book_id}-${idx}`} to={`/book/${book?.book_id}`} className="w-[120px] md:w-[140px] shrink-0 snap-start bg-white border border-slate-100 rounded-md overflow-hidden aspect-2/3 hover:shadow-md transition-shadow p-2 flex items-center justify-center">
              <SafeImage src={book?.cover_url || "https://placehold.co/200x300"} alt={book?.title} className="w-full h-full object-contain mix-blend-multiply hover:-translate-y-1 transition-transform" />
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
            <Link to="/best-sellers" className="hidden sm:block text-indigo-600 font-medium hover:text-indigo-800 text-sm">Xem tất cả</Link>
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
          {bestSellers.map((book, idx) => (
            <Link key={`bs-${book?.book_id}-${idx}`} to={`/book/${book?.book_id}`} className="w-[120px] md:w-[140px] shrink-0 snap-start bg-white border border-slate-100 rounded-md overflow-hidden aspect-2/3 hover:shadow-md transition-shadow p-2 flex items-center justify-center">
              <SafeImage src={book?.cover_url || "https://placehold.co/200x300"} alt={book?.title} className="w-full h-full object-contain mix-blend-multiply hover:-translate-y-1 transition-transform" />
            </Link>
          ))}
        </div>
      </section>

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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {featuredBooks.map((book) => (
                <div key={`grid-${book.book_id}`} className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 group flex flex-col h-full hover:shadow-md transition-shadow">
                  <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden rounded-lg mb-3 aspect-2/3 bg-slate-50 items-center justify-center p-2">
                    <SafeImage
                    src={book.cover_url || "https://placehold.co/300x450"}
                    alt={book.title}
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
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