import { BusinessStage, Experience } from './api.models';

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

export const SPHERES: readonly string[] = [
  'Розничная торговля',
  'Онлайн-торговля',
  'Общепит',
  'Услуги',
  'IT',
  'Производство',
  'Образование',
  'Красота и здоровье',
];

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
