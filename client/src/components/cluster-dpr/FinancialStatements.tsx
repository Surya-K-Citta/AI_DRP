// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface FinancialStatementsProps {
  data: any;
  onChange: (field: string, value: any) => void;
  projectData?: any;
}

export const FinancialStatements: React.FC<FinancialStatementsProps> = ({ data, onChange, projectData }) => {
  const [generating, setGenerating] = useState<string | null>(null);
  
  const financialStatements = data || {};

  // Helper to handle nested field changes
  const handleNestedChange = (path: string[], value: any) => {
    const current = path.reduce((obj, key, idx) => {
      if (idx === path.length - 1) {
        return obj;
      }
      return obj[key] || {};
    }, data);
    
    const newData = { ...data };
    let target = newData;
    for (let i = 0; i < path.length - 1; i++) {
      if (!target[path[i]]) target[path[i]] = {};
      target = target[path[i]];
    }
    target[path[path.length - 1]] = value;
    onChange('financialStatements', newData);
  };

  // Generate financial statements using AI
  const generateFinancialStatements = async () => {
    setGenerating('all');
    try {
      const response = await api.generateFinancialStatements(projectData || {});
      if (response.success && response.data) {
        onChange('financialStatements', response.data);
        toast.success('Financial statements generated successfully!');
      } else {
        toast.error('Failed to generate financial statements');
      }
    } catch (error: any) {
      console.error('Error generating financial statements:', error);
      toast.error(error.message || 'Failed to generate financial statements');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with AI Generate Button */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h3 className="text-xl font-semibold">Financial Statements</h3>
          <p className="text-sm text-muted-foreground">
            Enter data manually or generate using AI based on project details
          </p>
        </div>
        <Button
          variant="outline"
          onClick={generateFinancialStatements}
          disabled={generating === 'all'}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {generating === 'all' ? 'Generating...' : 'Generate All with AI'}
        </Button>
      </div>

      {/* Statement 1: Cost of Project & Means of Finance */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 1: Cost of Project & Means of Finance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cost of Project (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.costOfProject || ''}
              onChange={(e) => handleNestedChange(['costOfProject'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">SPV Share (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.spvShare || ''}
              onChange={(e) => handleNestedChange(['spvShare'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">State Govt. Grant (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.stateGovtGrant || ''}
              onChange={(e) => handleNestedChange(['stateGovtGrant'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Bank Loan (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.bankLoan || ''}
              onChange={(e) => handleNestedChange(['bankLoan'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Statement 2: Assessment of Working Capital */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 2: Assessment of Working Capital</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Raw Materials (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.rawMaterials || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'rawMaterials'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Work in Progress (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.workInProgress || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'workInProgress'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Finished Goods (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.finishedGoods || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'finishedGoods'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Debtors (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.debtors || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'debtors'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cash & Bank Balance (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.cashBankBalance || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'cashBankBalance'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Creditors (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.workingCapital?.creditors || ''}
              onChange={(e) => handleNestedChange(['workingCapital', 'creditors'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Statement 3: Cost of Production & Profitability (5 years) */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 3: Cost of Production & Profitability (5 Years)</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((year) => (
            <div key={year} className="border rounded p-4 space-y-3">
              <h5 className="font-medium">Year {year}</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sales Realization (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.costOfProduction?.[`year${year}`]?.salesRealization || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.costOfProduction) newData.costOfProduction = {};
                      if (!newData.costOfProduction[`year${year}`]) newData.costOfProduction[`year${year}`] = {};
                      newData.costOfProduction[`year${year}`].salesRealization = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Cost (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.costOfProduction?.[`year${year}`]?.totalCost || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.costOfProduction) newData.costOfProduction = {};
                      if (!newData.costOfProduction[`year${year}`]) newData.costOfProduction[`year${year}`] = {};
                      newData.costOfProduction[`year${year}`].totalCost = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profit Before Tax (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.costOfProduction?.[`year${year}`]?.profitBeforeTax || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.costOfProduction) newData.costOfProduction = {};
                      if (!newData.costOfProduction[`year${year}`]) newData.costOfProduction[`year${year}`] = {};
                      newData.costOfProduction[`year${year}`].profitBeforeTax = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement 4: Assumptions for Cost of Production & Profitability */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 4: Assumptions for Cost of Production & Profitability</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Capacity Utilization Year 1 (%)</label>
            <Input
              type="number"
              value={financialStatements.assumptions?.capacityUtilizationYear1 || ''}
              onChange={(e) => handleNestedChange(['assumptions', 'capacityUtilizationYear1'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Capacity Utilization Year 2 (%)</label>
            <Input
              type="number"
              value={financialStatements.assumptions?.capacityUtilizationYear2 || ''}
              onChange={(e) => handleNestedChange(['assumptions', 'capacityUtilizationYear2'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Capacity Utilization Year 3+ (%)</label>
            <Input
              type="number"
              value={financialStatements.assumptions?.capacityUtilizationYear3Onwards || ''}
              onChange={(e) => handleNestedChange(['assumptions', 'capacityUtilizationYear3Onwards'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Raw Material Cost (% of Revenue)</label>
            <Input
              type="number"
              value={financialStatements.assumptions?.rawMaterialCostPercentage || ''}
              onChange={(e) => handleNestedChange(['assumptions', 'rawMaterialCostPercentage'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Statement 5: Estimation of Power Cost */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 5: Estimation of Power Cost</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Connected Load (KW)</label>
            <Input
              type="number"
              value={financialStatements.powerCost?.connectedLoad || ''}
              onChange={(e) => handleNestedChange(['powerCost', 'connectedLoad'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Monthly Consumption (Units)</label>
            <Input
              type="number"
              value={financialStatements.powerCost?.monthlyConsumption || ''}
              onChange={(e) => handleNestedChange(['powerCost', 'monthlyConsumption'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Rate per Unit (₹)</label>
            <Input
              type="number"
              value={financialStatements.powerCost?.ratePerUnit || ''}
              onChange={(e) => handleNestedChange(['powerCost', 'ratePerUnit'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Annual Power Cost (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.powerCost?.annualCost || ''}
              onChange={(e) => handleNestedChange(['powerCost', 'annualCost'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Statement 6: Manpower Requirement & Estimation of Cost */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 6: Manpower Requirement & Estimation of Cost</h4>
        <div className="space-y-4">
          {(financialStatements.manpower || []).map((mp: any, index: number) => (
            <div key={index} className="border rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Employee Category {index + 1}</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newManpower = [...(financialStatements.manpower || [])];
                    newManpower.splice(index, 1);
                    handleNestedChange(['manpower'], newManpower);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <Input
                    value={mp.category || ''}
                    onChange={(e) => {
                      const newManpower = [...(financialStatements.manpower || [])];
                      newManpower[index] = { ...newManpower[index], category: e.target.value };
                      handleNestedChange(['manpower'], newManpower);
                    }}
                    placeholder="e.g., Executive, Worker"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">No. of Employees</label>
                  <Input
                    type="number"
                    value={mp.count || ''}
                    onChange={(e) => {
                      const newManpower = [...(financialStatements.manpower || [])];
                      newManpower[index] = { ...newManpower[index], count: parseInt(e.target.value) || 0 };
                      handleNestedChange(['manpower'], newManpower);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Annual Salary (₹)</label>
                  <Input
                    type="number"
                    value={mp.annualSalary || ''}
                    onChange={(e) => {
                      const newManpower = [...(financialStatements.manpower || [])];
                      newManpower[index] = { ...newManpower[index], annualSalary: parseFloat(e.target.value) || 0 };
                      handleNestedChange(['manpower'], newManpower);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Cost (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={mp.totalCost || ''}
                    onChange={(e) => {
                      const newManpower = [...(financialStatements.manpower || [])];
                      newManpower[index] = { ...newManpower[index], totalCost: parseFloat(e.target.value) || 0 };
                      handleNestedChange(['manpower'], newManpower);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newManpower = [...(financialStatements.manpower || []), { category: '', count: 0, annualSalary: 0, totalCost: 0 }];
              handleNestedChange(['manpower'], newManpower);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Employee Category
          </Button>
        </div>
      </div>

      {/* Statement 7: Estimation of Depreciation */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 7: Estimation of Depreciation</h4>
        <div className="space-y-4">
          {(financialStatements.depreciation || []).map((dep: any, index: number) => (
            <div key={index} className="border rounded p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Asset {index + 1}</h5>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDep = [...(financialStatements.depreciation || [])];
                    newDep.splice(index, 1);
                    handleNestedChange(['depreciation'], newDep);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Asset Name</label>
                  <Input
                    value={dep.asset || ''}
                    onChange={(e) => {
                      const newDep = [...(financialStatements.depreciation || [])];
                      newDep[index] = { ...newDep[index], asset: e.target.value };
                      handleNestedChange(['depreciation'], newDep);
                    }}
                    placeholder="e.g., Building, Machinery"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={dep.cost || ''}
                    onChange={(e) => {
                      const newDep = [...(financialStatements.depreciation || [])];
                      newDep[index] = { ...newDep[index], cost: parseFloat(e.target.value) || 0 };
                      handleNestedChange(['depreciation'], newDep);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Depreciation Rate (%)</label>
                  <Input
                    type="number"
                    value={dep.rate || ''}
                    onChange={(e) => {
                      const newDep = [...(financialStatements.depreciation || [])];
                      newDep[index] = { ...newDep[index], rate: parseFloat(e.target.value) || 0 };
                      handleNestedChange(['depreciation'], newDep);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Annual Depreciation (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={dep.annualDepreciation || ''}
                    onChange={(e) => {
                      const newDep = [...(financialStatements.depreciation || [])];
                      newDep[index] = { ...newDep[index], annualDepreciation: parseFloat(e.target.value) || 0 };
                      handleNestedChange(['depreciation'], newDep);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDep = [...(financialStatements.depreciation || []), { asset: '', cost: 0, rate: 0, annualDepreciation: 0 }];
              handleNestedChange(['depreciation'], newDep);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Statement 8: Calculation of Income Tax */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 8: Calculation of Income Tax (5 Years)</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((year) => (
            <div key={year} className="border rounded p-4 space-y-3">
              <h5 className="font-medium">Year {year}</h5>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Profit Before Tax (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.incomeTax?.[`year${year}`]?.profitBeforeTax || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.incomeTax) newData.incomeTax = {};
                      if (!newData.incomeTax[`year${year}`]) newData.incomeTax[`year${year}`] = {};
                      newData.incomeTax[`year${year}`].profitBeforeTax = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                  <Input
                    type="number"
                    value={financialStatements.incomeTax?.[`year${year}`]?.taxRate || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.incomeTax) newData.incomeTax = {};
                      if (!newData.incomeTax[`year${year}`]) newData.incomeTax[`year${year}`] = {};
                      newData.incomeTax[`year${year}`].taxRate = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax Amount (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.incomeTax?.[`year${year}`]?.taxAmount || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.incomeTax) newData.incomeTax = {};
                      if (!newData.incomeTax[`year${year}`]) newData.incomeTax[`year${year}`] = {};
                      newData.incomeTax[`year${year}`].taxAmount = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Profit After Tax (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.incomeTax?.[`year${year}`]?.profitAfterTax || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.incomeTax) newData.incomeTax = {};
                      if (!newData.incomeTax[`year${year}`]) newData.incomeTax[`year${year}`] = {};
                      newData.incomeTax[`year${year}`].profitAfterTax = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement 9: Projected Cash Flow Statement */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 9: Projected Cash Flow Statement (5 Years)</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((year) => (
            <div key={year} className="border rounded p-4 space-y-3">
              <h5 className="font-medium">Year {year}</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cash Inflow (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.cashFlow?.[`year${year}`]?.inflow || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.cashFlow) newData.cashFlow = {};
                      if (!newData.cashFlow[`year${year}`]) newData.cashFlow[`year${year}`] = {};
                      newData.cashFlow[`year${year}`].inflow = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cash Outflow (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.cashFlow?.[`year${year}`]?.outflow || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.cashFlow) newData.cashFlow = {};
                      if (!newData.cashFlow[`year${year}`]) newData.cashFlow[`year${year}`] = {};
                      newData.cashFlow[`year${year}`].outflow = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Net Cash Flow (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.cashFlow?.[`year${year}`]?.netCashFlow || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.cashFlow) newData.cashFlow = {};
                      if (!newData.cashFlow[`year${year}`]) newData.cashFlow[`year${year}`] = {};
                      newData.cashFlow[`year${year}`].netCashFlow = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement 10: Projected Balance Sheet */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 10: Projected Balance Sheet (5 Years)</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((year) => (
            <div key={year} className="border rounded p-4 space-y-3">
              <h5 className="font-medium">Year {year}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Assets (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.balanceSheet?.[`year${year}`]?.totalAssets || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.balanceSheet) newData.balanceSheet = {};
                      if (!newData.balanceSheet[`year${year}`]) newData.balanceSheet[`year${year}`] = {};
                      newData.balanceSheet[`year${year}`].totalAssets = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Liabilities (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.balanceSheet?.[`year${year}`]?.totalLiabilities || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.balanceSheet) newData.balanceSheet = {};
                      if (!newData.balanceSheet[`year${year}`]) newData.balanceSheet[`year${year}`] = {};
                      newData.balanceSheet[`year${year}`].totalLiabilities = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement 11: Estimation of Break Even Point */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 11: Estimation of Break Even Point (5 Years)</h4>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((year) => (
            <div key={year} className="border rounded p-4 space-y-3">
              <h5 className="font-medium">Year {year}</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fixed Expenses (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.breakEven?.[`year${year}`]?.fixedExpenses || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.breakEven) newData.breakEven = {};
                      if (!newData.breakEven[`year${year}`]) newData.breakEven[`year${year}`] = {};
                      newData.breakEven[`year${year}`].fixedExpenses = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Variable Expenses (₹ Lakhs)</label>
                  <Input
                    type="number"
                    value={financialStatements.breakEven?.[`year${year}`]?.variableExpenses || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.breakEven) newData.breakEven = {};
                      if (!newData.breakEven[`year${year}`]) newData.breakEven[`year${year}`] = {};
                      newData.breakEven[`year${year}`].variableExpenses = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Break Even Point (%)</label>
                  <Input
                    type="number"
                    value={financialStatements.breakEven?.[`year${year}`]?.breakEvenPoint || ''}
                    onChange={(e) => {
                      const newData = { ...financialStatements };
                      if (!newData.breakEven) newData.breakEven = {};
                      if (!newData.breakEven[`year${year}`]) newData.breakEven[`year${year}`] = {};
                      newData.breakEven[`year${year}`].breakEvenPoint = parseFloat(e.target.value) || 0;
                      onChange('financialStatements', newData);
                    }}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statement 12: Estimation of NPV & IRR */}
      <div className="border rounded-lg p-6 space-y-4">
        <h4 className="text-lg font-semibold">Statement 12: Estimation of NPV & IRR</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">NPV (₹ Lakhs)</label>
            <Input
              type="number"
              value={financialStatements.npvIrr?.npv || ''}
              onChange={(e) => handleNestedChange(['npvIrr', 'npv'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">IRR (%)</label>
            <Input
              type="number"
              value={financialStatements.npvIrr?.irr || ''}
              onChange={(e) => handleNestedChange(['npvIrr', 'irr'], parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Discount Rate (%)</label>
            <Input
              type="number"
              value={financialStatements.npvIrr?.discountRate || ''}
              onChange={(e) => handleNestedChange(['npvIrr', 'discountRate'], parseFloat(e.target.value) || 0)}
              placeholder="8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
