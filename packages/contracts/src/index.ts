export interface HealthResponse {
  status: "ok";
  database: "up";
  timestamp: string;
}

export type CanbusSelectionStatus = "MATCHED" | "REVIEW_REQUIRED" | "NOT_FOUND";

export type CanbusDecisionCode =
  | "MANUFACTURER_NOT_FOUND"
  | "MODEL_NOT_FOUND"
  | "AMBIGUOUS_DESCRIPTOR"
  | "NO_PARSED_DOCUMENT"
  | "VEHICLE_BEFORE_FIRST_DOCUMENT"
  | "AFTER_LAST_DOCUMENT_VALIDITY_UNKNOWN"
  | "QUALIFIER_MISMATCH"
  | "MISSING_VIN_PREFIX"
  | "INSUFFICIENT_QUALIFIERS"
  | "UNCLASSIFIED_QUALIFIER"
  | "IMPORT_WARNING_REQUIRES_REVIEW"
  | "AMBIGUOUS_DOCUMENTS"
  | "YEAR_INTERVAL_MATCH"
  | "EXACT_START_YEAR_MATCH"
  | "DESCRIPTOR_MATCH"
  | "QUALIFIERS_MATCH"
  | "VIN_PREFIX_MATCH"
  | "MOST_SPECIFIC_QUALIFIER_MATCH";

export interface CanbusCandidateQualifier {
  type: string | null;
  originalValue: string;
  canonicalValue: string | null;
}

export interface CanbusCandidateWarning {
  code: string;
  message: string;
}

export interface CanbusCandidate {
  documentId: string;
  originalFilename: string;
  vehicleDescriptor: string;
  startYear: number | null;
  parseStatus: string;
  qualifiers: CanbusCandidateQualifier[];
  warnings: CanbusCandidateWarning[];
}

export interface CanbusCandidateQuery {
  manufacturer: string;
  model: string;
  year: number;
  vin?: string;
  propulsion?: string;
  market?: string;
  accessSystem?: string;
}

export interface CanbusCandidateResponse {
  status: CanbusSelectionStatus;
  reason: string;
  decisionCodes: CanbusDecisionCode[];
  normalizedInput: {
    manufacturer: string;
    model: string;
    year: number;
  };
  candidates: CanbusCandidate[];
  selectedDocument: CanbusCandidate | null;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  correlationId: string;
}
