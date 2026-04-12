# 📚 BookMart E-Commerce SPA

A lightweight, full-stack E-Commerce application built with a vanilla JavaScript Single Page Application (SPA) frontend, a Node.js/Express backend, and a MySQL database. Features include user authentication, a shopping cart, PayPal sandbox checkout, and a complete Admin Dashboard.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MySQL Server**

---

## 📂 File Structure

```text
.
├── config/
│   └── db.js               # Database connection setup
├── middleware/
│   └── auth.js             # Authentication and role verification checks
├── routes/
│   ├── admin.js            # Admin dashboard and management APIs
│   ├── auth.js             # User login, registration, and session APIs
│   ├── cart.js             # Shopping cart APIs
│   ├── orders.js           # Checkout and PayPal integration APIs
│   └── products.js         # Product catalog and search APIs
├── app.js                  # Frontend SPA logic (Vanilla JavaScript)
├── index.html              # Main HTML frontend entry point
├── server.js               # Express backend server entry point
├── database.sql            # Initial MySQL database schema setup
├── seed-dummy-data.js      # Script to populate database with demo data
├── seed-products.sql       # Alternate script to just insert books
├── test-db.js              # Utility script to test MySQL connection
├── reset-password.js       # Utility script to reset the Admin password
├── .env                    # Environment variables (create manually)
└── README.md               # Project documentation
```

---

## � Step 1: Install MySQL Locally (Mac via Homebrew)

If you already have MySQL running, you can skip this step. If you are on a Mac, the easiest way to install MySQL is using Homebrew:

1. **Install MySQL:**
   ```bash
   brew install mysql
   ```
2. **Start the MySQL background service:**
   ```bash
   brew services start mysql
   ```
*(Note: By default, Homebrew installs MySQL with the username `root` and **no password**.)*

---

## 📦 Step 2: Project Setup

1. **Install Node Modules:**
   Open your terminal in the project directory and install the required dependencies:
   ```bash
   npm install express mysql2 bcryptjs express-session express-validator helmet cors express-rate-limit dotenv
   ```

2. **Configure Environment Variables:**
   Create a file named `.env` in the root of the project and add your database credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=bookmart
   SESSION_SECRET=your_super_secret_key
   ```
   *(Update `DB_PASSWORD` if your MySQL root user has a password set).*

---

## 🗄️ Step 3: Database Initialization

You need to create the database schema and tables before the app can run.

1. **Create Tables & Schema:**
   Run the provided SQL file to create the `bookmart` database, tables, initial categories, and the master Admin account:
   ```bash
   mysql -u root < database.sql
   ```
   *(If your MySQL user has a password, use `mysql -u root -p < database.sql` and enter it).*

2. **Populate Dummy Data (Highly Recommended):**
   To fully experience the application (including the Admin Dashboard charts, shopping cart items, and products), run the dummy data seeding script:
   ```bash
   node seed-dummy-data.js
   ```

3. **Test Database Connection (Optional):**
   Verify your Node.js app can securely connect to your local MySQL server:
   ```bash
   node test-db.js
   ```

---

## 🏃 Step 4: Run the Application

Once the database is ready, start your local server:

```bash
node server.js
```

Open your web browser and navigate to: **`http://localhost:3000`**

---

## 🔑 Demo Accounts

If you ran the `seed-dummy-data.js` script, you can test the app using these pre-configured accounts:

### 1. Admin Account
* **Email:** `admin@bookmart.com`
* **Password:** `Admin@1234`
* **Features:** Access to the Admin Dashboard (view revenue, manage products, view users, update order statuses).

### 2. Customer Account
* **Email:** `john@example.com`
* **Password:** `password123`
* **Features:** Pre-filled shopping cart, past orders, ability to save items to wishlist.

---

## 🛠️ Troubleshooting Utilities

Included in this repository are a few utility scripts to help if you get stuck:
* **`test-db.js`**: Checks if your `.env` database credentials are correct and prints out your tables.
* **`reset-password.js`**: If you ever get locked out of the Admin account or the initial SQL seed hash doesn't work, run `node reset-password.js` to force-reset the admin password back to `Admin@1234`.
* **`seed-products.sql`**: An alternate raw SQL script to inject just a few basic books without touching users or orders.