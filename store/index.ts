import { create } from 'zustand';

// ============ AUTH STORE ============
export interface AppUser {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'teacher' | 'student';
  bio: string;
  expertiseCategory: string;
  language: string;
  followersCount: number;
  followingCount: number;
  videosCount: number;
}

interface AuthState {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// ============ VIDEO STORE ============
export interface Video {
  _id: string;
  teacherId: {
    _id: string;
    displayName: string;
    avatarUrl: string;
    role: string;
    expertiseCategory?: string;
    isVerified?: boolean;
  };
  videoUrl: string;
  coverUrl: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  duration: number;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
}

interface VideoState {
  feedVideos: Video[];
  currentVideoIndex: number;
  isLoadingFeed: boolean;
  feedPage: number;
  hasMoreFeed: boolean;
  setFeedVideos: (videos: Video[]) => void;
  appendFeedVideos: (videos: Video[]) => void;
  setCurrentVideoIndex: (index: number) => void;
  setLoadingFeed: (loading: boolean) => void;
  setFeedPage: (page: number) => void;
  setHasMoreFeed: (hasMore: boolean) => void;
  updateVideoStats: (videoId: string, updates: Partial<Video>) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  feedVideos: [],
  currentVideoIndex: 0,
  isLoadingFeed: false,
  feedPage: 1,
  hasMoreFeed: true,
  setFeedVideos: (feedVideos) => set({ feedVideos }),
  appendFeedVideos: (newVideos) =>
    set((state) => ({ feedVideos: [...state.feedVideos, ...newVideos] })),
  setCurrentVideoIndex: (currentVideoIndex) => set({ currentVideoIndex }),
  setLoadingFeed: (isLoadingFeed) => set({ isLoadingFeed }),
  setFeedPage: (feedPage) => set({ feedPage }),
  setHasMoreFeed: (hasMoreFeed) => set({ hasMoreFeed }),
  updateVideoStats: (videoId, updates) =>
    set((state) => ({
      feedVideos: state.feedVideos.map((v) => (v._id === videoId ? { ...v, ...updates } : v)),
    })),
}));

// ============ UI STORE ============
interface UIState {
  colorScheme: 'light' | 'dark';
  language: 'en' | 'pl' | 'zh';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  setLanguage: (lang: 'en' | 'pl' | 'zh') => void;
}

export const useUIStore = create<UIState>((set) => ({
  colorScheme: 'dark',
  language: 'en',
  setColorScheme: (colorScheme) => set({ colorScheme }),
  setLanguage: (language) => set({ language }),
}));
