import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { CanbusCatalogApiService } from './core/canbus-catalog-api.service';

describe('App', () => {
  const api = {
    findCandidates: vi.fn().mockReturnValue(
      of({
        status: 'NOT_FOUND',
        reason: 'No se encontraron documentos.',
        decisionCodes: ['MODEL_NOT_FOUND'],
        normalizedInput: { manufacturer: 'seat', model: 'unknown', year: 2020 },
        candidates: [],
        selectedDocument: null,
      }),
    ),
  };

  beforeEach(async () => {
    api.findCandidates.mockClear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: CanbusCatalogApiService, useValue: api }],
    }).compileComponents();
  });

  it('renders the CANBus catalog query', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('h1')?.textContent).toContain(
      'Localiza esquemas CANBus candidatos',
    );
  });

  it('sends valid form values to the API service', () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.form.patchValue({
      manufacturer: 'SEAT',
      model: 'ARONA KJ',
      year: 2020,
      accessSystem: 'Regular-key',
    });

    fixture.componentInstance.submit();

    expect(api.findCandidates).toHaveBeenCalledWith({
      manufacturer: 'SEAT',
      model: 'ARONA KJ',
      year: 2020,
      accessSystem: 'Regular-key',
    });
    expect(fixture.componentInstance.result()?.decisionCodes).toEqual(['MODEL_NOT_FOUND']);
  });

  it('labels review-required results as pending', () => {
    expect(TestBed.createComponent(App).componentInstance.statusLabel('REVIEW_REQUIRED')).toBe(
      'Revisión pendiente',
    );
  });

  it('renders review-required results as pending without a selected document', async () => {
    api.findCandidates.mockReturnValueOnce(
      of({
        status: 'REVIEW_REQUIRED',
        reason: 'Faltan calificadores.',
        decisionCodes: ['INSUFFICIENT_QUALIFIERS'],
        normalizedInput: { manufacturer: 'ford', model: 'puma_k2', year: 2022 },
        candidates: [],
        selectedDocument: null,
      }),
    );
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance.form.patchValue({
      manufacturer: 'Ford',
      model: 'Puma K2',
      year: 2022,
    });

    fixture.componentInstance.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(content).toContain('Revisión pendiente');
    expect(content).toContain('ningún documento ha sido seleccionado automáticamente');
  });
});
