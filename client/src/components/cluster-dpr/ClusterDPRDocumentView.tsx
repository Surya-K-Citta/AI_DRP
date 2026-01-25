// @ts-nocheck
import React, { useState, useRef } from 'react';
import { FormattedText } from '@/utils/textFormatter';
import { DPRVisualizations } from './DPRVisualizations';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Upload, Sparkles, Loader2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface ClusterDPRDocumentViewProps {
  dpr: any;
  project: any;
  viewLanguage: 'english' | 'telugu';
}

export const ClusterDPRDocumentView: React.FC<ClusterDPRDocumentViewProps> = ({ dpr, project, viewLanguage }) => {
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

  // Helper to render professional tables matching PDF format
  const renderTable = (headers: string[], rows: any[][], title?: string, statementNumber?: string) => {
    return (
      <div className="my-6">
        {title && (
          <div className="mb-3">
            {statementNumber && (
              <p className="text-xs text-gray-600 mb-1 font-semibold">Statement {statementNumber}</p>
            )}
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
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
    <div className="bg-white dpr-document" style={{ fontFamily: 'Times New Roman, serif', width: '100%' }}>
      {/* Cover Page - Matching PDF Format */}
      <div 
        className="min-h-[29.7cm] flex flex-col justify-center items-center p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          minHeight: '29.7cm',
          padding: '3cm 2cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <div className="text-center max-w-3xl w-full">
          <h1 className="text-5xl font-bold mb-8" style={{ color: '#1F2937', letterSpacing: '0.05em' }}>
            DETAILED PROJECT REPORT
          </h1>
          <div className="my-8">
            <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1F2937' }}>
              On
            </h2>
            <h2 className="text-3xl font-semibold mb-2" style={{ color: '#1F2937' }}>
              Establishment of Common Facility Centre for
            </h2>
            <h2 className="text-4xl font-bold mb-6 uppercase" style={{ color: '#059669', letterSpacing: '0.05em' }}>
              {s1.clusterName || 'CLUSTER NAME'}
            </h2>
            <p className="text-xl font-semibold" style={{ color: '#1F2937' }}>
              under 'Micro Cluster Development Programme'
            </p>
          </div>
          
          <div className="mt-16 space-y-6 text-left max-w-md mx-auto" style={{ fontSize: '14px' }}>
            <div className="border-t-2 border-b-2 border-gray-800 py-4" style={{ borderColor: '#1F2937' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1F2937' }}>Submitted to:</p>
              <p className="text-sm" style={{ color: '#1F2937' }}>{s11.submittedTo || s11.submittedTo || 'DIC, District'}</p>
            </div>
            <div className="border-b-2 border-gray-800 py-4" style={{ borderColor: '#1F2937' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#1F2937' }}>Submitted by:</p>
              <p className="text-sm" style={{ color: '#1F2937' }}>{s11.spvName || 'SPV Name'}</p>
              <p className="text-sm" style={{ color: '#1F2937' }}>{s1.location || 'Location'}</p>
            </div>
            <div className="py-4">
              <p className="text-sm font-semibold mb-1" style={{ color: '#1F2937' }}>Prepared by:</p>
              <p className="text-sm" style={{ color: '#1F2937' }}>{s11.spvName || 'SPV Name'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents - Matching PDF Format */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#1F2937' }}>CONTENTS</h2>
        <table className="w-full border-collapse border border-gray-800 text-sm" style={{ borderColor: '#1F2937' }}>
          <thead>
            <tr style={{ backgroundColor: '#E5E7EB' }}>
              <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Chapter</th>
              <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Title</th>
              <th className="border border-gray-800 px-4 py-2 text-left font-bold" style={{ backgroundColor: '#E5E7EB', borderColor: '#1F2937' }}>Page No</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}></td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Executive Summary</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>i-iv</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>1.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Introduction</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>1</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>2.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Cluster Profile</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>3</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>3.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Cluster value chain mapping</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>11</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>4.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Market Aspects</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>19</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>5.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>SWOT Analysis</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>25</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>6.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Need Gap Analysis</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>26</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>7.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>CFC - Operation & Management</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>27</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>8.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>SPV Member Units</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>43</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>9.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Project Cost & Means Of Finance</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>49</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>10.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Financial viability</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>50</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>11.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Expected Impact</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>53</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }} colSpan={2}><strong>Financial Statements</strong></td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}></td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>SI.No.</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Financial Statements</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}></td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>1</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Cost of Project & Means of Finance</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>54</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>2</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Assessment of Working Capital</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>56</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>3</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Cost of Production & Profitability</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>57</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>4</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Assumptions for Cost of Production & Profitability</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>59</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>5</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Estimation of Power cost</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>61</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>6</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Manpower requirement & estimation of cost</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>62</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>7</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Estimation of Depreciation</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>63</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>8</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Calculation of Income Tax</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>64</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>9</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Projected Cash Flow Statement</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>65</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>10</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Projected Balance Sheet</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>66</td></tr>
            <tr style={{ backgroundColor: '#FFFFFF' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>11</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Estimation of Break Even Point</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>67</td></tr>
            <tr style={{ backgroundColor: '#F9FAFB' }}><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>12</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>Estimation of NPV & IRR</td><td className="border border-gray-800 px-4 py-2" style={{ borderColor: '#1F2937' }}>68</td></tr>
          </tbody>
        </table>
      </div>

      {/* Project Snapshot - Matching PDF Format */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: '#1F2937' }}>PROJECT SNAPSHOT</h2>
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

        {/* Existing Cluster Scenario Table */}
        <div className="my-6">
          <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Existing cluster scenario</h4>
          {renderTable(
            ['Product', 'No.of units', 'Annual Production (in MT)', 'Annual Turnover (in Rs.lakhs)'],
            [
              ['Coir Fibre Extraction', s1.enterpriseCount?.micro || 0, '25000(Fibre)\n50000(Pith)', '1375.00\n6000.00'],
              ['Coir 2ply yarn Spinning', s1.enterpriseCount?.small || 0, '864', '181.44'],
              ['Coir Pith Block', s1.enterpriseCount?.medium || 0, '24000', '4080.00'],
              ['Total', (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0), '99864', '11636.44'],
            ]
          )}
        </div>

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Key Concern areas of the cluster</h4>
          <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: '#1F2937' }}>
            <li>The micro units in the cluster are engaged in manufacturing of intermediate coir products only viz. Coir Fibre, Yarn and Pith.</li>
            <li>No value addition of Coir products undertaken in spite of good market prospects for value added coir products</li>
            <li>Dependence on intermediaries/ dealers/agents for selling, due to the absence of Collaborative marketing efforts so far</li>
            <li>Weak backward and forward linkages</li>
            <li>Limited individual investment potential of existing micro units, to venture into manufacturing of value added coir products</li>
            <li>Limited awareness on Quality of final products and the evolving technology / modern machineries in Coir sector</li>
          </ul>
        </div>

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Project Rationale</h4>
          <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
            {s7.justificationForIntervention || 'The existing production potential of intermediate Coir products in the cluster is promising. Hence the cluster is considered suitable for development in order to cater the growing market needs for the Value added coir products, both in domestic and international arena. Enabling the Coir Micro units in the cluster to upscale their activities, thereby manufacture value added Coir products achieved and extended high end market reach assured. With the cluster development support, the following benefits are anticipated: i. CFC establishment orients the micro unit holders towards the value added Coir products ii. Additional employment iii. Increase in turnover and profitability iv. Increased income level for the coir units could be achieved v. Emergence of new units, as cluster spillover effect'}
          </p>
        </div>

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3" style={{ color: '#1F2937' }}>Proposed Interventions</h4>
          <p className="text-sm text-justify leading-relaxed" style={{ color: '#1F2937' }}>
            {s9.description || 'The following upgraded production infrastructure are proposed in the Common Facility Centre: Coir Fibre (120 Kg.) Baling Press (For export Coir Fibre manufactured by Cluster units), Automatic Coir yarn spinning machines - 12 Nos. (Back up spinning machines @ CFC, to ensure continuous supply of raw material to Looms), Fully automatic Coir Geo-textiles Loom (2m width) - 4 Nos. with tightening machine (Value addition of Coir yarn manufactured by Cluster units), 5 Kg. Coir Pith Block making machine - 2 Nos. (Value addition of Coir pith manufactured by Cluster units).'}
          </p>
        </div>
      </div>

      {/* Section 1: Introduction */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>1. INTRODUCTION</h2>
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

      {/* Section 2: Cluster Profile */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>2. CLUSTER PROFILE</h2>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-xl font-semibold mb-3">2.1 Evolution of the Cluster</h3>
            <p className="text-justify leading-relaxed">{s4.clusterEvolution || 'N/A'}</p>
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
              ]
            )}
          </div>
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

      {/* Section 3: Value Chain */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>3. CLUSTER VALUE CHAIN MAPPING</h2>
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
              `Professional diagram showing value chain flow for ${s1.clusterName || 'the cluster'} from raw materials through processing and value addition to end customer. Clean, professional business diagram style.`
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Market Aspects */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>4. MARKET ASPECTS</h2>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-xl font-semibold mb-3">4.1 Demand–Supply Analysis</h3>
            <p className="text-justify leading-relaxed">{s6.existingDemand || 'N/A'}</p>
            <p className="text-justify leading-relaxed mt-2"><strong>Demand-Supply Gap:</strong> {s6.demandSupplyGap || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">4.2 Competition Analysis</h3>
            <p className="text-justify leading-relaxed">{s6.competitorAnalysis || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">4.3 Price Trends</h3>
            <p className="text-justify leading-relaxed">{s6.priceTrends || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">4.4 Export Potential</h3>
            <p className="text-justify leading-relaxed">{s6.exportPotential || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Section 5: SWOT Analysis */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>5. SWOT ANALYSIS</h2>
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

      {/* Section 6: Gap Analysis */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>6. NEED GAP ANALYSIS</h2>
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

      {/* Section 7: CFC Details */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>7. CFC - OPERATION & MANAGEMENT</h2>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-xl font-semibold mb-3">7.1 CFC Overview</h3>
            {renderTable(
              ['Parameter', 'Details'],
              [
                ['CFC Name', s10.name || 'N/A'],
                ['Location', s10.location || 'N/A'],
                ['Land Area', s10.landDetails || 'N/A'],
                ['Built-up Area', 'N/A'],
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

      {/* Section 8: SPV Details */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>8. SPV MEMBER UNITS</h2>
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
          {s11.memberUnits && s11.memberUnits.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">8.3 Member Units</h3>
              {renderTable(
                ['Sl. No', 'Unit Name', 'Registration'],
                s11.memberUnits.map((u: any, idx: number) => [idx + 1, u.name || 'N/A', u.registration || 'N/A'])
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 9: Project Cost & Means of Finance */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>9. PROJECT COST & MEANS OF FINANCE</h2>
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

      {/* Section 10: Financial Viability */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>10. FINANCIAL VIABILITY</h2>
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
                ['Break-even Point', `${s15.breakEvenPoint || 0}%`],
                ['IRR', `${s15.irr || 0}%`],
                ['NPV', `₹${((s15.npv || 0) / 100000).toFixed(2)} Lakhs`],
              ],
              'Estimation of Break Even Point',
              '11'
            )}
            {renderTable(
              ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5'],
              [
                ['Fixed Expenses', '', '', '', '', '', ''],
                ['Salary for Executives', '', '39.54', '41.51', '43.59', '45.77', '48.06'],
                ['Preliminary expenses', '', '0.05', '0.05', '0.05', '0.05', '0.05'],
                ['Depreciation', '', '41.43', '41.43', '41.43', '41.43', '41.43'],
                ['Total( A )', '', '81.02', '82.99', '85.07', '87.25', '89.54'],
                ['Variable Expenses', '', '', '', '', '', ''],
                ['Cost Of Raw materials and Consumables', '', '299.77', '349.73', '399.70', '399.70', '399.70'],
                ['Cost Of Power', '', '31.13', '36.30', '41.48', '41.48', '41.48'],
                ['Wages', '', '39.54', '41.51', '43.59', '45.77', '48.06'],
                ['Repairs & Maintenance', '', '8.46', '9.31', '10.24', '11.26', '12.39'],
                ['Administrative Expenses', '', '20.46', '23.86', '27.27', '27.27', '27.27'],
                ['Selling and Marketing Expenses', '', '34.09', '39.77', '45.46', '45.46', '45.46'],
                ['Interest on Working Capital Loan', '', '3.60', '3.60', '3.60', '3.60', '3.60'],
                ['Total( B )', '', '437.05', '504.08', '571.34', '574.54', '577.96'],
                ['Sales Realisation', '', '681.84', '795.48', '909.12', '909.12', '909.12'],
                ['Break Even Point', '', '33%', '28%', '25%', '26%', '27%'],
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

          {/* NPV & IRR */}
          <div>
            <h3 className="text-xl font-semibold mb-3" style={{ color: '#1F2937' }}>10.5 NPV & IRR</h3>
            {renderTable(
              ['Years', 'PR. PERIOD', '1', '2', '3', '4', '5', '6'],
              [
                ['Cash Out Flow', '', '', '', '', '', '', ''],
                ['Capital Expenditure', '712.60', '', '', '', '', '', ''],
                ['Preliminary & Preoperative Expenses', '0.51', '', '', '', '', '', ''],
                ['Working Capital Margin', '4.56', '', '', '', '', '', ''],
                ['Total', '717.67', '0.00', '0.00', '0.00', '0.00', '0.00', ''],
                ['', '', '', '', '', '', '', ''],
                ['Cash Inflow', '', '', '', '', '', '', ''],
                ['Profit After Tax', '', '139.59', '158.27', '179.17', '169.61', '161.22', '161.22'],
                ['Depreciation', '', '41.43', '41.43', '41.43', '41.43', '41.43', '41.43'],
                ['', '', '', '', '', '', '', ''],
                ['Total', '0.00', '181.02', '199.70', '220.60', '211.04', '202.65', '202.65'],
                ['', '', '', '', '', '', '', ''],
                ['Net Cash Flow', '-717.67', '181.02', '199.70', '220.60', '211.04', '202.65', '202.65'],
                ['', '', '', '', '', '', '', ''],
                ['Net Present Value', 'Rs.82.70 lakhs', '', '', '', '', '', ''],
                ['at 8% discount rate', '', '', '', '', '', '', ''],
                ['Internal Rate of Return', '26.02%', '', '', '', '', '', ''],
              ],
              'Estimation of NET PRESENT VALUE AND INTERNAL RATE OF RETURN',
              '12'
            )}
          </div>

          {/* Sensitivity Analysis */}
          {s15.sensitivityAnalysis && (
            <div>
              <h3 className="text-xl font-semibold mb-3">10.5 Sensitivity Analysis</h3>
              <p className="text-justify leading-relaxed">{s15.sensitivityAnalysis}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 11: Expected Impact */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>11. EXPECTED IMPACT</h2>
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

      {/* Conclusion */}
      {content.conclusion && (
        <div 
          className="p-12 border-b-4 border-gray-800 page-break"
          style={{ 
            pageBreakAfter: 'always',
            padding: '2cm',
            minHeight: '29.7cm',
            fontFamily: 'Times New Roman, serif'
          }}
        >
          <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>CONCLUSION</h2>
          <div className="prose max-w-none text-sm leading-relaxed">
            <FormattedText text={content.conclusion} />
          </div>
        </div>
      )}

      {/* Annexures */}
      <div 
        className="p-12 page-break"
        style={{ 
          padding: '2cm',
          minHeight: '29.7cm',
          fontFamily: 'Times New Roman, serif'
        }}
      >
        <h2 className="text-3xl font-bold mb-6" style={{ color: '#1F2937' }}>ANNEXURES</h2>
        <div className="space-y-4 text-sm">
          <p><strong>1. SPV Registration:</strong> {clusterData.step18?.spvRegistration || 'Attached'}</p>
          <p><strong>2. Land Documents:</strong> {clusterData.step18?.landDocuments || 'Attached'}</p>
          <p><strong>3. Building Estimates:</strong> {clusterData.step18?.buildingEstimates || 'Attached'}</p>
          <p><strong>4. Machinery Quotations:</strong> {clusterData.step18?.machineryQuotations || 'Attached'}</p>
          <p><strong>5. Member Registrations:</strong> {clusterData.step18?.memberRegistrations || 'Attached'}</p>
          {clusterData.step18?.supportingDocuments && Array.isArray(clusterData.step18.supportingDocuments) && (
            <div>
              <p><strong>6. Supporting Documents:</strong></p>
              <ul className="list-disc list-inside ml-4">
                {clusterData.step18.supportingDocuments.map((doc: string, idx: number) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
