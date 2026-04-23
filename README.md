# restaurant-fastapi
# 🍽️ Restaurant Management System (FastAPI + React)

A full-stack restaurant management system with role-based access, real-time order handling, and dedicated views for kitchen, waiter, and cashier.

---

## 🚀 Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Passlib (password hashing)

### Frontend
- React (Vite)
- TailwindCSS
- Axios / Fetch API

---

## 🎯 Features

- 🔐 Role-based authentication (login system)
- 🧑‍🍳 Kitchen dashboard (KitchenView)
- 🍽️ Table management (TableOrders)
- 💳 Cashier view (CashierView)
- 📦 Product management
- 🧾 Order creation and tracking
- 🔔 Real-time alerts (sound + visual)
- 📊 Order status updates

---

## 👥 Roles

| Role   | Description                          |
|--------|--------------------------------------|
| waiter | Creates and manages orders           |
| kitchen| Prepares orders                      |
| cashier| Closes orders and handles payments   |

---

## 🧠 System Flow

1. User logs in
2. Waiter creates an order
3. Kitchen prepares the order
4. Cashier completes the payment

---

## ⚙️ Installation

### 1. Clone repository

```bash
git clone https://github.com/Trujifl/restaurant-fastapi.git

2. Backend setup
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install fastapi uvicorn sqlalchemy passlib[bcrypt] email-validator
uvicorn main:app --reload

Backend runs at:

http://127.0.0.1:8000

API docs:

http://127.0.0.1:8000/api/docs
3. Frontend setup
cd frontend
npm install
npm run dev

Frontend runs at:

http://localhost:5173
🔐 Authentication
Simple login system
Passwords are hashed using bcrypt
Role-based rendering in frontend
📂 Project Structure
restaurant-fastapi/
│
├── models/
├── schemas/
├── routers/
├── utils/
├── database.py
├── main.py
│
└── frontend/
    └── src/
        ├── App.jsx
        ├── Login.jsx
        ├── KitchenView.jsx
        ├── TableOrders.jsx
        ├── CashierView.jsx
🛠️ Future Improvements
JWT authentication
Admin panel (user management)
Order analytics and reports
Deployment (AWS / Docker)
Mobile-friendly UI
📌 Author

Jorge Trujillo

⭐ Notes

This project was built as a real-world learning exercise to understand:

Full-stack development
API design with FastAPI
React state management
Role-based systems
cd restaurant-fastapi
