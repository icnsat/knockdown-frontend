import axios from 'axios';

const api = axios.create({
	baseURL: (
		process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api'
	),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('accessToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);


// Response interceptor для обработки 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Если 401 и это не запрос на обновление токена
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url.includes('/jwt/refresh/')) {
            
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(
                        `${api.defaults.baseURL}/auth/jwt/refresh/`,
                        { refresh: refreshToken }
                    );

                    const { access } = response.data;
                    localStorage.setItem('accessToken', access);

                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Если не удалось обновить - чистим токены
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;