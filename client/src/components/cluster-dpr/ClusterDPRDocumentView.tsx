// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { FormattedText } from '@/utils/textFormatter';
import { DPRVisualizations } from './DPRVisualizations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Upload, Sparkles, Loader2, X, Wand2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
  
  const content = dpr.content?.[viewLanguage] || dpr.content?.english || {};
  
  // Debug logging
  console.log('📊 ClusterDPRDocumentView - Data extraction:', {
    hasClusterData: !!clusterData && Object.keys(clusterData).length > 0,
    clusterDataKeys: Object.keys(clusterData),
    hasContent: !!content && Object.keys(content).length > 0,
    contentKeys: Object.keys(content),
    hasProjectStepData: !!project?.stepData,
    viewLanguage,
  });

  // Image state management
  const [images, setImages] = useState<Record<string, string>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Enhanced content state management with localStorage persistence
  const getStorageKey = () => {
    const dprId = dpr?._id || dpr?.id || 'default';
    return `cluster-dpr-enhanced-${dprId}-${viewLanguage}`;
  };

  const [enhancedContent, setEnhancedContent] = useState<Record<string, string>>(() => {
    // Load from localStorage on mount
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📥 Loaded enhanced content from localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error loading enhanced content from localStorage:', error);
    }
    return {};
  });
  const [enhancingSections, setEnhancingSections] = useState<Record<string, boolean>>({});

  // Reload enhanced content when DPR ID or language changes
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📥 Reloaded enhanced content from localStorage:', parsed);
        setEnhancedContent(parsed);
      } else {
        setEnhancedContent({});
      }
    } catch (error) {
      console.error('Error loading enhanced content from localStorage:', error);
      setEnhancedContent({});
    }
  }, [dpr?._id || dpr?.id, viewLanguage]);

  // Save to localStorage whenever enhancedContent changes
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      if (Object.keys(enhancedContent).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(enhancedContent));
        console.log('💾 Saved enhanced content to localStorage:', enhancedContent);
      }
    } catch (error) {
      console.error('Error saving enhanced content to localStorage:', error);
    }
  }, [enhancedContent]);

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
        setImages({ ...images, [imageId]: result.data.imageUrl });
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
        // Construct full URL for uploaded images
        // The API returns /uploads/images/filename.png, we need to prepend the server base URL
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const serverBaseUrl = apiBaseUrl.replace('/api', ''); // Remove /api to get server base
        const imageUrl = result.data.imageUrl.startsWith('http') 
          ? result.data.imageUrl 
          : `${serverBaseUrl}${result.data.imageUrl}`;
        setImages({ ...images, [imageId]: imageUrl });
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
  const handleRemoveImage = (imageId: string) => {
    const newImages = { ...images };
    delete newImages[imageId];
    setImages(newImages);
    toast.success('Image removed');
  };

  // Handle section enhancement (silent mode for batch operations)
  const handleEnhanceSection = async (sectionName: string, sectionData: any, silent: boolean = false) => {
    setEnhancingSections((prev) => ({ ...prev, [sectionName]: true }));
    try {
      const result = await api.enhanceClusterDPRSection(sectionName, sectionData, clusterData);
      if (result.success && result.data?.enhancedParagraph) {
        console.log(`✨ Enhanced section ${sectionName}:`, result.data.enhancedParagraph.substring(0, 100) + '...');
        setEnhancedContent((prev) => {
          const updated = {
            ...prev,
            [sectionName]: result.data.enhancedParagraph,
          };
          // Save to localStorage immediately
          try {
            const storageKey = getStorageKey();
            localStorage.setItem(storageKey, JSON.stringify(updated));
            console.log(`💾 Saved enhanced content for ${sectionName} to localStorage. Total keys:`, Object.keys(updated).length);
          } catch (error) {
            console.error('Error saving to localStorage:', error);
          }
          return updated;
        });
        if (!silent) {
          toast.success('Section enhanced successfully!');
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

  // Helper to render enhanced content (no button, just display)
  const renderEnhancedContent = (sectionName: string) => {
    const hasEnhancedContent = enhancedContent[sectionName];
    if (!hasEnhancedContent) return null;
    
    return (
      <div className="mb-4 p-4">
        <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
          {hasEnhancedContent}
        </p>
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
            className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-all ${
              hasImage 
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
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" fill="none"/>
                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2" fill="none"/>
                        <polyline points="21 15 16 10 5 21" strokeWidth="2" fill="none"/>
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
      {s11.submittedTo || ''}
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
          {s11.spvName || 'SPV Name'}
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
      M/s.ITCOT Limited, 50A Greams Road, Chennai.
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
          const hasSWOT = s8.strengths?.length > 0 || s8.weaknesses?.length > 0 || s8.opportunities?.length > 0 || s8.threats?.length > 0;
          const hasGapAnalysis = s7.technologyGaps || s7.infrastructureGaps || s7.skillGaps || s7.marketingGaps || s7.financialGaps || s7.justificationForIntervention;
          const hasCFCDetails = s10.name || s10.location || s10.plantAndMachinery || s10.manufacturingProcess || s10.capacity;
          const hasSPVDetails = s11.spvName || s11.legalStatus || s11.memberUnits?.length > 0;
          const hasProjectCost = (s12.land && s12.land > 0) || (s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0);
          const hasOperatingCostRevenue = s14.rawMaterialCost || s14.powerCost || s14.wages || s14.maintenance || s14.administrativeExpenses || s14.marketingExpenses || s14.annualProductionVolume || s14.annualSalesRealization;
          const hasFinancialViability = s15.profitAndLossProjections?.length > 0 || s15.cashFlowProjections?.length > 0 || s15.balanceSheetProjections?.length > 0 || s15.breakEvenPoint || s15.irr || s15.npv;
          const hasImplementationSchedule = s16.startDate || (s16.milestones && s16.milestones.length > 0) || s16.totalImplementationPeriod;
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
          const sections: Array<{chapter: string, title: string, page: string, isHeader?: boolean}> = [];
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
                  s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.micro) / 100000).toFixed(2)}` : 'N/A'
                ]);
              }
              if (s1.enterpriseCount?.small && s1.enterpriseCount.small > 0) {
                rows.push([
                  'Small Enterprises',
                  s1.enterpriseCount.small.toString(),
                  'N/A',
                  s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.small) / 100000).toFixed(2)}` : 'N/A'
                ]);
              }
              if (s1.enterpriseCount?.medium && s1.enterpriseCount.medium > 0) {
                rows.push([
                  'Medium Enterprises',
                  s1.enterpriseCount.medium.toString(),
                  'N/A',
                  s1.turnoverPerUnit ? `₹${((s1.turnoverPerUnit * s1.enterpriseCount.medium) / 100000).toFixed(2)}` : 'N/A'
                ]);
              }
              
              // Add total row if we have any data
              if (rows.length > 0) {
                const totalProduction = s14.annualProductionVolume ? s14.annualProductionVolume.toString() : 'N/A';
                const totalTurnover = s1.turnoverPerUnit && totalUnits > 0 
                  ? `₹${((s1.turnoverPerUnit * totalUnits) / 100000).toFixed(2)}` 
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
                  ['Average Investment per Unit', s1.investmentPerUnit ? `₹${(s1.investmentPerUnit / 100000).toFixed(2)} Lakhs` : 'N/A'],
                  ['Average Turnover per Unit', s1.turnoverPerUnit ? `₹${(s1.turnoverPerUnit / 100000).toFixed(2)} Lakhs` : 'N/A'],
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
          {renderEnhancedContent('introduction')}
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
          {s4.stakeholders && s4.stakeholders.length > 0 && (
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
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-xl font-semibold mb-3">3.1 Value Chain Stages</h3>
            <p className="mb-4">Raw Material → Processing → Value Addition → Marketing → End Customer</p>
            {s5.rawMaterials && s5.rawMaterials.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-2">Raw Materials:</h4>
                {renderTable(
                  ['Material', 'Source'],
                  s5.rawMaterials.map((m: any) => [m.name || 'N/A', m.source || 'N/A'])
                )}
              </div>
            )}
            {s5.valueAdditionStages && s5.valueAdditionStages.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-2">Value Addition Stages:</h4>
                {renderTable(
                  ['Stage', 'Selling Price (₹)'],
                  s5.valueAdditionStages.map((s: any) => [s.stage || 'N/A', (s.sellingPrice || 0).toLocaleString('en-IN')])
                )}
              </div>
            )}
            {s5.intermediateProducts && s5.intermediateProducts.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-2">Intermediate Products:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {s5.intermediateProducts.map((product: string, idx: number) => (
                    <li key={idx}>{product}</li>
                  ))}
                </ul>
              </div>
            )}
            {s5.finalProducts && s5.finalProducts.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-2">Final Products:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {s5.finalProducts.map((product: string, idx: number) => (
                    <li key={idx}>{product}</li>
                  ))}
                </ul>
              </div>
            )}
            {s5.majorBuyers && s5.majorBuyers.length > 0 && (
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
          {renderEnhancedContent('marketAspects')}
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
          {renderEnhancedContent('swotAnalysis')}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-700">Strengths</h3>
            <ul className="list-disc list-inside space-y-1">
              {(s8.strengths || []).map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-orange-700">Weaknesses</h3>
            <ul className="list-disc list-inside space-y-1">
              {(s8.weaknesses || []).map((w: string, idx: number) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-blue-700">Opportunities</h3>
            <ul className="list-disc list-inside space-y-1">
              {(s8.opportunities || []).map((o: string, idx: number) => (
                <li key={idx}>{o}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-700">Threats</h3>
            <ul className="list-disc list-inside space-y-1">
              {(s8.threats || []).map((t: string, idx: number) => (
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
          {renderEnhancedContent('gapAnalysis')}
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
              {renderEnhancedContent('cfcDetails')}
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
              {renderEnhancedContent('spvDetails')}
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
          {s11.shareholdingPattern && s11.shareholdingPattern.length > 0 && (
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
                      data={s11.shareholdingPattern.map((s: any) => ({ name: s.stakeholder, value: s.percentage || 0 }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {s11.shareholdingPattern.map((entry: any, index: number) => (
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
                {s11.memberUnits && s11.memberUnits.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.3 Member Units</h3>
                    {renderTable(
                      ['Sl. No', 'Unit Name', 'Registration'],
                      s11.memberUnits.map((u: any, idx: number) => [idx + 1, u.name || 'N/A', u.registration || 'N/A'])
                    )}
                  </div>
                )}
                {s11.objectives && s11.objectives.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.4 SPV Objectives</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {s11.objectives.map((objective: string, idx: number) => (
                        <li key={idx}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s11.rolesAndResponsibilities && s11.rolesAndResponsibilities.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.5 Roles and Responsibilities</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {s11.rolesAndResponsibilities.map((role: string, idx: number) => (
                        <li key={idx}>{role}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {s11.boardOfDirectors && s11.boardOfDirectors.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-3">8.6 Board of Directors</h3>
                    {renderTable(
                      ['Name', 'Designation'],
                      s11.boardOfDirectors.map((director: any) => [director.name || 'N/A', director.designation || 'N/A'])
                    )}
                  </div>
                )}
                {s11.statutoryRegistrations && s11.statutoryRegistrations.length > 0 && (
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
          {renderEnhancedContent('projectCost')}
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
                  ['Land', ((s12.land || 0) / 100000).toFixed(2)],
                  ['Building', ((s12.building || 0) / 100000).toFixed(2)],
                  ['Machinery', ((s12.machinery || 0) / 100000).toFixed(2)],
                  ['Utilities & Infrastructure', ((s12.utilitiesAndInfrastructure || 0) / 100000).toFixed(2)],
                  ['Preliminary & Pre-operative', ((s12.preliminaryAndPreOperative || 0) / 100000).toFixed(2)],
                  ['Working Capital Margin', ((s12.workingCapitalMargin || 0) / 100000).toFixed(2)],
                  ['Total Project Cost', (totalCost / 100000).toFixed(2)],
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
                  ['SPV Contribution', ((s13.spvContribution || 0) / 100000).toFixed(2)],
                  ['Government Grant', ((s13.governmentGrant || 0) / 100000).toFixed(2)],
                  ['Bank Loan', ((s13.bankLoan || 0) / 100000).toFixed(2)],
                  ['Other Sources', ((s13.otherSources || 0) / 100000).toFixed(2)],
                  ['Total', (totalFinance / 100000).toFixed(2)],
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
                <Tooltip formatter={(value: number) => `₹${(value / 100000).toFixed(2)} Lakhs`} />
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
            {renderEnhancedContent('operatingCostRevenue')}
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>9.5.1 Operating Costs</h3>
              {renderTable(
                ['Cost Component', 'Amount (₹ Lakhs)'],
                [
                  ['Raw Material Cost', s14.rawMaterialCost ? ((s14.rawMaterialCost / 100000).toFixed(2)) : 'N/A'],
                  ['Power Cost', s14.powerCost ? ((s14.powerCost / 100000).toFixed(2)) : 'N/A'],
                  ['Wages', s14.wages ? ((s14.wages / 100000).toFixed(2)) : 'N/A'],
                  ['Maintenance', s14.maintenance ? ((s14.maintenance / 100000).toFixed(2)) : 'N/A'],
                  ['Administrative Expenses', s14.administrativeExpenses ? ((s14.administrativeExpenses / 100000).toFixed(2)) : 'N/A'],
                  ['Marketing Expenses', s14.marketingExpenses ? ((s14.marketingExpenses / 100000).toFixed(2)) : 'N/A'],
                  ['Total Operating Cost', 
                   ((s14.rawMaterialCost || 0) + (s14.powerCost || 0) + (s14.wages || 0) + 
                    (s14.maintenance || 0) + (s14.administrativeExpenses || 0) + (s14.marketingExpenses || 0)) > 0
                    ? (((s14.rawMaterialCost || 0) + (s14.powerCost || 0) + (s14.wages || 0) + 
                        (s14.maintenance || 0) + (s14.administrativeExpenses || 0) + (s14.marketingExpenses || 0)) / 100000).toFixed(2)
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
                  ['Annual Sales Realization', s14.annualSalesRealization ? `₹${((s14.annualSalesRealization) / 100000).toFixed(2)} Lakhs` : 'N/A'],
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
          {renderEnhancedContent('financialViability')}
        <div className="space-y-6 text-sm">
          {/* Profit & Loss Statement */}
          {s15.profitAndLossProjections && s15.profitAndLossProjections.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.1 Profit & Loss Statement</h3>
              {renderTable(
                ['Year', 'Revenue', 'Expenses', 'Profit'],
                s15.profitAndLossProjections.map((p: any) => [
                  p.year || 'N/A',
                  `₹${((p.revenue || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((p.expenses || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((p.profit || 0) / 100000).toFixed(2)} Lakhs`,
                ]),
                'Cost of Production & Profitability',
                '3'
              )}
            </div>
          )}

          {/* Financial Indicators */}
          <div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.2 Financial Indicators</h3>
            {renderTable(
              ['Indicator', 'Value'],
              [
                ['Break-even Point', s15.breakEvenPoint ? `${s15.breakEvenPoint}%` : 'N/A'],
                ['IRR', s15.irr ? `${s15.irr}%` : 'N/A'],
                ['NPV', s15.npv ? `₹${((s15.npv) / 100000).toFixed(2)} Lakhs` : 'N/A'],
              ],
              'Estimation of Break Even Point',
              '11'
            )}
          </div>

          {/* Cash Flow Statement */}
          {s15.cashFlowProjections && s15.cashFlowProjections.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.3 Cash Flow Statement</h3>
              {renderTable(
                ['Year', 'Inflow', 'Outflow', 'Net Cash Flow'],
                s15.cashFlowProjections.map((c: any) => [
                  c.year || 'N/A',
                  `₹${((c.inflow || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((c.outflow || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((c.netCashFlow || 0) / 100000).toFixed(2)} Lakhs`,
                ]),
                'Projected Cash Flow Statement',
                '9'
              )}
            </div>
          )}

          {/* Balance Sheet */}
          {s15.balanceSheetProjections && s15.balanceSheetProjections.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.4 Balance Sheet</h3>
              {renderTable(
                ['Year', 'Assets', 'Liabilities', 'Equity'],
                s15.balanceSheetProjections.map((b: any) => [
                  b.year || 'N/A',
                  `₹${((b.assets || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((b.liabilities || 0) / 100000).toFixed(2)} Lakhs`,
                  `₹${((b.equity || 0) / 100000).toFixed(2)} Lakhs`,
                ]),
                'Projected Balance Sheet',
                '10'
              )}
            </div>
          )}

          {/* NPV & IRR - Only show if data is available */}
          {(s15.npv !== undefined || s15.irr !== undefined || (s15.cashFlowProjections && s15.cashFlowProjections.length > 0)) && (
            <div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.5 NPV & IRR</h3>
              {(() => {
                const totalProjectCost = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) + 
                                       (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0) + 
                                       (s12.workingCapitalMargin || 0);
                const rows: any[][] = [];
                
                // Cash Out Flow
                rows.push(['Cash Out Flow', '', '', '', '', '', '', '']);
                rows.push(['Capital Expenditure', (totalProjectCost / 100000).toFixed(2), '', '', '', '', '', '']);
                rows.push(['Preliminary & Preoperative Expenses', ((s12.preliminaryAndPreOperative || 0) / 100000).toFixed(2), '', '', '', '', '', '']);
                rows.push(['Working Capital Margin', ((s12.workingCapitalMargin || 0) / 100000).toFixed(2), '', '', '', '', '', '']);
                rows.push(['Total', ((totalProjectCost + (s12.preliminaryAndPreOperative || 0) + (s12.workingCapitalMargin || 0)) / 100000).toFixed(2), '0.00', '0.00', '0.00', '0.00', '0.00', '']);
                rows.push(['', '', '', '', '', '', '', '']);
                
                // Cash Inflow - use cash flow projections if available
                rows.push(['Cash Inflow', '', '', '', '', '', '', '']);
                if (s15.cashFlowProjections && s15.cashFlowProjections.length > 0) {
                  const projections = s15.cashFlowProjections.slice(0, 6);
                  const profitRow = ['Profit After Tax', ''];
                  const depRow = ['Depreciation', ''];
                  projections.forEach((p: any, idx: number) => {
                    profitRow.push(p.profitAfterTax ? ((p.profitAfterTax / 100000).toFixed(2)) : '');
                    depRow.push(p.depreciation ? ((p.depreciation / 100000).toFixed(2)) : '');
                  });
                  rows.push(profitRow);
                  rows.push(depRow);
                } else {
                  rows.push(['Profit After Tax', '', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']);
                  rows.push(['Depreciation', '', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']);
                }
                rows.push(['', '', '', '', '', '', '', '']);
                
                // Total and Net Cash Flow
                rows.push(['Total', '0.00', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']);
                rows.push(['', '', '', '', '', '', '', '']);
                rows.push(['Net Cash Flow', `-${((totalProjectCost + (s12.preliminaryAndPreOperative || 0) + (s12.workingCapitalMargin || 0)) / 100000).toFixed(2)}`, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A']);
                rows.push(['', '', '', '', '', '', '', '']);
                
                // NPV and IRR
                rows.push(['Net Present Value', s15.npv ? `Rs.${(s15.npv / 100000).toFixed(2)} lakhs` : 'N/A', '', '', '', '', '', '']);
                rows.push(['at 8% discount rate', '', '', '', '', '', '', '']);
                rows.push(['Internal Rate of Return', s15.irr ? `${s15.irr}%` : 'N/A', '', '', '', '', '', '']);
                
                return renderTable(
                  ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5', '6'],
                  rows,
                  'Estimation of NET PRESENT VALUE AND INTERNAL RATE OF RETURN',
                  '12'
                );
              })()}
            </div>
          )}

          {/* Sensitivity Analysis */}
          {s15.sensitivityAnalysis && (
            <div>
              <h3 className="text-xl font-semibold mb-3">10.5 Sensitivity Analysis</h3>
              <p className="text-justify leading-relaxed">{s15.sensitivityAnalysis}</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Section 10.5: Project Implementation Schedule */}
      {(s16.startDate || (s16.milestones && s16.milestones.length > 0) || s16.totalImplementationPeriod) && (
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
          {renderEnhancedContent('expectedImpact')}
        {renderTable(
          ['Parameter', 'Before', 'After'],
          [
            ['Employment', 'N/A', s17.employmentGeneration || 0],
            ['Turnover', 'N/A', `₹${((s17.turnoverGrowth || 0) / 100000).toFixed(2)} Lakhs`],
            ['Export Growth', 'N/A', `${s17.exportGrowth || 0}%`],
            ['Income Enhancement', 'N/A', `${s17.incomeEnhancement || 0}%`],
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
        
        {/* Working Capital Assessment */}
        {s12.workingCapitalMargin && s12.workingCapitalMargin > 0 && (
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Assessment of Working Capital</h3>
            {(() => {
              const workingCapital = s12.workingCapitalMargin;
              return renderTable(
                ['Particulars', 'Amount (₹ Lakhs)'],
                [
                  ['Raw Materials', ((workingCapital * 0.4) / 100000).toFixed(2)],
                  ['Work in Progress', ((workingCapital * 0.2) / 100000).toFixed(2)],
                  ['Finished Goods', ((workingCapital * 0.2) / 100000).toFixed(2)],
                  ['Debtors', ((workingCapital * 0.15) / 100000).toFixed(2)],
                  ['Cash & Bank Balance', ((workingCapital * 0.05) / 100000).toFixed(2)],
                  ['Total Current Assets', (workingCapital / 100000).toFixed(2)],
                  ['Creditors', ((workingCapital * 0.3) / 100000).toFixed(2)],
                  ['Net Working Capital', ((workingCapital * 0.7) / 100000).toFixed(2)],
                ],
                'Assessment of Working Capital',
                '2'
              );
            })()}
          </div>
        )}

        {/* Assumptions for Cost of Production */}
        {(s14.capacityUtilization || s14.rawMaterialCostPercentage || s14.powerCost || s14.depreciationRate || s14.interestRate) && (
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Assumptions for Cost of Production & Profitability</h3>
            {(() => {
              const assumptions: any[][] = [];
              if (s14.capacityUtilization) {
                if (s14.capacityUtilization.year1) assumptions.push(['Capacity Utilization (Year 1)', `${s14.capacityUtilization.year1}%`]);
                if (s14.capacityUtilization.year2) assumptions.push(['Capacity Utilization (Year 2)', `${s14.capacityUtilization.year2}%`]);
                if (s14.capacityUtilization.year3Onwards) assumptions.push(['Capacity Utilization (Year 3 onwards)', `${s14.capacityUtilization.year3Onwards}%`]);
              }
              if (s14.rawMaterialCostPercentage) assumptions.push(['Raw Material Cost (% of Revenue)', `${s14.rawMaterialCostPercentage}%`]);
              if (s14.powerCost) assumptions.push(['Power Cost per Unit', `₹${s14.powerCost}`]);
              if (s14.manpowerCost) assumptions.push(['Manpower Cost', s14.manpowerCost]);
              if (s14.depreciationRate) assumptions.push(['Depreciation Rate', s14.depreciationRate]);
              if (s14.interestRate) assumptions.push(['Interest Rate on Loan', `${s14.interestRate}% per annum`]);
              
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

        {/* Power Cost Estimation */}
        {s14.powerCost && (
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Estimation of Power Cost</h3>
            {renderTable(
              ['Particulars', 'Units', 'Rate (₹)', 'Amount (₹ Lakhs)'],
              [
                ['Connected Load', s14.connectedLoad || 'N/A', s14.powerCost?.toString() || 'N/A', 
                 s14.connectedLoad && s14.powerCost ? ((s14.connectedLoad * s14.powerCost) / 100000).toFixed(2) : 'N/A'],
                ['Monthly Consumption', s14.monthlyConsumption || 'N/A', s14.powerCost?.toString() || 'N/A',
                 s14.monthlyConsumption && s14.powerCost ? ((s14.monthlyConsumption * s14.powerCost) / 100000).toFixed(2) : 'N/A'],
                ['Annual Power Cost', 'N/A', 'N/A',
                 s14.monthlyConsumption && s14.powerCost ? ((s14.monthlyConsumption * s14.powerCost * 12) / 100000).toFixed(2) : 'N/A'],
              ],
              'Estimation of Power cost',
              '5'
            )}
          </div>
        )}

        {/* Manpower Requirement */}
        {(s14.manpowerRequirement || (s17.employmentGeneration && s17.employmentGeneration > 0)) && (
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Manpower Requirement & Estimation of Cost</h3>
            {s14.manpowerRequirement && Array.isArray(s14.manpowerRequirement) && s14.manpowerRequirement.length > 0 ? (
              renderTable(
                ['Category', 'No. of Employees', 'Annual Salary (₹)', 'Total Cost (₹ Lakhs)'],
                s14.manpowerRequirement.map((mp: any) => [
                  mp.category || 'N/A',
                  mp.count || 0,
                  mp.annualSalary ? mp.annualSalary.toLocaleString('en-IN') : 'N/A',
                  mp.totalCost ? (mp.totalCost / 100000).toFixed(2) : 'N/A',
                ]),
                'Manpower requirement & estimation of cost',
                '6'
              )
            ) : (
              <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
            )}
          </div>
        )}

        {/* Depreciation Estimation */}
        {((s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0) || s14.depreciationDetails) && (
          <div className="my-6">
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Estimation of Depreciation</h3>
            {s14.depreciationDetails && Array.isArray(s14.depreciationDetails) && s14.depreciationDetails.length > 0 ? (
              renderTable(
                ['Asset', 'Cost (₹ Lakhs)', 'Depreciation Rate (%)', 'Annual Depreciation (₹ Lakhs)'],
                s14.depreciationDetails.map((dep: any) => [
                  dep.asset || 'N/A',
                  dep.cost ? (dep.cost / 100000).toFixed(2) : 'N/A',
                  dep.rate ? `${dep.rate}%` : 'N/A',
                  dep.annualDepreciation ? (dep.annualDepreciation / 100000).toFixed(2) : 'N/A',
                ]),
                'Estimation of Depreciation',
                '7'
              )
            ) : (s12.building && s12.building > 0) || (s12.machinery && s12.machinery > 0) ? (
              (() => {
                const buildingCost = s12.building || 0;
                const machineryCost = s12.machinery || 0;
                const buildingDepRate = s14.buildingDepreciationRate || 10;
                const machineryDepRate = s14.machineryDepreciationRate || 15;
                return renderTable(
                  ['Asset', 'Cost (₹ Lakhs)', 'Depreciation Rate (%)', 'Annual Depreciation (₹ Lakhs)'],
                  [
                    buildingCost > 0 ? ['Building', (buildingCost / 100000).toFixed(2), `${buildingDepRate}%`, ((buildingCost * buildingDepRate / 100) / 100000).toFixed(2)] : null,
                    machineryCost > 0 ? ['Machinery', (machineryCost / 100000).toFixed(2), `${machineryDepRate}%`, ((machineryCost * machineryDepRate / 100) / 100000).toFixed(2)] : null,
                    ['Total', ((buildingCost + machineryCost) / 100000).toFixed(2), 'N/A', 
                     (((buildingCost * buildingDepRate / 100) + (machineryCost * machineryDepRate / 100)) / 100000).toFixed(2)],
                  ].filter(row => row !== null) as any[][],
                  'Estimation of Depreciation',
                  '7'
                );
              })()
            ) : (
              <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
            )}
          </div>
        )}

        {/* Income Tax Calculation */}
        <div className="my-6">
          <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>Calculation of Income Tax</h3>
          {s15.profitAndLossProjections && s15.profitAndLossProjections.length > 0 && (
            renderTable(
              ['Year', 'Profit Before Tax (₹ Lakhs)', 'Tax Rate (%)', 'Tax Amount (₹ Lakhs)', 'Profit After Tax (₹ Lakhs)'],
              s15.profitAndLossProjections.map((p: any, idx: number) => {
                const profitBeforeTax = p.profit || 0;
                const taxRate = profitBeforeTax > 1000000 ? 30 : profitBeforeTax > 500000 ? 25 : 20; // Simplified tax calculation
                const taxAmount = (profitBeforeTax * taxRate) / 100;
                const profitAfterTax = profitBeforeTax - taxAmount;
                return [
                  p.year || `Year ${idx + 1}`,
                  (profitBeforeTax / 100000).toFixed(2),
                  `${taxRate}%`,
                  (taxAmount / 100000).toFixed(2),
                  (profitAfterTax / 100000).toFixed(2),
                ];
              }),
              'Calculation of Income Tax',
              '8'
            )
          )}
        </div>
        </div>
      </div>

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
          {renderEnhancedContent('conclusion')}
          {!enhancedContent['conclusion'] && content.conclusion ? (
          <div className="prose max-w-none text-sm leading-relaxed">
            <FormattedText text={content.conclusion} />
          </div>
          ) : (
            // <p className="text-sm text-gray-500" style={{ color: '#1F2937' }}>N/A</p>
            <span></span>
          )}
        </div>
      </div>

      {/* Annexures Cover Page */}
      {(clusterData.step18?.spvRegistration || clusterData.step18?.landDocuments || clusterData.step18?.buildingEstimates || 
        clusterData.step18?.machineryQuotations || clusterData.step18?.memberRegistrations || 
        (clusterData.step18?.supportingDocuments && clusterData.step18.supportingDocuments.length > 0)) && (
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
            </div>
          </div>

          {/* Helper function to get file URL */}
          {(() => {
            const getFileUrl = (file: any): string | null => {
              if (!file) return null;
              
              // If it's already a URL string
              if (typeof file === 'string') {
                // Check if it's a full URL
                if (file.startsWith('http://') || file.startsWith('https://')) {
                  return file;
                }
                // Check if it's a relative path starting with /uploads/
                if (file.startsWith('/uploads/')) {
                  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  const serverBaseUrl = apiBaseUrl.replace('/api', '');
                  return `${serverBaseUrl}${file}`;
                }
                // If it's just a filename, use the API endpoint
                if (file.includes('.') && !file.includes('/')) {
                  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  // Use the API route to serve files
                  return `${apiBaseUrl}/documents/file/${encodeURIComponent(file)}`;
                }
                // If it's a path starting with /, try to serve it directly
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
            const annexureFiles: Array<{title: string, file: any, index: number}> = [];
            
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
                    <p className="text-sm text-gray-600">{fileName}</p>
                  </div>
                  
                  {fileUrl ? (
                    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                      {isImage ? (
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
                      ) : isPdf ? (
                        <div className="w-full flex flex-col items-center justify-center" style={{ minHeight: 'calc(29.7cm - 8cm)' }}>
                          <div className="mb-4 text-center">
                            <p className="text-sm text-gray-600 mb-2">PDF Document: {fileName}</p>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Open PDF in New Tab
                            </a>
                          </div>
                          <div className="w-full flex-1 border border-gray-300 rounded overflow-hidden">
                            <embed
                              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                              type="application/pdf"
                              className="w-full h-full"
                              style={{ 
                                minHeight: 'calc(29.7cm - 12cm)',
                              }}
                              onError={(e) => {
                                console.error('Failed to load PDF embed:', fileUrl);
                                // Hide embed and show link only
                                const embedElement = e.currentTarget;
                                embedElement.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
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
      )}

      {/* Enhance DPR Button - Fixed at bottom */}
      <div 
        className="sticky bottom-0 bg-white border-t-4 border-blue-500 p-6 shadow-lg z-50"
        style={{ 
          borderTop: '4px solid #2563EB',
          boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#1F2937' }}>
              Enhance Complete DPR
            </h3>
            <p className="text-sm text-gray-600">
              Generate comprehensive paragraphs for all sections and conclusion
            </p>
            </div>
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
                if (section.name === 'swotAnalysis') return s8.strengths?.length > 0 || s8.weaknesses?.length > 0;
                if (section.name === 'gapAnalysis') return s7.technologyGaps || s7.infrastructureGaps;
                if (section.name === 'cfcDetails') return s10.name || s10.location;
                if (section.name === 'spvDetails') return s11.spvName || s11.legalStatus;
                if (section.name === 'operatingCostRevenue') return s14.rawMaterialCost || s14.powerCost || s14.wages;
                if (section.name === 'projectCost') return s12.land || s12.building || s12.machinery;
                if (section.name === 'financialViability') return s15.profitAndLossProjections || s15.irr || s15.npv;
                if (section.name === 'implementationSchedule') return s16.startDate || s16.milestones?.length > 0;
                if (section.name === 'expectedImpact') return s17.employmentGeneration || s17.turnoverGrowth;
                if (section.name === 'conclusion') return true; // Always enhance conclusion
                return false;
              });

              const totalSections = validSections.length;
              let enhancedCount = 0;
              
              toast.loading(`Enhancing sections: 0/${totalSections}`, { id: 'enhance-all', duration: Infinity });
              
              try {
                // Enhance all sections sequentially to show progress
                for (const section of validSections) {
                  try {
                    await handleEnhanceSection(section.name, section.data, true); // Silent mode
                    enhancedCount++;
                    toast.loading(`Enhancing sections: ${enhancedCount}/${totalSections}`, { id: 'enhance-all', duration: Infinity });
                  } catch (error: any) {
                    console.error(`Failed to enhance ${section.name}:`, error);
                    // Continue with next section even if one fails
                  }
                }
                toast.success(`Successfully enhanced ${enhancedCount}/${totalSections} sections!`, { id: 'enhance-all' });
              } catch (error: any) {
                toast.error(`Enhanced ${enhancedCount}/${totalSections} sections. Some failed.`, { id: 'enhance-all' });
              }
            }}
            disabled={Object.values(enhancingSections).some(v => v)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold"
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
  );
};
