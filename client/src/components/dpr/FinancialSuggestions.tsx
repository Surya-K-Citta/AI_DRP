// @ts-nocheck
import { safeUrl } from '@/lib/security/sanitizeText';
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useClusterFormText } from '@/lib/clusterDprFormText';
import { DollarSign, TrendingUp, Target, CheckCircle, ExternalLink } from 'lucide-react';

interface FinancialSuggestionsProps {
  suggestions: any;
  onApplySuggestion?: (suggestion: any) => void;
}

export const FinancialSuggestions: React.FC<FinancialSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
}) => {
  const tf = useClusterFormText();
  if (!suggestions) return null;

  const { financialSuggestions, schemeSuggestions, sectorBenchmarks } = suggestions;

  return (
    <div className="space-y-6">
      {/* Financial Suggestions */}
      {financialSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              {tf('Financial Recommendations')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialSuggestions.projectCostBreakdown && (
              <div>
                <h4 className="font-medium mb-2">{tf('Project Cost Breakdown')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>{tf('Fixed Capital:')}</span>
                    <span className="font-medium">
                      ₹{financialSuggestions.projectCostBreakdown.fixedCapital?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tf('Working Capital:')}</span>
                    <span className="font-medium">
                      ₹{financialSuggestions.projectCostBreakdown.workingCapital?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {financialSuggestions.meansOfFinance && (
              <div>
                <h4 className="font-medium mb-2">{tf('Means of Finance')}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{tf('Own Contribution:')}</span>
                    <div className="text-right">
                      <div className="font-medium">
                        ₹{financialSuggestions.meansOfFinance.ownContribution?.amount?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({financialSuggestions.meansOfFinance.ownContribution?.percentage}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{tf('Term Loan:')}</span>
                    <div className="text-right">
                      <div className="font-medium">
                        ₹{financialSuggestions.meansOfFinance.termLoan?.amount?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({financialSuggestions.meansOfFinance.termLoan?.percentage}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {financialSuggestions.financialRatios && (
              <div>
                <h4 className="font-medium mb-2">{tf('Financial Ratios')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>{tf('DSCR:')}</span>
                    <span className="font-medium">{financialSuggestions.financialRatios.debtServiceCoverageRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{tf('Payback Period:')}</span>
                    <span className="font-medium">{financialSuggestions.financialRatios.paybackPeriod} {tf('years')}</span>
                  </div>
                </div>
              </div>
            )}

            {onApplySuggestion && (
              <Button
                onClick={() => onApplySuggestion(financialSuggestions)}
                className="w-full"
                size="sm"
              >
                {tf('Apply Financial Suggestions')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Government Schemes */}
      {schemeSuggestions && schemeSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              {tf('Recommended Government Schemes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schemeSuggestions.map((scheme: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{scheme.name}</h4>
                      <p className="text-sm text-muted-foreground">{scheme.description}</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {scheme.subsidy}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>{tf('Eligibility:')}</strong> {scheme.eligibility}</p>
                    <p><strong>{tf('Category:')}</strong> {scheme.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      {tf('Learn More')}
                    </Button>
                    {scheme.applicationUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={safeUrl(scheme.applicationUrl)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {tf('Apply')}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sector Benchmarks */}
      {sectorBenchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {tf('Sector Benchmarks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>{tf('Avg Project Cost:')}</span>
                <span className="font-medium">₹{sectorBenchmarks.averageProjectCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{tf('Avg Own Contribution:')}</span>
                <span className="font-medium">{sectorBenchmarks.averageOwnContribution}%</span>
              </div>
              <div className="flex justify-between">
                <span>{tf('Avg Payback Period:')}</span>
                <span className="font-medium">{sectorBenchmarks.averagePaybackPeriod} {tf('years')}</span>
              </div>
              <div className="flex justify-between">
                <span>{tf('Avg ROI:')}</span>
                <span className="font-medium">{sectorBenchmarks.averageROI}%</span>
              </div>
            </div>
            
            {sectorBenchmarks.keySuccessFactors && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">{tf('Key Success Factors')}</h4>
                <ul className="space-y-1">
                  {sectorBenchmarks.keySuccessFactors.map((factor: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
