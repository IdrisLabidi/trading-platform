import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({ providedIn: 'root' })
export class NotificationStorageService {
  private readonly storage = inject(StorageService);
}
