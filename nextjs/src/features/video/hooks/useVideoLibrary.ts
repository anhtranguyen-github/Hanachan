// ==========================================
// HOOK: useVideoLibrary
// Manages user's video library state
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as service from '../service';
import type {
  UserVideoLibraryEntry,
  VideoCategory,
  LibraryFilters,
  AddToLibraryRequest,
  CreateCategoryRequest,
} from '../types';

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

  const loadLibrary = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [libraryEntries, userCategories] = await Promise.all([
        service.getUserLibrary(userId, filters),
        service.getUserCategories(userId),
      ]);
      setEntries(libraryEntries);
      setCategories(userCategories);
    } catch (err: any) {
      setError(err.message || 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [userId, filters]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const addVideo = useCallback(async (req: AddToLibraryRequest) => {
    if (!userId) return;
    try {
      await service.addToLibrary(userId, req);
      await loadLibrary();
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId, loadLibrary]);

  const removeVideo = useCallback(async (videoId: string) => {
    if (!userId) return;
    try {
      await service.removeFromLibrary(userId, videoId);
      setEntries(prev => prev.filter(e => e.video_id !== videoId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  const toggleFavorite = useCallback(async (videoId: string, isFavorite: boolean) => {
    if (!userId) return;
    try {
      await service.toggleFavorite(userId, videoId, isFavorite);
      setEntries(prev => prev.map(e =>
        e.video_id === videoId ? { ...e, is_favorite: isFavorite } : e
      ));
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  const assignCategory = useCallback(async (videoId: string, categoryId: string | null) => {
    if (!userId) return;
    try {
      await service.assignCategory(userId, videoId, categoryId);
      setEntries(prev => prev.map(e =>
        e.video_id === videoId ? { ...e, category_id: categoryId } : e
      ));
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  const createCategory = useCallback(async (req: CreateCategoryRequest) => {
    if (!userId) return;
    try {
      const category = await service.createCategory(userId, req);
      setCategories(prev => [...prev, category]);
      return category;
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!userId) return;
    try {
      await service.deleteCategory(categoryId, userId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [userId]);

  const updateFilters = useCallback((newFilters: Partial<LibraryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    entries,
    categories,
    loading,
    error,
    filters,
    updateFilters,
    addVideo,
    removeVideo,
    toggleFavorite,
    assignCategory,
    createCategory,
    deleteCategory,
    refresh: loadLibrary,
  };
}
