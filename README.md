# Top Up Games Backend API

Backend API untuk aplikasi top up game menggunakan Express.js, MySQL, dan Prisma ORM.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Zod
- **Password Hashing**: bcryptjs

## Prerequisites

- Node.js (v14 atau lebih tinggi)
- MySQL Server
- npm atau yarn

## Installation

1. Clone repository ini
2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup database MySQL dengan nama `top_up_db`

4. Copy file `.env` dan sesuaikan konfigurasi:
   ```env
   DATABASE_URL="mysql://root:root@localhost:3306/top_up_db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=3000
   ```

5. Jalankan migration database:
   ```bash
   npm run db:migrate
   ```

6. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## API Documentation

API ini dilengkapi dengan dokumentasi Swagger UI yang dapat diakses di:
```
http://localhost:3000/api-docs
```

Swagger UI menyediakan:
- Dokumentasi lengkap semua endpoint API
- Interface interaktif untuk testing API
- Schema model data
- Contoh request dan response
- Informasi authentication (JWT Bearer Token)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Products
- `GET /api/products` - Get semua products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `POST /api/products` - Create product baru (protected)
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

### Transactions
- `POST /api/transactions` - Create transaction baru (public)
- `GET /api/transactions` - Get semua transactions (protected)
- `GET /api/transactions/:id` - Get transaction by ID (protected)
- `PUT /api/transactions/:id` - Update transaction status (protected)

### Users
- `GET /api/users` - Get semua users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `POST /api/users` - Create user baru (protected)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

## Database Schema

### Products
- `id` - Integer (Primary Key, Auto Increment)
- `name` - String (Required)
- `price` - Integer (Required)
- `discount` - Integer (Optional)
- `is_populer` - Boolean (Default: false)
- `total_diamond` - Integer (Required)
- `created_at` - DateTime
- `updated_at` - DateTime

### Transactions
- `id` - Integer (Primary Key, Auto Increment)
- `total_diamond` - Integer (Required)
- `total_amount` - Integer (Required)
- `status` - Enum (pending, processing, success, failed) (Default: pending)
- `no_wa` - String (Required)
- `created_at` - DateTime
- `updated_at` - DateTime

### Users
- `id` - Integer (Primary Key, Auto Increment)
- `username` - String (Required, Unique)
- `password` - String (Required, Hashed)
- `name` - String (Required)
- `role` - Enum (admin, user) (Default: admin)
- `created_at` - DateTime
- `updated_at` - DateTime

## Authentication

API menggunakan JWT untuk authentication. Untuk mengakses protected routes, sertakan token di header:

```
Authorization: Bearer <your-jwt-token>
```

## Scripts

- `npm start` - Jalankan server production
- `npm run dev` - Jalankan server development dengan nodemon
- `npm run db:migrate` - Jalankan database migration
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Buka Prisma Studio

## Environment Variables

- `DATABASE_URL` - Connection string untuk MySQL database
- `JWT_SECRET` - Secret key untuk JWT token
- `PORT` - Port untuk server (default: 3000)

## Development

Untuk development, gunakan:
```bash
npm run dev
```

Server akan restart otomatis ketika ada perubahan file.

## Health Check

Untuk mengecek status server:
```
GET /api/health
```

Response:
```json
{
  "message": "Top Up Games API is running!"
}
```