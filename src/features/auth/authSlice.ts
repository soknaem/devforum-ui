import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { UserProfile } from "@/lib/api";
type AuthState = { user: UserProfile | null; hydrated: boolean };
const initialState: AuthState = { user:null, hydrated:false };
const slice = createSlice({
  name:"auth", initialState,
  reducers:{
    setUser:(s,a:PayloadAction<UserProfile|null>)=>{s.user=a.payload;s.hydrated=true},
    clearUser:(s)=>{s.user=null;s.hydrated=true}
  }
});
export const {setUser,clearUser}=slice.actions;
export default slice.reducer;
