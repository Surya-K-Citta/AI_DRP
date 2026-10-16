// @ts-nocheck
import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
// The offline sample data is large and only used when the server cannot be reached, so it loads on first use.
const MockDataService: any = new Proxy(
  {},
  {
    get: (_target, method: string) => (...args: unknown[]) =>
      import('./mockData').then((module: any) => module.MockDataService[method](...args)),
  }
);
import { OfflineDetector } from './offlineDetector';
import { useAuthStore } from '@/store/authStore';
import { useSessionClock } from './sessionClock';
import { sanitizeDeep } from './security/sanitizeText';
import { checkUploadFile, type UploadKind } from './security/fileGuard';
import { translateNow } from './clusterDprFormText';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class APIClient {
  private client: AxiosInstance;
  private useMockData: boolean = USE_MOCK_DATA;
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  // Cache TTLs (in milliseconds)
  private readonly CACHE_TTL = {
    projects: 5 * 60 * 1000, // 5 minutes
    project: 5 * 60 * 1000, // 5 minutes
    dprs: 3 * 60 * 1000, // 3 minutes
    dpr: 3 * 60 * 1000, // 3 minutes
    schemes: 10 * 60 * 1000, // 10 minutes
    profile: 5 * 60 * 1000, // 5 minutes
    default: 2 * 60 * 1000, // 2 minutes
  };

  private getCacheKey(method: string, url: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      this.cache.forEach((_, key) => {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      // The refresh cookie is httpOnly and only sent to /api/auth.
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Clean every JSON body before it leaves the browser (operator keys, script markup, control characters).
        // The page-capture HTML for PDF export is cleaned by the server's stricter document sanitiser instead.
        if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData) && !/\/download\/pdf\/html$/.test(config.url || '')) {
          config.data = sanitizeDeep(config.data);
        }

        // Remove Content-Type header for FormData - let axios set it automatically with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // An expired access token: renew it quietly and repeat the request once.
        const original: any = error.config;
        const authCall = /\/auth\/(login|register|refresh|logout)/.test(original?.url || '');
        if (error.response?.status === 401 && original && !original._retried && !authCall && localStorage.getItem('token')) {
          original._retried = true;
          const fresh = await this.refreshSession();
          if (fresh) {
            original.headers = { ...original.headers, Authorization: `Bearer ${fresh}` };
            return this.client(original);
          }
        }

        // Check if it's a network error and we should use mock data
        const isNetworkError = OfflineDetector.isNetworkError(error) || !OfflineDetector.getStatus();
        
        if (isNetworkError && this.useMockData) {
          console.log('🌐 Network error detected, using mock data');
          // Don't reject, let the method handle mock data
          return Promise.reject({ ...error, useMockData: true });
        }

        // Don't show toast for connection errors here - let the calling code handle it
        // This prevents duplicate error messages
        // NOTE: Token clearing removed - we're using mock data and shouldn't clear tokens on errors
        // Only redirect on 401 if it's a real API error (not when using mock data)
        // Token clearing disabled to prevent false logouts when using mock data
        if (error.response?.status === 401 && !this.useMockData) {
          // Don't clear tokens - let the user stay logged in
          // localStorage.removeItem('token');
          // localStorage.removeItem('user');
          // localStorage.removeItem('auth-storage');
          // window.location.href = '/login';
        }
        
        // Only show toast for non-connection errors that aren't already handled
        if (error.response && error.response.status !== 401) {
          const message = (error.response?.data as any)?.message || 'An error occurred';
          toast.error(message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private async handleRequest<T>(
    request: () => Promise<T>,
    mockRequest: () => Promise<T>,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    // Check cache first if cacheKey is provided
    if (cacheKey) {
      const cached = this.getCache<T>(cacheKey);
      if (cached !== null) {
        console.log(`📦 Cache hit for ${cacheKey}`);
        return cached;
      }
    }
    // Always use mock data regardless of online/offline status
    const navigatorOffline = !navigator.onLine;
    const detectorOffline = !OfflineDetector.getStatus();
    const isOffline = navigatorOffline || detectorOffline;
    const shouldUseMock = isOffline; // Always use mock data even when online
    
    if (shouldUseMock) {
      console.log(`📦 Using mock data immediately (navigator.offline: ${navigatorOffline}, detector.offline: ${detectorOffline}, always enabled)`);
      try {
        const result = await mockRequest();
        console.log('✅ Mock data returned successfully');
        
        // Cache mock results
        if (cacheKey && cacheTTL) {
          this.setCache(cacheKey, result, cacheTTL);
          console.log(`💾 Cached mock response for ${cacheKey}`);
        }
        
        return result;
      } catch (mockError) {
        console.error('❌ Mock data request failed:', mockError);
        throw mockError;
      }
    }
    
    // Only attempt real API request if we're confident we're online
    console.log('🌐 Attempting real API request (online status confirmed)...');
    try {
      const result = await request();
      console.log('✅ Real API request successful');
      
      // Cache the result if cacheKey is provided
      if (cacheKey && cacheTTL) {
        this.setCache(cacheKey, result, cacheTTL);
        console.log(`💾 Cached response for ${cacheKey}`);
      }
      
      return result;
    } catch (error: any) {
      console.log('❌ API request failed, checking if network error...', {
        code: error.code,
        message: error.message,
        hasResponse: !!error.response,
      });
      
      // Check if it's a network error - be very aggressive here
      const isNetworkError = 
        !navigator.onLine || // Navigator says offline
        OfflineDetector.isNetworkError(error) || 
        !error.response || 
        error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_INTERNET_DISCONNECTED' ||
        error.code === 'ERR_CONNECTION_REFUSED' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_NETWORK') ||
        error.message?.includes('ERR_CONNECTION_REFUSED') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Network request failed');
      
      if (isNetworkError) {
        console.log('📦 Network error confirmed, falling back to mock data');
        // Update offline detector
        if (!navigator.onLine) {
          OfflineDetector.getStatus(); // This will update the internal state
        }
        try {
          const mockResult = await mockRequest();
          console.log('✅ Mock data fallback successful');
          
          // Cache mock results too
          if (cacheKey && cacheTTL) {
            this.setCache(cacheKey, mockResult, cacheTTL);
            console.log(`💾 Cached mock response for ${cacheKey}`);
          }
          
          return mockResult;
        } catch (mockError) {
          console.error('❌ Mock data fallback also failed:', mockError);
          throw error; // Throw original error if mock also fails
        }
      }
      console.log('❌ Not a network error, throwing original error');
      throw error;
    }
  }

  // Auth endpoints
  async register(data: any) {
    this.clearCache('/auth/profile');
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/auth/register', data);
        return response.data;
      },
      () => MockDataService.register(data)
    );
  }

  private refreshing: Promise<string | null> | null = null;

  /**
   * Swap the refresh cookie for a new 15 minute token. One call at a time, shared by everyone waiting.
   * Returns the new token, or null when the session has ended (then the re-sign-in screen opens).
   */
  refreshSession(): Promise<string | null> {
    if (this.refreshing) return this.refreshing;
    // Once the session has ended only signing in again can start a new one.
    if (useSessionClock.getState().phase === 'expired') return Promise.resolve(null);
    this.refreshing = (async () => {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const data = response.data?.data;
        if (!data?.token) throw new Error('No token');
        const { token, expiresInSeconds, ...user } = data;
        localStorage.setItem('token', token);
        useAuthStore.setState((state: any) => ({ token, user: state.user ? { ...state.user, ...user } : state.user }));
        useSessionClock.getState().setToken(token);
        return token as string;
      } catch (error: any) {
        const code = error?.response?.data?.code;
        if (error?.response?.status === 401) {
          useSessionClock.getState().markExpired(code === 'SESSION_IDLE' ? 'idle' : code === 'ACCOUNT_DEACTIVATED' ? 'deactivated' : 'expired');
        }
        return null;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  async login(email: string, password: string) {
    this.clearCache('/auth/profile');
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/auth/login', { email, password });
        return response.data;
      },
      () => MockDataService.login(email, password)
    );
  }

  /** Drop every cached response (cached lists belong to the person who just signed out). */
  resetSession(): void {
    this.clearCache();
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch {
      /* still clear the client session */
    }
  }

  async acceptConsent(data: {
    accountConsent: boolean;
    aiAssist: boolean;
    analytics: boolean;
    noticeVersion: string;
  }) {
    this.clearCache('/auth/profile');
    const response = await this.client.post('/auth/consent', data);
    return response.data;
  }

  /** Live profile only — never mock. Used by the re-consent gate. */
  async getProfileLive() {
    this.clearCache('/auth/profile');
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async getProfile() {
    const cacheKey = this.getCacheKey('GET', '/auth/profile');
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/auth/profile');
        return response.data;
      },
      () => MockDataService.getProfile(),
      cacheKey,
      this.CACHE_TTL.profile
    );
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  async exportMyData() {
    const response = await this.client.get('/privacy/export', { responseType: 'blob' });
    return response.data;
  }

  async updatePrivacyConsent(data: { aiAssist?: boolean; analytics?: boolean }) {
    this.clearCache('/auth/profile');
    const response = await this.client.patch('/privacy/consent', data);
    return response.data;
  }

  async saveNominee(data: { name: string; phone?: string; email?: string }) {
    this.clearCache('/auth/profile');
    const response = await this.client.put('/privacy/nominee', data);
    return response.data;
  }

  async deleteMyAccount(confirm: string) {
    const response = await this.client.delete('/privacy/account', { data: { confirm } });
    return response.data;
  }

  async submitPrivacyComplaint(data: { subject: string; message: string }) {
    const response = await this.client.post('/privacy/complaint', data);
    return response.data;
  }

  async getPrivacyActivity() {
    const response = await this.client.get('/privacy/activity');
    return response.data;
  }

  async getNotifications(limit = 30) {
    const response = await this.client.get('/privacy/notifications', { params: { limit } });
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.post(`/privacy/notifications/${id}/read`);
    return response.data;
  }

  async getAuditLog(params?: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/admin/audit', { params });
    return response.data;
  }

  async downloadAuditCsv(params?: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
  }) {
    const response = await this.client.get('/admin/audit/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  async runRetentionJob() {
    const response = await this.client.post('/admin/retention/run');
    return response.data;
  }

  // Project endpoints
  async createProject(data: any) {
    // Clear projects cache when creating a new project
    this.clearCache('/projects');
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/projects', data);
        return response.data;
      },
      () => MockDataService.createProject(data)
    );
  }

  async getProjects(params?: any) {
    const cacheKey = this.getCacheKey('GET', '/projects', params);
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/projects', { params });
        return response.data;
      },
      () => MockDataService.getProjects(params),
      cacheKey,
      this.CACHE_TTL.projects
    );
  }

  async getProject(id: string) {
    const cacheKey = this.getCacheKey('GET', `/projects/${id}`);
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/projects/${id}`);
        return response.data;
      },
      () => MockDataService.getProject(id),
      cacheKey,
      this.CACHE_TTL.project
    );
  }

  async updateProject(id: string, data: any) {
    // Clear project cache when updating
    this.clearCache('/projects');
    this.clearCache(`/projects/${id}`);
    return this.handleRequest(
      async () => {
        const response = await this.client.put(`/projects/${id}`, data);
        return response.data;
      },
      () => MockDataService.updateProject(id, data)
    );
  }

  async deleteProject(id: string) {
    // Clear project cache when deleting
    this.clearCache('/projects');
    this.clearCache(`/projects/${id}`);
    return this.handleRequest(
      async () => {
        const response = await this.client.delete(`/projects/${id}`);
        return response.data;
      },
      () => MockDataService.deleteProject(id)
    );
  }

  // DPR endpoints
  async generateDPR(projectId: string, language: string = 'bilingual', stepData?: any) {
    const result = await this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/generate/${projectId}`, { 
          language,
          ...(stepData && { stepData }) // Include stepData if provided
        });
        return response.data;
      },
      () => MockDataService.generateDPR(projectId, language)
    );
    this.invalidateDpr(result?.data?.dprId || result?.data?._id || result?.dprId || result?._id);
    return result;
  }

  peekCachedDpr(dprId: string) {
    return this.getCache(this.getCacheKey('GET', `/dpr/${dprId}`));
  }

  /** Drop the stored DPR and its quality result so the next View fetches again. */
  invalidateDpr(dprId?: string) {
    if (dprId) this.clearCache(`/dpr/${dprId}`);
    this.clearCache('/dpr/user/list');
  }

  async getDPR(dprId: string) {
    const cacheKey = this.getCacheKey('GET', `/dpr/${dprId}`);
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/${dprId}`);
        return response.data;
      },
      () => MockDataService.getDPR(dprId),
      cacheKey,
      this.CACHE_TTL.dpr
    );
  }

  async getProjectDPRs(projectId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/project/${projectId}`);
        return response.data;
      },
      () => MockDataService.getProjectDPRs(projectId)
    );
  }

  // Chat-based DPR generation
  async analyzeDprBuilderStep(payload: {
    stepId: string;
    stepTitle: string;
    factSheet: any;
    customInstructions?: string;
  }) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/builder/analyze', payload, { timeout: 90000 });
        return response.data;
      },
      async () => ({
        success: true,
        data: {
          suggestions: [
            {
              title: 'Looks fine',
              observation: 'Live analysis is unavailable in offline/mock mode.',
              recommendation: 'Retry Analyze when online.',
              offloadingIdea: null,
            },
          ],
        },
      })
    );
  }

  async chatDprBuilderStep(payload: {
    stepId: string;
    stepTitle: string;
    factSheet: any;
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    customInstructions?: string;
  }) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/builder/chat', payload, { timeout: 90000 });
        return response.data;
      },
      async () => ({
        success: true,
        data: {
          response:
            'I can only discuss this step using the facts already in your project sheet. Live research is unavailable offline — tell me which part of this step you want to improve.',
        },
      })
    );
  }

  async generateDPRFromChat(responses: any, language: string = 'english') {
    const response = await this.client.post('/dpr/generate-from-chat', { responses, language });
    return response.data;
  }

  async downloadPDF(dprId: string, language: string = 'english', enhancedParagraphs?: Record<string, string>) {
    // Use POST if enhanced paragraphs are provided, otherwise use GET for backward compatibility
    if (enhancedParagraphs && Object.keys(enhancedParagraphs).length > 0) {
      const response = await this.client.post(`/dpr/${dprId}/download/pdf`, 
        { enhancedParagraphs },
        {
          params: { language },
          responseType: 'blob',
        }
      );
      return response.data;
    } else {
      const response = await this.client.get(`/dpr/${dprId}/download/pdf`, {
        params: { language },
        responseType: 'blob',
      });
      return response.data;
    }
  }

  /**
   * Download PDF generated from client-rendered HTML (exact match with preview).
   * Primarily used for Cluster DPRs rendered by `ClusterDPRDocumentView`.
   */
  async downloadPDFExactFromHTML(dprId: string, html: string, language: string = 'english') {
    const response = await this.client.post(
      `/dpr/${dprId}/download/pdf/html`,
      { html },
      {
        params: { language },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async downloadDOCX(dprId: string, language: string = 'english') {
    const response = await this.client.get(`/dpr/${dprId}/download/docx`, {
      params: { language },
      responseType: 'blob',
    });
    return response.data;
  }

  async downloadXLS(dprId: string, language: string = 'english') {
    const response = await this.client.get(`/dpr/${dprId}/download/xls`, {
      params: { language },
      responseType: 'blob',
    });
    return response.data;
  }

  async analyzeDPRQuality(dprId: string) {
    const cacheKey = this.getCacheKey('GET', `/dpr/${dprId}/quality`);
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/${dprId}/quality`);
        return response.data;
      },
      () => MockDataService.analyzeDPRQuality(dprId),
      cacheKey,
      this.CACHE_TTL.dpr
    );
  }

  async updateDPRContent(dprId: string, content: any, language: string) {
    const response = await this.client.put(`/dpr/${dprId}/content`, { content, language });
    this.invalidateDpr(dprId);
    return response.data;
  }

  async getSchemeDocumentStyle(schemeCode: string) {
    const response = await this.client.get(`/dpr/scheme-style/${encodeURIComponent(schemeCode)}`);
    return response.data;
  }

  async saveSchemeDocumentStyle(schemeCode: string, documentStyle: any) {
    const response = await this.client.put(`/dpr/scheme-style/${encodeURIComponent(schemeCode)}`, {
      documentStyle,
    });
    return response.data;
  }

  async submitDPR(dprId: string, submittedTo: string = 'admin') {
    const response = await this.client.post(`/dpr/${dprId}/submit`, { submittedTo });
    this.invalidateDpr(dprId);
    return response.data;
  }

  async translateToTelugu(dprId: string) {
    const response = await this.client.post(`/dpr/${dprId}/translate/telugu`);
    this.invalidateDpr(dprId);
    return response.data;
  }

  // Cluster DPR endpoints
  async generateClusterDPR(clusterData: any, language: 'english' | 'telugu' | 'bilingual' = 'bilingual') {
    const result = await this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/generate', {
          clusterData,
          language,
        });
        return response.data;
      },
      () => {
        // Mock fallback - return basic structure
        return Promise.resolve({
          success: true,
          data: {
            dprId: 'mock-cluster-dpr-id',
            projectId: 'mock-project-id',
            content: {
              coverPage: 'Mock Cluster DPR',
              sections: {},
            },
            generatedAt: new Date(),
            status: 'draft',
          },
        });
      }
    );
    this.invalidateDpr(result?.data?.dprId || result?.data?._id || result?.dprId);
    return result;
  }

  async getClusterDPR(dprId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/cluster/${dprId}`);
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: true,
          data: {
            content: {},
            metadata: {},
          },
        });
      }
    );
  }

  async saveClusterDPRDraft(clusterData: any) {
    const result = await this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/draft/save', {
          clusterData,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to save draft' })
    );
    this.invalidateDpr(result?.data?.dprId || result?.data?._id || clusterData?.dprId);
    return result;
  }

  async saveClusterDPREnhancedContent(dprId: string, enhancedContent: Record<string, string>, language: string = 'english') {
    const result = await this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/enhanced-content`, {
          enhancedContent,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to save enhanced content' })
    );
    this.invalidateDpr(dprId);
    return result;
  }

  async storeClusterDPRGeneratedSections(dprId: string, generatedSections: Record<string, string>, language: string = 'english') {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/generated-sections`, {
          generatedSections,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to store generated sections' })
    );
  }

  async applyClusterDPRGeneratedSection(dprId: string, sectionName: string, language: string = 'english') {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/apply-generated-section`, {
          sectionName,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to apply generated section' })
    );
  }

  async applyClusterDPREnhancedContent(dprId: string, sectionName: string, language: string = 'english') {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/apply-enhanced-content`, {
          sectionName,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to apply enhanced content' })
    );
  }

  async regenerateClusterDPRSection(
    dprId: string,
    sectionName: string,
    instruction: string,
    mode: 'generated' | 'enhanced' = 'generated',
    language: string = 'english'
  ) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/sections/regenerate`, {
          sectionName,
          instruction,
          mode,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to regenerate section' })
    );
  }

  async enhanceAndApplyAllSections(dprId: string, sections: Array<{ name: string; data: any }>, language: string = 'english') {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/cluster/${dprId}/enhance-and-apply-all`, {
          sections,
          language,
        });
        return response.data;
      },
      () => Promise.resolve({ success: false, message: 'Failed to enhance and apply sections' })
    );
  }

  // Image generation and upload for Cluster DPR
  async generateClusterDPRImage(prompt: string, sectionType: string, sectionInfo: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/images/generate', {
          prompt,
          sectionType,
          sectionInfo,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Image generation failed',
        });
      }
    );
  }

  async getClusterFileBlob(fileId: string) {
    const response = await this.client.get(`/dpr/cluster/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  /** Stops a bad file on the device with a clear message; the server checks again. */
  private async guardFile(file: File, accepted: UploadKind[]): Promise<void> {
    const verdict = await checkUploadFile(file, accepted);
    if (!verdict.ok) {
      const message = translateNow(verdict.reason);
      toast.error(message);
      throw new Error(message);
    }
  }

  async uploadClusterDPRImage(file: File) {
    await this.guardFile(file, ['image']);
    return this.handleRequest(
      async () => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await this.client.post('/dpr/cluster/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Image upload failed',
        });
      }
    );
  }

  async enhanceClusterDPRSection(sectionName: string, sectionData: any, clusterData: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/sections/enhance', {
          sectionName,
          sectionData,
          clusterData,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Section enhancement failed',
        });
      }
    );
  }

  async getAISuggestionsForClusterStep(currentStep: number, currentStepData: any, previousStepsData: Record<string, any>, excludeFields?: string[]) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/ai/suggestions', {
          currentStep,
          currentStepData,
          previousStepsData,
          excludeFields: excludeFields || [],
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'AI suggestions failed',
          data: { suggestions: [] },
        });
      }
    );
  }

  async getAIFieldSuggestion(fieldName: string, fieldValue: any, context: Record<string, any>) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/ai/field-suggestion', {
          fieldName,
          fieldValue,
          context,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Field suggestion failed',
        });
      }
    );
  }

  async improveFieldText(fieldName: string, fieldValue: string, context: Record<string, any> = {}) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/ai/improve-field', {
          fieldName,
          fieldValue,
          context,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Field improve failed',
        });
      }
    );
  }

  async matchBusinessSkill(text: string, skills: string[], context: Record<string, any> = {}) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/ai/match-skill', {
          text,
          skills,
          context,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Skill match failed',
        });
      }
    );
  }

  async generateFieldContent(
    fieldName: string,
    currentStep: number,
    currentStepData: any,
    previousStepsData: Record<string, any>,
    suggestion: string
  ) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/ai/generate-field-content', {
          fieldName,
          currentStep,
          currentStepData,
          previousStepsData,
          suggestion,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Field content generation failed',
        });
      }
    );
  }

  async deleteClusterDPRImage(imageUrl: string, cloudinaryPublicId?: string) {
    return this.handleRequest(
      async () => {
        const fileId = imageUrl?.startsWith('file:') ? imageUrl.slice(5) : undefined;
        const response = await this.client.delete('/dpr/cluster/images/delete', {
          data: {
            imageUrl,
            publicId: cloudinaryPublicId,
            fileId,
          },
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Image deletion failed',
        });
      }
    );
  }

  async uploadClusterDPRDocument(file: File) {
    await this.guardFile(file, ['document', 'image', 'text']);
    return this.handleRequest(
      async () => {
        const formData = new FormData();
        formData.append('document', file);
        const response = await this.client.post('/dpr/cluster/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Document upload failed',
        });
      }
    );
  }

  async updateAnnexureDocument(projectId: string, documentType: string, documentUrl: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/annexures/update', {
          projectId,
          documentType,
          documentUrl,
        });
        return response.data;
      },
      () => {
        return Promise.resolve({
          success: false,
          message: 'Failed to update annexure document',
        });
      }
    );
  }

  async generateFinancialStatements(projectData: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/dpr/cluster/financial-statements/generate', {
          projectData,
        });
        return response.data;
      },
      () => {
        // Mock fallback - return basic structure
        return Promise.resolve({
          success: true,
          data: {
            costOfProject: projectData?.step12?.totalProjectCost || 0,
            spvShare: projectData?.step13?.spvContribution || 0,
            stateGovtGrant: projectData?.step13?.governmentGrant || 0,
            bankLoan: projectData?.step13?.bankLoan || 0,
            workingCapital: {
              rawMaterials: (projectData?.step12?.workingCapitalMargin || 0) * 0.4,
              workInProgress: (projectData?.step12?.workingCapitalMargin || 0) * 0.2,
              finishedGoods: (projectData?.step12?.workingCapitalMargin || 0) * 0.2,
              debtors: (projectData?.step12?.workingCapitalMargin || 0) * 0.15,
              cashBankBalance: (projectData?.step12?.workingCapitalMargin || 0) * 0.05,
              creditors: (projectData?.step12?.workingCapitalMargin || 0) * 0.3,
            },
          },
        });
      }
    );
  }

  async getUserDPRs() {
    const cacheKey = this.getCacheKey('GET', '/dpr/user/list');
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/dpr/user/list');
        return response.data;
      },
      () => MockDataService.getUserDPRs(),
      cacheKey,
      this.CACHE_TTL.dprs
    );
  }

  async deleteDPR(dprId: string) {
    this.clearCache('/dpr');
    this.clearCache('/projects');
    const response = await this.client.delete(`/dpr/${dprId}`);
    return response.data;
  }

  async uploadDPR(file: File) {
    await this.guardFile(file, ['document', 'text']);
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Uploading file:', file.name, file.type, file.size, 'bytes');
    console.log('FormData entries:', Array.from(formData.entries()).map(([key, value]) => [key, value instanceof File ? `${value.name} (${value.size} bytes)` : value]));
    
    // Axios will automatically set Content-Type with boundary for FormData
    const response = await this.client.post('/dpr/upload', formData, {
      timeout: 300000, // 5 minutes timeout for large file uploads and AI processing
    });
    return response.data;
  }

  // Scheme endpoints
  async getSchemes() {
    const cacheKey = this.getCacheKey('GET', '/schemes');
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/schemes');
        return response.data;
      },
      () => MockDataService.getSchemes(),
      cacheKey,
      this.CACHE_TTL.schemes
    );
  }

  async getScheme(schemeCode: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/schemes/${schemeCode}`);
        return response.data;
      },
      async () => {
        const schemes = await MockDataService.getSchemes();
        return schemes.data.schemes.find((s: any) => s.schemeCode === schemeCode) || schemes.data.schemes[0];
      }
    );
  }

  async recommendSchemes(projectId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/schemes/recommend/${projectId}`);
        return response.data;
      },
      () => MockDataService.recommendSchemes(projectId)
    );
  }

  async selectScheme(projectId: string, schemeCode: string) {
    const response = await this.client.post(`/schemes/select/${projectId}/${schemeCode}`);
    return response.data;
  }

  // Feedback endpoints
  async submitFeedback(projectId: string, data: any) {
    const response = await this.client.post(`/feedback/${projectId}`, data);
    return response.data;
  }

  async getProjectFeedback(projectId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/feedback/${projectId}`);
        return response.data;
      },
      () => MockDataService.getProjectFeedback(projectId)
    );
  }

  // AI endpoints
  async ventureMatchHelp(payload: {
    questionId: string;
    optionIds: string[];
    optionLabels: Record<string, string>;
    questionTitle: string;
    questionLabel: string;
    answersSoFar: Record<string, unknown>;
    messages: { role: 'user' | 'assistant'; content: string }[];
    language: 'en' | 'te';
    apGuideNotes?: string;
    clarifyingScript?: Array<{
      id: string;
      prompt: string;
      replies: Array<{ id: string; label: string }>;
    }>;
  }) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/ai/venture-match/help', payload);
        return response.data;
      },
      async () => ({
        success: true,
        data: {
          mode: 'ask',
          assistantMessage:
            payload.language === 'te'
              ? 'మీ పరిస్థితి ఒక వాక్యంలో చెప్పండి. నేను సరైన ఎంపిక చూపిస్తాను.'
              : 'Tell me your situation in one sentence. I will point to the right choice.',
          suggestedUserReplies:
            payload.language === 'te'
              ? ['నాకు తెలియదు', 'సహాయం చేయండి']
              : ['I am not sure', 'Help me pick'],
        },
      })
    );
  }

  async chat(
    message: string,
    conversationHistory: any[] = [],
    userContext?: any,
    useRAG: boolean = false,
    vectorStoreIds?: string[],
    language?: 'en' | 'te'
  ) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/ai/chat', {
          message,
          conversationHistory,
          userContext,
          useRAG,
          vectorStoreIds,
          language
        });
        return response.data;
      },
      async () => {
        // Mock data service returns the data structure directly
        const mockResponse = await MockDataService.chat(message, conversationHistory);
        // Ensure it matches the API response format: { data: { response: ..., suggestions: ... } }
        return mockResponse;
      }
    );
  }

  async transcribeAudio(audioFile: File, language?: 'en' | 'te') {
    await this.guardFile(audioFile, ['audio']);
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (language) {
      formData.append('language', language);
    }
    
    const response = await this.client.post('/ai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async textToSpeech(text: string, language?: 'en' | 'te', voice?: string) {
    const response = await this.client.post('/ai/tts', {
      text,
      language: language || 'en',
      voice: voice || 'alloy',
    }, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Admin endpoints
  async getAnalytics() {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/admin/analytics');
        return response.data;
      },
      () => MockDataService.getAnalytics()
    );
  }

  async getAllUsers(params?: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/admin/users', { params });
        return response.data;
      },
      () => MockDataService.getAllUsers(params)
    );
  }

  async getAllProjects(params?: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/admin/projects', { params });
        return response.data;
      },
      () => MockDataService.getAllProjects(params)
    );
  }

  async getAllFeedback(params?: any) {
    const response = await this.client.get('/admin/feedback', { params });
    return response.data;
  }

  // DPR Analytics endpoints
  async getDPRAnalytics(projectId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/analytics/${projectId}`);
        return response.data;
      },
      () => MockDataService.getDPRAnalytics(projectId)
    );
  }

  async downloadDPRAnalyticsReport(projectId: string) {
    const response = await this.client.get(`/dpr/analytics/${projectId}/report`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // AP MSME integration endpoints
  async getAPMSMESchemes() {
    const response = await this.client.get('/apmsme/schemes');
    return response.data;
  }

  async getSectorGuidelines(sector: string) {
    const response = await this.client.get(`/apmsme/guidelines/${sector}`);
    return response.data;
  }

  async getFinancialInstitutions() {
    const response = await this.client.get('/apmsme/financial-institutions');
    return response.data;
  }

  async submitDPRToAPMSME(projectId: string, dprId: string, data: any) {
    const response = await this.client.post(`/apmsme/submit/${projectId}/${dprId}`, data);
    return response.data;
  }

  async checkDPRStatus(dprId: string) {
    const response = await this.client.get(`/apmsme/status/${dprId}`);
    return response.data;
  }

  // Document management endpoints
  async uploadDocument(file: File, metadata: any) {
    await this.guardFile(file, ['document', 'text']);
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    const response = await this.client.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocuments(params?: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/documents', { params });
        return response.data;
      },
      () => MockDataService.getDocuments(params)
    );
  }

  async getDocument(documentId: string) {
    const response = await this.client.get(`/documents/${documentId}`);
    return response.data;
  }

  async deleteDocument(documentId: string) {
    const response = await this.client.delete(`/documents/${documentId}`);
    return response.data;
  }

  async getVectorStores() {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/documents/vector-stores/list');
        return response.data;
      },
      async () => {
        // Mock vector stores response
        return {
          data: [
            {
              _id: 'mock-vector-store-1',
              openaiVectorStoreId: import.meta.env.VITE_MAIN_VECTOR_STORE_ID || 'vs_mock123',
              name: 'MSME Knowledge Base',
              description: 'Main knowledge base for MSME DPR assistance',
              fileCount: 0,
              totalSize: 0,
              status: 'ready',
              createdBy: { name: 'System', email: 'system@msme-dpr.com' },
              metadata: {
                isDefault: true,
                purpose: 'dpr-assistance',
                category: 'general'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };
      }
    );
  }

  async createVectorStore(data: any) {
    const response = await this.client.post('/documents/vector-stores/create', data);
    return response.data;
  }

  async deleteVectorStore(vectorStoreId: string) {
    const response = await this.client.delete(`/documents/vector-stores/${vectorStoreId}`);
    return response.data;
  }

  async searchDocuments(query: string, vectorStoreIds?: string[], maxResults?: number) {
    const response = await this.client.post('/documents/search', {
      query,
      vectorStoreIds,
      maxResults
    });
    return response.data;
  }

  async queryWithRAG(question: string, vectorStoreIds: string[], model?: string) {
    const response = await this.client.post('/documents/rag/query', {
      question,
      vectorStoreIds,
      model
    });
    return response.data;
  }

  // Admin DPR management endpoints
  async getAllDPRsAdmin(params?: any) {
    const cacheKey = this.getCacheKey('GET', '/admin/dprs', params);
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/admin/dprs', { params });
        return response.data;
      },
      () => MockDataService.getAllDPRsAdmin(params),
      cacheKey,
      this.CACHE_TTL.dprs
    );
  }

  async approveDPR(dprId: string, comments?: string) {
    const response = await this.client.post(`/admin/dprs/${dprId}/approve`, { comments });
    return response.data;
  }

  async rejectDPR(dprId: string, reason: string) {
    const response = await this.client.post(`/admin/dprs/${dprId}/reject`, { reason });
    return response.data;
  }

  // Admin user management endpoints
  async getReviewSummary() {
    const response = await this.client.get('/reviewer/summary');
    return response.data;
  }

  async getReviewQueue(params: { status?: string; district?: string } = {}) {
    const response = await this.client.get('/reviewer/dprs', { params });
    return response.data;
  }

  async reviewDPR(dprId: string, decision: 'approve' | 'reject', remarks?: string) {
    const response = await this.client.post(`/reviewer/dprs/${dprId}/review`, { decision, remarks });
    return response.data;
  }

  async inviteUser(data: { name: string; email: string; role: string; reviewDistrict?: string }) {
    const response = await this.client.post('/admin/users/invite', data);
    return response.data;
  }

  async deactivateUser(userId: string, reason: string) {
    const response = await this.client.post(`/admin/users/${userId}/deactivate`, { reason });
    return response.data;
  }

  async reactivateUser(userId: string) {
    const response = await this.client.post(`/admin/users/${userId}/reactivate`);
    return response.data;
  }

  async revokeUserSessions(userId: string) {
    const response = await this.client.post(`/admin/users/${userId}/revoke-sessions`);
    return response.data;
  }

  async verifyAuditLog() {
    const response = await this.client.get('/admin/audit/verify');
    return response.data;
  }

  async getAiStatus() {
    const response = await this.client.get('/admin/ai/status');
    return response.data;
  }

  async getInvite(token: string) {
    const response = await this.client.get(`/auth/invite/${encodeURIComponent(token)}`);
    return response.data;
  }

  async acceptInvite(data: Record<string, unknown>) {
    const response = await this.client.post('/auth/accept-invite', data);
    return response.data;
  }

  async updateUserAdmin(userId: string, data: any) {
    const response = await this.client.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUserAdmin(userId: string) {
    const response = await this.client.delete(`/admin/users/${userId}`);
    return response.data;
  }

  // Admin policy management endpoints
  async getAllPolicies(params?: any) {
    const response = await this.client.get('/admin/policies', { params });
    return response.data;
  }

  async createPolicy(data: any) {
    const response = await this.client.post('/admin/policies', data);
    return response.data;
  }

  async updatePolicy(policyId: string, data: any) {
    const response = await this.client.put(`/admin/policies/${policyId}`, data);
    return response.data;
  }

  async deletePolicy(policyId: string) {
    const response = await this.client.delete(`/admin/policies/${policyId}`);
    return response.data;
  }

  async approvePolicy(policyId: string) {
    const response = await this.client.post(`/admin/policies/${policyId}/approve`);
    return response.data;
  }
}

export const api = new APIClient();

