import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { materialFixture } from '../testing/fixtures';
import { MaterialCard } from './material-card';

@Component({ template: '' })
class MaterialPageStub {}

describe('MaterialCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaterialCard],
      providers: [provideRouter([{ path: 'materials/:id', component: MaterialPageStub }])],
    });
  });

  async function render(inputs: Record<string, unknown>): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(MaterialCard);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows the format, duration, reason and next step', async () => {
    const element = await render({ material: materialFixture, reason: 'Ваш этап — запуск', nextStep: 'Составьте список' });

    expect(element.textContent).toContain('Видео');
    expect(element.textContent).toContain('1 ч 30 мин');
    expect(element.textContent).toContain('Почему вам');
    expect(element.textContent).toContain('Следующий шаг');
    expect(element.querySelector('a')!.getAttribute('href')).toBe('/materials/m-1');
  });

  it('shows a paid material only as its benefit', async () => {
    const element = await render({ material: { ...materialFixture, paid: true, summary: 'Научитесь считать юнит-экономику' } });

    expect(element.querySelector('.badge-paid')?.textContent).toContain('Платный');
    expect(element.textContent).toContain('Что даст:');
  });

  it('reports that it was opened', async () => {
    const fixture = TestBed.createComponent(MaterialCard);
    fixture.componentRef.setInput('material', materialFixture);
    let opened = 0;
    fixture.componentInstance.opened.subscribe(() => opened++);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('a')!.click();
    await fixture.whenStable();

    expect(opened).toBe(1);
  });
});
