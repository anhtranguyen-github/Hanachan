import ApiClient from './apiClient';

/**
 * Client for specialized Video library and Dictation operations
 */
class VideoClient extends ApiClient {
  /**
   * Browser-side: Ensures video exists in DB (creates if not)
   */
  async ensureVideo(youtubeId: string): Promise<{ video: any }> {
    return this.post<{ video: any }>('/api/videos', { youtube_id: youtubeId });
  }

  /**
   * Browser-side: Lists all videos
   */
  async listVideos(): Promise<any[]> {
    return this.get<any[]>('/api/videos');
  }

  /**
   * Browser-side: Fetches video transcript
   */
  async getTranscript(youtubeId: string): Promise<any> {
    return this.get<any>(`/api/videos/transcript/${youtubeId}`);
  }

  /**
   * Browser-side: Looks up word in dictionary/context
   */
  async lookupWord(word: string, videoId?: string): Promise<any> {
    const url = `/api/videos/lookup?word=${encodeURIComponent(word)}${videoId ? `&videoId=${videoId}` : ''}`;
    return this.get<any>(url);
  }

  // Dictation methods
  async createDictationSession(videoId: string, settings?: any): Promise<any> {
    return this.post<any>('/api/dictation/session', { video_id: videoId, settings });
  }

  async submitDictationAttempt(sessionId: string, attempt: any): Promise<any> {
    return this.post<any>(`/api/dictation/session/${sessionId}/attempt`, attempt);
  }

  async getDictationStats(): Promise<any> {
    return this.get<any>('/api/dictation/stats');
  }
}

export const videoClient = new VideoClient();
export default videoClient;
