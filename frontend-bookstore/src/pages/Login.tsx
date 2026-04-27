import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { setToken } = useCart();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password_raw: password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                setToken(data.access_token);
                navigate('/');
            } else {
                const errData = await res.json().catch(() => null);
                setError(errData?.message || 'Sai email hoặc mật khẩu!');
            }
        } catch (err) {
            setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <h1 className="text-2xl md:text-3xl font-serif text-slate-800 mb-4 text-left">
                    Đăng nhập tài khoản
                </h1>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="block text-sm text-slate-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-sm text-slate-700">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600 cursor-pointer accent-indigo-600"
                                disabled={isLoading}
                            />
                            <label htmlFor="remember" className="text-sm text-slate-700 cursor-pointer select-none">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>

                        <div className="text-sm text-slate-500 leading-relaxed pt-2">
                            Bằng việc đăng nhập, bạn đồng ý với Modern Book's{' '}
                            <a href="#" className="text-indigo-600 hover:underline">Chính sách</a>
                            {' '}và{' '}
                            <a href="#" className="text-indigo-600 hover:underline">Điều khoản</a>.
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">ĐANG XỬ LÝ...</span>
                                ) : (
                                    "ĐĂNG NHẬP"
                                )}
                            </button>
                        </div>

                        {/* Đã cập nhật phần text dưới cùng theo yêu cầu */}
                        <div className="text-sm text-slate-600 text-center pt-2">
                            hoặc <Link to="/register" className="text-indigo-600 font-medium hover:underline">Tạo một tài khoản mới</Link> | <a href="#" className="text-indigo-600 font-medium hover:underline">Quên mật khẩu?</a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}