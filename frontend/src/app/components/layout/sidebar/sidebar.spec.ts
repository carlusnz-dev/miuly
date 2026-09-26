import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  it('shows planned domains as disabled buttons with icons', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Sidebar);
    fixture.detectChanges();
    const buttons = [
      ...fixture.nativeElement.querySelectorAll('nav button'),
    ] as HTMLButtonElement[];
    expect(buttons).toHaveLength(8);
    expect(buttons.every((button) => button.disabled && !!button.querySelector('svg'))).toBe(true);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Início',
      'Tarefas',
      'Finanças',
      'Calendário',
      'Notificações',
      'Atividade',
      'Configurações',
      'Perfil',
    ]);
  });
});
