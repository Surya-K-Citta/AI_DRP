import React, { useState, useEffect } from 'react';

interface PDFViewerProps {
    url: string;
    fileName?: string;
}

/**
 * PDF Viewer that converts Cloudinary PDF pages to images
 * Uses Cloudinary's pg_N transformation to render each page as an image
 */
const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
    const [pages, setPages] = useState<number[]>([1]);
    const [failedPages, setFailedPages] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    // Transform Cloudinary URL to get a specific page as an image
    const getPageImageUrl = (pdfUrl: string, pageNum: number): string => {
        // Check if it's a Cloudinary URL
        if (!pdfUrl.includes('cloudinary.com')) {
            return pdfUrl;
        }

        // Transform URL to use page extraction
        // From: .../image/upload/v123/folder/file.pdf
        // To: .../image/upload/pg_1,f_jpg,w_900,q_auto/v123/folder/file.pdf
        const uploadIndex = pdfUrl.indexOf('/upload/');
        if (uploadIndex !== -1) {
            const beforeUpload = pdfUrl.substring(0, uploadIndex + 8);
            const afterUpload = pdfUrl.substring(uploadIndex + 8);
            return `${beforeUpload}pg_${pageNum},f_jpg,w_900,q_auto/${afterUpload}`;
        }
        return pdfUrl;
    };

    // Handle successful page load - try to load next page
    const handlePageLoad = (pageNum: number) => {
        if (loading) setLoading(false);

        // Try to load the next page
        const nextPage = pageNum + 1;
        if (nextPage <= 50 && !pages.includes(nextPage) && !failedPages.has(nextPage)) {
            setPages(prev => [...prev, nextPage]);
        }
    };

    // Handle page load error - mark as failed, don't try more pages after this
    const handlePageError = (pageNum: number) => {
        setFailedPages(prev => new Set([...prev, pageNum]));
        if (loading && pageNum === 1) {
            setLoading(false);
        }
    };

    // Get successfully loaded pages (exclude failed ones)
    const visiblePages = pages.filter(p => !failedPages.has(p));

    // Check if page 1 failed (PDF might not be accessible)
    const firstPageFailed = failedPages.has(1);

    if (firstPageFailed) {
        return (
            <div className="w-full p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10.92,12.31C10.68,11.54 10.15,9.08 11.55,9.04C12.95,9 12.03,12.16 12.03,12.16C12.42,13.65 14.05,14.72 14.05,14.72C14.55,14.57 17.4,14.24 17,15.72C16.57,17.2 13.5,15.81 13.5,15.81C11.55,15.95 10.09,16.47 10.09,16.47C8.96,18.58 7.64,19.5 7.1,18.61C6.43,17.5 9.23,16.07 9.23,16.07C10.68,13.72 10.92,12.31 10.92,12.31Z" />
                    </svg>
                </div>
                <p className="text-gray-600 font-medium mb-2">Unable to display PDF preview</p>
                <p className="text-gray-400 text-sm mb-4">The PDF file couldn't be loaded inline</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open PDF
                </a>
            </div>
        );
    }

    return (
        <div className="w-full">
            {loading && (
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading PDF...</p>
                </div>
            )}

            <div className="space-y-4">
                {pages.map((pageNum) => (
                    <div
                        key={pageNum}
                        className={`pdf-page bg-white rounded-lg shadow-md overflow-hidden ${failedPages.has(pageNum) ? 'hidden' : ''
                            }`}
                    >
                        <img
                            src={getPageImageUrl(url, pageNum)}
                            alt={`Page ${pageNum}`}
                            className="w-full h-auto"
                            style={{ display: 'block' }}
                            onLoad={() => handlePageLoad(pageNum)}
                            onError={() => handlePageError(pageNum)}
                        />
                    </div>
                ))}
            </div>

            {visiblePages.length > 0 && (
                <p className="text-center text-gray-400 text-xs mt-4">
                    {visiblePages.length} page{visiblePages.length > 1 ? 's' : ''} loaded
                </p>
            )}
        </div>
    );
};

export default PDFViewer;
