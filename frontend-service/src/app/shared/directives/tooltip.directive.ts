import { Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private _text = '';

  @Input({ alias: 'appTooltip', required: true }) set text(value: string) {
    this._text = value;
    this.host.nativeElement.setAttribute('title', this._text);
  }

  get text(): string {
    return this._text;
  }
}
