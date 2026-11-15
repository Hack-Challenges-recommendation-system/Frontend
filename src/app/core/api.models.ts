/** Shapes of the backend responses; see AGENTS.md of each service. */

export type BusinessStage = 'IDEA' | 'LAUNCH' | 'GROWTH' | 'SCALING';

export type Experience = 'NONE' | 'BEGINNER' | 'EXPERIENCED';

export interface Profile {
  userId: string;
  nickname: string;
  businessStage: BusinessStage | null;
  businessSphere: string | null;
  experience: Experience | null;
  goal: string | null;
  preferredFormats: string[];
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface ProfileUpdate {
  nickname: string;
  businessStage: BusinessStage | null;
  businessSphere: string | null;
  experience: Experience | null;
  goal: string | null;
  preferredFormats: string[];
}

/** `SUBSCRIPTION`: part of a subscription; `PURCHASE`: bought separately. */
export type Access = 'FREE' | 'SUBSCRIPTION' | 'PURCHASE';

/**
 * For a paid material `summary` is only a short benefit and `url` is the provided link.
 * `paid` is true for every material that isn't free; without `access`, a paid material is bought separately.
 */
export interface Material {
  id: string;
  title: string;
  summary: string | null;
  format: string | null;
  durationMinutes: number | null;
  level: string | null;
  topics: string[];
  businessStages: string[];
  spheres: string[];
  paid: boolean;
  access?: Access;
  url: string;
}

export interface MaterialSearchResult {
  material: Material;
  score: number;
}

export interface MaterialPage {
  items: Material[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type EventType = 'IMPRESSION' | 'CLICK' | 'START' | 'COMPLETE' | 'LIKE' | 'DISLIKE';

export type Reaction = 'LIKE' | 'DISLIKE';

export interface UserEvent {
  type: EventType;
  materialId: string;
  recommendationId?: string | null;
  variant?: string | null;
  position?: number | null;
  surface?: string | null;
}

export interface RecommendationItem {
  material: Material;
  reason: string;
  nextStep: string | null;
  position: number;
}

/**
 * `engine` is `baseline` when the list comes from topic matching instead of the LLM.
 * `orderExplanation` tells why the items go in this order: what to start with and what comes next.
 */
export interface RecommendationList {
  recommendationId: string;
  variant: string;
  engine: 'llm' | 'baseline';
  clarifyingQuestion: string | null;
  orderExplanation?: string | null;
  items: RecommendationItem[];
}
