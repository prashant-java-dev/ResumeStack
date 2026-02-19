const getBaseUrl = () => {
    let url = import.meta.env.VITE_API_Backend;

    // If environment variable is missing in production, fallback to production Railway URL
    if (!url && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        url = "https://resumestack-resumestack.up.railway.app";
    }

    url = url || "http://localhost:8080";

    // Force https for production railway URLs
    if (url.includes("railway.app")) {
        url = url.replace("http://", "https://");
    }

    return url.replace(/\/$/, ""); // Remove trailing slash
};

const API_BASE_URL = getBaseUrl() + "/api";
console.log('📡 API Target:', API_BASE_URL);

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    } : {
        'Content-Type': 'application/json'
    };
};

export const api = {
    // Auth
    login: async (email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
        return response.json();
    },

    register: async (fullName, email, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Registration failed');
        }
        return response.json();
    },

    // Resumes
    createResume: async (resumeData) => {
        const response = await fetch(`${API_BASE_URL}/resumes`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(resumeData)
        });
        if (!response.ok) throw new Error('Failed to create resume');
        return response.json();
    },

    updateResume: async (id, resumeData) => {
        const response = await fetch(`${API_BASE_URL}/resumes/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(resumeData)
        });
        if (!response.ok) throw new Error('Failed to update resume');
        return response.json();
    },

    getMyResumes: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/resumes`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error(`Failed to fetch resumes: ${response.status}`);
            return response.json();
        } catch (err) {
            console.error('Network Error (getMyResumes):', err.message);
            throw err;
        }
    }
};
