import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // lessons: lessonsReducer,
        // stats: statsReducer,
    },
    // ЛИШНЕЕ - Добавляем middleware для обработки async thunk
    // middleware: (getDefaultMiddleware) =>
    //     getDefaultMiddleware({
    //         serializableCheck: {
    //             // Игнорируем определенные actions, если нужно
    //             ignoredActions: ['auth/login/fulfilled'],
    //         },
    //     }),
});
