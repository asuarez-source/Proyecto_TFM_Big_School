import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CanbusCatalogApiService } from './canbus-catalog-api.service';

describe('CanbusCatalogApiService', () => {
  let service: CanbusCatalogApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CanbusCatalogApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('serializes required and optional query fields', () => {
    service
      .findCandidates({
        manufacturer: 'SEAT',
        model: 'ARONA KJ',
        year: 2020,
        vin: '143ABC',
        propulsion: 'Hybrid Plugin',
        market: 'LatAmMarket',
        accessSystem: 'Regular-key',
      })
      .subscribe();

    const request = httpTesting.expectOne(
      (candidate) => candidate.url === '/api/canbus-catalog/candidates',
    );
    expect(request.request.params.get('manufacturer')).toBe('SEAT');
    expect(request.request.params.get('model')).toBe('ARONA KJ');
    expect(request.request.params.get('year')).toBe('2020');
    expect(request.request.params.get('accessSystem')).toBe('Regular-key');
    expect(request.request.params.get('vin')).toBe('143ABC');
    expect(request.request.params.get('propulsion')).toBe('Hybrid Plugin');
    expect(request.request.params.get('market')).toBe('LatAmMarket');
    request.flush({
      status: 'NOT_FOUND',
      reason: 'No se encontraron documentos.',
      decisionCodes: ['MODEL_NOT_FOUND'],
      normalizedInput: { manufacturer: 'seat', model: 'arona_kj', year: 2020 },
      candidates: [],
      selectedDocument: null,
    });
  });
});
