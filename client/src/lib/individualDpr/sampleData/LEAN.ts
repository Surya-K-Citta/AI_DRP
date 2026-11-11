/**
 * Sample answers for LEAN ("Apply sample data", Dev mode). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 * Deviations from QA doc: none
 * Other Sources (and Government Grant for LEAN) is 0 per QA doc; the progress counter treats a bare zero as unanswered, so Step 6 shows 7/8 (LEAN 6/8).
 * Firm PAN is included only so the section reads 100% (the app blanks it on save); uploads stay manual.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  "step1": {
    "unitName": "Godavari Gold Foods Private Limited",
    "clusterName": "Godavari Gold Foods Private Limited",
    "district": "East Godavari",
    "location": "Rajamahendravaram",
    "natureOfBusiness": "Manufacturing of rice-flour snacks and ready-to-cook batter",
    "majorProducts": "Murukulu, chekkalu, ready-to-cook rice batter"
  },
  "step4": {
    "presentActivities": "The unit runs one extruder and fryer line making murukulu and chekkalu in 3 batches per shift, plus a batter grinding room, and packs in 200 g and 500 g pouches for Rajamahendravaram and Kakinada retailers and sweet shops.",
    "yearOfEstablishment": "2019-03-12",
    "commitmentDate": "2026-11-05",
    "technologyLevel": "Semi-automatic extruder and gas-fired fryer; manual dough dividing and manual weighing at packing; no visual management",
    "productionCapacity": "120 kg per hour on the extruder line; about 10,000 kg per month",
    "productMix": [
      {
        "name": "Murukulu (kg)",
        "sharePercent": 45,
        "sellingPrice": 90
      },
      {
        "name": "Chekkalu (kg)",
        "sharePercent": 35,
        "sellingPrice": 78
      },
      {
        "name": "Ready-to-cook rice batter (kg)",
        "sharePercent": 20,
        "sellingPrice": 62
      }
    ]
  },
  "step6": {
    "targetMarket": "Sweet shops, supermarkets and kirana wholesalers in East and West Godavari, Kakinada and Visakhapatnam; two modern-trade chains have asked for 10 tonnes a month on fixed weekly schedules.",
    "existingDemand": "Festival season (Sankranti, Dasara) brings 40% higher orders, but current changeovers and idle packing capacity cap output at about 10 tonnes a month; lean improvements would free roughly 2.5 tonnes a month."
  },
  "step11": {
    "spvName": "Godavari Gold Foods Private Limited",
    "legalStatus": "Private limited company",
    "firmPan": "AACCG2468K",
    "gstin": "37AACCG2468K1ZC",
    "udyamNumber": "UDYAM-AP-07-0062915",
    "applicantMobile": "9701452836",
    "address": "D.No. 5-72/1, Dowleswaram Road, Rajamahendravaram (Rajahmundry urban mandal), East Godavari District, Andhra Pradesh - 533125"
  },
  "step12": {
    "machineryItems": [
      {
        "description": "Quick-change extruder die and tooling set",
        "condition": "new",
        "supplier": "Annapurna Food Machinery Works, Coimbatore",
        "quantity": 2,
        "unitCost": 1.35,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Inline checkweigher with reject arm",
        "condition": "new",
        "supplier": "Mettler-Toledo authorised dealer, Hyderabad",
        "quantity": 1,
        "unitCost": 3.8,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Automatic dough divider and rounder",
        "condition": "new",
        "supplier": "Annapurna Food Machinery Works, Coimbatore",
        "quantity": 1,
        "unitCost": 4.6,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Stainless steel kanban racks and WIP trolleys",
        "condition": "new",
        "supplier": "Sri Lakshmi Steel Fabricators, Rajamahendravaram",
        "quantity": 8,
        "unitCost": 0.28,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      }
    ],
    "machinery": 13.34,
    "workingCapitalMargin": 5.66
  },
  "step13": {
    "bankName": "Union Bank of India, Rajamahendravaram main branch",
    "interestRate": 9.75,
    "moratoriumMonths": 3,
    "loanTenureMonths": 48,
    "spvContribution": 5.7,
    "governmentGrant": 0,
    "bankLoan": 13.3,
    "otherSources": 0
  },
  "step14": {
    "rawMaterialItems": [
      {
        "name": "Raw rice and rice flour",
        "use": "Base dough for murukulu, chekkalu and batter",
        "basis": "Weekly purchase from Amalapuram rice mills, 7-day credit"
      },
      {
        "name": "Refined sunflower oil",
        "use": "Frying",
        "basis": "Fortnightly bulk purchase from a Kakinada edible-oil distributor"
      },
      {
        "name": "Spices, sesame and salt",
        "use": "Flavouring",
        "basis": "Monthly cash purchase from Rajamahendravaram spice market"
      },
      {
        "name": "Printed laminate pouches and cartons",
        "use": "Packing",
        "basis": "Quarterly order from a Vijayawada packaging supplier"
      }
    ],
    "staffRoles": [
      {
        "role": "Production operator",
        "count": 5,
        "monthlyPay": 12000
      },
      {
        "role": "Packing helper",
        "count": 4,
        "monthlyPay": 10000
      },
      {
        "role": "Line supervisor",
        "count": 1,
        "monthlyPay": 18000
      },
      {
        "role": "Quality and store clerk",
        "count": 1,
        "monthlyPay": 12000
      }
    ],
    "rawMaterialCost": 52.8,
    "powerCost": 4.8,
    "wages": 15.6,
    "maintenance": 2.4,
    "administrativeExpenses": 3,
    "marketingExpenses": 2.4,
    "annualProductionVolume": 120000,
    "annualSalesRealization": 96
  },
  "schemeExtras": {
    "businessKind": "manufacturing",
    "processBottleneck": "Changeover between murukulu and chekkalu batches on the extruder line takes about 95 minutes, the packing line sits idle for 2.5 hours per shift waiting for fried product, and dough scrap is about 6% of input.",
    "shopFloorSize": "7,200 sq ft production hall; 2 lines (frying line and packing line)",
    "entrepreneurName": "Muppidi Lakshmi Prasanna",
    "expectedLeanGain": "Cut changeover from 95 to 40 minutes, reduce dough scrap from 6% to 3%, and raise overall line efficiency from 58% to 72% within six months of the LEAN consultant engagement."
  }
};

export default sample;
