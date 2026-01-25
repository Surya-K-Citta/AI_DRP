// @ts-nocheck
import React, { useState } from 'react';
import { ClusterDPRData } from '@/store/clusterDPRStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DPRVisualizations } from './DPRVisualizations';

interface ClusterDPRPreviewProps {
  data: ClusterDPRData;
}

export const ClusterDPRPreview: React.FC<ClusterDPRPreviewProps> = ({ data }) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  const handleEdit = (sectionId: string, currentContent: string) => {
    setEditingSection(sectionId);
    setEditedContent({ ...editedContent, [sectionId]: currentContent });
  };

  const handleSave = (sectionId: string) => {
    // In a real implementation, this would update the store
    setEditingSection(null);
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const renderEditableContent = (sectionId: string, content: string) => {
    const isEditing = editingSection === sectionId;
    const displayContent = editedContent[sectionId] || content;

    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={displayContent}
            onChange={(e) => setEditedContent({ ...editedContent, [sectionId]: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSave(sectionId)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="group relative">
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{displayContent || 'No content available yet. Fill in the form to see preview.'}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(sectionId, displayContent)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit
        </Button>
      </div>
    );
  };

  const generateSectionContent = (step: number): string => {
    const stepData = data[`step${step}` as keyof ClusterDPRData];
    if (!stepData) return '';

    switch (step) {
      case 1: {
        const s1 = stepData as any;
        return `Cluster Name: ${s1.clusterName || 'N/A'}
District: ${s1.district || 'N/A'}
Location: ${s1.location || 'N/A'}
Geographical Spread: ${s1.geographicalSpread || 'N/A'}
Nature of Business: ${s1.natureOfBusiness || 'N/A'}
Major Products: ${s1.majorProducts || 'N/A'}

Enterprise Count:
- Micro: ${s1.enterpriseCount?.micro || 0}
- Small: ${s1.enterpriseCount?.small || 0}
- Medium: ${s1.enterpriseCount?.medium || 0}

Age of Enterprises:
- < 5 years: ${s1.ageOfEnterprises?.lessThan5 || 0}
- 5-10 years: ${s1.ageOfEnterprises?.between5And10 || 0}
- > 10 years: ${s1.ageOfEnterprises?.moreThan10 || 0}

Employment per Unit:
- < 5 employees: ${s1.employmentPerUnit?.lessThan5 || 0}
- 5-10 employees: ${s1.employmentPerUnit?.between5And10 || 0}
- > 10 employees: ${s1.employmentPerUnit?.moreThan10 || 0}

Investment per Unit: ₹${(s1.investmentPerUnit || 0).toLocaleString('en-IN')}
Turnover per Unit: ₹${(s1.turnoverPerUnit || 0).toLocaleString('en-IN')}

Market Served:
- Domestic: ${s1.marketServed?.domestic || 0}%
- Export: ${s1.marketServed?.export || 0}%`;
      }
      case 2: {
        const s2 = stepData as any;
        return `Sector/Industry Type: ${s2.sectorType || 'N/A'}

Sector Description:
${s2.sectorDescription || 'N/A'}

National Importance:
${s2.nationalImportance || 'N/A'}

State-level Importance:
${s2.stateLevelImportance || 'N/A'}

Key Products:
${(s2.keyProducts || []).map((p: string) => `- ${p}`).join('\n') || 'N/A'}`;
      }
      case 3: {
        const s3 = stepData as any;
        return `Geography:
${s3.geography || 'N/A'}

Climate: ${s3.climate || 'N/A'}

Infrastructure:
${s3.infrastructure || 'N/A'}

Key Economic Activities:
${s3.keyEconomicActivities || 'N/A'}

Raw Material Availability: ${s3.rawMaterialAvailability || 'N/A'}
Raw Material Quantity: ${s3.rawMaterialQuantity || 'N/A'}

Industrial Infrastructure:
${s3.industrialInfrastructure || 'N/A'}

Connectivity:
- Road: ${s3.connectivity?.road || 'N/A'}
- Rail: ${s3.connectivity?.rail || 'N/A'}
- Port: ${s3.connectivity?.port || 'N/A'}`;
      }
      case 4: {
        const s4 = stepData as any;
        return `Year of Establishment: ${s4.yearOfEstablishment || 'N/A'}

Cluster Evolution:
${s4.clusterEvolution || 'N/A'}

Present Activities:
${s4.presentActivities || 'N/A'}

Type of Units: ${s4.typeOfUnits || 'N/A'}
Production Capacity: ${s4.productionCapacity || 'N/A'}
Technology Level: ${s4.technologyLevel || 'N/A'}

Stakeholders:
${(s4.stakeholders || []).map((s: string) => `- ${s}`).join('\n') || 'N/A'}`;
      }
      case 5: {
        const s5 = stepData as any;
        return `Raw Materials:
${(s5.rawMaterials || []).map((m: any) => `- ${m.name || 'N/A'} (Source: ${m.source || 'N/A'})`).join('\n') || 'N/A'}

Intermediate Products:
${(s5.intermediateProducts || []).map((p: string) => `- ${p}`).join('\n') || 'N/A'}

Final Products:
${(s5.finalProducts || []).map((p: string) => `- ${p}`).join('\n') || 'N/A'}

Value Addition Stages:
${(s5.valueAdditionStages || []).map((s: any) => `- ${s.stage || 'N/A'}: ₹${(s.sellingPrice || 0).toLocaleString('en-IN')}`).join('\n') || 'N/A'}

Major Buyers:
${(s5.majorBuyers || []).map((b: string) => `- ${b}`).join('\n') || 'N/A'}`;
      }
      case 6: {
        const s6 = stepData as any;
        return `Existing Demand:
${s6.existingDemand || 'N/A'}

Demand-Supply Gap:
${s6.demandSupplyGap || 'N/A'}

Target Market:
${s6.targetMarket || 'N/A'}

Competitor Analysis:
${s6.competitorAnalysis || 'N/A'}

Price Trends:
${s6.priceTrends || 'N/A'}

Export Potential:
${s6.exportPotential || 'N/A'}`;
      }
      case 7: {
        const s7 = stepData as any;
        return `Technology Gaps:
${s7.technologyGaps || 'N/A'}

Infrastructure Gaps:
${s7.infrastructureGaps || 'N/A'}

Skill Gaps:
${s7.skillGaps || 'N/A'}

Marketing Gaps:
${s7.marketingGaps || 'N/A'}

Financial Gaps:
${s7.financialGaps || 'N/A'}

Justification for Intervention:
${s7.justificationForIntervention || 'N/A'}`;
      }
      case 8: {
        const s8 = stepData as any;
        return `Strengths:
${(s8.strengths || []).map((s: string) => `- ${s}`).join('\n') || 'N/A'}

Weaknesses:
${(s8.weaknesses || []).map((w: string) => `- ${w}`).join('\n') || 'N/A'}

Opportunities:
${(s8.opportunities || []).map((o: string) => `- ${o}`).join('\n') || 'N/A'}

Threats:
${(s8.threats || []).map((t: string) => `- ${t}`).join('\n') || 'N/A'}`;
      }
      case 9: {
        const s9 = stepData as any;
        return `Intervention Type: ${s9.interventionType || 'N/A'}

Description:
${s9.description || 'N/A'}

Objectives:
${(s9.objectives || []).map((o: string) => `- ${o}`).join('\n') || 'N/A'}

Expected Benefits:
${(s9.expectedBenefits || []).map((b: string) => `- ${b}`).join('\n') || 'N/A'}`;
      }
      case 10: {
        const s10 = stepData as any;
        return `CFC Name: ${s10.name || 'N/A'}
Location: ${s10.location || 'N/A'}

Land Details:
${s10.landDetails || 'N/A'}

Civil Works:
${s10.civilWorks || 'N/A'}

Manufacturing Process:
${s10.manufacturingProcess || 'N/A'}

Plant & Machinery:
${s10.plantAndMachinery || 'N/A'}

Capacity: ${s10.capacity || 'N/A'}
Power Requirements: ${s10.powerRequirements || 'N/A'}
Water Requirements: ${s10.waterRequirements || 'N/A'}
Manpower Requirements: ${s10.manpowerRequirements || 'N/A'}`;
      }
      case 11: {
        const s11 = stepData as any;
        return `SPV Name: ${s11.spvName || 'N/A'}
Legal Status: ${s11.legalStatus || 'N/A'}
Year of Incorporation: ${s11.yearOfIncorporation || 'N/A'}

Objectives:
${(s11.objectives || []).map((o: string) => `- ${o}`).join('\n') || 'N/A'}

Roles & Responsibilities:
${(s11.rolesAndResponsibilities || []).map((r: string) => `- ${r}`).join('\n') || 'N/A'}

Board of Directors:
${(s11.boardOfDirectors || []).map((d: any) => `- ${d.name || 'N/A'} (${d.designation || 'N/A'})`).join('\n') || 'N/A'}

Shareholding Pattern:
${(s11.shareholdingPattern || []).map((s: any) => `- ${s.stakeholder || 'N/A'}: ${s.percentage || 0}%`).join('\n') || 'N/A'}

Member Units:
${(s11.memberUnits || []).map((u: any) => `- ${u.name || 'N/A'} (Reg: ${u.registration || 'N/A'})`).join('\n') || 'N/A'}

Statutory Registrations:
${(s11.statutoryRegistrations || []).map((r: string) => `- ${r}`).join('\n') || 'N/A'}`;
      }
      case 12: {
        const s12 = stepData as any;
        const total = (s12.land || 0) + (s12.building || 0) + (s12.machinery || 0) + 
                     (s12.utilitiesAndInfrastructure || 0) + (s12.preliminaryAndPreOperative || 0) + 
                     (s12.workingCapitalMargin || 0);
        return `Land: ₹${(s12.land || 0).toLocaleString('en-IN')}
Building: ₹${(s12.building || 0).toLocaleString('en-IN')}
Machinery: ₹${(s12.machinery || 0).toLocaleString('en-IN')}
Utilities & Infrastructure: ₹${(s12.utilitiesAndInfrastructure || 0).toLocaleString('en-IN')}
Preliminary & Pre-operative: ₹${(s12.preliminaryAndPreOperative || 0).toLocaleString('en-IN')}
Working Capital Margin: ₹${(s12.workingCapitalMargin || 0).toLocaleString('en-IN')}

Total Project Cost: ₹${total.toLocaleString('en-IN')}`;
      }
      case 13: {
        const s13 = stepData as any;
        const total = (s13.spvContribution || 0) + (s13.governmentGrant || 0) + 
                     (s13.bankLoan || 0) + (s13.otherSources || 0);
        return `SPV Contribution: ₹${(s13.spvContribution || 0).toLocaleString('en-IN')}
Government Grant: ₹${(s13.governmentGrant || 0).toLocaleString('en-IN')}
Bank Loan: ₹${(s13.bankLoan || 0).toLocaleString('en-IN')}
Other Sources: ₹${(s13.otherSources || 0).toLocaleString('en-IN')}

Total Finance: ₹${total.toLocaleString('en-IN')}`;
      }
      case 14: {
        const s14 = stepData as any;
        return `Raw Material Cost: ₹${(s14.rawMaterialCost || 0).toLocaleString('en-IN')}
Power Cost: ₹${(s14.powerCost || 0).toLocaleString('en-IN')}
Wages: ₹${(s14.wages || 0).toLocaleString('en-IN')}
Maintenance: ₹${(s14.maintenance || 0).toLocaleString('en-IN')}
Administrative Expenses: ₹${(s14.administrativeExpenses || 0).toLocaleString('en-IN')}
Marketing Expenses: ₹${(s14.marketingExpenses || 0).toLocaleString('en-IN')}

Annual Production Volume: ${(s14.annualProductionVolume || 0).toLocaleString('en-IN')}
Annual Sales Realization: ₹${(s14.annualSalesRealization || 0).toLocaleString('en-IN')}`;
      }
      case 15: {
        const s15 = stepData as any;
        return `Break-even Point: ₹${(s15.breakEvenPoint || 0).toLocaleString('en-IN')}
IRR: ${s15.irr || 0}%
NPV: ₹${(s15.npv || 0).toLocaleString('en-IN')}

Sensitivity Analysis:
${s15.sensitivityAnalysis || 'N/A'}`;
      }
      case 16: {
        const s16 = stepData as any;
        return `Start Date: ${s16.startDate || 'N/A'}

Milestones:
${(s16.milestones || []).map((m: any) => 
  `- ${m.activity || 'N/A'}: ${m.timeRequired || 'N/A'} (${m.startDate || 'N/A'} to ${m.endDate || 'N/A'})`
).join('\n') || 'N/A'}

Total Implementation Period: ${s16.totalImplementationPeriod || 'N/A'}`;
      }
      case 17: {
        const s17 = stepData as any;
        return `Increase in Units: ${s17.increaseInUnits || 0}
Employment Generation: ${s17.employmentGeneration || 0}
Turnover Growth: ${s17.turnoverGrowth || 0}%
Export Growth: ${s17.exportGrowth || 0}%
Income Enhancement: ${s17.incomeEnhancement || 0}%

Sustainability Outcomes:
${(s17.sustainabilityOutcomes || []).map((o: string) => `- ${o}`).join('\n') || 'N/A'}`;
      }
      case 18: {
        const s18 = stepData as any;
        return `SPV Registration: ${s18.spvRegistration || 'Not uploaded'}
Land Documents: ${s18.landDocuments || 'Not uploaded'}
Building Estimates: ${s18.buildingEstimates || 'Not uploaded'}
Machinery Quotations: ${s18.machineryQuotations || 'Not uploaded'}
Member Registrations: ${s18.memberRegistrations || 'Not uploaded'}

Supporting Documents:
${Array.isArray(s18.supportingDocuments) && s18.supportingDocuments.length > 0
  ? s18.supportingDocuments.map((d: string) => `- ${d}`).join('\n')
  : 'No documents uploaded'}`;
      }
      default:
        return 'Content not available';
    }
  };

  const sectionTitles = [
    'Executive Summary – Basic Cluster Details',
    'Introduction & Sector Overview',
    'District & Regional Profile',
    'Cluster Profile',
    'Value Chain Details',
    'Market Assessment',
    'Gap Analysis',
    'SWOT Analysis',
    'Proposed Interventions',
    'Common Facility Centre (CFC) Details',
    'SPV Details',
    'Project Cost Details',
    'Means of Finance',
    'Operating Cost & Revenue',
    'Financial Viability',
    'Project Implementation Schedule',
    'Expected Impact',
    'Annexures & Document Uploads',
  ];

  return (
    <div className="space-y-6">
      {/* Cover Page */}
      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center">
          <h1 className="text-4xl font-bold mb-4">Detailed Project Report</h1>
          <h2 className="text-2xl font-semibold mb-2 text-primary">
            {data.step1?.clusterName || 'Cluster Name'}
          </h2>
          <p className="text-muted-foreground">
            {data.step1?.district || 'District'}, {data.step1?.location || 'Location'}
          </p>
          <div className="mt-8 pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              Generated on {new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table of Contents */}
      <Card>
        <CardHeader>
          <CardTitle>Table of Contents</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            {sectionTitles.map((title, index) => (
              <li key={index} className="text-sm">
                <a href={`#section-${index + 1}`} className="text-primary hover:underline">
                  {index + 1}. {title}
                </a>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <DPRVisualizations data={data} />

      {/* Sections */}
      {sectionTitles.map((title, index) => {
        const step = index + 1;
        const sectionId = `section-${step}`;
        const content = generateSectionContent(step);
        
        return (
          <Card key={sectionId} id={sectionId}>
            <CardHeader>
              <CardTitle className="text-xl">
                {step}. {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderEditableContent(sectionId, content)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
