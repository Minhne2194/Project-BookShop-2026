import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SafeImage } from '../components/SafeImage';

const API = 'http://localhost:3000';
const ALL_CATEGORY_VALUE = 'all';

interface Book {
    book_id: string;
    title: string;
    author?: string;
    price: string | number;
    cover_url: string | null;
    category?: string;
}

interface Category {
    category_id: string;
    parent_id?: string | null;
    name: string;
    slug: string;
    level: number;
}

interface CategoryTreeNode extends Category {
    children: CategoryTreeNode[];
}

export function Search() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const initialCategory = searchParams.get('category') || ALL_CATEGORY_VALUE;

    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [totalResults, setTotalResults] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sortOrder, setSortOrder] = useState('newest');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const minPrice = '';
    const maxPrice = '';
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const { handleAddToCart } = useCart();

    const matchesCategory = (category: Category, value: string) => {
        return category.category_id === value || category.slug === value || category.name === value;
    };

    const toggleGroup = (categoryId: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [categoryId]: !prev[categoryId],
        }));
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API}/categories`);
                const json = await res.json();
                const nextCategories = Array.isArray(json) ? json : [];
                setCategories(nextCategories);

                setExpandedGroups(
                    nextCategories
                        .filter((category: Category) => !category.parent_id)
                        .reduce<Record<string, boolean>>((acc, category) => {
                            acc[category.category_id] = true;
                            return acc;
                        }, {}),
                );
            } catch (err) {
                console.error('Loi tai danh muc:', err);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const rawCategory = searchParams.get('category');
        if (!rawCategory) {
            setSelectedCategory(ALL_CATEGORY_VALUE);
            return;
        }

        const matchedCategory = categories.find((category) => matchesCategory(category, rawCategory));
        if (!matchedCategory) {
            setSelectedCategory(rawCategory);
            return;
        }

        setSelectedCategory(matchedCategory.category_id);

        if (rawCategory !== matchedCategory.category_id) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('category', matchedCategory.category_id);
            setSearchParams(nextParams, { replace: true });
        }
    }, [categories, searchParams, setSearchParams]);

    const buildUrl = (pageNum: number) => {
        if (query) {
            return `${API}/books/search?q=${encodeURIComponent(query)}`;
        }

        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', '20');
        params.set('sort', sortOrder);
        if (selectedCategory !== ALL_CATEGORY_VALUE) params.set('category', selectedCategory);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        return `${API}/books?${params.toString()}`;
    };

    const fetchBooks = async (pageNum: number, reset = false) => {
        try {
            if (reset) setLoading(true);
            else setLoadingMore(true);

            const res = await fetch(buildUrl(pageNum));
            const json = await res.json();

            if (json.data) {
                setBooks((prev) => (reset ? json.data : [...prev, ...json.data]));
                setHasMore(pageNum < json.meta.totalPages);
                setTotalResults(json.meta.total);
            } else {
                setBooks((prev) => (reset ? json : [...prev, ...json]));
                setHasMore(false);
                setTotalResults(json.length);
            }
        } catch (err) {
            console.error('Loi tai sach:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchBooks(1, true);
        setPage(1);
    }, [query, selectedCategory, sortOrder, minPrice, maxPrice]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
                if (!loading && !loadingMore && hasMore) {
                    setPage((currentPage) => currentPage + 1);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore]);

    useEffect(() => {
        if (page > 1) fetchBooks(page, false);
    }, [page]);

    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory(categoryId);
        const nextParams = new URLSearchParams(searchParams);

        if (categoryId === ALL_CATEGORY_VALUE) nextParams.delete('category');
        else nextParams.set('category', categoryId);

        setSearchParams(nextParams);
    };

    const buildCategoryTree = (): CategoryTreeNode[] => {
        const nodes = new Map<string, CategoryTreeNode>();

        categories.forEach((category) => {
            nodes.set(category.category_id, { ...category, children: [] });
        });

        nodes.forEach((node) => {
            if (!node.parent_id) return;
            const parent = nodes.get(node.parent_id);
            if (parent) {
                parent.children.push(node);
            }
        });

        const sortNodes = (items: CategoryTreeNode[]) => {
            items.sort((left, right) => {
                if (left.level !== right.level) return left.level - right.level;
                return left.name.localeCompare(right.name, 'vi');
            });
            items.forEach((item) => sortNodes(item.children));
            return items;
        };

        return sortNodes(Array.from(nodes.values()).filter((node) => !node.parent_id));
    };

    const renderCategoryNode = (category: CategoryTreeNode, depth = 0) => {
        const hasChildren = category.children.length > 0;
        const isExpanded = expandedGroups[category.category_id] ?? true;

        return (
            <div key={category.category_id} className={depth === 0 ? 'border-b border-slate-100 pb-2 last:border-0' : ''}>
                <div className="flex items-center gap-1" style={{ marginLeft: `${depth * 12}px` }}>
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={() => toggleGroup(category.category_id)}
                            className="h-8 w-8 shrink-0 flex items-center justify-center text-slate-500 hover:text-indigo-600"
                            aria-label={isExpanded ? 'Thu gon danh muc' : 'Mo rong danh muc'}
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    ) : (
                        <span className="w-8 shrink-0" />
                    )}

                    <button
                        type="button"
                        onClick={() => handleCategoryChange(category.category_id)}
                        className={`flex-1 text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                            selectedCategory === category.category_id
                                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                    >
                        {category.name}
                    </button>
                </div>

                {hasChildren && isExpanded && (
                    <div className="space-y-1 mt-1">
                        {category.children.map((child) => renderCategoryNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    const categoryTree = buildCategoryTree();
    const filteredBooks = books;

    const formatPrice = (price: string | number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    return (
        <div className="bg-slate-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-2">
                            {query ? `Kết quả tìm kiếm cho: "${query}"` : 'Tất cả sách'}
                        </h1>
                        <p className="text-slate-500">Hiển thị {filteredBooks.length} / {totalResults} kết quả</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="md:hidden flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                            <Filter className="w-4 h-4" /> Lọc
                        </button>

                        <div className="relative flex-1 md:w-48">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="w-full appearance-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="bestseller">Bán chạy nhất</option>
                                <option value="rating">Đánh giá cao nhất</option>
                                <option value="price_asc">Giá: Thấp đến Cao</option>
                                <option value="price_desc">Giá: Cao đến Thấp</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-8">
                    <div className={`md:col-span-1 border-r border-slate-200 pr-4 md:block ${isFilterOpen ? 'block' : 'hidden'}`}>
                        <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Danh mục</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleCategoryChange(ALL_CATEGORY_VALUE)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                    selectedCategory === ALL_CATEGORY_VALUE
                                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                Tất cả
                            </button>

                            <div className="h-px bg-slate-200 my-2"></div>

                            {categoryTree.map((category) => renderCategoryNode(category))}
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : filteredBooks.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {filteredBooks.map((book) => (
                                    <div key={book.book_id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 group flex flex-col h-full hover:shadow-md transition-shadow">
                                        <Link to={`/book/${book.book_id}`} className="block relative overflow-hidden rounded-lg mb-4 aspect-2/3">
                                            <SafeImage
                                                src={book.cover_url || 'https://placehold.co/300x450'}
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
                            <div className="py-20 text-center">
                                <p className="text-xl text-slate-500 font-medium mb-4">Không tìm thấy cuốn sách nào phù hợp.</p>
                                <button
                                    onClick={() => {
                                        setSearchParams({});
                                        setSelectedCategory(ALL_CATEGORY_VALUE);
                                        setSortOrder('newest');
                                    }}
                                    className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}

                        {loadingMore && (
                            <div className="flex justify-center items-center py-6">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
