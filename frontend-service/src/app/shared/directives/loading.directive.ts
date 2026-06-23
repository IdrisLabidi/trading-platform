import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Directive({
  selector: '[appLoading]',
  standalone: true
})
export class LoadingDirective {
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);
  private readonly loading = inject(LoadingService);
  private readonly thenTpl = inject(TemplateRef<unknown>);

  private hasView = false;

  @Input({ required: true }) set appLoading(active: boolean) {
    if (active && !this.hasView) {
      this.vcr.createEmbeddedView(this.tpl);
      this.hasView = true;
    } else if (!active && this.hasView) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.thenTpl);
    }
  }

  constructor() {
    effect(() => {
      void this.loading.active();
    });
  }
}
