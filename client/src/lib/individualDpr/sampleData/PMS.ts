/**
 * Sample answers for PMS ("Apply sample data", Dev mode). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 * Deviations from QA doc: none
 * Other Sources (and Government Grant for LEAN) is 0 per QA doc; the progress counter treats a bare zero as unanswered, so Step 6 shows 7/8 (LEAN 6/8).
 * Firm PAN is included only so the section reads 100% (the app blanks it on save); uploads stay manual.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  "step1": {
    "unitName": "Kondapalli Heritage Toys & Crafts LLP",
    "clusterName": "Kondapalli Heritage Toys & Crafts LLP",
    "district": "NTR",
    "location": "Kondapalli",
    "natureOfBusiness": "Manufacturing of Kondapalli wooden toys and handicraft decor items",
    "majorProducts": "Dasavatharam toy sets, wooden toy figures, home decor pieces"
  },
  "step4": {
    "presentActivities": "The LLP employs 6 artisans who carve, assemble and paint Kondapalli toys from soft Tella Poniki wood using natural vegetable colours. Products are sold from the unit, through APCO showrooms and at two state-level exhibitions a year; this proposal is for a first participation in a national trade fair.",
    "yearOfEstablishment": "2018-06-01",
    "commitmentDate": "2026-12-01",
    "technologyLevel": "Hand carving with small power tools, natural-colour painting, manual finishing; Kondapalli toys GI-tagged",
    "productionCapacity": "About 1,200 pieces per month",
    "productMix": [
      {
        "name": "Dasavatharam toy set",
        "sharePercent": 30,
        "sellingPrice": 600
      },
      {
        "name": "Single wooden toy figure",
        "sharePercent": 45,
        "sellingPrice": 190
      },
      {
        "name": "Home decor piece and fridge magnet",
        "sharePercent": 25,
        "sellingPrice": 135
      }
    ]
  },
  "step6": {
    "targetMarket": "Gift and handicraft retailers, corporate gifting buyers, interior decorators and export agents visiting IITF from Delhi NCR, Mumbai, Bengaluru and overseas.",
    "existingDemand": "IITF draws over 10 lakh visitors in two weeks; at a previous state exhibition the unit sold about ₹1.8 lakh in six days. A national stall is expected to bring bulk enquiries worth ₹10 lakh and 4 to 6 repeat buyers."
  },
  "step11": {
    "spvName": "Kondapalli Heritage Toys & Crafts LLP",
    "legalStatus": "Limited liability partnership (LLP)",
    "firmPan": "AAJFK9153Q",
    "gstin": "37AAJFK9153Q1ZF",
    "udyamNumber": "UDYAM-AP-08-0071354",
    "applicantMobile": "9963104582",
    "address": "D.No. 3-18, Toy Colony, Kondapalli (Ibrahimpatnam mandal), NTR District, Andhra Pradesh - 521228"
  },
  "step12": {
    "machineryItems": [
      {
        "description": "Modular exhibition stall with branding (reusable)",
        "condition": "new",
        "supplier": "Vijaya Expo Systems, Vijayawada",
        "quantity": 1,
        "unitCost": 2.2,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Portable carving and finishing demo kit",
        "condition": "new",
        "supplier": "Kondapalli Artisans Tools Cooperative, Kondapalli",
        "quantity": 1,
        "unitCost": 0.85,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "LED display panels and spot lighting",
        "condition": "new",
        "supplier": "Vijaya Expo Systems, Vijayawada",
        "quantity": 4,
        "unitCost": 0.4,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Transit packing crates",
        "condition": "new",
        "supplier": "Sri Durga Packaging Works, Vijayawada",
        "quantity": 10,
        "unitCost": 0.12,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      }
    ],
    "machinery": 5.85,
    "workingCapitalMargin": 4.85
  },
  "step13": {
    "bankName": "Andhra Pradesh Grameena Vikas Bank, Kondapalli branch",
    "interestRate": 10.25,
    "moratoriumMonths": 3,
    "loanTenureMonths": 36,
    "spvContribution": 2.15,
    "governmentGrant": 3.2,
    "bankLoan": 5.35,
    "otherSources": 0
  },
  "step14": {
    "rawMaterialItems": [
      {
        "name": "Tella Poniki (soft wood) logs and planks",
        "use": "Toy blanks",
        "basis": "Monthly purchase from a Kondapalli forest-produce depot, cash"
      },
      {
        "name": "Natural vegetable colours and lac",
        "use": "Painting and finishing",
        "basis": "Quarterly purchase from a Vijayawada craft-supplies dealer"
      },
      {
        "name": "Gift boxes and cushioning",
        "use": "Packing",
        "basis": "Monthly order from Sri Durga Packaging Works, 10-day credit"
      }
    ],
    "staffRoles": [
      {
        "role": "Master artisan",
        "count": 2,
        "monthlyPay": 16000
      },
      {
        "role": "Painter",
        "count": 3,
        "monthlyPay": 12000
      },
      {
        "role": "Packer and dispatch helper",
        "count": 1,
        "monthlyPay": 12000
      }
    ],
    "rawMaterialCost": 16.8,
    "powerCost": 1.2,
    "wages": 9.6,
    "maintenance": 0.9,
    "administrativeExpenses": 1.8,
    "marketingExpenses": 4.2,
    "annualProductionVolume": 14000,
    "annualSalesRealization": 42
  },
  "schemeExtras": {
    "businessKind": "manufacturing",
    "eventName": "India International Trade Fair (IITF) 2026",
    "stallSize": "18 sqm",
    "fairCity": "New Delhi",
    "estimatedFairCost": 4.85,
    "entrepreneurName": "Pothina Anuradha"
  }
};

export default sample;
