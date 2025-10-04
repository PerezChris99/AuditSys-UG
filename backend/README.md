# Transparent Revenue & Ticketing Audit System - Backend

This directory contains the Python Flask backend that powers the AuditSys UG application. It provides a RESTful API for the frontend, manages the SQLite database, handles user authentication with JWT, and implements all business logic, including transaction validation and report generation.

---

## Getting Started

Follow these instructions to set up and run the backend server on your local machine.

### Prerequisites
- Python 3.8+
- `pip` (Python package installer)

### Installation & Setup

1.  **Navigate to the Backend Directory**
    ```bash
    cd backend
    ```

2.  **Create and Activate a Virtual Environment**
    Using a virtual environment is highly recommended to isolate project dependencies.
    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate it
    # On Windows:
    venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    With the virtual environment active, install the required Python packages from `requirements.txt`.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Initialize the Database**
    The first time you run the application, you need to create the database file and populate it with initial data and user accounts using the seed script.
    ```bash
    python seed.py
    ```
    This command will create a `database.db` file and a `.env` file in the current directory.
    
    > **Note:** To reset the database to its initial state at any time, simply delete the `database.db` file and run the `seed.py` script again.

### Default User Accounts

The `seed.py` script creates two default users for testing:

-   **Administrator:**
    -   **Username:** `admin`
    -   **Password:** `adminpassword`
-   **Viewer:**
    -   **Username:** `viewer`
    -   **Password:** `viewerpassword`

### Running the Server

Once the setup is complete, you can start the backend server.

1.  **Run the Flask Application**
    ```bash
    flask run
    ```

2.  **Access the API**
    The server will start and listen for requests, typically on `http://127.0.0.1:5000`. The frontend application is pre-configured to communicate with this address. You can now open the main `index.html` file in your browser to use the fully functional application.
