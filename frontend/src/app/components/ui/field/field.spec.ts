import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { Field } from './field';

@Component({
  imports: [Field],
  template: `
    <app-field
      inputId="email"
      label="E-mail"
      [control]="control"
      hint="Use seu e-mail."
      error="Informe seu e-mail."
    />
  `,
})
class FieldHost {
  readonly control = new FormControl('', { nonNullable: true, validators: Validators.required });
}

describe('Field', () => {
  it('associates label to the unique input id and exposes hint and error', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();
    const input = document.getElementById('email');
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(document.querySelectorAll('#email')).toHaveLength(1);
    expect(label.control).toBe(input);
    expect(input?.getAttribute('aria-describedby')).toBe('email-hint');

    fixture.componentInstance.control.markAsTouched();
    fixture.detectChanges();
    expect(input?.getAttribute('aria-invalid')).toBe('true');
    expect(input?.getAttribute('aria-describedby')).toBe('email-hint email-error');
    expect(fixture.nativeElement.querySelector('#email-error')?.textContent).toContain('Informe');
  });
});
