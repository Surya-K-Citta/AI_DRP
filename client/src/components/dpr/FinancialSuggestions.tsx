// @ts-nocheck
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DollarSign, TrendingUp, Target, CheckCircle, ExternalLink } from 'lucide-react';

interface FinancialSuggestionsProps {
  suggestions: any;
  onApplySuggestion?: (suggestion: any) => void;
}

export const FinancialSuggestions: React.FC<FinancialSuggestionsProps> = ({
  suggestions,
  onApplySuggestion,
}) => {
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
              Financial Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {financialSuggestions.projectCostBreakdown && (
              <div>
                <h4 className="font-medium mb-2">Project Cost Breakdown</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Fixed Capital:</span>
                    <span className="font-medium">
                      ₹{financialSuggestions.projectCostBreakdown.fixedCapital?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Working Capital:</span>
                    <span className="font-medium">
                      ₹{financialSuggestions.projectCostBreakdown.workingCapital?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {financialSuggestions.meansOfFinance && (
              <div>
                <h4 className="font-medium mb-2">Means of Finance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Own Contribution:</span>
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
                    <span>Term Loan:</span>
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
                <h4 className="font-medium mb-2">Financial Ratios</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>DSCR:</span>
                    <span className="font-medium">{financialSuggestions.financialRatios.debtServiceCoverageRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payback Period:</span>
                    <span className="font-medium">{financialSuggestions.financialRatios.paybackPeriod} years</span>
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
                Apply Financial Suggestions
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
              Recommended Government Schemes
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
                    <p><strong>Eligibility:</strong> {scheme.eligibility}</p>
                    <p><strong>Category:</strong> {scheme.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                    {scheme.applicationUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={scheme.applicationUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Apply
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
              Sector Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Avg Project Cost:</span>
                <span className="font-medium">₹{sectorBenchmarks.averageProjectCost?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Own Contribution:</span>
                <span className="font-medium">{sectorBenchmarks.averageOwnContribution}%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Payback Period:</span>
                <span className="font-medium">{sectorBenchmarks.averagePaybackPeriod} years</span>
              </div>
              <div className="flex justify-between">
                <span>Avg ROI:</span>
                <span className="font-medium">{sectorBenchmarks.averageROI}%</span>
              </div>
            </div>
            
            {sectorBenchmarks.keySuccessFactors && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Key Success Factors</h4>
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
