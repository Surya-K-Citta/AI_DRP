// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { FormattedText } from '@/utils/textFormatter';
import { DPRVisualizations } from './DPRVisualizations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Upload, Sparkles, Loader2, X, Wand2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PDFViewer from '@/components/PDFViewer';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface ClusterDPRDocumentViewProps {
  dpr: any;
  project: any;
  viewLanguage: 'english' | 'telugu';
  onSectionClick?: (stepNumber: number) => void;
}

export const ClusterDPRDocumentView: React.FC<ClusterDPRDocumentViewProps> = ({ dpr, project, viewLanguage, onSectionClick }) => {
  // Extract cluster data from multiple possible locations
  const clusterData =
    dpr.content?.[viewLanguage]?.clusterData ||
    dpr.content?.english?.clusterData ||
    dpr.content?.telugu?.clusterData ||
    dpr.metadata?.clusterData ||
    project?.stepData ||
    {};

  // Use contentRefreshKey to force re-read of content when it changes
  const content = (dpr.content?.[viewLanguage] || dpr.content?.english || {});

  // Debug logging
  console.log('📊 ClusterDPRDocumentView - Data extraction:', {
    clusterData,
    hasClusterData: !!clusterData && Object.keys(clusterData).length > 0,
    clusterDataKeys: Object.keys(clusterData),
    hasContent: !!content && Object.keys(content).length > 0,
    content,
    contentKeys: Object.keys(content),
    hasProjectStepData: !!project?.stepData,
    viewLanguage,
  });

  // Image state management
  const [images, setImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load images from project or DPR content when component mounts or project/DPR changes
  useEffect(() => {
    // First check DPR content for images (from generated DPR)
    const dprImages = content.images || dpr.content?.english?.images || dpr.content?.telugu?.images || {};
    
    // Then check project for images (from preview/generation)
    const projectImages = project?.images || {};
    
    // Merge both sources (DPR content takes precedence)
    const allImages = { ...projectImages, ...dprImages };
    
    if (Object.keys(allImages).length > 0) {
      console.log('📥 Loaded images:', {
        fromDPR: Object.keys(dprImages).length,
        fromProject: Object.keys(projectImages).length,
        total: Object.keys(allImages).length,
        imageIds: Object.keys(allImages)
      });
      setImages(allImages);
    }
  }, [project?._id || project?.id, project?.images, dpr?._id || dpr?.id, content.images]);

  // Enhanced content state management (database only)
  const [enhancedContent, setEnhancedContent] = useState<Record<string, string>>(() => {
    // Load only from DPR content (from backend/database)
    const dprEnhancedContent = content.enhancedContent || dpr.content?.english?.enhancedContent || dpr.content?.telugu?.enhancedContent || {};

    // Return DPR content if available, otherwise empty object
    if (Object.keys(dprEnhancedContent).length > 0) {
      console.log('📥 Loaded enhanced content from database:', Object.keys(dprEnhancedContent).length, 'sections');
      return dprEnhancedContent;
    }

    return {};
  });
  const [enhancingSections, setEnhancingSections] = useState<Record<string, boolean>>({});

  // Generated sections state (for user review before applying)
  const [generatedSections, setGeneratedSections] = useState<Record<string, string>>(() => {
    const dprGeneratedSections = content.generatedSections || dpr.content?.english?.generatedSections || dpr.content?.telugu?.generatedSections || {};
    if (Object.keys(dprGeneratedSections).length > 0) {
      console.log('📥 Loaded generated sections from database:', Object.keys(dprGeneratedSections).length, 'sections');
      return dprGeneratedSections;
    }
    return {};
  });
  const [applyingSections, setApplyingSections] = useState<Record<string, boolean>>({});
  const [regeneratingSections, setRegeneratingSections] = useState<Record<string, boolean>>({});
  const [regenerateInstructions, setRegenerateInstructions] = useState<Record<string, string>>({});
  const [contentRefreshKey, setContentRefreshKey] = useState(0); // Force re-render when content changes
  const [uploadingDocuments, setUploadingDocuments] = useState<Record<string, boolean>>({});
  const annexureFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Handle annexure document upload
  const handleAnnexureUpload = async (documentType: string, file: File) => {
    setUploadingDocuments((prev) => ({ ...prev, [documentType]: true }));
    try {
      // Upload to Cloudinary
      const uploadResult = await api.uploadClusterDPRDocument(file);
      if (uploadResult.success && uploadResult.data?.documentUrl) {
        // Update project step18
        const projectId = project?._id || project?.id;
        if (projectId) {
          await api.updateAnnexureDocument(
            projectId.toString(),
            documentType,
            uploadResult.data.documentUrl
          );

          // Reload DPR to show updated files
          const dprId = dpr?._id || dpr?.id;
          if (dprId) {
            const reloadedDPRResponse = await api.getClusterDPR(dprId);
            if (reloadedDPRResponse.success && reloadedDPRResponse.data) {
              const reloadedDPR = reloadedDPRResponse.data;
              if (dpr) {
                Object.assign(dpr, reloadedDPR);
                if (reloadedDPR.content) {
                  dpr.content = reloadedDPR.content;
                }
                if (reloadedDPR.clusterSections) {
                  dpr.clusterSections = reloadedDPR.clusterSections;
                }
              }
              setContentRefreshKey(prev => prev + 1);
            }
          }

          toast.success(`Document uploaded successfully!`);
        } else {
          toast.error('Project not found');
        }
      } else {
        toast.error(uploadResult.message || 'Failed to upload document');
      }
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploadingDocuments((prev) => ({ ...prev, [documentType]: false }));
    }
  };

  const getCurrentSectionContent = (sectionName: string) => {
    // Prefer ClusterSection applied content (works for subsections too)
    const fromClusterSections = dpr?.clusterSections?.[viewLanguage]?.[sectionName]?.content;
    if (typeof fromClusterSections === 'string' && fromClusterSections.trim()) {
      return fromClusterSections;
    }

    // Fallback to DPRVersion content mapping (main sections)
    const sectionMapping: Record<string, string> = {
      executiveSummary: 'executiveSummary',
      introduction: 'businessProfile',
      districtProfile: 'districtProfile',
      clusterProfile: 'clusterProfile',
      valueChain: 'valueChain',
      marketAspects: 'marketAnalysis',
      gapAnalysis: 'gapAnalysis',
      swotAnalysis: 'swotAnalysis',
      proposedInterventions: 'proposedInterventions',
      cfcDetails: 'technicalFeasibility',
      spvDetails: 'spvDetails',
      projectCost: 'projectCost',
      meansOfFinance: 'meansOfFinance',
      operatingCostRevenue: 'operatingCostRevenue',
      financialViability: 'financialProjections',
      implementationSchedule: 'implementationSchedule',
      expectedImpact: 'conclusion',
      conclusion: 'conclusion',
      annexures: 'annexures',
      projectSnapshot: 'projectSnapshot',
    };

    const contentField = sectionMapping[sectionName] || sectionName;
    const fromContent = content?.[contentField];
    if (typeof fromContent === 'string') return fromContent;
    return '';
  };

  // Reload enhanced content and generated sections when DPR ID or language changes (from database only)
  useEffect(() => {
    // Load only from DPR content (from backend/database)
    const dprEnhancedContent = content.enhancedContent || dpr.content?.english?.enhancedContent || dpr.content?.telugu?.enhancedContent || {};
    const dprGeneratedSections = content.generatedSections || dpr.content?.english?.generatedSections || dpr.content?.telugu?.generatedSections || {};

    // Filter out sections that have been applied (check ClusterSection isApplied flag)
    const filteredEnhancedContent: Record<string, string> = {};
    if (dpr?.clusterSections?.[viewLanguage]) {
      Object.entries(dprEnhancedContent).forEach(([sectionName, content]) => {
        const section = dpr.clusterSections[viewLanguage][sectionName];
        // Only include enhanced content if section exists and is NOT applied
        // If section doesn't exist in clusterSections, include it (might be from DPRVersion)
        if (!section || !section.isApplied) {
          filteredEnhancedContent[sectionName] = content as string;
        }
      });
    } else {
      // Fallback: use all enhanced content if clusterSections not available
      Object.assign(filteredEnhancedContent, dprEnhancedContent);
    }

    if (Object.keys(filteredEnhancedContent).length > 0) {
      console.log('📥 Reloaded enhanced content from database:', Object.keys(filteredEnhancedContent).length, 'sections');
      setEnhancedContent(filteredEnhancedContent);
    } else {
      setEnhancedContent({});
    }

    if (Object.keys(dprGeneratedSections).length > 0) {
      console.log('📥 Reloaded generated sections from database:', Object.keys(dprGeneratedSections).length, 'sections');
      setGeneratedSections(dprGeneratedSections);
    } else {
      setGeneratedSections({});
    }
  }, [dpr?._id || dpr?.id, viewLanguage, content, contentRefreshKey]);

  // Save to database whenever enhancedContent changes (removed localStorage dependency)
  useEffect(() => {
    const dprId = dpr?._id || dpr?.id;
    if (!dprId || Object.keys(enhancedContent).length === 0) {
      return;
    }

    // Debounce database saves (save after 1 second of no changes)
    const timeoutId = setTimeout(async () => {
      try {
        await api.saveClusterDPREnhancedContent(dprId, enhancedContent, viewLanguage);
        console.log('💾 Saved enhanced content to database:', Object.keys(enhancedContent).length, 'sections');
      } catch (error) {
        console.error('Error saving enhanced content to database:', error);
        // Don't show error toast for background saves
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [enhancedContent, dpr?._id || dpr?.id, viewLanguage]);

  // Helper to render A4 page wrapper (21 x 29.7 cm)
  const renderPageWrapper = (children: React.ReactNode, additionalStyles?: React.CSSProperties) => {
    return (
      <div
        className="page-break relative"
        style={{
          width: '21cm',
          minHeight: '29.7cm',
          height: 'auto',
          maxHeight: 'none',
          padding: '2cm',
          margin: '0 auto',
          marginBottom: '1cm',
          pageBreakAfter: 'always',
          pageBreakInside: 'avoid',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative',
          overflow: 'visible',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          ...additionalStyles
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div
          className="relative z-10"
          style={{
            width: '100%',
            minHeight: '100%',
            height: 'auto',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
          }}
        >
          {children}
        </div>
      </div>
    );
  };

  // Map section titles to step numbers for navigation
  const getStepFromSection = (title: string): number | null => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('executive summary') || titleLower.includes('basic cluster')) return 1;
    if (titleLower.includes('introduction') || titleLower.includes('sector overview')) return 2;
    if (titleLower.includes('district') || titleLower.includes('regional profile')) return 3;
    if (titleLower.includes('cluster profile')) return 4;
    if (titleLower.includes('value chain')) return 5;
    if (titleLower.includes('market')) return 6;
    if (titleLower.includes('gap analysis')) return 7;
    if (titleLower.includes('swot')) return 8;
    if (titleLower.includes('proposed intervention')) return 9;
    if (titleLower.includes('cfc') || titleLower.includes('common facility')) return 10;
    if (titleLower.includes('spv')) return 11;
    if (titleLower.includes('project cost')) return 12;
    if (titleLower.includes('means of finance')) return 13;
    if (titleLower.includes('operating cost') || titleLower.includes('revenue')) return 14;
    if (titleLower.includes('financial viability') || titleLower.includes('financial analysis')) return 15;
    if (titleLower.includes('implementation schedule')) return 16;
    if (titleLower.includes('expected impact')) return 17;
    if (titleLower.includes('annexure') || titleLower.includes('document')) return 18;
    return null;
  };

  // Helper to render section title with grey box template (clickable if onSectionClick provided)
  const renderSectionTitle = (title: string, stepNumber?: number) => {
    const step = stepNumber || getStepFromSection(title);
    const isClickable = onSectionClick && step !== null;

    return (
      <div className="mb-6">
        <div
          className={`rounded-lg p-4 mx-auto max-w-2xl ${isClickable ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}`}
          style={{
            backgroundColor: isClickable ? '#EFF6FF' : '#F3F4F6',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
            border: `1px solid ${isClickable ? '#3B82F6' : '#D1D5DB'}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={isClickable ? () => onSectionClick!(step!) : undefined}
          title={isClickable ? `Click to edit Step ${step}` : undefined}
        >
          <h2 className="text-3xl font-bold text-center" style={{ color: '#1F2937' }}>
            {title}
            {isClickable && (
              <span className="ml-2 text-sm text-blue-600 opacity-70">(Click to edit)</span>
            )}
          </h2>
        </div>
      </div>
    );
  };

  // Helper to render professional tables matching PDF format with explanation
  const renderTable = (headers: string[], rows: any[][], title?: string, statementNumber?: string, tableId?: string) => {
    const explanationKey = tableId || `table-${title || 'default'}`;

    return (
      <div className="my-6">
        {title && (
          <div className="mb-3">
            {statementNumber && (
              <p className="text-xs text-gray-600 mb-1 font-semibold">Statement {statementNumber}</p>
            )}
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
            {enhancedContent[`tableExplanation-${explanationKey}`] && (
              <div className="mt-2 p-3">
                <p className="text-xs text-justify leading-relaxed" style={{ color: '#1F2937' }}>
                  {enhancedContent[`tableExplanation-${explanationKey}`]}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 text-sm" style={{ borderColor: '#1F2937' }}>
            <thead>
              <tr style={{ backgroundColor: '#E5E7EB' }}>
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border border-gray-800 px-3 py-2 text-left font-bold text-xs"
                    style={{
                      backgroundColor: '#E5E7EB',
                      borderColor: '#1F2937',
                      color: '#1F2937'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  style={{ backgroundColor: rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}
                >
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="border border-gray-800 px-3 py-2 text-xs"
                      style={{ borderColor: '#1F2937' }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Handle image generation
  const handleGenerateImage = async (imageId: string, prompt: string, sectionType: string, sectionInfo: any) => {
    setGeneratingImages({ ...generatingImages, [imageId]: true });
    try {
      const result = await api.generateClusterDPRImage(prompt, sectionType, sectionInfo);
      if (result.success && result.data?.imageUrl) {
        const imageUrl = result.data.imageUrl;
        setImages({ ...images, [imageId]: imageUrl });
        
        // Save image to project database
        const projectId = project?._id || project?.id;
        if (projectId) {
          try {
            const currentImages = project?.images || {};
            await api.updateProject(projectId, {
              images: {
                ...currentImages,
                [imageId]: imageUrl
              }
            });
            console.log(`💾 Saved image ${imageId} to project database`);
          } catch (saveError) {
            console.error('Error saving image to project:', saveError);
            // Don't show error to user - image is still in state for preview
          }
        }
        
        toast.success('Image generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setGeneratingImages({ ...generatingImages, [imageId]: false });
    }
  };

  // Handle image upload
  const handleUploadImage = async (imageId: string, file: File) => {
    try {
      const result = await api.uploadClusterDPRImage(file);
      if (result.success && result.data?.imageUrl) {
        // Use Cloudinary URL directly (already full URL) or construct local URL
        const imageUrl = result.data.imageUrl.startsWith('http')
          ? result.data.imageUrl
          : (() => {
            const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const serverBaseUrl = apiBaseUrl.replace('/api', '');
            return `${serverBaseUrl}${result.data.imageUrl}`;
          })();

        setImages({ ...images, [imageId]: imageUrl });

        // Store Cloudinary public ID for future deletion if available
        if (result.data.cloudinaryPublicId) {
          console.log('Image uploaded with Cloudinary ID:', result.data.cloudinaryPublicId);
        }

        // Save image to project database
        const projectId = project?._id || project?.id;
        if (projectId) {
          try {
            const currentImages = project?.images || {};
            await api.updateProject(projectId, {
              images: {
                ...currentImages,
                [imageId]: imageUrl
              }
            });
            console.log(`💾 Saved uploaded image ${imageId} to project database`);
          } catch (saveError) {
            console.error('Error saving image to project:', saveError);
            // Don't show error to user - image is still in state for preview
          }
        }

        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.message || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    }
  };

  // Handle image removal
  const handleRemoveImage = async (imageId: string) => {
    const imageUrl = images[imageId];
    if (!imageUrl) {
      return;
    }

    // Check if it's a Cloudinary URL
    const isCloudinaryUrl = imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com');

    if (isCloudinaryUrl) {
      try {
        // Extract public ID from Cloudinary URL
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
          // Extract public ID (format: v1234567890/folder/public_id.ext)
          const publicIdPath = urlParts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');

          // Call API to delete from Cloudinary
          const result = await api.deleteClusterDPRImage(imageUrl, publicIdPath);

          if (result.success) {
            const newImages = { ...images };
            delete newImages[imageId];
            setImages(newImages);
            toast.success('Image removed and deleted from storage');
          } else {
            throw new Error(result.message || 'Failed to delete image');
          }
        } else {
          // Fallback: just remove from UI
          const newImages = { ...images };
          delete newImages[imageId];
          setImages(newImages);
          toast.success('Image removed');
        }
      } catch (error: any) {
        console.error('Error deleting image from Cloudinary:', error);
        toast.error('Failed to delete image from storage, but removed from view');
        // Still remove from UI even if deletion fails
        const newImages = { ...images };
        delete newImages[imageId];
        setImages(newImages);
      }
    } else {
      // Not a Cloudinary URL, just remove from UI
      const newImages = { ...images };
      delete newImages[imageId];
      setImages(newImages);
      toast.success('Image removed');
    }
  };

  // Handle section enhancement (silent mode for batch operations)
  const handleEnhanceSection = async (sectionName: string, sectionData: any, silent: boolean = false) => {
    setEnhancingSections((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const result = await api.enhanceClusterDPRSection(sectionName, sectionData, clusterData);
      if (result.success && result.data?.enhancedParagraph) {
        console.log(`✨ Enhanced section ${sectionName}:`, result.data.enhancedParagraph.substring(0, 100) + '...');

        // Update state first
        const updated = {
          ...enhancedContent,
          [sectionName]: result.data.enhancedParagraph,
        };
        setEnhancedContent(updated);

        // Save directly to database immediately (wait for completion) if DPR exists
        const dprId = dpr?._id || dpr?.id;
        if (dprId) {
          try {
            await api.saveClusterDPREnhancedContent(dprId, updated, viewLanguage);
            console.log(`💾 Saved enhanced content for ${sectionName} to database. Total keys:`, Object.keys(updated).length);
          } catch (error) {
            console.error('Error saving enhanced content to database:', error);
            if (!silent) {
              toast.error('Failed to save to database. Please try again.');
            }
            // Don't throw error - enhanced content is still in state for preview
          }
        } else {
          console.warn('⚠️ No DPR ID found. Enhanced content stored in preview only. It will be saved when DPR is generated.');
          // Don't show error in silent mode, and don't throw - allow preview to work
          if (!silent) {
            console.log('Enhanced content is available in preview. Generate DPR to save it permanently.');
          }
        }

        if (!silent) {
          toast.success('Section enhanced and saved successfully!');
        }
      } else {
        if (!silent) {
          toast.error(result.message || 'Failed to enhance section');
        }
        throw new Error(result.message || 'Failed to enhance section');
      }
    } catch (error: any) {
      console.error('Error enhancing section:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to enhance section');
      }
      throw error;
    } finally {
      setEnhancingSections((prev) => ({ ...prev, [sectionName]: false }));
    }
  };

  // Handle applying generated section
  const handleApplyGeneratedSection = async (sectionName: string) => {
    const dprId = dpr?._id || dpr?.id;
    if (!dprId) {
      toast.error('DPR not found. Please generate DPR first.');
      return;
    }

    setApplyingSections((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const result = await api.applyClusterDPRGeneratedSection(dprId, sectionName, viewLanguage);
      if (result.success) {
        toast.success(`Section "${sectionName}" applied successfully!`);
        // Reload the page or refresh content
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to apply section');
      }
    } catch (error: any) {
      console.error('Error applying generated section:', error);
      toast.error(error.message || 'Failed to apply section');
    } finally {
      setApplyingSections((prev) => ({ ...prev, [sectionName]: false }));
    }
  };

  // Handle applying enhanced content
  const handleApplyEnhancedContent = async (sectionName: string) => {
    let dprId = dpr?._id || dpr?.id;
    const projectId = project?._id || project?.id;
    
    // Try to get DPR ID from project if not available
    if (!dprId && projectId) {
      try {
        const dprsResponse = await api.getProjectDPRs(projectId);
        const dprs = dprsResponse.data || dprsResponse;
        if (Array.isArray(dprs) && dprs.length > 0) {
          const draftDpr = dprs.find((d: any) => d.status === 'draft');
          if (draftDpr) {
            dprId = draftDpr._id || draftDpr.id;
          }
        }
      } catch (error) {
        console.warn('Failed to get DPRs for project:', error);
      }
    }
    
    if (!dprId) {
      toast.error('DPR not found. Please generate DPR first to apply enhanced content permanently.');
      return;
    }

    setApplyingSections((prev) => ({ ...prev, [`enhanced-${sectionName}`]: true }));
    try {
      // Get the enhanced content before applying (in case it gets removed)
      const enhancedContentToApply = enhancedContent[sectionName];

      if (!enhancedContentToApply) {
        toast.error(`No enhanced content found for "${sectionName}". Please enhance the section first.`);
        return;
      }

      // Ensure enhanced content is saved to database before applying
      // This is necessary because the backend expects it to be in the database
      let saveSuccess = false;
      try {
        const contentToSave = {
          [sectionName]: enhancedContentToApply
        };
        const saveResult = await api.saveClusterDPREnhancedContent(dprId, contentToSave, viewLanguage);
        if (saveResult.success) {
          console.log(`💾 Saved enhanced content for ${sectionName} to database before applying`);
          saveSuccess = true;
          // Small delay to ensure database write is complete
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          console.warn('Failed to save enhanced content before applying:', saveResult.message);
          // Continue anyway - might already be saved
        }
      } catch (saveError: any) {
        console.error('Error saving enhanced content before applying:', saveError);
        // Continue anyway - might already be saved from previous enhancement
        console.log('Will attempt to apply anyway - content might already be in database');
      }

      const result = await api.applyClusterDPREnhancedContent(dprId, sectionName, viewLanguage);
      
      if (!result.success) {
        console.error('Failed to apply enhanced content:', {
          sectionName,
          dprId,
          viewLanguage,
          error: result.message,
          hasEnhancedContent: !!enhancedContentToApply,
          enhancedContentLength: enhancedContentToApply?.length
        });
        
        // If the error says content not found, try saving again and retrying
        if (result.message?.includes('not found') && enhancedContentToApply) {
          console.log('Retrying: Saving enhanced content again and retrying apply...');
          try {
            const contentToSave = {
              [sectionName]: enhancedContentToApply
            };
            await api.saveClusterDPREnhancedContent(dprId, contentToSave, viewLanguage);
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Retry applying
            const retryResult = await api.applyClusterDPREnhancedContent(dprId, sectionName, viewLanguage);
            if (retryResult.success && retryResult.data) {
              // Use the same success handling as below
              const appliedContent = retryResult.data.appliedContent || enhancedContentToApply;
              setEnhancedContent((prev) => {
                const updated = { ...prev };
                delete updated[sectionName];
                return updated;
              });
              toast.success(`Enhanced content for "${sectionName}" applied successfully!`);
              setContentRefreshKey(prev => prev + 1);
              return;
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }
      }
      
      if (result.success && result.data) {
        // Use the applied content from the response (full content from database)
        const appliedContent = result.data.appliedContent || enhancedContentToApply;
        const contentField = result.data.contentField || sectionName;

        if (!appliedContent) {
          toast.error('No content to apply');
          return;
        }

        // Immediately remove enhanced content from state since it's now applied
        setEnhancedContent((prev) => {
          const updated = { ...prev };
          delete updated[sectionName];
          return updated;
        });

        // Also clear from DPR content's enhancedContent field
        if (dpr?.content?.[viewLanguage]?.enhancedContent) {
          const updatedEnhanced = { ...dpr.content[viewLanguage].enhancedContent };
          delete updatedEnhanced[sectionName];
          dpr.content[viewLanguage].enhancedContent = updatedEnhanced;
        }
        if (dpr?.content?.english?.enhancedContent) {
          const updatedEnhanced = { ...dpr.content.english.enhancedContent };
          delete updatedEnhanced[sectionName];
          dpr.content.english.enhancedContent = updatedEnhanced;
        }

        toast.success(`Enhanced content for "${sectionName}" applied successfully!`);

        // Reload DPR data from database to ensure we have the latest state with applied content
        try {
          const reloadedDPRResponse = await api.getClusterDPR(dprId);
          if (reloadedDPRResponse.success && reloadedDPRResponse.data) {
            const reloadedDPR = reloadedDPRResponse.data;

            // Update the dpr object with reloaded data (mutating prop since it's passed from parent)
            // This ensures the parent component sees the updated content
            if (dpr) {
              Object.assign(dpr, reloadedDPR);
              // Specifically update content to ensure it's reflected
              if (reloadedDPR.content) {
                dpr.content = reloadedDPR.content;
              }
              // Update clusterSections if available
              if (reloadedDPR.clusterSections) {
                dpr.clusterSections = reloadedDPR.clusterSections;
              }
            }

            // Force re-render by updating refresh key
            setContentRefreshKey(prev => prev + 1);

            console.log(`✅ Reloaded DPR after applying enhanced content for "${sectionName}"`);
          }
        } catch (reloadError) {
          console.error('Failed to reload DPR after applying:', reloadError);
          // Still show success - content is saved in database
          // Force re-render anyway to update UI
          setContentRefreshKey(prev => prev + 1);
        }
      } else {
        toast.error(result.message || 'Failed to apply enhanced content');
      }
    } catch (error: any) {
      console.error('Error applying enhanced content:', error);
      toast.error(error.message || 'Failed to apply enhanced content');
    } finally {
      setApplyingSections((prev) => ({ ...prev, [`enhanced-${sectionName}`]: false }));
    }
  };

  const handleRegenerateSection = async (sectionName: string, mode: 'generated' | 'enhanced') => {
    const dprId = dpr?._id || dpr?.id;
    if (!dprId) {
      toast.error('DPR not found. Please generate DPR first.');
      return;
    }

    const instruction = (regenerateInstructions[sectionName] || '').trim();
    if (!instruction) {
      toast.error('Please enter what you want to change/improve.');
      return;
    }

    setRegeneratingSections((prev) => ({ ...prev, [`${mode}-${sectionName}`]: true }));
    try {
      const result = await api.regenerateClusterDPRSection(dprId, sectionName, instruction, mode, viewLanguage);
      if (result.success && result.data?.candidateContent) {
        const candidate = result.data.candidateContent;

        if (mode === 'enhanced') {
          setEnhancedContent((prev) => ({ ...prev, [sectionName]: candidate }));
        } else {
          setGeneratedSections((prev) => ({ ...prev, [sectionName]: candidate }));
        }

        toast.success('New version generated. Compare and click Apply when ready.');
      } else {
        toast.error(result.message || 'Failed to regenerate section');
      }
    } catch (error: any) {
      console.error('Error regenerating section:', error);
      toast.error(error.message || 'Failed to regenerate section');
    } finally {
      setRegeneratingSections((prev) => ({ ...prev, [`${mode}-${sectionName}`]: false }));
    }
  };

  // Helper to render generated section with Apply button
  const renderGeneratedSection = (sectionName: string, sectionTitle: string) => {
    const generatedText = generatedSections[sectionName];
    if (!generatedText) return null;

    const isApplying = applyingSections[sectionName];
    const isRegenerating = regeneratingSections[`generated-${sectionName}`];
    const currentText = getCurrentSectionContent(sectionName);

    return (
      <div className="mb-6 p-4 border-2 border-blue-300 rounded-lg bg-blue-50/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-blue-800">Generated {sectionTitle}</h4>
          <Button
            onClick={() => handleApplyGeneratedSection(sectionName)}
            disabled={isApplying}
            className="gap-2"
            variant="primary"
            size="sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Apply Section
              </>
            )}
          </Button>
        </div>
        {currentText?.trim() ? (
          <div className="mb-3 p-3 bg-white rounded border border-blue-200">
            <div className="text-xs font-semibold text-blue-700 mb-2">Current (Applied)</div>
            <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
              {currentText}
            </p>
          </div>
        ) : null}
        <div className="p-3 bg-white rounded border border-blue-200 max-h-60 overflow-y-auto">
          <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
            {generatedText}
          </p>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-blue-700 mb-2">What should be improved/expanded?</div>
          <textarea
            className="w-full border border-blue-200 rounded p-2 text-sm"
            rows={3}
            value={regenerateInstructions[sectionName] || ''}
            onChange={(e) => setRegenerateInstructions((prev) => ({ ...prev, [sectionName]: e.target.value }))}
            placeholder="e.g., Add more details, include implementation timeline, clarify costs, improve clarity..."
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => handleRegenerateSection(sectionName, 'generated')}
              disabled={isRegenerating}
              className="gap-2"
              variant="secondary"
              size="sm"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render enhanced content with Apply button
  const renderEnhancedContent = (sectionName: string, sectionTitle?: string) => {
    const hasEnhancedContent = enhancedContent[sectionName];
    if (!hasEnhancedContent) return null;

    const isApplying = applyingSections[`enhanced-${sectionName}`];
    const isRegenerating = regeneratingSections[`enhanced-${sectionName}`];
    const currentText = getCurrentSectionContent(sectionName);

    return (
      <div className="mb-6 p-4 border-2 border-purple-300 rounded-lg bg-purple-50/30">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-purple-800">
            Enhanced {sectionTitle || sectionName}
          </h4>
          <Button
            onClick={() => handleApplyEnhancedContent(sectionName)}
            disabled={isApplying}
            className="gap-2"
            variant="primary"
            size="sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Apply Enhanced
              </>
            )}
          </Button>
        </div>
        {currentText?.trim() ? (
          <div className="mb-3 p-3 bg-white rounded border border-purple-200">
            <div className="text-xs font-semibold text-purple-700 mb-2">Current (Applied)</div>
            <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
              {currentText}
            </p>
          </div>
        ) : null}
        <div className="p-3 bg-white rounded border border-purple-200 max-h-60 overflow-y-auto">
          <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
            {hasEnhancedContent}
          </p>
        </div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-purple-700 mb-2">What should be improved/expanded?</div>
          <textarea
            className="w-full border border-purple-200 rounded p-2 text-sm"
            rows={3}
            value={regenerateInstructions[sectionName] || ''}
            onChange={(e) => setRegenerateInstructions((prev) => ({ ...prev, [sectionName]: e.target.value }))}
            placeholder="e.g., Add more details, refine language, include specific impacts, make it more formal..."
          />
          <div className="mt-2 flex justify-end">
            <Button
              onClick={() => handleRegenerateSection(sectionName, 'enhanced')}
              disabled={isRegenerating}
              className="gap-2"
              variant="secondary"
              size="sm"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Regenerate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render enhanced content for subsections (shows enhanced paragraph if available, otherwise shows original text)
  const renderEnhancedSubsection = (subsectionKey: string, originalText: string | null | undefined) => {
    const hasEnhancedContent = enhancedContent[subsectionKey];
    const displayText = hasEnhancedContent || originalText || 'N/A';

    return (
      <div className="text-justify leading-relaxed">
        {displayText}
      </div>
    );
  };

  // Render image with upload/generate options
  const renderImage = (
    imageId: string,
    src: string,
    alt: string,
    caption?: string,
    sectionType?: string,
    sectionInfo?: any,
    defaultPrompt?: string
  ) => {
    const currentImage = images[imageId] || src;
    const isGenerating = generatingImages[imageId];
    const hasImage = currentImage && currentImage !== '';

    return (
      <div className="my-6 text-center">
        <div className="relative inline-block w-full max-w-2xl">
          {/* Image Preview Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-all ${hasImage
              ? 'border-gray-300 bg-white'
              : 'border-blue-300 bg-blue-50/30'
              }`}
            style={{ minHeight: '300px' }}
          >
            {hasImage ? (
              <>
                <img
                  src={currentImage}
                  alt={alt}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '400px', minHeight: '300px' }}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fallback to placeholder
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=';
                  }}
                />
                {/* Remove button - shown when image is uploaded */}
                <button
                  onClick={() => handleRemoveImage(imageId)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors z-10"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                    <p className="text-sm font-medium text-gray-600">Generating image...</p>
                  </div>
                ) : (
                  <>
                    {/* Image Icon */}
                    <div className="mb-4">
                      <svg
                        className="w-16 h-16 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" fill="none" />
                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2" fill="none" />
                        <polyline points="21 15 16 10 5 21" strokeWidth="2" fill="none" />
                      </svg>
                    </div>
                    <p className="text-base font-medium text-gray-700 mb-1">
                      No image
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action buttons - always visible at the top */}
          <div className="flex gap-2 justify-center mt-3">
            <input
              ref={(el) => (fileInputRefs.current[imageId] = el)}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/jpeg2000"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleUploadImage(imageId, file);
                }
                // Reset input to allow selecting the same file again
                e.target.value = '';
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRefs.current[imageId]?.click()}
              className="bg-white border-gray-300 hover:bg-gray-50"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Upload
            </Button>
            {sectionType && defaultPrompt && (
              <Button
                variant={hasImage ? "outline" : "primary"}
                size="sm"
                onClick={() => handleGenerateImage(imageId, defaultPrompt, sectionType, sectionInfo || {})}
                disabled={isGenerating}
                className={hasImage ? "bg-white border-gray-300 hover:bg-gray-50 text-gray-700" : ""}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Generate
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {caption && (
          <p className="text-xs text-muted-foreground mt-2 italic">{caption}</p>
        )}
      </div>
    );
  };

  const s1 = clusterData.step1 || {};
  const s2 = clusterData.step2 || {};
  const s3 = clusterData.step3 || {};
  const s4 = clusterData.step4 || {};
  const s5 = clusterData.step5 || {};
  const s6 = clusterData.step6 || {};
  const s7 = clusterData.step7 || {};
  const s8 = clusterData.step8 || {};
  const s9 = clusterData.step9 || {};
  const s10 = clusterData.step10 || {};
  const s11 = clusterData.step11 || {};
  const s12 = clusterData.step12 || {};
  const s13 = clusterData.step13 || {};
  const s14 = clusterData.step14 || {};
  const s15 = clusterData.step15 || {};
  const s16 = clusterData.step16 || {};
  const s17 = clusterData.step17 || {};

  return (
    <div
      className="bg-white dpr-document"
      style={{
        fontFamily: 'Times New Roman, serif',
        width: '100%'
      }}
    >
      {/* Enhance DPR and Generate Images Buttons - Fixed at top */}
      <div
        className="sticky top-0 bg-white border-b-4 border-blue-500 p-6 shadow-lg z-50 no-print"
        style={{
          borderBottom: '4px solid #2563EB',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-6">
            {/* Enhance Complete DPR Card */}
            <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#1E40AF' }}>
                      Enhance Complete DPR
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Generate comprehensive paragraphs for all sections and conclusion
                    </p>
                  </div>
                  <div className="ml-4">
                    <Wand2 className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={async () => {
                const sectionsToEnhance = [
                  { name: 'projectSnapshot', data: { step1: s1, step11: s11 } },
                  { name: 'introduction', data: s2 },
                  { name: 'districtProfile', data: s3 },
                  // District Profile Subsections - pass with context
                  ...(s3.geography ? [{ name: 'districtProfile-geography', data: { text: s3.geography, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s3 } }] : []),
                  ...(s3.climate ? [{ name: 'districtProfile-climate', data: { text: s3.climate, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s3 } }] : []),
                  ...(s3.infrastructure ? [{ name: 'districtProfile-infrastructure', data: { text: s3.infrastructure, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s3 } }] : []),
                  ...(s3.keyEconomicActivities ? [{ name: 'districtProfile-keyEconomicActivities', data: { text: s3.keyEconomicActivities, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s3 } }] : []),
                  ...(s3.industrialInfrastructure ? [{ name: 'districtProfile-industrialInfrastructure', data: { text: s3.industrialInfrastructure, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s3 } }] : []),
                  { name: 'clusterProfile', data: s4 },
                  // Cluster Profile Subsections - pass with context
                  ...(s4.clusterEvolution ? [{ name: 'clusterProfile-evolution', data: { text: s4.clusterEvolution, clusterName: s1.clusterName, district: s1.district, location: s1.location, context: s4 } }] : []),
                  { name: 'valueChain', data: s5 },
                  { name: 'marketAspects', data: s6 },
                  // Market Aspects Subsections - pass with context
                  ...(s6.existingDemand ? [{ name: 'marketAspects-demandSupply', data: { text: s6.existingDemand, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  ...(s6.demandSupplyGap ? [{ name: 'marketAspects-demandSupplyGap', data: { text: s6.demandSupplyGap, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  ...(s6.competitorAnalysis ? [{ name: 'marketAspects-competition', data: { text: s6.competitorAnalysis, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  ...(s6.priceTrends ? [{ name: 'marketAspects-priceTrends', data: { text: s6.priceTrends, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  ...(s6.exportPotential ? [{ name: 'marketAspects-exportPotential', data: { text: s6.exportPotential, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  ...(s6.targetMarket ? [{ name: 'marketAspects-targetMarket', data: { text: s6.targetMarket, clusterName: s1.clusterName, majorProducts: s1.majorProducts, context: s6 } }] : []),
                  { name: 'swotAnalysis', data: s8 },
                  { name: 'gapAnalysis', data: s7 },
                  { name: 'cfcDetails', data: s10 },
                  { name: 'spvDetails', data: s11 },
                  { name: 'projectCost', data: { step12: s12, step13: s13 } },
                  { name: 'operatingCostRevenue', data: s14 },
                  { name: 'financialViability', data: s15 },
                  { name: 'implementationSchedule', data: s16 },
                  { name: 'expectedImpact', data: s17 },
                  { name: 'conclusion', data: clusterData },
                ];

                // Filter out sections that don't have data
                const validSections = sectionsToEnhance.filter(section => {
                  if (section.name === 'projectSnapshot') return s1.clusterName || s11.spvName;
                  if (section.name === 'introduction') return s2.sectorType || s2.sectorDescription;
                  if (section.name === 'districtProfile') return s3.geography || s3.climate || s3.infrastructure;
                  if (section.name === 'clusterProfile') return s4.clusterEvolution || s4.productionCapacity;
                  if (section.name === 'valueChain') return s5.rawMaterials?.length > 0 || s5.valueAdditionStages?.length > 0;
                  if (section.name === 'marketAspects') return s6.existingDemand || s6.competitorAnalysis;
                  if (section.name === 'swotAnalysis') return (Array.isArray(s8.strengths) && s8.strengths.length > 0) || (Array.isArray(s8.weaknesses) && s8.weaknesses.length > 0);
                  if (section.name === 'gapAnalysis') return s7.technologyGaps || s7.infrastructureGaps;
                  if (section.name === 'cfcDetails') return s10.name || s10.location;
                  if (section.name === 'spvDetails') return s11.spvName || s11.legalStatus;
                  if (section.name === 'operatingCostRevenue') return s14.rawMaterialCost || s14.powerCost || s14.wages;
                  if (section.name === 'projectCost') return s12.land || s12.building || s12.machinery;
                  if (section.name === 'financialViability') return s15.profitAndLossProjections || s15.irr || s15.npv;
                  if (section.name === 'implementationSchedule') return s16.startDate || (Array.isArray(s16.milestones) && s16.milestones.length > 0);
                  if (section.name === 'expectedImpact') return s17.employmentGeneration || s17.turnoverGrowth;
                  if (section.name === 'conclusion') return true; // Always enhance conclusion
                  return false;
                });

                const totalSections = validSections.length;
                let dprId = dpr?._id || dpr?.id;
                const projectId = project?._id || project?.id;

                // If DPR doesn't exist yet, try to get or create it using project ID
                if (!dprId && projectId) {
                  try {
                    // Try to get existing DPRs for this project
                    const dprsResponse = await api.getProjectDPRs(projectId);
                    const dprs = dprsResponse.data || dprsResponse;
                    if (Array.isArray(dprs) && dprs.length > 0) {
                      // Find draft DPR
                      const draftDpr = dprs.find((d: any) => d.status === 'draft');
                      if (draftDpr) {
                        dprId = draftDpr._id || draftDpr.id;
                      }
                    }
                    
                    // If still no DPR, we'll proceed without saving to database
                    // The enhanced content will still be stored in state for preview
                    if (!dprId) {
                      console.warn('No DPR found for project. Enhanced content will be stored in preview only.');
                    }
                  } catch (error) {
                    console.warn('Failed to get DPRs for project:', error);
                    // Continue without DPR ID - enhanced content will still work in preview
                  }
                }

                if (!dprId && !projectId) {
                  toast.error('Project not found. Please save your project first.');
                  return;
                }

                // Set all sections as enhancing
                const enhancingState: Record<string, boolean> = {};
                validSections.forEach(section => {
                  enhancingState[section.name] = true;
                });
                setEnhancingSections(enhancingState);

                toast.loading(`Enhancing and applying all sections: 0/${totalSections}`, { id: 'enhance-all', duration: Infinity });

                try {
                  // Enhance all sections and automatically apply them
                  let successCount = 0;
                  let failedCount = 0;
                  let appliedCount = 0;

                  // Process sections sequentially to avoid overwhelming the API
                  for (let i = 0; i < validSections.length; i++) {
                    const section = validSections[i];
                    try {
                      toast.loading(`Enhancing and applying: ${i + 1}/${totalSections} - ${section.name}`, { id: 'enhance-all' });
                      
                      // Step 1: Enhance the section and get the enhanced content
                      const enhanceResult = await api.enhanceClusterDPRSection(section.name, section.data, clusterData);
                      if (!enhanceResult.success || !enhanceResult.data?.enhancedParagraph) {
                        throw new Error(enhanceResult.message || 'Failed to enhance section');
                      }
                      
                      const enhancedParagraph = enhanceResult.data.enhancedParagraph;
                      
                      // Update state for preview (even if we're applying immediately)
                      setEnhancedContent((prev) => ({
                        ...prev,
                        [section.name]: enhancedParagraph
                      }));
                      
                      // Step 2: Automatically apply the enhanced content if DPR exists
                      if (dprId) {
                        try {
                          // Save enhanced content to database first
                          const contentToSave = {
                            [section.name]: enhancedParagraph
                          };
                          await api.saveClusterDPREnhancedContent(dprId, contentToSave, viewLanguage);
                          await new Promise(resolve => setTimeout(resolve, 100));
                          
                          // Apply the enhanced content
                          const applyResult = await api.applyClusterDPREnhancedContent(dprId, section.name, viewLanguage);
                          if (applyResult.success) {
                            // Remove from enhancedContent state since it's now applied
                            setEnhancedContent((prev) => {
                              const updated = { ...prev };
                              delete updated[section.name];
                              return updated;
                            });
                            appliedCount++;
                            console.log(`✅ Applied enhanced content for ${section.name}`);
                          } else {
                            console.warn(`Failed to apply enhanced content for ${section.name}:`, applyResult.message);
                            // Retry once
                            try {
                              await new Promise(resolve => setTimeout(resolve, 200));
                              const retryResult = await api.applyClusterDPREnhancedContent(dprId, section.name, viewLanguage);
                              if (retryResult.success) {
                                setEnhancedContent((prev) => {
                                  const updated = { ...prev };
                                  delete updated[section.name];
                                  return updated;
                                });
                                appliedCount++;
                                console.log(`✅ Applied enhanced content for ${section.name} on retry`);
                              }
                            } catch (retryError) {
                              console.error(`Retry failed for ${section.name}:`, retryError);
                            }
                          }
                        } catch (applyError: any) {
                          console.error(`Error applying enhanced content for ${section.name}:`, applyError);
                          // Continue - content is still in preview
                        }
                      }
                      
                      successCount++;
                    } catch (error: any) {
                      console.error(`Error enhancing section ${section.name}:`, error);
                      failedCount++;
                    }
                  }

                  // Reload DPR to show applied content
                  if (dprId && appliedCount > 0) {
                    try {
                      const reloadedDPRResponse = await api.getClusterDPR(dprId);
                      if (reloadedDPRResponse.success && reloadedDPRResponse.data) {
                        const reloadedDPR = reloadedDPRResponse.data;
                        if (dpr) {
                          Object.assign(dpr, reloadedDPR);
                          if (reloadedDPR.content) {
                            dpr.content = reloadedDPR.content;
                          }
                          if (reloadedDPR.clusterSections) {
                            dpr.clusterSections = reloadedDPR.clusterSections;
                          }
                        }
                        setContentRefreshKey(prev => prev + 1);
                      }
                    } catch (reloadError) {
                      console.error('Failed to reload DPR after applying:', reloadError);
                      setContentRefreshKey(prev => prev + 1);
                    }
                  }

                  if (failedCount === 0) {
                    const message = dprId 
                      ? `Successfully enhanced and applied ${appliedCount} sections! Enhanced content has been directly added to the DPR.`
                      : `Successfully enhanced ${successCount} sections! Enhanced content is now visible in the preview. Note: Generate DPR to apply enhanced content permanently.`;
                    toast.success(message, { id: 'enhance-all', duration: 5000 });
                  } else {
                    const message = dprId
                      ? `Enhanced and applied ${appliedCount}/${totalSections} sections. ${failedCount} failed. Enhanced content has been directly added to the DPR.`
                      : `Enhanced ${successCount}/${totalSections} sections. ${failedCount} failed. Enhanced content is now visible in the preview. Note: Generate DPR to apply enhanced content permanently.`;
                    toast.success(message, { id: 'enhance-all', duration: 5000 });
                  }
                } catch (error: any) {
                  console.error('Error enhancing all sections:', error);
                  toast.error(error.message || 'Failed to enhance sections', { id: 'enhance-all' });
                } finally {
                  setEnhancingSections({});
                }
              }}
                    disabled={Object.values(enhancingSections).some(v => v)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all"
                  >
                    {Object.values(enhancingSections).some(v => v) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enhancing DPR...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-5 w-5 mr-2" />
                        Enhance Complete DPR
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              
            </div>
            {/* Generate All Images Card */}
            <div className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-6 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2" style={{ color: '#047857' }}>
                        Generate All Images
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Generate all images for cover page, cluster photos, value chain, and CFC diagrams
                      </p>
                    </div>
                    <div className="ml-4">
                      <Sparkles className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={async () => {
                const projectId = project?._id || project?.id;
                if (!projectId) {
                  toast.error('Project not found. Please save your project first.');
                  return;
                }

                // Define all images to generate
                const imagesToGenerate = [
                  {
                    imageId: 'cover-image',
                    prompt: `Professional cover image showcasing the key products manufactured and developed by ${s1.clusterName || 'the cluster'} without text, labels, diagrams, or watermarks. The products and services list is: ${s1.majorProducts || 'N/A'}.`,
                    sectionType: 'coverPage',
                    sectionInfo: { clusterName: s1.clusterName, location: s1.location, district: s1.district }
                  },
                  {
                    imageId: 'cluster-photo-1',
                    prompt: `Professional photograph of ${s1.clusterName || 'a cluster'} unit showing ${s1.majorProducts || 'production facilities'} in ${s1.location || 'the cluster location'}. Realistic, documentary style, business document quality.`,
                    sectionType: 'clusterProfile',
                    sectionInfo: { clusterName: s1.clusterName, location: s1.location, majorProducts: s1.majorProducts }
                  },
                  {
                    imageId: 'cluster-photo-2',
                    prompt: `Professional photograph showing production process at ${s1.clusterName || 'the cluster'} unit. Workers engaged in manufacturing ${s1.majorProducts || 'products'}. Realistic, documentary style, business document quality.`,
                    sectionType: 'clusterProfile',
                    sectionInfo: { clusterName: s1.clusterName, productionProcess: s4.productionProcess }
                  },
                  {
                    imageId: 'value-chain-diagram',
                    prompt: `Create a professional flow diagram illustrating the value chain for ${s1.clusterName || 'the cluster'}, showing the process from raw materials through processing and value addition to the end customer. Use the following manufacturing process as a guide: ${s10.manufacturingProcess || 'N/A'}. The diagram should be clean, realistic, and professional, with clear visual flow, but absolutely no text, labels, diagrams, or watermarks visible.`,
                    sectionType: 'valueChain',
                    sectionInfo: { rawMaterials: s5.rawMaterials, valueAdditionStages: s5.valueAdditionStages, clusterName: s1.clusterName }
                  },
                  {
                    imageId: 'process-flow-diagram',
                    prompt: `Professional diagram showing manufacturing process flow for ${s10.name || 'the CFC'} at ${s1.clusterName || 'the cluster'}. Clean, professional business diagram style showing process steps.`,
                    sectionType: 'cfcDetails',
                    sectionInfo: { manufacturingProcess: s10.manufacturingProcess, cfcName: s10.name, clusterName: s1.clusterName }
                  },
                  {
                    imageId: 'machinery-layout',
                    prompt: `Professional photograph or diagram showing machinery layout at ${s10.name || 'the CFC'} for ${s1.clusterName || 'the cluster'}. Modern industrial equipment arranged in a facility. Realistic, documentary style, business document quality.`,
                    sectionType: 'cfcDetails',
                    sectionInfo: { plantAndMachinery: s10.plantAndMachinery, cfcName: s10.name, clusterName: s1.clusterName }
                  }
                ];

                const totalImages = imagesToGenerate.length;
                let successCount = 0;
                let failedCount = 0;

                // Set all images as generating
                const generatingState: Record<string, boolean> = {};
                imagesToGenerate.forEach(img => {
                  generatingState[img.imageId] = true;
                });
                setGeneratingImages(generatingState);

                toast.loading(`Generating all images: 0/${totalImages}`, { id: 'generate-all-images', duration: Infinity });

                try {
                  // Process images sequentially to avoid overwhelming the API
                  for (let i = 0; i < imagesToGenerate.length; i++) {
                    const imageConfig = imagesToGenerate[i];
                    try {
                      toast.loading(`Generating image ${i + 1}/${totalImages}: ${imageConfig.imageId}`, { id: 'generate-all-images' });
                      
                      const result = await api.generateClusterDPRImage(
                        imageConfig.prompt,
                        imageConfig.sectionType,
                        imageConfig.sectionInfo
                      );
                      
                      if (result.success && result.data?.imageUrl) {
                        const imageUrl = result.data.imageUrl;
                        setImages(prev => ({ ...prev, [imageConfig.imageId]: imageUrl }));
                        
                        // Save image to project database
                        try {
                          const currentImages = project?.images || {};
                          await api.updateProject(projectId, {
                            images: {
                              ...currentImages,
                              [imageConfig.imageId]: imageUrl
                            }
                          });
                          console.log(`💾 Saved image ${imageConfig.imageId} to project database`);
                        } catch (saveError) {
                          console.error('Error saving image to project:', saveError);
                        }
                        
                        successCount++;
                      } else {
                        throw new Error(result.message || 'Failed to generate image');
                      }
                    } catch (error: any) {
                      console.error(`Error generating image ${imageConfig.imageId}:`, error);
                      failedCount++;
                    }
                  }

                  if (failedCount === 0) {
                    toast.success(`Successfully generated ${successCount} images!`, { id: 'generate-all-images', duration: 5000 });
                  } else {
                    toast.success(`Generated ${successCount}/${totalImages} images. ${failedCount} failed.`, { id: 'generate-all-images', duration: 5000 });
                  }
                } catch (error: any) {
                  console.error('Error generating all images:', error);
                  toast.error(error.message || 'Failed to generate images', { id: 'generate-all-images' });
                } finally {
                  setGeneratingImages({});
                }
                      }}
                      disabled={Object.values(generatingImages).some(v => v)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-semibold rounded-lg transition-all"
                    >
                      {Object.values(generatingImages).some(v => v) ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generating Images...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate All Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Cover Page - Matching Template Design */}
      {renderPageWrapper(
        <div className="flex flex-col h-full">
          {/* Title Section with Grey Box */}
          <div className="mb-6">
            <div
              className="rounded-lg p-6 mx-auto max-w-2xl"
              style={{
                backgroundColor: '#F3F4F6',
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)',
                border: '1px solid #D1D5DB',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h1 className="text-4xl font-bold text-center mb-2" style={{ color: '#1F2937', letterSpacing: '0.05em' }}>
                DETAILED PROJECT REPORT
              </h1>
              <h2 className="text-2xl font-semibold text-center mb-3" style={{ color: '#1F2937' }}>
                On
              </h2>
              <h2 className="text-2xl font-semibold text-center mb-2" style={{ color: '#1F2937' }}>
                Establishment of Common Facility Centre for
              </h2>
              <h2 className="text-3xl font-bold text-center mb-3 uppercase" style={{ color: '#059669', letterSpacing: '0.05em' }}>
                {s1.clusterName || 'CLUSTER NAME'}
              </h2>
              <p className="text-lg font-semibold text-center justify-center" style={{ color: '#1F2937' }}>
                under 'Micro Cluster Development Programme'
              </p>
            </div>
          </div>

          {/* Image Holder Section - Using renderImage with upload/generate */}
          <div className="flex items-center justify-center my-8">
            {renderImage(
              'cover-image',
              '',
              'Cluster Cover Image',
              '',
              'coverPage',
              { clusterName: s1.clusterName, location: s1.location, district: s1.district },
              //add products and services list to the prompt
              `Professional cover image showcasing the key products manufactured and developed by ${s1.clusterName || 'the cluster'} without text, labels, diagrams, or watermarks. The products and services list is: ${s1.majorProducts || 'N/A'}.`
            )}
          </div>

          {/* Submission Details Section */}
          <div
            className="mt-auto space-y-4 text-left max-w-lg mx-auto w-full"
            style={{ fontSize: '14px' }}
          >
            {/* Submitted to */}
            <div
              className="border-t-2 border-b-2 border-gray-800 py-3 flex"
              style={{ borderColor: '#1F2937' }}
            >
              <p
                className="text-sm font-semibold w-32"
                style={{ color: '#1F2937' }}
              >
                Submitted to:
              </p>
              <p className="text-sm" style={{ color: '#1F2937' }}>
                {'DIC, District'}
              </p>
            </div>

            {/* Submitted by */}
            <div
              className="border-b-2 border-gray-800 py-3"
              style={{ borderColor: '#1F2937' }}
            >
              <div className="flex">
                <p
                  className="text-sm font-semibold w-32"
                  style={{ color: '#1F2937' }}
                >
                  Submitted by:
                </p>
                <div>
                  <p className="text-sm" style={{ color: '#1F2937' }}>
                    {s1.clusterName || 'Cluster Name'}
                  </p>
                  <p className="text-sm" style={{ color: '#1F2937' }}>
                    {s1.location || 'Location'}
                  </p>
                </div>
              </div>
            </div>

            {/* Prepared by */}
            <div className="py-3 flex">
              <p
                className="text-sm font-semibold w-32"
                style={{ color: '#1F2937' }}
              >
                Prepared by:
              </p>
              <p className="text-sm" style={{ color: '#1F2937' }}>
                CittaAI
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Table of Contents - Matching PDF Format */}
      {renderPageWrapper(
        <div>
          {renderSectionTitle('CONTENTS')}
          {(() => {
            // Check which sections have data
            const hasExecutiveSummary = content.executiveSummary || (s1.clusterName || s1.district || s1.location);
            const hasIntroduction = content.introduction || (s2.sectorType || s2.sectorDescription || s2.nationalImportance);
            const hasDistrictProfile = s3.geography || s3.climate || s3.infrastructure || s3.keyEconomicActivities || s3.rawMaterialAvailability || s3.industrialInfrastructure || s3.connectivity;
            const hasClusterProfile = s4.clusterEvolution || s4.productionCapacity || s4.technologyLevel;
            const hasValueChain = s5.rawMaterials?.length > 0 || s5.valueAdditionStages?.length > 0;
            const hasMarketAspects = s6.existingDemand || s6.demandSupplyGap || s6.competitorAnalysis || s6.priceTrends || s6.exportPotential;
            const hasSWOT = (Array.isArray(s8.strengths) && s8.strengths.length > 0) || (Array.isArray(s8.weaknesses) && s8.weaknesses.length > 0) || (Array.isArray(s8.opportunities) && s8.opportunities.length > 0) || (Array.isArray(s8.threats) && s8.threats.length > 0);
            const hasGapAnalysis = s7.technologyGaps || s7.infrastructureGaps || s7.skillGaps || s7.marketingGaps || s7.financialGaps || s7.justificationForIntervention;
            const hasCFCDetails = s10.name || s10.location || s10.plantAndMachinery || s10.manufacturingProcess || s10.capacity;
            const hasSPVDetails = s11.spvName || s11.legalStatus || s11.memberUnits?.length > 0;
            const hasProjectCost = (s12.land && s12.land > 0) || (s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0);
            const hasOperatingCostRevenue = s14.rawMaterialCost || s14.powerCost || s14.wages || s14.maintenance || s14.administrativeExpenses || s14.marketingExpenses || s14.annualProductionVolume || s14.annualSalesRealization;
            const hasFinancialViability = s15.profitAndLossProjections?.length > 0 || s15.cashFlowProjections?.length > 0 || s15.balanceSheetProjections?.length > 0 || s15.breakEvenPoint || s15.irr || s15.npv;
            const hasImplementationSchedule = s16.startDate || (Array.isArray(s16.milestones) && s16.milestones.length > 0) || s16.totalImplementationPeriod;
            const hasExpectedImpact = s17.employmentGeneration || s17.turnoverGrowth || s17.exportGrowth || s17.incomeEnhancement || s17.sustainabilityOutcomes?.length > 0;
            const hasFinancialStatements = (s12.workingCapitalMargin && s12.workingCapitalMargin > 0) ||
              (s14.capacityUtilization || s14.rawMaterialCostPercentage || s14.powerCost) ||
              (s14.manpowerRequirement?.length > 0) ||
              ((s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0)) ||
              (s15.profitAndLossProjections?.length > 0);
            const hasConclusion = content.conclusion || true; // Always show conclusion section
            const hasAnnexures = clusterData.step18?.spvRegistration || clusterData.step18?.landDocuments ||
              clusterData.step18?.buildingEstimates || clusterData.step18?.machineryQuotations ||
              clusterData.step18?.memberRegistrations ||
              (clusterData.step18?.supportingDocuments && clusterData.step18.supportingDocuments.length > 0);

            // Build sections array with page numbers
            const sections: Array<{ chapter: string, title: string, page: string, isHeader?: boolean }> = [];
            let currentPage = 1; // Start from page 1 after cover page and TOC

            // Executive Summary
            if (hasExecutiveSummary) {
              sections.push({ chapter: '', title: 'Executive Summary', page: 'i-iv' });
            }

            // Main sections
            if (hasIntroduction) {
              sections.push({ chapter: '1.', title: 'Introduction', page: currentPage.toString() });
              currentPage++;
            }
            if (hasDistrictProfile) {
              sections.push({ chapter: '1.5', title: 'District & Regional Profile', page: currentPage.toString() });
              currentPage++;
            }
            if (hasClusterProfile) {
              sections.push({ chapter: '2.', title: 'Cluster Profile', page: currentPage.toString() });
              currentPage++;
            }
            if (hasValueChain) {
              sections.push({ chapter: '3.', title: 'Cluster value chain mapping', page: currentPage.toString() });
              currentPage++;
            }
            if (hasMarketAspects) {
              sections.push({ chapter: '4.', title: 'Market Aspects', page: currentPage.toString() });
              currentPage++;
            }
            if (hasSWOT) {
              sections.push({ chapter: '5.', title: 'SWOT Analysis', page: currentPage.toString() });
              currentPage++;
            }
            if (hasGapAnalysis) {
              sections.push({ chapter: '6.', title: 'Need Gap Analysis', page: currentPage.toString() });
              currentPage++;
            }
            if (hasCFCDetails) {
              sections.push({ chapter: '7.', title: 'CFC - Operation & Management', page: currentPage.toString() });
              currentPage++;
            }
            if (hasSPVDetails) {
              sections.push({ chapter: '8.', title: 'SPV Member Units', page: currentPage.toString() });
              currentPage++;
            }
            if (hasProjectCost) {
              sections.push({ chapter: '9.', title: 'Project Cost & Means Of Finance', page: currentPage.toString() });
              currentPage++;
            }
            if (hasOperatingCostRevenue) {
              sections.push({ chapter: '9.5', title: 'Operating Cost & Revenue', page: currentPage.toString() });
              currentPage++;
            }
            if (hasFinancialViability) {
              sections.push({ chapter: '10.', title: 'Financial viability', page: currentPage.toString() });
              currentPage++;
            }
            if (hasImplementationSchedule) {
              sections.push({ chapter: '10.5', title: 'Project Implementation Schedule', page: currentPage.toString() });
              currentPage++;
            }
            if (hasExpectedImpact) {
              sections.push({ chapter: '11.', title: 'Expected Impact', page: currentPage.toString() });
              currentPage++;
            }

            // Financial Statements
            if (hasFinancialStatements) {
              sections.push({ chapter: '', title: 'Financial Statements', page: '', isHeader: true });
              sections.push({ chapter: 'SI.No.', title: 'Financial Statements', page: '' });

              let statementNum = 1;
              let statementPage = currentPage;

              // Cost of Project & Means of Finance (always shown if project cost exists)
              if (hasProjectCost) {
                sections.push({ chapter: statementNum.toString(), title: 'Cost of Project & Means of Finance', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Assessment of Working Capital
              if (s12.workingCapitalMargin && s12.workingCapitalMargin > 0) {
                sections.push({ chapter: statementNum.toString(), title: 'Assessment of Working Capital', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Cost of Production & Profitability
              if (s15.profitAndLossProjections?.length > 0) {
                sections.push({ chapter: statementNum.toString(), title: 'Cost of Production & Profitability', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Assumptions
              if (s14.capacityUtilization || s14.rawMaterialCostPercentage || s14.powerCost || s14.depreciationRate || s14.interestRate) {
                sections.push({ chapter: statementNum.toString(), title: 'Assumptions for Cost of Production & Profitability', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Power Cost
              if (s14.powerCost) {
                sections.push({ chapter: statementNum.toString(), title: 'Estimation of Power cost', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Manpower
              if (s14.manpowerRequirement?.length > 0 || (s17.employmentGeneration && s17.employmentGeneration > 0)) {
                sections.push({ chapter: statementNum.toString(), title: 'Manpower requirement & estimation of cost', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Depreciation
              if ((s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0) || s14.depreciationDetails) {
                sections.push({ chapter: statementNum.toString(), title: 'Estimation of Depreciation', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Income Tax
              if (s15.profitAndLossProjections?.length > 0) {
                sections.push({ chapter: statementNum.toString(), title: 'Calculation of Income Tax', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Cash Flow
              if (s15.cashFlowProjections?.length > 0) {
                sections.push({ chapter: statementNum.toString(), title: 'Projected Cash Flow Statement', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Balance Sheet
              if (s15.balanceSheetProjections?.length > 0) {
                sections.push({ chapter: statementNum.toString(), title: 'Projected Balance Sheet', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // Break Even Point
              if (s15.breakEvenPoint) {
                sections.push({ chapter: statementNum.toString(), title: 'Estimation of Break Even Point', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              // NPV & IRR
              if (s15.npv || s15.irr) {
                sections.push({ chapter: statementNum.toString(), title: 'Estimation of NPV & IRR', page: statementPage.toString() });
                statementNum++;
                statementPage++;
              }

              currentPage = statementPage;
            }

            // Conclusion
            if (hasConclusion) {
              sections.push({ chapter: '', title: 'Conclusion', page: currentPage.toString() });
              currentPage++;
            }

            // Annexures
            if (hasAnnexures) {
              // Count annexure files to calculate pages
              let annexureFileCount = 0;
              if (clusterData.step18?.spvRegistration) annexureFileCount++;
              if (clusterData.step18?.landDocuments) annexureFileCount++;
              if (clusterData.step18?.buildingEstimates) annexureFileCount++;
              if (clusterData.step18?.machineryQuotations) annexureFileCount++;
              if (clusterData.step18?.memberRegistrations) annexureFileCount++;
              if (clusterData.step18?.supportingDocuments && Array.isArray(clusterData.step18.supportingDocuments)) {
                annexureFileCount += clusterData.step18.supportingDocuments.length;
              }

              // Annexures cover page (1 page) + each file page
              const annexureStartPage = currentPage;
              const annexureEndPage = annexureFileCount > 0 ? currentPage + annexureFileCount : currentPage;
              // If only cover page, show single page number, otherwise show range
              const annexurePageNumber = annexureFileCount > 0 ? `${annexureStartPage}-${annexureEndPage}` : annexureStartPage.toString();
              sections.push({ chapter: '', title: 'Annexures', page: annexurePageNumber });
            }

            return (
              <table className="w-full border-collapse border border-gray-800 text-sm" style={{ borderColor: '#1F2937' }}>
                <thead>
                  <tr style={{ backgroundColor: '#E5E7EB' }}>
                    <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Chapter</th>
                    <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Title</th>
                    <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Page No</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section, idx) => (
                    <tr
                      key={idx}
                      style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}
                    >
                      <td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>
                        {section.isHeader ? <strong>{section.chapter}</strong> : section.chapter}
                      </td>
                      <td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>
                        {section.isHeader ? <strong>{section.title}</strong> : section.title}
                      </td>
                      <td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>
                        {section.page}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

      {/* Project Snapshot - Matching PDF Format */}
      {renderPageWrapper(
        <div>
          {renderSectionTitle('PROJECT SNAPSHOT')}
          {renderEnhancedContent('projectSnapshot', 'Project Snapshot')}
          {renderTable(
            ['Particulars', 'Details'],
            [
              ['Name of the cluster', `${s1.clusterName || 'N/A'}, ${s1.district || 'N/A'} District`],
              ['Location & Spread of the cluster', s1.geographicalSpread || s1.location || 'N/A'],
              ['Product range', s1.majorProducts || 'N/A'],
              ['Existing cluster scenario', 'See table below'],
              ['Existing employment in the Cluster', `${(s1.employmentPerUnit?.lessThan5 || 0) + (s1.employmentPerUnit?.between5And10 || 0) + (s1.employmentPerUnit?.moreThan10 || 0)} workers (Male workers: ${s1.employmentPerUnit?.male || 0}, Female workers: ${s1.employmentPerUnit?.female || 0})`],
              ['Name of the SPV', s11.spvName || 'N/A'],
              ['Legal Status', s11.legalStatus || 'N/A'],
              ['Number of SPV members(Micro unit holders)', `${(s11.memberUnits?.length || 0)} member units`],
            ]
          )}

          {/* Existing Cluster Scenario Table - Only show if data is available */}
          {(s1.enterpriseCount || s4.productionCapacity || s14.annualProductionVolume) && (
            <div className="my-6">
              <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Existing cluster scenario</h4>
              {(() => {
                // Build table rows dynamically from available data
                const rows: any[][] = [];
                const totalUnits = (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0);

                // Add rows based on enterprise categories if they exist
                if (s1.enterpriseCount?.micro && s1.enterpriseCount.micro > 0) {
                  rows.push([
                    'Micro Enterprises',
                    s1.enterpriseCount.micro.toString(),
                    s4.productionCapacity || s14.annualProductionVolume ? `${s14.annualProductionVolume || 'N/A'}` : 'N/A',
                    s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.micro)).toFixed(2)} Lakhs` : 'N/A'
                  ]);
                }
                if (s1.enterpriseCount?.small && s1.enterpriseCount.small > 0) {
                  rows.push([
                    'Small Enterprises',
                    s1.enterpriseCount.small.toString(),
                    'N/A',
                    s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.small)).toFixed(2)} Lakhs` : 'N/A'
                  ]);
                }
                if (s1.enterpriseCount?.medium && s1.enterpriseCount.medium > 0) {
                  rows.push([
                    'Medium Enterprises',
                    s1.enterpriseCount.medium.toString(),
                    'N/A',
                    s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.medium)).toFixed(2)} Lakhs` : 'N/A'
                  ]);
                }

                // Add total row if we have any data
                if (rows.length > 0) {
                  const totalProduction = s14.annualProductionVolume ? s14.annualProductionVolume.toString() : 'N/A';
                  const totalTurnover = s1.turnoverPerUnit && totalUnits > 0
                    ? `₹${((s1.turnoverPerUnit * totalUnits)).toFixed(2)} Lakhs`
                    : 'N/A';
                  rows.push(['Total', totalUnits.toString(), totalProduction, totalTurnover]);
                }

                // Only render table if we have data
                if (rows.length > 0) {
                  return renderTable(
                    ['Product', 'No.of units', 'Annual Production (in MT)', 'Annual Turnover (in Rs.lakhs)'],
                    rows
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="my-6">
            <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Key Concern areas of the cluster</h4>
            {(() => {
              const concerns: string[] = [];
              if (s7.technologyGaps) concerns.push(`Technology: ${s7.technologyGaps}`);
              if (s7.infrastructureGaps) concerns.push(`Infrastructure: ${s7.infrastructureGaps}`);
              if (s7.skillGaps) concerns.push(`Skill: ${s7.skillGaps}`);
              if (s7.marketingGaps) concerns.push(`Marketing: ${s7.marketingGaps}`);
              if (s7.financialGaps) concerns.push(`Finance: ${s7.financialGaps}`);

              if (concerns.length > 0) {
                return (
                  <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#1F2937' }}>
                    {concerns.map((concern, idx) => (
                      <li key={idx}>{concern}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
              );
            })()}
          </div>

          <div className="my-6">
            <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Project Rationale</h4>
            <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
              {s7.justificationForIntervention || 'N/A'}
            </p>
          </div>

          <div className="my-6">
            <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Proposed Interventions</h4>
            {s9.interventionType && (
              <p className="text-sm mb-2" style={{ color: '#1F2937' }}>
                <strong>Intervention Type:</strong> {s9.interventionType}
              </p>
            )}
            {s9.description ? (
              <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
                {s9.description}
              </p>
            ) : (
              <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
            )}
            {s9.objectives && s9.objectives.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937' }}>Objectives:</p>
                <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#1F2937' }}>
                  {s9.objectives.map((objective: string, idx: number) => (
                    <li key={idx}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            {s9.expectedBenefits && s9.expectedBenefits.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-semibold mb-2" style={{ color: '#1F2937' }}>Expected Benefits:</p>
                <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#1F2937' }}>
                  {s9.expectedBenefits.map((benefit: string, idx: number) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executive Summary */}
      {renderPageWrapper(
        <div>
          {renderSectionTitle('EXECUTIVE SUMMARY', 1)}
          {content.executiveSummary ? (
            <div className="prose max-w-none text-sm leading-relaxed">
              <FormattedText text={content.executiveSummary} />
            </div>
          ) : (
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-xl font-semibold mb-3">1.1 Basic Cluster Details</h3>
                {renderTable(
                  ['Parameter', 'Details'],
                  [
                    ['Cluster Name', s1.clusterName || 'N/A'],
                    ['District', s1.district || 'N/A'],
                    ['Location', s1.location || 'N/A'],
                    ['Geographical Spread', s1.geographicalSpread || 'N/A'],
                    ['Nature of Business', s1.natureOfBusiness || 'N/A'],
                    ['Major Products', s1.majorProducts || 'N/A'],
                  ]
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">1.2 Enterprise Profile</h3>
                {renderTable(
                  ['Category', 'Count'],
                  [
                    ['Micro Enterprises', s1.enterpriseCount?.micro || 0],
                    ['Small Enterprises', s1.enterpriseCount?.small || 0],
                    ['Medium Enterprises', s1.enterpriseCount?.medium || 0],
                    ['Total Enterprises', (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0)],
                  ]
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">1.3 Employment Profile</h3>
                {renderTable(
                  ['Category', 'Count'],
                  [
                    ['Units with < 5 employees', s1.employmentPerUnit?.lessThan5 || 0],
                    ['Units with 5-10 employees', s1.employmentPerUnit?.between5And10 || 0],
                    ['Units with > 10 employees', s1.employmentPerUnit?.moreThan10 || 0],
                    ['Male Workers', s1.employmentPerUnit?.male || 0],
                    ['Female Workers', s1.employmentPerUnit?.female || 0],
                  ]
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">1.4 Financial Indicators</h3>
                {renderTable(
                  ['Indicator', 'Value'],
                  [
                    ['Average Investment per Unit', s1.investmentPerUnit ? `₹${s1.investmentPerUnit.toFixed(2)} Lakhs` : 'N/A'],
                    ['Average Turnover per Unit', s1.turnoverPerUnit ? `₹${s1.turnoverPerUnit.toFixed(2)} Lakhs` : 'N/A'],
                    ['Market Served - Domestic', s1.marketServed?.domestic ? `${s1.marketServed.domestic}%` : 'N/A'],
                    ['Market Served - Export', s1.marketServed?.export ? `${s1.marketServed.export}%` : 'N/A'],
                  ]
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section 1: Introduction */}
      {renderPageWrapper(
        <div>
          {renderSectionTitle('1. INTRODUCTION', 2)}
          {renderEnhancedContent('introduction', 'Introduction')}
          {content.introduction ? (
            <div className="prose max-w-none text-sm leading-relaxed">
              <FormattedText text={content.introduction} />
            </div>
          ) : (
            <div className="text-sm leading-relaxed space-y-4">
              <p><strong>1.1 Sector/Industry Type:</strong> {s2.sectorType || 'N/A'}</p>
              <p><strong>1.2 Sector Description:</strong></p>
              <p className="text-justify">{s2.sectorDescription || 'N/A'}</p>
              <p><strong>1.3 National Importance:</strong></p>
              <p className="text-justify">{s2.nationalImportance || 'N/A'}</p>
              <p><strong>1.4 State-level Importance:</strong></p>
              <p className="text-justify">{s2.stateLevelImportance || 'N/A'}</p>
            </div>
          )}
        </div>
      )}

      {/* Section 1.5: District & Regional Profile */}
      {(s3.geography || s3.climate || s3.infrastructure || s3.keyEconomicActivities || s3.rawMaterialAvailability || s3.industrialInfrastructure || s3.connectivity) && (
        <div
          className="p-12 border-b-4 border-gray-800 page-break relative"
          style={{
            pageBreakAfter: 'always',
            padding: '2cm',
            minHeight: '29.7cm',
            fontFamily: 'Times New Roman, serif',
            border: '8px solid #2563EB',
            borderStyle: 'double',
            position: 'relative'
          }}
        >
          {/* Decorative border effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '2px solid #3B82F6',
              margin: '8px',
              borderRadius: '4px'
            }}
          />
          <div className="relative z-10">
            {renderSectionTitle('1.5 DISTRICT & REGIONAL PROFILE', 3)}
            {renderEnhancedContent('districtProfile', 'District Profile')}
            <div className="space-y-6 text-sm">
              {s3.geography && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.1 Geography</h3>
                  {renderEnhancedSubsection('districtProfile-geography', s3.geography)}
                </div>
              )}
              {s3.climate && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.2 Climate</h3>
                  {renderEnhancedSubsection('districtProfile-climate', s3.climate)}
                </div>
              )}
              {s3.infrastructure && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.3 Infrastructure</h3>
                  {renderEnhancedSubsection('districtProfile-infrastructure', s3.infrastructure)}
                </div>
              )}
              {s3.keyEconomicActivities && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.4 Key Economic Activities</h3>
                  {renderEnhancedSubsection('districtProfile-keyEconomicActivities', s3.keyEconomicActivities)}
                </div>
              )}
              {(s3.rawMaterialAvailability || s3.rawMaterialQuantity) && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.5 Raw Material Availability</h3>
                  {renderTable(
                    ['Parameter', 'Details'],
                    [
                      ['Availability', s3.rawMaterialAvailability || 'N/A'],
                      ['Quantity', s3.rawMaterialQuantity || 'N/A'],
                    ]
                  )}
                </div>
              )}
              {s3.industrialInfrastructure && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.6 Industrial Infrastructure</h3>
                  {renderEnhancedSubsection('districtProfile-industrialInfrastructure', s3.industrialInfrastructure)}
                </div>
              )}
              {(s3.connectivity?.road || s3.connectivity?.rail || s3.connectivity?.port) && (
                <div>
                  <h3 className="text-xl font-semibold mb-3">1.5.7 Connectivity</h3>
                  {renderTable(
                    ['Mode', 'Details'],
                    [
                      ['Road', s3.connectivity?.road || 'N/A'],
                      ['Rail', s3.connectivity?.rail || 'N/A'],
                      ['Port', s3.connectivity?.port || 'N/A'],
                    ]
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Cluster Profile */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('2. CLUSTER PROFILE', 4)}
          {renderEnhancedContent('clusterProfile', 'Cluster Profile')}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-xl font-semibold mb-3">2.1 Evolution of the Cluster</h3>
              {renderEnhancedSubsection('clusterProfile-evolution', s4.clusterEvolution)}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">2.2 Present Status of Cluster Units</h3>
              {renderTable(
                ['Parameter', 'Details'],
                [
                  ['No. of Units', (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0)],
                  ['Production Capacity', s4.productionCapacity || 'N/A'],
                  ['Technology Level', s4.technologyLevel || 'N/A'],
                  ['Year of Establishment', s4.yearOfEstablishment || 'N/A'],
                  ['Type of Units', s4.typeOfUnits || 'N/A'],
                  ['Present Activities', s4.presentActivities || 'N/A'],
                ]
              )}
            </div>
            {s4.stakeholders && Array.isArray(s4.stakeholders) && s4.stakeholders.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">2.3 Key Stakeholders</h3>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  {s4.stakeholders.map((stakeholder: string, idx: number) => (
                    <li key={idx}>{stakeholder}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Image placeholder for cluster photos */}
            <div className="my-6">
              <h4 className="text-lg font-semibold mb-3">📸 Cluster Photos</h4>
              <div className="grid grid-cols-2 gap-4">
                {renderImage(
                  'cluster-photo-1',
                  '',
                  'Cluster Unit Photo 1',
                  'Sample cluster unit',
                  'clusterProfile',
                  { clusterName: s1.clusterName, location: s1.location, majorProducts: s1.majorProducts },
                  `Professional photograph of ${s1.clusterName || 'a cluster'} unit showing ${s1.majorProducts || 'production facilities'} in ${s1.location || 'the cluster location'}. Realistic, documentary style, business document quality.`
                )}
                {renderImage(
                  'cluster-photo-2',
                  '',
                  'Cluster Unit Photo 2',
                  'Production process',
                  'clusterProfile',
                  { clusterName: s1.clusterName, productionProcess: s4.productionProcess },
                  `Professional photograph showing production process at ${s1.clusterName || 'the cluster'} unit. Workers engaged in manufacturing ${s1.majorProducts || 'products'}. Realistic, documentary style, business document quality.`
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Value Chain */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('3. CLUSTER VALUE CHAIN MAPPING', 5)}
          {renderEnhancedContent('valueChain', 'Value Chain')}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-xl font-semibold mb-3">3.1 Value Chain Stages</h3>
              <p className="mb-4">Raw Material → Processing → Value Addition → Marketing → End Customer</p>
              {s5.rawMaterials && Array.isArray(s5.rawMaterials) && s5.rawMaterials.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-2">Raw Materials:</h4>
                  {renderTable(
                    ['Material', 'Source'],
                    s5.rawMaterials.map((m: any) => [m.name || 'N/A', m.source || 'N/A'])
                  )}
                </div>
              )}
              {s5.valueAdditionStages && Array.isArray(s5.valueAdditionStages) && s5.valueAdditionStages.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-2">Value Addition Stages:</h4>
                  {renderTable(
                    ['Stage', 'Selling Price (₹ Lakhs)'],
                    s5.valueAdditionStages.map((s: any) => [s.stage || 'N/A', `${(s.sellingPrice || 0).toLocaleString('en-IN')} Lakhs`])
                  )}
                </div>
              )}
              {s5.intermediateProducts && Array.isArray(s5.intermediateProducts) && s5.intermediateProducts.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-2">Intermediate Products:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {s5.intermediateProducts.map((product: string, idx: number) => (
                      <li key={idx}>{product}</li>
                    ))}
                  </ul>
                </div>
              )}
              {s5.finalProducts && Array.isArray(s5.finalProducts) && s5.finalProducts.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-2">Final Products:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {s5.finalProducts.map((product: string, idx: number) => (
                      <li key={idx}>{product}</li>
                    ))}
                  </ul>
                </div>
              )}
              {s5.majorBuyers && Array.isArray(s5.majorBuyers) && s5.majorBuyers.length > 0 && (
                <div className="my-4">
                  <h4 className="font-semibold mb-2">Major Buyers:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {s5.majorBuyers.map((buyer: string, idx: number) => (
                      <li key={idx}>{buyer}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {/* Value chain diagram placeholder */}
            <div className="my-6">
              <h4 className="text-lg font-semibold mb-3">📊 Value Chain Flow Diagram</h4>
              {renderImage(
                'value-chain-diagram',
                '',
                'Value Chain Diagram',
                'Value chain flow from raw material to end customer',
                'valueChain',
                { rawMaterials: s5.rawMaterials, valueAdditionStages: s5.valueAdditionStages, clusterName: s1.clusterName },
                `Create a professional flow diagram illustrating the value chain for ${s1.clusterName || 'the cluster'}, showing the process from raw materials through processing and value addition to the end customer. Use the following manufacturing process as a guide: ${s10.manufacturingProcess || 'N/A'}. The diagram should be clean, realistic, and professional, with clear visual flow, but absolutely no text, labels, diagrams, or watermarks visible.`

              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Market Aspects */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('4. MARKET ASPECTS', 6)}
          {renderEnhancedContent('marketAspects', 'Market Aspects')}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-xl font-semibold mb-3">4.1 Demand–Supply Analysis</h3>
              {renderEnhancedSubsection('marketAspects-demandSupply', s6.existingDemand)}
              {s6.demandSupplyGap && (
                <div className="text-justify leading-relaxed mt-2">
                  <strong>Demand-Supply Gap:</strong> {enhancedContent['marketAspects-demandSupplyGap'] || s6.demandSupplyGap}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">4.2 Competition Analysis</h3>
              {renderEnhancedSubsection('marketAspects-competition', s6.competitorAnalysis)}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">4.3 Price Trends</h3>
              {renderEnhancedSubsection('marketAspects-priceTrends', s6.priceTrends)}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">4.4 Export Potential</h3>
              {renderEnhancedSubsection('marketAspects-exportPotential', s6.exportPotential)}
            </div>
            {s6.targetMarket && (
              <div>
                <h3 className="text-xl font-semibold mb-3">4.5 Target Market</h3>
                {renderEnhancedSubsection('marketAspects-targetMarket', s6.targetMarket)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 5: SWOT Analysis */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('5. SWOT ANALYSIS', 8)}
          {renderEnhancedContent('swotAnalysis', 'SWOT Analysis')}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-green-700">Strengths</h3>
              <ul className="list-disc list-inside space-y-1">
                {(Array.isArray(s8.strengths) ? s8.strengths : []).map((s: string, idx: number) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-orange-700">Weaknesses</h3>
              <ul className="list-disc list-inside space-y-1">
                {(Array.isArray(s8.weaknesses) ? s8.weaknesses : []).map((w: string, idx: number) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700">Opportunities</h3>
              <ul className="list-disc list-inside space-y-1">
                {(Array.isArray(s8.opportunities) ? s8.opportunities : []).map((o: string, idx: number) => (
                  <li key={idx}>{o}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3 text-red-700">Threats</h3>
              <ul className="list-disc list-inside space-y-1">
                {(Array.isArray(s8.threats) ? s8.threats : []).map((t: string, idx: number) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Section 6: Gap Analysis */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('6. NEED GAP ANALYSIS', 7)}
          {renderEnhancedContent('gapAnalysis', 'Gap Analysis')}
          {renderTable(
            ['Area', 'Existing Gap'],
            [
              ['Technology', s7.technologyGaps || 'N/A'],
              ['Infrastructure', s7.infrastructureGaps || 'N/A'],
              ['Skill', s7.skillGaps || 'N/A'],
              ['Marketing', s7.marketingGaps || 'N/A'],
              ['Finance', s7.financialGaps || 'N/A'],
            ]
          )}
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3">Justification for Intervention</h3>
            <p className="text-sm text-justify leading-relaxed">{s7.justificationForIntervention || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Section 7: CFC Details - Split into 2 pages if needed */}
      {(s10.name || s10.location || s10.plantAndMachinery || s10.manufacturingProcess || s10.capacity) && (
        <>
          {/* Page 1: CFC Overview, Plant & Machinery, Process, Capacity, Requirements */}
          {renderPageWrapper(
            <div>
              {renderSectionTitle('7. CFC - OPERATION & MANAGEMENT', 10)}
              {renderEnhancedContent('cfcDetails', 'CFC Details')}
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="text-xl font-semibold mb-3">7.1 CFC Overview</h3>
                  {renderTable(
                    ['Parameter', 'Details'],
                    [
                      ['CFC Name', s10.name || 'N/A'],
                      ['Location', s10.location || 'N/A'],
                      ['Land Area', s10.landDetails || 'N/A'],
                      ['Civil Works / Built-up Area', s10.civilWorks || 'N/A'],
                    ]
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">7.2 Plant & Machinery</h3>
                  <p className="text-justify leading-relaxed">{s10.plantAndMachinery || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">7.3 Manufacturing Process</h3>
                  <p className="text-justify leading-relaxed">{s10.manufacturingProcess || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">7.4 Capacity</h3>
                  <p>{s10.capacity || 'N/A'}</p>
                </div>
                <div className='flex gap-12 items-center justify-space-between w-full'>
                  <div>
                    <h4>Power Requirements</h4>
                    <p>{s10.powerRequirements || 'N/A'}</p>
                  </div>
                  <div>
                    <h4>Water Requirements</h4>
                    <p>{s10.waterRequirements || 'N/A'}</p>
                  </div>
                  <div>
                    <h4>Manpower Requirements</h4>
                    <p>{s10.manpowerRequirements || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page 2: Process Flow Diagram and Machinery Layout */}
          {renderPageWrapper(
            <div>
              {renderSectionTitle('7. CFC - OPERATION & MANAGEMENT (Continued)')}
              <div className="space-y-6 text-sm">
                {/* Process flow diagram and machinery images */}
                <div className="my-6">
                  <h4 className="text-lg font-semibold mb-3">📊 Process Flow Diagram</h4>
                  {renderImage(
                    'process-flow-diagram',
                    '',
                    'Process Flow',
                    'Manufacturing process flow',
                    'cfcDetails',
                    { manufacturingProcess: s10.manufacturingProcess, cfcName: s10.name, clusterName: s1.clusterName },
                    `Professional diagram showing manufacturing process flow for ${s10.name || 'the CFC'} at ${s1.clusterName || 'the cluster'}. Clean, professional business diagram style showing process steps.`
                  )}
                </div>
                <div className="my-6">
                  <h4 className="text-lg font-semibold mb-3">📸 Machinery Layout</h4>
                  {renderImage(
                    'machinery-layout',
                    '',
                    'Machinery Layout',
                    'CFC machinery layout and reference images',
                    'cfcDetails',
                    { plantAndMachinery: s10.plantAndMachinery, cfcName: s10.name, clusterName: s1.clusterName },
                    `Professional photograph or diagram showing machinery layout at ${s10.name || 'the CFC'} for ${s1.clusterName || 'the cluster'}. Modern industrial equipment arranged in a facility. Realistic, documentary style, business document quality.`
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Section 8: SPV Details - Split into 2 pages */}
      {(s11.spvName || s11.legalStatus || s11.memberUnits?.length > 0) && (
        <>
          {/* Page 1: SPV Profile and Shareholding Pattern */}
          {renderPageWrapper(
            <div>
              {renderSectionTitle('8. SPV MEMBER UNITS', 11)}
              {renderEnhancedContent('spvDetails', 'SPV Details')}
              <div className="space-y-6 text-sm">
                <div>
                  <h3 className="text-xl font-semibold mb-3">8.1 SPV Profile</h3>
                  {renderTable(
                    ['Parameter', 'Details'],
                    [
                      ['Name', s11.spvName || 'N/A'],
                      ['Legal Status', s11.legalStatus || 'N/A'],
                      ['Year of Incorporation', s11.yearOfIncorporation || 'N/A'],
                      ['Members', (s11.memberUnits?.length || 0) + ' member units'],
                    ]
                  )}
                </div>
                {s11.shareholdingPattern && Array.isArray(s11.shareholdingPattern) && s11.shareholdingPattern.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.2 Shareholding Pattern</h3>
                    {renderTable(
                      ['Stakeholder', 'Percentage (%)'],
                      s11.shareholdingPattern.map((s: any) => [s.stakeholder || 'N/A', `${s.percentage || 0}%`])
                    )}
                    {/* Pie chart for shareholding */}
                    <div className="my-6">
                      <h4 className="text-lg font-semibold mb-3">📊 Shareholding Pattern</h4>
                      {enhancedContent[`graphExplanation-shareholding`] && (
                        <div className="mb-3 p-3">
                          <p className="text-xs text-justify leading-relaxed" style={{ color: '#1F2937' }}>
                            {enhancedContent[`graphExplanation-shareholding`]}
                          </p>
                        </div>
                      )}
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={Array.isArray(s11.shareholdingPattern) ? s11.shareholdingPattern.map((s: any) => ({ name: s.stakeholder, value: s.percentage || 0 })) : []}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {Array.isArray(s11.shareholdingPattern) && s11.shareholdingPattern.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page 2: Member Units, Objectives, Roles, Board, Registrations */}
          {renderPageWrapper(
            <div>
              {renderSectionTitle('8. SPV MEMBER UNITS (Continued)')}
              <div className="space-y-6 text-sm">
                {s11.memberUnits && Array.isArray(s11.memberUnits) && s11.memberUnits.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.3 Member Units</h3>
                    {renderTable(
                      ['Sl. No', 'Unit Name', 'Registration'],
                      s11.memberUnits.map((u: any, idx: number) => [idx + 1, u.name || 'N/A', u.registration || 'N/A'])
                    )}
                  </div>
                )}
                {s11.objectives && Array.isArray(s11.objectives) && s11.objectives.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.4 SPV Objectives</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {s11.objectives.map((objective: string, idx: number) => (
                        <li key={idx}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s11.rolesAndResponsibilities && Array.isArray(s11.rolesAndResponsibilities) && s11.rolesAndResponsibilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.5 Roles and Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {s11.rolesAndResponsibilities.map((role: string, idx: number) => (
                        <li key={idx}>{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s11.boardOfDirectors && Array.isArray(s11.boardOfDirectors) && s11.boardOfDirectors.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.6 Board of Directors</h3>
                    {renderTable(
                      ['Name', 'Designation'],
                      s11.boardOfDirectors.map((director: any) => [director.name || 'N/A', director.designation || 'N/A'])
                    )}
                  </div>
                )}
                {s11.statutoryRegistrations && Array.isArray(s11.statutoryRegistrations) && s11.statutoryRegistrations.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.7 Statutory Registrations</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {s11.statutoryRegistrations.map((registration: string, idx: number) => (
                        <li key={idx}>{registration}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Section 9: Project Cost & Means of Finance */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('9. PROJECT COST & MEANS OF FINANCE', 12)}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>9.1 Project Cost</h3>
              {(() => {
                const totalCost = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) +
                  (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0) +
                  (s12.workingCapitalMargin || 0);
                return renderTable(
                  ['Component', 'Cost (₹ Lakhs)'],
                  [
                    ['Land', (s12.land || 0).toFixed(2)],
                    ['Building', (s12.building || 0).toFixed(2)],
                    ['Machinery', (s12.machinery || 0).toFixed(2)],
                    ['Utilities & Infrastructure', (s12.utilitiesAndInfrastructure || 0).toFixed(2)],
                    ['Preliminary & Pre-operative', (s12.preliminaryAndPreOperative || 0).toFixed(2)],
                    ['Working Capital Margin', (s12.workingCapitalMargin || 0).toFixed(2)],
                    ['Total Project Cost', totalCost.toFixed(2)],
                  ],
                  'Cost of Project & Means of Finance',
                  '1'
                );
              })()}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>9.2 Means of Finance</h3>
              {(() => {
                const totalFinance = (s13.spvContribution || 0) + (s13.governmentGrant || 0) +
                  (s13.bankLoan || 0) + (s13.otherSources || 0);
                return renderTable(
                  ['Source', 'Amount (₹ Lakhs)'],
                  [
                    ['SPV Contribution', (s13.spvContribution || 0).toFixed(2)],
                    ['Government Grant', (s13.governmentGrant || 0).toFixed(2)],
                    ['Bank Loan', (s13.bankLoan || 0).toFixed(2)],
                    ['Other Sources', (s13.otherSources || 0).toFixed(2)],
                    ['Total', totalFinance.toFixed(2)],
                  ],
                  undefined,
                  undefined
                );
              })()}
            </div>
            {/* Cost breakup chart */}
            <div className="my-6">
              <h4 className="text-lg font-semibold mb-3">📊 Cost Breakup</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Land', value: s12.land || 0 },
                      { name: 'Building', value: s12.building || 0 },
                      { name: 'Machinery', value: s12.machinery || 0 },
                      { name: 'Utilities', value: s12.utilitiesAndInfrastructure || 0 },
                      { name: 'Preliminary', value: s12.preliminaryAndPreOperative || 0 },
                      { name: 'Working Capital', value: s12.workingCapitalMargin || 0 },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'].map((color, idx) => (
                      <Cell key={`cell-${idx}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)} Lakhs`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Section 9.5: Operating Cost & Revenue */}
      {(s14.rawMaterialCost || s14.powerCost || s14.wages || s14.maintenance || s14.administrativeExpenses || s14.marketingExpenses || s14.annualProductionVolume || s14.annualSalesRealization) && (
        <div
          className="p-12 border-b-4 border-gray-800 page-break relative"
          style={{
            pageBreakAfter: 'always',
            padding: '2cm',
            minHeight: '29.7cm',
            fontFamily: 'Times New Roman, serif',
            border: '8px solid #2563EB',
            borderStyle: 'double',
            position: 'relative'
          }}
        >
          {/* Decorative border effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '2px solid #3B82F6',
              margin: '8px',
              borderRadius: '4px'
            }}
          />
          <div className="relative z-10">
            {renderSectionTitle('9.5 OPERATING COST & REVENUE', 14)}
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>9.5.1 Operating Costs</h3>
                {renderTable(
                  ['Cost Component', 'Amount (₹ Lakhs)'],
                  [
                    ['Raw Material Cost', s14.rawMaterialCost ? (s14.rawMaterialCost.toFixed(2)) : 'N/A'],
                    ['Power Cost', s14.powerCost ? (s14.powerCost.toFixed(2)) : 'N/A'],
                    ['Wages', s14.wages ? (s14.wages.toFixed(2)) : 'N/A'],
                    ['Maintenance', s14.maintenance ? (s14.maintenance.toFixed(2)) : 'N/A'],
                    ['Administrative Expenses', s14.administrativeExpenses ? (s14.administrativeExpenses.toFixed(2)) : 'N/A'],
                    ['Marketing Expenses', s14.marketingExpenses ? (s14.marketingExpenses.toFixed(2)) : 'N/A'],
                    ['Total Operating Cost',
                      ((s14.rawMaterialCost || 0) + (s14.powerCost || 0) + (s14.wages || 0) +
                        (s14.maintenance || 0) + (s14.administrativeExpenses || 0) + (s14.marketingExpenses || 0)) > 0
                        ? (((s14.rawMaterialCost || 0) + (s14.powerCost || 0) + (s14.wages || 0) +
                          (s14.maintenance || 0) + (s14.administrativeExpenses || 0) + (s14.marketingExpenses || 0))).toFixed(2)
                        : 'N/A'],
                  ]
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>9.5.2 Revenue Projections</h3>
                {renderTable(
                  ['Parameter', 'Value'],
                  [
                    ['Annual Production Volume', s14.annualProductionVolume ? `${s14.annualProductionVolume.toLocaleString('en-IN')} units` : 'N/A'],
                    ['Annual Sales Realization', s14.annualSalesRealization ? `₹${s14.annualSalesRealization.toFixed(2)} Lakhs` : 'N/A'],
                  ]
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 10: Financial Viability */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('10. FINANCIAL VIABILITY', 15)}
          {renderEnhancedContent('financialViability', 'Financial Viability')}
          <div className="space-y-6 text-sm">
            {(() => {
              // Define financialStatements at the start of this section
              const financialStatements = s15.financialStatements || {};
              
              return (
                <>
                  {/* Profit & Loss Statement - Removed duplicate, shown in Financial Statements section */}

                  {/* Financial Indicators - Summary only */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.2 Financial Indicators</h3>
                    {renderTable(
                      ['Indicator', 'Value'],
                      [
                        ['Break-even Point', s15.breakEvenPoint ? `${s15.breakEvenPoint}%` : 'N/A'],
                        ['IRR', s15.irr ? `${s15.irr}%` : 'N/A'],
                        ['NPV', s15.npv ? `₹${s15.npv.toFixed(2)} Lakhs` : 'N/A'],
                      ],
                      'Financial Indicators Summary',
                      undefined
                    )}
                    <p className="text-sm text-gray-600 mt-4" style={{ color: '#1F2937' }}>
                      Note: Detailed financial statements including Cash Flow Statement, Balance Sheet, Break Even Point, and NPV & IRR are provided in the Financial Statements section below.
                    </p>
                  </div>

                  {/* Sensitivity Analysis */}
                  {s15.sensitivityAnalysis && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">10.5 Sensitivity Analysis</h3>
                      <p className="text-justify leading-relaxed">{s15.sensitivityAnalysis}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Section 10.5: Project Implementation Schedule */}
      {(s16.startDate || (Array.isArray(s16.milestones) && s16.milestones.length > 0) || s16.totalImplementationPeriod) && (
        <div
          className="p-12 border-b-4 border-gray-800 page-break relative"
          style={{
            pageBreakAfter: 'always',
            padding: '2cm',
            minHeight: '29.7cm',
            fontFamily: 'Times New Roman, serif',
            border: '8px solid #2563EB',
            borderStyle: 'double',
            position: 'relative'
          }}
        >
          {/* Decorative border effect */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: '2px solid #3B82F6',
              margin: '8px',
              borderRadius: '4px'
            }}
          />
          <div className="relative z-10">
            {renderSectionTitle('10.5 PROJECT IMPLEMENTATION SCHEDULE', 16)}
            {renderEnhancedContent('implementationSchedule', 'Implementation Schedule')}
            <div className="space-y-6 text-sm">
              {s16.startDate && (
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.5.1 Project Start Date</h3>
                  <p className="text-justify leading-relaxed">{s16.startDate}</p>
                </div>
              )}
              {s16.milestones && s16.milestones.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.5.2 Implementation Milestones</h3>
                  {renderTable(
                    ['Activity', 'Time Required', 'Start Date', 'End Date'],
                    s16.milestones.map((m: any) => [
                      m.activity || 'N/A',
                      m.timeRequired || 'N/A',
                      m.startDate || 'N/A',
                      m.endDate || 'N/A',
                    ])
                  )}
                </div>
              )}
              {s16.totalImplementationPeriod && (
                <div>
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.5.3 Total Implementation Period</h3>
                  <p className="text-justify leading-relaxed">{s16.totalImplementationPeriod}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 11: Expected Impact */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('11. EXPECTED IMPACT', 17)}
          {renderEnhancedContent('expectedImpact', 'Expected Impact')}
          {renderTable(
            ['Parameter',  'Value'],
            [
              ['Employment', s17.employmentGeneration || 0],
              ['Turnover', `₹${(s17.turnoverGrowth || 0).toFixed(2)} Lakhs`],
              ['Export Growth', `${s17.exportGrowth || 0}%`],
              ['Income Enhancement', `${s17.incomeEnhancement || 0}%`],
            ]
          )}
          {s17.sustainabilityOutcomes && s17.sustainabilityOutcomes.length > 0 && (
            <div className="my-6">
              <h3 className="text-xl font-semibold mb-3">Sustainability Outcomes</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                {s17.sustainabilityOutcomes.map((outcome: string, idx: number) => (
                  <li key={idx}>{outcome}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Financial Statements - Detailed Section */}
      {(() => {
        const financialStatements = s15.financialStatements || {};
        const hasFinancialStatements = Object.keys(financialStatements).length > 0 || 
          s12.workingCapitalMargin || 
          s14.powerCost || 
          s15.profitAndLossProjections;

        if (!hasFinancialStatements) return null;

        return (
          <div
            className="p-12 border-b-4 border-gray-800 page-break relative"
            style={{
              pageBreakAfter: 'always',
              padding: '2cm',
              minHeight: '29.7cm',
              fontFamily: 'Times New Roman, serif',
              border: '8px solid #2563EB',
              borderStyle: 'double',
              position: 'relative'
            }}
          >
            {/* Decorative border effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                border: '2px solid #3B82F6',
                margin: '8px',
                borderRadius: '4px'
              }}
            />
            <div className="relative z-10">
              {renderSectionTitle('FINANCIAL STATEMENTS')}

              {/* Statement 1: Cost of Project & Means of Finance */}
              {(financialStatements.costOfProject || financialStatements.spvShare || financialStatements.stateGovtGrant || financialStatements.bankLoan || s12.totalProjectCost || s13.spvContribution || s13.governmentGrant || s13.bankLoan) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 1: Cost of Project & Means of Finance</h3>
                  {renderTable(
                    ['Particulars', 'Amount (₹ Lakhs)'],
                    [
                      ['Cost of Project', (financialStatements.costOfProject || s12.totalProjectCost || 0).toFixed(2)],
                      ['SPV Share', (financialStatements.spvShare || s13.spvContribution || 0).toFixed(2)],
                      ['State Govt. Grant', (financialStatements.stateGovtGrant || s13.governmentGrant || 0).toFixed(2)],
                      ['Bank Loan', (financialStatements.bankLoan || s13.bankLoan || 0).toFixed(2)],
                      ['Total', ((financialStatements.costOfProject || s12.totalProjectCost || 0) + 
                        (financialStatements.spvShare || s13.spvContribution || 0) + 
                        (financialStatements.stateGovtGrant || s13.governmentGrant || 0) + 
                        (financialStatements.bankLoan || s13.bankLoan || 0)).toFixed(2)],
                    ],
                    'Cost of Project & Means of Finance',
                    '1'
                  )}
                </div>
              )}

              {/* Statement 2: Assessment of Working Capital */}
              {(financialStatements.workingCapital || s12.workingCapitalMargin) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 2: Assessment of Working Capital</h3>
                  {(() => {
                    const wc = financialStatements.workingCapital || {};
                    const workingCapital = s12.workingCapitalMargin || 0;
                    return renderTable(
                      ['Particulars', 'Amount (₹ Lakhs)'],
                      [
                        ['Raw Materials', (wc.rawMaterials || (workingCapital * 0.4)).toFixed(2)],
                        ['Work in Progress', (wc.workInProgress || (workingCapital * 0.2)).toFixed(2)],
                        ['Finished Goods', (wc.finishedGoods || (workingCapital * 0.2)).toFixed(2)],
                        ['Debtors', (wc.debtors || (workingCapital * 0.15)).toFixed(2)],
                        ['Cash & Bank Balance', (wc.cashBankBalance || (workingCapital * 0.05)).toFixed(2)],
                        ['Total Current Assets', (workingCapital || Object.values(wc).reduce((sum: number, val: any) => sum + (val || 0), 0)).toFixed(2)],
                        ['Creditors', (wc.creditors || (workingCapital * 0.3)).toFixed(2)],
                        ['Net Working Capital', ((workingCapital * 0.7) || (workingCapital - (wc.creditors || 0))).toFixed(2)],
                      ],
                      'Assessment of Working Capital',
                      '2'
                    );
                  })()}
                </div>
              )}

              {/* Statement 3: Cost of Production & Profitability - Matching PDF format */}
              {(financialStatements.costOfProduction || s15.profitAndLossProjections) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 3: Cost of Production & Profitability</h3>
                  {(() => {
                    const cop = financialStatements.costOfProduction || {};
                    const rows: any[][] = [];
                    
                    // Sales Realization row
                    const salesRow = ['Sales Realisation', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cop[`year${year}`] || {};
                      salesRow.push((yearData.salesRealization || 0).toFixed(2));
                    }
                    rows.push(salesRow);
                    
                    // Total Cost row
                    const costRow = ['Total Cost', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cop[`year${year}`] || {};
                      costRow.push((yearData.totalCost || 0).toFixed(2));
                    }
                    rows.push(costRow);
                    
                    // Profit Before Tax row
                    const profitRow = ['Profit Before Tax', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cop[`year${year}`] || {};
                      profitRow.push((yearData.profitBeforeTax || 0).toFixed(2));
                    }
                    rows.push(profitRow);
                    
                    return renderTable(
                      ['Years', '1', '2', '3', '4', '5'],
                      rows,
                      'COST OF PRODUCTION & PROFITABILITY',
                      '3'
                    );
                  })()}
                </div>
              )}

              {/* Statement 4: Assumptions for Cost of Production & Profitability */}
              {(financialStatements.assumptions || s14.capacityUtilization || s14.rawMaterialCostPercentage) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 4: Assumptions for Cost of Production & Profitability</h3>
                  {(() => {
                    const assumptions: any[][] = [];
                    const assump = financialStatements.assumptions || {};
                    if (assump.capacityUtilizationYear1) assumptions.push(['Capacity Utilization (Year 1)', `${assump.capacityUtilizationYear1}%`]);
                    if (assump.capacityUtilizationYear2) assumptions.push(['Capacity Utilization (Year 2)', `${assump.capacityUtilizationYear2}%`]);
                    if (assump.capacityUtilizationYear3Onwards) assumptions.push(['Capacity Utilization (Year 3 onwards)', `${assump.capacityUtilizationYear3Onwards}%`]);
                    if (assump.rawMaterialCostPercentage) assumptions.push(['Raw Material Cost (% of Revenue)', `${assump.rawMaterialCostPercentage}%`]);
                    if (s14.capacityUtilization) {
                      if (s14.capacityUtilization.year1) assumptions.push(['Capacity Utilization (Year 1)', `${s14.capacityUtilization.year1}%`]);
                      if (s14.capacityUtilization.year2) assumptions.push(['Capacity Utilization (Year 2)', `${s14.capacityUtilization.year2}%`]);
                      if (s14.capacityUtilization.year3Onwards) assumptions.push(['Capacity Utilization (Year 3 onwards)', `${s14.capacityUtilization.year3Onwards}%`]);
                    }
                    if (s14.rawMaterialCostPercentage) assumptions.push(['Raw Material Cost (% of Revenue)', `${s14.rawMaterialCostPercentage}%`]);
                    if (assumptions.length > 0) {
                      return renderTable(
                        ['Assumption', 'Value'],
                        assumptions,
                        'Assumptions for Cost of Production & Profitability',
                        '4'
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Statement 5: Estimation of Power Cost */}
              {(financialStatements.powerCost || s14.powerCost) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 5: Estimation of Power Cost</h3>
                  {(() => {
                    const pc = financialStatements.powerCost || {};
                    return renderTable(
                      ['Particulars', 'Units', 'Rate (₹)', 'Amount (₹ Lakhs)'],
                      [
                        ['Connected Load', (pc.connectedLoad || s14.connectedLoad || 'N/A').toString(), 
                          (pc.ratePerUnit || s14.powerCost || 'N/A').toString(),
                          pc.annualCost ? pc.annualCost.toFixed(2) : (s14.monthlyConsumption && s14.powerCost ? ((s14.monthlyConsumption * s14.powerCost * 12) / 100000).toFixed(2) : 'N/A')],
                        ['Monthly Consumption', (pc.monthlyConsumption || s14.monthlyConsumption || 'N/A').toString(), 
                          (pc.ratePerUnit || s14.powerCost || 'N/A').toString(),
                          pc.monthlyConsumption && pc.ratePerUnit ? ((pc.monthlyConsumption * pc.ratePerUnit) / 100000).toFixed(2) : 'N/A'],
                        ['Annual Power Cost', 'N/A', 'N/A',
                          (pc.annualCost || (s14.monthlyConsumption && s14.powerCost ? ((s14.monthlyConsumption * s14.powerCost * 12) / 100000) : 0)).toFixed(2)],
                      ],
                      'Estimation of Power cost',
                      '5'
                    );
                  })()}
                </div>
              )}

              {/* Statement 6: Manpower Requirement & Estimation of Cost */}
              {(financialStatements.manpower || s14.manpowerRequirement) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 6: Manpower Requirement & Estimation of Cost</h3>
                  {(() => {
                    const manpower = financialStatements.manpower || s14.manpowerRequirement || [];
                    if (Array.isArray(manpower) && manpower.length > 0) {
                      return renderTable(
                        ['Category', 'No. of Employees', 'Annual Salary (₹)', 'Total Cost (₹ Lakhs)'],
                        manpower.map((mp: any) => [
                          mp.category || 'N/A',
                          mp.count || 0,
                          mp.annualSalary ? mp.annualSalary.toLocaleString('en-IN') : 'N/A',
                          mp.totalCost ? mp.totalCost.toFixed(2) : 'N/A',
                        ]),
                        'Manpower requirement & estimation of cost',
                        '6'
                      );
                    }
                    return <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>;
                  })()}
                </div>
              )}

              {/* Statement 7: Estimation of Depreciation */}
              {(financialStatements.depreciation || s14.depreciationDetails || (s12.building && s12.machinery)) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 7: Estimation of Depreciation</h3>
                  {(() => {
                    const dep = financialStatements.depreciation || s14.depreciationDetails || [];
                    if (Array.isArray(dep) && dep.length > 0) {
                      return renderTable(
                        ['Asset', 'Cost (₹ Lakhs)', 'Depreciation Rate (%)', 'Annual Depreciation (₹ Lakhs)'],
                        dep.map((d: any) => [
                          d.asset || 'N/A',
                          d.cost ? d.cost.toFixed(2) : 'N/A',
                          d.rate ? `${d.rate}%` : 'N/A',
                          d.annualDepreciation ? d.annualDepreciation.toFixed(2) : 'N/A',
                        ]),
                        'Estimation of Depreciation',
                        '7'
                      );
                    } else if (s12.building || s12.machinery) {
                      const buildingCost = s12.building || 0;
                      const machineryCost = s12.machinery || 0;
                      const buildingDepRate = s14.buildingDepreciationRate || 10;
                      const machineryDepRate = s14.machineryDepreciationRate || 15;
                      return renderTable(
                        ['Asset', 'Cost (₹ Lakhs)', 'Depreciation Rate (%)', 'Annual Depreciation (₹ Lakhs)'],
                        [
                          buildingCost > 0 ? ['Building', buildingCost.toFixed(2), `${buildingDepRate}%`, ((buildingCost * buildingDepRate / 100)).toFixed(2)] : null,
                          machineryCost > 0 ? ['Machinery', machineryCost.toFixed(2), `${machineryDepRate}%`, ((machineryCost * machineryDepRate / 100)).toFixed(2)] : null,
                          ['Total', (buildingCost + machineryCost).toFixed(2), 'N/A',
                            (((buildingCost * buildingDepRate / 100) + (machineryCost * machineryDepRate / 100))).toFixed(2)],
                        ].filter(row => row !== null) as any[][],
                        'Estimation of Depreciation',
                        '7'
                      );
                    }
                    return <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>;
                  })()}
                </div>
              )}

              {/* Statement 8: Calculation of Income Tax */}
              {(financialStatements.incomeTax || s15.profitAndLossProjections) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 8: Calculation of Income Tax</h3>
                  {(() => {
                    const it = financialStatements.incomeTax || {};
                    const rows: any[][] = [];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = it[`year${year}`] || {};
                      if (yearData.profitBeforeTax || (s15.profitAndLossProjections && s15.profitAndLossProjections[year - 1])) {
                        const profitBeforeTax = yearData.profitBeforeTax || (s15.profitAndLossProjections[year - 1]?.profit || 0);
                        const taxRate = yearData.taxRate || (profitBeforeTax > 1000000 ? 30 : profitBeforeTax > 500000 ? 25 : 20);
                        const taxAmount = yearData.taxAmount || ((profitBeforeTax * taxRate) / 100);
                        const profitAfterTax = yearData.profitAfterTax || (profitBeforeTax - taxAmount);
                        rows.push([
                          `Year ${year}`,
                          profitBeforeTax.toFixed(2),
                          `${taxRate}%`,
                          taxAmount.toFixed(2),
                          profitAfterTax.toFixed(2),
                        ]);
                      }
                    }
                    if (rows.length > 0) {
                      return renderTable(
                        ['Year', 'Profit Before Tax (₹ Lakhs)', 'Tax Rate (%)', 'Tax Amount (₹ Lakhs)', 'Profit After Tax (₹ Lakhs)'],
                        rows,
                        'Calculation of Income Tax',
                        '8'
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Statement 9: Projected Cash Flow Statement - Matching PDF format */}
              {(financialStatements.cashFlow || s15.cashFlowProjections) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 9: Projected Cash Flow Statement</h3>
                  {(() => {
                    const cf = financialStatements.cashFlow || {};
                    const totalProjectCost = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) +
                      (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0) +
                      (s12.workingCapitalMargin || 0);
                    const spvShare = financialStatements.spvShare || s13.spvContribution || 0;
                    const stateGrant = financialStatements.stateGovtGrant || s13.governmentGrant || 0;
                    const workingCapitalLoan = s13.bankLoan ? (s13.bankLoan * 0.1) : 30; // Estimate 10% of bank loan as WC loan
                    const workingCapital = s12.workingCapitalMargin || 0;
                    
                    const rows: any[][] = [];
                    
                    // Source Of Funds
                    rows.push(['Source Of Funds', '', '', '', '', '', '']);
                    rows.push(['SPV Share', spvShare.toFixed(2), '', '', '', '', '']);
                    rows.push(['State Govt. Grant', stateGrant.toFixed(2), '', '', '', '', '']);
                    
                    // Profit Before Int.,Dep. & Tax for each year
                    const profitRow = ['Profit Before Int.,Dep. & Tax', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cf[`year${year}`] || (s15.cashFlowProjections && s15.cashFlowProjections[year - 1]) || {};
                      const profitBeforeTax = yearData.profitBeforeTax || (financialStatements.costOfProduction?.[`year${year}`]?.profitBeforeTax || 0);
                      profitRow.push(profitBeforeTax.toFixed(2));
                    }
                    rows.push(profitRow);
                    
                    // Increase in W.C.Loan
                    const wcLoanRow = ['Increase in W.C.Loan', workingCapitalLoan.toFixed(2), '0.00', '0.00', '0.00', '0.00', '0.00'];
                    rows.push(wcLoanRow);
                    
                    // Total Source - PR. PERIOD is one-time funding only, Years 1-5 are profit only
                    const totalSourcePR = spvShare + stateGrant + workingCapitalLoan;
                    rows.push(['Total', totalSourcePR.toFixed(2), 
                      (cf.year1?.profitBeforeTax || 0).toFixed(2),
                      (cf.year2?.profitBeforeTax || 0).toFixed(2),
                      (cf.year3?.profitBeforeTax || 0).toFixed(2),
                      (cf.year4?.profitBeforeTax || 0).toFixed(2),
                      (cf.year5?.profitBeforeTax || 0).toFixed(2),
                    ]);
                    rows.push(['', '', '', '', '', '', '']);
                    
                    // Uses
                    rows.push(['Uses', '', '', '', '', '', '']);
                    rows.push(['Inc. in Capital Expenditure', totalProjectCost.toFixed(2), '', '', '', '', '']);
                    rows.push(['Deposits & advances (as per Statement 1.1)', (s12.preliminaryAndPreOperative || 0).toFixed(2), '', '', '', '', '']);
                    
                    // Increase in W.Capital
                    const wcIncreaseRow = ['Increase in W.Capital', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cf[`year${year}`] || {};
                      wcIncreaseRow.push((yearData.workingCapitalIncrease || (year === 1 ? workingCapital * 0.05 : 0)).toFixed(2));
                    }
                    rows.push(wcIncreaseRow);
                    
                    // Provision For Taxation
                    const taxRow = ['Provision For Taxation', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = financialStatements.incomeTax?.[`year${year}`] || {};
                      taxRow.push((yearData.taxAmount || 0).toFixed(2));
                    }
                    rows.push(taxRow);
                    
                    // Total Uses
                    const totalUsesBase = totalProjectCost + (s12.preliminaryAndPreOperative || 0);
                    rows.push(['Total', totalUsesBase.toFixed(2),
                      (parseFloat(wcIncreaseRow[2] || '0') + parseFloat(taxRow[2] || '0')).toFixed(2),
                      (parseFloat(wcIncreaseRow[3] || '0') + parseFloat(taxRow[3] || '0')).toFixed(2),
                      (parseFloat(wcIncreaseRow[4] || '0') + parseFloat(taxRow[4] || '0')).toFixed(2),
                      (parseFloat(wcIncreaseRow[5] || '0') + parseFloat(taxRow[5] || '0')).toFixed(2),
                      (parseFloat(wcIncreaseRow[6] || '0') + parseFloat(taxRow[6] || '0')).toFixed(2),
                    ]);
                    rows.push(['', '', '', '', '', '', '']);
                    
                    // Surplus - PR. PERIOD is funding minus capital expenditure, Years 1-5 are profit minus uses
                    // totalSourcePR already declared above, reuse it
                    const surplusPR = totalSourcePR - totalUsesBase;
                    const surplusRow = ['Surplus', surplusPR.toFixed(2)];
                    for (let year = 1; year <= 5; year++) {
                      const source = parseFloat(rows[rows.length - 2][year + 1] || '0');
                      const uses = parseFloat(rows[rows.length - 1][year + 1] || '0');
                      surplusRow.push((source - uses).toFixed(2));
                    }
                    rows.push(surplusRow);
                    
                    // Opening Balance - starts at 0, then accumulates surplus from previous year
                    const openingRow = ['Opening Balance', '0.00', '0.00'];
                    let runningBalance = parseFloat(surplusRow[1] || '0'); // Start with PR. PERIOD surplus
                    for (let year = 2; year <= 5; year++) {
                      runningBalance += parseFloat(surplusRow[year] || '0');
                      openingRow.push(runningBalance.toFixed(2));
                    }
                    rows.push(openingRow);
                    
                    // Closing Balance - cumulative surplus including PR. PERIOD
                    const closingRow = ['Closing Balance', '0.00'];
                    runningBalance = parseFloat(surplusRow[1] || '0'); // Start with PR. PERIOD surplus
                    for (let year = 1; year <= 5; year++) {
                      runningBalance += parseFloat(surplusRow[year + 1] || '0');
                      closingRow.push(runningBalance.toFixed(2));
                    }
                    rows.push(closingRow);
                    
                    return renderTable(
                      ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5'],
                      rows,
                      'PROJECTED CASH FLOW STATEMENT',
                      '9'
                    );
                  })()}
                </div>
              )}

              {/* Statement 10: Projected Balance Sheet - Matching PDF format */}
              {(financialStatements.balanceSheet || s15.balanceSheetProjections) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 10: Projected Balance Sheet</h3>
                  {(() => {
                    const bs = financialStatements.balanceSheet || {};
                    const spvShare = financialStatements.spvShare || s13.spvContribution || 0;
                    const stateGrant = financialStatements.stateGovtGrant || s13.governmentGrant || 0;
                    const workingCapitalLoan = s13.bankLoan ? (s13.bankLoan * 0.1) : 30;
                    const totalProjectCost = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) +
                      (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0);
                    const grossBlock = totalProjectCost;
                    
                    const rows: any[][] = [];
                    
                    // Liabilities
                    rows.push(['Liabilities', '', '', '', '', '', '']);
                    rows.push(['SPV Share', spvShare.toFixed(2), spvShare.toFixed(2), spvShare.toFixed(2), spvShare.toFixed(2), spvShare.toFixed(2), spvShare.toFixed(2)]);
                    rows.push(['State Govt. Grant', stateGrant.toFixed(2), stateGrant.toFixed(2), stateGrant.toFixed(2), stateGrant.toFixed(2), stateGrant.toFixed(2), stateGrant.toFixed(2)]);
                    
                    // Reserves & Surplus
                    const reservesRow = ['Reserves & Surplus', ''];
                    let cumulativeProfit = 0;
                    for (let year = 1; year <= 5; year++) {
                      const yearData = financialStatements.incomeTax?.[`year${year}`] || {};
                      cumulativeProfit += (yearData.profitAfterTax || 0);
                      reservesRow.push(cumulativeProfit.toFixed(2));
                    }
                    rows.push(reservesRow);
                    
                    rows.push(['W.C.Borrowings', workingCapitalLoan.toFixed(2), workingCapitalLoan.toFixed(2), workingCapitalLoan.toFixed(2), workingCapitalLoan.toFixed(2), workingCapitalLoan.toFixed(2), workingCapitalLoan.toFixed(2)]);
                    
                    // Current liabilities
                    const currentLiabRow = ['Current liabilities', ''];
                    for (let year = 1; year <= 5; year++) {
                      currentLiabRow.push((0.75 + year * 0.08).toFixed(2)); // Small increment each year
                    }
                    rows.push(currentLiabRow);
                    
                    // Total Liabilities
                    const totalLiabRow = ['Total', ''];
                    for (let year = 0; year <= 5; year++) {
                      const spv = spvShare;
                      const grant = stateGrant;
                      const reserves = year === 0 ? 0 : parseFloat(reservesRow[year + 1] || '0');
                      const wc = workingCapitalLoan;
                      const current = year === 0 ? 0 : parseFloat(currentLiabRow[year + 1] || '0');
                      totalLiabRow.push((spv + grant + reserves + wc + current).toFixed(2));
                    }
                    rows.push(totalLiabRow);
                    rows.push(['', '', '', '', '', '', '']);
                    
                    // Assets
                    rows.push(['Assets', '', '', '', '', '', '']);
                    rows.push(['Gross Block', grossBlock.toFixed(2), grossBlock.toFixed(2), grossBlock.toFixed(2), grossBlock.toFixed(2), grossBlock.toFixed(2), grossBlock.toFixed(2)]);
                    
                    // Less: Accu. Depreciation
                    const depRow = ['Less: Accu. Depreciation', ''];
                    let cumulativeDep = 0;
                    const annualDep = (s12.building || 0) * 0.1 + (s12.machinery || 0) * 0.15;
                    for (let year = 1; year <= 5; year++) {
                      cumulativeDep += annualDep;
                      depRow.push(cumulativeDep.toFixed(2));
                    }
                    rows.push(depRow);
                    
                    // Net Block
                    const netBlockRow = ['Net Block', grossBlock.toFixed(2)];
                    for (let year = 1; year <= 5; year++) {
                      netBlockRow.push((grossBlock - parseFloat(depRow[year + 1] || '0')).toFixed(2));
                    }
                    rows.push(netBlockRow);
                    
                    rows.push(['Deposits', (s12.preliminaryAndPreOperative || 0).toFixed(2), (s12.preliminaryAndPreOperative || 0).toFixed(2), (s12.preliminaryAndPreOperative || 0).toFixed(2), (s12.preliminaryAndPreOperative || 0).toFixed(2), (s12.preliminaryAndPreOperative || 0).toFixed(2), (s12.preliminaryAndPreOperative || 0).toFixed(2)]);
                    
                    // Current Assets
                    const currentAssetsRow = ['Current Assets', ''];
                    for (let year = 1; year <= 5; year++) {
                      const wc = s12.workingCapitalMargin || 0;
                      currentAssetsRow.push((wc * (1 + year * 0.05)).toFixed(2)); // Growing current assets
                    }
                    rows.push(currentAssetsRow);
                    
                    // Closing Balance (from cash flow)
                    const closingRow = ['Closing Balance', '0.00'];
                    let runningBalance = 0;
                    for (let year = 1; year <= 5; year++) {
                      const yearData = financialStatements.cashFlow?.[`year${year}`] || {};
                      runningBalance += (yearData.netCashFlow || 0);
                      closingRow.push(runningBalance.toFixed(2));
                    }
                    rows.push(closingRow);
                    
                    // Total Assets
                    const totalAssetsRow = ['Total', ''];
                    for (let year = 0; year <= 5; year++) {
                      const netBlock = year === 0 ? grossBlock : parseFloat(netBlockRow[year + 1] || '0');
                      const deposits = s12.preliminaryAndPreOperative || 0;
                      const current = year === 0 ? 0 : parseFloat(currentAssetsRow[year + 1] || '0');
                      const closing = year === 0 ? 0 : parseFloat(closingRow[year + 1] || '0');
                      totalAssetsRow.push((netBlock + deposits + current + closing).toFixed(2));
                    }
                    rows.push(totalAssetsRow);
                    
                    return renderTable(
                      ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5'],
                      rows,
                      'PROJECTED BALANCE SHEET',
                      '10'
                    );
                  })()}
                </div>
              )}

              {/* Statement 11: Estimation of Break Even Point - Matching PDF format */}
              {(financialStatements.breakEven || s15.breakEvenPoint || financialStatements.costOfProduction) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 11: Estimation of Break Even Point</h3>
                  {(() => {
                    const be = financialStatements.breakEven || {};
                    const cop = financialStatements.costOfProduction || {};
                    const rows: any[][] = [];
                    
                    // Fixed Expenses
                    rows.push(['Fixed Expenses', '', '', '', '', '', '']);
                    
                    // Salary for Executives
                    const salaryRow = ['Salary for Executives', ''];
                    let baseSalary = financialStatements.manpower?.find((m: any) => m.category?.toLowerCase().includes('executive'))?.totalCost || 39.54;
                    for (let year = 1; year <= 5; year++) {
                      salaryRow.push((baseSalary * (1 + (year - 1) * 0.05)).toFixed(2)); // 5% growth
                    }
                    rows.push(salaryRow);
                    
                    rows.push(['Preliminary expenses', '0.05', '0.05', '0.05', '0.05', '0.05', '0.05']);
                    
                    // Depreciation
                    const depRow = ['Depreciation', ''];
                    const annualDep = (s12.building || 0) * 0.1 + (s12.machinery || 0) * 0.15;
                    for (let year = 1; year <= 5; year++) {
                      depRow.push(annualDep.toFixed(2));
                    }
                    rows.push(depRow);
                    
                    // Total Fixed Expenses (A)
                    const totalFixedRow = ['Total( A )', ''];
                    for (let year = 1; year <= 5; year++) {
                      const salary = parseFloat(salaryRow[year + 1] || '0');
                      const prelim = 0.05;
                      const dep = annualDep;
                      totalFixedRow.push((salary + prelim + dep).toFixed(2));
                    }
                    rows.push(totalFixedRow);
                    rows.push(['', '', '', '', '', '', '']);
                    
                    // Variable Expenses
                    rows.push(['Variable Expenses', '', '', '', '', '', '']);
                    
                    // Cost Of Raw materials and Consumables
                    const rawMatRow = ['Cost Of Raw materials and Consumables', ''];
                    let baseRawMat = financialStatements.costOfProduction?.year1?.totalCost ? 
                      financialStatements.costOfProduction.year1.totalCost * 0.5 : 299.77;
                    for (let year = 1; year <= 5; year++) {
                      rawMatRow.push((baseRawMat * (1 + (year - 1) * 0.15)).toFixed(2)); // 15% growth
                    }
                    rows.push(rawMatRow);
                    
                    // Cost Of Power
                    const powerRow = ['Cost Of Power', ''];
                    let basePower = financialStatements.powerCost?.annualCost || s14.powerCost || 31.13;
                    for (let year = 1; year <= 5; year++) {
                      powerRow.push((basePower * (1 + (year - 1) * 0.15)).toFixed(2));
                    }
                    rows.push(powerRow);
                    
                    // Wages
                    const wagesRow = ['Wages', ''];
                    let baseWages = financialStatements.manpower?.find((m: any) => m.category?.toLowerCase().includes('worker'))?.totalCost || s14.wages || 39.54;
                    for (let year = 1; year <= 5; year++) {
                      wagesRow.push((baseWages * (1 + (year - 1) * 0.05)).toFixed(2));
                    }
                    rows.push(wagesRow);
                    
                    // Repairs & Maintenance
                    const repairsRow = ['Repairs & Maintenance', ''];
                    let baseRepairs = (s12.machinery || 0) * 0.01 || 8.46;
                    for (let year = 1; year <= 5; year++) {
                      repairsRow.push((baseRepairs * (1 + (year - 1) * 0.1)).toFixed(2));
                    }
                    rows.push(repairsRow);
                    
                    // Administrative Expenses
                    const adminRow = ['Administrative Expenses', ''];
                    let baseAdmin = s14.administrativeExpenses || 20.46;
                    for (let year = 1; year <= 5; year++) {
                      adminRow.push((baseAdmin * (1 + (year - 1) * 0.15)).toFixed(2));
                    }
                    rows.push(adminRow);
                    
                    // Selling and Marketing Expenses
                    const marketingRow = ['Selling and Marketing Expenses', ''];
                    let baseMarketing = s14.marketingExpenses || 34.09;
                    for (let year = 1; year <= 5; year++) {
                      marketingRow.push((baseMarketing * (1 + (year - 1) * 0.15)).toFixed(2));
                    }
                    rows.push(marketingRow);
                    
                    // Interest on Working Capital Loan
                    const interestRow = ['Interest on Working Capital Loan', ''];
                    const wcInterest = (s13.bankLoan || 0) * 0.12 * 0.1 || 3.60; // 12% of 10% of bank loan
                    for (let year = 1; year <= 5; year++) {
                      interestRow.push(wcInterest.toFixed(2));
                    }
                    rows.push(interestRow);
                    
                    // Total Variable Expenses (B)
                    const totalVarRow = ['Total( B )', ''];
                    for (let year = 1; year <= 5; year++) {
                      const rawMat = parseFloat(rawMatRow[year + 1] || '0');
                      const power = parseFloat(powerRow[year + 1] || '0');
                      const wages = parseFloat(wagesRow[year + 1] || '0');
                      const repairs = parseFloat(repairsRow[year + 1] || '0');
                      const admin = parseFloat(adminRow[year + 1] || '0');
                      const marketing = parseFloat(marketingRow[year + 1] || '0');
                      const interest = wcInterest;
                      totalVarRow.push((rawMat + power + wages + repairs + admin + marketing + interest).toFixed(2));
                    }
                    rows.push(totalVarRow);
                    rows.push(['', '', '', '', '', '', '']);
                    
                    // Sales Realisation
                    const salesRow = ['Sales Realisation', ''];
                    for (let year = 1; year <= 5; year++) {
                      const yearData = cop[`year${year}`] || {};
                      salesRow.push((yearData.salesRealization || 0).toFixed(2));
                    }
                    rows.push(salesRow);
                    
                    // Break Even Point
                    const bepRow = ['Break Even Point', ''];
                    for (let year = 1; year <= 5; year++) {
                      const fixed = parseFloat(totalFixedRow[year + 1] || '0');
                      const variable = parseFloat(totalVarRow[year + 1] || '0');
                      const sales = parseFloat(salesRow[year + 1] || '1');
                      const contribution = sales - variable;
                      const bep = contribution > 0 ? (fixed / contribution) * 100 : 0;
                      bepRow.push(`${bep.toFixed(0)}%`);
                    }
                    rows.push(bepRow);
                    
                    return renderTable(
                      ['Years', '1', '2', '3', '4', '5'],
                      rows,
                      'ESTIMATION OF BREAK-EVEN POINT',
                      '11'
                    );
                  })()}
                </div>
              )}

              {/* Statement 12: Estimation of NPV & IRR - Matching PDF format */}
              {(financialStatements.npvIrr || s15.npv || s15.irr || financialStatements.cashFlow) && (
                <div className="my-6">
                  <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Statement 12: Estimation of NPV & IRR</h3>
                  {(() => {
                    const npvIrr = financialStatements.npvIrr || {};
                    const cf = financialStatements.cashFlow || {};
                    const totalProjectCost = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) +
                      (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0) +
                      (s12.workingCapitalMargin || 0);
                    
                    const rows: any[][] = [];
                    
                    // Cash Out Flow
                    rows.push(['Cash Out Flow', '', '', '', '', '', '', '']);
                    rows.push(['Capital Expenditure', totalProjectCost.toFixed(2), '', '', '', '', '', '']);
                    rows.push(['Preliminary & Preoperative Expenses', (s12.preliminaryAndPreOperative || 0).toFixed(2), '', '', '', '', '', '']);
                    rows.push(['Working Capital Margin', (s12.workingCapitalMargin || 0).toFixed(2), '', '', '', '', '', '']);
                    rows.push(['Total', (totalProjectCost + (s12.preliminaryAndPreOperative || 0) + (s12.workingCapitalMargin || 0)).toFixed(2), '0.00', '0.00', '0.00', '0.00', '0.00', '']);
                    rows.push(['', '', '', '', '', '', '', '']);
                    
                    // Cash Inflow
                    rows.push(['Cash Inflow', '', '', '', '', '', '', '']);
                    
                    // Profit After Tax
                    const profitAfterTaxRow = ['Profit After Tax', ''];
                    for (let year = 1; year <= 6; year++) {
                      if (year <= 5) {
                        const yearData = financialStatements.incomeTax?.[`year${year}`] || {};
                        profitAfterTaxRow.push((yearData.profitAfterTax || 0).toFixed(2));
                      } else {
                        // Year 6 same as Year 5
                        const year5Data = financialStatements.incomeTax?.year5 || {};
                        profitAfterTaxRow.push((year5Data.profitAfterTax || 0).toFixed(2));
                      }
                    }
                    rows.push(profitAfterTaxRow);
                    
                    // Depreciation
                    const depRow = ['Depreciation', ''];
                    const annualDep = (s12.building || 0) * 0.1 + (s12.machinery || 0) * 0.15;
                    for (let year = 1; year <= 6; year++) {
                      depRow.push(annualDep.toFixed(2));
                    }
                    rows.push(depRow);
                    
                    rows.push(['W.C.Margin', '', '', '', '', '', '', '']);
                    rows.push(['Residual Value Of F.Assets', '', '', '', '', '', '', '']);
                    rows.push(['', '', '', '', '', '', '', '']);
                    
                    // Total Cash Inflow
                    const totalInflowRow = ['Total', '0.00'];
                    for (let year = 1; year <= 6; year++) {
                      const profit = parseFloat(profitAfterTaxRow[year + 1] || '0');
                      const dep = annualDep;
                      totalInflowRow.push((profit + dep).toFixed(2));
                    }
                    rows.push(totalInflowRow);
                    rows.push(['', '', '', '', '', '', '', '']);
                    
                    // Net Cash Flow - PR. PERIOD is negative (outflow), Years 1-6 are positive (inflow)
                    const totalOutflow = totalProjectCost + (s12.preliminaryAndPreOperative || 0) + (s12.workingCapitalMargin || 0);
                    const netCashFlowRow = ['Net Cash Flow', `-${totalOutflow.toFixed(2)}`];
                    for (let year = 1; year <= 6; year++) {
                      netCashFlowRow.push(totalInflowRow[year + 1] || '0.00');
                    }
                    rows.push(netCashFlowRow);
                    rows.push(['', '', '', '', '', '', '', '']);
                    
                    // NPV and IRR
                    rows.push(['Net Present Value', npvIrr.npv ? `Rs.${npvIrr.npv.toFixed(2)} lakhs` : (s15.npv ? `Rs.${s15.npv.toFixed(2)} lakhs` : 'N/A'), '', '', '', '', '', '']);
                    rows.push(['at 8% discount rate', '', '', '', '', '', '', '']);
                    rows.push(['Internal Rate of Return', npvIrr.irr ? `${npvIrr.irr.toFixed(2)}%` : (s15.irr ? `${s15.irr.toFixed(2)}%` : 'N/A'), '', '', '', '', '', '']);
                    
                    return renderTable(
                      ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5', '6'],
                      rows,
                      'ESTIMATION OF NET PRESENT VALUE AND INTERNAL RATE OF RETURN',
                      '12'
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Conclusion */}
      <div
        className="p-12 border-b-4 border-gray-800 page-break relative"
        style={{
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif',
          border: '8px solid #2563EB',
          borderStyle: 'double',
          position: 'relative'
        }}
      >
        {/* Decorative border effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '2px solid #3B82F6',
            margin: '8px',
            borderRadius: '4px'
          }}
        />
        <div className="relative z-10">
          {renderSectionTitle('CONCLUSION')}
          {renderEnhancedContent('conclusion', 'Conclusion')}
          {content.conclusion ? (
            <div className="prose max-w-none text-sm leading-relaxed">
              <FormattedText text={content.conclusion} />
            </div>
          ) : (
            // <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
            <span></span>
          )}
        </div>
      </div>

      {/* Annexures Cover Page - Always show for upload functionality */}
      {(() => {
        const hasAnnexures = clusterData.step18?.spvRegistration || clusterData.step18?.landDocuments ||
          clusterData.step18?.buildingEstimates || clusterData.step18?.machineryQuotations ||
          clusterData.step18?.memberRegistrations ||
          (clusterData.step18?.supportingDocuments && clusterData.step18.supportingDocuments.length > 0);

        return (
          <>
            {/* Annexures Cover Page */}
            <div
              className="min-h-[29.7cm] flex flex-col justify-center items-center p-12 border-b-4 border-gray-800 page-break relative"
              style={{
                pageBreakAfter: 'always',
                minHeight: '29.7cm',
                padding: '3cm 2cm',
                fontFamily: 'Times New Roman, serif',
                border: '8px solid #2563EB',
                borderStyle: 'double',
                position: 'relative'
              }}
            >
              {/* Decorative border effect */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  border: '2px solid #3B82F6',
                  margin: '8px',
                  borderRadius: '4px'
                }}
              />
              <div className="relative z-10 w-full flex flex-col items-center justify-center">
                {renderSectionTitle('ANNEXURES', 18)}
                {s1.clusterName && (
                  <h2 className="text-3xl font-semibold mb-4 mt-4" style={{ color: '#059669', letterSpacing: '0.05em' }}>
                    - {s1.clusterName.toUpperCase()} -
                  </h2>
                )}

                {/* Upload Section - Always show for uploading documents */}
                {/* <div className="mt-8 w-full max-w-2xl no-print">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Upload Annexure Documents</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { type: 'spvRegistration', label: 'SPV Registration', index: 1 },
                        { type: 'landDocuments', label: 'Land Documents', index: 2 },
                        { type: 'buildingEstimates', label: 'Building Estimates', index: 3 },
                        { type: 'machineryQuotations', label: 'Machinery Quotations', index: 4 },
                        { type: 'memberRegistrations', label: 'Member Registrations', index: 5 },
                        { type: 'supportingDocuments', label: 'Supporting Documents', index: 6 },
                      ].map(({ type, label }) => {
                        const isUploading = uploadingDocuments[type];
                        return (
                          <div key={type} className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">{label}</label>
                            <input
                              ref={(el) => (annexureFileInputRefs.current[type] = el)}
                              type="file"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await handleAnnexureUpload(type, file);
                                if (annexureFileInputRefs.current[type]) {
                                  annexureFileInputRefs.current[type]!.value = '';
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => annexureFileInputRefs.current[type]?.click()}
                              disabled={isUploading}
                              className="w-full"
                            >
                              {isUploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload {label}
                                </>
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Helper function to get file URL */}
            {(() => {
              const getFileUrl = (file: any): string | null => {
                if (!file) return null;

                // If it's an object with url properties (from API response)
                if (typeof file === 'object' && file !== null && !(file instanceof File)) {
                  // Check common URL property names
                  const url = file.documentUrl || file.url || file.secureUrl || file.secure_url || file.fileUrl;
                  if (url && typeof url === 'string') {
                    return url;
                  }
                }

                // If it's already a URL string
                if (typeof file === 'string') {
                  // Check if it's a full URL (including Cloudinary URLs) - HIGHEST PRIORITY
                  // Cloudinary URLs should be used directly without modification
                  if (file.startsWith('http://') || file.startsWith('https://')) {
                    // Return the URL directly - works for Cloudinary and any other CDN
                    return file;
                  }

                  // Legacy support: Check if it's a relative path starting with /uploads/
                  // This handles old data that may still use local paths
                  if (file.startsWith('/uploads/')) {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const serverBaseUrl = apiBaseUrl.replace('/api', '');
                    return `${serverBaseUrl}${file}`;
                  }

                  // Legacy support: If it's just a filename without path, try local uploads
                  // This is for backwards compatibility only - new uploads use Cloudinary URLs
                  if (file.includes('.') && !file.includes('/')) {
                    // Log a warning since this path shouldn't be used for new uploads
                    console.warn(`⚠️ Document "${file}" appears to be a local filename. New documents should use Cloudinary URLs.`);
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const serverBaseUrl = apiBaseUrl.replace('/api', '');
                    return `${serverBaseUrl}/uploads/documents/${encodeURIComponent(file)}`;
                  }

                  // Legacy support: If it's a path starting with /, try to serve it directly
                  if (file.startsWith('/')) {
                    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const serverBaseUrl = apiBaseUrl.replace('/api', '');
                    return `${serverBaseUrl}${file}`;
                  }

                  return null;
                }

                // If it's a File object, create object URL
                if (file instanceof File) {
                  return URL.createObjectURL(file);
                }

                return null;
              };

              const isImageFile = (filename: string): boolean => {
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
                return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
              };

              const isPdfFile = (filename: string): boolean => {
                return filename.toLowerCase().endsWith('.pdf');
              };

              // Collect all annexure files
              const annexureFiles: Array<{ title: string, file: any, index: number }> = [];

              if (clusterData.step18?.spvRegistration) {
                annexureFiles.push({ title: 'SPV Registration', file: clusterData.step18.spvRegistration, index: 1 });
              }
              if (clusterData.step18?.landDocuments) {
                annexureFiles.push({ title: 'Land Documents', file: clusterData.step18.landDocuments, index: 2 });
              }
              if (clusterData.step18?.buildingEstimates) {
                annexureFiles.push({ title: 'Building Estimates', file: clusterData.step18.buildingEstimates, index: 3 });
              }
              if (clusterData.step18?.machineryQuotations) {
                annexureFiles.push({ title: 'Machinery Quotations', file: clusterData.step18.machineryQuotations, index: 4 });
              }
              if (clusterData.step18?.memberRegistrations) {
                annexureFiles.push({ title: 'Member Registrations', file: clusterData.step18.memberRegistrations, index: 5 });
              }
              if (clusterData.step18?.supportingDocuments && Array.isArray(clusterData.step18.supportingDocuments)) {
                clusterData.step18.supportingDocuments.forEach((doc: any, idx: number) => {
                  annexureFiles.push({ title: `Supporting Document ${idx + 1}`, file: doc, index: 6 + idx });
                });
              }

              return annexureFiles.map((annexure, idx) => {
                const fileUrl = getFileUrl(annexure.file);
                const fileName = typeof annexure.file === 'string' ? annexure.file : annexure.file?.name || `Document ${annexure.index}`;
                const isImage = isImageFile(fileName);
                const isPdf = isPdfFile(fileName);

                // Debug logging
                if (fileUrl) {
                  console.log(`📄 Annexure ${annexure.index} (${annexure.title}):`, {
                    originalFile: annexure.file,
                    fileName,
                    fileUrl,
                    isCloudinary: fileUrl.includes('cloudinary.com'),
                    isStaticRoute: fileUrl.includes('/uploads/'),
                  });
                } else {
                  console.warn(`⚠️ No file URL for Annexure ${annexure.index} (${annexure.title}):`, annexure.file);
                }

                return (
                  <div
                    key={idx}
                    className="p-12 border-b-4 border-gray-800 page-break"
                    style={{
                      pageBreakAfter: idx < annexureFiles.length - 1 ? 'always' : 'auto',
                      padding: '2cm',
                      minHeight: '29.7cm',
                      fontFamily: 'Times New Roman, serif'
                    }}
                  >
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>
                        Annexure {annexure.index}: {annexure.title}
                      </h3>
                    </div>

                    {fileUrl ? (
                      <div className="w-full" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                        {isImage ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={fileUrl}
                              alt={annexure.title}
                              className="max-w-full max-h-full object-contain"
                              style={{ maxHeight: 'calc(29.7cm - 8cm)' }}
                              onError={(e) => {
                                console.error('Failed to load image:', fileUrl);
                                e.currentTarget.style.display = 'none';
                                const errorDiv = document.createElement('div');
                                errorDiv.className = 'text-center text-gray-500';
                                errorDiv.textContent = 'File could not be loaded. Please check the file path.';
                                e.currentTarget.parentElement?.appendChild(errorDiv);
                              }}
                            />
                          </div>
                        ) : isPdf ? (
                          <div className="w-full h-full" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                            {/* For Cloudinary PDFs, show a professional document card since direct embedding has CORS issues */}
                            {fileUrl.includes('cloudinary.com') ? (
                              <PDFViewer url={fileUrl} fileName={fileName} />
                            ) : (
                              <iframe
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="w-full border-0"
                                style={{
                                  minHeight: 'calc(29.7cm - 8cm)',
                                  height: 'calc(29.7cm - 8cm)',
                                }}
                                title={`${annexure.title} PDF`}
                                onLoad={() => {
                                  console.log(`✅ Successfully loaded PDF: ${fileName}`);
                                }}
                                onError={(e) => {
                                  console.error('❌ Failed to load PDF iframe:', {
                                    fileUrl,
                                    fileName,
                                    originalFile: annexure.file,
                                  });
                                  // Show error message
                                  const iframeElement = e.currentTarget;
                                  const parent = iframeElement.parentElement;
                                  if (parent) {
                                    iframeElement.style.display = 'none';
                                    const errorDiv = document.createElement('div');
                                    errorDiv.className = 'text-center p-8 border-2 border-red-300 rounded-lg bg-red-50';
                                    errorDiv.innerHTML = `
                                    <p class="font-bold text-red-700 mb-2">Failed to load document</p>
                                    <p class="text-sm text-red-600 mb-1">File: ${fileName}</p>
                                    <p class="text-xs text-red-500 mb-4">URL: ${fileUrl}</p>
                                    <p class="text-xs text-gray-600">Please check if the file exists at the specified location.</p>
                                  `;
                                    parent.appendChild(errorDiv);
                                  }
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                            <p className="text-gray-500 mb-2">Document Preview</p>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Click to view: {fileName}
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                        <p className="text-gray-500">File not available or path not found</p>
                        <p className="text-sm text-gray-400 mt-2">{fileName}</p>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </>
        );
      })()}
    </div>
  );
};
