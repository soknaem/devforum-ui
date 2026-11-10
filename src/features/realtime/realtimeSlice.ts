import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type RealtimeState = {
  /** True while the STOMP socket is open. */
  connected: boolean;
  /** Ids of posts published by people I follow since the home feed was last refreshed. */
  newPostIds: string[];
  /** Ids of posts that were deleted / unpublished and must disappear from lists. */
  removedIds: string[];
};

const initialState: RealtimeState = { connected: false, newPostIds: [], removedIds: [] };

const slice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    newPostArrived: (state, action: PayloadAction<string>) => {
      if (!state.newPostIds.includes(action.payload)) state.newPostIds.push(action.payload);
    },
    clearNewPosts: (state) => {
      state.newPostIds = [];
    },
    resourceRemoved: (state, action: PayloadAction<{ id: string; reason: "deleted" | "unpublished" }>) => {
      if (!state.removedIds.includes(action.payload.id)) state.removedIds.push(action.payload.id);
    },
    resourceRestored: (state, action: PayloadAction<string>) => {
      state.removedIds = state.removedIds.filter((id) => id !== action.payload);
    },
  },
});

export const { setConnected, newPostArrived, clearNewPosts, resourceRemoved, resourceRestored } =
  slice.actions;
export default slice.reducer;