import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Khai báo Interface
interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
    author?: string;
}

export function Cart() {
    // --- 1. STATES & CONTEXT ---
    const { token, cartItems, fetchCart } = useCart();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // --- 2. FETCH THÔNG TIN SÁCH ĐỂ GHÉP VỚI GIỎ HÀNG ---
    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:3000/books')
            .then((res) => res.json())
            .then((data) => {
                setBooks(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi tải sách:", err);
                setLoading(false);
            });
    }, []);

    // --- 3. GHÉP DỮ LIỆU (MERGE DATA) ---
    const cartDetails = useMemo(() => {
        return cartItems.map(cartItem => {
            const bookDetail = books.find(b => b.book_id === cartItem.bookId);
            return { ...cartItem, ...bookDetail };
        }).filter(item => item.title); // Chỉ giữ lại những item tìm thấy thông tin sách
    }, [cartItems, books]);

    // Tính tổng tiền
    const totalPrice = cartDetails.reduce((sum, item) => {
        return sum + (Number(item.price || 0) * item.quantity);
    }, 0);

    // --- 4. CÁC HÀM TƯƠNG TÁC API GIỎ HÀNG ---
    // (Lưu ý: Bạn cần chỉnh sửa URL '/cart/update' và '/cart/remove' cho đúng với Backend của bạn)

    const handleUpdateQuantity = async (bookId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        if (!token) return;

        try {
            const res = await fetch('http://localhost:3000/cart/update', {
                method: 'PUT', // Hoặc POST tùy backend của bạn
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, quantity: newQuantity })
            });
            if (res.ok) fetchCart(); // Cập nhật lại UI
        } catch (err) {
            console.error("Lỗi cập nhật số lượng", err);
        }
    };

    const handleRemove = async (bookId: string) => {
        if (!token) return;
        if (!window.confirm("Bạn có chắc muốn xóa cuốn sách này khỏi giỏ hàng?")) return;

        try {
            const res = await fetch('http://localhost:3000/cart/remove', {
                method: 'DELETE', // Hoặc POST tùy backend của bạn
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ bookId })
            });
            if (res.ok) fetchCart(); // Cập nhật lại UI
        } catch (err) {
            console.error("Lỗi xóa sản phẩm", err);
        }
    };

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    // --- 5. RENDER GIAO DIỆN ---

    // Trạng thái chưa đăng nhập
    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Vui lòng đăng nhập</h2>
                <p className="text-slate-500 mb-8 text-center">Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình.</p>
            </div>
        );
    }

    // Trạng thái Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Trạng thái Giỏ hàng trống
    if (cartDetails.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty Cart" className="w-64 h-64 object-contain mb-8 opacity-50" />
                <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Giỏ hàng của bạn đang trống</h2>
                <p className="text-slate-500 mb-8 text-center">Hãy tìm thêm những cuốn sách hay để lấp đầy giỏ hàng nhé!</p>
                <Link to="/search" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors">
                    Tiếp tục mua sắm
                </Link>
            </div>
        );
    }

    // Giao diện chính Giỏ hàng
    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Giỏ Hàng</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cột danh sách sản phẩm */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartDetails.map(item => (
                            <motion.div
                                layout
                                key={item.bookId}
                                className="bg-white p-4 flex gap-4 rounded-2xl shadow-sm border border-slate-100 items-center"
                            >
                                <img src={item.cover_url || "https://placehold.co/100x150"} alt={item.title} className="w-20 h-28 object-cover rounded-lg shadow-sm" />
                                <div className="flex-1">
                                    <Link to={`/book/${item.bookId}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                                        {item.title}
                                    </Link>
                                    <p className="text-sm text-slate-500 mb-2">{item.author || "Đang cập nhật"}</p>
                                    <p className="font-bold text-indigo-600">{formatPrice(item.price!)}</p>
                                </div>

                                <div className="flex flex-col items-end gap-4">
                                    <button onClick={() => handleRemove(item.bookId)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                                        <button onClick={() => handleUpdateQuantity(item.bookId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold">-</button>
                                        <span className="w-8 text-center font-bold text-slate-900 text-sm">{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.bookId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold">+</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Cột Tổng tiền & Thanh toán */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Tổng cộng</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-600">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-emerald-600 font-medium">Miễn phí</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-8 pt-4 border-t border-slate-100">
                                <span className="font-bold text-slate-900">Tổng thanh toán</span>
                                <span className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                Tiến hành thanh toán <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}