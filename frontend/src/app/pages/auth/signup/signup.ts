import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { TuiForm } from '@taiga-ui/layout';
import {
  TuiLabel,
  TuiTextfieldComponent,
  TuiInputDirective,
  TuiError,
  TuiButton,
} from '@taiga-ui/core';
import { RouterLink } from '@angular/router';
import { SignUpRequest } from '../../../core/models/user.model';
import { HttpErrorResponse } from '@angular/common/http';

// Validators manuais para email,
// senha e confirmação da senha
function usernameValidator(field: AbstractControl): ValidationErrors | null {
  const tamanho = field.value.length;
  return tamanho >= 3 && tamanho <= 30
    ? null
    : { usernameInvalido: 'Tamanho do nickname deve ser entre 3 e 30!' };
}

function passwordValidator(field: AbstractControl): ValidationErrors | null {
  const tamanho = field.value.length;
  return tamanho >= 8
    ? null
    : { passwordInvalido: 'Senha precisa ter 8 caractéres ou mais!' };
}

function confirmPasswordValidator(
  field: AbstractControl,
): ValidationErrors | null {
  const password = field.parent?.get('password')?.value;
  return field.value === password
    ? null
    : { passwordInvalido: 'As senhas precisam ser iguais!' };
}

@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    TuiForm,
    TuiTextfieldComponent,
    TuiLabel,
    TuiInputDirective,
    TuiError,
    TuiButton,
    RouterLink,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private readonly auth = inject(Auth);
  protected readonly erroApi = signal<string | null>(null);

  protected readonly signUpForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, usernameValidator],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, passwordValidator],
    }),
    confirmPassword: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, confirmPasswordValidator],
    }),
  });

  // submit do formulário para criação da conta
  onSubmit(): void {
    this.erroApi.set(null); // limpa o signal() do erro da API
    const username = this.signUpForm.get('username')?.getRawValue() ?? '';
    const email = this.signUpForm.get('email')?.getRawValue() ?? '';
    const password = this.signUpForm.get('password')?.getRawValue() ?? '';

    const data: SignUpRequest = {
      username,
      email,
      password,
    };

    this.auth.signUp(data).subscribe({
      next: (res) => console.log(`Sucesso ao criar a conta: ${res.ok}`),
      error: (err: HttpErrorResponse) => {
        this.erroApi.set(err.error.message);
      },
    });
  }
}
