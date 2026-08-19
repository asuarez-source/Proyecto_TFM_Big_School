export interface CatalogQualifierRecord {
  semanticType: string | null;
  originalValue: string;
  normalizedValue: string;
  canonicalValue: string | null;
}

export interface CatalogIssueRecord {
  code: string;
  message: string;
}

export interface CatalogDocumentRecord {
  id: string;
  originalFilename: string;
  vehicleDescriptorOriginal: string;
  vehicleDescriptorNormalized: string;
  startYear: number | null;
  parseStatus: string;
  qualifiers: CatalogQualifierRecord[];
  issues: CatalogIssueRecord[];
}
