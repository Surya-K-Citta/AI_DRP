/**
 * Sample answers for ZED ("Apply sample data", Dev mode). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 * Deviations from QA doc: none
 * Other Sources (and Government Grant for LEAN) is 0 per QA doc; the progress counter treats a bare zero as unanswered, so Step 6 shows 7/8 (LEAN 6/8).
 * Firm PAN is included only so the section reads 100% (the app blanks it on save); uploads stay manual.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  "step1": {
    "unitName": "Sri Sai Ganesh Auto Components",
    "clusterName": "Sri Sai Ganesh Auto Components",
    "district": "Guntur",
    "location": "Mangalagiri",
    "natureOfBusiness": "Manufacturing of precision turned and machined auto components for two-wheeler OEM vendors",
    "majorProducts": "Brake lever pins, gear shafts, wheel hub bushes"
  },
  "step4": {
    "presentActivities": "The unit runs 6 CNC turning centres and 2 VMCs on two shifts, machining alloy steel and brass bars into brake lever pins, gear shafts and hub bushes for three Vijayawada-based two-wheeler OEM vendors. Incoming, in-process and final inspection are done manually on a bench gauge set.",
    "yearOfEstablishment": "2016-07-01",
    "commitmentDate": "2026-11-10",
    "technologyLevel": "CNC turning and VMC machining with manual gauging; ISO 9001 documentation in place; ZED Bronze certified",
    "productionCapacity": "20,000 components per month on two shifts",
    "productMix": [
      {
        "name": "Brake lever pin",
        "sharePercent": 40,
        "sellingPrice": 22
      },
      {
        "name": "Gear shaft",
        "sharePercent": 35,
        "sellingPrice": 41
      },
      {
        "name": "Wheel hub bush",
        "sharePercent": 25,
        "sellingPrice": 27.5
      }
    ]
  },
  "step6": {
    "targetMarket": "Two-wheeler OEM vendors and tier-2 suppliers in Vijayawada, Hosur and Chennai; vendor audits increasingly ask for ZED Silver or higher.",
    "existingDemand": "Two OEM vendors have asked for ZED Silver proof before renewing rate contracts in April 2027. Current order book is about 20,000 pieces a month; certification is expected to add roughly 5,000 pieces a month."
  },
  "step11": {
    "spvName": "Sri Sai Ganesh Auto Components",
    "legalStatus": "Partnership firm",
    "firmPan": "AAHFS4821M",
    "gstin": "37AAHFS4821M1ZS",
    "udyamNumber": "UDYAM-AP-05-0034821",
    "applicantMobile": "9440318276",
    "address": "Plot No. 14, APIIC Auto Nagar, Mangalagiri mandal, Guntur District, Andhra Pradesh - 522503"
  },
  "step12": {
    "machineryItems": [
      {
        "description": "Digital Rockwell hardness tester",
        "condition": "new",
        "supplier": "Precimeasure Instruments Pvt Ltd, Bengaluru",
        "quantity": 1,
        "unitCost": 1.85,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Bench-top profile projector (optical comparator)",
        "condition": "new",
        "supplier": "Precimeasure Instruments Pvt Ltd, Bengaluru",
        "quantity": 1,
        "unitCost": 2.4,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Dust collection and fume extraction unit",
        "condition": "new",
        "supplier": "Kirloskar Ventilation Systems, Hyderabad",
        "quantity": 2,
        "unitCost": 1.6,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Tool-crib cabinets and 5S storage racks",
        "condition": "new",
        "supplier": "Godrej Storage Solutions dealer, Vijayawada",
        "quantity": 6,
        "unitCost": 0.35,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Rooftop solar power plant, 10 kW",
        "condition": "new",
        "supplier": "Sunrise Solar Energy Systems, Guntur",
        "quantity": 1,
        "unitCost": 5.2,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      }
    ],
    "machinery": 14.75,
    "workingCapitalMargin": 3.25
  },
  "step13": {
    "bankName": "State Bank of India, Mangalagiri branch",
    "interestRate": 10.5,
    "moratoriumMonths": 6,
    "loanTenureMonths": 60,
    "spvContribution": 3.6,
    "governmentGrant": 2.7,
    "bankLoan": 11.7,
    "otherSources": 0
  },
  "step14": {
    "rawMaterialItems": [
      {
        "name": "Alloy steel EN8 and EN24 bright bars",
        "use": "Turned and machined into pins and shafts",
        "basis": "Monthly purchase from a Vijayawada steel stockist on 30-day credit"
      },
      {
        "name": "Brass rods",
        "use": "Hub bushes",
        "basis": "Quarterly purchase from a Jamnagar brass supplier, 15-day credit"
      },
      {
        "name": "Cutting oil and carbide inserts",
        "use": "Machining consumables",
        "basis": "Monthly cash purchase from Guntur industrial suppliers"
      }
    ],
    "staffRoles": [
      {
        "role": "CNC operator",
        "count": 3,
        "monthlyPay": 16000
      },
      {
        "role": "Quality inspector",
        "count": 1,
        "monthlyPay": 19000
      },
      {
        "role": "Machine helper",
        "count": 3,
        "monthlyPay": 10000
      },
      {
        "role": "Shift supervisor",
        "count": 1,
        "monthlyPay": 23000
      }
    ],
    "rawMaterialCost": 38.4,
    "powerCost": 3.6,
    "wages": 14.4,
    "maintenance": 1.8,
    "administrativeExpenses": 2.4,
    "marketingExpenses": 1.2,
    "annualProductionVolume": 240000,
    "annualSalesRealization": 72
  },
  "schemeExtras": {
    "businessKind": "manufacturing",
    "zedCurrentLevel": "bronze",
    "zedTargetLevel": "silver",
    "entrepreneurName": "Kondaveeti Srinivasa Rao",
    "qualityFocus": "Reduce rejection from 4.2% to under 2% through in-process gauging, set up 5S and tool-crib discipline, cut power use with a 10 kW rooftop solar plant, and install dust and fume extraction to meet Silver-level environment criteria."
  }
};

export default sample;
