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
  async chat(message: string, conversationHistory: any[] = []) {
    const response = await this.client.post('/ai/chat', { message, conversationHistory });
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
}

export const api = new APIClient();

