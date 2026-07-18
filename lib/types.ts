// lib/types.ts
export interface User {
  id: string;
  email: string;
  name?: string | null;
}

export interface Thread {
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: number;
  threadId: number;
  role: 'user' | 'assistant';
  content: string;
  dataType: 'text' | 'recommendation' | 'upgrade_suggestion';
  recommendationId?: number | null;
  createdAt: Date;
}

export interface Component {
  id?: number;
  type: string;
  brand: string;
  model: string;
  price: number;
  currency: string;
  image_url?: string | null;
  source_url?: string | null;
  store_name?: string | null;
  reason?: string | null;
  // Upgrade-related properties
  is_upgrade?: boolean;
  current_component?: string | null;
  current_price?: number | null;
  price_difference?: number | null;
  price_difference_percent?: number | null;
}

export interface RecommendationData {
  type: 'recommendation' | 'upgrade_suggestion' | 'text';
  ai_message: string;
  query_analysis: any;
  components: Component[];
  multiple_recommendations?: Record<string, any>;
  budget_analysis?: any;
  build_info?: any;
  location?: any;
}