import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Upload,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Plus,
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';

interface Document {
  _id: string;
  name: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadedBy: {
    name: string;
    email: string;
  };
  uploadedAt: string;
  metadata: {
    description?: string;
    category?: string;
    tags?: string[];
    isTemplate?: boolean;
    templateType?: string;
  };
  chunkCount?: number;
  error?: string;
}

interface VectorStore {
  _id: string;
  openaiVectorStoreId: string;
  name: string;
  description?: string;
  fileCount: number;
  totalSize: number;
  status: 'creating' | 'ready' | 'error';
  metadata: {
    isDefault?: boolean;
    category?: string;
    purpose?: string;
  };
}

export const AdminDocuments: React.FC = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vectorStores, setVectorStores] = useState<VectorStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    description: '',
    category: '',
    tags: '',
    isTemplate: false,
    templateType: 'other'
  });

  useEffect(() => {
    loadDocuments();
    loadVectorStores();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.getDocuments({
        search: searchTerm,
        status: filterStatus,
        category: filterCategory
      });
      setDocuments(response.data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVectorStores = async () => {
    try {
      const response = await api.getVectorStores();
      setVectorStores(response.data);
    } catch (error) {
      console.error('Failed to load vector stores');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        ...uploadMetadata,
        tags: uploadMetadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      await api.uploadDocument(selectedFile, metadata);

      toast.success('Document uploaded successfully! Processing for RAG...');
      setSelectedFile(null);
      setUploadMetadata({
        description: '',
        category: '',
        tags: '',
        isTemplate: false,
        templateType: 'other'
      });

      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleCreateVectorStore = async () => {
    try {
      // Show info about the main vector store
      const mainVectorStoreId = import.meta.env.VITE_MAIN_VECTOR_STORE_ID;
      toast.info(`Note: The system uses a dedicated MSME Knowledge Base (${mainVectorStoreId}) for all document processing. Vector store creation is disabled.`);

      // You can still call the API to get info about the main vector store
      await api.createVectorStore({
        name: 'MSME Knowledge Base',
        description: 'Main knowledge base for MSME DPR assistance',
        category: 'general',
        purpose: 'dpr-assistance'
      });

      loadVectorStores();
    } catch (error) {
      toast.error('Vector store creation disabled - using dedicated MSME knowledge base');
    }
  };

  const handleDeleteVectorStore = async (vectorStore: VectorStore) => {
    // Prevent deletion of the main MSME vector store
    const mainVectorStoreId = import.meta.env.VITE_MAIN_VECTOR_STORE_ID;
    if (vectorStore.openaiVectorStoreId === mainVectorStoreId) {
      toast.error('Cannot delete the main MSME Knowledge Base vector store');
      return;
    }

    if (!confirm(`Are you sure you want to delete vector store "${vectorStore.name}"? This will also remove all associated documents.`)) {
      return;
    }

    try {
      await api.deleteVectorStore(vectorStore.openaiVectorStoreId);
      toast.success('Vector store deleted successfully');
      loadVectorStores();
      loadDocuments();
    } catch (error) {
      toast.error('Failed to delete vector store');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.metadata.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || doc.status === filterStatus;
    const matchesCategory = !filterCategory || doc.metadata.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Document Management & RAG</h1>
            <p className="text-muted-foreground mt-2">
              Upload documents and manage knowledge base for AI-powered responses
            </p>
          </div>
          <Button onClick={handleCreateVectorStore} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            View Main Vector Store
          </Button>
        </div>

        {/* Vector Stores Overview */}
        <div className="space-y-4">
          {/* <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vector Stores</h2>
            <div className="text-sm text-muted-foreground">
              Main Knowledge Base: <code className="bg-gray-100 px-2 py-1 rounded"> </code>
            </div>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vectorStores.map((store) => {
              const mainVectorStoreId = import.meta.env.VITE_MAIN_VECTOR_STORE_ID;
              const isMainStore = store.openaiVectorStoreId === mainVectorStoreId;
              return (
                <Card key={store._id} className={isMainStore ? 'border-blue-200 bg-blue-50/50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {store.name}
                        {isMainStore && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                            Primary
                          </span>
                        )}
                      </CardTitle>
                      {!isMainStore && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVectorStore(store)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Files:</span>
                        <span className="font-medium">{store.fileCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatFileSize(store.totalSize)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                          {store.status}
                        </span>
                      </div>
                      {/* <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">ID:</span>
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {store.openaiVectorStoreId}
                        </code>
                      </div> */}
                      {store.metadata.isDefault && (
                        <div className="text-xs text-blue-600 font-medium">Default Store</div>
                      )}
                      {isMainStore && (
                        <div className="text-xs text-green-600 font-medium">
                          📚 All new documents are automatically added here
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {vectorStores.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Vector Stores Found</h3>
                  <p className="text-muted-foreground mb-4">
                    The system will automatically connect to the main MSME Knowledge Base.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Vector Store ID: <code className="bg-gray-100 px-2 py-1 rounded">{import.meta.env.VITE_MAIN_VECTOR_STORE_ID}</code>
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select File</label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md,.rtf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX, TXT, MD, RTF (max 50MB)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={uploadMetadata.description}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the document"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={uploadMetadata.category}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    <option value="dpr-templates">DPR Templates</option>
                    <option value="government-schemes">Government Schemes</option>
                    <option value="guidelines">Guidelines</option>
                    <option value="policies">Policies</option>
                    <option value="industry-reports">Industry Reports</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  <Input
                    value={uploadMetadata.tags}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Template Type</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={uploadMetadata.templateType}
                    onChange={(e) => setUploadMetadata(prev => ({ ...prev, templateType: e.target.value }))}
                  >
                    <option value="other">Other</option>
                    <option value="dpr">DPR Template</option>
                    <option value="scheme">Scheme Template</option>
                    <option value="guidelines">Guidelines</option>
                    <option value="policy">Policy Document</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isTemplate"
                  checked={uploadMetadata.isTemplate}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, isTemplate: e.target.checked }))}
                />
                <label htmlFor="isTemplate" className="text-sm">This is a template document</label>
              </div>

              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Document Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ready">Ready</option>
                <option value="processing">Processing</option>
                <option value="error">Error</option>
                <option value="uploading">Uploading</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="dpr-templates">DPR Templates</option>
                <option value="government-schemes">Government Schemes</option>
                <option value="guidelines">Guidelines</option>
                <option value="policies">Policies</option>
                <option value="industry-reports">Industry Reports</option>
                <option value="other">Other</option>
              </select>
              <Button onClick={loadDocuments} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Uploaded Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus || filterCategory
                    ? 'No documents match your search criteria.'
                    : 'Upload your first document to get started with RAG-powered AI.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((document) => (
                  <div key={document._id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{document.originalName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                            {document.status}
                          </span>
                          {getStatusIcon(document.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {document.metadata.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Size: {formatFileSize(document.fileSize)}</span>
                          <span>Type: {document.mimeType}</span>
                          <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                          <span>By: {document.uploadedBy.name}</span>
                          {document.metadata.category && (
                            <span>Category: {document.metadata.category}</span>
                          )}
                        </div>
                        {document.metadata.tags && document.metadata.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {document.metadata.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {document.error && (
                          <div className="mt-2 p-2 bg-red-50 text-red-800 rounded text-sm">
                            Error: {document.error}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocument(document._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
