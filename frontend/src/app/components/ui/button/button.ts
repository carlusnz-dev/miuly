import { Component, input, signal } from '@angular/core';

@Component({ selector: 'app-button', templateUrl: './button.html', styleUrl: './button.scss' })
export class Button {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly pointerX = signal('50%');
  readonly pointerY = signal('50%');

  move(event: PointerEvent): void {
    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pointerX.set(`${event.clientX - bounds.left}px`);
    this.pointerY.set(`${event.clientY - bounds.top}px`);
  }
}
