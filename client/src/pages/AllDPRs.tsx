// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';
import { useDPRStore } from '@/store/dprStore';
import { 
  FileText, 
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Upload,
  Loader2,
  XCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface DPR {
  _id: string;
  projectId: any;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected';
  qualityScore?: number;
  generatedAt?: Date;
  createdAt?: Date;
  content?: any;
}

type SortField = 'date' | 'status' | 'quality' | 'name';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'all' | 'draft' | 'submitted' | 'approved' | 'rejected';

export const AllDPRs: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { dprs: cachedDPRs, setDPRs, isStale } = useDPRStore();
  const [dprs, setDprs] = useState<DPR[]>(cachedDPRs);
  const [filteredDprs, setFilteredDprs] = useState<DPR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDPRs();
  }, []);

  useEffect(() => {
    filterAndSortDPRs();
  }, [dprs, searchQuery, statusFilter, sortField, sortOrder]);

  const loadDPRs = async () => {
    // Use cached data if available and not stale
    if (cachedDPRs.length > 0 && !isStale()) {
      console.log('📦 Using cached DPRs data');
      setDprs(cachedDPRs);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = isAdmin 
        ? await api.getAllDPRsAdmin({ limit: 100 })
        : await api.getUserDPRs();
      
      // Handle different response structures (API vs mock data)
      let dprsData: DPR[] = [];
      if (isAdmin) {
        // Admin response: { data: { dprs: [...], total: ... } } or { dprs: [...], total: ... }
        if (response.data?.dprs) {
          dprsData = Array.isArray(response.data.dprs) ? response.data.dprs : [];
        } else if (Array.isArray(response.data)) {
          dprsData = response.data;
        } else if (Array.isArray(response.dprs)) {
          dprsData = response.dprs;
        }
      } else {
        // User response: { data: { dprs: [...], total: ... } } or { dprs: [...], total: ... } or [...]
        if (response.data?.dprs) {
          dprsData = Array.isArray(response.data.dprs) ? response.data.dprs : [];
        } else if (Array.isArray(response.data)) {
          dprsData = response.data;
        } else if (Array.isArray(response.dprs)) {
          dprsData = response.dprs;
        } else if (Array.isArray(response)) {
          dprsData = response;
        }
      }
      
      // Ensure dprsData is always an array
      if (!Array.isArray(dprsData)) {
        console.warn('DPRs data is not an array:', dprsData);
        dprsData = [];
      }
      
      setDprs(dprsData);
      setDPRs(dprsData); // Update store
    } catch (error: any) {
      console.error('Failed to load DPRs:', error);
      
      // Check if it's a connection error
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.', {
          duration: 5000,
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to load DPRs');
      }
      // Set empty array on error to prevent iteration errors
      setDprs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDPR = async (dprId: string) => {
    try {
      await api.approveDPR(dprId);
      toast.success('DPR approved successfully');
      loadDPRs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve DPR');
    }
  };

  const handleRejectDPR = async (dprId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.rejectDPR(dprId, reason);
      toast.success('DPR rejected successfully');
      loadDPRs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject DPR');
    }
  };

  const filterAndSortDPRs = () => {
    // Ensure dprs is always an array
    if (!Array.isArray(dprs)) {
      setFilteredDprs([]);
      return;
    }
    
    let filtered = [...dprs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((dpr) => {
        const projectName = dpr.projectId?.projectName || '';
        const sector = dpr.projectId?.industrySector || '';
        const status = dpr.status || '';
        return (
          projectName.toLowerCase().includes(query) ||
          sector.toLowerCase().includes(query) ||
          status.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((dpr) => dpr.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          const dateA = new Date(a.generatedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.generatedAt || b.createdAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'status':
          const statusA = a.status || '';
          const statusB = b.status || '';
          comparison = statusA.localeCompare(statusB);
          break;
        case 'quality':
          const qualityA = a.qualityScore || 0;
          const qualityB = b.qualityScore || 0;
          comparison = qualityA - qualityB;
          break;
        case 'name':
          const nameA = a.projectId?.projectName || '';
          const nameB = b.projectId?.projectName || '';
          comparison = nameA.localeCompare(nameB);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDprs(filtered);
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-muted/50 text-muted-foreground';
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success border border-success/20';
      case 'submitted':
        return 'bg-secondary/10 text-secondary border border-secondary/20';
      case 'draft':
        return 'bg-warning/10 text-warning border border-warning/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <FileText className="h-4 w-4" />;
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'submitted':
        return <AlertCircle className="h-4 w-4" />;
      case 'draft':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Not Analyzed';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const handleDownloadPDF = async (dprId: string, language: 'english' | 'telugu' = 'english') => {
    try {
      const response = await api.downloadPDF(dprId, language);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DPR_${dprId}_${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.warn('No file selected');
      return;
    }
    
    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type - check both MIME type and file extension
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(fileExtension) ||
                       file.type === ''; // Some browsers don't report MIME type for .doc files

    if (!isValidType) {
      toast.error('Invalid file type. Please upload PDF, DOC, DOCX, TXT, or MD files.');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadResult(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await api.uploadDPR(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setUploadResult(response.data);
        toast.success('DPR uploaded and analyzed successfully!');
        
        // Reload DPRs list
        await loadDPRs();
        
        // Navigate to the uploaded DPR after a short delay
        setTimeout(() => {
          navigate(`/dpr/view/${response.data.dprId}`);
        }, 2000);
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Check if it's a connection error
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Please make sure the backend server is running on port 5000.', {
          duration: 6000,
        });
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('Upload timeout. The file may be too large or the server is taking too long to process.', {
          duration: 5000,
        });
      } else if (error.response?.status === 400) {
        // Bad Request - likely file validation issue
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            'Invalid file. Please check the file format and try again.';
        toast.error(errorMessage, {
          duration: 5000,
        });
      } else if (error.response?.status === 401) {
        toast.error('Please log in again to upload DPRs.', {
          duration: 5000,
        });
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to upload DPR. Please check the file format and try again.';
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
      setUploadProgress(0);
    } finally {
      setUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading DPRs...</p>
            <p className="text-xs text-muted-foreground mt-2">
              If this takes too long, make sure the backend server is running
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{isAdmin ? t('dprs.dprManagement') : t('dprs.allDPRs')}</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? `${t('dprs.reviewManage')} (${filteredDprs.length} ${filteredDprs.length === 1 ? t('dprs.dpr') : t('dprs.dprs')})`
                : `${t('dprs.viewManage')} (${filteredDprs.length} ${filteredDprs.length === 1 ? t('dprs.dpr') : t('dprs.dprs')})`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload DPR
                </>
              )}
            </Button>
            <Button onClick={() => navigate('/dpr/builder')} className="bg-primary hover:bg-primary/90 text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Create New DPR
            </Button>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploading and analyzing DPR...</span>
                  <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  AI is extracting content, analyzing structure, and calculating quality score...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Result */}
        {uploadResult && !uploading && (
          <Card className="border-2 border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="font-semibold text-lg">DPR Uploaded Successfully!</h3>
                </div>
                
                {uploadResult.qualityAnalysis && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-white border-2 border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Quality Score</span>
                        <span className={`text-2xl font-bold ${getQualityColor(uploadResult.qualityAnalysis.score)}`}>
                          {uploadResult.qualityAnalysis.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getQualityLabel(uploadResult.qualityAnalysis.score)}
                      </p>
                    </div>
                  </div>
                )}

                {uploadResult.suggestions && uploadResult.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">AI Suggestions for Improvement:</h4>
                    <ul className="space-y-2">
                      {uploadResult.suggestions.map((suggestion: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => navigate(`/dpr/view/${uploadResult.dprId}`)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View DPR
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setUploadResult(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project name, sector, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortField(field as SortField);
                    setSortOrder(order as SortOrder);
                  }}
                  className="px-4 py-2 border-2 border-primary/20 rounded-lg focus:outline-none focus:border-primary bg-white"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="quality-desc">Quality (High to Low)</option>
                  <option value="quality-asc">Quality (Low to High)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DPRs List */}
        {filteredDprs.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No DPRs found' : 'No DPRs yet'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first Detailed Project Report to get started'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => navigate('/dpr/builder')} size="lg">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your First DPR
                  </Button>
                )}
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDprs.map((dpr) => (
              <Card
                key={dpr._id}
                className="group hover:shadow-lg transition-all border-2 hover:border-primary/50"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 flex items-start gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-xl">
                            {dpr.projectId?.projectName || 'Untitled Project'}
                          </h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(dpr.status)}`}>
                            {getStatusIcon(dpr.status)}
                            {dpr.status ? (dpr.status.charAt(0).toUpperCase() + dpr.status.slice(1)) : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Sector:</span>
                            {dpr.projectId?.industrySector || 'Unknown'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">  
                            <span className="font-medium">Created:</span>
                            {formatDate(dpr.generatedAt || dpr.createdAt || new Date())}
                          </span>
                          {dpr.qualityScore !== undefined && (
                            <>
                              <span>•</span>
                              <span className={`flex items-center gap-1 font-medium ${getQualityColor(dpr.qualityScore)}`}>
                                <span>Quality:</span>
                                {dpr.qualityScore}/100 ({getQualityLabel(dpr.qualityScore)})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dpr/view/${dpr._id}`)}
                        className="border-2"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(dpr._id, 'english')}
                        className="border-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      {isAdmin && dpr.status === 'submitted' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-success text-success hover:bg-success hover:text-white"
                            onClick={() => handleApproveDPR(dpr._id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
                            onClick={() => handleRejectDPR(dpr._id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

