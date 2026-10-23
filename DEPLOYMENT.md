# 🌐 Production Deployment Guide
### Shree Ganesh Medical Management System (MERN Stack)

This guide walks you through deploying the application live so anyone (including your guide "Sir" or external examiners) can access it over the public internet from any phone or laptop.

---

## 🏗️ Recommended Cloud Deployment Architecture (Free & Easy)

```
  [ Customer / Sir Phone / Laptop ]
                 │
                 ├──► Vercel (Frontend React + Vite SPA)
                 │    URL: https://shree-ganesh-medical.vercel.app
                 │
                 └──► Render / Railway (Backend Node.js + Express + Socket.IO)
                      URL: https://shree-ganesh-api.onrender.com
                           │
                           ▼
                      MongoDB Atlas (Cloud Database)
                      URI: mongodb+srv://...
```

---

## 📋 Step 1: Set up MongoDB Atlas (Cloud Database)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Build a **Free Shared M0 Cluster** (select AWS / Mumbai `ap-south-1` region for fastest speed in Maharashtra).
3. Under **Security ➔ Database Access**:
   - Create a database user (e.g. `pharmacy_admin` with a strong password).
4. Under **Security ➔ Network Access**:
   - Click **Add IP Address** ➔ Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Click **Connect ➔ Drivers ➔ Node.js**:
   - Copy your connection string:
     ```text
     mongodb+srv://pharmacy_admin:<password>@cluster0.xxxxx.mongodb.net/pharmacy_store?retryWrites=true&w=majority
     ```

---

## 📋 Step 2: Deploy Backend to Render (or Railway)
1. Push your repository to your team's **GitHub**.
2. Go to [render.com](https://render.com) and click **New + ➔ Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render default) or `5000` |
   | `MONGODB_URI` | `mongodb+srv://pharmacy_admin:...@cluster0...` |
   | `JWT_SECRET` | *(Any random 64-character secret string)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_ORIGIN` | `*` *(or your Vercel URL once created)* |
6. Click **Deploy Web Service**.
   - Note down your backend URL: e.g. `https://shree-ganesh-api.onrender.com`.
7. **Seed the Cloud Database**:
   - In Render dashboard, go to **Shell** (or run locally with the cloud URI):
     ```bash
     node src/scripts/seed.js
     ```

---

## 📋 Step 3: Deploy Frontend to Vercel (or Netlify)
1. Go to [vercel.com](https://vercel.com) and click **Add New ➔ Project**.
2. Select your GitHub repository.
3. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://shree-ganesh-api.onrender.com` |
   | `VITE_SOCKET_URL` | `https://shree-ganesh-api.onrender.com` |
5. Click **Deploy**.
   - Vercel will build and assign you a public URL: `https://your-project.vercel.app`!

---

## 🔒 Security Hardening Completed in the Code

| Vulnerability Vector | Defense Mechanism | Implemented In |
| :--- | :--- | :--- |
| **Brute Force Login** | In-memory IP rate limiter (15 attempts / 15 mins) | `backend/src/middleware/auth.js` |
| **NoSQL Query Injection** | Strict string type checks (`typeof email === 'string'`) | `backend/src/controllers/authController.js` |
| **CORS Attacks** | Whitelisted origin headers & credentials support | `backend/src/app.js` & `server.js` |
| **Information Leakage** | Internal server errors masked from clients in production | `backend/src/app.js` |
| **Unauthorized Access** | Server-side Role-Based Access Control (RBAC) checks | All routes in `backend/src/routes/` |
| **SPA 404 on Refresh** | Rewrites to `/index.html` configured | `vercel.json` & `_redirects` |
| **WebSocket Failure** | Dynamic URL fallback supporting WSS / HTTPS | `frontend/src/context/SocketContext.jsx` |

---

## 🚀 One-Command Local Docker Deployment (Alternative)
If you prefer deploying on an AWS EC2 instance or local server:
```bash
docker-compose up --build -d
```
All 3 containers (MongoDB, Express API, Nginx React Frontend) will boot automatically on port 80.
