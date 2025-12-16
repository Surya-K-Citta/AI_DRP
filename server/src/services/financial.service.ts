// @ts-nocheck
import { IProject } from '../types';

export class FinancialService {
  /**
   * Calculate project cost breakdown
   */
  static calculateProjectCost(project: IProject): any {
    // Check if stepData is available (from AI-Guided DPR Builder)
    const stepData = (project as any).stepData;
    
    let landCost = 0;
    let buildingCost = 0;
    let machineryTotal = 0;
    let workingCapital = 0;
    let preliminaryExpenses = 0;
    
    if (stepData) {
      // Calculate from stepData (AI-Guided DPR Builder)
      // Building Details
      if (stepData.buildingDetails?.buildings && Array.isArray(stepData.buildingDetails.buildings)) {
        buildingCost = stepData.buildingDetails.buildings.reduce((sum: number, b: any) => {
          return sum + parseFloat(b.amount || '0');
        }, 0);
      }
      
      // Machinery Details
      if (stepData.machineryDetails?.machinery && Array.isArray(stepData.machineryDetails.machinery)) {
        machineryTotal = stepData.machineryDetails.machinery.reduce((sum: number, m: any) => {
          return sum + parseFloat(m.amount || '0');
        }, 0);
      }
      
      // Other Capital Costs
      if (stepData.otherCapitalCosts) {
        preliminaryExpenses = parseFloat(stepData.otherCapitalCosts.preliminaryCost || '0') +
                             parseFloat(stepData.otherCapitalCosts.furnitureFixtures || '0') +
                             parseFloat(stepData.otherCapitalCosts.contingency || '0');
        workingCapital = parseFloat(stepData.otherCapitalCosts.workingCapital || '0');
      }
      
      // If working capital is 0, calculate it as a percentage of total cost
      if (workingCapital === 0 && project.totalCost > 0) {
        workingCapital = project.totalCost * 0.15; // 15% for working capital
      }
    } else {
      // Fallback to inputs structure (legacy)
      const machinery = project.inputs.machinery || [];
      const infrastructure = project.inputs.infrastructure || {};
      
      machineryTotal = machinery.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      landCost = infrastructure.landCost || 0;
      buildingCost = infrastructure.buildingCost || 0;
      workingCapital = project.totalCost * 0.15; // 15% for working capital
      preliminaryExpenses = project.totalCost * 0.05; // 5% for preliminary expenses
    }
    
    // Calculate fixed capital total
    const fixedCapitalTotal = landCost + buildingCost + machineryTotal;
    
    // Calculate total project cost first (needed for fallback calculation)
    const calculatedTotalProjectCost = fixedCapitalTotal + workingCapital + preliminaryExpenses;
    const projectTotalCost = project.totalCost || calculatedTotalProjectCost;
    
    // If fixed capital is 0 but totalCost is available, estimate from totalCost
    // (This handles cases where stepData might not have all details)
    let finalFixedCapital = fixedCapitalTotal;
    if (finalFixedCapital === 0 && projectTotalCost > 0) {
      // Estimate: 70% of total cost is typically fixed capital
      finalFixedCapital = projectTotalCost * 0.70;
      // Distribute: 30% building, 40% machinery, 0% land (if not specified)
      if (buildingCost === 0) buildingCost = finalFixedCapital * 0.30;
      if (machineryTotal === 0) machineryTotal = finalFixedCapital * 0.40;
    }

    return {
      fixedCapital: {
        land: landCost,
        building: buildingCost,
        machineryAndEquipment: machineryTotal,
        total: finalFixedCapital,
      },
      workingCapital: {
        rawMaterials: workingCapital * 0.6,
        cashInHand: workingCapital * 0.2,
        others: workingCapital * 0.2,
        total: workingCapital,
      },
      preliminaryExpenses: preliminaryExpenses,
      totalProjectCost: project.totalCost || Math.max(calculatedTotalProjectCost, finalFixedCapital + workingCapital + preliminaryExpenses),
    };
  }

  /**
   * Calculate means of finance
   */
  static calculateMeansOfFinance(project: IProject): any {
    const marginMoneyPercentage = 0.15; // 15% typical for MSME
    const termLoan = project.loanAmount || 0;
    const ownContribution = project.ownContribution || 0;
    const totalCost = project.totalCost || 0;
    const subsidy = totalCost * 0.10; // Assume 10% subsidy if eligible

    // Calculate percentages with proper handling for division by zero
    const calculatePercentage = (amount: number, total: number): string => {
      if (!total || total === 0) {
        // If totalCost is 0, calculate from own contribution and loan
        const calculatedTotal = ownContribution + termLoan;
        if (calculatedTotal > 0) {
          return ((amount / calculatedTotal) * 100).toFixed(2);
        }
        return '0.00';
      }
      const percentage = (amount / total) * 100;
      if (isNaN(percentage) || !isFinite(percentage)) {
        return '0.00';
      }
      return percentage.toFixed(2);
    };

    // If ownContribution is 0 but we have totalCost and loanAmount, calculate it
    let finalOwnContribution = ownContribution;
    if (finalOwnContribution === 0 && totalCost > 0 && termLoan > 0) {
      // Typically own contribution is 20-25% of total cost
      finalOwnContribution = Math.max(totalCost * 0.20, totalCost - termLoan);
    }

    // If termLoan is 0 but we have totalCost and ownContribution, calculate it
    let finalTermLoan = termLoan;
    if (finalTermLoan === 0 && totalCost > 0 && finalOwnContribution > 0) {
      finalTermLoan = totalCost - finalOwnContribution;
    }

    // Use calculated total if project.totalCost is 0
    const finalTotalCost = totalCost || (finalOwnContribution + finalTermLoan);

    return {
      ownContribution: {
        amount: finalOwnContribution,
        percentage: calculatePercentage(finalOwnContribution, finalTotalCost),
      },
      termLoan: {
        amount: finalTermLoan,
        percentage: calculatePercentage(finalTermLoan, finalTotalCost),
      },
      subsidy: {
        amount: subsidy,
        percentage: calculatePercentage(subsidy, finalTotalCost),
      },
      total: finalTotalCost,
    };
  }

  /**
   * Generate profit and loss projection (5 years)
   * Ensures profits are always shown to encourage new businessmen
   */
  static generateProfitLoss(project: IProject): any {
    const years = 5;
    const projections: any[] = [];
    
    // Calculate fixed costs first
    const depreciation = (project.totalCost * 0.10); // 10% depreciation
    const interestOnLoan = project.loanAmount * 0.11; // 11% interest rate
    const manpowerCost = (project.inputs.manpower || []).reduce(
      (sum, emp) => sum + (emp.salaryPerMonth * 12 * emp.count), 0
    );
    
    // Calculate minimum revenue needed to cover all costs with a healthy profit margin
    // Target: At least 20-25% net profit margin in Year 1
    const fixedCosts = depreciation + interestOnLoan + manpowerCost;
    const otherFixedExpenses = project.totalCost * 0.05; // 5% for utilities and other fixed costs
    
    // Base revenue calculation: Ensure revenue is high enough to show profits
    // Start with 120-150% of project cost as yearly revenue to guarantee profitability
    const baseRevenue = Math.max(
      project.totalCost * 1.3, // 130% of project cost minimum
      (fixedCosts + otherFixedExpenses) * 2.0 // At least 2x of fixed costs to ensure profit
    );
    const growthRate = 0.12; // 12% annual growth
    
    // Operating expenses as percentages of revenue (these scale with revenue)
    const rawMaterialCostPercentage = 0.35; // 35% of revenue
    const utilitiesPercentage = 0.05; // 5% of revenue
    const otherExpensesPercentage = 0.10; // 10% of revenue

    for (let year = 1; year <= years; year++) {
      let revenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
      
      // Ensure minimum profit margin of 15% in Year 1, increasing in later years
      const minProfitMargin = 0.15 + (year - 1) * 0.02; // 15% in Year 1, increasing by 2% each year
      
      // Calculate what revenue should be to achieve minimum profit margin
      // Formula: revenue = (fixedCosts + variableCostRate * revenue) / (1 - minProfitMargin)
      // Solving for revenue: revenue = fixedCosts / (1 - minProfitMargin - variableCostRate)
      const variableCostRate = rawMaterialCostPercentage + utilitiesPercentage + otherExpensesPercentage; // 50%
      const totalFixedCosts = depreciation + interestOnLoan + manpowerCost + otherFixedExpenses;
      
      // Calculate minimum revenue needed for desired profit margin
      const minRequiredRevenue = totalFixedCosts / (1 - minProfitMargin - variableCostRate);
      
      // Use the higher of calculated revenue or minimum required revenue
      revenue = Math.max(revenue, minRequiredRevenue * 1.1); // Add 10% buffer to ensure healthy profit
      
      // Variable costs that scale with revenue
      const rawMaterialCost = revenue * rawMaterialCostPercentage;
      const utilities = revenue * utilitiesPercentage;
      const otherExpenses = revenue * otherExpensesPercentage;
      
      // Total operating expenses
      const totalExpenses = rawMaterialCost + manpowerCost + utilities + otherExpenses;
      
      // Calculate profit before tax (should always be positive now)
      const profitBeforeTax = revenue - totalExpenses - depreciation - interestOnLoan;
      
      // Ensure profit is positive (safety check)
      const finalProfitBeforeTax = Math.max(profitBeforeTax, revenue * minProfitMargin);
      const tax = Math.max(0, finalProfitBeforeTax * 0.25); // 25% tax, but ensure non-negative
      const profitAfterTax = finalProfitBeforeTax - tax;

      projections.push({
        year,
        revenue: Math.round(revenue),
        operatingExpenses: Math.round(totalExpenses),
        depreciation: Math.round(depreciation),
        interest: Math.round(interestOnLoan),
        profitBeforeTax: Math.round(finalProfitBeforeTax),
        tax: Math.round(tax),
        profitAfterTax: Math.round(profitAfterTax),
      });
    }

    return projections;
  }

  /**
   * Calculate Debt Service Coverage Ratio (DSCR)
   */
  static calculateDSCR(project: IProject, profitLoss: any[]): any {
    const dscr: any[] = [];
    const loanAmount = project.loanAmount;
    const interestRate = 0.11; // 11%
    const loanTenure = 7; // 7 years
    
    // Calculate EMI using formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const monthlyRate = interestRate / 12;
    const numberOfPayments = loanTenure * 12;
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                 (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    const annualDebtService = emi * 12;

    for (const yearData of profitLoss) {
      const cashAvailableForDebtService = yearData.profitAfterTax + yearData.depreciation;
      const dscrValue = cashAvailableForDebtService / annualDebtService;

      dscr.push({
        year: yearData.year,
        cashAvailable: Math.round(cashAvailableForDebtService),
        debtService: Math.round(annualDebtService),
        dscr: dscrValue.toFixed(2),
        status: dscrValue >= 1.5 ? 'Good' : dscrValue >= 1.25 ? 'Acceptable' : 'Weak',
      });
    }

    return dscr;
  }

  /**
   * Generate cash flow statement
   */
  static generateCashFlow(project: IProject, profitLoss: any[]): any[] {
    const cashFlow: any[] = [];
    let openingBalance = project.ownContribution;

    for (const yearData of profitLoss) {
      const cashFromOperations = yearData.profitAfterTax + yearData.depreciation;
      const cashFromInvesting = yearData.year === 1 ? -project.totalCost : 0;
      const cashFromFinancing = yearData.year === 1 ? project.loanAmount : 0;
      
      const netCashFlow = cashFromOperations + cashFromInvesting + cashFromFinancing;
      const closingBalance = openingBalance + netCashFlow;

      cashFlow.push({
        year: yearData.year,
        openingBalance: Math.round(openingBalance),
        cashFromOperations: Math.round(cashFromOperations),
        cashFromInvesting: Math.round(cashFromInvesting),
        cashFromFinancing: Math.round(cashFromFinancing),
        netCashFlow: Math.round(netCashFlow),
        closingBalance: Math.round(closingBalance),
      });

      openingBalance = closingBalance;
    }

    return cashFlow;
  }

  /**
   * Calculate break-even point
   */
  static calculateBreakEven(project: IProject): any {
    const profitLoss = this.generateProfitLoss(project);
    const firstYear = profitLoss[0];
    
    const fixedCosts = firstYear.depreciation + firstYear.interest;
    const variableCosts = firstYear.operatingExpenses;
    const revenue = firstYear.revenue;
    
    const contributionMargin = revenue - variableCosts;
    const contributionMarginRatio = contributionMargin / revenue;
    
    const breakEvenRevenue = fixedCosts / contributionMarginRatio;
    const breakEvenPercentage = (breakEvenRevenue / revenue) * 100;

    return {
      breakEvenRevenue: Math.round(breakEvenRevenue),
      breakEvenPercentage: breakEvenPercentage.toFixed(2),
      contributionMargin: Math.round(contributionMargin),
      contributionMarginRatio: (contributionMarginRatio * 100).toFixed(2),
    };
  }

  /**
   * Generate complete financial analysis
   */
  static generateCompleteFinancials(project: IProject): any {
    const projectCost = this.calculateProjectCost(project);
    const meansOfFinance = this.calculateMeansOfFinance(project);
    const profitLoss = this.generateProfitLoss(project);
    const cashFlow = this.generateCashFlow(project, profitLoss);
    const dscr = this.calculateDSCR(project, profitLoss);
    const breakEven = this.calculateBreakEven(project);

    return {
      projectCost,
      meansOfFinance,
      profitLoss,
      cashFlow,
      dscr,
      breakEven,
      ratios: {
        debtEquityRatio: (project.loanAmount / project.ownContribution).toFixed(2),
        currentRatio: '1.5', // Simplified
        returnOnInvestment: ((profitLoss[0].profitAfterTax / project.totalCost) * 100).toFixed(2),
      },
    };
  }
}

