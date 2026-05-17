import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, ChevronDown, ShoppingCart, X } from 'lucide-react';
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
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [rating, setRating] = useState('');
    const [lang, setLang] = useState('');
    const [customMin, setCustomMin] = useState('');
    const [customMax, setCustomMax] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const filterRef = useRef<HTMLDivElement>(null);
    const { handleAddToCart } = useCart();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        if (isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isFilterOpen]);

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
        const params = new URLSearchParams();
        params.set('page', String(pageNum));
        params.set('limit', '20');
        params.set('sort', sortOrder);
        if (query) params.set('q', query);
        if (selectedCategory !== ALL_CATEGORY_VALUE) params.set('category', selectedCategory);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (rating) params.set('rating', rating);
        if (lang) params.set('lang', lang);
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
    }, [query, selectedCategory, sortOrder, minPrice, maxPrice, rating]);

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

    const handlePriceRangeChange = (min: string, max: string) => {
        setMinPrice(min);
        setMaxPrice(max);
        setCustomMin(min);
        setCustomMax(max);
    };

    const handleCustomPriceApply = () => {
        handlePriceRangeChange(customMin.trim(), customMax.trim());
    };

    const handleRatingChange = (value: string) => {
        setRating(value);
    };

    const handleApplyFilters = () => {
        const nextParams = new URLSearchParams(searchParams);
        if (minPrice) nextParams.set('minPrice', minPrice);
        else nextParams.delete('minPrice');
        if (maxPrice) nextParams.set('maxPrice', maxPrice);
        else nextParams.delete('maxPrice');
        if (rating) nextParams.set('rating', rating);
        else nextParams.delete('rating');
        setSearchParams(nextParams);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        setRating('');
        setCustomMin('');
        setCustomMax('');
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('minPrice');
        nextParams.delete('maxPrice');
        nextParams.delete('rating');
        setSearchParams(nextParams);
        setIsFilterOpen(false);
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

    const hasActiveFilters = minPrice || maxPrice || rating;

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
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="md:hidden flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium"
                        >
                            <Filter className="w-4 h-4" /> Lọc
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            )}
                        </button>

                        {/* Desktop filter dropdown */}
                        <div ref={filterRef} className="relative hidden md:block">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-colors ${
                                    hasActiveFilters || isFilterOpen
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                Tất cả
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-5">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 uppercase tracking-wider text-sm">Bộ lọc</h3>
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="text-slate-400 hover:text-slate-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Khoảng giá */}
                                    <h4 className="font-semibold text-slate-800 mb-3 text-sm">Khoảng giá</h4>
                                    <div className="space-y-2 mb-4">
                                        {[
                                            { label: 'Dưới 50.000đ', min: '', max: '50000' },
                                            { label: '50.000đ - 100.000đ', min: '50000', max: '100000' },
                                            { label: '100.000đ - 200.000đ', min: '100000', max: '200000' },
                                            { label: 'Trên 200.000đ', min: '200000', max: '' },
                                        ].map((range) => (
                                            <label
                                                key={range.label}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                                    minPrice === range.min && maxPrice === range.max
                                                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="priceRange"
                                                    checked={minPrice === range.min && maxPrice === range.max}
                                                    onChange={() => handlePriceRangeChange(range.min, range.max)}
                                                    className="accent-indigo-600 w-4 h-4"
                                                />
                                                {range.label}
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 items-center mb-4">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={customMin}
                                            onChange={(e) => setCustomMin(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <span className="text-slate-400 text-sm">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={customMax}
                                            onChange={(e) => setCustomMax(e.target.value)}
                                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCustomPriceApply}
                                            className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors whitespace-nowrap"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>

                                    {/* Đánh giá */}
                                    <h4 className="font-semibold text-slate-800 mb-3 text-sm">Đánh giá</h4>
                                    <div className="space-y-2 mb-5">
                                        {[
                                            { label: 'Từ 5 sao', value: '5', stars: 5 },
                                            { label: 'Từ 4 sao', value: '4', stars: 4 },
                                            { label: 'Từ 3 sao', value: '3', stars: 3 },
                                        ].map((item) => (
                                            <label
                                                key={item.value}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                                    rating === item.value
                                                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="ratingFilter"
                                                    checked={rating === item.value}
                                                    onChange={() => handleRatingChange(rating === item.value ? '' : item.value)}
                                                    className="accent-indigo-600 w-4 h-4"
                                                />
                                                <span className="flex items-center gap-0.5">
                                                    {Array.from({ length: item.stars }, (_, i) => (
                                                        <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                    <span className="ml-1">{item.label}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* Ngôn ngữ */}
                                    <h4 className="font-semibold text-slate-800 mb-3 text-sm">Ngôn ngữ</h4>
                                    <div className="flex gap-2 mb-5">
                                        {[
                                            { label: 'Tất cả', value: '' },
                                            { label: 'Tiếng Việt', value: 'vi' },
                                            { label: 'Tiếng Anh', value: 'en' },
                                        ].map((item) => (
                                            <button
                                                key={item.value}
                                                type="button"
                                                onClick={() => setLang(lang === item.value ? '' : item.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                    lang === item.value
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleClearFilters}
                                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                        <button
                                            onClick={handleApplyFilters}
                                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort dropdown */}
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
                    {/* Sidebar — chỉ danh mục */}
                    <div className="md:col-span-1 border-r border-slate-200 pr-4 hidden md:block">
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

                    {/* Mobile: sidebar only visible when filter button toggled */}
                    <div className={`md:hidden ${isFilterOpen ? 'block' : 'hidden'}`}>
                        <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-sm">Danh mục</h3>
                        <div className="space-y-4 mb-6">
                            <button
                                onClick={() => {
                                    handleCategoryChange(ALL_CATEGORY_VALUE);
                                    setIsFilterOpen(false);
                                }}
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

                        {/* Mobile filter section */}
                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Khoảng giá</h4>
                        <div className="space-y-2 mb-4">
                            {[
                                { label: 'Dưới 50.000đ', min: '', max: '50000' },
                                { label: '50.000đ - 100.000đ', min: '50000', max: '100000' },
                                { label: '100.000đ - 200.000đ', min: '100000', max: '200000' },
                                { label: 'Trên 200.000đ', min: '200000', max: '' },
                            ].map((range) => (
                                <label
                                    key={range.label}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                        minPrice === range.min && maxPrice === range.max
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="priceRangeMobile"
                                        checked={minPrice === range.min && maxPrice === range.max}
                                        onChange={() => handlePriceRangeChange(range.min, range.max)}
                                        className="accent-indigo-600 w-4 h-4"
                                    />
                                    {range.label}
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2 items-center mb-4">
                            <input type="number" placeholder="Min" value={customMin} onChange={(e) => setCustomMin(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <span className="text-slate-400 text-sm">-</span>
                            <input type="number" placeholder="Max" value={customMax} onChange={(e) => setCustomMax(e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <button type="button" onClick={handleCustomPriceApply} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors whitespace-nowrap">Áp dụng</button>
                        </div>

                        <h4 className="font-semibold text-slate-800 mb-3 text-sm">Đánh giá</h4>
                        <div className="space-y-2 mb-5">
                            {[
                                { label: 'Từ 5 sao', value: '5', stars: 5 },
                                { label: 'Từ 4 sao', value: '4', stars: 4 },
                                { label: 'Từ 3 sao', value: '3', stars: 3 },
                            ].map((item) => (
                                <label
                                    key={item.value}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                                        rating === item.value
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <input type="radio" name="ratingFilterMobile" checked={rating === item.value} onChange={() => handleRatingChange(rating === item.value ? '' : item.value)} className="accent-indigo-600 w-4 h-4" />
                                    <span className="flex items-center gap-0.5">
                                        {Array.from({ length: item.stars }, (_, i) => (
                                            <svg key={i} className="w-4 h-4 fill-amber-400" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <span className="ml-1">{item.label}</span>
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleClearFilters} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">Xóa bộ lọc</button>
                            <button onClick={handleApplyFilters} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Áp dụng</button>
                        </div>
                    </div>

                    {/* Book grid */}
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
                                        setMinPrice('');
                                        setMaxPrice('');
                                        setRating('');
                                        setCustomMin('');
                                        setCustomMax('');
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
