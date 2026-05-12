import { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, Tag, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SafeImage } from '../components/SafeImage';
import { useToast } from '../components/Toast';

interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
    author?: string;
}

export function Cart() {
    const { token, cartItems, fetchCart } = useCart();
    const { toast } = useToast();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

    useEffect(() => {
        if (!confirmRemoveId) return;
        const timer = setTimeout(() => setConfirmRemoveId(null), 3000);
        return () => clearTimeout(timer);
    }, [confirmRemoveId]);

    useEffect(() => {
        if (cartItems.length === 0) {
            setBooks([]);
            setLoading(false);
            return;
        }

        const ids = cartItems.map(item => item.bookId).join(',');
        
        setLoading(true);
        fetch(`http://localhost:3000/books?ids=${ids}`)
            .then((res) => res.json())
            .then((resData) => {
                const data = resData.data ? resData.data : resData;
                setBooks(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Lỗi tải sách:", err);
                setLoading(false);
            });
    }, [cartItems]);

    const cartDetails = useMemo(() => {
        return cartItems.map(cartItem => {
            const bookDetail = books.find(b => b.book_id === cartItem.bookId);
            return { ...cartItem, ...bookDetail };
        }).filter(item => item.title);
    }, [cartItems, books]);

    const shippingFee = 30000;
    const subtotal = cartDetails.reduce((sum, item) => {
        return sum + (Number(item.price || 0) * item.quantity);
    }, 0);


    const handleUpdateQuantity = async (bookId: string, newQuantity: number) => {
        if (!token) return;

        if (newQuantity <= 0) {
            setConfirmRemoveId(bookId);
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, quantity: newQuantity })
            });
            if (res.ok) fetchCart();
        } catch (err) {
            console.error("Lỗi cập nhật số lượng", err);
        }
    };

    const handleRemove = async (bookId: string) => {
        if (!token) return;

        if (confirmRemoveId !== bookId) {
            setConfirmRemoveId(bookId);
            return;
        }

        setConfirmRemoveId(null);
        try {
            const res = await fetch(`http://localhost:3000/cart/remove/${bookId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const item = cartDetails.find(d => d.bookId === bookId);
                toast(`Đã xóa "${item?.title || 'sản phẩm'}" khỏi giỏ hàng`, 'info');
                fetchCart();
            }
        } catch (err) {
            console.error("Lỗi xóa sản phẩm", err);
        }
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim() || !token) return;
        setIsValidatingPromo(true);
        try {
            const res = await fetch('http://localhost:3000/cart/validate-promo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code: promoCode }),
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedPromo(promoCode.trim().toUpperCase());
                toast(`${data.description} — đã áp dụng mã ${promoCode.trim().toUpperCase()}`, 'success');
            } else {
                toast(data.message || 'Mã không hợp lệ.', 'error');
            }
        } catch {
            toast('Không thể kiểm tra mã. Vui lòng thử lại.', 'error');
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
    };

    const effectiveShippingFee = appliedPromo ? 0 : shippingFee;
    const effectiveTotal = subtotal + effectiveShippingFee;

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };


    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-serif font-bold text-slate-800 mb-4">Vui lòng đăng nhập</h2>
                <p className="text-slate-500 mb-8 text-center">Bạn cần đăng nhập để xem và quản lý giỏ hàng của mình.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Giỏ Hàng</h1>

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cartDetails.map(item => (
                            <motion.div
                                layout
                                key={item.bookId}
                                className="bg-white p-4 flex gap-4 rounded-2xl shadow-sm border border-slate-100 items-center"
                            >
                                <SafeImage src={item.cover_url || "https://placehold.co/100x150"} alt={item.title} className="w-20 h-28 object-cover rounded-lg shadow-sm" />
                                <div className="flex-1">
                                    <Link to={`/book/${item.bookId}`} className="font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                                        {item.title}
                                    </Link>
                                    <p className="text-sm text-slate-500 mb-2">{item.author || "Đang cập nhật"}</p>
                                    <p className="font-bold text-indigo-600">{formatPrice(item.price!)}</p>
                                </div>

                                <div className="flex flex-col items-end gap-4">
                                    {confirmRemoveId === item.bookId ? (
                                        <button
                                            onClick={() => handleRemove(item.bookId)}
                                            className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-full hover:bg-rose-600 transition-colors animate-pulse"
                                        >
                                            Xóa?
                                        </button>
                                    ) : (
                                        <button onClick={() => handleRemove(item.bookId)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                                        <button onClick={() => handleUpdateQuantity(item.bookId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold">-</button>
                                        <span className="w-8 text-center font-bold text-slate-900 text-sm">{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.bookId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 font-bold">+</button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Tổng cộng</h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-600">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Phí vận chuyển</span>
                                    {appliedPromo ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 line-through text-sm">{formatPrice(shippingFee)}</span>
                                            <span className="text-emerald-600 font-medium">{formatPrice(0)}</span>
                                        </div>
                                    ) : (
                                        <span>{formatPrice(shippingFee)}</span>
                                    )}
                                </div>
                            </div>

                            {appliedPromo && (
                                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Đã áp dụng <strong>{appliedPromo}</strong> — miễn phí vận chuyển</span>
                                    <button onClick={handleRemovePromo} className="ml-auto p-0.5 hover:bg-emerald-200 rounded transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-end mb-4 pt-4 border-t border-slate-100">
                                <span className="font-bold text-slate-900">Tổng thanh toán</span>
                                <span className="text-2xl font-bold text-indigo-600">{formatPrice(effectiveTotal)}</span>
                            </div>

                            <div className="mb-6">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                            placeholder="Mã khuyến mãi"
                                            disabled={!!appliedPromo}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                    {!appliedPromo ? (
                                        <button
                                            onClick={handleApplyPromo}
                                            disabled={isValidatingPromo || !promoCode.trim()}
                                            className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isValidatingPromo ? '...' : 'Áp dụng'}
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(appliedPromo ? `/checkout?promo=${appliedPromo}` : '/checkout')}
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