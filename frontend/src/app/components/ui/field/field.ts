import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-field',
  imports: [ReactiveFormsModule],
  templateUrl: './field.html',
  styleUrl: './field.scss',
})
export class Field {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input('text');
  readonly autocomplete = input('off');
  readonly maxlength = input<number>();
  readonly hint = input('');
  readonly error = input.required<string>();

  get invalid(): boolean {
    return this.control().touched && this.control().invalid;
  }
}
