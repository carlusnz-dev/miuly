import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { useSession } from '../../session';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  private readonly builder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  readonly mode = inject(ActivatedRoute).snapshot.data['mode'] as 'login' | 'register';
  readonly session = useSession();
  readonly pending = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginForm = this.builder.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.maxLength(128)]],
  });

  readonly registerForm = this.builder.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    username: ['', [Validators.required, Validators.pattern(/^\s*[a-z0-9_]{3,30}\s*$/i)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  async submit(): Promise<void> {
    if (this.pending()) return;
    if (this.mode === 'login') {
      this.loginForm.controls.email.setValue(
        this.loginForm.controls.email.value.trim().toLowerCase(),
      );
    } else {
      this.registerForm.patchValue({
        name: this.registerForm.controls.name.value.trim(),
        email: this.registerForm.controls.email.value.trim().toLowerCase(),
        username: this.registerForm.controls.username.value.trim().toLowerCase(),
      });
    }
    const form = this.mode === 'login' ? this.loginForm : this.registerForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);
    try {
      if (this.mode === 'login') {
        const input = this.loginForm.getRawValue();
        await this.session.login({
          email: input.email.trim().toLowerCase(),
          password: input.password,
        });
      } else {
        const input = this.registerForm.getRawValue();
        await this.session.register({
          name: input.name.trim(),
          email: input.email.trim().toLowerCase(),
          username: input.username.trim().toLowerCase(),
          password: input.password,
        });
      }
      await this.router.navigateByUrl('/');
    } catch (error) {
      const response = error instanceof HttpErrorResponse ? error.error : null;
      this.errorMessage.set(
        typeof response?.message === 'string'
          ? response.message
          : 'Não foi possível continuar. Tente novamente.',
      );
    } finally {
      this.pending.set(false);
    }
  }
}
