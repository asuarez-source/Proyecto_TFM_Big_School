import { Injectable } from '@nestjs/common';
import type {
  CanbusCandidateQuery,
  CanbusCandidateResponse,
} from '@estudio-tecnico/contracts';
import {
  normalizeCatalogKey,
  selectCanbusCandidates,
} from '../domain/canbus-candidate-selector';
import { CanbusCatalogRepository } from '../infrastructure/canbus-catalog.repository';

@Injectable()
export class FindCanbusCandidatesService {
  constructor(private readonly repository: CanbusCatalogRepository) {}

  async execute(query: CanbusCandidateQuery): Promise<CanbusCandidateResponse> {
    const normalizedManufacturer = normalizeCatalogKey(query.manufacturer);
    const manufacturerExists = await this.repository.manufacturerExists(
      normalizedManufacturer,
    );

    if (!manufacturerExists) {
      return {
        status: 'NOT_FOUND',
        reason: 'No existe el fabricante indicado en el catálogo CANBus.',
        decisionCodes: ['MANUFACTURER_NOT_FOUND'],
        normalizedInput: {
          manufacturer: normalizedManufacturer,
          model: normalizeCatalogKey(query.model),
          year: query.year,
        },
        candidates: [],
        selectedDocument: null,
      };
    }

    const documents = await this.repository.findDocumentsByManufacturer(
      normalizedManufacturer,
    );
    return selectCanbusCandidates(documents, query);
  }
}
