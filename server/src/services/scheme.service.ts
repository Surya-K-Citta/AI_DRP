// @ts-nocheck
import { IProject, IScheme } from '../types';
import { Scheme } from '../models/Scheme.model';
import { SchemeMatch } from '../models/SchemeMatch.model';

export class SchemeService {
  /**
   * Match schemes to a project based on eligibility criteria
   */
  static async matchSchemes(project: IProject): Promise<any[]> {
    try {
      const allSchemes = await Scheme.find();
      const matches: any[] = [];

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

      return matches;
    } catch (error) {
      console.error('Error matching schemes:', error);
      throw new Error('Failed to match schemes');
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

