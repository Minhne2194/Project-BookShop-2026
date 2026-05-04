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
| **Frontend** | React 19 + TypeScript + Vite + TailwindCSS 4 |
| **Backend** | NestJS 11 + Prisma ORM + PostgreSQL 17 |
| **Cache/Session** | Redis 7 (giỏ hàng, session) |

### Đối tượng sử dụng

- **Khách hàng**: Tìm kiếm, duyệt sách, thêm giỏ hàng, đặt hàng, thanh toán online, quản lý tài khoản.
- **Quản trị viên (Admin)**: Dashboard thống kê, quản lý sách/đơn hàng/người dùng/danh mục/tác giả/NXB, duyệt đánh giá.

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

### Backend

| Công nghệ | Phiên bản | Vai trò |
|---|---|---|
| NestJS | 11.x | Backend Framework |
| Prisma | 7.x | ORM — Database Access |
| PostgreSQL | 17 | Cơ sở dữ liệu chính |
| Redis | 7 | Cache & Giỏ hàng |
| Argon2 | 0.44 | Mã hóa mật khẩu |
| JWT | — | Xác thực người dùng |
| Multer | 2.x | Upload file/ảnh |
| Axios | 1.x | HTTP Client (Payment Gateway) |

### Infrastructure

| Công cụ | Vai trò |
|---|---|
| Docker Compose | PostgreSQL + Redis containers |
| Prisma Migrate | Database migration |
| Prisma Seed | Dữ liệu mẫu |

---

## 🏗 Kiến Trúc Hệ Thống

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                           │
│   [React SPA — Vite]           [Admin Dashboard]          │
│   Port: 5173                   Route: /admin/*            │
└─────────────┬──────────────────────┬─────────────────────┘
              │        HTTP          │
┌─────────────▼──────────────────────▼─────────────────────┐
│           API SERVER (NestJS — Port 3000)                 │
│   Auth · Books · Cart · Orders · Payment · Reviews        │
│   Users · Categories · Admin · Upload                     │
└──┬────────────┬──────────────┬───────────────────────────┘
   │            │              │
┌──▼──────┐ ┌──▼──────┐ ┌─────▼─────┐
│PostgreSQL│ │  Redis  │ │  Uploads  │
│ Port:5433│ │Port:6379│ │  /uploads │
└─────────┘ └─────────┘ └───────────┘
```

---

## 📁 Cấu Trúc Thư Mục

```
Project-BookShop-2026/
│
├── backend-bookstore/          # NestJS Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (14 models)
│   │   ├── migrations/         # SQL migrations
│   │   └── seed.ts             # Seed dữ liệu mẫu
│   ├── src/
│   │   ├── admin/              # Module quản trị (thống kê, CRUD)
│   │   ├── auth/               # JWT authentication + guards
│   │   ├── books/              # CRUD sách + tìm kiếm
│   │   ├── cart/               # Giỏ hàng (Redis-backed)
│   │   ├── categories/         # Quản lý thể loại sách
│   │   ├── orders/             # Quy trình đặt hàng
│   │   ├── payment/            # MoMo, VNPay, PayOS integration
│   │   ├── prisma/             # Prisma service (singleton)
│   │   ├── reviews/            # Đánh giá & bình luận
│   │   ├── upload/             # Upload ảnh bìa sách
│   │   ├── users/              # Đăng ký, profile, CRUD
│   │   ├── app.module.ts       # Root module
│   │   └── main.ts             # Bootstrap (CORS, Validation)
│   ├── uploads/                # Thư mục lưu ảnh upload
│   ├── scripts/                # Scripts hỗ trợ (crawler)
│   ├── docker-compose.yml      # PostgreSQL + Redis containers
│   ├── package.json
│   └── .env                    # Biến môi trường (không commit)
│
├── frontend-bookstore/         # React Frontend SPA
│   ├── src/
│   │   ├── components/         # Header, Footer, Toast, SafeImage
│   │   ├── context/            # AuthContext, CartContext
│   │   ├── pages/              # 12 trang chính
│   │   │   ├── Home.tsx        # Trang chủ
│   │   │   ├── Search.tsx      # Tìm kiếm + lọc
│   │   │   ├── BookDetail.tsx  # Chi tiết sách + reviews
│   │   │   ├── Cart.tsx        # Giỏ hàng
│   │   │   ├── Checkout.tsx    # Thanh toán
│   │   │   ├── Admin.tsx       # Admin Dashboard (full CRUD)
│   │   │   ├── Account.tsx     # Tài khoản cá nhân
│   │   │   ├── Login.tsx       # Đăng nhập
│   │   │   ├── Register.tsx    # Đăng ký
│   │   │   ├── PaymentResult.tsx # Kết quả thanh toán
│   │   │   ├── NewBooks.tsx    # Sách mới
│   │   │   └── BestSellers.tsx # Sách bán chạy
│   │   ├── utils/              # Helpers (orderStatus)
│   │   ├── App.tsx             # Routes + Layout
│   │   └── main.tsx            # Entry point
│   ├── package.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md                   # ← Bạn đang đọc file này
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

### 2. Khởi động Database (PostgreSQL + Redis)

```bash
cd backend-bookstore
docker compose up -d
```

Lệnh trên sẽ tạo:
- **PostgreSQL 17** tại `localhost:5433` (user: `root`, password: `secretpassword`, db: `bookstore_db`)
- **Redis 7** tại `localhost:6379`

### 3. Cấu hình Backend

```bash
# Vẫn ở trong thư mục backend-bookstore

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

# Application
PORT=3000
FRONTEND_URL="http://localhost:5173"
PAYMENT_RESULT_URL="http://localhost:5173/payment/result"

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
| 🏠 **Trang chủ** | Sách mới, bán chạy, đề xuất — dữ liệu động từ API |
| 🔍 **Tìm kiếm** | Full-text search theo tên sách, tác giả, mô tả |
| 🏷️ **Bộ lọc** | Lọc theo thể loại, khoảng giá, đánh giá, sắp xếp |
| 📖 **Chi tiết sách** | Thông tin đầy đủ, ảnh bìa, đánh giá & bình luận |
| 🛒 **Giỏ hàng** | Thêm/xóa/sửa số lượng, Redis-backed, promo code |
| 💳 **Thanh toán** | COD, Chuyển khoản, MoMo, VNPay, PayOS |
| 👤 **Tài khoản** | Đăng ký/đăng nhập, chỉnh sửa profile, lịch sử đơn hàng |
| ⭐ **Đánh giá** | Rating 1–5 sao, viết bình luận, vote hữu ích |

### Phân Hệ Quản Trị (Admin Panel — `/admin`)

| Tính năng | Mô tả |
|---|---|
| 📊 **Dashboard** | Tổng quan doanh thu, đơn hàng, sản phẩm, biểu đồ theo tháng |
| 📦 **QL Sản phẩm** | CRUD sách, upload ảnh bìa, quản lý giá & tồn kho |
| 📋 **QL Đơn hàng** | Xem danh sách, cập nhật trạng thái (pending → delivered) |
| 👥 **QL Người dùng** | Tìm kiếm/lọc user, Ban/Unban, xem lịch sử mua hàng từng KH |
| 🗂️ **QL Danh mục** | CRUD thể loại sách (cây 3 cấp) |
| ✍️ **QL Tác giả** | Thêm/sửa tác giả |
| 🏢 **QL NXB** | Thêm/sửa nhà xuất bản |
| ⭐ **Duyệt Reviews** | Duyệt/từ chối đánh giá của người dùng |

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
| `GET` | `/books/search?q=...` | Tìm kiếm full-text | ❌ |
| `GET` | `/books/:id` | Chi tiết 1 sách | ❌ |
| `GET` | `/books/by-slug/:slug` | Lấy sách theo slug (SEO) | ❌ |
| `POST` | `/books` | Tạo sách mới | 🔒 Admin |
| `PUT` | `/books/:id` | Cập nhật sách | 🔒 Admin |
| `DELETE` | `/books/:id` | Xóa sách | 🔒 Admin |

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

---

## 🗄 Cơ Sở Dữ Liệu

### Sơ đồ ERD (các bảng chính)

```
users ─────────┐
  │            │
  ├── orders ──┤── order_items ── books
  │            │                   │
  ├── reviews ─┘                   ├── book_authors ── authors
  │                                │
  └── user_behavior_events         ├── book_categories ── categories
                                   │
                                   └── publishers
```

### Danh sách Models (Prisma Schema)

| Model | Mô tả |
|---|---|
| `User` | Người dùng (customer, admin, moderator) |
| `UserProfile` | Metadata cá nhân hóa |
| `UserSession` | Phiên đăng nhập |
| `Book` | Sách (giá, tồn kho, rating, SEO slug) |
| `Author` | Tác giả |
| `Publisher` | Nhà xuất bản |
| `Category` | Thể loại sách (cây 3 cấp) |
| `BookAuthor` | Many-to-many: Sách ↔ Tác giả |
| `BookCategory` | Many-to-many: Sách ↔ Thể loại |
| `Order` | Đơn hàng (trạng thái, thanh toán) |
| `OrderItem` | Chi tiết đơn hàng |
| `Review` | Đánh giá sách (1–5 sao) |
| `ReviewVote` | Vote hữu ích cho review |
| `UserBehaviorEvent` | Tracking hành vi người dùng |

---

## 💳 Thanh Toán Online

Hệ thống hỗ trợ 3 cổng thanh toán (môi trường **Sandbox/Test**):

| Cổng | Trạng thái | Ghi chú |
|---|---|---|
| **MoMo** | ✅ Hoạt động | Sandbox keys có sẵn trong `.env` |
| **VNPay** | ✅ Hoạt động | Sandbox keys có sẵn trong `.env` |
| **PayOS** | ✅ Hoạt động | Sandbox keys có sẵn trong `.env` |
| **COD** | ✅ Hoạt động | Thanh toán khi nhận hàng |

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

# Seed dữ liệu
npx prisma db seed

# Mở Prisma Studio (GUI quản lý DB)
npx prisma studio

# Crawl dữ liệu sách từ Fahasa
npm run catalog:fetch

# Lint + Format
npm run lint
npm run format
```

### Frontend

```bash
# Khởi động dev server
npm run dev

# Build production
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
- Mật khẩu được mã hóa bằng **Argon2id**.

---

## 🙋 Tác Giả

**Đồ án môn học** — Hệ thống bán sách trực tuyến

---

> 🎓 *Lưu ý: Đây là dự án phục vụ mục đích học tập. Các API key thanh toán trong tài liệu đều là Sandbox/Test key.*
