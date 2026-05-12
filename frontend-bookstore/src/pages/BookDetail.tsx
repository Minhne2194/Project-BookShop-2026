import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { Star, Truck, ShieldCheck, ArrowLeft, ShoppingBag, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SafeImage } from '../components/SafeImage';

interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
    category?: string;
    author?: string;
    avg_rating?: number;
    rating_count?: number;
    compare_price?: number;
    description?: string;
    isbn?: string;
    publisher?: string;
    page_count?: number;
    publish_year?: number;
    language?: string;
}

interface Review {
    review_id: string;
    rating: number;
    title?: string;
    body?: string;
    helpful_count: number;
    created_at: string;
    user: { full_name: string; email: string };
}

const API = 'http://localhost:3000';

const formatPrice = (price: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
            <Star
                key={i}
                onClick={() => onChange?.(i)}
                className={`w-5 h-5 transition-colors ${onChange ? 'cursor-pointer' : ''} ${i <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                    }`}
            />
        ))}
    </div>
);

export function BookDetail() {
    const { bookId } = useParams<{ bookId: string }>();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewTotal, setReviewTotal] = useState(0);


    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newTitle, setNewTitle] = useState('');
    const [newBody, setNewBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const { token, fetchCart } = useCart();
    const { toast } = useToast();


    useEffect(() => {
        if (!bookId) return;
        setLoading(true);
        fetch(`${API}/books/${bookId}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => { setBook(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [bookId]);


    const loadReviews = (page = 1) => {
        if (!bookId) return;
        setReviewsLoading(true);
        fetch(`${API}/reviews/book/${bookId}?page=${page}&limit=5`)
            .then(res => res.json())
            .then(data => {
                setReviews(data.data || []);
                setReviewTotal(data.meta?.total || 0);
                setReviewPage(page);
                setReviewsLoading(false);
            })
            .catch(() => setReviewsLoading(false));
    };

    useEffect(() => { loadReviews(1); }, [bookId]);

    const handleAddToCart = async () => {
        if (!book) return;
        if (!token) { toast('Vui lòng đăng nhập để thêm vào giỏ hàng!', 'info'); return; }
        const res = await fetch(`${API}/cart/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ bookId: book.book_id, quantity }),
        });
        if (res.ok) { fetchCart(); toast(`Đã thêm ${quantity} cuốn "${book.title}" vào giỏ!`, 'success'); }
        else toast('Có lỗi xảy ra khi thêm vào giỏ hàng.', 'error');
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) { toast('Vui lòng đăng nhập để đánh giá!', 'info'); return; }
        if (!book) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ book_id: book.book_id, rating: newRating, title: newTitle, body: newBody }),
            });
            if (res.ok) {
                setSubmitSuccess(true);
                setShowReviewForm(false);
                setNewTitle(''); setNewBody(''); setNewRating(5);
                setTimeout(() => setSubmitSuccess(false), 4000);
            } else {
                const err = await res.json();
                toast(err.message || 'Không thể gửi đánh giá!', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="bg-slate-50 min-h-screen py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
    );

    if (!book) return (
        <div className="bg-slate-50 min-h-screen py-20 text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Không tìm thấy sách.</h2>
            <Link to="/search" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                <ArrowLeft className="w-4 h-4" /> Quay lại cửa hàng
            </Link>
        </div>
    );

    const totalReviewPages = Math.ceil(reviewTotal / 5);

    return (
        <div className="bg-slate-50 min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <Link to="/search" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" /> Quay lại tìm kiếm
                </Link>

                <div className="grid md:grid-cols-12 gap-8 mb-12">


                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-5 lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex items-start justify-center self-start sticky top-28"
                    >
                        <div className="relative w-full max-w-[280px] mx-auto">
                            <SafeImage
                                src={book.cover_url || 'https://placehold.co/300x450'}
                                alt={book.title}
                                className="w-full h-auto object-cover rounded shadow-lg aspect-2/3"
                            />
                        </div>
                    </motion.div>


                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-7 lg:col-span-8 bg-white rounded-3xl p-6 md:p-12 shadow-sm border border-slate-100 flex flex-col"
                    >
                        <div className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wider">
                            {book.category || 'Sách chuyên mục'}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4 leading-tight">
                            {book.title}
                        </h1>
                        <p className="text-lg text-slate-600 mb-6 font-medium">
                            Tác giả: <span className="text-indigo-600">{book.author || 'Đang cập nhật'}</span>
                        </p>

                        <div className="flex items-center gap-2 mb-8 pb-8 border-b border-slate-100">
                            <StarRating value={Math.round(Number(book.avg_rating) || 0)} />
                            <span className="text-slate-700 font-bold">{Number(book.avg_rating || 0).toFixed(1)}</span>
                            <span className="text-slate-400">({book.rating_count || 0} đánh giá)</span>
                        </div>

                        <div className="flex items-end gap-4 mb-8">
                            <span className="text-4xl font-bold text-slate-900">{formatPrice(book.price)}</span>
                            {book.compare_price && (
                                <span className="text-xl text-slate-400 line-through mb-1">{formatPrice(book.compare_price)}</span>
                            )}
                        </div>

                        <p className="text-slate-600 leading-relaxed mb-8">
                            {book.description || 'Chúng tôi đang cập nhật thêm nội dung giới thiệu cho cuốn sách này.'}
                        </p>

                        <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg mb-4">Thông tin chi tiết</h3>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm">
                                {[
                                    ['Mã ISBN', book.isbn],
                                    ['Nhà xuất bản', book.publisher],
                                    ['Năm xuất bản', book.publish_year],
                                    ['Số trang', book.page_count ? `${book.page_count} trang` : null],
                                    ['Ngôn ngữ', book.language === 'vi' ? 'Tiếng Việt' : book.language === 'en' ? 'Tiếng Anh' : book.language],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <span className="text-slate-500 block mb-1">{label}</span>
                                        <span className="font-medium text-slate-900">{val || 'Đang cập nhật'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>


                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                            <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 w-full sm:w-32 h-12">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold text-xl">-</button>
                                <span className="flex-1 text-center font-bold text-slate-900">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold text-xl">+</button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                <ShoppingBag className="w-5 h-5" /> Thêm vào giỏ hàng
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-auto">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Truck className="w-5 h-5 text-indigo-600" />
                                <span className="font-medium">Miễn phí giao hàng cho đơn từ 250k</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium">Sách chính hãng 100%, đổi trả trong 7 ngày</span>
                            </div>
                        </div>
                    </motion.div>
                </div>


                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">
                            Đánh giá từ độc giả
                            <span className="ml-2 text-base font-normal text-slate-400">({reviewTotal} đánh giá)</span>
                        </h2>
                        {token && !showReviewForm && (
                            <button
                                onClick={() => setShowReviewForm(true)}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-colors text-sm"
                            >
                                <Send className="w-4 h-4" /> Viết đánh giá
                            </button>
                        )}
                    </div>


                    <AnimatePresence>
                        {submitSuccess && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4"
                            >
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                <span>Cảm ơn bạn đã đánh giá! Đánh giá của bạn sẽ hiển thị sau khi được kiểm duyệt.</span>
                            </motion.div>
                        )}
                    </AnimatePresence>


                    <AnimatePresence>
                        {showReviewForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleSubmitReview}
                                className="mb-8 bg-indigo-50 rounded-2xl p-6 border border-indigo-100"
                            >
                                <h3 className="font-bold text-slate-900 mb-4">Đánh giá của bạn</h3>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-600 mb-2">Số sao</label>
                                    <StarRating value={newRating} onChange={setNewRating} />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-600 mb-2">Tiêu đề (tuỳ chọn)</label>
                                    <input
                                        type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                        placeholder="Tóm tắt cảm nhận của bạn..."
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-600 mb-2">Nội dung đánh giá</label>
                                    <textarea
                                        value={newBody} onChange={e => setNewBody(e.target.value)}
                                        placeholder="Chia sẻ trải nghiệm đọc sách của bạn..."
                                        rows={4}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button type="submit" disabled={submitting}
                                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
                                    >
                                        {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                                    </button>
                                    <button type="button" onClick={() => setShowReviewForm(false)}
                                        className="text-slate-500 hover:text-slate-700 px-4 py-2.5 rounded-full text-sm transition-colors"
                                    >
                                        Huỷ
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>


                    {reviewsLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {reviews.map(review => (
                                <motion.div
                                    key={review.review_id}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    className="border-b border-slate-100 pb-6 last:border-0"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <span className="font-semibold text-slate-900">{review.user?.full_name || 'Ẩn danh'}</span>
                                            <span className="text-slate-400 text-sm ml-2">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                        <StarRating value={review.rating} />
                                    </div>
                                    {review.title && <p className="font-semibold text-slate-800 mb-1">{review.title}</p>}
                                    {review.body && <p className="text-slate-600 text-sm leading-relaxed">{review.body}</p>}
                                    {review.helpful_count > 0 && (
                                        <p className="text-xs text-slate-400 mt-2">{review.helpful_count} người thấy hữu ích</p>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}


                    {totalReviewPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p} onClick={() => loadReviews(p)}
                                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${p === reviewPage ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}