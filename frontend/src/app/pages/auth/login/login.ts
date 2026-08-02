import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  tuiValidationErrorsProvider,
  TuiTextfieldComponent,
  TuiLabel,
  TuiInputDirective,
  TuiButton,
  TuiError,
} from '@taiga-ui/core';
import { TuiForm } from '@taiga-ui/layout';
import { Auth } from '../../../core/auth/auth';
import { HttpErrorResponse } from '@angular/common/http';

// validators
function identifierValidator(field: AbstractControl): ValidationErrors | null {
  const tamanho = field.value.length;
  return tamanho >= 3 && tamanho <= 30 ? null : { identifierInvalido: true };
}

function passwordValidator(field: AbstractControl): ValidationErrors | null {
  const tamanho = field.value.length;
  return tamanho >= 8 ? null : { senhaInvalida: true };
}

// componente
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    TuiForm,
    TuiTextfieldComponent,
    TuiLabel,
    TuiInputDirective,
    TuiButton,
    TuiError,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [
    tuiValidationErrorsProvider({
      required: 'Campo obrigatório',
      identifierInvalido: 'Informe seu nome ou e-mail (3 a 30 caracteres)',
      senhaInvalida: 'A senha precisa de no mínimo 8 caracteres',
    }),
  ],
})
export class Login {
  private readonly auth = inject(Auth); // injeta o services auth
  protected readonly erroApi = signal<string | null>(null);

  // formgroup do forms login
  protected readonly loginForm = new FormGroup({
    identifier: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, identifierValidator],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordValidator],
    }),
  });

  // função submit para acionar o login()
  onSubmit(): void {
    this.erroApi.set(null); // limpa o signal() do erro da API
    const identifier = this.loginForm.get('identifier')?.getRawValue() ?? '';
    const password = this.loginForm.get('password')?.getRawValue() ?? '';

    this.auth.login(identifier, password).subscribe({
      next: (res) => console.log('Login feito com sucesso!'),
      error: (err: HttpErrorResponse) => {
        this.erroApi.set(err.error.message);
      },
    });
  }
}
