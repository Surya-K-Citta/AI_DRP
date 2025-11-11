// @ts-nocheck
import axios from 'axios';

export class APMSMEService {
  private static readonly AP_MSME_API_URL = process.env.AP_MSME_API_URL || 'https://apmsme.ap.gov.in/api';
  private static readonly AP_MSME_API_KEY = process.env.AP_MSME_API_KEY || '';

  /**
   * Get available schemes from AP MSME ONE Portal
   */
  static async getAvailableSchemes(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.AP_MSME_API_URL}/schemes`, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.schemes || [];
    } catch (error) {
      console.error('Error fetching AP MSME schemes:', error);
      // Return mock data for development
      return this.getMockSchemes();
    }
  }

  /**
   * Submit DPR to AP MSME ONE Portal
   */
  static async submitDPR(dprData: any): Promise<any> {
    try {
      const response = await axios.post(`${this.AP_MSME_API_URL}/dpr/submit`, dprData, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error submitting DPR to AP MSME:', error);
      throw new Error('Failed to submit DPR to AP MSME ONE Portal');
    }
  }

  /**
   * Check DPR status in AP MSME ONE Portal
   */
  static async checkDPRStatus(dprId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.AP_MSME_API_URL}/dpr/status/${dprId}`, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error checking DPR status:', error);
      throw new Error('Failed to check DPR status');
    }
  }

  /**
   * Get entrepreneur profile from AP MSME ONE Portal
   */
  static async getEntrepreneurProfile(entrepreneurId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.AP_MSME_API_URL}/entrepreneur/${entrepreneurId}`, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching entrepreneur profile:', error);
      throw new Error('Failed to fetch entrepreneur profile');
    }
  }

  /**
   * Get sector-specific guidelines from AP MSME ONE Portal
   */
  static async getSectorGuidelines(sector: string): Promise<any> {
    try {
      const response = await axios.get(`${this.AP_MSME_API_URL}/guidelines/${sector}`, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching sector guidelines:', error);
      // Return mock data for development
      return this.getMockSectorGuidelines(sector);
    }
  }

  /**
   * Get financial institutions and banks
   */
  static async getFinancialInstitutions(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.AP_MSME_API_URL}/financial-institutions`, {
        headers: {
          'Authorization': `Bearer ${this.AP_MSME_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data.institutions || [];
    } catch (error) {
      console.error('Error fetching financial institutions:', error);
      // Return mock data for development
      return this.getMockFinancialInstitutions();
    }
  }

  /**
   * Get mock schemes for development
   */
  private static getMockSchemes(): any[] {
    return [
      {
        schemeCode: 'PMEGP',
        schemeName: 'Prime Minister Employment Generation Programme',
        description: 'Credit-linked subsidy programme for setting up micro-enterprises',
        eligibility: 'New micro-enterprises with project cost up to ₹25 lakh',
        subsidy: '25-35% of project cost',
        maxProjectCost: 2500000,
        categories: ['manufacturing', 'services', 'agriculture'],
        status: 'active',
        portal: 'AP MSME ONE Portal',
        applicationUrl: 'https://apmsme.ap.gov.in/pmegp',
      },
      {
        schemeCode: 'MUDRA',
        schemeName: 'MUDRA Yojana',
        description: 'Micro Units Development and Refinance Agency for small businesses',
        eligibility: 'Micro and small enterprises',
        subsidy: 'No subsidy, but collateral-free loans up to ₹10 lakh',
        maxProjectCost: 1000000,
        categories: ['manufacturing', 'services', 'agriculture', 'retail'],
        status: 'active',
        portal: 'MUDRA Portal',
        applicationUrl: 'https://mudra.org.in',
      },
      {
        schemeCode: 'AP_MSME_CREDIT',
        schemeName: 'AP MSME Credit Guarantee Scheme',
        description: 'Credit guarantee for MSMEs in Andhra Pradesh',
        eligibility: 'MSMEs in Andhra Pradesh',
        subsidy: '75-85% credit guarantee',
        maxProjectCost: 5000000,
        categories: ['manufacturing', 'services', 'agriculture'],
        status: 'active',
        portal: 'AP MSME ONE Portal',
        applicationUrl: 'https://apmsme.ap.gov.in/credit-guarantee',
      },
      {
        schemeCode: 'STAND_UP_INDIA',
        schemeName: 'Stand-Up India',
        description: 'Bank loan for SC/ST and women entrepreneurs',
        eligibility: 'SC/ST and women entrepreneurs',
        subsidy: 'No subsidy, but priority sector lending',
        maxProjectCost: 10000000,
        categories: ['manufacturing', 'services', 'agriculture', 'retail'],
        status: 'active',
        portal: 'Stand-Up India Portal',
        applicationUrl: 'https://standupmitra.in',
      },
      {
        schemeCode: 'AP_FOOD_PROCESSING',
        schemeName: 'AP Food Processing Policy',
        description: 'Incentives for food processing units',
        eligibility: 'Food processing units in AP',
        subsidy: 'Up to 25% of fixed capital investment',
        maxProjectCost: 10000000,
        categories: ['food_processing'],
        status: 'active',
        portal: 'AP MSME ONE Portal',
        applicationUrl: 'https://apmsme.ap.gov.in/food-processing',
      },
    ];
  }

  /**
   * Get mock sector guidelines for development
   */
  private static getMockSectorGuidelines(sector: string): any {
    const guidelines: Record<string, any> = {
      manufacturing: {
        sector: 'Manufacturing',
        guidelines: [
          'Obtain necessary licenses and permits from local authorities',
          'Ensure compliance with environmental regulations',
          'Implement quality control systems as per industry standards',
          'Maintain proper documentation for raw materials and finished goods',
          'Follow safety protocols and provide training to workers',
        ],
        requirements: [
          'Factory license',
          'Environmental clearance',
          'Quality certification (ISO 9001)',
          'Fire safety certificate',
          'Labor registration',
        ],
        incentives: [
          'Power tariff concessions',
          'Land allocation at subsidized rates',
          'Interest subsidy on term loans',
          'Reimbursement of stamp duty and registration charges',
        ],
      },
      services: {
        sector: 'Services',
        guidelines: [
          'Register with appropriate professional bodies',
          'Maintain client confidentiality and data security',
          'Follow service level agreements',
          'Keep updated with industry best practices',
          'Ensure proper documentation and record keeping',
        ],
        requirements: [
          'Service tax registration',
          'Professional indemnity insurance',
          'Data protection compliance',
          'Client agreement templates',
          'Service quality standards',
        ],
        incentives: [
          'Reduced registration fees',
          'Training and skill development support',
          'Marketing assistance',
          'Technology adoption incentives',
        ],
      },
      agriculture: {
        sector: 'Agriculture',
        guidelines: [
          'Follow sustainable farming practices',
          'Maintain soil health and water conservation',
          'Use certified seeds and organic inputs',
          'Implement proper post-harvest management',
          'Ensure food safety and quality standards',
        ],
        requirements: [
          'Land ownership or lease documents',
          'Soil health certificate',
          'Water source verification',
          'Organic certification (if applicable)',
          'Food safety license',
        ],
        incentives: [
          'Subsidy on seeds and fertilizers',
          'Interest-free loans for equipment',
          'Insurance coverage for crops',
          'Marketing support and price guarantees',
        ],
      },
    };

    return guidelines[sector.toLowerCase()] || guidelines['manufacturing'];
  }

  /**
   * Get mock financial institutions for development
   */
  private static getMockFinancialInstitutions(): any[] {
    return [
      {
        id: 'SBI',
        name: 'State Bank of India',
        type: 'Public Sector Bank',
        interestRate: '8.5-12%',
        maxLoanAmount: 50000000,
        processingTime: '15-30 days',
        contact: '1800 1234 567',
        website: 'https://sbi.co.in',
        branches: ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Tirupati'],
      },
      {
        id: 'HDFC',
        name: 'HDFC Bank',
        type: 'Private Sector Bank',
        interestRate: '9-13%',
        maxLoanAmount: 25000000,
        processingTime: '10-20 days',
        contact: '1800 202 6161',
        website: 'https://hdfcbank.com',
        branches: ['Hyderabad', 'Visakhapatnam', 'Vijayawada'],
      },
      {
        id: 'APCOB',
        name: 'Andhra Pradesh State Co-operative Bank',
        type: 'Co-operative Bank',
        interestRate: '7.5-11%',
        maxLoanAmount: 10000000,
        processingTime: '20-35 days',
        contact: '040 2345 6789',
        website: 'https://apcob.org',
        branches: ['All districts of Andhra Pradesh'],
      },
      {
        id: 'NABARD',
        name: 'National Bank for Agriculture and Rural Development',
        type: 'Development Bank',
        interestRate: '6-10%',
        maxLoanAmount: 20000000,
        processingTime: '30-45 days',
        contact: '1800 425 1555',
        website: 'https://nabard.org',
        branches: ['Hyderabad', 'Visakhapatnam', 'Vijayawada'],
      },
    ];
  }
}
