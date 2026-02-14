export type MarketingPostStatus = 'draft' | 'scheduled' | 'published' | 'failed';
export type MarketingChannel = 'instagram' | 'whatsapp_status';

export interface MarketingPost {
  id: string;
  unit_id: string | null;
  user_id: string;
  title: string;
  caption: string;
  media_urls: string[];
  channels: MarketingChannel[];
  status: MarketingPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  tags: string[];
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type MarketingPostInsert = Omit<MarketingPost, 'id' | 'created_at' | 'updated_at'>;
export type MarketingPostUpdate = Partial<MarketingPostInsert> & { id: string };
