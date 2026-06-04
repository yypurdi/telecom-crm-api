# Telecom CRM API

## 📋 Deskripsi Proyek

Telecom CRM API adalah aplikasi REST API yang komprehensif untuk mengelola platform Customer Relationship Management (CRM) di industri telekomunikasi. Aplikasi ini dibangun menggunakan Express.js dengan TypeScript dan PostgreSQL sebagai database.

### 🎯 Fitur Utama

1. **Customer Management** - Manajemen data pelanggan, profil, alamat, dan riwayat langganan
2. **Product Catalog** - Katalog produk, paket, bundel, pricing, dan quota
3. **Campaign & Promo** - Manajemen kampanye, promosi, kupon, dan voucher
4. **Loyalty & Rewards** - Program loyalitas, tier member, poin reward, dan redemption
5. **AI Analytics** - Analitik cerdas untuk churn prediction, fraud detection, dan rekomendasi produk
6. **Authentication** - Sistem autentikasi dengan JWT tokens dan refresh tokens

## 📁 Struktur Folder Proyek

```
telecom-crm-api/
├── src/
│   ├── config/
│   │   └── database.ts              # Konfigurasi koneksi database PostgreSQL
│   ├── controllers/                 # Business logic untuk setiap endpoint
│   │   ├── auth.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── product.controller.ts
│   │   ├── campaign.controller.ts
│   │   ├── loyalty.controller.ts
│   │   └── analytics.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # JWT authentication middleware
│   │   ├── error.middleware.ts      # Error handling middleware
│   │   └── logger.middleware.ts     # Request logging middleware
│   ├── routes/
│   │   ├── auth.routes.ts           # Authentication endpoints
│   │   ├── customer.routes.ts       # Customer management endpoints
│   │   ├── product.routes.ts        # Product catalog endpoints
│   │   ├── campaign.routes.ts       # Campaign & promo endpoints
│   │   ├── loyalty.routes.ts        # Loyalty program endpoints
│   │   └── analytics.routes.ts      # Analytics endpoints
│   ├── repositories/                # Database query layer
│   │   ├── customer.repository.ts
│   │   ├── product.repository.ts
│   │   ├── campaign.repository.ts
│   │   ├── loyalty.repository.ts
│   │   └── analytics.repository.ts
│   ├── services/                    # Business logic services
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── product.service.ts
│   │   ├── campaign.service.ts
│   │   ├── loyalty.service.ts
│   │   └── analytics.service.ts
│   ├── types/                       # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts                   # JWT utility functions
│   │   ├── password.ts              # Password hashing utilities
│   │   └── validators.ts            # Request validation utilities
│   └── index.ts                     # Application entry point
├── migrations/                      # Database migration scripts
│   ├── 001_initial_schema.sql       # Customer schema
│   ├── 002_initial_schema.sql       # Product schema
│   ├── 003_initial_schema.sql       # Promo schema
│   ├── 004_initial_schema.sql       # Loyalty schema
│   └── 005_initial_schema.sql       # Analytics schema
├── dist/                            # Compiled JavaScript output
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── openapi.yaml                     # OpenAPI 3.0 specification
├── package.json                     # Project dependencies
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # Project documentation
```

## 🚀 Instalasi & Setup

### Prerequisites

- Node.js 16+ dan npm/yarn
- PostgreSQL 14+
- Git

### Langkah-langkah Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/yypurdi/telecom-crm-api.git
   cd telecom-crm-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env dengan konfigurasi database lokal
   ```

4. **Setup database**
   ```bash
   # Buat database baru
   createdb telecom_crm

   # Jalankan migrations
   psql -U postgres -d telecom_crm -f migrations/001_initial_schema.sql
   psql -U postgres -d telecom_crm -f migrations/002_initial_schema.sql
   psql -U postgres -d telecom_crm -f migrations/003_initial_schema.sql
   psql -U postgres -d telecom_crm -f migrations/004_initial_schema.sql
   psql -U postgres -d telecom_crm -f migrations/005_initial_schema.sql
   ```

5. **Seed data awal (opsional)**
   ```bash
   npm run db:seed
   ```

6. **Start server**
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

Spesifikasi lengkap API tersedia dalam format OpenAPI 3.0:

- **File**: `openapi.yaml`
- **Tools untuk viewing**:
  - [Swagger UI](https://swagger.io/tools/swagger-ui/)
  - [Redoc](https://redoc.ly/)
  - VS Code Extension: OpenAPI (Swagger) Editor

### Import OpenAPI ke Swagger UI

```bash
# Local Swagger UI
npm install -g swagger-ui-express
swagger-ui-express openapi.yaml

# Atau gunakan online editor
# https://editor.swagger.io/
```

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi.

### Login & Get Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "agent@telecom.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "agent@telecom.com",
    "email": "agent@telecom.com",
    "role": "AGENT"
  }
}
```

### Menggunakan Access Token

Semua request ke protected endpoints harus include Authorization header:

```bash
curl -X GET http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Refresh Token

Untuk mendapatkan access token baru:

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## 📖 API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|----------|
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | User logout |

### Customer Management

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|----------|------|
| GET | `/customers` | List customers | ✓ |
| POST | `/customers` | Create customer | ✓ |
| GET | `/customers/{id}` | Get customer detail | ✓ |
| PUT | `/customers/{id}` | Update customer | ✓ |
| GET | `/customers/{id}/profile` | Get customer profile | ✓ |
| POST | `/customers/{id}/profile` | Create/update profile | ✓ |
| GET | `/customers/{id}/addresses` | List addresses | ✓ |
| POST | `/customers/{id}/addresses` | Add address | ✓ |
| GET | `/customers/{id}/subscriptions` | List subscriptions | ✓ |
| POST | `/customers/{id}/subscriptions` | Create subscription | ✓ |

### Product Catalog

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|----------|------|
| GET | `/products` | List products | ✓ |
| POST | `/products` | Create product | ✓ |
| GET | `/products/{id}` | Get product detail | ✓ |
| PUT | `/products/{id}` | Update product | ✓ |
| GET | `/products/{id}/pricing` | Get pricing | ✓ |
| POST | `/products/{id}/pricing` | Set pricing | ✓ |
| GET | `/products/{id}/quota` | Get quota | ✓ |
| POST | `/products/{id}/quota` | Set quota | ✓ |
| GET | `/packages` | List packages | ✓ |
| POST | `/packages` | Create package | ✓ |
| GET | `/bundles` | List bundles | ✓ |
| POST | `/bundles` | Create bundle | ✓ |

### Campaign & Promo

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|----------|------|
| GET | `/campaigns` | List campaigns | ✓ |
| POST | `/campaigns` | Create campaign | ✓ |
| GET | `/campaigns/{id}` | Get campaign detail | ✓ |
| PUT | `/campaigns/{id}` | Update campaign | ✓ |
| GET | `/promos` | List promos | ✓ |
| POST | `/promos` | Create promo | ✓ |
| GET | `/coupons` | List coupons | ✓ |
| POST | `/coupons` | Generate coupons | ✓ |
| POST | `/coupons/{code}/redeem` | Redeem coupon | ✓ |

### Loyalty & Rewards

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|----------|------|
| GET | `/members` | List members | ✓ |
| POST | `/members` | Enroll member | ✓ |
| GET | `/members/{id}` | Get member detail | ✓ |
| GET | `/members/{id}/points` | Get member points | ✓ |
| POST | `/members/{id}/points` | Add points | ✓ |
| GET | `/members/{id}/ledger` | Get points ledger | ✓ |
| GET | `/members/{id}/rewards` | Get available rewards | ✓ |
| POST | `/members/{id}/redeem` | Redeem reward | ✓ |
| GET | `/members/{id}/tier-history` | Get tier history | ✓ |
| GET | `/tiers` | List loyalty tiers | ✓ |
| GET | `/rewards` | List rewards | ✓ |

### Analytics

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|----------|------|
| GET | `/analytics/customer-features` | Get customer features | ✓ |
| GET | `/analytics/churn-risk` | Get churn risk analysis | ✓ |
| GET | `/analytics/fraud-detection` | Get fraud detection | ✓ |
| GET | `/analytics/recommendations` | Get recommendations | ✓ |

## 📊 Database Schema

Proyek ini menggunakan 5 schema PostgreSQL:

### 1. Customer Schema (001_initial_schema.sql)
- `user_auth` - User authentication
- `customer` - Customer data
- `customer_profile` - Customer profile details
- `customer_address` - Customer addresses
- `subscription` - Customer subscriptions
- `device` - Device information
- `usage_history` - Usage data (partitioned by date)
- `billing_account` - Billing information
- `invoice` - Invoices
- `payment` - Payments

### 2. Product Schema (002_initial_schema.sql)
- `product` - Product master
- `package` - Product packages
- `bundle` - Product bundles
- `addon` - Product add-ons
- `pricing` - Product pricing
- `quota` - Product quota
- `benefit` - Product benefits
- `product_catalog` - Product catalogs
- `catalog_category` - Catalog categories

### 3. Promo Schema (003_initial_schema.sql)
- `campaign` - Marketing campaigns
- `promo` - Promotions
- `promo_rule` - Promo rules
- `promo_condition` - Promo conditions
- `coupon` - Coupons
- `voucher` - Vouchers
- `promo_redemption` - Redemption records

### 4. Loyalty Schema (004_initial_schema.sql)
- `member` - Loyalty members
- `tier` - Membership tiers
- `tier_history` - Tier change history
- `reward` - Reward catalog
- `reward_partner` - Reward partners
- `point_ledger` - Points transactions
- `redemption` - Reward redemptions
- `wallet` - Member wallets

### 5. Analytics Schema (005_initial_schema.sql)
- `customer_features` - Customer analytical features
- `recommendation_features` - Product recommendation data
- `campaign_metrics` - Campaign performance metrics
- `churn_features` - Churn prediction features
- `fraud_features` - Fraud detection features

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📝 Development Scripts

```bash
# Development server (dengan auto-reload)
npm run dev

# Build untuk production
npm run build

# Start production server
npm start

# Linting
npm run lint

# Format code
npm run format

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## 🔧 Environment Variables

Copy `.env.example` ke `.env` dan sesuaikan:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telecom_crm
DB_USER=postgres
DB_PASSWORD=password
DB_SSL=false

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRE=3600
JWT_REFRESH_EXPIRE=86400

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# API
API_PREFIX=/api/v1
API_TIMEOUT=30000

# Logging
LOG_LEVEL=debug
```

## 📦 Dependencies

### Production
- **express** - Web framework
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT token handling
- **bcryptjs** - Password hashing
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **express-validator** - Request validation
- **uuid** - UUID generation

### Development
- **typescript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **ts-node-dev** - Development server
- **jest** - Testing framework
- **eslint** - Code linting
- **prettier** - Code formatting

## 🐛 Error Handling

API menggunakan standar error response:

```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "details": {},
  "timestamp": "2026-06-04T09:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Deskripsi |
|------|-------------|----------|
| `UNAUTHORIZED` | 401 | Missing or invalid authorization |
| `INVALID_TOKEN` | 401 | Token invalid atau expired |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_KEY` | 409 | Unique constraint violation |
| `INTERNAL_ERROR` | 500 | Server error |

## 📝 Request/Response Examples

### Example: Create Customer

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customerCode": "CUST-001",
    "customerType": "INDIVIDUAL",
    "nationalId": "12345678901234",
    "preferredLanguage": "id_ID"
  }'
```

**Response (201 Created):**
```json
{
  "data": {
    "customer_id": "550e8400-e29b-41d4-a716-446655440000",
    "customer_code": "CUST-001",
    "customer_type": "INDIVIDUAL",
    "status": "ACTIVE",
    "created_at": "2026-06-04T09:30:00Z"
  }
}
```

### Example: List Customers

**Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/customers?page=1&pageSize=20&status=ACTIVE" \
  -H "Authorization: Bearer <token>"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "customer_id": "550e8400-e29b-41d4-a716-446655440000",
      "customer_code": "CUST-001",
      "customer_type": "INDIVIDUAL",
      "status": "ACTIVE",
      "created_at": "2026-06-04T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 🚀 Deployment

### Production Checklist

- [ ] Update environment variables di production
- [ ] Enable database SSL connection
- [ ] Secure JWT secrets
- [ ] Setup CORS untuk domain yang diizinkan
- [ ] Enable request rate limiting
- [ ] Setup monitoring dan logging
- [ ] Configure backup database
- [ ] Setup CI/CD pipeline

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```bash
# Build
docker build -t telecom-crm-api .

# Run
docker run -p 3000:3000 --env-file .env telecom-crm-api
```

## 📞 Support & Kontribusi

- **Issues**: Laporkan bug di GitHub Issues
- **Contributing**: Submit pull requests dengan deskripsi yang jelas
- **Documentation**: Update README untuk fitur baru

## 📄 License

Apache License 2.0 - Lihat file LICENSE untuk details

## 👥 Author

Telecom CRM Team

---

**Dibuat dengan ❤️ untuk platform CRM Telekomunikasi**
