// @ts-nocheck
import { IProject } from '../types';

export class FinancialService {
  /**
   * Calculate project cost breakdown
   */
  static calculateProjectCost(project: IProject): any {
    const machinery = project.inputs.machinery || [];
    const infrastructure = project.inputs.infrastructure || {};
    
    const machineryTotal = machinery.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const landCost = infrastructure.landCost || 0;
    const buildingCost = infrastructure.buildingCost || 0;
    const workingCapital = project.totalCost * 0.15; // 15% for working capital
    const preliminaryExpenses = project.totalCost * 0.05; // 5% for preliminary expenses

    return {
      fixedCapital: {
        land: landCost,
        building: buildingCost,
        machineryAndEquipment: machineryTotal,
        total: landCost + buildingCost + machineryTotal,
      },
      workingCapital: {
        rawMaterials: workingCapital * 0.6,
        cashInHand: workingCapital * 0.2,
        others: workingCapital * 0.2,
        total: workingCapital,
      },
      preliminaryExpenses: preliminaryExpenses,
      totalProjectCost: project.totalCost,
    };
  }

  /**
   * Calculate means of finance
   */
  static calculateMeansOfFinance(project: IProject): any {
    const marginMoneyPercentage = 0.15; // 15% typical for MSME
    const termLoan = project.loanAmount;
    const ownContribution = project.ownContribution;
    const subsidy = project.totalCost * 0.10; // Assume 10% subsidy if eligible

    return {
      ownContribution: {
        amount: ownContribution,
        percentage: ((ownContribution / project.totalCost) * 100).toFixed(2),
      },
      termLoan: {
        amount: termLoan,
        percentage: ((termLoan / project.totalCost) * 100).toFixed(2),
      },
      subsidy: {
        amount: subsidy,
        percentage: ((subsidy / project.totalCost) * 100).toFixed(2),
      },
      total: project.totalCost,
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

