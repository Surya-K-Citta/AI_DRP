// @ts-nocheck
import React from 'react';
import { FormattedText } from '@/utils/textFormatter';
import { DPRVisualizations } from './DPRVisualizations';
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
  // Extract cluster data
  const clusterData = dpr.content?.[viewLanguage]?.clusterData || dpr.metadata?.clusterData || {};
  const content = dpr.content?.[viewLanguage] || {};

  // Helper to render professional tables
  const renderTable = (headers: string[], rows: any[][], title?: string, statementNumber?: string) => {
    return (
      <div className="my-6">
        {title && (
          <div className="mb-3">
            {statementNumber && (
              <p className="text-xs text-muted-foreground mb-1">Statement {statementNumber}</p>
            )}
            <h4 className="text-lg font-bold">{title}</h4>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 text-sm">
            <thead>
              <tr className="bg-gray-100">
                {headers.map((header, idx) => (
                  <th 
                    key={idx} 
                    className="border border-gray-800 px-3 py-2 text-left font-bold text-xs bg-gray-200"
                    style={{ backgroundColor: '#E5E7EB' }}
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
                  className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className="border border-gray-800 px-3 py-2 text-xs"
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

  // Render image placeholder
  const renderImage = (src: string, alt: string, caption?: string) => {
    return (
      <div className="my-6 text-center">
        <div className="inline-block border-2 border-gray-300 p-2 bg-white">
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full h-auto"
            style={{ maxHeight: '400px' }}
            onError={(e) => {
              // Fallback to placeholder
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=';
            }}
          />
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
      {/* Cover Page */}
      <div 
        className="min-h-[29.7cm] flex flex-col justify-center items-center p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          minHeight: '29.7cm',
          padding: '3cm 2cm'
        }}
      >
        <div className="text-center max-w-3xl">
          <h1 className="text-5xl font-bold mb-8" style={{ color: '#1F2937' }}>
            DETAILED PROJECT REPORT
          </h1>
          <div className="my-8">
            <h2 className="text-3xl font-semibold mb-4" style={{ color: '#1F2937' }}>
              On
            </h2>
            <h2 className="text-3xl font-semibold mb-2" style={{ color: '#1F2937' }}>
              Establishment of Common Facility Centre for
            </h2>
            <h2 className="text-4xl font-bold mb-6" style={{ color: '#059669' }}>
              {s1.clusterName?.toUpperCase() || 'CLUSTER NAME'}
            </h2>
            <p className="text-xl font-semibold" style={{ color: '#1F2937' }}>
              under 'Micro Cluster Development Programme'
            </p>
          </div>
          
          <div className="mt-12 space-y-4 text-left max-w-md mx-auto">
            <div className="border-t-2 border-b-2 border-gray-800 py-4">
              <p className="text-sm font-semibold mb-1">Submitted to:</p>
              <p className="text-sm">{s11.submittedTo || 'DIC, District'}</p>
            </div>
            <div className="border-b-2 border-gray-800 py-4">
              <p className="text-sm font-semibold mb-1">Submitted by:</p>
              <p className="text-sm">{s11.spvName || 'SPV Name'}</p>
              <p className="text-sm">{s1.location || 'Location'}</p>
            </div>
            <div className="py-4">
              <p className="text-sm font-semibold mb-1">Prepared by:</p>
              <p className="text-sm">{s11.spvName || 'SPV Name'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">CONTENTS</h2>
        <table className="w-full border-collapse border border-gray-800 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-800 px-4 py-2 text-left font-bold bg-gray-200">Chapter</th>
              <th className="border border-gray-800 px-4 py-2 text-left font-bold bg-gray-200">Title</th>
              <th className="border border-gray-800 px-4 py-2 text-left font-bold bg-gray-200">Page No</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-gray-800 px-4 py-2"></td><td className="border border-gray-800 px-4 py-2">Executive Summary</td><td className="border border-gray-800 px-4 py-2">i-iv</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">1.</td><td className="border border-gray-800 px-4 py-2">Introduction & Sector Overview</td><td className="border border-gray-800 px-4 py-2">1</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">2.</td><td className="border border-gray-800 px-4 py-2">District & Regional Profile</td><td className="border border-gray-800 px-4 py-2">3</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">3.</td><td className="border border-gray-800 px-4 py-2">Cluster Profile</td><td className="border border-gray-800 px-4 py-2">5</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">4.</td><td className="border border-gray-800 px-4 py-2">Cluster Value Chain Mapping</td><td className="border border-gray-800 px-4 py-2">11</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">5.</td><td className="border border-gray-800 px-4 py-2">Market Assessment</td><td className="border border-gray-800 px-4 py-2">19</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">6.</td><td className="border border-gray-800 px-4 py-2">Gap Analysis</td><td className="border border-gray-800 px-4 py-2">25</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">7.</td><td className="border border-gray-800 px-4 py-2">SWOT Analysis</td><td className="border border-gray-800 px-4 py-2">26</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">8.</td><td className="border border-gray-800 px-4 py-2">Proposed Intervention</td><td className="border border-gray-800 px-4 py-2">27</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">9.</td><td className="border border-gray-800 px-4 py-2">Common Facility Centre (CFC) Details</td><td className="border border-gray-800 px-4 py-2">30</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">10.</td><td className="border border-gray-800 px-4 py-2">SPV Details</td><td className="border border-gray-800 px-4 py-2">43</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">11.</td><td className="border border-gray-800 px-4 py-2">Project Cost Details</td><td className="border border-gray-800 px-4 py-2">47</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">12.</td><td className="border border-gray-800 px-4 py-2">Means of Finance</td><td className="border border-gray-800 px-4 py-2">49</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">13.</td><td className="border border-gray-800 px-4 py-2">Operating Cost & Revenue</td><td className="border border-gray-800 px-4 py-2">50</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">14.</td><td className="border border-gray-800 px-4 py-2">Financial Viability</td><td className="border border-gray-800 px-4 py-2">52</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">15.</td><td className="border border-gray-800 px-4 py-2">Project Implementation Schedule</td><td className="border border-gray-800 px-4 py-2">55</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">16.</td><td className="border border-gray-800 px-4 py-2">Expected Impact</td><td className="border border-gray-800 px-4 py-2">58</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">17.</td><td className="border border-gray-800 px-4 py-2">Conclusion</td><td className="border border-gray-800 px-4 py-2">60</td></tr>
            <tr><td className="border border-gray-800 px-4 py-2">18.</td><td className="border border-gray-800 px-4 py-2">Annexures</td><td className="border border-gray-800 px-4 py-2">62</td></tr>
          </tbody>
        </table>
      </div>

      {/* Project Snapshot */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">PROJECT SNAPSHOT</h2>
        {renderTable(
          ['Particulars', 'Details'],
          [
            ['Name of the cluster', `${s1.clusterName || 'N/A'}, ${s1.district || 'N/A'} District`],
            ['Location & Spread of the cluster', s1.geographicalSpread || s1.location || 'N/A'],
            ['Product range', s1.majorProducts || 'N/A'],
            ['Existing cluster scenario', 'See table below'],
            ['Existing employment in the Cluster', `${(s1.employmentPerUnit?.lessThan5 || 0) + (s1.employmentPerUnit?.between5And10 || 0) + (s1.employmentPerUnit?.moreThan10 || 0)} workers`],
            ['Name of the SPV', s11.spvName || 'N/A'],
            ['Legal Status', s11.legalStatus || 'N/A'],
            ['Number of SPV members', `${(s11.memberUnits?.length || 0)} member units`],
          ]
        )}

        {/* Existing Cluster Scenario Table */}
        {renderTable(
          ['Product', 'No.of units', 'Annual Production', 'Annual Turnover (₹ Lakhs)'],
          [
            ['Coir Fibre Extraction', s1.enterpriseCount?.micro || 0, 'N/A', 'N/A'],
            ['Coir 2ply yarn Spinning', s1.enterpriseCount?.small || 0, 'N/A', 'N/A'],
            ['Coir Pith Block', s1.enterpriseCount?.medium || 0, 'N/A', 'N/A'],
            ['Total', (s1.enterpriseCount?.micro || 0) + (s1.enterpriseCount?.small || 0) + (s1.enterpriseCount?.medium || 0), 'N/A', 'N/A'],
          ],
          'Existing Cluster Scenario'
        )}

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3">Key Concern areas of the cluster</h4>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Limited value addition of products</li>
            <li>Dependence on intermediaries for selling</li>
            <li>Weak backward and forward linkages</li>
            <li>Limited individual investment potential</li>
            <li>Limited awareness on Quality and modern technology</li>
          </ul>
        </div>

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3">Project Rationale</h4>
          <p className="text-sm text-justify leading-relaxed">
            {s7.justificationForIntervention || 'The cluster development support will enable micro units to upscale their activities and manufacture value added products, leading to additional employment, increased turnover, and improved income levels.'}
          </p>
        </div>

        <div className="my-6">
          <h4 className="text-lg font-bold mb-3">Proposed Interventions</h4>
          <p className="text-sm text-justify leading-relaxed">
            {s9.description || 'The following upgraded production infrastructure are proposed in the Common Facility Centre to enable value addition and improved market reach.'}
          </p>
        </div>
      </div>

      {/* Section 1: Introduction */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">1. INTRODUCTION</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">2. CLUSTER PROFILE</h2>
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
              {renderImage('', 'Cluster Unit Photo 1', 'Sample cluster unit')}
              {renderImage('', 'Cluster Unit Photo 2', 'Production process')}
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">3. CLUSTER VALUE CHAIN MAPPING</h2>
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
            {renderImage('', 'Value Chain Diagram', 'Value chain flow from raw material to end customer')}
          </div>
        </div>
      </div>

      {/* Section 4: Market Aspects */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">4. MARKET ASPECTS</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">5. SWOT ANALYSIS</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">6. NEED GAP ANALYSIS</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">7. CFC - OPERATION & MANAGEMENT</h2>
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
            {renderImage('', 'Process Flow', 'Manufacturing process flow')}
          </div>
          <div className="my-6">
            <h4 className="text-lg font-semibold mb-3">📸 Machinery Layout</h4>
            {renderImage('', 'Machinery Layout', 'CFC machinery layout and reference images')}
          </div>
        </div>
      </div>

      {/* Section 8: SPV Details */}
      <div 
        className="p-12 border-b-4 border-gray-800 page-break"
        style={{ 
          pageBreakAfter: 'always',
          padding: '2cm',
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">8. SPV MEMBER UNITS</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">9. PROJECT COST & MEANS OF FINANCE</h2>
        <div className="space-y-6 text-sm">
          <div>
            <h3 className="text-xl font-semibold mb-3">9.1 Project Cost</h3>
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
            <h3 className="text-xl font-semibold mb-3">9.2 Means of Finance</h3>
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
                ]
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">10. FINANCIAL VIABILITY</h2>
        <div className="space-y-6 text-sm">
          {/* Profit & Loss Statement */}
          {s15.profitAndLossProjections && s15.profitAndLossProjections.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">10.1 Profit & Loss Statement</h3>
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
            <h3 className="text-xl font-semibold mb-3">10.2 Financial Indicators</h3>
            {renderTable(
              ['Indicator', 'Value'],
              [
                ['Break-even Point', `₹${((s15.breakEvenPoint || 0) / 100000).toFixed(2)} Lakhs`],
                ['IRR', `${s15.irr || 0}%`],
                ['NPV', `₹${((s15.npv || 0) / 100000).toFixed(2)} Lakhs`],
              ],
              'Estimation of Break Even Point',
              '11'
            )}
          </div>

          {/* Cash Flow Statement */}
          {s15.cashFlowProjections && s15.cashFlowProjections.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">10.3 Cash Flow Statement</h3>
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
              <h3 className="text-xl font-semibold mb-3">10.4 Balance Sheet</h3>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">11. EXPECTED IMPACT</h2>
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
            minHeight: '29.7cm'
          }}
        >
          <h2 className="text-3xl font-bold mb-6">CONCLUSION</h2>
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
          minHeight: '29.7cm'
        }}
      >
        <h2 className="text-3xl font-bold mb-6">ANNEXURES</h2>
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
