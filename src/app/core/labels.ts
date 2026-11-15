import { BusinessStage, Experience, Material } from './api.models';

export const STAGES: readonly { value: BusinessStage; label: string; hint: string }[] = [
  { value: 'IDEA', label: 'Есть идея', hint: 'Думаю, с чего начать' },
  { value: 'LAUNCH', label: 'Запускаю', hint: 'Первые клиенты и продажи' },
  { value: 'GROWTH', label: 'Развиваю', hint: 'Бизнес работает, хочу расти' },
  { value: 'SCALING', label: 'Масштабирую', hint: 'Команда, процессы, новые рынки' },
];

export const EXPERIENCE: readonly { value: Experience; label: string }[] = [
  { value: 'NONE', label: 'Нет опыта' },
  { value: 'BEGINNER', label: 'Начинающий' },
  { value: 'EXPERIENCED', label: 'Опытный' },
];

export const FORMATS: readonly { value: string; label: string }[] = [
  { value: 'ARTICLE', label: 'Статьи' },
  { value: 'VIDEO', label: 'Видео' },
  { value: 'COURSE', label: 'Курсы' },
  { value: 'WEBINAR', label: 'Вебинары' },
  { value: 'TEMPLATE', label: 'Шаблоны' },
  { value: 'CHECKLIST', label: 'Чек-листы' },
];

/** Suggestions for the sphere, after the lines of business in the case catalog. Any text is accepted. */
export const SPHERES: readonly string[] = [
  'Общепит (HoReCa)',
  'Розница',
  'Онлайн-торговля (ECom)',
  'Маркетплейсы',
  'Услуги',
  'Производство',
  'Оптовая торговля',
  'Строительство и недвижимость',
  'Транспорт и логистика',
  'B2B',
];

const NEXT_STEPS: Record<string, string> = {
  ARTICLE: 'Прочитайте и выпишите одну идею, которую примените на этой неделе',
  VIDEO: 'Посмотрите видео и запишите первый шаг для своего бизнеса',
  COURSE: 'Начните с первого модуля курса',
  WEBINAR: 'Посмотрите запись и запишите вопросы к своему бизнесу',
  TEMPLATE: 'Заполните шаблон для своего бизнеса',
  CHECKLIST: 'Пройдите чек-лист и отметьте, что уже сделано',
  PODCAST: 'Послушайте выпуск и запишите одну мысль для своего бизнеса',
};

const FORMAT_LABELS: Record<string, string> = {
  ARTICLE: 'Статья',
  VIDEO: 'Видео',
  COURSE: 'Курс',
  WEBINAR: 'Вебинар',
  TEMPLATE: 'Шаблон',
  CHECKLIST: 'Чек-лист',
  PODCAST: 'Подкаст',
  TEST: 'Тест',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Для начинающих',
  INTERMEDIATE: 'Средний уровень',
  ADVANCED: 'Продвинутый уровень',
};

export function formatLabel(format: string | null): string {
  return format ? (FORMAT_LABELS[format] ?? format) : '';
}

export function levelLabel(level: string | null): string {
  return level ? (LEVEL_LABELS[level] ?? level) : '';
}

/** The badge of a material that isn't free, or `null` for a free one. */
export function accessLabel(material: Pick<Material, 'paid' | 'access'>): string | null {
  if (material.access === 'SUBSCRIPTION') {
    return 'По подписке';
  }
  return material.access === 'PURCHASE' || material.paid ? 'Платный' : null;
}

/** A next step written from the format, as recommendation-service does for its baseline. */
export function nextStepFor(format: string | null): string {
  return (format && NEXT_STEPS[format]) || 'Откройте материал и начните с первого раздела';
}

export function durationLabel(minutes: number | null): string {
  if (!minutes || minutes <= 0) {
    return '';
  }
  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}
