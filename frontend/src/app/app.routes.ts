import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./modules/home/pages/home/home').then((module) => module.Home),
    title: 'Início | Miuly',
  },
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/pages/auth/auth').then((module) => module.Auth),
    data: { mode: 'login' },
    title: 'Entrar | Miuly',
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./modules/auth/pages/auth/auth').then((module) => module.Auth),
    data: { mode: 'register' },
    title: 'Criar conta | Miuly',
  },
  { path: '**', redirectTo: '' },
];
