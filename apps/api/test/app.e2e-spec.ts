import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HealthService } from '../src/modules/health/application/health.service';
import { HealthController } from '../src/modules/health/presentation/health.controller';
import { FindCanbusCandidatesService } from '../src/modules/canbus-catalog/application/find-canbus-candidates.service';
import { CanbusCatalogController } from '../src/modules/canbus-catalog/presentation/canbus-catalog.controller';

describe('HealthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [HealthController, CanbusCatalogController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            check: jest.fn().mockResolvedValue({
              status: 'ok',
              database: 'up',
              timestamp: '2026-08-19T00:00:00.000Z',
            }),
          },
        },
        {
          provide: FindCanbusCandidatesService,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              status: 'NOT_FOUND',
              reason:
                'No se encontraron documentos para el modelo o descriptor indicado.',
              decisionCodes: ['MODEL_NOT_FOUND'],
              normalizedInput: {
                manufacturer: 'seat',
                model: 'unknown',
                year: 2020,
              },
              candidates: [],
              selectedDocument: null,
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/api/health (GET)', () =>
    request(app.getHttpServer()).get('/api/health').expect(200).expect({
      status: 'ok',
      database: 'up',
      timestamp: '2026-08-19T00:00:00.000Z',
    }));

  it('/api/canbus-catalog/candidates (GET)', () =>
    request(app.getHttpServer())
      .get('/api/canbus-catalog/candidates')
      .query({ manufacturer: 'SEAT', model: 'Unknown', year: 2020 })
      .expect(200)
      .expect({
        status: 'NOT_FOUND',
        reason:
          'No se encontraron documentos para el modelo o descriptor indicado.',
        decisionCodes: ['MODEL_NOT_FOUND'],
        normalizedInput: {
          manufacturer: 'seat',
          model: 'unknown',
          year: 2020,
        },
        candidates: [],
        selectedDocument: null,
      }));

  it('returns a selected document only for an unequivocal match', async () => {
    const selectedDocument = {
      documentId: '949',
      originalFilename: 'FORD_PUMA_K2_2020_en.pdf',
      vehicleDescriptor: 'PUMA_K2',
      startYear: 2020,
      parseStatus: 'OK',
      qualifiers: [],
      warnings: [],
    };
    jest
      .spyOn(app.get(FindCanbusCandidatesService), 'execute')
      .mockResolvedValueOnce({
        status: 'MATCHED',
        reason:
          'Se seleccionó el esquema más reciente que comienza antes del año indicado.',
        decisionCodes: ['YEAR_INTERVAL_MATCH', 'DESCRIPTOR_MATCH'],
        normalizedInput: {
          manufacturer: 'ford',
          model: 'puma_k2',
          year: 2022,
        },
        candidates: [selectedDocument],
        selectedDocument,
      });

    await request(app.getHttpServer())
      .get('/api/canbus-catalog/candidates')
      .query({ manufacturer: 'Ford', model: 'Puma K2', year: 2022 })
      .expect(200)
      .expect({
        status: 'MATCHED',
        reason:
          'Se seleccionó el esquema más reciente que comienza antes del año indicado.',
        decisionCodes: ['YEAR_INTERVAL_MATCH', 'DESCRIPTOR_MATCH'],
        normalizedInput: {
          manufacturer: 'ford',
          model: 'puma_k2',
          year: 2022,
        },
        candidates: [selectedDocument],
        selectedDocument,
      });
  });

  it('rejects an invalid CANBus query', () =>
    request(app.getHttpServer())
      .get('/api/canbus-catalog/candidates')
      .query({ manufacturer: 'SEAT', model: 'ARONA', year: 'invalid' })
      .expect(400));

  afterEach(async () => {
    await app.close();
  });
});
