import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class APIClient {
  private client: AxiosInstance;

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
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = (error.response?.data as any)?.message || 'An error occurred';
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        toast.error(message);
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: any) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/auth/profile', data);
    return response.data;
  }

  // Project endpoints
  async createProject(data: any) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async getProjects(params?: any) {
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProject(id: string) {
    const response = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    const response = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    const response = await this.client.delete(`/projects/${id}`);
    return response.data;
  }

  // DPR endpoints
  async generateDPR(projectId: string, language: string = 'bilingual') {
    const response = await this.client.post(`/dpr/generate/${projectId}`, { language });
    return response.data;
  }

  async getDPR(dprId: string) {
    const response = await this.client.get(`/dpr/${dprId}`);
    return response.data;
  }

  async getProjectDPRs(projectId: string) {
    const response = await this.client.get(`/dpr/project/${projectId}`);
    return response.data;
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
    const response = await this.client.get(`/dpr/${dprId}/quality`);
    return response.data;
  }

  async updateDPRContent(dprId: string, content: any, language: string) {
    const response = await this.client.put(`/dpr/${dprId}/content`, { content, language });
    return response.data;
  }

  async submitDPR(dprId: string, submittedTo: string = 'admin') {
    const response = await this.client.post(`/dpr/${dprId}/submit`, { submittedTo });
    return response.data;
  }

  async getUserDPRs() {
    const response = await this.client.get('/dpr/user/list');
    return response.data;
  }

  // Scheme endpoints
  async getSchemes() {
    const response = await this.client.get('/schemes');
    return response.data;
  }

  async getScheme(schemeCode: string) {
    const response = await this.client.get(`/schemes/${schemeCode}`);
    return response.data;
  }

  async recommendSchemes(projectId: string) {
    const response = await this.client.post(`/schemes/recommend/${projectId}`);
    return response.data;
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
    const response = await this.client.get(`/feedback/${projectId}`);
    return response.data;
  }

  // AI endpoints
  async chat(
    message: string,
    conversationHistory: any[] = [],
    userContext?: any,
    useRAG: boolean = false,
    vectorStoreIds?: string[]
  ) {
    const response = await this.client.post('/ai/chat', {
      message,
      conversationHistory,
      userContext,
      useRAG,
      vectorStoreIds
    });
    return response.data;
  }

  async transcribeAudio(audioFile: File) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await this.client.post('/ai/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Admin endpoints
  async getAnalytics() {
    const response = await this.client.get('/admin/analytics');
    return response.data;
  }

  async getAllUsers(params?: any) {
    const response = await this.client.get('/admin/users', { params });
    return response.data;
  }

  async getAllProjects(params?: any) {
    const response = await this.client.get('/admin/projects', { params });
    return response.data;
  }

  async getAllFeedback(params?: any) {
    const response = await this.client.get('/admin/feedback', { params });
    return response.data;
  }

  // DPR Analytics endpoints
  async getDPRAnalytics(projectId: string) {
    const response = await this.client.get(`/dpr/analytics/${projectId}`);
    return response.data;
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
    const response = await this.client.get('/documents', { params });
    return response.data;
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
}

export const api = new APIClient();

