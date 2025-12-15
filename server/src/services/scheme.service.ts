// @ts-nocheck
import { IProject, IScheme } from '../types';
import { Scheme } from '../models/Scheme.model';
import { SchemeMatch } from '../models/SchemeMatch.model';

export class SchemeService {
  /**
   * Get default MSME schemes that are commonly applicable
   */
  private static getDefaultSchemes(project: IProject): any[] {
    const totalCost = project.totalCost || 0;
    const sector = (project.industrySector || '').toLowerCase();
    const location = (project.location || '').toLowerCase();
    
    const defaultSchemes: any[] = [];

    // PMEGP - Prime Minister Employment Generation Programme
    if (totalCost <= 2500000) {
      defaultSchemes.push({
        _id: 'default_pmegp',
        schemeCode: 'PMEGP',
        schemeName: 'Prime Minister Employment Generation Programme',
        description: 'Credit-linked subsidy programme for setting up new micro-enterprises. Provides 15-35% subsidy on project cost based on location and category.',
        eligibility: {
          minCost: 0,
          maxCost: 2500000,
          applicableFor: ['manufacturing', 'service', 'trading', 'business'],
          category: ['micro', 'small']
        },
        benefits: {
          subsidyPercentage: '15-35%',
          maxSubsidy: 'Up to ₹7.5 lakhs',
          loanAmount: 'Up to ₹25 lakhs'
        },
        documentsRequired: ['Project Report', 'Identity Proof', 'Address Proof', 'Caste Certificate (if applicable)'],
        status: 'active',
        category: 'Central Government',
        portal: 'PMEGP Portal / KVIC'
      });
    }

    // MUDRA - Pradhan Mantri MUDRA Yojana
    if (totalCost <= 1000000) {
      defaultSchemes.push({
        _id: 'default_mudra',
        schemeCode: 'MUDRA',
        schemeName: 'Pradhan Mantri MUDRA Yojana',
        description: 'Provides collateral-free loans up to ₹10 lakhs for micro and small enterprises. Three categories: Shishu (up to ₹50,000), Kishore (₹50,001 to ₹5 lakhs), and Tarun (₹5,00,001 to ₹10 lakhs).',
        eligibility: {
          minCost: 0,
          maxCost: 1000000,
          applicableFor: ['manufacturing', 'service', 'trading', 'business'],
          category: ['micro', 'small']
        },
        benefits: {
          loanAmount: 'Up to ₹10 lakhs',
          collateralFree: true,
          interestRate: 'Competitive rates'
        },
        documentsRequired: ['Business Plan', 'Identity Proof', 'Address Proof', 'Bank Statement'],
        status: 'active',
        category: 'Central Government',
        portal: 'MUDRA Portal'
      });
    }

    // CGTMSE - Credit Guarantee Fund Trust for Micro and Small Enterprises
    defaultSchemes.push({
      _id: 'default_cgtmse',
      schemeCode: 'CGTMSE',
      schemeName: 'Credit Guarantee Fund Trust for Micro and Small Enterprises',
      description: 'Provides credit guarantee for loans to MSMEs without collateral. Covers up to 85% of the loan amount, facilitating easier access to credit from banks and financial institutions.',
      eligibility: {
        minCost: 0,
        maxCost: 20000000,
        applicableFor: ['manufacturing', 'service', 'trading', 'business'],
        category: ['micro', 'small']
      },
      benefits: {
        guaranteeCoverage: '75-85%',
        maxLoanAmount: 'Up to ₹2 crores',
        noCollateral: true
      },
      documentsRequired: ['Project Report', 'Financial Statements', 'Identity Proof', 'Address Proof'],
      status: 'active',
      category: 'Central Government',
      portal: 'CGTMSE Portal'
    });

    // Stand-Up India (if applicable)
    defaultSchemes.push({
      _id: 'default_standup',
      schemeCode: 'STANDUP',
      schemeName: 'Stand-Up India Scheme',
      description: 'Bank loan scheme for SC/ST and women entrepreneurs. Provides loans from ₹10 lakhs to ₹1 crore for setting up greenfield enterprises in manufacturing, services, or trading sector.',
      eligibility: {
        minCost: 1000000,
        maxCost: 100000000,
        applicableFor: ['manufacturing', 'service', 'trading'],
        category: ['micro', 'small', 'medium']
      },
      benefits: {
        loanAmount: '₹10 lakhs to ₹1 crore',
        interestRate: 'MCLR + 3%',
        repaymentPeriod: 'Up to 7 years'
      },
      documentsRequired: ['Caste Certificate (for SC/ST)', 'Project Report', 'Identity Proof', 'Address Proof'],
      status: 'active',
      category: 'Central Government',
      portal: 'Stand-Up India Portal'
    });

    // AP MSME specific schemes (if location is Andhra Pradesh)
    if (location.includes('andhra') || location.includes('ap') || location.includes('telangana')) {
      defaultSchemes.push({
        _id: 'default_apmsme',
        schemeCode: 'APMSME',
        schemeName: 'AP MSME Credit Guarantee Scheme',
        description: 'State government scheme providing credit guarantee for MSMEs in Andhra Pradesh. Offers 75-85% credit guarantee, making it easier to secure loans without collateral.',
        eligibility: {
          minCost: 0,
          maxCost: 50000000,
          applicableFor: ['manufacturing', 'service', 'trading'],
          category: ['micro', 'small', 'medium']
        },
        benefits: {
          guaranteeCoverage: '75-85%',
          maxLoanAmount: 'Up to ₹5 crores',
          noCollateral: true
        },
        documentsRequired: ['Project Report', 'AP MSME Registration', 'Identity Proof', 'Address Proof'],
        status: 'active',
        category: 'State Government',
        portal: 'AP MSME ONE Portal'
      });
    }

    // Format as matches
    return defaultSchemes.map(scheme => ({
      scheme,
      confidenceScore: 0.8, // High confidence for default schemes
      matchReason: `Commonly applicable MSME scheme for ${project.industrySector || 'your'} sector projects.`
    }));
  }

  /**
   * Match schemes to a project based on eligibility criteria
   */
  static async matchSchemes(project: IProject): Promise<any[]> {
    try {
      const allSchemes = await Scheme.find();
      const matches: any[] = [];

      // If database has schemes, use them
      if (allSchemes.length > 0) {
        for (const scheme of allSchemes) {
          const score = this.calculateMatchScore(project, scheme);
          
          if (score > 0.3) { // Minimum 30% match
            matches.push({
              scheme,
              confidenceScore: score,
              matchReason: this.generateMatchReason(project, scheme, score),
            });
          }
        }

        // Sort by confidence score (descending)
        matches.sort((a, b) => b.confidenceScore - a.confidenceScore);

        // Save scheme matches
        for (const match of matches) {
          await SchemeMatch.findOneAndUpdate(
            {
              projectId: project._id,
              schemeCode: match.scheme.schemeCode,
            },
            {
              projectId: project._id,
              schemeCode: match.scheme.schemeCode,
              confidenceScore: match.confidenceScore,
              matchReason: match.matchReason,
              selected: false,
            },
            { upsert: true, new: true }
          );
        }
      } else {
        // If database is empty, return default schemes
        console.log('📋 No schemes in database, returning default MSME schemes');
        const defaultMatches = this.getDefaultSchemes(project);
        matches.push(...defaultMatches);
      }

      // If no matches found even with defaults, ensure at least basic schemes are returned
      if (matches.length === 0) {
        console.log('📋 No matches found, returning basic default schemes');
        const defaultMatches = this.getDefaultSchemes(project);
        matches.push(...defaultMatches);
      }

      return matches;
    } catch (error) {
      console.error('Error matching schemes:', error);
      // On error, return default schemes as fallback
      console.log('📋 Error in scheme matching, returning default schemes as fallback');
      return this.getDefaultSchemes(project);
    }
  }

  /**
   * Calculate match score between project and scheme
   */
  private static calculateMatchScore(
    project: IProject,
    scheme: IScheme
  ): number {
    let score = 0;
    let totalCriteria = 0;

    const criteria = scheme.eligibilityCriteria;

    // Check cost range
    if (criteria.minCost !== undefined || criteria.maxCost !== undefined) {
      totalCriteria++;
      const minCost = criteria.minCost || 0;
      const maxCost = criteria.maxCost || Infinity;
      
      if (project.totalCost >= minCost && project.totalCost <= maxCost) {
        score++;
      }
    }

    // Check applicable sectors
    if (criteria.applicableFor && criteria.applicableFor.length > 0) {
      totalCriteria++;
      const lowerSector = project.industrySector.toLowerCase();
      const isApplicable = criteria.applicableFor.some(
        (sector) => lowerSector.includes(sector.toLowerCase())
      );
      
      if (isApplicable) {
        score++;
      }
    }

    // Check category
    if (criteria.category && criteria.category.length > 0) {
      totalCriteria++;
      const projectCategory = this.determineProjectCategory(project);
      
      if (criteria.category.includes(projectCategory)) {
        score++;
      }
    }

    // Check project type compatibility
    totalCriteria++;
    if (project.projectType === 'individual' || project.projectType === 'cluster') {
      score += 0.5; // Partial score for valid project type
    }

    return totalCriteria > 0 ? score / totalCriteria : 0;
  }

  /**
   * Determine project category based on cost
   */
  private static determineProjectCategory(project: IProject): string {
    if (project.totalCost <= 1000000) {
      return 'micro';
    } else if (project.totalCost <= 10000000) {
      return 'small';
    } else {
      return 'medium';
    }
  }

  /**
   * Generate human-readable match reason
   */
  private static generateMatchReason(
    project: IProject,
    scheme: IScheme,
    score: number
  ): string {
    const reasons: string[] = [];
    const criteria = scheme.eligibilityCriteria;

    // Cost compatibility
    if (criteria.minCost !== undefined || criteria.maxCost !== undefined) {
      const minCost = criteria.minCost || 0;
      const maxCost = criteria.maxCost || Infinity;
      
      if (project.totalCost >= minCost && project.totalCost <= maxCost) {
        reasons.push(`Project cost (₹${project.totalCost}) falls within scheme limits`);
      }
    }

    // Sector compatibility
    if (criteria.applicableFor && criteria.applicableFor.length > 0) {
      const lowerSector = project.industrySector.toLowerCase();
      const matchingSector = criteria.applicableFor.find(
        (sector) => lowerSector.includes(sector.toLowerCase())
      );
      
      if (matchingSector) {
        reasons.push(`Applicable for ${project.industrySector} sector`);
      }
    }

    // Category
    const projectCategory = this.determineProjectCategory(project);
    if (criteria.category && criteria.category.includes(projectCategory)) {
      reasons.push(`Suitable for ${projectCategory} enterprise`);
    }

    // Benefits highlight
    if (scheme.benefits.subsidyPercentage) {
      reasons.push(`Offers ${scheme.benefits.subsidyPercentage}% subsidy`);
    }

    return reasons.length > 0 
      ? reasons.join('. ') + '.'
      : `${Math.round(score * 100)}% match based on eligibility criteria.`;
  }

  /**
   * Get recommended schemes for a project
   */
  static async getRecommendedSchemes(projectId: string): Promise<any[]> {
    const matches = await SchemeMatch.find({ projectId })
      .sort({ confidenceScore: -1 })
      .limit(5)
      .populate('schemeCode');

    return matches;
  }

  /**
   * Select a scheme for a project
   */
  static async selectScheme(
    projectId: string,
    schemeCode: string
  ): Promise<void> {
    // Deselect all other schemes
    await SchemeMatch.updateMany(
      { projectId },
      { selected: false }
    );

    // Select the specified scheme
    await SchemeMatch.findOneAndUpdate(
      { projectId, schemeCode },
      { selected: true }
    );
  }
}

