import { TestBed } from '@angular/core/testing';
import { Button } from './button';

describe('Button', () => {
  it('uses a real button with button type by default', () => {
    const fixture = TestBed.createComponent(Button);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
    expect(button.disabled).toBe(false);
  });

  it('forwards submit type and disabled state', () => {
    const fixture = TestBed.createComponent(Button);
    fixture.componentRef.setInput('type', 'submit');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.type).toBe('submit');
    expect(button.disabled).toBe(true);
  });
});
