import type { CanbusCandidateQuery } from '@estudio-tecnico/contracts';
import {
  normalizeCatalogKey,
  selectCanbusCandidates,
} from './canbus-candidate-selector';
import type {
  CatalogDocumentRecord,
  CatalogQualifierRecord,
} from './canbus-catalog.types';

const fordPumaQuery: CanbusCandidateQuery = {
  manufacturer: 'Ford',
  model: 'Puma K2',
  year: 2022,
};

function qualifier(
  semanticType: string,
  value: string,
): CatalogQualifierRecord {
  return {
    semanticType,
    originalValue: value,
    normalizedValue: normalizeCatalogKey(value),
    canonicalValue: value,
  };
}

function document(
  id: string,
  descriptor: string,
  startYear: number,
  qualifiers: CatalogQualifierRecord[] = [],
  options: Partial<
    Pick<CatalogDocumentRecord, 'parseStatus' | 'issues' | 'originalFilename'>
  > = {},
): CatalogDocumentRecord {
  return {
    id,
    originalFilename:
      options.originalFilename ??
      `FORD_${normalizeCatalogKey(descriptor).toUpperCase()}_${startYear}_en.pdf`,
    vehicleDescriptorOriginal: descriptor,
    vehicleDescriptorNormalized: normalizeCatalogKey(descriptor),
    startYear,
    parseStatus: options.parseStatus ?? 'OK',
    qualifiers,
    issues: options.issues ?? [],
  };
}

describe('selectCanbusCandidates', () => {
  it('normalizes accents, whitespace and separators deterministically', () => {
    expect(normalizeCatalogKey('  Citroën C-4  ')).toBe('citroen_c_4');
  });

  it('selects Ford Puma 2020 for an intermediate 2022 vehicle year', () => {
    const result = selectCanbusCandidates(
      [document('2020', 'PUMA K2', 2020), document('2024', 'PUMA K2', 2024)],
      fordPumaQuery,
    );

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('YEAR_INTERVAL_MATCH');
    expect(result.selectedDocument?.documentId).toBe('2020');
  });

  it('reports a vehicle before the first document as not covered', () => {
    const result = selectCanbusCandidates(
      [document('2020', 'PUMA K2', 2020), document('2024', 'PUMA K2', 2024)],
      { ...fordPumaQuery, year: 2019 },
    );

    expect(result.status).toBe('NOT_FOUND');
    expect(result.decisionCodes).toEqual(['VEHICLE_BEFORE_FIRST_DOCUMENT']);
    expect(result.selectedDocument).toBeNull();
  });

  it('requires review after the last document without validity information', () => {
    const result = selectCanbusCandidates(
      [document('2020', 'PUMA K2', 2020), document('2024', 'PUMA K2', 2024)],
      { ...fordPumaQuery, year: 2025 },
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toEqual([
      'AFTER_LAST_DOCUMENT_VALIDITY_UNKNOWN',
    ]);
    expect(result.selectedDocument).toBeNull();
  });

  it('matches an exact unique start year', () => {
    const result = selectCanbusCandidates(
      [document('2020', 'PUMA K2', 2020), document('2024', 'PUMA K2', 2024)],
      { ...fordPumaQuery, year: 2024 },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('EXACT_START_YEAR_MATCH');
    expect(result.selectedDocument?.documentId).toBe('2024');
  });

  it('requires review for two indistinguishable documents in the selected year', () => {
    const result = selectCanbusCandidates(
      [
        document('a', 'PUMA K2', 2020),
        document('b', 'PUMA K2', 2020),
        document('future', 'PUMA K2', 2024),
      ],
      fordPumaQuery,
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toEqual(['AMBIGUOUS_DOCUMENTS']);
  });

  it('uses a VIN prefix to distinguish documents', () => {
    const documents = [
      document('143', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '143')]),
      document('193', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '193')]),
    ];
    const result = selectCanbusCandidates(documents, {
      manufacturer: 'Citroën',
      model: 'Berlingo',
      year: 2008,
      vin: '143ABC12345678901',
    });

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('VIN_PREFIX_MATCH');
    expect(result.selectedDocument?.documentId).toBe('143');
  });

  it('requires a VIN when it is needed to distinguish documents', () => {
    const result = selectCanbusCandidates(
      [
        document('143', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '143')]),
        document('193', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '193')]),
      ],
      { manufacturer: 'Citroën', model: 'Berlingo', year: 2008 },
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toContain('MISSING_VIN_PREFIX');
    expect(result.selectedDocument).toBeNull();
  });

  it('returns not found when every VIN prefix mismatches', () => {
    const result = selectCanbusCandidates(
      [
        document('143', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '143')]),
        document('193', 'BERLINGO', 2008, [qualifier('VIN_PREFIX', '193')]),
      ],
      {
        manufacturer: 'Citroën',
        model: 'Berlingo',
        year: 2008,
        vin: '999ABC12345678901',
      },
    );

    expect(result.status).toBe('NOT_FOUND');
    expect(result.decisionCodes).toEqual(['QUALIFIER_MISMATCH']);
  });

  it.each([
    ['Hybrid', 'hybrid'],
    ['Electric', 'electric'],
  ])('selects the %s propulsion variant', (propulsion, selectedId) => {
    const result = selectCanbusCandidates(
      [
        document('hybrid', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Hybrid'),
        ]),
        document('electric', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Electric'),
        ]),
      ],
      { manufacturer: 'Brand', model: 'Model X', year: 2022, propulsion },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.selectedDocument?.documentId).toBe(selectedId);
  });

  it('matches a composite Hybrid Plugin qualifier', () => {
    const result = selectCanbusCandidates(
      [
        document('plugin', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Hybrid'),
          qualifier('PROPULSION', 'Plugin'),
        ]),
      ],
      {
        manufacturer: 'Brand',
        model: 'Model X',
        year: 2022,
        propulsion: 'Hybrid Plugin',
      },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.selectedDocument?.documentId).toBe('plugin');
  });

  it('selects the matching market', () => {
    const result = selectCanbusCandidates(
      [
        document('china', 'MODEL X', 2022, [
          qualifier('MARKET', 'ChinaMarket'),
        ]),
        document('latam', 'MODEL X', 2022, [
          qualifier('MARKET', 'LatAmMarket'),
        ]),
      ],
      {
        manufacturer: 'Brand',
        model: 'Model X',
        year: 2022,
        market: 'LatAmMarket',
      },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.selectedDocument?.documentId).toBe('latam');
  });

  it('requires review when variant qualifiers are missing', () => {
    const result = selectCanbusCandidates(
      [
        document('hybrid', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Hybrid'),
        ]),
        document('electric', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Electric'),
        ]),
      ],
      { manufacturer: 'Brand', model: 'Model X', year: 2022 },
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toContain('INSUFFICIENT_QUALIFIERS');
  });

  it('prefers a matching specialized document over a general document', () => {
    const result = selectCanbusCandidates(
      [
        document('general', 'MODEL X', 2022),
        document('electric', 'MODEL X', 2022, [
          qualifier('PROPULSION', 'Electric'),
        ]),
      ],
      {
        manufacturer: 'Brand',
        model: 'Model X',
        year: 2022,
        propulsion: 'Electric',
      },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.decisionCodes).toContain('MOST_SPECIFIC_QUALIFIER_MATCH');
    expect(result.selectedDocument?.documentId).toBe('electric');
  });

  it('treats Sport as part of the descriptor', () => {
    const result = selectCanbusCandidates(
      [
        document('base', 'MODEL X', 2022),
        document('sport', 'MODEL X SPORT', 2022),
      ],
      { manufacturer: 'Brand', model: 'Model X Sport', year: 2022 },
    );

    expect(result.status).toBe('MATCHED');
    expect(result.selectedDocument?.documentId).toBe('sport');
  });

  it('requires review for an ambiguous partial descriptor', () => {
    const result = selectCanbusCandidates(
      [
        document('sport', 'MODEL X SPORT', 2022),
        document('tourer', 'MODEL X TOURER', 2022),
      ],
      { manufacturer: 'Brand', model: 'Model X', year: 2022 },
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toEqual(['AMBIGUOUS_DESCRIPTOR']);
  });

  it('requires review when an import warning competes in the selected year', () => {
    const result = selectCanbusCandidates(
      [
        document('ok', 'MODEL X', 2022),
        document('warning', 'MODEL X', 2022, [], {
          parseStatus: 'NORMALIZED_WITH_WARNING',
          issues: [
            {
              code: 'LANGUAGE_SEPARATOR_MISSING',
              message: 'Separador normalizado.',
            },
          ],
        }),
      ],
      { manufacturer: 'Brand', model: 'Model X', year: 2022 },
    );

    expect(result.status).toBe('REVIEW_REQUIRED');
    expect(result.decisionCodes).toEqual(['IMPORT_WARNING_REQUIRES_REVIEW']);
    expect(result.candidates[1]?.warnings).toHaveLength(1);
    expect(result.selectedDocument).toBeNull();
  });
});
