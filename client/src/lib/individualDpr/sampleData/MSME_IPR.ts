/**
 * Sample answers for MSME_IPR ("Apply sample data", Dev mode). Source: docs/qa/AI-DPR-E2E-QA-Test-Document.md
 * Deviations from QA doc: none
 * Firm PAN is left blank on purpose (sole proprietor: a personal PAN is rejected by the firm-PAN field), so Step 4 shows 6/7.
 * Government Grant and Other Sources are 0 in the QA doc; the progress counter treats a bare zero as unanswered (Step 6 shows 6/8 or 7/8). Uploads stay manual.
 */
import type { SampleData } from './types';

const sample: SampleData = {
  "step1": {
    "unitName": "Rahim Agri Engineering Works",
    "clusterName": "Rahim Agri Engineering Works",
    "district": "Kurnool",
    "location": "Adoni",
    "natureOfBusiness": "Manufacturing of groundnut decorticators and farm processing machines",
    "majorProducts": "Groundnut decorticator, cotton seed delinter, paddy winnower"
  },
  "step4": {
    "presentActivities": "The workshop fabricates groundnut decorticators and seed-cotton delinters to order for farmers and oil mills in Kurnool and Anantapur. The new decorticator uses a solar-assisted drive and an adjustable concave to cut kernel breakage from about 8% to under 3%; field trials on 3 machines are done and the patent specification draft is ready.",
    "yearOfEstablishment": "2023-08-10",
    "commitmentDate": "2026-11-20",
    "technologyLevel": "Conventional lathe, drilling and arc-welding fabrication; no instrumented test bench yet",
    "productionCapacity": "2 machines per month; each decorticator shells 600 kg of pods per hour",
    "productMix": [
      {
        "name": "Decorticator model SAD-1 (600 kg/hr)",
        "sharePercent": 60,
        "sellingPrice": 145000
      },
      {
        "name": "Decorticator model SAD-2 (900 kg/hr)",
        "sharePercent": 40,
        "sellingPrice": 160000
      }
    ]
  },
  "step6": {
    "targetMarket": "Groundnut farmers' groups, FPOs and small oil mills in Kurnool, Anantapur, Nandyal and Prakasam districts; state agriculture department custom-hiring centres.",
    "existingDemand": "Local fabricators are copying the design after demonstrations; a granted patent will protect the adjustable-concave mechanism and let the unit license it to two machine builders in Salem and Rajkot."
  },
  "step11": {
    "spvName": "Shaik Abdul Rahim",
    "legalStatus": "Sole proprietorship",
    "gstin": "37BKTPS7305L1ZA",
    "udyamNumber": "UDYAM-AP-10-0048276",
    "applicantMobile": "8099236417",
    "address": "D.No. 21-4-118, Industrial Estate Road, Adoni (Adoni mandal), Kurnool District, Andhra Pradesh - 518301"
  },
  "step12": {
    "machineryItems": [
      {
        "description": "Pilot prototype decorticator with solar drive",
        "condition": "new",
        "supplier": "In-house build with Sri Balaji Motors and Controls, Kurnool",
        "quantity": 1,
        "unitCost": 3.1,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Digital moisture and kernel-breakage analyser",
        "condition": "new",
        "supplier": "Agri Test Instruments, Hyderabad",
        "quantity": 1,
        "unitCost": 1.2,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "BLDC motor and variable frequency drive set, 3 HP",
        "condition": "new",
        "supplier": "Sri Balaji Motors and Controls, Kurnool",
        "quantity": 2,
        "unitCost": 0.65,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      },
      {
        "description": "Test-bench instrumentation (torque sensor and data logger)",
        "condition": "new",
        "supplier": "Agri Test Instruments, Hyderabad",
        "quantity": 1,
        "unitCost": 1.95,
        "gst": 0,
        "transport": 0,
        "installation": 0,
        "lifeYears": 0,
        "annualMaintenance": 0
      }
    ],
    "machinery": 7.55,
    "workingCapitalMargin": 2.45
  },
  "step13": {
    "bankName": "Canara Bank, Adoni branch",
    "interestRate": 10,
    "moratoriumMonths": 6,
    "loanTenureMonths": 48,
    "spvContribution": 2,
    "governmentGrant": 3.5,
    "bankLoan": 4.5,
    "otherSources": 0
  },
  "step14": {
    "rawMaterialItems": [
      {
        "name": "MS plates, angles and pipes",
        "use": "Frame, hopper and concave",
        "basis": "Monthly purchase from a Kurnool steel yard, cash"
      },
      {
        "name": "Bearings, belts and fasteners",
        "use": "Drive and assembly",
        "basis": "Quarterly purchase from Hyderabad industrial suppliers, 15-day credit"
      },
      {
        "name": "Solar panel, controller and wiring",
        "use": "Solar-assisted drive",
        "basis": "Per-order purchase from Sri Balaji Motors and Controls, Kurnool"
      }
    ],
    "staffRoles": [
      {
        "role": "Fabricator-welder",
        "count": 2,
        "monthlyPay": 14000
      },
      {
        "role": "Assembly technician",
        "count": 1,
        "monthlyPay": 12000
      }
    ],
    "rawMaterialCost": 15,
    "powerCost": 0.9,
    "wages": 4.8,
    "maintenance": 0.6,
    "administrativeExpenses": 1.2,
    "marketingExpenses": 1.5,
    "annualProductionVolume": 20,
    "annualSalesRealization": 30
  },
  "schemeExtras": {
    "businessKind": "manufacturing",
    "ipType": "patent",
    "filingStage": "draft",
    "inventionTitle": "Solar-Assisted Low-Breakage Groundnut Decorticator with Adjustable Concave",
    "entrepreneurName": "Shaik Abdul Rahim"
  }
};

export default sample;
