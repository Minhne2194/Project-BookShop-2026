import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Star, Truck, ShieldCheck, ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

// Cập nhật Interface khớp với dữ liệu API
interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
    // Các trường dưới đây có thể API của bạn chưa có, mình để optional (?) và thêm fallback ở UI
    category?: string;
    author?: string;
    rating?: number;
    reviewsCount?: number;
    originalPrice?: number;
    description?: string;
}

export function BookDetail() {
    const { id } = useParams<{ id: string }>();

    // --- STATES ---
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [quantity, setQuantity] = useState<number>(1);

    // Lấy token và hàm cập nhật giỏ hàng từ Context
    const { token, fetchCart } = useCart();

    // --- FETCH DỮ LIỆU ---
    useEffect(() => {
        setLoading(true);
        // Tạm thời fetch tất cả sách và lọc ra cuốn có book_id trùng với id trên URL
        // (Nếu backend bạn có API riêng kiểu /books/:id thì đổi lại để tối ưu hơn nhé)
        fetch('http://localhost:3000/books')
            .then((res) => res.json())
            .then((data: Book[]) => {
                const foundBook = data.find((b) => b.book_id === id);
                setBook(foundBook || null);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi khi tải chi tiết sách:", err);
                setLoading(false);
            });
    }, [id]);

    // --- LOGIC THÊM VÀO GIỎ HÀNG (CÓ SỐ LƯỢNG) ---
    const handleAddToCartWithQuantity = async () => {
        if (!book) return;

        if (!token) {
            alert("Vui lòng đăng nhập để thêm vào giỏ hàng!");
            return;
        }

        const res = await fetch('http://localhost:3000/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ bookId: book.book_id, quantity: quantity })
        });

        if (res.ok) {
            fetchCart(); // Cập nhật lại số lượng trên giỏ hàng ở Header
            alert(`Đã thêm ${quantity} cuốn "${book.title}" vào giỏ!`);
        } else {
            alert("Có lỗi xảy ra khi thêm vào giỏ hàng.");
        }
    };

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    // --- RENDER TRẠNG THÁI LOADING & ERROR ---
    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen py-20 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="bg-slate-50 min-h-screen py-20 text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Không tìm thấy sách.</h2>
                <Link to="/search" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Quay lại cửa hàng
                </Link>
            </div>
        );
    }

    // --- RENDER GIAO DIỆN CHÍNH ---
    return (
        <div className="bg-slate-50 min-h-screen py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Nút quay lại */}
                <Link to="/search" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-5 h-5" /> Quay lại tìm kiếm
                </Link>

                <div className="grid md:grid-cols-12 gap-8 mb-12">

                    {/* Cột Trái: Ảnh Sách */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="md:col-span-5 lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex items-start justify-center self-start sticky top-28"
                    >
                        <div className="relative w-full max-w-[280px] mx-auto">
                            <img
                                src={book.cover_url || "https://placehold.co/300x450"}
                                alt={book.title}
                                className="w-full h-auto object-cover rounded shadow-lg aspect-2/3"
                            />
                        </div>
                    </motion.div>

                    {/* Cột Phải: Thông tin chi tiết */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
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
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-5 h-5 ${i < Math.floor(book.rating || 5) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                                ))}
                            </div>
                            <span className="text-slate-700 font-bold">{book.rating || '5.0'}</span>
                            <span className="text-slate-400">({book.reviewsCount || 0} đánh giá)</span>
                        </div>

                        <div className="flex items-end gap-4 mb-8">
                            <span className="text-4xl font-bold text-slate-900">{formatPrice(book.price)}</span>
                            {book.originalPrice && (
                                <span className="text-xl text-slate-400 line-through mb-1">{formatPrice(book.originalPrice)}</span>
                            )}
                        </div>

                        <p className="text-slate-600 leading-relaxed mb-8">
                            {book.description || 'Một tựa sách hấp dẫn đang chờ bạn khám phá. Chúng tôi đang cập nhật thêm nội dung giới thiệu chi tiết cho cuốn sách này.'}
                        </p>

                        {/* Khu vực thao tác */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                            <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 w-full sm:w-32 h-12">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold text-xl">-</button>
                                <span className="flex-1 text-center font-bold text-slate-900">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold text-xl">+</button>
                            </div>

                            <button
                                onClick={handleAddToCartWithQuantity}
                                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                <ShoppingBag className="w-5 h-5" /> Thêm vào giỏ hàng
                            </button>
                        </div>

                        {/* Thông tin khuyến mãi/bảo hành */}
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
            </div>
        </div>
    );
}