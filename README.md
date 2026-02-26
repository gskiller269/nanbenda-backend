# Nandamart Backend

Express.js REST API backend for the Nandamart Hub application.  
Connects to **Supabase** and exposes a full REST API for all data entities.

---

## 📁 Project Structure

```
backend/
├── server.js                  # Entry point — starts Express on 0.0.0.0:5000
├── .env                       # Environment variables (not committed to git)
├── package.json
└── src/
    ├── supabaseClient.js      # Supabase service-role client
    ├── middleware/
    │   └── auth.js            # JWT authentication + admin guard
    └── routes/
        ├── auth.js            # POST /api/auth/login
        ├── products.js        # CRUD /api/products
        ├── sales.js           # CRUD /api/sales
        ├── recharges.js       # CRUD /api/recharges
        ├── emis.js            # CRUD /api/emis
        ├── employees.js       # CRUD /api/employees
        ├── networks.js        # GET/PUT /api/networks
        └── simstock.js        # GET/PUT /api/simstock
```

---

## ⚙️ Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure `.env`

Edit `backend/.env` and fill in your values:

```env
SUPABASE_URL=https://txnverreduxjpwjmfmab.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here    # From Supabase Dashboard → Settings → API
JWT_SECRET=any_long_random_string_here
PORT=5000
```

> **Where to get the service role key:**  
> Supabase Dashboard → Your Project → Project Settings → API → `service_role` (secret)

### 3. Start the server

**Development (auto-restart on changes):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Expected output:
```
  ✅  Nandamart Backend is running!
  🌐  Local:   http://localhost:5000
  🌐  Network: http://0.0.0.0:5000
  📡  Health:  http://localhost:5000/api/health
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check |
| POST | `/api/auth/login` | None | Login, returns JWT |
| POST | `/api/auth/logout` | None | Logout (stateless) |
| GET | `/api/products` | ✅ JWT | List products (filter by `?branch=`) |
| POST | `/api/products` | ✅ JWT | Create product |
| PUT | `/api/products/:id` | ✅ JWT | Update product |
| DELETE | `/api/products/:id` | ✅ JWT | Delete product |
| GET | `/api/sales` | ✅ JWT | List sales (filter by `?branch=&date=`) |
| POST | `/api/sales` | ✅ JWT | Create sale record |
| DELETE | `/api/sales/:id` | ✅ JWT | Delete sale |
| GET | `/api/recharges` | ✅ JWT | List recharges |
| POST | `/api/recharges` | ✅ JWT | Create recharge |
| PUT | `/api/recharges/:id` | ✅ JWT | Update recharge status |
| GET | `/api/emis` | ✅ JWT | List EMI records |
| POST | `/api/emis` | ✅ JWT | Create EMI |
| PUT | `/api/emis/:id` | ✅ JWT | Update EMI (pay installment) |
| GET | `/api/employees` | ✅ JWT | List employees |
| POST | `/api/employees` | 👑 Admin | Add employee |
| PUT | `/api/employees/:id` | 👑 Admin | Update employee |
| DELETE | `/api/employees/:id` | 👑 Admin | Delete employee |
| GET | `/api/networks` | ✅ JWT | List networks & balances |
| PUT | `/api/networks/:id` | 👑 Admin | Update network balance/commission |
| GET | `/api/simstock` | ✅ JWT | Get SIM stock map |
| PUT | `/api/simstock/:network` | 👑 Admin | Update SIM stock quantity |

---

## 📱 Accessing from Mobile Data (Public Access)

The server binds to `0.0.0.0` (all interfaces). To expose it to the internet for mobile data access:

### Option A — ngrok (easiest)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 5000
# → gives you https://abc123.ngrok-free.app
```

### Option B — Deploy to Render.com (free, permanent)
1. Push `backend/` folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Add the same env vars from `.env` in Render's dashboard
6. Your backend will be at `https://your-app.onrender.com`

---

## 🔐 Authentication

After login, include the JWT token in all protected requests:

```http
Authorization: Bearer <token>
```

Example using fetch:
```js
const response = await fetch('http://localhost:5000/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});
```
