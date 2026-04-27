import React, { useEffect, useState } from 'react';
import {
    Users,
    BookOpen,
    ShoppingBag,
    LogOut,
    TrendingUp,
    Package,
    DollarSign,
    Lock,
    Plus,
    Edit,
    Trash2,
    X,
} from 'lucide-react';
import { ORDER_STATUS_OPTIONS, getOrderStatusMeta } from '../utils/orderStatus';

interface Order {
    order_id: string;
    order_code: string;
    created_at: string;
    total_amount: number | string;
    status: string;
    user?: {
        full_name?: string | null;
        email?: string | null;
    };
}

interface Book {
    book_id: string;
    title: string;
    slug?: string;
    price: number | string;
    stock_qty: number | string;
    cover_url?: string | null;
    description?: string | null;
}

interface AdminUser {
    user_id: string;
    email: string;
    full_name?: string | null;
    role: string;
    created_at: string;
}

type BookFormState = {
    title: string;
    slug: string;
    price: string;
    stock_qty: string;
    cover_url: string;
    description: string;
};

const EMPTY_BOOK_FORM: BookFormState = {
    title: '',
    slug: '',
    price: '',
    stock_qty: '',
    cover_url: '',
    description: '',
};

export function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [orders, setOrders] = useState<Order[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBookId, setEditingBookId] = useState<string | null>(null);
    const [bookForm, setBookForm] = useState<BookFormState>(EMPTY_BOOK_FORM);

    useEffect(() => {
        const auth = localStorage.getItem('isAdminAuth');
        const token = localStorage.getItem('adminToken');

        if (auth === 'true' && token) {
            setIsAuthenticated(true);
            return;
        }

        localStorage.removeItem('isAdminAuth');
        localStorage.removeItem('adminToken');
        setLoading(false);
    }, []);

    const fetchBooksList = async () => {
        try {
            const res = await fetch('http://localhost:3000/books');
            if (!res.ok) {
                setBooks([]);
                setTotalBooks(0);
                return;
            }

            const data: Book[] = await res.json();
            setBooks(data);
            setTotalBooks(data.length);
        } catch (fetchError) {
            console.error(fetchError);
            setBooks([]);
            setTotalBooks(0);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const fetchAdminData = async () => {
            setLoading(true);

            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    handleLogout();
                    return;
                }

                await fetchBooksList();

                const headers = { Authorization: `Bearer ${token}` };
                const [ordersRes, usersRes] = await Promise.all([
                    fetch('http://localhost:3000/orders/all', { headers }),
                    fetch('http://localhost:3000/users', { headers }),
                ]);

                if (ordersRes.ok) {
                    const ordersData: Order[] = await ordersRes.json();
                    setOrders(ordersData);
                } else {
                    setOrders([]);
                }

                if (usersRes.ok) {
                    const usersData: AdminUser[] = await usersRes.json();
                    setUsers(usersData);
                } else {
                    setUsers([]);
                }
            } catch (fetchError) {
                console.error('Lỗi tải dữ liệu Admin:', fetchError);
                setOrders([]);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [isAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const res = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password_raw: password }),
            });

            if (!res.ok) {
                setError('Tài khoản hoặc mật khẩu không chính xác.');
                return;
            }

            const data = await res.json();
            if (data.user.role !== 'admin') {
                setError('Tài khoản của bạn không có quyền quản trị viên.');
                return;
            }

            localStorage.setItem('isAdminAuth', 'true');
            localStorage.setItem('adminToken', data.access_token);
            setIsAuthenticated(true);
            setActiveTab('dashboard');
        } catch (loginError) {
            console.error(loginError);
            setError('Không thể kết nối đến máy chủ.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdminAuth');
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
        setUsername('');
        setPassword('');
        setOrders([]);
        setUsers([]);
        setBooks([]);
        setTotalBooks(0);
        setLoading(false);
    };

    const openAddForm = () => {
        setEditingBookId(null);
        setBookForm(EMPTY_BOOK_FORM);
        setShowBookModal(true);
    };

    const openEditForm = (book: Book) => {
        setEditingBookId(book.book_id);
        setBookForm({
            title: book.title || '',
            slug: book.slug || '',
            price: String(book.price ?? ''),
            stock_qty: String(book.stock_qty ?? ''),
            cover_url: book.cover_url || '',
            description: book.description || '',
        });
        setShowBookModal(true);
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            handleLogout();
            return;
        }

        setUpdatingOrderId(orderId);

        try {
            const res = await fetch(`http://localhost:3000/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                alert(errorData?.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
                return;
            }

            const updatedOrder: Order = await res.json();
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.order_id === orderId ? { ...order, status: updatedOrder.status } : order
                )
            );
        } catch (updateError) {
            console.error(updateError);
            alert('Không thể cập nhật trạng thái đơn hàng.');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('adminToken');
        const method = editingBookId ? 'PUT' : 'POST';
        const url = editingBookId
            ? `http://localhost:3000/books/${editingBookId}`
            : 'http://localhost:3000/books';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...bookForm,
                    price: Number(bookForm.price),
                    stock_qty: Number(bookForm.stock_qty),
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                alert(errorData?.message || 'Có lỗi xảy ra khi lưu sách.');
                return;
            }

            setShowBookModal(false);
            await fetchBooksList();
        } catch (submitError) {
            console.error(submitError);
        }
    };

    const handleDeleteBook = async (id: string, title: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa cuốn sách "${title}" không?`)) {
            return;
        }

        const token = localStorage.getItem('adminToken');

        try {
            const res = await fetch(`http://localhost:3000/books/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                alert(`Lỗi: ${errorData?.message || 'Không thể xóa sách.'}`);
                return;
            }

            await fetchBooksList();
        } catch (deleteError) {
            console.error(deleteError);
        }
    };

    const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

    const formatPrice = (price: string | number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const renderStatusBadge = (status: string) => {
        const statusMeta = getOrderStatusMeta(status);
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.badgeClassName}`}>
                {statusMeta.label}
            </span>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 text-center mb-6">Đăng nhập Admin</h1>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-medium text-center">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                required
                                disabled={isLoggingIn}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 mt-2 flex justify-center"
                        >
                            {isLoggingIn ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <div className="w-64 bg-white shadow-lg flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#594d95] text-white flex items-center justify-center rounded-lg font-serif font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-xl text-slate-800">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <TrendingUp size={20} /> Tổng quan
                    </button>
                    <button
                        onClick={() => setActiveTab('books')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'books' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <BookOpen size={20} /> Sản phẩm
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <ShoppingBag size={20} /> Đơn hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                            activeTab === 'users' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Users size={20} /> Khách hàng
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                        <LogOut size={20} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
                <header className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800">
                        {activeTab === 'dashboard' && 'Tổng quan hệ thống'}
                        {activeTab === 'books' && 'Quản lý sản phẩm'}
                        {activeTab === 'orders' && 'Quản lý đơn hàng'}
                        {activeTab === 'users' && 'Quản lý khách hàng'}
                    </h1>
                </header>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : activeTab === 'dashboard' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <DollarSign size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Tổng doanh thu</p>
                                    <p className="text-2xl font-bold text-slate-800">{formatPrice(totalRevenue)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold text-slate-800">{orders.length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-500 text-sm font-medium">Tổng sản phẩm</p>
                                    <p className="text-2xl font-bold text-slate-800">{totalBooks}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Đơn hàng gần đây</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-sm text-slate-500">
                                            <th className="pb-3 font-medium">Mã ĐH</th>
                                            <th className="pb-3 font-medium">Khách hàng</th>
                                            <th className="pb-3 font-medium">Ngày đặt</th>
                                            <th className="pb-3 font-medium">Tổng tiền</th>
                                            <th className="pb-3 font-medium">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {orders.slice(0, 5).map((order) => (
                                            <tr key={order.order_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 font-medium text-indigo-600">
                                                    #{order.order_code?.split('-')[1] || order.order_id.substring(0, 6)}
                                                </td>
                                                <td className="py-4 text-slate-700">{order.user?.full_name || 'Khách vãng lai'}</td>
                                                <td className="py-4 text-slate-500">{formatDate(order.created_at)}</td>
                                                <td className="py-4 font-medium">{formatPrice(order.total_amount)}</td>
                                                <td className="py-4">{renderStatusBadge(order.status)}</td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-500">
                                                    Chưa có đơn hàng nào trong hệ thống.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'books' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Danh sách sản phẩm</h2>
                            <button
                                onClick={openAddForm}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
                            >
                                <Plus size={20} /> Thêm sách mới
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                                            <th className="py-3 px-6 font-medium">Tên sách</th>
                                            <th className="py-3 px-6 font-medium">Giá bán</th>
                                            <th className="py-3 px-6 font-medium">Tồn kho</th>
                                            <th className="py-3 px-6 font-medium text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {books.map((book) => (
                                            <tr key={book.book_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <img
                                                            src={book.cover_url || 'https://placehold.co/40x60'}
                                                            alt={book.title}
                                                            className="w-10 h-14 object-cover rounded shadow-sm border border-slate-200"
                                                        />
                                                        <span className="font-bold text-slate-800 line-clamp-2 max-w-xs">{book.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 font-bold text-indigo-600">{formatPrice(book.price)}</td>
                                                <td className="py-3 px-6">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                                                        {book.stock_qty}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button onClick={() => openEditForm(book)} className="text-indigo-500 hover:text-indigo-700 transition-colors">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBook(book.book_id, book.title)}
                                                            className="text-rose-500 hover:text-rose-700 transition-colors"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'orders' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Danh sách đơn hàng</h2>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                                            <th className="py-3 px-6 font-medium">Mã ĐH</th>
                                            <th className="py-3 px-6 font-medium">Khách hàng</th>
                                            <th className="py-3 px-6 font-medium">Ngày đặt</th>
                                            <th className="py-3 px-6 font-medium">Tổng tiền</th>
                                            <th className="py-3 px-6 font-medium">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {orders.map((order) => {
                                            const statusMeta = getOrderStatusMeta(order.status);

                                            return (
                                                <tr key={order.order_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6 font-medium text-indigo-600">
                                                        #{order.order_code?.split('-')[1] || order.order_id.substring(0, 6)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="font-bold text-slate-800">{order.user?.full_name || 'Khách vô danh'}</p>
                                                        <p className="text-xs text-slate-500">{order.user?.email}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500">{formatDate(order.created_at)}</td>
                                                    <td className="py-4 px-6 font-bold text-slate-800">{formatPrice(order.total_amount)}</td>
                                                    <td className="py-4 px-6">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                                                            disabled={updatingOrderId === order.order_id}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border outline-none appearance-none text-center ${statusMeta.selectClassName} ${
                                                                updatingOrderId === order.order_id ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                                                            }`}
                                                        >
                                                            {ORDER_STATUS_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value} className="bg-white text-slate-800">
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 px-6 text-center text-slate-500">
                                                    Chưa có đơn hàng nào trong hệ thống.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-800">Danh sách khách hàng</h2>
                            <div className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold text-slate-600">
                                Tổng cộng: {users.length} tài khoản
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-sm text-slate-500">
                                            <th className="py-3 px-6 font-medium">Khách hàng</th>
                                            <th className="py-3 px-6 font-medium">Tài khoản (Email)</th>
                                            <th className="py-3 px-6 font-medium">Vai trò</th>
                                            <th className="py-3 px-6 font-medium">Ngày tham gia</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {users.map((user) => (
                                            <tr key={user.user_id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold uppercase">
                                                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="font-bold text-slate-800">{user.full_name || 'Đang cập nhật'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-slate-600">{user.email}</td>
                                                <td className="py-4 px-6">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                                            user.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}
                                                    >
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-slate-500">{formatDate(user.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            {showBookModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-xl font-serif font-bold text-slate-800">
                                {editingBookId ? 'Chỉnh sửa sách' : 'Thêm sách mới'}
                            </h3>
                            <button
                                onClick={() => setShowBookModal(false)}
                                className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-1.5 rounded-full shadow-sm border border-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleBookSubmit} className="p-6 overflow-y-auto space-y-5 bg-white">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tên sách</label>
                                <input
                                    type="text"
                                    required
                                    value={bookForm.title}
                                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                    placeholder="VD: Nhà Lãnh Đạo Không Chức Danh"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Giá bán (VNĐ)</label>
                                    <input
                                        type="number"
                                        required
                                        value={bookForm.price}
                                        onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="150000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Số lượng kho</label>
                                    <input
                                        type="number"
                                        required
                                        value={bookForm.stock_qty}
                                        onChange={(e) => setBookForm({ ...bookForm, stock_qty: e.target.value })}
                                        className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="100"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Đường dẫn ảnh bìa (URL)</label>
                                <input
                                    type="url"
                                    value={bookForm.cover_url}
                                    onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Mô tả chi tiết</label>
                                <textarea
                                    rows={4}
                                    value={bookForm.description}
                                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                                    className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none"
                                    placeholder="Tóm tắt nội dung cuốn sách..."
                                />
                            </div>

                            <div className="pt-6 mt-2 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBookModal(false)}
                                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                                >
                                    {editingBookId ? 'Cập nhật thay đổi' : 'Lưu sản phẩm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
