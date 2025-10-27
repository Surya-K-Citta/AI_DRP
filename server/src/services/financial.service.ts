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
   */
  static generateProfitLoss(project: IProject): any {
    const years = 5;
    const projections: any[] = [];
    
    // Base revenue calculation (simplified)
    const baseRevenue = project.totalCost * 0.8; // 80% of project cost as yearly revenue
    const growthRate = 0.10; // 10% annual growth
    
    // Operating expenses
    const rawMaterialCost = baseRevenue * 0.35; // 35% of revenue
    const manpowerCost = (project.inputs.manpower || []).reduce(
      (sum, emp) => sum + (emp.salaryPerMonth * 12 * emp.count), 0
    );
    const utilities = baseRevenue * 0.05; // 5% of revenue
    const otherExpenses = baseRevenue * 0.10; // 10% of revenue

    for (let year = 1; year <= years; year++) {
      const revenue = baseRevenue * Math.pow(1 + growthRate, year - 1);
      const totalExpenses = rawMaterialCost + manpowerCost + utilities + otherExpenses;
      const depreciation = (project.totalCost * 0.10); // 10% depreciation
      const interestOnLoan = project.loanAmount * 0.11; // 11% interest rate
      
      const profitBeforeTax = revenue - totalExpenses - depreciation - interestOnLoan;
      const tax = profitBeforeTax * 0.25; // 25% tax
      const profitAfterTax = profitBeforeTax - tax;

      projections.push({
        year,
        revenue: Math.round(revenue),
        operatingExpenses: Math.round(totalExpenses),
        depreciation: Math.round(depreciation),
        interest: Math.round(interestOnLoan),
        profitBeforeTax: Math.round(profitBeforeTax),
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

