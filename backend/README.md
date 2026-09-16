# Locvia Backend — Inventory Management APIs (Module 53)

Locvia is a production-style hyperlocal grocery delivery platform. This directory houses the standalone Spring Boot backend service connected to MySQL.

---

## 1. Technology Stack

- **Language:** Java 25 (LTS)
- **Framework:** Spring Boot 3.4.3
- **Security:** Spring Security 6.4.x & BCrypt Password Hashing
- **Authentication:** Stateless JSON Web Token (JJWT 0.12.6)
- **Media Storage:** Cloudinary Java SDK (`cloudinary-http44` 1.38.0)
- **Build Tool:** Apache Maven 3.9.x
- **Web Layer:** Spring Web (REST APIs)
- **Data Layer:** Spring Data JPA & Hibernate ORM 6.6.x
- **Connection Pool:** HikariCP
- **Database Driver:** MySQL Connector/J (`mysql-connector-j` 9.1+)
- **Database Server:** MySQL Community Server 8.0.x
- **Validation:** Jakarta Bean Validation (`spring-boot-starter-validation`)
- **Developer Tools:** Spring Boot DevTools & Project Lombok
- **Testing:** JUnit 5, Spring Boot Starter Test, Spring Security Test, MockMvc, AssertJ

---

## 2. Port & Base URL

- **Backend Port:** `8080`
- **Base URL:** `http://localhost:8080`
- **Health Endpoint:** `http://localhost:8080/api/health`

---

## 3. Architecture & Security Flow

### Authentication & Authorization Principles
- **Spring Security** protects REST APIs using stateless token inspection.
- **BCrypt** securely hashes user passwords prior to MySQL persistence (plaintext passwords are never stored or logged).
- **JWT** provides stateless authentication via the standard `Authorization: Bearer <token>` header.
- **User roles** (`CUSTOMER`, `SHOP_OWNER`, `DELIVERY_PARTNER`, `ADMIN`) provide the authorization foundation (`ROLE_...`).
- **Product Ownership Isolation:** A `SHOP_OWNER` can create and manage only products belonging to shops owned by the authenticated caller. Cross-owner product creation, modification, deletion, and image uploads are strictly blocked with HTTP 403 Forbidden.
- **Cloudinary Integration:** Images are uploaded directly to Cloudinary under folder `locvia/products` with generated safe unique IDs (`prod_<uuid>`). Only the secure URL and public ID are stored in MySQL (`imageUrl`, `image_public_id`). Image binary is never stored in the database.
- **File Validation:** Multipart file uploads enforce MIME type validation (`image/jpeg`, `image/png`, `image/webp`) and a 5 MB maximum size limit. Invalid or oversized files are rejected with HTTP 400 Bad Request.
- **Public Discovery vs. Inactive Products:** Public storefront endpoints (`/api/products`, `/api/products/{id}`) return active products only (`active = true`). Inactive products return HTTP 404 Not Found to prevent leaking unlisted inventory.
- **Soft Deactivation:** Product deletion sets `active = false` without physical removal from MySQL, preserving relational integrity for historical orders and reviews.
- **DTO Decoupling:** JPA entities are never directly exposed from controllers; `ProductResponse` completely decouples JPA proxies, circular references, and internal entity state.

---

## 4. Endpoints Implemented

### System & Authentication APIs
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/health` | **Public** | System status & health check (`{"status":"UP","service":"Locvia Backend"}`) |
| **`POST`** | `/api/auth/register` | **Public** | Register user (Customer, Shop Owner, Delivery Partner) with BCrypt hashing |
| **`POST`** | `/api/auth/login` | **Public** | Authenticate credentials and receive Bearer JWT |
| **`GET`** | `/api/auth/me` | **Protected** | Fetch authenticated caller summary |

### User Profile Management APIs (Module 49)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/users/me` *(alias: `/profile`)* | **Authenticated** | Fetch caller's profile details (`id`, `name`, `email`, `phone`, `role`, `active`, timestamps) |
| **`PUT`** | `/api/users/me` *(alias: `/profile`)* | **Authenticated** | Update caller profile (`name`, `phone`, `email` with uniqueness checks) |
| **`GET`** | `/api/users/{id}` | **Ownership / Admin** | Fetch user by ID (non-admins can only view their own ID; admins can view any ID) |

### Administrative User Management APIs (Module 49)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/admin/users` | **ROLE_ADMIN** | List all platform users with role and status |
| **`GET`** | `/api/admin/users/{id}` | **ROLE_ADMIN** | Retrieve full details of any user by ID |
| **`PUT`** | `/api/admin/users/{id}` | **ROLE_ADMIN** | Update user details, platform role, and active status |
| **`DELETE`** | `/api/admin/users/{id}` | **ROLE_ADMIN** | Safely deactivate account (`active = false`) |

### Public Shop Discovery APIs (Module 50)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/shops` | **Public** | Discover all active shops (`active = true`) |
| **`GET`** | `/api/shops/{id}` | **Public** | Get details for an active shop (returns 404 if inactive or not found) |

### Shop Owner Store Management APIs (Module 50)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/shops` | **ROLE_SHOP_OWNER** | Create a new shop linked to the authenticated owner |
| **`GET`** | `/api/shops/my` | **ROLE_SHOP_OWNER** | List all shops owned by the caller (multi-shop support) |
| **`GET`** | `/api/shops/my/{id}` | **ROLE_SHOP_OWNER** | Get caller's own shop by ID (returns 403 on other owner's shop) |
| **`PUT`** | `/api/shops/{id}` | **ROLE_SHOP_OWNER** | Update caller's own shop details (returns 403 on other owner's shop) |

### Administrative Shop Management APIs (Module 50)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/admin/shops` | **ROLE_ADMIN** | List all shops across the platform (active and inactive) |
| **`GET`** | `/api/admin/shops/{id}` | **ROLE_ADMIN** | Inspect full details of any shop by ID |
| **`PUT`** | `/api/admin/shops/{id}` | **ROLE_ADMIN** | Administrative update of shop info, active status, or rating |
| **`DELETE`** | `/api/admin/shops/{id}` | **ROLE_ADMIN** | Soft deactivation (`active = false`) |

### Public Category Discovery APIs (Module 51)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/categories` | **Public** | Discover all active categories (`active = true`) |
| **`GET`** | `/api/categories/{id}` | **Public** | Get details for an active category (returns 404 if inactive or not found) |

### Administrative Category Management APIs (Module 51)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/admin/categories` | **ROLE_ADMIN** | Create new category (`active = true`, unique name check -> 409) |
| **`GET`** | `/api/admin/categories` | **ROLE_ADMIN** | List all categories across the platform (both active and inactive) |
| **`GET`** | `/api/admin/categories/{id}` | **ROLE_ADMIN** | Inspect full details of any category by ID (active or inactive) |
| **`PUT`** | `/api/admin/categories/{id}` | **ROLE_ADMIN** | Update category name, imageUrl, description, or active status |
| **`DELETE`** | `/api/admin/categories/{id}` | **ROLE_ADMIN** | Safe soft-deactivation (`active = false`) |

### Public Product Discovery APIs (Module 52)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/products` | **Public** | Get active products with optional filters (`shopId`, `categoryId`, `search`) |
| **`GET`** | `/api/products/{id}` | **Public** | Get active product by ID (returns 404 if inactive or missing) |

### Shop Owner Product Management APIs (Module 52)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/shops/{shopId}/products` | **ROLE_SHOP_OWNER / ADMIN** | Create product for authenticated owner's shop |
| **`GET`** | `/api/shops/{shopId}/products` | **ROLE_SHOP_OWNER / ADMIN** | List products belonging to the shop (active and inactive) |
| **`GET`** | `/api/products/{id}/manage` | **ROLE_SHOP_OWNER / ADMIN** | Inspect product details for management |
| **`PUT`** | `/api/products/{id}` | **ROLE_SHOP_OWNER / ADMIN** | Update product (shop and owner cannot be altered) |
| **`DELETE`** | `/api/products/{id}` | **ROLE_SHOP_OWNER / ADMIN** | Soft-deactivate product (`active = false`) |
| **`POST`** | `/api/products/{id}/image` | **ROLE_SHOP_OWNER / ADMIN** | Upload product image to Cloudinary (multipart `file`) |

### Administrative Product Management APIs (Module 52)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/admin/products` | **ROLE_ADMIN** | List all products across all shops (active and inactive) with filters |
| **`GET`** | `/api/admin/products/{id}` | **ROLE_ADMIN** | Inspect any product by ID |
| **`POST`** | `/api/admin/products` | **ROLE_ADMIN** | Create product across any shop |
| **`PUT`** | `/api/admin/products/{id}` | **ROLE_ADMIN** | Update any product across any shop |
| **`DELETE`** | `/api/admin/products/{id}` | **ROLE_ADMIN** | Soft-deactivate any product (`active = false`) |

### Public Stock Availability APIs (Module 53)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/products/{productId}/inventory` | **Public** | Check stock availability for active product (`productId`, `quantity`, `inStock`; inactive product returns 404) |

### Shop Owner Inventory Management APIs (Module 53)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/shops/{shopId}/inventory` | **ROLE_SHOP_OWNER / ADMIN** | List all inventory items belonging to the shop |
| **`GET`** | `/api/shops/{shopId}/inventory/low-stock` | **ROLE_SHOP_OWNER / ADMIN** | Filter shop inventory items where `quantity <= lowStockThreshold` |
| **`GET`** | `/api/shops/{shopId}/inventory/out-of-stock` | **ROLE_SHOP_OWNER / ADMIN** | Filter shop inventory items where `quantity == 0` |
| **`GET`** | `/api/products/{productId}/inventory/manage` | **ROLE_SHOP_OWNER / ADMIN** | Inspect detailed inventory management details for shop owner's product |
| **`POST`** | `/api/products/{productId}/inventory` | **ROLE_SHOP_OWNER / ADMIN** | Create inventory record for product (rejects duplicate with 409 Conflict) |
| **`PUT`** | `/api/products/{productId}/inventory` | **ROLE_SHOP_OWNER / ADMIN** | Update inventory quantity and lowStockThreshold |
| **`PATCH`** | `/api/products/{productId}/inventory/quantity` | **ROLE_SHOP_OWNER / ADMIN** | Quick stock quantity adjustment |

### Administrative Inventory Management APIs (Module 53)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/admin/inventory` | **ROLE_ADMIN** | List all inventory items across platform with optional `?shopId=` filter |
| **`GET`** | `/api/admin/inventory/low-stock` | **ROLE_ADMIN** | List all low-stock items across platform |
| **`GET`** | `/api/admin/inventory/out-of-stock` | **ROLE_ADMIN** | List all out-of-stock items across platform |
| **`GET`** | `/api/admin/products/{productId}/inventory` | **ROLE_ADMIN** | Inspect inventory details for any product |
| **`POST`** | `/api/admin/products/{productId}/inventory` | **ROLE_ADMIN** | Create inventory record for any product |
| **`PUT`** | `/api/admin/products/{productId}/inventory` | **ROLE_ADMIN** | Update inventory quantity and threshold for any product |
| **`PATCH`** | `/api/admin/products/{productId}/inventory/quantity` | **ROLE_ADMIN** | Quick stock adjustment for any product |

### Customer Shopping Cart APIs (Module 54)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/cart` | **ROLE_CUSTOMER** | View caller's shopping cart with item lines, product details, unit prices, subtotal, and total amount |
| **`POST`** | `/api/cart/items` | **ROLE_CUSTOMER** | Add product item to cart (increments quantity if already present; validates stock availability) |
| **`PUT`** | `/api/cart/items/{id}` | **ROLE_CUSTOMER** | Update cart item quantity (removes item if quantity is 0; checks inventory limit) |
| **`DELETE`** | `/api/cart/items/{id}` | **ROLE_CUSTOMER** | Remove specific item line from cart |
| **`DELETE`** | `/api/cart` | **ROLE_CUSTOMER** | Clear all items from customer's cart |

### Customer Order Placement & Management APIs (Module 56)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/orders` | **ROLE_CUSTOMER** | Checkout order from cart: verifies non-empty cart, customer address ownership, deducts inventory atomically, snapshots address & item pricing, and clears cart |
| **`GET`** | `/api/orders` | **ROLE_CUSTOMER** | List customer order history (ordered latest first) with status and summary counts |
| **`GET`** | `/api/orders/{id}` | **ROLE_CUSTOMER** | Inspect full order details including historical address snapshot and line items (isolated to order owner) |
| **`PATCH`** | `/api/orders/{id}/cancel` | **ROLE_CUSTOMER** | Cancel order if eligible (`PENDING` / `CONFIRMED`); atomically restores reserved inventory quantities |

### Delivery Management & Tracking APIs (Module 57)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/admin/deliveries` | **ROLE_ADMIN** | Assign delivery partner to order (validates partner role, order eligibility, and prevents duplicates) |
| **`GET`** | `/api/delivery/requests` | **ROLE_DELIVERY_PARTNER** | View assigned delivery tasks awaiting pickup (`status = ASSIGNED`) |
| **`GET`** | `/api/delivery/active` | **ROLE_DELIVERY_PARTNER** | View in-progress deliveries (`status IN (ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY)`) |
| **`GET`** | `/api/delivery/completed` | **ROLE_DELIVERY_PARTNER** | View completed delivery history (`status = DELIVERED`) |
| **`PATCH`** | `/api/delivery/{id}/status` | **ROLE_DELIVERY_PARTNER** | Transition delivery lifecycle (`ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`); atomically syncs `OrderStatus` and timestamps |
| **`GET`** | `/api/orders/{orderId}/delivery` | **ROLE_CUSTOMER** | Customer real-time delivery tracking showing partner name, phone, live status, and milestone timestamps |

### Payment APIs — Mock Payment Foundation (Module 58)
| Method | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/payments` | **ROLE_CUSTOMER** | Process mock payment for order: authoritatively uses `Order.totalAmount`, generates `MOCK_TXN_<UUID>`, records payment, updates `Order.paymentStatus = PAID` while preserving fulfillment `OrderStatus`, and rejects duplicates (409 Conflict) |
| **`GET`** | `/api/payments/{id}` | **ROLE_CUSTOMER** | Retrieve payment receipt details (ownership-isolated) |
| **`GET`** | `/api/orders/{orderId}/payment` | **ROLE_CUSTOMER** | Retrieve payment record by order ID (ownership-isolated) |
| **`GET`** | `/api/payments` | **ROLE_CUSTOMER** | List authenticated customer's payment history |

---

## 5. MySQL Database & Cloudinary Setup

### 1. Verify MySQL Service
Ensure MySQL 8.0+ is running on your machine (default port `3306`):
```bash
mysql --version
```

### 2. Database & Schema
```sql
CREATE DATABASE IF NOT EXISTS locvia_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Variables
Copy `.env.example` to `.env` or pass variables via shell:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_NAME=locvia_db
DB_USERNAME=root
DB_PASSWORD=yash
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# Cloudinary Credentials (Optional for local unit tests; required for live Cloudinary uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 6. How to Run and Test

### Running Automated Verification Tests (215 Tests Across 13 Test Suites)
```bash
$env:DB_PASSWORD="yash"; mvn clean test
```
The test suite validates:
1. `LocviaApplicationTests` (4 tests): Spring context, live MySQL connection, table verification, health check.
2. `AuthSecurityTests` (14 tests): Registration, BCrypt hashing, duplicate email rejection, login verification, bad credential rejection, protected endpoints, JWT expiry/tampering, role mappings, email normalization, validation errors.
3. `UserApiTests` (17 tests): Profile retrieval, aliasing, self-updating, role immutability for non-admins, ownership checks, admin user listing, admin user retrieval, admin user update, admin soft-deactivation, deactivated account login prevention, admin self-demotion prevention, admin self-deactivation prevention, email collision detection, whitespace trimming.
4. `ShopApiTests` (22 tests): Public active shop discovery, public active shop lookup, inactive shop 404 hide, unauthenticated create rejection (401), customer create rejection (403), delivery partner create rejection (403), shop owner creation (201), body `ownerId` tampering prevention, multi-shop ownership listing via `/my`, owner view own shop, owner cross-view rejection (403), owner update own shop, owner cross-update rejection (403), owner rating/active tampering prevention, admin listing all shops, admin view any shop, admin update shop details and status, admin soft-deactivation via DELETE, customer/owner access rejection to admin endpoints (403), credential protection in response DTOs, health check integrity.
5. `CategoryApiTests` (21 tests): Public active category discovery, public active category lookup, inactive category 404 hide, non-existent category 404, admin category creation (201), duplicate name rejection (409), case-insensitive duplicate rejection (409), blank name validation (400), customer/shop-owner/unauthenticated role restrictions (403/401), admin listing all active/inactive categories, admin retrieval of inactive category, admin category updates, in-place same-name update preservation, renaming conflict rejection (409), admin soft-deactivation (DELETE), customer deactivation restriction (403), non-existent category 404.
6. `ProductApiTests` (21 tests): Public active products listing, inactive product 404 hiding, customer product creation rejection (403), shop owner creation (201), cross-owner creation rejection (403), shop owner update, cross-owner update rejection (403), shop immutability, admin cross-shop management, soft-deactivation (DELETE), category existence check (404), inactive category rejection (400), price validation (<= 0 rejected with 400), invalid MIME type rejection (400), oversized image rejection (> 5 MB with 400), image upload authorization checks (403/401/200), delivery partner restriction (403), search filter (`?search=`), shop filter (`?shopId=`), category filter (`?categoryId=`), combined multi-criteria filters.
7. `InventoryApiTests` (26 tests): Public stock availability (200), inactive product 404 hide, nonexistent product 404, unauthenticated manage rejection (401), customer/delivery partner manage rejection (403), shop owner detailed manage retrieval (200), shop owner inactive product manage retrieval (200), cross-owner manage rejection (403), shop owner inventory creation (201), duplicate inventory rejection (409 Conflict), cross-owner creation rejection (403), shop owner full update (PUT 200), shop owner quick quantity adjustment (PATCH 200), negative quantity validation (400), negative threshold validation (400), shop-wide inventory listing (200), shop-wide low-stock filter (`quantity <= threshold`), shop-wide out-of-stock filter (`quantity == 0`), cross-owner shop listing rejection (403), admin global inventory listing (200), admin shop-filtered inventory listing (200), admin global low-stock listing (200), admin global out-of-stock listing (200), admin cross-shop update (200), admin cross-shop patch (200).
8. `AddressApiTests` (24 tests): First address auto-default (201), secondary address non-default preservation, explicit default creation unsetting prior default, deterministic ordering with default first, empty list returns `[]`, single address lookup (200), cross-customer 404 masking (GET, PUT, DELETE, PATCH default), full address update (PUT 200), default switching via PATCH and PUT `/default`, non-default address deletion (204), default deletion with automatic re-election of oldest remaining address, only address deletion leaving zero addresses, validation rejections (invalid Indian phone, invalid Indian PIN, blank recipient, coordinate bounds), and security role restrictions (shop owner, delivery partner, admin blocked with 403, unauthenticated blocked with 401).
9. `OrderApiTests` (16 tests): Customer checkout from cart (201), cart clearing, atomic stock deduction, address and item historical snapshots, empty cart rejection (400), insufficient inventory rejection (400), cross-customer address rejection (400), customer order history (200), single order detail (200), cross-customer order isolation (404), customer order cancellation with automatic inventory restoration (200), and cancellation rejection for already-delivered orders (400).
10. `DeliveryApiTests` (11 tests): Admin assign delivery partner to order (201), duplicate assignment rejection (400), invalid partner role rejection (400), non-existent order rejection (404), non-admin assign restriction (403), delivery partner view assigned requests, partner view active and completed deliveries, partner update delivery status lifecycle (`ASSIGNED` -> `PICKED_UP` -> `OUT_FOR_DELIVERY` -> `DELIVERED`) with order status and timestamp synchronization, customer tracking delivery (200), and customer delivery privacy isolation (404).
11. `PaymentApiTests` (11 tests): Customer payment execution (201), authoritative order total amount enforcement (client amount tampering ignored), duplicate payment rejection on already-paid order (409 Conflict), cancelled order payment rejection (409 Conflict), delivered order payment rejection (409 Conflict), customer payment isolation (404), single payment lookup (200), payment by order ID lookup (200), customer payment history (200), role restrictions for non-customers (403), and unauthenticated rejection (401).
12. `AdminApiTests` (9 tests): Platform aggregate metrics and authentic revenue calculation (`/api/admin/dashboard`, `/api/admin/metrics`), user filtering (`role`, `active`, `search`), shop filtering (`active`, `search`), order oversight and lifecycle status mutation with automatic stock restitution on cancellation, illegal status transitions (409 Conflict), sanitized payment transaction auditing (secrets hidden), review moderation and deletion, notification oversight, and strict role access controls (403 Forbidden for non-admins, 401 Unauthorized for unauthenticated).
13. `GlobalExceptionHandlingTests` (20 tests): Comprehensive validation of centralized `@RestControllerAdvice` error responses (`ApiErrorResponse`), standard HTTP status codes (400, 401, 403, 404, 405, 409, 500, 502), zero stack trace leakage, zero SQL leakage, and absolute masking of third-party API secrets (Razorpay key/secret, Cloudinary credentials).

### Running the Backend Application
```bash
$env:DB_PASSWORD="yash"; mvn spring-boot:run
```
Or run the packaged JAR:
```bash
mvn clean package -DskipTests
$env:DB_PASSWORD="yash"; java -jar target/locvia-backend-0.0.1-SNAPSHOT.jar
```

---

## 7. Current Module Scope & Roadmap

### Completed Modules:
- ✅ **Module 45:** Spring Boot Setup (Java 25, Maven, Web, CORS, Health Endpoint)
- ✅ **Module 46:** MySQL Database Setup (`locvia_db` connection, HikariCP, JPA & Hibernate configuration)
- ✅ **Module 47:** JPA Entities & Database Relationships (14 Entities, 5 Enums, MySQL schema created)
- ✅ **Module 48:** JWT + Spring Security (Stateless Auth, BCrypt, Role-Based Access, Registration & Login)
- ✅ **Module 49:** User Profile & Administrative Management APIs (Profile inspection, update, admin user listing, update, soft-deactivation, ownership checks)
- ✅ **Module 50:** Shop APIs & Management (Public discovery, shop-owner multi-store CRUD, IDOR isolation, admin management, safe deactivation)
- ✅ **Module 51:** Category APIs & Management (Public discovery, admin CRUD, duplicate name conflict handling, soft-deactivation)
- ✅ **Module 52:** Product APIs & Cloudinary Integration (Storefront search/filters, owner product CRUD, IDOR isolation, Cloudinary image upload, soft-deactivation)
- ✅ **Module 53:** Inventory Management APIs (Public stock lookup, owner store inventory CRUD, low/out-of-stock filters, admin management, 409 conflict handling)
- ✅ **Module 54:** Cart APIs (Shopping cart item management, quantity updates, inventory validation, cart clearance)
- ✅ **Module 55:** Customer Address APIs (Delivery destination CRUD, automatic first-default, atomic default switching, default deletion re-election, 404 privacy masking)
- ✅ **Module 56:** Order APIs (Checkout from cart, stock reservation & atomic deduction, immutable address/pricing snapshots, order cancellation & inventory restoration)
- ✅ **Module 57:** Delivery APIs (Admin assignment, delivery partner workflow `ASSIGNED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED`, order status synchronization, customer tracking)
- ✅ **Module 58:** Payment APIs Foundation (Mock payment processing, `MOCK_TXN_<UUID>`, authoritative order amount enforcement, payment status sync, duplicate 409 conflict rejection)
- ✅ **Module 59:** Real Razorpay Gateway Integration (Razorpay Orders API, Payment Verification, Signature Validation, Test Mode)
- ✅ **Module 60:** Admin APIs (Metrics & dashboard analytics, user/shop/order/delivery/payment/review/notification oversight, lifecycle management, stock restoration)
- ✅ **Module 61:** Validation Layer (Jakarta Bean Validation, DTO annotations, controller @Valid enforcement)
- ✅ **Module 62:** Global Exception Handling (Centralized `@RestControllerAdvice`, standardized `ApiErrorResponse`, secure error masking, HTTP status semantics 400/401/403/404/405/409/500/502)

### Future Modules (Strictly Planned):
- ⏳ **Module 63:** Transaction Management
- ⏳ **Module 64:** Comprehensive Integration Testing
- ⏳ **Module 65:** Full Frontend & Backend End-to-End Polish
