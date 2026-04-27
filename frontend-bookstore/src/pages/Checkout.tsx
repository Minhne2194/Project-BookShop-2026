import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

// Khai báo Interface (giống ở trang Cart)
interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
}

export function Checkout() {
    // --- 1. STATES & CONTEXT ---
    const { token, cartItems, fetchCart } = useCart();
    const navigate = useNavigate();

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'cod'
    });

    // --- 2. FETCH THÔNG TIN SÁCH ĐỂ HIỂN THỊ ĐƠN HÀNG ---
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

    // --- 3. GHÉP DỮ LIỆU & TÍNH TỔNG TIỀN ---
    const cartDetails = useMemo(() => {
        return cartItems.map(cartItem => {
            const bookDetail = books.find(b => b.book_id === cartItem.bookId);
            return { ...cartItem, ...bookDetail };
        }).filter(item => item.title);
    }, [cartItems, books]);

    const totalPrice = cartDetails.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);

    // Nếu giỏ hàng trống (mà chưa đặt hàng thành công) thì đẩy về trang /cart
    useEffect(() => {
        if (!loading && cartItems.length === 0 && !isSuccess) {
            navigate('/cart');
        }
    }, [loading, cartItems.length, isSuccess, navigate]);

    // --- 4. HÀM XỬ LÝ ĐẶT HÀNG ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            alert("Vui lòng đăng nhập để thanh toán!");
            return;
        }

        setIsSubmitting(true);

        try {
            // Gọi API Thanh toán (Sử dụng đúng cấu trúc bạn gửi ban đầu)
            const res = await fetch('http://localhost:3000/orders/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    payment_method: formData.paymentMethod,
                    shipping_address: {
                        name: formData.name,
                        phone: formData.phone,
                        address: formData.address
                    }
                })
            });

            if (res.ok) {
                setIsSuccess(true);
                fetchCart(); // Cập nhật (xóa) giỏ hàng trên UI do backend đã xử lý đơn

                // Hiệu ứng pháo hoa
                triggerConfetti();
            } else {
                const err = await res.json();
                alert(`Lỗi: ${err.message || 'Không thể đặt hàng'}`);
            }
        } catch (error) {
            alert("Có lỗi xảy ra, vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm chạy hiệu ứng pháo hoa
    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    // Hàm format tiền
    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    // --- 5. RENDER ---

    // Màn hình thành công
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-20 px-4">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                >
                    <CheckCircle2 className="w-24 h-24 text-emerald-500 mb-6" />
                </motion.div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-4 text-center">Đặt hàng thành công!</h1>
                <p className="text-slate-600 mb-8 max-w-md text-center leading-relaxed">
                    Cảm ơn <strong>{formData.name}</strong> đã mua sắm tại BookStore 2026. Đơn hàng của bạn sẽ được giao đến địa chỉ <strong>{formData.address}</strong> trong thời gian sớm nhất.
                </p>
                <Link to="/" className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    Tiếp tục mua sắm
                </Link>
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

    // Màn hình Checkout
    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/cart" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
                </Link>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Thanh toán</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Form điền thông tin */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-max">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Thông tin giao hàng</h2>
                        <form onSubmit={handleSubmit} id="checkout-form" className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Nguyễn Văn A" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                                <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="0901234567" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ giao hàng</label>
                                <textarea required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-24" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố" />
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-3">Phương thức thanh toán</label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="cod" checked={formData.paymentMethod === 'cod'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        <span className="font-medium text-slate-700 text-sm">Thanh toán khi nhận hàng (COD)</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="bank_transfer" checked={formData.paymentMethod === 'bank_transfer'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        <span className="font-medium text-slate-700 text-sm">Chuyển khoản qua ngân hàng</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Tóm tắt đơn hàng */}
                    <div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Đơn hàng ({cartDetails.length} sản phẩm)</h2>

                            <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-6 pt-2">
                                    {cartDetails.map(item => (
                                        <div key={item.bookId} className="flex gap-4">
                                            <div className="relative shrink-0 w-16 h-24">
                                                <img src={item.cover_url || "https://placehold.co/100x150"} alt={item.title} className="w-full h-full object-cover rounded-md shadow-sm" />
                                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 text-white rounded-full text-[11px] flex items-center justify-center font-bold z-10 shadow-sm border border-white">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <p className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</p>
                                                <p className="text-indigo-600 font-bold mt-1.5">{formatPrice(Number(item.price) * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4 mb-6 space-y-2">
                                <div className="flex justify-between text-slate-600 text-sm">
                                    <span>Tạm tính</span>
                                    <span className="font-medium">{formatPrice(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-sm">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-emerald-600 font-medium">Miễn phí</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-6">
                                <span className="font-bold text-slate-900">Tổng cộng</span>
                                <span className="text-2xl font-bold text-indigo-600">{formatPrice(totalPrice)}</span>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="animate-pulse">Đang xử lý...</span>
                                ) : (
                                    <>Đặt hàng <CheckCircle2 className="w-5 h-5" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
