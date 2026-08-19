import { FindCanbusCandidatesService } from './find-canbus-candidates.service';
import { CanbusCatalogRepository } from '../infrastructure/canbus-catalog.repository';

describe('FindCanbusCandidatesService', () => {
  it('does not query documents when the manufacturer is unknown', async () => {
    const repository = {
      manufacturerExists: jest.fn().mockResolvedValue(false),
      findDocumentsByManufacturer: jest.fn(),
    };
    const service = new FindCanbusCandidatesService(
      repository as unknown as CanbusCatalogRepository,
    );

    const result = await service.execute({
      manufacturer: 'Unknown',
      model: 'Model',
      year: 2020,
    });

    expect(result.decisionCodes).toEqual(['MANUFACTURER_NOT_FOUND']);
    expect(result.selectedDocument).toBeNull();
    expect(repository.findDocumentsByManufacturer).not.toHaveBeenCalled();
  });
});
