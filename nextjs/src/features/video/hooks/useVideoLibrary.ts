// ==========================================
// HOOK: useVideoLibrary
// Manages user's video library state with UX feedback
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import * as service from '../service';
import type {
  UserVideoLibraryEntry,
  VideoCategory,
  LibraryFilters,
  AddToLibraryRequest,
  CreateCategoryRequest,
} from '../types';

export type UploadStage = 'validating' | 'fetching' | 'processing' | 'adding' | 'complete' | 'error';

export interface UploadState {
  isUploading: boolean;
  stage: UploadStage;
  progress: number;
  videoTitle: string;
  error: string | null;
}

export function useVideoLibrary(userId: string | undefined) {
  const [entries, setEntries] = useState<UserVideoLibraryEntry[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LibraryFilters>({
    view: 'grid',
    sortBy: 'date_added',
    filterBy: 'all',
    categoryId: null,
    jlptLevel: null,
    searchQuery: '',
  });
  
  // Upload state for progress tracking
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    stage: 'validating',
    progress: 0,
    videoTitle: '',
    error: null,
  });

  const loadLibrary = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [libraryEntries, userCategories] = await Promise.all([
        service.getUserLibrary(userId, filters),
        service.getUserCategories(userId),
      ]);
      setEntries(libraryEntries);
      setCategories(userCategories);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const updateUploadStage = useCallback((stage: UploadStage, progress?: number, videoTitle?: string) => {
    setUploadState(prev => ({
      ...prev,
      stage,
      progress: progress ?? prev.progress,
      ...(videoTitle !== undefined && { videoTitle }),
    }));
  }, []);

  const addVideo = useCallback(async (
    req: AddToLibraryRequest, 
    onProgress?: (stage: UploadStage, progress: number) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      // Start upload tracking
      setUploadState({
        isUploading: true,
        stage: 'validating',
        progress: 10,
        videoTitle: '',
        error: null,
      });
      onProgress?.('validating', 10);

      // Add to library
      setUploadState(prev => ({ ...prev, stage: 'adding', progress: 75 }));
      onProgress?.('adding', 75);
      
      await service.addToLibrary(userId, req);
      
      // Complete
      setUploadState(prev => ({ ...prev, stage: 'complete', progress: 100 }));
      onProgress?.('complete', 100);
      
      await loadLibrary();
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to add video';
      setUploadState(prev => ({ ...prev, stage: 'error', error: errorMsg }));
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId, loadLibrary]);

  const removeVideo = useCallback(async (videoId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    try {
      await service.removeFromLibrary(userId, videoId);
      setEntries(prev => prev.filter(e => e.video_id !== videoId));
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to remove video';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId]);

  const toggleFavorite = useCallback(async (videoId: string, isFavorite: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    try {
      await service.toggleFavorite(userId, videoId, isFavorite);
      setEntries(prev => prev.map(e =>
        e.video_id === videoId ? { ...e, is_favorite: isFavorite } : e
      ));
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to update favorite';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId]);

  const assignCategory = useCallback(async (videoId: string, categoryId: string | null): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    try {
      await service.assignCategory(userId, videoId, categoryId);
      setEntries(prev => prev.map(e =>
        e.video_id === videoId ? { ...e, category_id: categoryId } : e
      ));
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to assign category';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId]);

  const createCategory = useCallback(async (req: CreateCategoryRequest): Promise<{ success: boolean; category?: VideoCategory; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    try {
      const category = await service.createCategory(userId, req);
      setCategories(prev => [...prev, category]);
      return { success: true, category };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to create category';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    try {
      await service.deleteCategory(categoryId, userId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : String(err)) || 'Failed to delete category';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [userId]);

  const updateFilters = useCallback((newFilters: Partial<LibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      stage: 'validating',
      progress: 0,
      videoTitle: '',
      error: null,
    });
  }, []);

  return {
    entries,
    categories,
    loading,
    error,
    filters,
    updateFilters,
    clearError,
    // Upload state
    uploadState,
    resetUpload,
    // Actions with feedback
    addVideo,
    removeVideo,
    toggleFavorite,
    assignCategory,
    createCategory,
    deleteCategory,
    refresh: loadLibrary,
  };
}
