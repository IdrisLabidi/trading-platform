import { Injectable, inject } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpService);
}
