import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

// Định nghĩa mảng Danh mục chuẩn (khớp với Header và Footer)
const CATEGORIES = [
    'Văn học',
    'Kinh tế',
    'Tâm lý - Kỹ năng sống',
    'Sách thiếu nhi',
    'Ngoại ngữ'
];

interface Book {
    book_id: string;
    title: string;
    author?: string; // Có thể API trả về hoặc không
    price: string | number;
    cover_url: string | null;
    category?: string; // Giả định backend có trường này
}

export function Search() {
    // --- 1. ROUTER & URL PARAMS ---
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const initialCategory = searchParams.get('category') || 'Tất cả';

    // --- 2. STATES ---
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sortOrder, setSortOrder] = useState('newest'); // newest, price_asc, price_desc
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const { handleAddToCart } = useCart();

    // --- 3. FETCH DATA TỪ API ---
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

    // --- 4. XỬ LÝ URL PARAMS KHI ĐỔI DANH MỤC ---
    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        if (cat === 'Tất cả') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    // Đồng bộ state khi User nhấn nút "Back" trên trình duyệt
    useEffect(() => {
        setSelectedCategory(searchParams.get('category') || 'Tất cả');
    }, [searchParams]);

    // --- 5. LOGIC LỌC & SẮP XẾP SÁCH ---
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // Lọc theo từ khóa tìm kiếm (Tên sách hoặc Tác giả)
        if (query) {
            const lowerQuery = query.toLowerCase();
            result = result.filter(b =>
                b.title.toLowerCase().includes(lowerQuery) ||
                (b.author && b.author.toLowerCase().includes(lowerQuery))
            );
        }

        // Lọc theo danh mục
        if (selectedCategory !== 'Tất cả') {
            // Lưu ý: Nếu backend không có trường 'category', kết quả sẽ rỗng. 
            // Tạm thời so sánh trực tiếp.
            result = result.filter(b => b.category === selectedCategory);
        }

        // Sắp xếp
        result.sort((a, b) => {
            const priceA = Number(a.price);
            const priceB = Number(b.price);
            if (sortOrder === 'price_asc') return priceA - priceB;
            if (sortOrder === 'price_desc') return priceB - priceA;
            return 0; // newest (mặc định giữ nguyên thứ tự API)
        });

        return result;
    }, [books, query, selectedCategory, sortOrder]);

    // --- 6. HÀM TIỆN ÍCH FORMAT TIỀN ---
    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    return (
        <div className="bg-slate-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* --- HEADER TÌM KIẾM --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-2">
                            {query ? `Kết quả tìm kiếm cho: "${query}"` : 'Tất cả sách'}
                        </h1>
                        <p className="text-slate-500">Hiển thị {filteredBooks.length} kết quả</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* Nút mở Filter (Mobile) */}
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="md:hidden flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                            <Filter className="w-4 h-4" /> Lọc
                        </button>

                        {/* Dropdown Sắp xếp */}
                        <div className="relative flex-1 md:w-48">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full appearance-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="price_asc">Giá: Thấp đến Cao</option>
                                <option value="price_desc">Giá: Cao đến Thấp</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8">

                    {/* --- SIDEBAR DANH MỤC --- */}
                    <div className={`md:col-span-1 border-r border-slate-200 pr-4 md:block ${isFilterOpen ? 'block' : 'hidden'}`}>
                        <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Danh mục</h3>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => handleCategoryChange('Tất cả')}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === 'Tất cả' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    Tất cả
                                </button>
                            </li>
                            {CATEGORIES.map(cat => (
                                <li key={cat}>
                                    <button
                                        onClick={() => handleCategoryChange(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {cat}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* --- GRID HIỂN THỊ SÁCH --- */}
                    <div className="md:col-span-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : filteredBooks.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredBooks.map(book => (
                                    // Thẻ sách inline để thay thế BookCard cũ
                                    <div key={book.book_id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 group flex flex-col h-full hover:shadow-md transition-shadow">
                                        <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden rounded-lg mb-4 aspect-2/3">
                                            <img
                                                src={book.cover_url || "https://placehold.co/300x450"}
                                                alt={book.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </Link>

                                        <div className="flex flex-col grow">
                                            <Link to={`/book/${book.book_id}`}>
                                                <h3 className="font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                                                    {book.title}
                                                </h3>
                                            </Link>
                                            <p className="text-indigo-600 font-bold mt-auto pt-3 text-lg">
                                                {formatPrice(book.price)}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleAddToCart(book.book_id)}
                                            className="w-full mt-4 bg-slate-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <ShoppingCart className="w-4 h-4" /> Thêm vào giỏ
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Trạng thái trống
                            <div className="py-20 text-center">
                                <p className="text-xl text-slate-500 font-medium mb-4">Không tìm thấy cuốn sách nào phù hợp.</p>
                                <button
                                    onClick={() => { setSearchParams({}); setSelectedCategory('Tất cả'); setSortOrder('newest') }}
                                    className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}