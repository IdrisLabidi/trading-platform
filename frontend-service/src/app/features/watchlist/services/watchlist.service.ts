import { Injectable, inject } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly http = inject(HttpService);
}
