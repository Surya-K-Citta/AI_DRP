// @ts-nocheck
import { IProject } from '../types';

export class SuggestionService {
  /**
   * Get financial suggestions based on project data
   */
  static getFinancialSuggestions(project: IProject): any {
    const sector = project.industrySector.toLowerCase();
    const totalCost = project.totalCost;
    
    // Sector-specific financial benchmarks
    const sectorBenchmarks: Record<string, any> = {
      'manufacturing': {
        workingCapitalRatio: 0.25,
        fixedCapitalRatio: 0.75,
        ownContributionMin: 0.15,
        debtServiceCoverageRatio: 1.5,
        paybackPeriod: 5,
        costPerSqFt: 2500,
        machineryCostRatio: 0.4,
        buildingCostRatio: 0.3,
        landCostRatio: 0.1
      },
      'services': {
        workingCapitalRatio: 0.4,
        fixedCapitalRatio: 0.6,
        ownContributionMin: 0.2,
        debtServiceCoverageRatio: 1.3,
        paybackPeriod: 3,
        costPerSqFt: 1500,
        machineryCostRatio: 0.2,
        buildingCostRatio: 0.5,
        landCostRatio: 0.2
      },
      'agriculture': {
        workingCapitalRatio: 0.35,
        fixedCapitalRatio: 0.65,
        ownContributionMin: 0.1,
        debtServiceCoverageRatio: 1.4,
        paybackPeriod: 4,
        costPerSqFt: 800,
        machineryCostRatio: 0.5,
        buildingCostRatio: 0.2,
        landCostRatio: 0.1
      },
      'retail': {
        workingCapitalRatio: 0.5,
        fixedCapitalRatio: 0.5,
        ownContributionMin: 0.25,
        debtServiceCoverageRatio: 1.2,
        paybackPeriod: 3,
        costPerSqFt: 2000,
        machineryCostRatio: 0.1,
        buildingCostRatio: 0.6,
        landCostRatio: 0.2
      }
    };

    const benchmark = sectorBenchmarks[sector] || sectorBenchmarks['manufacturing'];
    
    return {
      projectCostBreakdown: {
        fixedCapital: Math.round(totalCost * benchmark.fixedCapitalRatio),
        workingCapital: Math.round(totalCost * benchmark.workingCapitalRatio),
        totalProjectCost: totalCost
      },
      meansOfFinance: {
        ownContribution: {
          amount: Math.max(totalCost * benchmark.ownContributionMin, project.ownContribution),
          percentage: Math.round((Math.max(totalCost * benchmark.ownContributionMin, project.ownContribution) / totalCost) * 100)
        },
        termLoan: {
          amount: totalCost - Math.max(totalCost * benchmark.ownContributionMin, project.ownContribution),
          percentage: Math.round(((totalCost - Math.max(totalCost * benchmark.ownContributionMin, project.ownContribution)) / totalCost) * 100)
        }
      },
      financialRatios: {
        debtServiceCoverageRatio: benchmark.debtServiceCoverageRatio,
        paybackPeriod: benchmark.paybackPeriod,
        workingCapitalRatio: benchmark.workingCapitalRatio
      },
      costStructure: {
        machineryCost: Math.round(totalCost * benchmark.machineryCostRatio),
        buildingCost: Math.round(totalCost * benchmark.buildingCostRatio),
        landCost: Math.round(totalCost * benchmark.landCostRatio),
        otherCosts: Math.round(totalCost * (1 - benchmark.machineryCostRatio - benchmark.buildingCostRatio - benchmark.landCostRatio))
      }
    };
  }

  /**
   * Get government scheme suggestions
   */
  static getSchemeSuggestions(project: IProject): any[] {
    const sector = project.industrySector.toLowerCase();
    const totalCost = project.totalCost;
    const location = project.location.toLowerCase();

    const schemes = [
      {
        name: 'PMEGP (Prime Minister Employment Generation Programme)',
        description: 'Credit-linked subsidy programme for setting up micro-enterprises',
        eligibility: 'New micro-enterprises with project cost up to ₹25 lakh',
        subsidy: '25-35% of project cost',
        applicable: totalCost <= 2500000 && ['manufacturing', 'services', 'agriculture'].includes(sector),
        portal: 'AP MSME ONE Portal',
        category: 'Central Government'
      },
      {
        name: 'MUDRA Yojana',
        description: 'Micro Units Development and Refinance Agency for small businesses',
        eligibility: 'Micro and small enterprises',
        subsidy: 'No subsidy, but collateral-free loans up to ₹10 lakh',
        applicable: totalCost <= 1000000,
        portal: 'MUDRA Portal',
        category: 'Central Government'
      },
      {
        name: 'AP MSME Credit Guarantee Scheme',
        description: 'Credit guarantee for MSMEs in Andhra Pradesh',
        eligibility: 'MSMEs in Andhra Pradesh',
        subsidy: '75-85% credit guarantee',
        applicable: location.includes('andhra') || location.includes('ap'),
        portal: 'AP MSME ONE Portal',
        category: 'State Government'
      },
      {
        name: 'Stand-Up India',
        description: 'Bank loan for SC/ST and women entrepreneurs',
        eligibility: 'SC/ST and women entrepreneurs',
        subsidy: 'No subsidy, but priority sector lending',
        applicable: true, // Based on entrepreneur profile
        portal: 'Stand-Up India Portal',
        category: 'Central Government'
      },
      {
        name: 'AP Food Processing Policy',
        description: 'Incentives for food processing units',
        eligibility: 'Food processing units in AP',
        subsidy: 'Up to 25% of fixed capital investment',
        applicable: sector.includes('food') && (location.includes('andhra') || location.includes('ap')),
        portal: 'AP MSME ONE Portal',
        category: 'State Government'
      }
    ];

    return schemes.filter(scheme => scheme.applicable);
  }

  /**
   * Get sector-specific benchmarks
   */
  static getSectorBenchmarks(sector: string): any {
    const benchmarks: Record<string, any> = {
      'manufacturing': {
        averageProjectCost: 5000000,
        averageOwnContribution: 20,
        averageLoanAmount: 4000000,
        averagePaybackPeriod: 5,
        averageROI: 18,
        keySuccessFactors: [
          'Quality control systems',
          'Efficient production planning',
          'Skilled workforce',
          'Market demand analysis',
          'Technology adoption'
        ],
        commonChallenges: [
          'Raw material price volatility',
          'Competition from large players',
          'Technology obsolescence',
          'Regulatory compliance',
          'Working capital management'
        ]
      },
      'services': {
        averageProjectCost: 2000000,
        averageOwnContribution: 25,
        averageLoanAmount: 1500000,
        averagePaybackPeriod: 3,
        averageROI: 25,
        keySuccessFactors: [
          'Customer service excellence',
          'Digital presence',
          'Skilled professionals',
          'Market positioning',
          'Service quality'
        ],
        commonChallenges: [
          'Client acquisition',
          'Service standardization',
          'Talent retention',
          'Market competition',
          'Technology integration'
        ]
      },
      'agriculture': {
        averageProjectCost: 3000000,
        averageOwnContribution: 15,
        averageLoanAmount: 2550000,
        averagePaybackPeriod: 4,
        averageROI: 15,
        keySuccessFactors: [
          'Climate adaptation',
          'Quality inputs',
          'Market linkages',
          'Technology adoption',
          'Risk management'
        ],
        commonChallenges: [
          'Weather dependency',
          'Price volatility',
          'Market access',
          'Technology adoption',
          'Post-harvest losses'
        ]
      },
      'retail': {
        averageProjectCost: 1500000,
        averageOwnContribution: 30,
        averageLoanAmount: 1050000,
        averagePaybackPeriod: 3,
        averageROI: 20,
        keySuccessFactors: [
          'Location selection',
          'Inventory management',
          'Customer experience',
          'Pricing strategy',
          'Marketing effectiveness'
        ],
        commonChallenges: [
          'Competition from e-commerce',
          'Inventory management',
          'Customer retention',
          'Location costs',
          'Seasonal demand'
        ]
      }
    };

    return benchmarks[sector.toLowerCase()] || benchmarks['manufacturing'];
  }

  /**
   * Get cost structure suggestions
   */
  static getCostStructureSuggestions(project: IProject): any {
    const sector = project.industrySector.toLowerCase();
    const totalCost = project.totalCost;
    const location = project.location;

    // Location-based cost adjustments
    const locationMultipliers: Record<string, number> = {
      'hyderabad': 1.2,
      'visakhapatnam': 1.1,
      'vijayawada': 1.0,
      'tirupati': 0.9,
      'guntur': 0.95,
      'warangal': 0.9,
      'nellore': 0.85,
      'kadapa': 0.8,
      'anantapur': 0.8,
      'kurnool': 0.8
    };

    const locationMultiplier = locationMultipliers[location.toLowerCase()] || 1.0;

    return {
      landCost: {
        costPerAcre: 500000 * locationMultiplier,
        suggestedArea: sector === 'agriculture' ? 2 : 0.5,
        totalCost: Math.round(500000 * locationMultiplier * (sector === 'agriculture' ? 2 : 0.5))
      },
      buildingCost: {
        costPerSqFt: 1200 * locationMultiplier,
        suggestedArea: sector === 'manufacturing' ? 2000 : 1000,
        totalCost: Math.round(1200 * locationMultiplier * (sector === 'manufacturing' ? 2000 : 1000))
      },
      machineryCost: {
        suggestedItems: this.getMachinerySuggestions(sector),
        totalCost: Math.round(totalCost * 0.4)
      },
      workingCapital: {
        suggestedMonths: 3,
        monthlyExpenses: Math.round(totalCost * 0.1),
        totalCost: Math.round(totalCost * 0.3)
      }
    };
  }

  /**
   * Get machinery suggestions based on sector
   */
  private static getMachinerySuggestions(sector: string): any[] {
    const machinerySuggestions: Record<string, any[]> = {
      'manufacturing': [
        { name: 'CNC Machine', cost: 500000, quantity: 1 },
        { name: 'Lathe Machine', cost: 200000, quantity: 1 },
        { name: 'Welding Equipment', cost: 100000, quantity: 1 },
        { name: 'Quality Testing Equipment', cost: 150000, quantity: 1 }
      ],
      'food processing': [
        { name: 'Grinding Machine', cost: 300000, quantity: 1 },
        { name: 'Packaging Machine', cost: 400000, quantity: 1 },
        { name: 'Refrigeration Unit', cost: 200000, quantity: 1 },
        { name: 'Quality Control Equipment', cost: 100000, quantity: 1 }
      ],
      'textiles': [
        { name: 'Spinning Machine', cost: 800000, quantity: 1 },
        { name: 'Weaving Machine', cost: 600000, quantity: 1 },
        { name: 'Dyeing Machine', cost: 400000, quantity: 1 },
        { name: 'Cutting Machine', cost: 200000, quantity: 1 }
      ],
      'services': [
        { name: 'Computer Systems', cost: 50000, quantity: 5 },
        { name: 'Office Furniture', cost: 100000, quantity: 1 },
        { name: 'Communication Equipment', cost: 50000, quantity: 1 }
      ]
    };

    return machinerySuggestions[sector] || machinerySuggestions['manufacturing'];
  }
}
