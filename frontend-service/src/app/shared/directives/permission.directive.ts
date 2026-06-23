import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject
} from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appPermission]',
  standalone: true
})
export class PermissionDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  private required: readonly string[] = [];
  private hasView = false;

  @Input({ required: true }) set appPermission(roles: readonly string[] | string) {
    this.required = Array.isArray(roles) ? roles : [roles];
    this.evaluate();
  }

  constructor() {
    effect(() => {
      void this.auth.user();
      this.evaluate();
    });
  }

  private evaluate(): void {
    const user = this.auth.user();
    const allowed = user !== null && this.required.every((r) => user.roles.includes(r));
    if (allowed && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.vcr.clear();
      this.hasView = false;
    }
  }
}
