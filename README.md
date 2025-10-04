
# Transparent Revenue & Ticketing Audit System (AuditSys UG)

<p align="center">
  <img src="https://raw.githubusercontent.com/user-attachments/assets/e1a61c56-32d8-4f8a-93a8-442886f78a7f" width="120" alt="AuditSys UG Logo">
  <h1 align="center">AuditSys UG</h1>
</p>

A web-based platform for the Ugandan aviation sector to provide real-time visibility and accountability across all revenue streams. This system enables meticulous tracking of ticket sales, fee collections, and financial reconciliations to combat corruption and restore trust. It is built using modern web technologies and demonstrates a secure, transparent, and auditable system.

---

## ✨ Key Features

-   **Real-Time Dashboard:** A comprehensive overview of key metrics, including total revenue, ticket sales volume, agent performance, and pending discrepancies, updated with live data streams.
-   **Immutable Transaction Ledger:** Employs a blockchain-inspired model where each transaction is cryptographically linked to the previous one using SHA-256 hashing. This creates a tamper-evident audit trail that can be verified at any time.
-   **Automated Discrepancy Flagging:** The system automatically monitors for anomalies, such as price mismatches or unaccounted fees, and flags them for investigation by authorized personnel.
-   **Agent Performance Monitoring:** Provides detailed statistics for each agent, tracking tickets sold, total revenue generated, accuracy, and dispute rates.
-   **Role-Based Access Control (RBAC):** A secure authentication system with distinct roles (`Administrator`, `Auditor`, `Finance Officer`, `Agent`), ensuring users can only access data and features relevant to their position.
-   **Comprehensive Reporting System:** Allows authorized users to generate and download detailed reports in CSV format for ticket sales, agent performance, discrepancies, and the full transaction ledger.
-   **Live Notifications:** Real-time alerts for significant events, such as high-value transactions or newly flagged discrepancies, keeping auditors and administrators informed.

---

## 💻 Technology Stack

This project is a modern, client-rendered web application with a mock backend for authentication.

### Frontend
-   **Framework/Library:** React 19
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **Routing:** React Router
-   **Data Visualization:** Recharts
-   **State Management:** React Context API (for Auth, Data, Notifications)
-   **Security:** Web Crypto API (`crypto.subtle`) for client-side hashing.

### Backend (Mock Server)
-   **Environment:** Node.js
-   **Framework:** Express.js
-   **Authentication:** JSON Web Tokens (JWT) for mock user sessions.

---

## 🚀 Getting Started

Follow these instructions to set up and run the application on your local machine.

### Prerequisites
-   A modern web browser (e.g., Google Chrome, Firefox, Microsoft Edge).
-   [Node.js](https://nodejs.org/) (v14 or later) and `npm` to run the mock backend server.

### Installation & Launch

The application consists of a static frontend and a simple Node.js backend for handling logins.

**1. Run the Backend Server (for Authentication)**

The backend server manages user login and session creation.

```bash
# Navigate to the backend directory
cd backend

# Install the required dependencies
npm install

# Start the server
npm start
```
The server will be running at `http://127.0.0.1:5000`. The frontend is pre-configured to communicate with this address.

**2. Launch the Frontend Application**

The frontend does not require a build step. Simply open the `index.html` file in your web browser.

> **Note:** For the best experience, run `index.html` through a local server extension (like Live Server for VS Code) to avoid potential CORS issues, although it is configured to work directly from the file system.

---

## 🕹️ Usage & Demo

The application comes with pre-configured user accounts for demonstration purposes.

### Demo Credentials

| Role          | Username | Password  |
|---------------|----------|-----------|
| Administrator | `admin`  | `password`|
| Agent         | `agent`  | `password`|

### Exploring the System

-   **Administrator:** Has full access to all features, including agent performance, all financial data, and the ability to tamper with data on the ledger page (for demonstration purposes).
-   **Agent:** Has a restricted view, limited to their own ticket sales and revenue dashboard.
-   **Verify the Ledger:** Navigate to the **Transaction Ledger** page and click the `Verify Ledger Integrity` button. This will check the cryptographic chain and confirm that no data has been altered.
-   **Simulate Tampering:** As an administrator, click the `Tamper with Data` button on the ledger page. This will randomly change a transaction's amount, breaking the cryptographic chain. Run the verification again to see the system instantly detect the tampered record.

---

## 📂 Project Structure

The project is organized into a clear and modular structure.

```
.
├── backend/                  # Mock Node.js server for authentication
│   ├── node_modules/
│   ├── package.json
│   ├── README.md
│   └── server.js
├── components/               # React components
│   ├── ui/                   # Reusable UI elements (Cards, Icons, etc.)
│   ├── AgentPerformance.tsx
│   ├── Dashboard.tsx
│   ├── Discrepancies.tsx
│   ├── Header.tsx
│   ├── Login.tsx
│   ├── Reports.tsx
│   ├── Sidebar.tsx
│   └── ...
├── context/                  # React Context providers for global state
│   ├── AuthContext.tsx
│   ├── DataContext.tsx
│   └── NotificationContext.tsx
├── lib/                      # Helper functions and utilities
│   ├── cryptoUtils.ts        # Hashing functions
│   ├── dataGenerator.ts      # Real-time data simulation
│   └── mockData.ts           # Initial dataset generation
├── App.tsx                   # Main application component with routing
├── index.html                # Main HTML entry point
├── index.tsx                 # React root renderer
├── metadata.json
├── README.md                 # This file
└── types.ts                  # TypeScript type definitions
```

