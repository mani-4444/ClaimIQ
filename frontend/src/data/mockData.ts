// Legacy mock data — no longer used by active pages.
// Kept for reference only.

export const MOCK_CLAIMS: any[] = [
  {
    id: "1",
    claimNumber: "CLM-2026-001",
    type: "auto",
    status: "APPROVED",
    title: "Rear-end collision on Highway 101",
    description:
      "Vehicle was hit from behind at a traffic light. Damage to rear bumper and trunk. Police report filed. Multiple witnesses present at the scene.",
    amount: 12500,
    policyNumber: "POL-AUTO-78432",
    policyholderName: "John Doe",
    submittedAt: "2026-02-10T10:30:00Z",
    updatedAt: "2026-02-20T14:15:00Z",
    assignedTo: "Sarah Johnson",
    riskScore: 15,
    documents: [
      {
        id: "d1",
        name: "police-report.pdf",
        type: "application/pdf",
        size: 245000,
        url: "#",
        uploadedAt: "2026-02-10T10:35:00Z",
      },
      {
        id: "d2",
        name: "damage-photo-1.jpg",
        type: "image/jpeg",
        size: 1250000,
        url: "#",
        uploadedAt: "2026-02-10T10:36:00Z",
      },
      {
        id: "d3",
        name: "repair-estimate.pdf",
        type: "application/pdf",
        size: 189000,
        url: "#",
        uploadedAt: "2026-02-12T09:00:00Z",
      },
    ],
    notes: [
      {
        id: "n1",
        author: "Sarah Johnson",
        authorRole: "adjuster",
        content:
          "All documents verified. Damage is consistent with the reported incident.",
        createdAt: "2026-02-15T11:00:00Z",
      },
      {
        id: "n2",
        author: "Sarah Johnson",
        authorRole: "adjuster",
        content:
          "Claim approved. Payment will be processed within 5 business days.",
        createdAt: "2026-02-20T14:15:00Z",
      },
    ],
    timeline: [
      {
        id: "t1",
        status: "SUBMITTED",
        description: "Claim submitted by policyholder",
        timestamp: "2026-02-10T10:30:00Z",
        author: "John Doe",
      },
      {
        id: "t2",
        status: "UNDER_REVIEW",
        description: "Claim assigned to adjuster Sarah Johnson",
        timestamp: "2026-02-12T09:00:00Z",
      },
      {
        id: "t3",
        status: "APPROVED",
        description: "Claim approved after review",
        timestamp: "2026-02-20T14:15:00Z",
        author: "Sarah Johnson",
      },
    ],
  },
  {
    id: "2",
    claimNumber: "CLM-2026-002",
    type: "home",
    status: "UNDER_REVIEW",
    title: "Water damage from burst pipe",
    description:
      "Pipe burst in basement during freezing temperatures, causing significant water damage to flooring and drywall. Emergency plumber called immediately.",
    amount: 28750,
    policyNumber: "POL-HOME-56210",
    policyholderName: "Emily Carter",
    submittedAt: "2026-02-15T08:20:00Z",
    updatedAt: "2026-02-22T16:00:00Z",
    assignedTo: "Michael Smith",
    riskScore: 32,
    documents: [
      {
        id: "d4",
        name: "plumber-invoice.pdf",
        type: "application/pdf",
        size: 156000,
        url: "#",
        uploadedAt: "2026-02-15T08:25:00Z",
      },
      {
        id: "d5",
        name: "water-damage-photos.zip",
        type: "application/zip",
        size: 4500000,
        url: "#",
        uploadedAt: "2026-02-15T08:30:00Z",
      },
    ],
    notes: [
      {
        id: "n3",
        author: "Michael Smith",
        authorRole: "adjuster",
        content:
          "Reviewing plumber invoice and damage documentation. May need on-site inspection.",
        createdAt: "2026-02-18T10:30:00Z",
      },
    ],
    timeline: [
      {
        id: "t4",
        status: "SUBMITTED",
        description: "Claim submitted by policyholder",
        timestamp: "2026-02-15T08:20:00Z",
        author: "Emily Carter",
      },
      {
        id: "t5",
        status: "UNDER_REVIEW",
        description: "Claim under review by adjuster Michael Smith",
        timestamp: "2026-02-18T10:00:00Z",
      },
    ],
  },
  {
    id: "3",
    claimNumber: "CLM-2026-003",
    type: "health",
    status: "INFO_NEEDED",
    title: "Emergency room visit - fractured wrist",
    description:
      "Slipped on ice and fractured wrist. Visited emergency room at City General Hospital. Required X-ray and cast placement.",
    amount: 4200,
    policyNumber: "POL-HLT-34129",
    policyholderName: "Robert Wilson",
    submittedAt: "2026-02-18T14:00:00Z",
    updatedAt: "2026-02-24T09:00:00Z",
    assignedTo: "Sarah Johnson",
    riskScore: 8,
    documents: [
      {
        id: "d6",
        name: "hospital-bill.pdf",
        type: "application/pdf",
        size: 312000,
        url: "#",
        uploadedAt: "2026-02-18T14:05:00Z",
      },
    ],
    notes: [
      {
        id: "n4",
        author: "Sarah Johnson",
        authorRole: "adjuster",
        content:
          "Need X-ray report and doctor's note. Please upload additional documents.",
        createdAt: "2026-02-24T09:00:00Z",
      },
    ],
    timeline: [
      {
        id: "t6",
        status: "SUBMITTED",
        description: "Claim submitted by policyholder",
        timestamp: "2026-02-18T14:00:00Z",
        author: "Robert Wilson",
      },
      {
        id: "t7",
        status: "INFO_NEEDED",
        description: "Additional documents requested",
        timestamp: "2026-02-24T09:00:00Z",
        author: "Sarah Johnson",
      },
    ],
  },
  {
    id: "4",
    claimNumber: "CLM-2026-004",
    type: "auto",
    status: "FLAGGED",
    title: "Total loss - vehicle fire",
    description:
      "Vehicle caught fire in parking lot. Cause unknown. Total loss declared. Fire department report pending.",
    amount: 45000,
    policyNumber: "POL-AUTO-91205",
    policyholderName: "David Rodriguez",
    submittedAt: "2026-02-20T16:45:00Z",
    updatedAt: "2026-02-25T11:30:00Z",
    assignedTo: "Michael Smith",
    riskScore: 82,
    documents: [
      {
        id: "d7",
        name: "fire-dept-report.pdf",
        type: "application/pdf",
        size: 520000,
        url: "#",
        uploadedAt: "2026-02-21T10:00:00Z",
      },
    ],
    notes: [
      {
        id: "n5",
        author: "Michael Smith",
        authorRole: "adjuster",
        content:
          "High risk score detected. Flagging for SIU investigation. Multiple inconsistencies in the timeline.",
        createdAt: "2026-02-25T11:30:00Z",
      },
    ],
    timeline: [
      {
        id: "t8",
        status: "SUBMITTED",
        description: "Claim submitted by policyholder",
        timestamp: "2026-02-20T16:45:00Z",
        author: "David Rodriguez",
      },
      {
        id: "t9",
        status: "UNDER_REVIEW",
        description: "Assigned for review",
        timestamp: "2026-02-22T09:00:00Z",
      },
      {
        id: "t10",
        status: "FLAGGED",
        description: "Flagged for potential fraud - high risk score",
        timestamp: "2026-02-25T11:30:00Z",
        author: "Michael Smith",
      },
    ],
  },
  {
    id: "5",
    claimNumber: "CLM-2026-005",
    type: "property",
    status: "DENIED",
    title: "Roof damage from storm",
    description:
      "Claim for roof shingle damage allegedly caused by windstorm. Pre-existing damage identified during inspection.",
    amount: 15800,
    policyNumber: "POL-PROP-67890",
    policyholderName: "Lisa Thompson",
    submittedAt: "2026-02-08T11:00:00Z",
    updatedAt: "2026-02-19T15:00:00Z",
    riskScore: 65,
    documents: [],
    notes: [
      {
        id: "n6",
        author: "Sarah Johnson",
        authorRole: "adjuster",
        content:
          "Inspection reveals pre-existing damage not covered under current policy terms. Claim denied.",
        createdAt: "2026-02-19T15:00:00Z",
      },
    ],
    timeline: [
      {
        id: "t11",
        status: "SUBMITTED",
        description: "Claim submitted",
        timestamp: "2026-02-08T11:00:00Z",
        author: "Lisa Thompson",
      },
      {
        id: "t12",
        status: "UNDER_REVIEW",
        description: "Under review - on-site inspection scheduled",
        timestamp: "2026-02-12T10:00:00Z",
      },
      {
        id: "t13",
        status: "DENIED",
        description: "Claim denied - pre-existing damage",
        timestamp: "2026-02-19T15:00:00Z",
        author: "Sarah Johnson",
      },
    ],
  },
  {
    id: "6",
    claimNumber: "CLM-2026-006",
    type: "liability",
    status: "SUBMITTED",
    title: "Slip and fall at business premises",
    description:
      "Customer slipped on a wet floor at retail store. Reported knee injury. Security camera footage available.",
    amount: 22000,
    policyNumber: "POL-LIA-45678",
    policyholderName: "Apex Retail Inc.",
    submittedAt: "2026-02-26T09:30:00Z",
    updatedAt: "2026-02-26T09:30:00Z",
    riskScore: 45,
    documents: [
      {
        id: "d8",
        name: "incident-report.pdf",
        type: "application/pdf",
        size: 180000,
        url: "#",
        uploadedAt: "2026-02-26T09:35:00Z",
      },
    ],
    notes: [],
    timeline: [
      {
        id: "t14",
        status: "SUBMITTED",
        description: "Claim submitted by policyholder",
        timestamp: "2026-02-26T09:30:00Z",
        author: "Apex Retail Inc.",
      },
    ],
  },
];

export const MOCK_DASHBOARD_STATS: any = {
  totalClaims: 156,
  pendingClaims: 42,
  approvedClaims: 89,
  deniedClaims: 18,
  flaggedClaims: 7,
  averageProcessingTime: 4.2,
  totalAmount: 2450000,
  trend: {
    totalClaims: 12,
    approvedClaims: 8,
    deniedClaims: -5,
  },
};

export const MOCK_CHART_DATA = [
  { month: "Sep", submitted: 32, approved: 24, denied: 5, flagged: 3 },
  { month: "Oct", submitted: 38, approved: 28, denied: 6, flagged: 4 },
  { month: "Nov", submitted: 35, approved: 26, denied: 4, flagged: 5 },
  { month: "Dec", submitted: 42, approved: 31, denied: 7, flagged: 4 },
  { month: "Jan", submitted: 45, approved: 35, denied: 6, flagged: 4 },
  { month: "Feb", submitted: 39, approved: 29, denied: 5, flagged: 5 },
];
