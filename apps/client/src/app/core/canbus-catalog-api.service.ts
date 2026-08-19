import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { CanbusCandidateQuery, CanbusCandidateResponse } from '@estudio-tecnico/contracts';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CanbusCatalogApiService {
  private readonly http = inject(HttpClient);

  findCandidates(query: CanbusCandidateQuery): Observable<CanbusCandidateResponse> {
    let params = new HttpParams()
      .set('manufacturer', query.manufacturer)
      .set('model', query.model)
      .set('year', query.year);

    for (const [name, value] of [
      ['vin', query.vin],
      ['propulsion', query.propulsion],
      ['market', query.market],
      ['accessSystem', query.accessSystem],
    ] as const) {
      if (value) {
        params = params.set(name, value);
      }
    }

    return this.http.get<CanbusCandidateResponse>('/api/canbus-catalog/candidates', {
      params,
    });
  }
}
