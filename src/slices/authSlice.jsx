import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';

// Асинхронные действия
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/users/', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка регистрации');
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ username, password }, { rejectWithValue, dispatch }) => {
        try {
            // 1. Получаем токены
            const response = await api.post('/auth/jwt/create/', {
                username,
                password
            });
            
            const { access, refresh } = response.data;
            
            localStorage.setItem('accessToken', access);
            localStorage.setItem('refreshToken', refresh);
            
            // 2. Сразу получаем данные пользователя
            const userResponse = await api.get('/auth/users/me/');
            
            return {
                accessToken: access,
                refreshToken: refresh,
                user: userResponse.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка входа');
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/auth/users/me/');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const updateUserProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await api.patch('/auth/users/me/', userData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Ошибка обновления');
        }
    }
);

// Функция для проверки валидности токена
const isTokenValid = (token) => {
    if (!token) return false;
    try {
        const decoded = jwtDecode(token);
        return decoded.exp > Date.now() / 1000;
    } catch {
        return false;
    }
};

// Загрузка начального состояния из localStorage
const loadInitialState = () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (isTokenValid(accessToken)) {
        try {
            const decoded = jwtDecode(accessToken);
            return {
                accessToken,
                refreshToken,
                user: {
                    id: decoded.user_id,
                    // username и email пока неизвестны - загрузятся позже через fetchUserProfile
                },
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    return {
        accessToken: null,
        refreshToken: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
    }
};

const authSlice = createSlice({
    name: 'auth',
    initialState: loadInitialState(),
    reducers: {
        logout: (state) => {
            state.accessToken = null;
            state.refreshToken = null;
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.isLoading = false;
                // Не логиним автоматически, пользователь должен войти
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Login
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.accessToken = action.payload.accessToken;
                state.refreshToken = action.payload.refreshToken;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            // Fetch profile
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state) => {
                // Если профиль не загрузился - возможно токен невалидный
                state.isAuthenticated = false;
                state.accessToken = null;
                localStorage.removeItem('accessToken');
            })
            // Update profile
            .addCase(updateUserProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.error = null;
            })
            .addCase(updateUserProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer; 