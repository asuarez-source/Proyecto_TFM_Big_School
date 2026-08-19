import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonApp,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { CanbusCandidateResponse } from '@estudio-tecnico/contracts';
import { finalize } from 'rxjs';
import { CanbusCatalogApiService } from './core/canbus-catalog-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [
    ReactiveFormsModule,
    IonApp,
    IonBadge,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSpinner,
    IonTitle,
    IonToolbar,
  ],
})
export class App {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(CanbusCatalogApiService);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly result = signal<CanbusCandidateResponse | null>(null);
  readonly form = this.formBuilder.nonNullable.group({
    manufacturer: ['', [Validators.required, Validators.maxLength(120)]],
    model: ['', [Validators.required, Validators.maxLength(180)]],
    year: [new Date().getUTCFullYear(), [Validators.required, Validators.min(1)]],
    vin: ['', Validators.maxLength(40)],
    propulsion: ['', Validators.maxLength(150)],
    market: ['', Validators.maxLength(150)],
    accessSystem: ['', Validators.maxLength(150)],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.result.set(null);
    const value = this.form.getRawValue();

    this.api
      .findCandidates({
        manufacturer: value.manufacturer,
        model: value.model,
        year: value.year,
        ...(value.vin ? { vin: value.vin } : {}),
        ...(value.propulsion ? { propulsion: value.propulsion } : {}),
        ...(value.market ? { market: value.market } : {}),
        ...(value.accessSystem ? { accessSystem: value.accessSystem } : {}),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => this.result.set(result),
        error: () =>
          this.errorMessage.set(
            'No se pudo consultar el catálogo. Revisa la conexión e inténtalo de nuevo.',
          ),
      });
  }

  statusColor(status: CanbusCandidateResponse['status']): string {
    switch (status) {
      case 'MATCHED':
        return 'success';
      case 'REVIEW_REQUIRED':
        return 'warning';
      case 'NOT_FOUND':
        return 'medium';
    }
  }

  statusLabel(status: CanbusCandidateResponse['status']): string {
    switch (status) {
      case 'MATCHED':
        return 'Documento identificado';
      case 'REVIEW_REQUIRED':
        return 'Revisión pendiente';
      case 'NOT_FOUND':
        return 'Sin resultado';
    }
  }
}
