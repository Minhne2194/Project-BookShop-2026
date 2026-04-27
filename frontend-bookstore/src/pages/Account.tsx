import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, MapPin, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getOrderStatusMeta } from '../utils/orderStatus';

interface OrderItem {
  quantity: number;
  unit_price: number | string;
  book: {
    title: string;
    cover_url: string;
  };
}

interface Order {
  order_code: string;
  created_at: string;
  total_amount: number | string;
  status: string;
  items?: OrderItem[];
}

interface UserProfile {
  email: string;
  full_name?: string | null;
  phone?: string | null;
}

type MessageState = {
  type: '' | 'success' | 'error';
  text: string;
};

export function Account() {
  const { token, setToken } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchAccountData = async () => {
      setLoading(true);

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profileRes, ordersRes] = await Promise.all([
          fetch('http://localhost:3000/users/profile', { headers }),
          fetch('http://localhost:3000/orders/my-orders', { headers }),
        ]);

        if (profileRes.ok) {
          const profileData: UserProfile = await profileRes.json();
          setProfile(profileData);
          setEditFullName(profileData.full_name || '');
          setEditPhone(profileData.phone || '');
        }

        if (ordersRes.ok) {
          const ordersData: Order[] = await ordersRes.json();
          setOrders(ordersData);
        } else {
          setOrders([]);
        }
      } catch (fetchError) {
        console.error('Lỗi tải tài khoản:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchAccountData();
  }, [token]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('http://localhost:3000/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ full_name: editFullName, phone: editPhone }),
      });

      if (!res.ok) {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật.' });
        return;
      }

      const updatedProfile: UserProfile = await res.json();
      setProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' });
    } catch (updateError) {
      console.error(updateError);
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/users/profile', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        alert(`Lỗi: ${errorData?.message || 'Không thể xóa tài khoản.'}`);
        return;
      }

      localStorage.removeItem('token');
      setToken(null);
      navigate('/');
    } catch (deleteError) {
      console.error(deleteError);
      alert('Có lỗi xảy ra khi xóa tài khoản.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    navigate('/');
  };

  const formatPrice = (price: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const renderStatusBadge = (status: string) => {
    const statusMeta = getOrderStatusMeta(status);
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta.badgeClassName}`}>
        {statusMeta.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Tài khoản của tôi</h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-24">
              <div className="flex items-center gap-3 mb-6 px-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl uppercase shrink-0">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-900 truncate">{profile?.full_name || 'Thành viên'}</p>
                  <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setMessage({ type: '', text: '' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User size={20} /> Thông tin cá nhân
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag size={20} /> Lịch sử đơn hàng
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    activeTab === 'addresses' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MapPin size={20} /> Sổ địa chỉ
                </button>
                <div className="h-px bg-slate-100 my-2 mx-4" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50">
                  <LogOut size={20} /> Đăng xuất
                </button>
              </nav>
            </div>
          </div>

          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Thông tin cá nhân</h2>

                {message.text && (
                  <div
                    className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                      message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                  </div>
                )}

                <form className="space-y-6 max-w-lg" onSubmit={handleUpdateProfile}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                      type="email"
                      disabled
                      className="w-full px-4 py-2 bg-slate-50 border text-slate-500 rounded-lg"
                      value={profile?.email || ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Thêm SĐT..."
                    />
                  </div>

                  <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-70">
                    {isSaving ? 'ĐANG LƯU...' : 'Lưu thay đổi'}
                  </button>
                </form>

                <div className="mt-12 pt-8 border-t border-rose-100">
                  <h3 className="text-lg font-bold text-rose-600 mb-2 flex items-center gap-2">
                    <AlertCircle size={20} /> Xóa tài khoản
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-lg">
                    Một khi bạn xóa tài khoản, mọi thông tin cá nhân của bạn sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-5 py-2.5 bg-white border-2 border-rose-600 text-rose-600 font-bold rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    Xóa tài khoản vĩnh viễn
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-100">Lịch sử đơn hàng</h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Bạn chưa có đơn hàng nào.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.order_code} className="border rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 flex flex-wrap gap-4 justify-between items-center border-b">
                          <div>
                            <p className="text-sm text-slate-500">Mã đơn</p>
                            <p className="font-bold">{order.order_code}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Ngày đặt</p>
                            <p className="font-bold">{formatDate(order.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500">Tổng tiền</p>
                            <p className="font-bold text-indigo-600">{formatPrice(order.total_amount)}</p>
                          </div>
                          <div>{renderStatusBadge(order.status)}</div>
                        </div>

                        {order.items?.map((item, index) => (
                          <div key={`${order.order_code}-${index}`} className="px-6 py-4 flex items-center gap-4 border-b last:border-0">
                            <img
                              src={item.book.cover_url || 'https://placehold.co/100x150'}
                              alt={item.book.title}
                              className="w-16 h-20 bg-slate-200 rounded object-cover"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{item.book.title}</p>
                              <p className="text-sm text-slate-500">
                                Số lượng: {item.quantity} x {formatPrice(item.unit_price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <h2 className="text-xl font-bold text-slate-900">Sổ địa chỉ</h2>
                </div>

                <div className="border border-indigo-200 bg-indigo-50/30 p-5 rounded-xl block relative">
                  <span className="absolute top-4 right-4 text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                    Mặc định
                  </span>
                  <p className="font-bold text-slate-900 mb-1">{profile?.full_name || 'Đang cập nhật'}</p>
                  <p className="text-slate-600 text-sm">{profile?.phone || 'Chưa có SĐT'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
