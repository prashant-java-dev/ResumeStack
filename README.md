# Resume Stack

Resume Stack is a professional Resume Builder and ATS (Applicant Tracking System) Checker application. It helps users build industry-standard resumes and check their ATS score to improve their chances of getting hired.

## Features

### Frontend (Client Side)
- **Interactive Resume Builder:** Real-time editing with live preview.
- **Multiple Templates:** Choose from different professional resume templates.
- **ATS Checker:** Analyze your resume against job descriptions to get an ATS entry score.
- **PDF Download:** specific download features to get your resume in high-quality PDF format.
- **Dark/Light Mode:** Full theme support for a better user experience.
- **Authentication:** Secure login and signup for saving your progress.

**Tech Stack:** React, Vite, TailwindCSS, HTML5, CSS3, JavaScript.

### Backend (Server Side)
- **User Management:** Secure user registration and login using JWT (JSON Web Tokens).
- **Resume Management:** Save, update, and retrieve your resumes from the database.
- **Microservices Ready:** Built with scalable Spring Boot architecture.

**Tech Stack:** Java, Spring Boot, MongoDB, Spring Security, JWT.

## Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Java JDK](https://www.oracle.com/java/technologies/downloads/) (v17 or higher)
- [MongoDB](https://www.mongodb.com/) (running locally or Atlas URL)

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend/resumebuilder
    ```
2.  Run the application:
    ```bash
    ./mvnw spring-boot:run
    ```
    The backend server will start (default port: 8080).

### 2. Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The frontend will run at `http://localhost:5173` (or similar).

## Deployment

To deploy the full project:
1.  **Frontend:** Build the project using `npm run build` and deploy the `dist` folder to vercel, Netlify, or any static host.
2.  **Backend:** Package the Spring Boot app using `./mvnw package` and deploy the JAR file to AWS, Heroku, or any Java-supporting cloud provider.

## Author
[Prashant](https://github.com/prashant-java-dev)

---
*Created with professional standards for reliability and ease of use.*
