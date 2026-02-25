// Central API configuration
export const API_BASE_URL = 'http://127.0.0.1:5000';

export const getApiUrl = (endpoint: string) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
};

export const getUploadsUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${API_BASE_URL}/uploads/${cleanPath}`;
};
