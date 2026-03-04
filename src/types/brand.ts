export interface BrandIdentity {
  id: string;
  unit_id: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  typography: {
    headings: string;
    body: string;
  };
  tone_of_voice: string;
  tagline: string;
  institutional_phrases: string[];
  created_at: string;
  updated_at: string;
}

export type BrandAssetType = 'logo' | 'product_photo' | 'environment' | 'menu' | 'manual' | 'reference';

export interface BrandAsset {
  id: string;
  unit_id: string;
  type: BrandAssetType;
  file_url: string;
  title: string;
  description: string;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type BrandReferenceType = 'strategy' | 'campaign_history' | 'visual_reference';

export interface BrandReference {
  id: string;
  unit_id: string;
  type: BrandReferenceType;
  title: string;
  content: string;
  media_urls: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}
