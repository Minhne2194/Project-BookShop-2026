# 📚 Hệ Thống Bán Sách Trực Tuyến — E-commerce Book Store

Đồ án xây dựng website thương mại điện tử chuyên về sách, cho phép người dùng tìm kiếm, mua sách trực tuyến và quản lý đơn hàng. Hệ thống cung cấp phân hệ khách hàng (storefront) và phân hệ quản trị viên (admin panel).

---

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Chạy Ứng Dụng](#-chạy-ứng-dụng)
- [Tính Năng](#-tính-năng)
- [API Endpoints](#-api-endpoints)
- [Cơ Sở Dữ Liệu](#-cơ-sở-dữ-liệu)
- [Thanh Toán Online](#-thanh-toán-online)
- [Tác Giả](#-tác-giả)

---

## 🎯 Tổng Quan

| Thông tin | Chi tiết |
|---|---|
| **Tên đồ án** | Hệ thống bán sách trực tuyến |
| **Loại** | Full-stack Web Application |
| **Kiến trúc** | Modular Monolith — Client-Server — RESTful API |
| **Frontend** | React 19 + TypeScript 6.x + Vite 8.x + TailwindCSS 4 |
| **Backend** | NestJS 11 + Prisma ORM + PostgreSQL 17 |
| **Search Engine** | Elasticsearch 8 (với PostgreSQL fallback) |
| **Cache/Session** | Redis 7 (giỏ hàng, session, message queue) |
| **AI Chatbot** | DeepSeek AI — trợ lý mua sắm tích hợp |

### Đối tượng sử dụng

- **Khách hàng**: Tìm kiếm, duyệt sách, thêm giỏ hàng, đặt hàng, thanh toán online, nhận gợi ý AI, quản lý tài khoản.
- **Quản trị viên (Admin)**: Dashboard thống kê, quản lý sách/đơn hàng/người dùng/danh mục/tác giả/NXB/mã giảm giá, duyệt đánh giá, reindex dữ liệu tìm kiếm.

---

## 🛠 Công Nghệ Sử Dụng

### Frontend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| React | 19.x | UI Framework |
| TypeScript | 6.x | Type Safety |
| Vite | 8.x | Build Tool & Dev Server |
| TailwindCSS | 4.x | Utility-first CSS |
| React Router | 7.x | Client-side Routing |
| Lucide React | 1.x | Icon Library |
| Framer Motion | 12.x | Animation |
| canvas-confetti | 1.x | Hiệu ứng confetti |

### Backend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| NestJS | 11.x | Backend Framework |
| Prisma | 7.x | ORM — Database Access |
| PostgreSQL | 17 | Cơ sở dữ liệu chính |
| Elasticsearch | 8.x | Full-text search engine |
| Redis | 7 | Cache, Giỏ hàng, Message Queue |
| Argon2 | 0.44 | Mã hóa mật khẩu |
| JWT | — | Xác thực người dùng |
| Multer | 2.x | Upload file/ảnh |
| BullMQ | 5.x | Message queue (email) |
| Nodemailer | 8.x | Gửi email (welcome, invoice) |
| Axios | 1.x | HTTP Client (Payment Gateway) |
| Puppeteer | 24.x | Web crawler (Fahasa) |

### Infrastructure

| Công cụ | Vai trò |
|---|---|
| Docker Compose | PostgreSQL + Redis + Elasticsearch containers |
| Prisma Migrate | Database migration |
| Prisma Seed | Dữ liệu mẫu (organic + synthetic) |
| Ethereal | Email test account (dev) |

---

## 🏗 Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                           │
│   [React SPA — Vite]           [Admin Dashboard]          │
│   Port: 5173                   Route: /admin/*            │
│   + ChatWidget (DeepSeek AI)                              │
└─────────────┬──────────────────────┬─────────────────────┘
              │        HTTP          │
┌─────────────▼──────────────────────▼─────────────────────┐
│           API SERVER (NestJS — Port 3000)                 │
│   Auth · Books · Cart · Orders · Payment · Reviews        │
│   Users · Categories · Admin · Upload · Search            │
│   Recommendation · Behavior · Email · Chat               │
└──┬────────────┬──────────────┬───────────────┬───────────┘
   │            │              │               │
┌──▼──────┐ ┌──▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
│PostgreSQL│ │  Redis  │ │Elasticsearch│ │  Uploads   │
│ Port:5433│ │Port:6379│ │ Port:9200  │ │  /uploads   │
└─────────┘ └─────────┘ └────────────┘ └─────────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
Project-BookShop-2026/
│
├── docker-compose.yml          # PostgreSQL + Redis + Elasticsearch
│
├── backend-bookstore/          # NestJS Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (16 models)
│   │   ├── migrations/         # SQL migrations
│   │   ├── seed.ts             # Seed dữ liệu mẫu (organic)
│   │   └── seed-synthetic.ts   # Seed dữ liệu tổng hợp
│   ├── seed-coupon.ts          # Seed mã giảm giá
│   ├── src/
│   │   ├── admin/              # Module quản trị (thống kê, CRUD)
│   │   ├── auth/               # JWT authentication + guards
│   │   ├── behavior/           # Tracking hành vi người dùng
│   │   ├── books/              # CRUD sách + tìm kiếm cơ bản
│   │   ├── cart/               # Giỏ hàng (Redis-backed)
│   │   ├── categories/         # Quản lý thể loại sách
│   │   ├── chat/               # AI Chatbot (DeepSeek SSE)
│   │   ├── email/              # Email queue (BullMQ + Nodemailer)
│   │   ├── orders/             # Quy trình đặt hàng
│   │   ├── payment/            # MoMo, VNPay, PayOS integration
│   │   ├── prisma/             # Prisma service (singleton)
│   │   ├── recommendation/     # Gợi ý sách cá nhân hóa
│   │   ├── reviews/            # Đánh giá & bình luận
│   │   ├── search/             # Full-text search (Elasticsearch + PG fallback)
│   │   ├── upload/             # Upload ảnh bìa sách
│   │   ├── users/              # Đăng ký, profile, địa chỉ, CRUD
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Bootstrap (CORS, Validation)
│   ├── uploads/                # Thư mục lưu ảnh upload
│   ├── scripts/                # Scripts hỗ trợ (crawler Fahasa)
│   ├── docker-compose.yml      # PostgreSQL + Redis (backend local dev)
│   ├── package.json
│   └── .env                    # Biến môi trường (không commit)
│
├── frontend-bookstore/         # React Frontend SPA
│   ├── src/
│   │   ├── components/         # Header, Footer, Toast, SafeImage, ChatWidget, PromoBanner
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/              # 12 trang chính
│   │   │   ├── Home.tsx        # Trang chủ (PromoBanner, For You, Trending)
│   │   │   ├── Search.tsx      # Tìm kiếm + lọc + facets
│   │   │   ├── BookDetail.tsx  # Chi tiết sách + reviews + sách tương tự
│   │   │   ├── Cart.tsx        # Giỏ hàng + mã giảm giá
│   │   │   ├── Checkout.tsx    # Thanh toán (COD, bank, MoMo, VNPay, PayOS)
│   │   │   ├── Admin.tsx       # Admin Dashboard (full CRUD + quản lý coupon)
│   │   │   ├── Account.tsx     # Tài khoản cá nhân + lịch sử đơn hàng
│   │   │   ├── Login.tsx       # Đăng nhập
│   │   │   ├── Register.tsx    # Đăng ký
│   │   │   ├── PaymentResult.tsx # Kết quả thanh toán
│   │   │   ├── NewBooks.tsx    # Sách mới
│   │   │   └── BestSellers.tsx # Sách bán chạy
│   │   ├── utils/              # Helpers (orderStatus)
│   │   ├── App.tsx             # Routes + Layout (StoreLayout + ChatWidget)
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md                   # ← Bản gốc
```

---

## 💻 Yêu Cầu Hệ Thống

| Phần mềm | Phiên bản tối thiểu |
|---|---|
| **Node.js** | 18.x trở lên (khuyến nghị 20+) |
| **npm** | 9.x trở lên |
| **Docker** + **Docker Compose** | Mới nhất |
| **Git** | 2.x |

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Clone dự án

```bash
git clone <repo-url>
cd Project-BookShop-2026
```

### 2. Khởi động Database (PostgreSQL + Redis + Elasticsearch)

```bash
# Từ thư mục gốc dự án (dùng chung docker-compose)
docker compose up -d
```

Lệnh trên sẽ tạo:
- **PostgreSQL 17** tại `localhost:5433` (user: `root`, password: `secretpassword`, db: `bookstore_db`)
- **Redis 7** tại `localhost:6379`
- **Elasticsearch 8** tại `localhost:9200`

> Nếu chỉ cần PostgreSQL + Redis (không Elasticsearch), chạy:
> ```bash
> cd backend-bookstore
> docker compose up -d
> ```

### 3. Cấu hình Backend

```bash
cd backend-bookstore

# Cài đặt dependencies
npm install

# Tạo file .env (copy từ mẫu hoặc tạo mới)
# Xem mục "Biến Môi Trường" bên dưới

# Khởi tạo database schema
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# (Tuỳ chọn) Seed dữ liệu mẫu
npx prisma db seed

# (Tuỳ chọn) Seed dữ liệu tổng hợp (synthetic)
npm run db:seed:synthetic

# (Tuỳ chọn) Reindex dữ liệu vào Elasticsearch
curl -X POST http://localhost:3000/search/reindex-dev 
  -H "x-dev-secret: dev-reindex-2026"
```

### 4. Cấu hình Frontend

```bash
cd ../frontend-bookstore

# Cài đặt dependencies
npm install
```

### 5. Biến Môi Trường

Tạo file `backend-bookstore/.env` với nội dung sau:

```env
# Database
DATABASE_URL="postgresql://root:secretpassword@localhost:5433/bookstore_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Redis
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"

# Elasticsearch
ELASTICSEARCH_NODE="http://localhost:9200"
ELASTICSEARCH_INDEX="books_v1"

# Application
PORT=3000
FRONTEND_URL="http://localhost:5173"
PAYMENT_RESULT_URL="http://localhost:5173/payment/result"
DEV_SECRET="dev-reindex-2026"

# DeepSeek AI Chat (tuỳ chọn)
DEEPSEEK_API_KEY="your-deepseek-api-key"
DEEPSEEK_MODEL="deepseek-chat"

# SMTP Email (tuỳ chọn — nếu không có sẽ dùng Ethereal test account)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""

# MoMo Sandbox (tuỳ chọn)
MOMO_PARTNER_CODE="MOMOBKUN20180810"
MOMO_ACCESS_KEY="klm05673644177"
MOMO_SECRET_KEY="at67qH6mk8w5Y1n71y"
MOMO_RETURN_URL="http://localhost:5173/payment/result"
MOMO_NOTIFY_URL="https://<your-ngrok>.ngrok-free.dev/payment/momo/callback"

# VNPay Sandbox (tuỳ chọn)
VNPAY_TMN_CODE="2QX1X6YX"
VNPAY_HASH_SECRET="CHXFTSLDRNNDSZMZSXWIXLXNMDHOHSTZ"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:5173/payment/result"
VNPAY_NOTIFY_URL="https://<your-ngrok>.ngrok-free.dev/payment/vnpay/callback"

# PayOS Sandbox (tuỳ chọn)
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
```

> ⚠️ **Lưu ý**: File `.env` **không được commit** lên Git (đã có trong `.gitignore`).

---

## ▶️ Chạy Ứng Dụng

Mở **2 terminal** riêng biệt:

**Terminal 1 — Backend (NestJS)**:
```bash
cd backend-bookstore
npm run start:dev
```
→ API chạy tại: `http://localhost:3000`

**Terminal 2 — Frontend (Vite + React)**:
```bash
cd frontend-bookstore
npm run dev
```
→ Web chạy tại: `http://localhost:5173`

---

## ✨ Tính Năng

### Phân Hệ Khách Hàng (Storefront)

| Tính năng | Mô tả |
|---|---|
| 🏠 **Trang chủ** | Promo banner slideshow, flash sale countdown, promo cards, mã giảm giá, sách đề xuất |
| 🔍 **Tìm kiếm nâng cao** | Full-text search (Elasticsearch + PG fallback), autocomplete suggest, facets (giá, rating, thể loại), đánh dấu từ khóa, gợi ý sửa lỗi chính tả |
| 🏷️ **Bộ lọc** | Lọc theo thể loại, khoảng giá, đánh giá, ngôn ngữ, sắp xếp (bestseller, mới nhất, giá, rating) |
| 📖 **Chi tiết sách** | Thông tin đầy đủ, ảnh bìa, đánh giá & bình luận, sách tương tự |
| 🛒 **Giỏ hàng** | Thêm/xóa/sửa số lượng, Redis-backed, mã giảm giá |
| 💳 **Thanh toán** | COD, Chuyển khoản, MoMo, VNPay, PayOS |
| 👤 **Tài khoản** | Đăng ký/đăng nhập, chỉnh sửa profile, quản lý địa chỉ, lịch sử đơn hàng, email xác nhận |
| ⭐ **Đánh giá** | Rating 1–5 sao, viết bình luận, vote hữu ích |
| 🤖 **AI Chatbot** | Trợ lý mua sắm DeepSeek AI (SSE streaming), gợi ý sách, tra cứu đơn hàng |
| 🎯 **Gợi ý cá nhân** | For You (cá nhân hóa), Trending, "Vì bạn đã mua", sách tương tự |
| 🛡️ **Tracking hành vi** | Theo dõi view, add_to_cart, purchase để cá nhân hóa |

### Phân Hệ Quản Trị (Admin Panel — `/admin`)

| Tính năng | Mô tả |
|---|---|
| 📊 **Dashboard** | Tổng quan doanh thu, đơn hàng, sản phẩm, biểu đồ theo tháng |
| 📦 **QL Sản phẩm** | CRUD sách, upload ảnh bìa, quản lý giá & tồn kho, gán tác giả/NXB/danh mục |
| 📋 **QL Đơn hàng** | Xem danh sách, cập nhật trạng thái (pending → delivered) |
| 👥 **QL Người dùng** | Tìm kiếm/lọc user, Ban/Unban, xem lịch sử mua hàng từng KH |
| 🗂️ **QL Danh mục** | CRUD thể loại sách (cây 3 cấp) |
| ✍️ **QL Tác giả** | Thêm/sửa tác giả |
| 🏢 **QL NXB** | Thêm/sửa nhà xuất bản |
| 🎫 **QL Mã giảm giá** | CRUD coupon (%, fixed, freeship), giới hạn sử dụng, thời hạn |
| ⭐ **Duyệt Reviews** | Duyệt/từ chối đánh giá của người dùng |
| 🔄 **Reindex Search** | Reindex toàn bộ sách vào Elasticsearch |

---

## 🔌 API Endpoints

### Auth & Users

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Đăng nhập | ❌ |
| `POST` | `/users/register` | Đăng ký tài khoản | ❌ |
| `GET` | `/users/profile` | Lấy thông tin cá nhân | ✅ |
| `PUT` | `/users/profile` | Cập nhật profile | ✅ |
| `DELETE` | `/users/profile` | Xóa tài khoản | ✅ |

### Books

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/books` | Danh sách sách (filter, sort, pagination) | ❌ |
| `GET` | `/books/search?q=...` | Tìm kiếm nhanh (PostgreSQL) | ❌ |
| `GET` | `/books/:id` | Chi tiết 1 sách | ❌ |
| `GET` | `/books/by-slug/:slug` | Lấy sách theo slug (SEO) | ❌ |
| `POST` | `/books` | Tạo sách mới | 🔒 Admin |
| `PUT` | `/books/:id` | Cập nhật sách | 🔒 Admin |
| `DELETE` | `/books/:id` | Xóa sách | 🔒 Admin |

### Search (Elasticsearch — nâng cao)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/search/suggest?q=...` | Gợi ý autocomplete (top 8) | ❌ |
| `GET` | `/search/full` | Full-text search + filters + facets + highlights + spell correction | ❌ |
| `POST` | `/search/reindex` | Reindex toàn bộ sách vào ES | 🔒 Admin |
| `POST` | `/search/reindex-dev` | Reindex (dev mode, x-dev-secret header) | 🔑 Dev Secret |

### Recommendation

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/recommendations/for-you?limit=12` | Gợi ý cá nhân (nếu login) hoặc trending (anonymous) | ⚡ Optional |
| `GET` | `/recommendations/similar/:bookId?limit=8` | Sách tương tự | ❌ |
| `GET` | `/recommendations/trending?limit=12` | Sách trending | ❌ |
| `GET` | `/recommendations/because-you-bought?limit=8` | "Vì bạn đã mua" | ✅ |

### Chat (AI)

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/chat/message` | Gửi tin nhắn — SSE streaming response | ⚡ Optional |
| `GET` | `/chat/suggestions` | Gợi ý câu hỏi nhanh | ❌ |

### Behavior Tracking

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/behavior/track` | Ghi nhận sự kiện hành vi (view, cart, purchase, search) | ⚡ Optional |

### Cart & Orders

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/cart` | Lấy giỏ hàng | ✅ |
| `POST` | `/cart/add` | Thêm sách vào giỏ | ✅ |
| `PUT` | `/cart/update` | Cập nhật số lượng | ✅ |
| `DELETE` | `/cart/remove/:bookId` | Xóa sách khỏi giỏ | ✅ |
| `POST` | `/orders/checkout` | Đặt hàng | ✅ |
| `GET` | `/orders/my-orders` | Lịch sử đơn hàng | ✅ |

### Payment

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `POST` | `/payment/momo/create` | Tạo link thanh toán MoMo | ✅ |
| `POST` | `/payment/vnpay/create` | Tạo link thanh toán VNPay | ✅ |
| `POST` | `/payment/payos/create` | Tạo link thanh toán PayOS | ✅ |
| `POST` | `/payment/momo/callback` | MoMo IPN callback | ❌ |
| `GET` | `/payment/vnpay/callback` | VNPay IPN callback | ❌ |

### Reviews

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/reviews/book/:bookId` | Lấy reviews theo sách | ❌ |
| `POST` | `/reviews` | Tạo đánh giá | ✅ |
| `PUT` | `/reviews/:id/helpful` | Vote hữu ích | ✅ |
| `GET` | `/reviews/pending` | Reviews chờ duyệt | 🔒 Admin |
| `PUT` | `/reviews/:id/status` | Duyệt/từ chối review | 🔒 Admin |

### Admin

| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| `GET` | `/admin/stats` | Thống kê tổng quan | 🔒 Admin |
| `GET` | `/admin/stats/revenue` | Doanh thu theo tháng | 🔒 Admin |
| `GET` | `/admin/stats/top-books` | Top sách bán chạy | 🔒 Admin |
| `GET` | `/admin/users` | Danh sách user (search, filter) | 🔒 Admin |
| `GET` | `/admin/users/:id/orders` | Lịch sử đơn hàng theo user | 🔒 Admin |
| `PUT` | `/admin/users/:id/status` | Ban/Unban user | 🔒 Admin |
| `GET/POST/PUT` | `/admin/authors` | CRUD tác giả | 🔒 Admin |
| `GET/POST/PUT` | `/admin/publishers` | CRUD nhà xuất bản | 🔒 Admin |
| `GET/POST/PUT/DELETE` | `/admin/categories` | CRUD thể loại | 🔒 Admin |
| `GET/POST/PUT/DELETE` | `/admin/coupons` | CRUD mã giảm giá | 🔒 Admin |

---

## 🗄 Cơ Sở Dữ Liệu

### Sơ đồ ERD (các bảng chính)

```
users ─────────┐
  │            │
  ├── user_profiles
  │
  ├── user_sessions
  │
  ├── user_addresses
  │
  ├── orders ──┤── order_items ── books
  │            │                   │
  ├── reviews ─┘                   ├── book_authors ── authors
  │                                │
  └── user_behavior_events         ├── book_categories ── categories
                                   │
                                   └── publishers

coupons (độc lập — áp dụng khi checkout)
```

### Danh sách Models (Prisma Schema — 16 models)

| Model | Mô tả |
|---|---|
| `User` | Người dùng (customer, admin, moderator) |
| `UserProfile` | Metadata cá nhân hóa (sở thích, ngôn ngữ, reading level) |
| `UserSession` | Phiên đăng nhập |
| `UserAddress` | Địa chỉ giao hàng (nhiều địa chỉ/user) |
| `Book` | Sách (giá, tồn kho, rating, SEO slug, metadata) |
| `Author` | Tác giả |
| `Publisher` | Nhà xuất bản |
| `Category` | Thể loại sách (cây 3 cấp, self-referencing) |
| `BookAuthor` | Many-to-many: Sách ↔ Tác giả (có role: author, translator, editor, illustrator) |
| `BookCategory` | Many-to-many: Sách ↔ Thể loại (có primary flag) |
| `Order` | Đơn hàng (trạng thái, thanh toán, coupon_code) |
| `OrderItem` | Chi tiết đơn hàng |
| `Review` | Đánh giá sách (1–5 sao, pending/approved/rejected) |
| `ReviewVote` | Vote hữu ích cho review |
| `UserBehaviorEvent` | Tracking hành vi người dùng (view, add_to_cart, wishlist, purchase, search) |
| `Coupon` | Mã giảm giá (percentage, fixed_amount, free_shipping) |

### Enums

| Enum | Giá trị |
|---|---|
| `Role` | customer, admin, moderator |
| `UserStatus` | active, banned, unverified |
| `ReadingLevel` | casual, moderate, heavy |
| `AuthorRole` | author, translator, editor, illustrator |
| `OrderStatus` | pending, confirmed, shipping, delivered, cancelled, refunded |
| `PaymentMethod` | cod, bank_transfer, momo, vnpay, payos |
| `PaymentStatus` | pending, paid, failed, refunded |
| `ReviewStatus` | pending, approved, rejected |
| `EventType` | view, add_to_cart, wishlist, purchase, search |
| `DiscountType` | percentage, fixed_amount, free_shipping |

---

## 💳 Thanh Toán Online

Hệ thống hỗ trợ 4 phương thức thanh toán (môi trường **Sandbox/Test**):

| Phương thức | Trạng thái | Ghi chú |
|---|---|---|
| **MoMo** | ✅ Hoạt động | Sandbox keys có sẵn trong `.env` |
| **VNPay** | ✅ Hoạt động | Sandbox keys có sẵn trong `.env` |
| **PayOS** | ✅ Hoạt động | Cần đăng ký PayOS Sandbox keys |
| **COD** | ✅ Hoạt động | Thanh toán khi nhận hàng |
| **Chuyển khoản** | ✅ Hoạt động | Xác nhận thủ công |

> 📌 Để nhận callback (IPN) từ MoMo/VNPay khi phát triển local, cần sử dụng **ngrok** để expose localhost:
> ```bash
> ngrok http 3000
> ```
> Sau đó cập nhật `MOMO_NOTIFY_URL` và `VNPAY_NOTIFY_URL` trong `.env` với URL ngrok.

---

## 📝 Scripts Hữu Ích

### Backend

```bash
# Khởi động dev server (hot reload)
npm run start:dev

# Build production
npm run build

# Chạy migration
npx prisma migrate deploy

# Tạo migration mới
npx prisma migrate dev --name <tên_migration>

# Seed dữ liệu mẫu (organic)
npx prisma db seed

# Seed dữ liệu tổng hợp (synthetic — nhiều dữ liệu hơn)
npm run db:seed:synthetic

# Seed mã giảm giá
npx ts-node seed-coupon.ts

# Crawl dữ liệu sách từ Fahasa
npm run catalog:fetch            # 1 trang
npm run catalog:fetch:batch      # 1 trang (explicit)
npm run catalog:fetch:full       # 10 trang

# Crawl + seed trong 1 lệnh
npm run catalog:refresh

# Mở Prisma Studio (GUI quản lý DB)
npx prisma studio

# Reindex Elasticsearch
curl -X POST http://localhost:3000/search/reindex-dev -H "x-dev-secret: dev-reindex-2026"

# Lint + Format
npm run lint
npm run format

# Test
npm test
npm run test:cov
npm run test:e2e
```

### Frontend

```bash
# Khởi động dev server
npm run dev

# Build production (có type-check)
npm run build

# Preview bản build
npm run preview

# Lint
npm run lint
```

---

## 🔒 Xác Thực & Phân Quyền

- **JWT Token** được trả về sau khi đăng nhập thành công.
- Gửi token qua header: `Authorization: Bearer <token>`
- Có 3 role: `customer`, `admin`, `moderator`
- Guard `AuthGuard` kiểm tra token hợp lệ.
- Guard `RolesGuard` + decorator `@Roles('admin')` kiểm tra quyền.
- `OptionalAuthGuard` cho phép truy cập cả khi không có token (dùng cho recommendation, chat, behavior).
- Mật khẩu được mã hóa bằng **Argon2id**.

---

## 🤖 AI Chatbot (DeepSeek)

Hệ thống tích hợp chatbot AI sử dụng DeepSeek API:

- **Widget nổi** góc phải màn hình, luôn sẵn sàng
- **SSE Streaming** — phản hồi hiển thị theo thời gian thực
- **Markdown** — hỗ trợ in đậm, link, xuống dòng
- **Gợi ý nhanh** — các câu hỏi phổ biến (tìm sách, tra cứu đơn hàng, gợi ý)
- **Cá nhân hóa** — gửi kèm lịch sử chat và user context khi đã đăng nhập
- **Dừng được** — nút stop khi đang streaming

Yêu cầu: `DEEPSEEK_API_KEY` trong `.env`

---

## 🔍 Tìm Kiếm Nâng Cao (Elasticsearch)

- **Full-text search** với Vietnamese analyzer (ICU folding hoặc ASCII folding fallback)
- **Autocomplete suggest** (edge ngram) — gõ vài chữ là có gợi ý
- **Facets aggregation** — lọc theo thể loại, khoảng giá, rating
- **Highlight** — đánh dấu từ khóa trong kết quả
- **Spell correction** — gợi ý sửa lỗi chính tả ("did you mean?")
- **Fallback PostgreSQL** — tự động chuyển về PG khi Elasticsearch không khả dụng
- **Reindex** — admin có thể reindex toàn bộ catalog

---

## 🧪 Kiểm Thử (Testing)

Dự án được triển khai kiểm thử toàn diện ở 3 cấp độ:

| Cấp Độ | Công Cụ | Phạm Vi |
|---|---|---|
| **Unit Test** | Jest | Kiểm tra từng logic hàm (CartService, ReviewsService, PaymentService...) |
| **Integration Test** | Supertest + Jest | Kiểm tra các luồng API Endpoints (Books, Auth, Cart, Orders) |
| **System Test** | Playwright | Mô phỏng người dùng thực tế (Tìm kiếm, Giỏ hàng, Checkout) trên trình duyệt |

### Hướng Dẫn Chạy Test

**1. Unit Test & Báo Cáo Coverage (Backend)**
```bash
cd backend-bookstore
npm test

# Chạy test và tạo báo cáo HTML (Coverage)
npm run test:cov
# Báo cáo được tạo tại: backend-bookstore/coverage/lcov-report/index.html
```

**2. Integration Test / API E2E (Backend)**
```bash
cd backend-bookstore
npm run test:e2e
```

**3. System Test / E2E UI (Frontend)**
*(Yêu cầu Backend và Frontend đang chạy)*
```bash
cd frontend-bookstore
npx playwright install   # Chạy 1 lần duy nhất để tải trình duyệt
npx playwright test

# Hiển thị báo cáo HTML (với hình ảnh/video nếu có lỗi)
npx playwright show-report
```

---

## 🙋 Tác Giả

**Dương Công Minh** - 22010009
* GitHub: [@Minhne2194](https://github.com/Minhne2194)

---

## 📄 License

Dự án này được cấp phép theo [MIT License](https://opensource.org/licenses/MIT).

---

> 🎓 *Lưu ý: Đây là dự án phục vụ mục đích học tập. Các API key thanh toán trong tài liệu đều là Sandbox/Test key.*
