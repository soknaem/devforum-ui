import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import authReducer from "@/features/auth/authSlice";
import realtimeReducer from "@/features/realtime/realtimeSlice";
 
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    realtime: realtimeReducer,
  },
  middleware: (getDefault) => getDefault().concat(api.middleware),
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
 