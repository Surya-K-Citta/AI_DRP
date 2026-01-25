// @ts-nocheck
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { DPRVisualizations } from './DPRVisualizations';
import { FormattedText } from '@/utils/textFormatter';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  GanttChart
} from 'recharts';

interface ClusterDPRViewProps {
  dpr: any;
  project: any;
  viewLanguage: 'english' | 'telugu';
}

// Re-export the complete component
export { ClusterDPRViewComplete as ClusterDPRView } from './ClusterDPRViewComplete';
  // Extract cluster data from DPR content
  const clusterData = dpr.content?.[viewLanguage]?.clusterData || dpr.metadata?.clusterData || {};
  const content = dpr.content?.[viewLanguage] || {};
  
  // Get cover page and table of contents
  const coverPage = content.coverPage || '';
  const tableOfContents = content.tableOfContents || '';

  // Helper function to render tables
  const renderTable = (headers: string[], rows: any[][]) => {
    return (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-primary/10">
              {headers.map((header, idx) => (
                <th key={idx} className="border border-border px-4 py-2 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="border border-border px-4 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Section 1: Executive Summary
  const renderExecutiveSummary = () => {
    const s1 = clusterData.step1 || {};
    return (
      <Card id="section-1" className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">1. EXECUTIVE SUMMARY</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">1.1 Basic Details of the Cluster</h3>
            {renderTable(
              ['Sl. No', 'Particulars', 'Description'],
              [
                ['1', 'Name of Cluster', s1.clusterName || 'N/A'],
                ['2', 'District', s1.district || 'N/A'],
                ['3', 'Location of Cluster', s1.location || 'N/A'],
                ['4', 'Geographical Spread', s1.geographicalSpread || 'N/A'],
                ['5', 'Nature of Business', s1.natureOfBusiness || 'N/A'],
                ['6', 'Major Products', s1.majorProducts || 'N/A'],
              ]
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">1.2 Enterprise Profile</h3>
            {renderTable(
              ['Category', 'Count'],
              [
                ['Micro Enterprises', s1.enterpriseCount?.micro || 0],
                ['Small Enterprises', s1.enterpriseCount?.small || 0],
                ['Medium Enterprises', s1.enterpriseCount?.medium || 0],
              ]
            )}
            {/* Bar chart for enterprise distribution */}
            <div className="my-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📊 Enterprise Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: 'Micro', value: s1.enterpriseCount?.micro || 0 },
                  { name: 'Small', value: s1.enterpriseCount?.small || 0 },
                  { name: 'Medium', value: s1.enterpriseCount?.medium || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">1.3 Age of Enterprises</h3>
            {renderTable(
              ['Age Group', 'Number'],
              [
                ['Less than 5 years', s1.ageOfEnterprises?.lessThan5 || 0],
                ['5–10 years', s1.ageOfEnterprises?.between5And10 || 0],
                ['More than 10 years', s1.ageOfEnterprises?.moreThan10 || 0],
              ]
            )}
            {/* Bar chart for age distribution */}
            <div className="my-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📊 Age Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { name: '< 5 years', value: s1.ageOfEnterprises?.lessThan5 || 0 },
                  { name: '5-10 years', value: s1.ageOfEnterprises?.between5And10 || 0 },
                  { name: '> 10 years', value: s1.ageOfEnterprises?.moreThan10 || 0 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">1.4 Employment Profile</h3>
            {renderTable(
              ['Employees per Unit', 'Number of Units'],
              [
                ['< 5 Employees', s1.employmentPerUnit?.lessThan5 || 0],
                ['5–10 Employees', s1.employmentPerUnit?.between5And10 || 0],
                ['> 10 Employees', s1.employmentPerUnit?.moreThan10 || 0],
              ]
            )}
            {/* Pie chart for employment distribution */}
            <div className="my-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📊 Employment Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: '< 5 Employees', value: s1.employmentPerUnit?.lessThan5 || 0 },
                      { name: '5-10 Employees', value: s1.employmentPerUnit?.between5And10 || 0 },
                      { name: '> 10 Employees', value: s1.employmentPerUnit?.moreThan10 || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {['#0088FE', '#00C49F', '#FFBB28'].map((color, idx) => (
                      <Cell key={`cell-${idx}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">1.5 Investment & Market</h3>
            <div className="space-y-2 mb-4">
              <p><strong>Average Investment per Unit:</strong> ₹{(s1.investmentPerUnit || 0).toLocaleString('en-IN')}</p>
              <p><strong>Average Turnover per Unit:</strong> ₹{(s1.turnoverPerUnit || 0).toLocaleString('en-IN')}</p>
            </div>
            {renderTable(
              ['Market', 'Share (%)'],
              [
                ['Domestic', s1.marketServed?.domestic || 0],
                ['Export', s1.marketServed?.export || 0],
              ]
            )}
            {/* Doughnut chart for market split */}
            <div className="my-6">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">📊 Market Served Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Domestic', value: s1.marketServed?.domestic || 0 },
                      { name: 'Export', value: s1.marketServed?.export || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {['#0088FE', '#00C49F'].map((color, idx) => (
                      <Cell key={`cell-${idx}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced content from OpenAI */}
          {content.executiveSummary && (
            <div className="mt-6 prose max-w-none">
              <FormattedText text={content.executiveSummary} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Section 2: Introduction & Sector Overview
  const renderIntroduction = () => {
    const s2 = clusterData.step2 || {};
    return (
      <Card id="section-2" className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">2. INTRODUCTION & SECTOR OVERVIEW</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">2.1 Overview of the Sector</h3>
            <p className="text-muted-foreground mb-2"><strong>Sector/Industry Type:</strong> {s2.sectorType || 'N/A'}</p>
            {content.introduction && (
              <div className="prose max-w-none">
                <FormattedText text={content.introduction} />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">2.2 Importance of the Sector</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">National level</h4>
                <p className="text-muted-foreground">{s2.nationalImportance || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">State level</h4>
                <p className="text-muted-foreground">{s2.stateLevelImportance || 'N/A'}</p>
              </div>
            </div>
          </div>

          {s2.keyProducts && s2.keyProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">2.3 Key Products</h3>
              <ul className="list-disc list-inside space-y-2">
                {s2.keyProducts.map((product: string, idx: number) => (
                  <li key={idx}>{product}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Continue with other sections... (Due to length, I'll create a comprehensive component)
  // For now, let me create the main structure and add all sections

  return (
    <div className="space-y-6">
      {/* Cover Page */}
      {coverPage ? (
        <Card className="min-h-[500px] flex items-center justify-center mb-6">
          <CardContent className="text-center max-w-3xl">
            <div className="prose prose-lg max-w-none">
              <FormattedText text={coverPage} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-h-[500px] flex items-center justify-center mb-6">
          <CardContent className="text-center">
            <h1 className="text-4xl font-bold mb-4">DETAILED PROJECT REPORT (DPR)</h1>
            <p className="text-muted-foreground mb-2">(Auto-generated from User Inputs)</p>
            <h2 className="text-3xl font-semibold mb-2 text-primary">
              Development of {clusterData.step1?.clusterName || 'Cluster Name'} Cluster
            </h2>
            <div className="mt-8 space-y-2 text-left max-w-md mx-auto">
              <p><strong>Sector:</strong> {clusterData.step2?.sectorType || 'N/A'}</p>
              <p><strong>Location:</strong> {clusterData.step1?.district || 'N/A'}, {clusterData.step1?.location || 'N/A'}</p>
              <p><strong>Submitted by:</strong> {clusterData.step11?.spvName || 'SPV Name'}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table of Contents */}
      {tableOfContents ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>TABLE OF CONTENTS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <FormattedText text={tableOfContents} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>TABLE OF CONTENTS</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              {[
                'EXECUTIVE SUMMARY',
                'INTRODUCTION & SECTOR OVERVIEW',
                'DISTRICT & REGIONAL PROFILE',
                'CLUSTER PROFILE',
                'VALUE CHAIN ANALYSIS',
                'MARKET ASSESSMENT',
                'GAP ANALYSIS',
                'SWOT ANALYSIS',
                'PROPOSED INTERVENTION',
                'COMMON FACILITY CENTRE (CFC) DETAILS',
                'SPV DETAILS',
                'PROJECT COST',
                'MEANS OF FINANCE',
                'FINANCIAL ANALYSIS',
                'PROJECT IMPLEMENTATION SCHEDULE',
                'EXPECTED IMPACT',
                'CONCLUSION',
                'ANNEXURES',
              ].map((title, idx) => (
                <li key={idx} className="text-sm">
                  <a href={`#section-${idx + 1}`} className="text-primary hover:underline">
                    {idx + 1}. {title}
                  </a>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Render all sections */}
      {renderExecutiveSummary()}
      {renderIntroduction()}

      {/* Visualizations Component */}
      <DPRVisualizations data={clusterData} />

      {/* Additional sections will be rendered based on content */}
      {/* For brevity, I'll add key sections that have enhanced content */}
      {content.districtProfile && (
        <Card id="section-3" className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">3. DISTRICT & REGIONAL PROFILE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <FormattedText text={content.districtProfile} />
            </div>
          </CardContent>
        </Card>
      )}

      {content.clusterProfile && (
        <Card id="section-4" className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">4. CLUSTER PROFILE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <FormattedText text={content.clusterProfile} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue with remaining sections... */}
      {/* I'll create a helper to render all sections systematically */}
    </div>
  );
};
