const API_BASE_URL = (import.meta.env.VITE_API_Backend || "http://localhost:8080") + "/api";
console.log('API_BASE_URL is:', API_BASE_URL);

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
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Login failed with status ${response.status}`);
            }
            return response.json();
        } catch (err) {
            console.error('Fetch error during login:', err);
            throw err;
        }
    },

    register: async (fullName, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Registration failed with status ${response.status}`);
            }
            return response.json();
        } catch (err) {
            console.error('Fetch error during registration:', err);
            throw err;
        }
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
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update resume: ${errorText} (Status: ${response.status})`);
        }
        return response.json();
    },

    getMyResumes: async () => {
        const response = await fetch(`${API_BASE_URL}/resumes`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch resumes');
        return response.json();
    }
};
