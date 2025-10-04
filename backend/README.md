# Transparent Revenue & Ticketing Audit System - Backend (Node.js)

This directory contains the Node.js Express backend that powers the AuditSys UG application. It provides a RESTful API for the frontend, primarily for handling user authentication with JWT.

---

## Getting Started

Follow these instructions to set up and run the backend server on your local machine.

### Prerequisites
- Node.js (v14 or later)
- `npm` (Node Package Manager)

### Installation & Setup

1.  **Navigate to the Backend Directory**
    ```bash
    cd backend
    ```

2.  **Install Dependencies**
    Install the required packages from `package.json`.
    ```bash
    npm install
    ```

### Default User Accounts

The mock server has two default users for testing:

-   **Administrator:**
    -   **Username:** `admin`
    -   **Password:** `password`
-   **Agent:**
    -   **Username:** `agent`
    -   **Password:** `password`

### Running the Server

Once the setup is complete, you can start the backend server.

1.  **Run the Express Application**
    ```bash
    node server.js
    ```

2.  **Access the API**
    The server will start and listen for requests on `http://127.0.0.1:5000`. The frontend application is configured to communicate with this address. You can now open the main `index.html` file in your browser to use the fully functional application with login capabilities.
