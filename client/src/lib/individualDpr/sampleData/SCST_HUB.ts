/**
 * Sample answers for SCST_HUB ("Apply sample data", Dev mode). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 * Deviations from QA doc: none
 * Firm PAN is left blank on purpose (sole proprietor: a personal PAN is rejected by the firm-PAN field), so Step 4 shows 6/7.
 * Government Grant and Other Sources are 0 in the QA doc; the progress counter treats a bare zero as unanswered (Step 6 shows 6/8 or 7/8). Uploads stay manual.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  "step1": {
    "unitName": "Venkata Ramesh Steel Furniture Works",
    "clusterName": "Venkata Ramesh Steel Furniture Works",
    "district": "Palnadu",
    "location": "Narasaraopet",
    "natureOfBusiness": "Manufacturing of institutional steel furniture for hostels, schools and offices",
    "majorProducts": "Steel almirahs, hostel cots, office tables"
  },
  "step4": {
    "presentActivities": "The unit fabricates sheet-metal furniture on a 4,000 sq ft shop floor with 9 workers, selling to local schools, private hostels and offices on cash and 30-day credit; it registered on GeM in March 2026 but has not yet bid because it lacks powder coating and press-brake capacity for bulk lots.",
    "yearOfEstablishment": "2020-02-15",
    "commitmentDate": "2026-11-05",
    "technologyLevel": "Manual shearing, spot welding and hand-spray painting; no powder coating or CNC bending",
    "productionCapacity": "About 70 pieces per month; target 100 pieces per month",
    "productMix": [
      {
        "name": "Steel almirah (2-door)",
        "sharePercent": 40,
        "sellingPrice": 9800
      },
      {
        "name": "Hostel cot (single, bunk-ready)",
        "sharePercent": 35,
        "sellingPrice": 4600
      },
      {
        "name": "Office table with drawers",
        "sharePercent": 25,
        "sellingPrice": 6400
      }
    ]
  },
  "step6": {
    "targetMarket": "Social welfare and tribal welfare hostels, government schools, PHCs and municipal offices in Palnadu, Guntur and Prakasam districts, bought through GeM and AP e-procurement tenders.",
    "existingDemand": "Hostel and school furniture tenders under Samagra Shiksha and welfare-department budgets are issued every year; GeM lots usually ask for 200 to 500 pieces with powder-coated finish and delivery within 45 days."
  },
  "step11": {
    "spvName": "Pasupuleti Venkata Ramesh",
    "legalStatus": "Sole proprietorship",
    "gstin": "37CMVPP6027D1ZM",
    "udyamNumber": "UDYAM-AP-24-0029463",
    "applicantMobile": "7013628495",
    "address": "D.No. 8-112, Palnadu Road, Narasaraopet (Narasaraopet mandal), Palnadu District, Andhra Pradesh - 522601"
  },
  "step12": {
    "machineryItems": [
      {
        "description": "CNC press brake, 60 tonne",
        "condition": "new",
        "supplier": "Bharat Sheet Metal Machines, Rajkot",
        "quantity": 1,
        "unitCost": 4.2,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Sheet shearing machine, 6 ft",
        "condition": "new",
        "supplier": "Bharat Sheet Metal Machines, Rajkot",
        "quantity": 1,
        "unitCost": 2.6,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Spot welding machine, 25 kVA",
        "condition": "new",
        "supplier": "Sri Venkateswara Welding Equipment, Vijayawada",
        "quantity": 2,
        "unitCost": 0.55,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Powder coating booth with curing oven",
        "condition": "new",
        "supplier": "Vijaya Finishing Systems, Hyderabad",
        "quantity": 1,
        "unitCost": 3.9,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      }
    ],
    "machinery": 11.8,
    "workingCapitalMargin": 5.2
  },
  "step13": {
    "bankName": "Indian Bank, Narasaraopet branch",
    "interestRate": 11,
    "moratoriumMonths": 6,
    "loanTenureMonths": 60,
    "spvContribution": 5.2,
    "governmentGrant": 0,
    "bankLoan": 11.8,
    "otherSources": 0
  },
  "step14": {
    "rawMaterialItems": [
      {
        "name": "CRCA steel sheets, 0.8 to 1.2 mm",
        "use": "Almirah and table bodies",
        "basis": "Fortnightly purchase from a Vijayawada steel dealer, 21-day credit"
      },
      {
        "name": "MS angles, pipes and flats",
        "use": "Cot frames and legs",
        "basis": "Monthly purchase from a Guntur steel yard, cash"
      },
      {
        "name": "Powder coat, locks and hardware",
        "use": "Finishing and fittings",
        "basis": "Quarterly purchase from a Hyderabad hardware distributor"
      }
    ],
    "staffRoles": [
      {
        "role": "Sheet-metal fabricator",
        "count": 3,
        "monthlyPay": 14000
      },
      {
        "role": "Welder",
        "count": 2,
        "monthlyPay": 13000
      },
      {
        "role": "Powder-coating operator",
        "count": 1,
        "monthlyPay": 12000
      },
      {
        "role": "Helper",
        "count": 3,
        "monthlyPay": 10000
      }
    ],
    "rawMaterialCost": 46.2,
    "powerCost": 5.4,
    "wages": 13.2,
    "maintenance": 1.8,
    "administrativeExpenses": 2.4,
    "marketingExpenses": 1.2,
    "annualProductionVolume": 1180,
    "annualSalesRealization": 84
  },
  "schemeExtras": {
    "businessKind": "manufacturing",
    "sclcssCategory": "sc",
    "gemExperience": "registered",
    "entrepreneurName": "Pasupuleti Venkata Ramesh",
    "procurementFocus": "Supply steel almirahs, hostel cots and office tables to government hostels, schools and PHCs through GeM; target a first order book of about ₹60 lakh in 2027-28 and BIS-aligned product testing."
  }
};

export default sample;
