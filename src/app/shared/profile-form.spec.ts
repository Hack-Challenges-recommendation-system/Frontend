import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileUpdate } from '../core/api.models';
import { profileFixture } from '../testing/fixtures';
import { ProfileForm } from './profile-form';

describe('ProfileForm', () => {
  let fixture: ComponentFixture<ProfileForm>;
  let element: HTMLElement;
  let emitted: ProfileUpdate[];

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [ProfileForm] });
    fixture = TestBed.createComponent(ProfileForm);
    fixture.componentRef.setInput('profile', profileFixture);
    emitted = [];
    fixture.componentInstance.submitted.subscribe((update) => emitted.push(update));
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  /** With formControlName, `[value]` goes to the radio directive, not the DOM, so radios are found by their label. */
  function radio(label: string): HTMLInputElement {
    return [...element.querySelectorAll('label')]
      .find((candidate) => candidate.textContent?.includes(label))!
      .querySelector<HTMLInputElement>('input[type="radio"]')!;
  }

  function type(selector: string, value: string): void {
    const field = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  async function submit(): Promise<void> {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('starts from the saved answers', () => {
    expect(element.querySelector<HTMLInputElement>('#nickname')!.value).toBe('founder');
    expect(radio('Запускаю').checked).toBe(true);
  });

  it('emits the answers with the chosen formats', async () => {
    radio('Развиваю').click();
    type('#goal', '  выйти на маркетплейсы  ');
    const video = [...element.querySelectorAll<HTMLButtonElement>('button.chip')].find((chip) => chip.textContent?.includes('Видео'))!;
    video.click();

    await submit();

    expect(emitted).toEqual([
      {
        nickname: 'founder',
        businessStage: 'GROWTH',
        experience: 'NONE',
        businessSphere: 'Общепит',
        goal: 'выйти на маркетплейсы',
        preferredFormats: ['ARTICLE', 'VIDEO'],
      },
    ]);
  });

  it('turns skipped text answers into null', async () => {
    type('#goal', '   ');
    type('#sphere', '');

    await submit();

    expect(emitted[0].goal).toBeNull();
    expect(emitted[0].businessSphere).toBeNull();
  });

  it('does not emit without a valid nickname', async () => {
    type('#nickname', 'ab');

    await submit();

    expect(emitted).toEqual([]);
    expect(element.textContent).toContain('От 3 до 30 символов');
  });
});
