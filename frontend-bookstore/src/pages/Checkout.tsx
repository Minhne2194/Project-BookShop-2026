import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ArrowLeft, Wallet, CreditCard, Building2, Tag, X, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';
import { SafeImage } from '../components/SafeImage';

interface Book {
    book_id: string;
    title: string;
    price: string | number;
    cover_url: string | null;
}

interface Order {
    order_id: string;
    order_code: string;
    total_amount: number | string;
    payment_method: string;
}

const API_URL = 'http://localhost:3000';

export function Checkout() {
    const { token, cartItems, fetchCart } = useCart();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [promoCode, setPromoCode] = useState(searchParams.get('promo') || '');
    const [appliedPromo, setAppliedPromo] = useState<string | null>(searchParams.get('promo') || null);
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        paymentMethod: 'cod'
    });

    useEffect(() => {
        if (cartItems.length === 0) {
            setBooks([]);
            setLoading(false);
            return;
        }

        const ids = cartItems.map(item => item.bookId).join(',');

        setLoading(true);
        fetch(`${API_URL}/books?ids=${ids}`)
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

    const subtotal = cartDetails.reduce((sum, item) => sum + (Number(item.price || 0) * item.quantity), 0);
    const baseShippingFee = 30000;
    const effectiveShippingFee = appliedPromo ? 0 : baseShippingFee;
    const totalAmount = subtotal + effectiveShippingFee;

    useEffect(() => {
        if (!loading && cartItems.length === 0 && !isSuccess) {
            navigate('/cart');
        }
    }, [loading, cartItems.length, isSuccess, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            toast("Vui lòng đăng nhập để thanh toán!", 'info');
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_URL}/orders/checkout`, {
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
                    },
                    ...(appliedPromo ? { promo_code: appliedPromo } : {}),
                })
            });

            if (res.ok) {
                const data = await res.json();

                // For online payment gateways, redirect to payment page
                if (data.requiresPayment && (formData.paymentMethod === 'momo' || formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'payos' || formData.paymentMethod === 'bank_transfer')) {
                    await initiateOnlinePayment(data.order);
                } else {
                    // For COD, show success immediately
                    setIsSuccess(true);
                    fetchCart();
                    triggerConfetti();
                }
            } else {
                const err = await res.json();
                toast(`Lỗi: ${err.message || 'Không thể đặt hàng'}`, 'error');
            }
        } catch (error) {
            console.error(error);
            toast("Có lỗi xảy ra, vui lòng thử lại!", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateOnlinePayment = async (createdOrder: Order) => {
        setIsProcessingPayment(true);

        const paymentEndpoints: Record<string, string> = {
            momo: 'momo/create',
            vnpay: 'vnpay/create',
            payos: 'payos/create',
            bank_transfer: 'payos/create',
        };

        try {
            const paymentEndpoint = paymentEndpoints[formData.paymentMethod] || 'momo/create';
            const res = await fetch(`${API_URL}/payment/${paymentEndpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: createdOrder.order_id,
                    amount: totalAmount,
                    orderInfo: `Thanh toan don hang ${createdOrder.order_code}`
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.payUrl) {
                    // Redirect to payment gateway
                    window.location.href = data.payUrl;
                } else {
                    toast('Không thể khởi tạo thanh toán. Vui lòng thử lại.', 'error');
                }
            } else {
                const err = await res.json();
                toast(`Lỗi thanh toán: ${err.message || 'Không thể khởi tạo thanh toán'}`, 'error');
            }
        } catch (error) {
            console.error(error);
            toast('Có lỗi xảy ra khi xử lý thanh toán!', 'error');
        } finally {
            setIsProcessingPayment(false);
        }
    };

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

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method) {
            case 'cod':
                return <Wallet className="w-5 h-5" />;
            case 'bank_transfer':
                return <Building2 className="w-5 h-5" />;
            case 'momo':
                return <CreditCard className="w-5 h-5" />;
            case 'vnpay':
                return <CreditCard className="w-5 h-5" />;
            case 'payos':
                return <QrCode className="w-5 h-5" />;
            default:
                return <Wallet className="w-5 h-5" />;
        }
    };

    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case 'cod':
                return 'Thanh toán khi nhận hàng (COD)';
            case 'bank_transfer':
                return 'Chuyển khoản qua ngân hàng';
            case 'momo':
                return 'Ví điện tử MoMo';
            case 'vnpay':
                return 'Cổng thanh toán VNPay';
            case 'payos':
                return 'PayOS (QR Code / Chuyển khoản)';
            default:
                return 'Thanh toán khi nhận hàng';
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

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/cart" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors font-medium">
                    <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
                </Link>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Thanh toán</h1>

                <div className="grid md:grid-cols-2 gap-8">
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
                                        {getPaymentMethodIcon('cod')}
                                        <span className="font-medium text-slate-700 text-sm">{getPaymentMethodName('cod')}</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="bank_transfer" checked={formData.paymentMethod === 'bank_transfer'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        {getPaymentMethodIcon('bank_transfer')}
                                        <span className="font-medium text-slate-700 text-sm">{getPaymentMethodName('bank_transfer')}</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="momo" checked={formData.paymentMethod === 'momo'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        {getPaymentMethodIcon('momo')}
                                        <span className="font-medium text-slate-700 text-sm">{getPaymentMethodName('momo')}</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="vnpay" checked={formData.paymentMethod === 'vnpay'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        {getPaymentMethodIcon('vnpay')}
                                        <span className="font-medium text-slate-700 text-sm">{getPaymentMethodName('vnpay')}</span>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="radio" name="payment" value="payos" checked={formData.paymentMethod === 'payos'} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                        {getPaymentMethodIcon('payos')}
                                        <span className="font-medium text-slate-700 text-sm">{getPaymentMethodName('payos')}</span>
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">Đơn hàng ({cartDetails.length} sản phẩm)</h2>

                            <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="space-y-6 pt-2">
                                    {cartDetails.map(item => (
                                        <div key={item.bookId} className="flex gap-4">
                                            <div className="relative shrink-0 w-16 h-24">
                                                <SafeImage src={item.cover_url || "https://placehold.co/100x150"} alt={item.title} className="w-full h-full object-cover rounded-md shadow-sm" />
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
                                    <span className="font-medium">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-sm">
                                    <span>Phí vận chuyển</span>
                                    {appliedPromo ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 line-through">{formatPrice(baseShippingFee)}</span>
                                            <span className="text-emerald-600 font-medium">{formatPrice(0)}</span>
                                        </div>
                                    ) : (
                                        <span className="font-medium">{formatPrice(baseShippingFee)}</span>
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

                            <div className="flex justify-between items-end mb-4">
                                <span className="font-bold text-slate-900">Tổng cộng</span>
                                <span className="text-2xl font-bold text-indigo-600">{formatPrice(totalAmount)}</span>
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
                                            type="button"
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
                                type="submit"
                                form="checkout-form"
                                disabled={isSubmitting || isProcessingPayment}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-12 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting || isProcessingPayment ? (
                                    <span className="animate-pulse">Đang xử lý...</span>
                                ) : (
                                    <>Đặt hàng <CheckCircle2 className="w-5 h-5" /></>
                                )}
                            </button>

                            {(formData.paymentMethod === 'momo' || formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'payos' || formData.paymentMethod === 'bank_transfer') && (
                                <p className="text-xs text-slate-500 mt-3 text-center">
                                    Bạn sẽ được chuyển đến trang thanh toán của {getPaymentMethodName(formData.paymentMethod)} để hoàn tất giao dịch.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}