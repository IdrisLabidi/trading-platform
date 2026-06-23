import { Injectable, inject } from '@angular/core';
import { HttpService } from '../../../core/services/http.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpService);
}
