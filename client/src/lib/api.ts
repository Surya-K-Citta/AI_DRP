// @ts-nocheck
import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { MockDataService } from './mockData';
import { OfflineDetector } from './offlineDetector';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true' || false;

class APIClient {
  private client: AxiosInstance;
  private useMockData: boolean = USE_MOCK_DATA;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
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
        // Check if it's a network error and we should use mock data
        const isNetworkError = OfflineDetector.isNetworkError(error) || !OfflineDetector.getStatus();
        
        if (isNetworkError && this.useMockData) {
          console.log('🌐 Network error detected, using mock data');
          // Don't reject, let the method handle mock data
          return Promise.reject({ ...error, useMockData: true });
        }

        // Don't show toast for connection errors here - let the calling code handle it
        // This prevents duplicate error messages
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
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
    mockRequest: () => Promise<T>
  ): Promise<T> {
    // CRITICAL: Check offline status FIRST using synchronous navigator check
    // This ensures we don't even attempt API calls when offline
    const navigatorOffline = !navigator.onLine;
    const detectorOffline = !OfflineDetector.getStatus();
    const isOffline = navigatorOffline || detectorOffline;
    const shouldUseMock = this.useMockData || isOffline;
    
    if (shouldUseMock) {
      console.log(`📦 Using mock data immediately (navigator.offline: ${navigatorOffline}, detector.offline: ${detectorOffline}, forced: ${this.useMockData})`);
      try {
        const result = await mockRequest();
        console.log('✅ Mock data returned successfully');
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
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/auth/register', data);
        return response.data;
      },
      () => MockDataService.register(data)
    );
  }

  async login(email: string, password: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/auth/login', { email, password });
        return response.data;
      },
      () => MockDataService.login(email, password)
    );
  }

  async getProfile() {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/auth/profile');
        return response.data;
      },
      () => MockDataService.getProfile()
    );
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  // Project endpoints
  async createProject(data: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.post('/projects', data);
        return response.data;
      },
      () => MockDataService.createProject(data)
    );
  }

  async getProjects(params?: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/projects', { params });
        return response.data;
      },
      () => MockDataService.getProjects(params)
    );
  }

  async getProject(id: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/projects/${id}`);
        return response.data;
      },
      () => MockDataService.getProject(id)
    );
  }

  async updateProject(id: string, data: any) {
    return this.handleRequest(
      async () => {
        const response = await this.client.put(`/projects/${id}`, data);
        return response.data;
      },
      () => MockDataService.updateProject(id, data)
    );
  }

  async deleteProject(id: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.delete(`/projects/${id}`);
        return response.data;
      },
      () => MockDataService.deleteProject(id)
    );
  }

  // DPR endpoints
  async generateDPR(projectId: string, language: string = 'bilingual') {
    return this.handleRequest(
      async () => {
        const response = await this.client.post(`/dpr/generate/${projectId}`, { language });
        return response.data;
      },
      () => MockDataService.generateDPR(projectId, language)
    );
  }

  async getDPR(dprId: string) {
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/${dprId}`);
        return response.data;
      },
      () => MockDataService.getDPR(dprId)
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
  async generateDPRFromChat(responses: any, language: string = 'english') {
    const response = await this.client.post('/dpr/generate-from-chat', { responses, language });
    return response.data;
  }

  async downloadPDF(dprId: string, language: string = 'english') {
    const response = await this.client.get(`/dpr/${dprId}/download/pdf`, {
      params: { language },
      responseType: 'blob',
    });
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
    return this.handleRequest(
      async () => {
        const response = await this.client.get(`/dpr/${dprId}/quality`);
        return response.data;
      },
      () => MockDataService.analyzeDPRQuality(dprId)
    );
  }

  async updateDPRContent(dprId: string, content: any, language: string) {
    const response = await this.client.put(`/dpr/${dprId}/content`, { content, language });
    return response.data;
  }

  async submitDPR(dprId: string, submittedTo: string = 'admin') {
    const response = await this.client.post(`/dpr/${dprId}/submit`, { submittedTo });
    return response.data;
  }

  async translateToTelugu(dprId: string) {
    const response = await this.client.post(`/dpr/${dprId}/translate/telugu`);
    return response.data;
  }

  async getUserDPRs() {
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/dpr/user/list');
        return response.data;
      },
      () => MockDataService.getUserDPRs()
    );
  }

  async uploadDPR(file: File) {
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
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/schemes');
        return response.data;
      },
      () => MockDataService.getSchemes()
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
    const response = await this.client.get('/documents/vector-stores/list');
    return response.data;
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
    return this.handleRequest(
      async () => {
        const response = await this.client.get('/admin/dprs', { params });
        return response.data;
      },
      () => MockDataService.getAllDPRsAdmin(params)
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

