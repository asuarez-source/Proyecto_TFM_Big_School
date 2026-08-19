import type {
  CanbusCandidate,
  CanbusCandidateQuery,
  CanbusCandidateResponse,
  CanbusDecisionCode,
} from '@estudio-tecnico/contracts';
import type {
  CatalogDocumentRecord,
  CatalogQualifierRecord,
} from './canbus-catalog.types';

const QUALIFIER_INPUTS: Record<
  string,
  keyof Pick<
    CanbusCandidateQuery,
    'vin' | 'propulsion' | 'market' | 'accessSystem'
  >
> = {
  VIN_PREFIX: 'vin',
  PROPULSION: 'propulsion',
  MARKET: 'market',
  ACCESS_SYSTEM: 'accessSystem',
};

export function normalizeCatalogKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function compactIdentifier(value: string): string {
  return normalizeCatalogKey(value).replaceAll('_', '');
}

function descriptorContainsModel(descriptor: string, model: string): boolean {
  const descriptorTokens = descriptor.split('_').filter(Boolean);
  const modelTokens = model.split('_').filter(Boolean);

  if (
    modelTokens.length === 0 ||
    modelTokens.length > descriptorTokens.length
  ) {
    return false;
  }

  return descriptorTokens.some((_, startIndex) =>
    modelTokens.every(
      (modelToken, offset) =>
        descriptorTokens[startIndex + offset] === modelToken,
    ),
  );
}

function qualifierValue(qualifier: CatalogQualifierRecord): string {
  return normalizeCatalogKey(
    qualifier.canonicalValue ?? qualifier.normalizedValue,
  );
}

interface QualifierEvaluation {
  state: 'MATCHED' | 'UNRESOLVED' | 'MISMATCH';
  matchedCount: number;
  missingTypes: Set<string>;
  hasUnclassified: boolean;
  matchedVin: boolean;
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeCatalogKey(value).split('_').filter(Boolean));
}

function qualifierState(
  document: CatalogDocumentRecord,
  query: CanbusCandidateQuery,
): QualifierEvaluation {
  let unresolved = false;
  let matchedCount = 0;
  let hasUnclassified = false;
  let matchedVin = false;
  const missingTypes = new Set<string>();

  for (const qualifier of document.qualifiers) {
    if (qualifier.semanticType === 'UNCLASSIFIED') {
      unresolved = true;
      hasUnclassified = true;
      continue;
    }

    const inputName = qualifier.semanticType
      ? QUALIFIER_INPUTS[qualifier.semanticType]
      : undefined;
    if (!inputName) {
      continue;
    }

    const rawInput = query[inputName];
    if (!rawInput) {
      unresolved = true;
      missingTypes.add(qualifier.semanticType ?? 'UNKNOWN');
      continue;
    }

    const expected = qualifierValue(qualifier);
    const supplied = normalizeCatalogKey(rawInput);
    const matches =
      inputName === 'vin'
        ? compactIdentifier(rawInput).startsWith(compactIdentifier(expected))
        : inputName === 'propulsion'
          ? tokenSet(supplied).has(expected)
          : supplied === expected;

    if (!matches) {
      return {
        state: 'MISMATCH',
        matchedCount,
        missingTypes,
        hasUnclassified,
        matchedVin,
      };
    }
    matchedCount += 1;
    matchedVin ||= inputName === 'vin';
  }

  return {
    state: unresolved ? 'UNRESOLVED' : 'MATCHED',
    matchedCount,
    missingTypes,
    hasUnclassified,
    matchedVin,
  };
}

function toCandidate(document: CatalogDocumentRecord): CanbusCandidate {
  return {
    documentId: document.id,
    originalFilename: document.originalFilename,
    vehicleDescriptor: document.vehicleDescriptorOriginal,
    startYear: document.startYear,
    parseStatus: document.parseStatus,
    qualifiers: document.qualifiers
      .filter((part) => part.semanticType !== null)
      .map((part) => ({
        type: part.semanticType,
        originalValue: part.originalValue,
        canonicalValue: part.canonicalValue,
      })),
    warnings: document.issues.map((issue) => ({ ...issue })),
  };
}

const REASONS: Record<CanbusDecisionCode, string> = {
  MANUFACTURER_NOT_FOUND:
    'No existe el fabricante indicado en el catálogo CANBus.',
  MODEL_NOT_FOUND:
    'No se encontraron documentos para el modelo o descriptor indicado.',
  AMBIGUOUS_DESCRIPTOR:
    'El descriptor introducido puede corresponder a más de una variante.',
  NO_PARSED_DOCUMENT:
    'Los documentos encontrados no están disponibles para selección automática.',
  VEHICLE_BEFORE_FIRST_DOCUMENT:
    'El vehículo es anterior al primer esquema disponible.',
  AFTER_LAST_DOCUMENT_VALIDITY_UNKNOWN:
    'El vehículo es posterior al último esquema y no hay información suficiente sobre su vigencia.',
  QUALIFIER_MISMATCH:
    'Los calificadores introducidos no coinciden con los documentos del periodo aplicable.',
  MISSING_VIN_PREFIX:
    'Se necesita el VIN para distinguir los documentos por prefijo.',
  INSUFFICIENT_QUALIFIERS:
    'Faltan calificadores para seleccionar un documento de forma inequívoca.',
  UNCLASSIFIED_QUALIFIER:
    'El catálogo contiene un calificador que requiere revisión manual.',
  IMPORT_WARNING_REQUIRES_REVIEW:
    'Una advertencia de importación impide confirmar automáticamente el documento.',
  AMBIGUOUS_DOCUMENTS: 'Más de un documento cumple los mismos criterios.',
  YEAR_INTERVAL_MATCH:
    'Se seleccionó el esquema más reciente que comienza antes del año indicado.',
  EXACT_START_YEAR_MATCH:
    'Se seleccionó el esquema que comienza en el año indicado.',
  DESCRIPTOR_MATCH: 'El modelo o descriptor coincide con el documento.',
  QUALIFIERS_MATCH: 'Los calificadores aportados coinciden con el documento.',
  VIN_PREFIX_MATCH: 'El prefijo del VIN coincide con el documento.',
  MOST_SPECIFIC_QUALIFIER_MATCH:
    'Se seleccionó el documento con los calificadores coincidentes más específicos.',
};

function buildResponse(
  status: CanbusCandidateResponse['status'],
  primaryCode: CanbusDecisionCode,
  decisionCodes: CanbusDecisionCode[],
  normalizedInput: CanbusCandidateResponse['normalizedInput'],
  documents: CatalogDocumentRecord[],
  selected?: CatalogDocumentRecord,
): CanbusCandidateResponse {
  return {
    status,
    reason: REASONS[primaryCode],
    decisionCodes: [...new Set(decisionCodes)],
    normalizedInput,
    candidates: documents.map(toCandidate),
    selectedDocument: selected ? toCandidate(selected) : null,
  };
}

export function selectCanbusCandidates(
  documents: CatalogDocumentRecord[],
  query: CanbusCandidateQuery,
): CanbusCandidateResponse {
  const normalizedManufacturer = normalizeCatalogKey(query.manufacturer);
  const normalizedModel = normalizeCatalogKey(query.model);
  const normalizedInput = {
    manufacturer: normalizedManufacturer,
    model: normalizedModel,
    year: query.year,
  };
  const exactMatches = documents.filter(
    (document) => document.vehicleDescriptorNormalized === normalizedModel,
  );
  const partialMatches = documents.filter((document) =>
    descriptorContainsModel(
      document.vehicleDescriptorNormalized,
      normalizedModel,
    ),
  );
  const modelMatches = exactMatches.length > 0 ? exactMatches : partialMatches;

  if (modelMatches.length === 0) {
    return buildResponse(
      'NOT_FOUND',
      'MODEL_NOT_FOUND',
      ['MODEL_NOT_FOUND'],
      normalizedInput,
      [],
    );
  }

  const orderedCandidates = [...modelMatches].sort(
    (left, right) =>
      (right.startYear ?? -1) - (left.startYear ?? -1) ||
      left.originalFilename.localeCompare(right.originalFilename),
  );
  const descriptorVariants = new Set(
    modelMatches.map((document) => document.vehicleDescriptorNormalized),
  );
  if (exactMatches.length === 0 && descriptorVariants.size > 1) {
    return buildResponse(
      'REVIEW_REQUIRED',
      'AMBIGUOUS_DESCRIPTOR',
      ['AMBIGUOUS_DESCRIPTOR'],
      normalizedInput,
      orderedCandidates,
    );
  }

  const dated = modelMatches.filter((document) => document.startYear !== null);
  const eligible = dated.filter(
    (document) => (document.startYear as number) <= query.year,
  );

  if (dated.length === 0) {
    return buildResponse(
      'REVIEW_REQUIRED',
      'NO_PARSED_DOCUMENT',
      ['NO_PARSED_DOCUMENT'],
      normalizedInput,
      orderedCandidates,
    );
  }

  if (eligible.length === 0) {
    return buildResponse(
      'NOT_FOUND',
      'VEHICLE_BEFORE_FIRST_DOCUMENT',
      ['VEHICLE_BEFORE_FIRST_DOCUMENT'],
      normalizedInput,
      orderedCandidates,
    );
  }

  const latestStartYear = Math.max(
    ...eligible.map((document) => document.startYear as number),
  );
  const temporalCandidates = dated.filter(
    (document) => document.startYear === latestStartYear,
  );
  const evaluated = temporalCandidates.map((document) => ({
    document,
    evaluation: qualifierState(document, query),
  }));
  const nonMismatches = evaluated.filter(
    ({ evaluation }) => evaluation.state !== 'MISMATCH',
  );
  const matched = nonMismatches.filter(
    ({ evaluation }) => evaluation.state === 'MATCHED',
  );

  if (nonMismatches.length === 0) {
    return buildResponse(
      'NOT_FOUND',
      'QUALIFIER_MISMATCH',
      ['QUALIFIER_MISMATCH'],
      normalizedInput,
      orderedCandidates,
    );
  }

  if (matched.length === 0) {
    const missingVin = nonMismatches.some(({ evaluation }) =>
      evaluation.missingTypes.has('VIN_PREFIX'),
    );
    const unclassified = nonMismatches.some(
      ({ evaluation }) => evaluation.hasUnclassified,
    );
    const primaryCode: CanbusDecisionCode = unclassified
      ? 'UNCLASSIFIED_QUALIFIER'
      : missingVin
        ? 'MISSING_VIN_PREFIX'
        : 'INSUFFICIENT_QUALIFIERS';
    const codes: CanbusDecisionCode[] = [primaryCode];
    if (primaryCode !== 'INSUFFICIENT_QUALIFIERS') {
      codes.push('INSUFFICIENT_QUALIFIERS');
    }
    return buildResponse(
      'REVIEW_REQUIRED',
      primaryCode,
      codes,
      normalizedInput,
      orderedCandidates,
    );
  }

  if (
    temporalCandidates.some(
      (document) =>
        document.parseStatus !== 'OK' &&
        qualifierState(document, query).state !== 'MISMATCH',
    )
  ) {
    return buildResponse(
      'REVIEW_REQUIRED',
      'IMPORT_WARNING_REQUIRES_REVIEW',
      ['IMPORT_WARNING_REQUIRES_REVIEW'],
      normalizedInput,
      orderedCandidates,
    );
  }

  const greatestSpecificity = Math.max(
    ...matched.map(({ evaluation }) => evaluation.matchedCount),
  );
  const mostSpecific = matched.filter(
    ({ evaluation }) => evaluation.matchedCount === greatestSpecificity,
  );
  if (mostSpecific.length !== 1) {
    return buildResponse(
      'REVIEW_REQUIRED',
      'AMBIGUOUS_DOCUMENTS',
      ['AMBIGUOUS_DOCUMENTS'],
      normalizedInput,
      orderedCandidates,
    );
  }

  const selected = mostSpecific[0];
  const lastStartYear = Math.max(
    ...dated.map((document) => document.startYear as number),
  );
  if (query.year > lastStartYear) {
    return buildResponse(
      'REVIEW_REQUIRED',
      'AFTER_LAST_DOCUMENT_VALIDITY_UNKNOWN',
      ['AFTER_LAST_DOCUMENT_VALIDITY_UNKNOWN'],
      normalizedInput,
      orderedCandidates,
    );
  }

  const yearCode: CanbusDecisionCode =
    latestStartYear === query.year
      ? 'EXACT_START_YEAR_MATCH'
      : 'YEAR_INTERVAL_MATCH';
  const codes: CanbusDecisionCode[] = [yearCode, 'DESCRIPTOR_MATCH'];
  if (selected.evaluation.matchedCount > 0) {
    codes.push('QUALIFIERS_MATCH');
  }
  if (selected.evaluation.matchedVin) {
    codes.push('VIN_PREFIX_MATCH');
  }
  if (
    greatestSpecificity > 0 &&
    matched.some(
      ({ evaluation }) => evaluation.matchedCount < greatestSpecificity,
    )
  ) {
    codes.push('MOST_SPECIFIC_QUALIFIER_MATCH');
  }
  return buildResponse(
    'MATCHED',
    yearCode,
    codes,
    normalizedInput,
    orderedCandidates,
    selected.document,
  );
}
