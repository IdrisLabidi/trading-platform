import type { Observable } from 'rxjs';

import type { IDashboardData } from '../models/dashboard.model';

/**
 * Public surface of the dashboard feature service.
 *
 * The contract is intentionally narrow: a single `load()` call that
 * resolves with the aggregated payload consumed by the widgets. The
 * concrete implementation (`DashboardService`) is responsible for
 * hitting each backend endpoint and normalising the results, so
 * future implementations (in-memory mock, GraphQL gateway, etc.)
 * can be swapped without touching the rest of the feature.
 */
export interface IDashboardService {
  /**
   * Fetch the full dashboard payload in one go. Implementations are
   * expected to issue parallel requests and reject the promise as
   * soon as one of them fails. The returned `Observable` always
   * emits exactly one value then completes.
   */
  load(): Observable<IDashboardData>;
}
