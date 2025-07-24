// src/store/useUserStore.js
import { create } from 'zustand';
import {
  fetchAllUsers,
  fetchUser,
  sendFriendRequest as apiSendFR,
  respondFriendRequest as apiRespondFR
} from '../api/users';

export const useUserStore = create((set, get) => ({
  users: [],
  profile: null,

  fetchUsers: async () => {
    try {
      const users = await fetchAllUsers();
      set({ users });
    } catch (err) {
      console.error('fetchUsers error', err);
    }
  },

  fetchProfile: async id => {
    try {
      const profile = await fetchUser(id);
      set({ profile });
    } catch (err) {
      console.error('fetchProfile error', err);
    }
  },

  sendFriendRequest: async id => {
    try {
      await apiSendFR(id);
      await get().fetchProfile(id);
    } catch (err) {
      console.error('sendFriendRequest error', err);
    }
  },

  respondFriendRequest: async (myId, fromId, accept) => {
    try {
      await apiRespondFR(myId, { fromId, accept });
      await get().fetchProfile(myId);
    } catch (err) {
      console.error('respondFriendRequest error', err);
    }
  }
}));
