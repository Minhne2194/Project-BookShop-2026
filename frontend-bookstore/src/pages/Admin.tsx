import React, { useEffect, useState } from 'react';
import {
    Ban,
    BookOpen,
    Building2,
    CheckCircle,
    DollarSign,
    Edit,
    Globe,
    Layers,
    Lock,
    LogOut,
    Package,
    Plus,
    RefreshCw,
    ShoppingBag,
    Star,
    TrendingUp,
    UserCheck,
    UserSquare2,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { ORDER_STATUS_OPTIONS, getOrderStatusMeta } from '../utils/orderStatus';

const API_URL = 'http://localhost:3000';

interface AdminStats {
    totalUsers: number;
    totalBooks: number;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    pendingReviews: number;
}

interface PendingReview {
    review_id: string;
    rating: number;
    title?: string;
    body?: string;
    created_at: string;
    user: { full_name?: string; email?: string };
    book: { title?: string };
}

interface Order {
    order_id: string;
    order_code: string;
    created_at: string;
    total_amount: number | string;
    status: string;
    user?: { full_name?: string | null; email?: string | null };
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
    status: string;
    created_at: string;
    _count?: { orders: number; reviews: number };
}

interface Author {
    author_id: string;
    name: string;
    slug: string;
    bio?: string | null;
    avatar_url?: string | null;
    _count?: { book_authors: number };
}

interface Publisher {
    publisher_id: string;
    name: string;
    slug: string;
    website?: string | null;
    _count?: { books: number };
}

type BookFormState = {
    title: string;
    slug: string;
    price: string;
    stock_qty: string;
    cover_url: string;
    description: string;
    extra_images: string[];
};

type AuthorFormState = {
    name: string;
    slug: string;
    bio: string;
    avatar_url: string;
};

type PublisherFormState = {
    name: string;
    slug: string;
    website: string;
};

type Category = {
    category_id: string;
    name: string;
    slug: string;
    sort_order: number;
    parent_id?: string;
    level: number;
    _count?: { book_categories: number };
};

type CategoryFormState = {
    name: string;
    slug: string;
    sort_order: number | string;
};

const EMPTY_BOOK_FORM: BookFormState = {
    title: '',
    slug: '',
    price: '',
    stock_qty: '',
    cover_url: '',
    description: '',
    extra_images: [],
};

const EMPTY_AUTHOR_FORM: AuthorFormState = {
    name: '',
    slug: '',
    bio: '',
    avatar_url: '',
};

const EMPTY_PUBLISHER_FORM: PublisherFormState = {
    name: '',
    slug: '',
    website: '',
};

const EMPTY_CATEGORY_FORM: CategoryFormState = {
    name: '',
    slug: '',
    sort_order: 0,
};

export function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reindexing, setReindexing] = useState(false);
    const [reindexStatus, setReindexStatus] = useState<string | null>(null);

    const [orders, setOrders] = useState<Order[]>([]);
    const [books, setBooks] = useState<Book[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; orders: number }[]>([]);

    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [authorsLoading, setAuthorsLoading] = useState(false);
    const [publishersLoading, setPublishersLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // User search / filter
    const [userSearch, setUserSearch] = useState('');
    const [userStatusFilter, setUserStatusFilter] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');

    // User orders modal
    const [selectedUserForOrders, setSelectedUserForOrders] = useState<AdminUser | null>(null);
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [userOrdersLoading, setUserOrdersLoading] = useState(false);

    const [showBookModal, setShowBookModal] = useState(false);
    const [editingBookId, setEditingBookId] = useState<string | null>(null);
    const [bookForm, setBookForm] = useState<BookFormState>(EMPTY_BOOK_FORM);
    const [showAuthorModal, setShowAuthorModal] = useState(false);
    const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
    const [authorForm, setAuthorForm] = useState<AuthorFormState>(EMPTY_AUTHOR_FORM);
    const [showPublisherModal, setShowPublisherModal] = useState(false);
    const [editingPublisherId, setEditingPublisherId] = useState<string | null>(null);
    const [publisherForm, setPublisherForm] = useState<PublisherFormState>(EMPTY_PUBLISHER_FORM);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

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

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const formatPrice = (price: string | number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price || 0));

    const getToken = () => localStorage.getItem('adminToken');

    const handleRebuildSearchIndex = async () => {
        const token = getToken();
        if (!token) return;
        setReindexing(true);
        setReindexStatus(null);
        try {
            const res = await fetch(`${API_URL}/search/reindex`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                setReindexStatus(data.message || 'Không thể rebuild search index.');
                return;
            }
            setReindexStatus(`Đã index ${data.indexed} sách vào ${data.index}.`);
        } catch (error) {
            console.error(error);
            setReindexStatus('Không thể kết nối Elasticsearch.');
        } finally {
            setReindexing(false);
        }
    };

    const fetchBooksList = async () => {
        try {
            const res = await fetch(`${API_URL}/books?limit=1000`);
            if (!res.ok) {
                setBooks([]);
                return;
            }
            const json = await res.json();
            setBooks(json.data || json || []);
        } catch (fetchError) {
            console.error(fetchError);
            setBooks([]);
        }
    };

    const fetchPendingReviews = async () => {
        const token = getToken();
        if (!token) return;
        setReviewsLoading(true);
        try {
            const res = await fetch(`${API_URL}/reviews/pending`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setPendingReviews(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setReviewsLoading(false);
        }
    };

    const fetchAuthors = async () => {
        const token = getToken();
        if (!token) return;
        setAuthorsLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/authors?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAuthors(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setAuthorsLoading(false);
        }
    };

    const fetchPublishers = async () => {
        const token = getToken();
        if (!token) return;
        setPublishersLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/publishers?limit=200`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setPublishers(data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setPublishersLoading(false);
        }
    };

    const fetchCategories = async () => {
        const token = getToken();
        if (!token) return;
        setCategoriesLoading(true);
        try {
            const res = await fetch(`${API_URL}/admin/categories`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setCategories(data.data || data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCategoriesLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchAdminData = async () => {
            setLoading(true);
            try {
                const token = getToken();
                if (!token) return;
                await fetchBooksList();
                const headers = { Authorization: `Bearer ${token}` };
                const [ordersRes, usersRes, statsRes, revenueRes] = await Promise.all([
                    fetch(`${API_URL}/orders/all`, { headers }),
                    fetch(`${API_URL}/admin/users?limit=200`, { headers }),
                    fetch(`${API_URL}/admin/stats`, { headers }),
                    fetch(`${API_URL}/admin/stats/revenue`, { headers }),
                ]);

                if (ordersRes.ok) setOrders(await ordersRes.json());
                else setOrders([]);

                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData.data || usersData || []);
                } else setUsers([]);

                if (statsRes.ok) setStats(await statsRes.json());
                else setStats(null);

                if (revenueRes.ok) setRevenueData(await revenueRes.json());
                else setRevenueData([]);
            } catch (fetchError) {
                console.error('Lỗi tải dữ liệu Admin:', fetchError);
                setOrders([]);
                setUsers([]);
                setStats(null);
                setRevenueData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (activeTab === 'reviews') fetchPendingReviews();
        if (activeTab === 'authors') fetchAuthors();
        if (activeTab === 'publishers') fetchPublishers();
        if (activeTab === 'categories') fetchCategories();
    }, [activeTab, isAuthenticated]);

    const openUserOrdersModal = async (user: AdminUser) => {
        setSelectedUserForOrders(user);
        setUserOrders([]);
        setUserOrdersLoading(true);
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/admin/users/${user.user_id}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUserOrders(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setUserOrdersLoading(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchSearch = !userSearch ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase());
        const matchStatus = !userStatusFilter || u.status === userStatusFilter;
        const matchRole = !userRoleFilter || u.role === userRoleFilter;
        return matchSearch && matchStatus && matchRole;
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
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
        setStats(null);
        setPendingReviews([]);
        setAuthors([]);
        setPublishers([]);
        setLoading(false);
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        const token = getToken();
        if (!token) return;
        setUpdatingOrderId(orderId);
        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) return;
            const updatedOrder: Order = await res.json();
            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order.order_id === orderId ? { ...order, status: updatedOrder.status } : order
                )
            );
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleReviewAction = async (reviewId: string, status: 'approved' | 'rejected') => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/reviews/${reviewId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setPendingReviews((prev) => prev.filter((review) => review.review_id !== reviewId));
                setStats((prev) => (prev ? { ...prev, pendingReviews: Math.max(prev.pendingReviews - 1, 0) } : prev));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
        const token = getToken();
        if (!token) return;
        setUpdatingUserId(userId);
        try {
            const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, status: newStatus } : u)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUpdatingUserId(null);
        }
    };

    const openAddBookForm = () => {
        setEditingBookId(null);
        setBookForm(EMPTY_BOOK_FORM);
        setShowBookModal(true);
    };

    const openEditBookForm = (book: Book & { extra_images?: string[] }) => {
        setEditingBookId(book.book_id);
        setBookForm({
            title: book.title || '',
            slug: book.slug || '',
            price: String(book.price ?? ''),
            stock_qty: String(book.stock_qty ?? ''),
            cover_url: book.cover_url || '',
            description: book.description || '',
            extra_images: Array.isArray(book.extra_images) ? book.extra_images : [],
        });
        setShowBookModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const token = getToken();
        if (!token) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsUploadingImage(true);
        try {
            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setBookForm((prev) => ({ ...prev, cover_url: data.url }));
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Lỗi upload ảnh');
            }
        } catch (error) {
            console.error('Lỗi upload:', error);
            alert('Đã xảy ra lỗi khi upload ảnh');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const method = editingBookId ? 'PUT' : 'POST';
        const endpoint = editingBookId ? `${API_URL}/books/${editingBookId}` : `${API_URL}/books`;
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...bookForm,
                    price: Number(bookForm.price),
                    stock_qty: Number(bookForm.stock_qty),
                    extra_images: bookForm.extra_images.filter(Boolean),
                }),
            });
            if (!res.ok) return;
            setShowBookModal(false);
            await fetchBooksList();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteBook = async (bookId: string) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/books/${bookId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            await fetchBooksList();
        } catch (error) {
            console.error(error);
        }
    };

    const openAddAuthorModal = () => {
        setEditingAuthorId(null);
        setAuthorForm(EMPTY_AUTHOR_FORM);
        setShowAuthorModal(true);
    };

    const openEditAuthorModal = (author: Author) => {
        setEditingAuthorId(author.author_id);
        setAuthorForm({
            name: author.name || '',
            slug: author.slug || '',
            bio: author.bio || '',
            avatar_url: author.avatar_url || '',
        });
        setShowAuthorModal(true);
    };

    const handleAuthorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const method = editingAuthorId ? 'PUT' : 'POST';
        const endpoint = editingAuthorId ? `${API_URL}/admin/authors/${editingAuthorId}` : `${API_URL}/admin/authors`;
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: authorForm.name.trim(),
                    slug: authorForm.slug.trim(),
                    bio: authorForm.bio.trim() || undefined,
                    avatar_url: authorForm.avatar_url.trim() || undefined,
                }),
            });
            if (!res.ok) return;
            setShowAuthorModal(false);
            await fetchAuthors();
        } catch (error) {
            console.error(error);
        }
    };

    const openAddPublisherModal = () => {
        setEditingPublisherId(null);
        setPublisherForm(EMPTY_PUBLISHER_FORM);
        setShowPublisherModal(true);
    };

    const openEditPublisherModal = (publisher: Publisher) => {
        setEditingPublisherId(publisher.publisher_id);
        setPublisherForm({
            name: publisher.name || '',
            slug: publisher.slug || '',
            website: publisher.website || '',
        });
        setShowPublisherModal(true);
    };

    const handlePublisherSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const method = editingPublisherId ? 'PUT' : 'POST';
        const endpoint = editingPublisherId ? `${API_URL}/admin/publishers/${editingPublisherId}` : `${API_URL}/admin/publishers`;
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: publisherForm.name.trim(),
                    slug: publisherForm.slug.trim(),
                    website: publisherForm.website.trim() || undefined,
                }),
            });
            if (!res.ok) return;
            setShowPublisherModal(false);
            await fetchPublishers();
        } catch (error) {
            console.error(error);
        }
    };

    const openAddCategoryModal = () => {
        setEditingCategoryId(null);
        setCategoryForm(EMPTY_CATEGORY_FORM);
        setShowCategoryModal(true);
    };

    const openEditCategoryModal = (category: Category) => {
        setEditingCategoryId(category.category_id);
        setCategoryForm({
            name: category.name || '',
            slug: category.slug || '',
            sort_order: category.sort_order || 0,
        });
        setShowCategoryModal(true);
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const method = editingCategoryId ? 'PUT' : 'POST';
        const endpoint = editingCategoryId ? `${API_URL}/admin/categories/${editingCategoryId}` : `${API_URL}/admin/categories`;
        try {
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: categoryForm.name.trim(),
                    slug: categoryForm.slug.trim(),
                    sort_order: Number(categoryForm.sort_order),
                    level: 1,
                }),
            });
            if (!res.ok) return;
            setShowCategoryModal(false);
            await fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/admin/categories/${categoryId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            await fetchCategories();
        } catch (error) {
            console.error(error);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-slate-900 text-center mb-6">Đăng nhập Admin</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error ? <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm">{error}</div> : null}
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                            placeholder="Email"
                            required
                            disabled={isLoggingIn}
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl"
                            placeholder="Mật khẩu"
                            required
                            disabled={isLoggingIn}
                        />
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                        >
                            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const totalRevenue = stats?.totalRevenue ?? 0;

    const renderStatusBadge = (status: string) => {
        const statusMeta = getOrderStatusMeta(status);
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.badgeClassName}`}>{statusMeta.label}</span>;
    };

    return (
        <div className="min-h-screen bg-slate-100 flex">
            <div className="w-64 bg-white shadow-lg flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <span className="font-bold text-xl text-slate-800">Admin Panel</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        ['dashboard', <TrendingUp size={18} />, 'Tổng quan'],
                        ['books', <BookOpen size={18} />, 'Sản phẩm'],
                        ['categories', <Layers size={18} />, 'Danh mục'],
                        ['orders', <ShoppingBag size={18} />, 'Đơn hàng'],
                        ['users', <Users size={18} />, 'Khách hàng'],
                        ['reviews', <Star size={18} />, 'Reviews'],
                        ['authors', <UserSquare2 size={18} />, 'Authors'],
                        ['publishers', <Building2 size={18} />, 'Publishers'],
                    ].map(([key, icon, label]) => (
                        <button
                            key={key as string}
                            onClick={() => setActiveTab(String(key))}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                                activeTab === key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {icon} {label}
                            {key === 'reviews' && stats?.pendingReviews ? (
                                <span className="ml-auto bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{stats.pendingReviews}</span>
                            ) : null}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-rose-600 hover:bg-rose-50">
                        <LogOut size={18} /> Đăng xuất
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 h-screen overflow-y-auto">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : activeTab === 'dashboard' ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
                                <DollarSign className="text-emerald-600" />
                                <div>
                                    <p className="text-slate-500 text-sm">Tổng doanh thu</p>
                                    <p className="text-2xl font-bold text-slate-800">{formatPrice(totalRevenue)}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
                                <ShoppingBag className="text-blue-600" />
                                <div>
                                    <p className="text-slate-500 text-sm">Tổng đơn hàng</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats?.totalOrders ?? 0}</p>
                                    {stats?.pendingOrders ? <p className="text-xs text-amber-600">{stats.pendingOrders} chờ xử lý</p> : null}
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
                                <Package className="text-amber-600" />
                                <div>
                                    <p className="text-slate-500 text-sm">Tổng sản phẩm</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats?.totalBooks ?? 0}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border flex items-center gap-4">
                                <Users className="text-violet-600" />
                                <div>
                                    <p className="text-slate-500 text-sm">Người dùng</p>
                                    <p className="text-2xl font-bold text-slate-800">{stats?.totalUsers ?? 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Search index</h2>
                                <p className="text-sm text-slate-500">Đồng bộ lại Elasticsearch sau khi import hoặc chỉnh sửa nhiều sách.</p>
                                {reindexStatus ? <p className="text-sm text-indigo-600 mt-2">{reindexStatus}</p> : null}
                            </div>
                            <button
                                type="button"
                                onClick={handleRebuildSearchIndex}
                                disabled={reindexing}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-indigo-600 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} className={reindexing ? 'animate-spin' : ''} />
                                {reindexing ? 'Đang rebuild...' : 'Rebuild Search Index'}
                            </button>
                        </div>

                        {/* Revenue Chart */}
                        {revenueData.length > 0 && (() => {
                            const maxRev = Math.max(...revenueData.map(d => d.revenue), 1);
                            return (
                                <div className="bg-white rounded-2xl border p-6">
                                    <h2 className="text-lg font-bold text-slate-800 mb-1">Doanh thu theo tháng</h2>
                                    <p className="text-sm text-slate-500 mb-4">12 tháng gần nhất (đơn đã thanh toán)</p>
                                    <div className="flex items-end gap-2 h-40">
                                        {revenueData.map((d) => {
                                            const heightPct = Math.round((d.revenue / maxRev) * 100);
                                            return (
                                                <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                    <div className="absolute bottom-10 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                                                        {formatPrice(d.revenue)}<br />{d.orders} đơn
                                                    </div>
                                                    <div
                                                        className="w-full rounded-t-md bg-indigo-500 hover:bg-indigo-600 transition-all cursor-default"
                                                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                                                    />
                                                    <span className="text-[10px] text-slate-400 truncate w-full text-center">{d.month.slice(5)}/{d.month.slice(0,4).slice(2)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="bg-white rounded-2xl border p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Đơn hàng gần đây</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead>
                                        <tr className="border-b text-sm text-slate-500">
                                            <th className="pb-3">Mã ĐH</th>
                                            <th className="pb-3">Khách hàng</th>
                                            <th className="pb-3">Ngày đặt</th>
                                            <th className="pb-3">Tổng tiền</th>
                                            <th className="pb-3">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {orders.slice(0, 5).map((order) => (
                                            <tr key={order.order_id} className="border-b border-slate-50">
                                                <td className="py-3">#{order.order_code?.split('-')[1] || order.order_id.slice(0, 6)}</td>
                                                <td className="py-3">{order.user?.full_name || 'Khách vãng lai'}</td>
                                                <td className="py-3">{formatDate(order.created_at)}</td>
                                                <td className="py-3">{formatPrice(order.total_amount)}</td>
                                                <td className="py-3">{renderStatusBadge(order.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'orders' ? (
                    <div className="bg-white rounded-2xl border overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                    <th className="py-3 px-6">Mã ĐH</th>
                                    <th className="py-3 px-6">Khách hàng</th>
                                    <th className="py-3 px-6">Ngày đặt</th>
                                    <th className="py-3 px-6">Tổng tiền</th>
                                    <th className="py-3 px-6">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {orders.map((order) => {
                                    const statusMeta = getOrderStatusMeta(order.status);
                                    return (
                                        <tr key={order.order_id} className="border-b border-slate-50">
                                            <td className="py-3 px-6">#{order.order_code?.split('-')[1] || order.order_id.slice(0, 6)}</td>
                                            <td className="py-3 px-6">{order.user?.full_name || 'Khách vãng lai'}</td>
                                            <td className="py-3 px-6">{formatDate(order.created_at)}</td>
                                            <td className="py-3 px-6">{formatPrice(order.total_amount)}</td>
                                            <td className="py-3 px-6">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleUpdateOrderStatus(order.order_id, e.target.value)}
                                                    disabled={updatingOrderId === order.order_id}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusMeta.selectClassName}`}
                                                >
                                                    {ORDER_STATUS_OPTIONS.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : activeTab === 'books' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={openAddBookForm} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                <Plus size={18} /> Thêm sách mới
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                        <th className="py-3 px-6">Tên sách</th>
                                        <th className="py-3 px-6">Giá</th>
                                        <th className="py-3 px-6">Tồn kho</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {books.map((book) => (
                                        <tr key={book.book_id} className="border-b border-slate-50">
                                            <td className="py-3 px-6 font-semibold text-slate-800">{book.title}</td>
                                            <td className="py-3 px-6">{formatPrice(book.price)}</td>
                                            <td className="py-3 px-6">{book.stock_qty}</td>
                                            <td className="py-3 px-6 text-center space-x-3">
                                                <button onClick={() => openEditBookForm(book)} className="text-indigo-600">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteBook(book.book_id)} className="text-rose-600">
                                                    <X size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'users' ? (
                    <div className="space-y-4">
                        {/* Search + Filter bar */}
                        <div className="bg-white rounded-2xl border p-4 flex flex-wrap gap-3 items-center">
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Tìm theo tên hoặc email..."
                                className="flex-1 min-w-[220px] px-4 py-2 border border-slate-200 rounded-xl text-sm"
                            />
                            <select
                                value={userStatusFilter}
                                onChange={(e) => setUserStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="active">Active</option>
                                <option value="banned">Banned</option>
                                <option value="unverified">Unverified</option>
                            </select>
                            <select
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-200 rounded-xl text-sm"
                            >
                                <option value="">Tất cả vai trò</option>
                                <option value="customer">Customer</option>
                                <option value="admin">Admin</option>
                                <option value="moderator">Moderator</option>
                            </select>
                            <span className="text-sm text-slate-500">{filteredUsers.length} kết quả</span>
                        </div>

                        <div className="bg-white rounded-2xl border overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                        <th className="py-3 px-6">Khách hàng</th>
                                        <th className="py-3 px-6">Email</th>
                                        <th className="py-3 px-6">Vai trò</th>
                                        <th className="py-3 px-6">Trạng thái</th>
                                        <th className="py-3 px-6">Đơn / Reviews</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.user_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                            <td className="py-3 px-6 font-semibold text-slate-800">{user.full_name || 'Đang cập nhật'}</td>
                                            <td className="py-3 px-6 text-slate-600">{user.email}</td>
                                            <td className="py-3 px-6">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    user.status === 'banned' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>{user.status}</span>
                                            </td>
                                            <td className="py-3 px-6">
                                                <button
                                                    onClick={() => openUserOrdersModal(user)}
                                                    className="text-indigo-600 hover:underline text-xs font-semibold"
                                                    title="Xem lịch sử đơn hàng"
                                                >
                                                    {user._count?.orders ?? 0} đơn / {user._count?.reviews ?? 0} reviews
                                                </button>
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                                {user.role !== 'admin' ? (
                                                    <button
                                                        onClick={() => handleToggleUserStatus(user.user_id, user.status)}
                                                        disabled={updatingUserId === user.user_id}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                            user.status === 'banned'
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-rose-50 text-rose-700'
                                                        }`}
                                                    >
                                                        {user.status === 'banned' ? (
                                                            <><UserCheck size={14} /> Unban</>
                                                        ) : (
                                                            <><Ban size={14} /> Ban</>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'reviews' ? (
                    <div className="space-y-4">
                        {reviewsLoading ? (
                            <div className="h-40 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                            </div>
                        ) : pendingReviews.length === 0 ? (
                            <div className="bg-white rounded-2xl border p-12 text-center">
                                <CheckCircle className="mx-auto mb-2 text-emerald-500" />
                                <p className="text-slate-500">Không có review chờ duyệt.</p>
                            </div>
                        ) : (
                            pendingReviews.map((review) => (
                                <div key={review.review_id} className="bg-white rounded-2xl border p-6">
                                    <div className="flex justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-slate-800">{review.user?.full_name || review.user?.email}</p>
                                            <p className="text-sm text-slate-500">Sách: {review.book?.title}</p>
                                        </div>
                                        <span className="text-sm text-slate-500">{formatDate(review.created_at)}</span>
                                    </div>
                                    {review.title ? <p className="font-semibold text-slate-800 mb-1">{review.title}</p> : null}
                                    {review.body ? <p className="text-slate-600 text-sm mb-4">{review.body}</p> : null}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReviewAction(review.review_id, 'approved')}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
                                        >
                                            <CheckCircle size={16} /> Duyệt
                                        </button>
                                        <button
                                            onClick={() => handleReviewAction(review.review_id, 'rejected')}
                                            className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm"
                                        >
                                            <XCircle size={16} /> Từ chối
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : activeTab === 'authors' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={openAddAuthorModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                <Plus size={18} /> Thêm tác giả
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                        <th className="py-3 px-6">Tên tác giả</th>
                                        <th className="py-3 px-6">Slug</th>
                                        <th className="py-3 px-6">Số sách</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {(authorsLoading ? [] : authors).map((author) => (
                                        <tr key={author.author_id} className="border-b border-slate-50">
                                            <td className="py-3 px-6 font-semibold text-slate-800">{author.name}</td>
                                            <td className="py-3 px-6 text-slate-600">{author.slug}</td>
                                            <td className="py-3 px-6">{author._count?.book_authors ?? 0}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => openEditAuthorModal(author)} className="text-indigo-600">
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {authorsLoading ? <div className="p-6 text-center text-slate-500">Đang tải...</div> : null}
                        </div>
                    </div>
                ) : activeTab === 'publishers' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={openAddPublisherModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                <Plus size={18} /> Thêm nhà xuất bản
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                        <th className="py-3 px-6">Tên NXB</th>
                                        <th className="py-3 px-6">Slug</th>
                                        <th className="py-3 px-6">Website</th>
                                        <th className="py-3 px-6">Số sách</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {(publishersLoading ? [] : publishers).map((publisher) => (
                                        <tr key={publisher.publisher_id} className="border-b border-slate-50">
                                            <td className="py-3 px-6 font-semibold text-slate-800">{publisher.name}</td>
                                            <td className="py-3 px-6 text-slate-600">{publisher.slug}</td>
                                            <td className="py-3 px-6">
                                                {publisher.website ? (
                                                    <a href={publisher.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600">
                                                        <Globe size={14} /> Mở link
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="py-3 px-6">{publisher._count?.books ?? 0}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => openEditPublisherModal(publisher)} className="text-indigo-600">
                                                    <Edit size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {publishersLoading ? <div className="p-6 text-center text-slate-500">Đang tải...</div> : null}
                        </div>
                    </div>
                ) : activeTab === 'categories' ? (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <button onClick={openAddCategoryModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
                                <Plus size={18} /> Thêm danh mục
                            </button>
                        </div>
                        <div className="bg-white rounded-2xl border overflow-x-auto">
                            <table className="w-full min-w-[900px] text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b text-sm text-slate-500">
                                        <th className="py-3 px-6">Tên danh mục</th>
                                        <th className="py-3 px-6">Slug</th>
                                        <th className="py-3 px-6">Thứ tự ưu tiên (Sort)</th>
                                        <th className="py-3 px-6">Số sách liên kết</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {(categoriesLoading ? [] : categories).map((cat) => (
                                        <tr key={cat.category_id} className="border-b border-slate-50">
                                            <td className="py-3 px-6 font-semibold text-slate-800">{cat.name}</td>
                                            <td className="py-3 px-6 text-slate-600">{cat.slug}</td>
                                            <td className="py-3 px-6 text-slate-600">{cat.sort_order}</td>
                                            <td className="py-3 px-6">{cat._count?.book_categories ?? 0}</td>
                                            <td className="py-3 px-6 text-center flex justify-center gap-3">
                                                <button onClick={() => openEditCategoryModal(cat)} className="text-indigo-600">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => { if(window.confirm('Chắc chắn xoá danh mục này?')) handleDeleteCategory(cat.category_id); }} className="text-rose-600">
                                                    <Ban size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {categoriesLoading ? <div className="p-6 text-center text-slate-500">Đang tải...</div> : null}
                        </div>
                    </div>
                ) : null}
            </div>

            {showBookModal ? (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingBookId ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</h3>
                            <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-rose-500">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleBookSubmit} className="p-6 space-y-4 overflow-y-auto">
                            <input required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} placeholder="Tên sách" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input required value={bookForm.slug} onChange={(e) => setBookForm({ ...bookForm, slug: e.target.value })} placeholder="Slug" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <div className="grid grid-cols-2 gap-4">
                                <input required type="number" value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} placeholder="Giá" className="w-full border border-slate-200 p-3 rounded-xl" />
                                <input required type="number" value={bookForm.stock_qty} onChange={(e) => setBookForm({ ...bookForm, stock_qty: e.target.value })} placeholder="Tồn kho" className="w-full border border-slate-200 p-3 rounded-xl" />
                            </div>
                            <div className="flex gap-4 items-center">
                                {bookForm.cover_url && (
                                    <img src={bookForm.cover_url.startsWith('http') ? bookForm.cover_url : `${API_URL}${bookForm.cover_url}`} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200" />
                                )}
                                <div className="flex-1 space-y-2">
                                    <input value={bookForm.cover_url} onChange={(e) => setBookForm({ ...bookForm, cover_url: e.target.value })} placeholder="URL ảnh bìa hoặc Upload" className="w-full border border-slate-200 p-3 rounded-xl" />
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                                            {isUploadingImage ? 'Đang tải lên...' : 'Chọn ảnh từ máy tính'}
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <textarea rows={4} value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} placeholder="Mô tả" className="w-full border border-slate-200 p-3 rounded-xl" />

                            {/* ─── Extra Images Gallery Manager ─── */}
                            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-700">🖼 Ảnh phụ (Gallery)</span>
                                    <span className="text-xs text-slate-400">{bookForm.extra_images.length} ảnh</span>
                                </div>

                                {/* Existing images */}
                                {bookForm.extra_images.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {bookForm.extra_images.map((url, idx) => (
                                            <div key={idx} className="relative group w-16 h-20">
                                                <img
                                                    src={url.startsWith('http') ? url : `${API_URL}${url}`}
                                                    alt={`Extra ${idx + 1}`}
                                                    className="w-full h-full object-cover rounded-lg border border-slate-200"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/64x80?text=?'; }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setBookForm(prev => ({
                                                        ...prev,
                                                        extra_images: prev.extra_images.filter((_, i) => i !== idx)
                                                    }))}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                                    title="Xóa ảnh này"
                                                >
                                                    <X size={10} />
                                                </button>
                                                <span className="absolute bottom-0.5 left-0.5 bg-black/50 text-white text-[9px] rounded px-0.5">{idx + 1}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add URL input */}
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        id="extra-image-url-input"
                                        placeholder="Dán URL ảnh phụ vào đây..."
                                        className="flex-1 border border-slate-200 p-2.5 rounded-xl text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.target as HTMLInputElement;
                                                const url = input.value.trim();
                                                if (url) {
                                                    setBookForm(prev => ({
                                                        ...prev,
                                                        extra_images: [...prev.extra_images, url]
                                                    }));
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('extra-image-url-input') as HTMLInputElement;
                                            const url = input?.value.trim();
                                            if (url) {
                                                setBookForm(prev => ({
                                                    ...prev,
                                                    extra_images: [...prev.extra_images, url]
                                                }));
                                                input.value = '';
                                            }
                                        }}
                                        className="px-4 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Plus size={16} /> Thêm
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">Nhấn Enter hoặc bấm Thêm để thêm URL. Hover vào ảnh để xóa.</p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowBookModal(false)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Hủy</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">{editingBookId ? 'Cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showAuthorModal ? (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
                        <div className="p-6 border-b flex justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingAuthorId ? 'Cập nhật tác giả' : 'Thêm tác giả'}</h3>
                            <button onClick={() => setShowAuthorModal(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAuthorSubmit} className="p-6 space-y-4">
                            <input required value={authorForm.name} onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })} placeholder="Tên tác giả" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input required value={authorForm.slug} onChange={(e) => setAuthorForm({ ...authorForm, slug: e.target.value })} placeholder="Slug" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input value={authorForm.avatar_url} onChange={(e) => setAuthorForm({ ...authorForm, avatar_url: e.target.value })} placeholder="Avatar URL (tuỳ chọn)" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <textarea rows={4} value={authorForm.bio} onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })} placeholder="Bio (tuỳ chọn)" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAuthorModal(false)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Hủy</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">{editingAuthorId ? 'Cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showPublisherModal ? (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
                        <div className="p-6 border-b flex justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingPublisherId ? 'Cập nhật nhà xuất bản' : 'Thêm nhà xuất bản'}</h3>
                            <button onClick={() => setShowPublisherModal(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handlePublisherSubmit} className="p-6 space-y-4">
                            <input required value={publisherForm.name} onChange={(e) => setPublisherForm({ ...publisherForm, name: e.target.value })} placeholder="Tên NXB" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input required value={publisherForm.slug} onChange={(e) => setPublisherForm({ ...publisherForm, slug: e.target.value })} placeholder="Slug" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input value={publisherForm.website} onChange={(e) => setPublisherForm({ ...publisherForm, website: e.target.value })} placeholder="Website (tuỳ chọn)" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowPublisherModal(false)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Hủy</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">{editingPublisherId ? 'Cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showCategoryModal ? (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
                        <div className="p-6 border-b flex justify-between">
                            <h3 className="text-xl font-bold text-slate-800">{editingCategoryId ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                            <input required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Tên danh mục" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input required value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="Slug (vd: tieu-thuyet)" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <input required type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} placeholder="Thứ tự hiển thị (0, 1, 2...)" className="w-full border border-slate-200 p-3 rounded-xl" />
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Hủy</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold">{editingCategoryId ? 'Cập nhật' : 'Thêm mới'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {/* User Orders Modal */}
            {selectedUserForOrders ? (
                <div className="fixed inset-0 z-50 bg-slate-900/40 flex justify-center items-start p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-8">
                        <div className="p-6 border-b flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    Lịch sử đơn hàng
                                </h3>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {selectedUserForOrders.full_name || selectedUserForOrders.email} — {selectedUserForOrders.email}
                                </p>
                            </div>
                            <button onClick={() => setSelectedUserForOrders(null)} className="text-slate-400 hover:text-rose-500">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            {userOrdersLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                                </div>
                            ) : userOrders.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">Khách hàng này chưa có đơn hàng nào.</p>
                            ) : (
                                <div className="space-y-4">
                                    {userOrders.map((order: any) => {
                                        const sm = getOrderStatusMeta(order.status);
                                        return (
                                            <div key={order.order_id} className="border rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-4 py-3 flex flex-wrap gap-3 justify-between items-center border-b">
                                                    <span className="font-bold text-slate-800 text-sm">#{order.order_code}</span>
                                                    <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                                                    <span className="font-bold text-indigo-600 text-sm">{formatPrice(order.total_amount)}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${sm.badgeClassName}`}>{sm.label}</span>
                                                </div>
                                                {order.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="px-4 py-2 flex items-center gap-3 border-b last:border-0 text-sm">
                                                        <img
                                                            src={item.book?.cover_url ? (item.book.cover_url.startsWith('http') ? item.book.cover_url : `${API_URL}${item.book.cover_url}`) : 'https://placehold.co/40x56'}
                                                            alt={item.book?.title}
                                                            className="w-8 h-11 object-cover rounded"
                                                        />
                                                        <span className="flex-1 text-slate-700">{item.book?.title}</span>
                                                        <span className="text-slate-500">x{item.quantity}</span>
                                                        <span className="text-slate-700 font-medium">{formatPrice(item.unit_price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
