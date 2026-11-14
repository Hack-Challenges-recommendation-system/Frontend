import { Material, Profile } from '../core/api.models';

export const materialFixture: Material = {
  id: 'm-1',
  title: 'Как найти первых клиентов',
  summary: 'Пошаговый план поиска первых покупателей',
  format: 'VIDEO',
  durationMinutes: 90,
  level: 'BEGINNER',
  topics: ['маркетинг'],
  businessStages: ['LAUNCH'],
  spheres: [],
  paid: false,
  url: 'https://example.com/materials/m-1',
};

export const profileFixture: Profile = {
  userId: '4b8e8c3e-5a8f-4e65-9d38-3a8f6d1d2f10',
  nickname: 'founder',
  businessStage: 'LAUNCH',
  businessSphere: 'Общепит',
  experience: 'NONE',
  goal: 'найти первых клиентов',
  preferredFormats: ['ARTICLE'],
  onboardingCompleted: true,
  updatedAt: '2026-11-14T10:00:00Z',
};
