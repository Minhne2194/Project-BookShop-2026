import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Sparkles, TrendingUp, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SafeImage } from '../components/SafeImage';
import { PromoBanner } from '../components/PromoBanner';

const API = 'http://localhost:3000';

interface Book {
  description: string;
  book_id: string;
  title: string;
  price: string | number;
  cover_url: string | null;
}

interface RecommendedBook {
  book_id: string;
  title: string;
  price: number;
  cover_url: string | null;
  avg_rating: number;
  author: string;
  score: number;
  reasons: string[];
}

// ── Reusable horizontal scroll section ──
function HorizontalBookSection({
  title,
  icon,
  books,
  scrollRef,
  linkTo,
  linkLabel = 'Xem tất cả',
  renderCard,
}: {
  title: string;
  icon?: React.ReactNode;
  books: any[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  linkTo?: string;
  linkLabel?: string;
  renderCard: (book: any, idx: number) => React.ReactNode;
}) {
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-[25px] font-serif font-bold text-black">{title}</h2>
        </div>
        <div className="flex items-center gap-4">
          {linkTo && (
            <Link to={linkTo} className="hidden sm:block text-indigo-600 font-medium hover:text-indigo-800 text-sm">
              {linkLabel}
            </Link>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-slate-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x no-scrollbar scroll-smooth">
        {books.map((book, idx) => renderCard(book, idx))}
      </div>
    </section>
  );
}

export function Home() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [bestSellers, setBestSellers] = useState<Book[]>([]);
  const [englishBooks, setEnglishBooks] = useState<Book[]>([]);

  // Recommendation states
  const [forYouBooks, setForYouBooks] = useState<RecommendedBook[]>([]);
  const [forYouType, setForYouType] = useState<'personalized' | 'trending'>('trending');
  const [trendingBooks, setTrendingBooks] = useState<RecommendedBook[]>([]);
  const [becauseYouBought, setBecauseYouBought] = useState<RecommendedBook[]>([]);
  const [recLoading, setRecLoading] = useState(true);

  const [loading, setLoading] = useState<boolean>(true);
  const { handleAddToCart, token } = useCart();

  const newBooksScrollRef = useRef<HTMLDivElement>(null);
  const bestSellersScrollRef = useRef<HTMLDivElement>(null);
  const englishBooksScrollRef = useRef<HTMLDivElement>(null);
  const forYouScrollRef = useRef<HTMLDivElement>(null);
  const trendingScrollRef = useRef<HTMLDivElement>(null);
  const becauseScrollRef = useRef<HTMLDivElement>(null);

  // Load standard book lists
  useEffect(() => {
    Promise.all([
      fetch(`${API}/books?limit=12`).then(res => res.json()),
      fetch(`${API}/books?sort=newest&limit=10`).then(res => res.json()),
      fetch(`${API}/books?sort=bestseller&limit=10`).then(res => res.json()),
      fetch(`${API}/books?lang=en&limit=10`).then(res => res.json()),
    ]).then(([featuredRes, newRes, bsRes, enRes]) => {
      setFeaturedBooks(featuredRes.data || featuredRes);
      setNewBooks(newRes.data || newRes);
      setBestSellers(bsRes.data || bsRes);
      setEnglishBooks(enRes.data || enRes);
      setLoading(false);
    }).catch(err => {
      console.error('Lỗi lấy dữ liệu:', err);
      setLoading(false);
    });
  }, []);

  // Load recommendations
  useEffect(() => {
    setRecLoading(true);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const forYouFetch = fetch(`${API}/recommendations/for-you?limit=12`, { headers })
      .then(r => r.json())
      .catch(() => ({ type: 'trending', data: [] }));

    const trendingFetch = fetch(`${API}/recommendations/trending?limit=12`)
      .then(r => r.json())
      .catch(() => ({ data: [] }));

    const becauseFetch = token
      ? fetch(`${API}/recommendations/because-you-bought?limit=8`, { headers })
          .then(r => r.ok ? r.json() : { data: [] })
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] });

    Promise.all([forYouFetch, trendingFetch, becauseFetch]).then(([forYou, trending, because]) => {
      setForYouBooks(forYou.data || []);
      setForYouType(forYou.type || 'trending');
      setTrendingBooks(trending.data || []);
      setBecauseYouBought(because.data || []);
      setRecLoading(false);
    });
  }, [token]);

  const formatPrice = (price: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

  // Simple cover card (for new/bestsellers/english)
  const renderCoverCard = (book: Book, idx: number, prefix: string) => (
    <Link
      key={`${prefix}-${book?.book_id}-${idx}`}
      to={`/book/${book?.book_id}`}
      className="w-[120px] md:w-[140px] shrink-0 snap-start bg-white border border-slate-100 rounded-md overflow-hidden aspect-2/3 hover:shadow-md transition-shadow p-2 flex items-center justify-center"
    >
      <SafeImage
        src={book?.cover_url || 'https://placehold.co/200x300'}
        alt={book?.title}
        className="w-full h-full object-contain mix-blend-multiply hover:-translate-y-1 transition-transform"
      />
    </Link>
  );

  // Rich recommendation card with reasons
  const renderRecCard = (book: RecommendedBook, idx: number, prefix: string) => (
    <div
      key={`${prefix}-${book.book_id}-${idx}`}
      className="w-[160px] md:w-[180px] shrink-0 snap-start bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col group"
    >
      <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden bg-slate-50 p-3 aspect-2/3">
        <SafeImage
          src={book.cover_url || 'https://placehold.co/200x300'}
          alt={book.title}
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/book/${book.book_id}`}>
          <h3 className="text-xs font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors mb-1">
            {book.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-500 mb-1 truncate">{book.author}</p>
        {book.avg_rating > 0 && (
          <div className="flex items-center gap-1 mb-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-600">{Number(book.avg_rating).toFixed(1)}</span>
          </div>
        )}
        <p className="text-indigo-600 font-bold text-sm mt-auto">{formatPrice(book.price)}</p>
        {book.reasons?.[0] && (
          <span className="mt-1.5 inline-block text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full truncate">
            {book.reasons[0]}
          </span>
        )}
        <button
          onClick={() => handleAddToCart(book.book_id)}
          className="mt-2 w-full bg-slate-900 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1"
        >
          <ShoppingCart className="w-3 h-3" /> Thêm vào giỏ
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── Hero ── */}
      <section className="relative bg-indigo-950 text-white overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/id/1073/1920/1080')] bg-cover bg-center mix-blend-overlay" />
        <div className="max-w-7xl mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
              {featuredBooks[0] && (
                <SafeImage src={featuredBooks[0].cover_url || 'https://placehold.co/300x450'} className="w-48 rounded-xl shadow-2xl -rotate-6 transform hover:rotate-0 transition-transform duration-500 object-cover aspect-2/3" alt={featuredBooks[0].title} />
              )}
              {featuredBooks[1] && (
                <SafeImage src={featuredBooks[1].cover_url || 'https://placehold.co/300x450'} className="w-48 rounded-xl shadow-2xl rotate-6 translate-y-8 transform hover:rotate-0 transition-transform duration-500 object-cover aspect-2/3" alt={featuredBooks[1].title} />
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <PromoBanner />

      {/* ── Category Cards ── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-11 mb-11">
          {[
            { books: newBooks, label: 'Sách mới', to: '/new-books' },
            { books: bestSellers, label: 'Bán chạy tuần này', to: '/best-sellers' },
            { books: englishBooks, label: 'Sách tiếng Anh', to: '/search?lang=en' },
          ].map(({ books, label, to }) => (
            <div key={label} className="bg-white rounded-lg flex flex-col sm:flex-row shadow-sm border border-slate-200">
              <div className="flex gap-3 py-6 px-4 sm:px-6 items-center shrink-0 w-full sm:w-auto">
                {books[0] && (
                  <SafeImage src={books[0].cover_url || 'https://placehold.co/200x300'} alt={books[0].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
                )}
                {books[1] && (
                  <SafeImage src={books[1].cover_url || 'https://placehold.co/200x300'} alt={books[1].title} className="w-16 md:w-20 object-contain mix-blend-multiply bg-slate-50 rounded p-1 aspect-2/3" />
                )}
              </div>
              <div className="py-6 px-4 sm:py-8 sm:px-6 flex-1 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-[#594d95] text-white flex items-center justify-center rounded-full font-serif font-bold text-sm shrink-0">M</div>
                  <span className="font-medium text-slate-700 text-sm truncate">Modern Book</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-6">{label}</h3>
                <Link to={to} className="text-indigo-600 hover:text-indigo-800 font-medium border-b border-indigo-600 inline-block w-max pb-0.5">
                  Xem tất cả
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Featured pairs */}
        <div className="grid md:grid-cols-2 gap-11">
          {[featuredBooks[2], featuredBooks[3]].filter(Boolean).map((book, i) => (
            <div key={book.book_id} className="bg-[#eff4fc] rounded-lg py-7 px-4 sm:py-8 sm:px-4 flex flex-col sm:flex-row relative border border-slate-200 mt-4">
              <div className="absolute -top-4 -left-2 bg-[#594d95] text-white font-bold text-xs tracking-wider uppercase px-3 py-1.5 shadow-sm">
                Sách nổi bật
                <div className="absolute top-full left-0 w-0 h-0 border-t-[6px] border-l-[6px] border-t-[#3b3266] border-l-transparent"></div>
              </div>
              <div className="w-28 md:w-32 shrink-0 mx-auto sm:mx-0 mt-6 sm:mt-2 mb-5 sm:mb-0 sm:mr-6 text-center sm:text-left bg-white p-2 rounded-md shadow-sm">
                <SafeImage src={book.cover_url || 'https://placehold.co/300x450'} alt={book.title} className="w-full object-contain mix-blend-multiply aspect-2/3" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed line-clamp-3">
                  {book.description || (i === 0 ? 'Một tác phẩm nổi bật với những câu chuyện truyền cảm hứng và mang đến góc nhìn mới mẻ về cuộc sống.' : 'Khám phá cuốn sách thú vị đang thu hút sự chú ý của đông đảo bạn đọc.')}
                </p>
                <Link to={`/book/${book.book_id}`} className="bg-[#cc0f3a] hover:bg-[#a60b2e] text-white font-bold py-2.5 px-6 rounded-full transition-colors w-full sm:w-auto text-xs tracking-wide text-center inline-block">
                  TÌM HIỂU THÊM
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sách Mới Nhất ── */}
      <HorizontalBookSection
        title="Sách Mới Nhất"
        books={newBooks}
        scrollRef={newBooksScrollRef}
        linkTo="/new-books"
        renderCard={(book, idx) => renderCoverCard(book, idx, 'new')}
      />

      {/* ── Sách Bán Chạy ── */}
      <HorizontalBookSection
        title="Sách Bán Chạy"
        books={bestSellers}
        scrollRef={bestSellersScrollRef}
        linkTo="/best-sellers"
        renderCard={(book, idx) => renderCoverCard(book, idx, 'bs')}
      />

      {/* ── English Books ── */}
      {englishBooks.length > 0 && (
        <HorizontalBookSection
          title="English Books"
          books={englishBooks}
          scrollRef={englishBooksScrollRef}
          linkTo="/search?lang=en"
          linkLabel="View All"
          renderCard={(book, idx) => renderCoverCard(book, idx, 'en')}
        />
      )}

      {/* ── Gợi ý cho bạn (Personalized / Trending) ── */}
      <section className="max-w-7xl mx-auto px-4 py-16 border-t border-slate-200 mt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {forYouType === 'personalized' ? 'Gợi ý cho bạn' : 'Khám phá sách hay'}
              </h2>
            </div>
            <p className="text-slate-500">
              {forYouType === 'personalized'
                ? 'Dựa trên sở thích và lịch sử mua hàng của bạn.'
                : 'Những tựa sách nổi bật được chọn lọc kỹ lưỡng.'}
            </p>
          </div>
          <Link to="/search" className="hidden sm:block text-indigo-600 font-medium hover:text-indigo-800">
            Xem tất cả &rarr;
          </Link>
        </div>

        {recLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : forYouBooks.length > 0 ? (
          <div ref={forYouScrollRef} className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x no-scrollbar scroll-smooth">
            {forYouBooks.map((book, idx) => renderRecCard(book, idx, 'foryou'))}
          </div>
        ) : (
          !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {featuredBooks.map((book) => (
                <div key={`grid-${book.book_id}`} className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 group flex flex-col h-full hover:shadow-md transition-shadow">
                  <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden rounded-lg mb-3 aspect-2/3 bg-slate-50 items-center justify-center p-2">
                    <SafeImage src={book.cover_url || 'https://placehold.co/300x450'} alt={book.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                  </Link>
                  <div className="flex flex-col grow">
                    <Link to={`/book/${book.book_id}`}>
                      <h3 className="font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors">{book.title}</h3>
                    </Link>
                    <p className="text-indigo-600 font-bold mt-auto pt-3 text-lg">{formatPrice(book.price)}</p>
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
          )
        )}
      </section>

      {/* ── Vì bạn đã mua (chỉ khi logged-in và có data) ── */}
      {token && becauseYouBought.length > 0 && (
        <HorizontalBookSection
          title="Vì bạn đã mua..."
          icon={<Sparkles className="w-5 h-5 text-violet-600" />}
          books={becauseYouBought}
          scrollRef={becauseScrollRef}
          renderCard={(book, idx) => renderRecCard(book, idx, 'because')}
        />
      )}

      {/* ── Đang thịnh hành ── */}
      {trendingBooks.length > 0 && (
        <HorizontalBookSection
          title="Đang thịnh hành"
          icon={<TrendingUp className="w-5 h-5 text-rose-500" />}
          books={trendingBooks}
          scrollRef={trendingScrollRef}
          renderCard={(book, idx) => renderRecCard(book, idx, 'trending')}
        />
      )}
    </div>
  );
}