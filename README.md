# 🚀 Task Management System

A complete, full-stack Task Management System built to efficiently track, assign, and manage daily tasks. This application features a beautiful, glassmorphic Next.js frontend seamlessly integrated with a secure, highly-performant Node.js/Prisma backend.

## ✨ Features

- **Robust Authentication**: Full JWT-based security with short-lived Access Tokens and long-lived Refresh Tokens. Auto-refresh is gracefully handled via Axios interceptors. 
- **Task Management (CRUD)**: Create, Read, Edit, and Delete tasks. 
- **Advanced Dashboard**: Features real-time Search, Status Filtering, and Pagination.
- **Polished UI/UX**: Custom glassmorphism Vanilla CSS design. Fully responsive. Includes native Date Pickers (Due Dates) and automatic success/error toast notifications.

### 🌟 Extra Functionality: Team & Invitation System
Beyond standard personal task management, this project features a complete **Employee Onboarding** workflow:
* **Admin Controls**: Dedicated Admin users can construct workspaces with multiple employees.
* **Invite via Link**: Admins can generate secure, unique invitation links for remote employees.
* **Accept Invitations**: Upon receiving a link, employees are seamlessly guided to a portal to establish their password and automatically tie into the company's workspace.
* **Add Manually**: Admins can alternatively directly inject accounts into the workforce environment.

---

## 🛠️ Technology Stack

**Frontend (Track A)**
* **Framework:** Next.js (App Router) + React
* **Language:** TypeScript
* **Styling:** Custom Vanilla CSS (Glassmorphism, CSS Variables, Responsive `@media` logic)
* **Fonts:** Google Fonts (Outfit)
* **HTTP Client:** Axios (With built-in interceptors for auto-token refresh)

**Backend**
* **Environment:** Node.js + Express
* **Language:** TypeScript
* **ORM:** Prisma
* **Database:** PostgreSQL (or any SQL DB configured in Prisma)
* **Security:** `bcrypt` for password hashing, `jsonwebtoken` for stateless auth

---

## 💻 How to Start (Local Development)

To run this application locally, you will need to start both the `backend` and `frontend` servers. 

### 1. Backend Setup

1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the root of the `backend` folder and configure it:
   ```env
   # Example backend/.env
   DATABASE_URL="postgresql://username:password@localhost:5432/taskdb"
   JWT_SECRET="your_super_secret_jwt_key"
   JWT_REFRESH_SECRET="your_super_secret_refresh_key"
   PORT=5000
   ```
4. Push the Prisma database schema to your SQL database:
   ```bash
   npx prisma db push
   # Alternatively: npx prisma migrate dev
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The API will start running (typically on `http://localhost:5000`).*

### 2. Frontend Setup

1. Open a **second** terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables. Create a `.env.local` (or `.env`) file in the frontend root to point to your API:
   ```env
   # Example frontend/.env.local
   NEXT_PUBLIC_API_URL="http://localhost:5000"
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:3000`. You can now register a new admin/company account and begin managing your tasks!
