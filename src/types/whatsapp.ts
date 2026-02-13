export interface WhatsAppChannel {
  id: string;
  unit_id: string;
  phone_number: string;
  provider: string;
  api_url: string | null;
  api_key_ref: string | null;
  is_active: boolean;
  ai_personality: string | null;
  business_hours: Record<string, { open: string; close: string }> | null;
  fallback_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppContact {
  id: string;
  unit_id: string;
  phone: string;
  name: string | null;
  notes: string | null;
  total_orders: number;
  last_interaction_at: string | null;
  created_at: string;
}

export interface WhatsAppConversation {
  id: string;
  channel_id: string;
  contact_id: string;
  unit_id: string;
  status: 'ai_active' | 'human_active' | 'closed';
  assigned_to: string | null;
  ai_context: Record<string, unknown> | null;
  started_at: string;
  closed_at: string | null;
  created_at: string;
  // Joined data
  contact?: WhatsAppContact;
  channel?: WhatsAppChannel;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'customer' | 'ai' | 'human';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface WhatsAppOrder {
  id: string;
  conversation_id: string | null;
  contact_id: string;
  unit_id: string;
  items: WhatsAppOrderItem[];
  total: number;
  status: 'draft' | 'confirmed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: WhatsAppContact;
}

export interface WhatsAppOrderItem {
  product_id: string;
  name: string;
  qty: number;
  price: number;
}

export interface WhatsAppAILog {
  id: string;
  conversation_id: string | null;
  message_id: string | null;
  action: 'respond' | 'create_order' | 'escalate' | 'off_hours';
  reasoning: string | null;
  context_used: Record<string, unknown> | null;
  created_at: string;
}

export interface WhatsAppKnowledgeArticle {
  id: string;
  unit_id: string;
  title: string;
  content: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
