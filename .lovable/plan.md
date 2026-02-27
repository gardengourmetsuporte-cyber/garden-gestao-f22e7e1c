

## Plan: Smart Marketing Ideas Generator

The current AI ideas generator is a simple prompt-in/suggestions-out tool. The user wants it to be contextually intelligent: it should pull data from the system (menu products, recipes, customers) to generate relevant suggestions, and each suggestion should include photo guidance.

### Architecture

**Backend (edge function)**: Before calling the AI, the edge function will query the database for contextual data from the unit: menu products (with prices, categories), recipes, and customer stats. This context is injected into the AI system prompt so suggestions are grounded in real business data.

**Frontend**: 
1. Replace the free-text prompt with smart "topic chips" (e.g., "Produto destaque", "Promoção", "Novidade do cardápio", "Data comemorativa") plus an optional custom prompt field
2. Pass `unit_id` to the edge function so it can fetch context
3. Expand the suggestion card to include a `photo_tip` field with guidance on what photo to take/use
4. Show existing product images when available, or display the photo tip

### Changes

#### 1. Edge function `marketing-suggestions/index.ts`
- Accept `unit_id` and `topic` alongside `prompt`
- Query `tablet_products` (top products with images, prices, categories), `recipes` (names, costs), and `customers` (count) from the database using the service role key
- Build a rich system prompt that includes: product names & prices, categories, recipe names, customer count
- Add `photo_tip` and `product_name` fields to the tool schema so the AI can reference specific products and suggest photos
- Add `has_image` boolean field so frontend knows if a product image exists

#### 2. Component `MarketingIdeasAI.tsx`
- Add topic chips at the top (quick-select buttons like "Produto em destaque", "Promoção da semana", "Novidade", "Engajamento")
- Clicking a chip auto-fills a smart prompt and triggers generation (no need to type)
- Keep the custom text area as secondary option ("Ou descreva seu tema")
- Pass `unit_id` from `useUnit()` to the edge function call
- Render expanded suggestion cards with:
  - Photo section: if product has an image, show it; otherwise show the `photo_tip` as a styled hint card
  - Product reference badge when suggestion is about a specific product
- Remove the old purple color from the button, use `bg-foreground text-background`

#### 3. Suggestion card structure (updated)
Each AI suggestion will return:
```
title, caption, hashtags, best_time, photo_tip, product_name (optional)
```

The `photo_tip` gives actionable guidance like "Fotografe o hambúrguer de cima com fundo escuro e iluminação lateral" or "Use uma foto do cliente satisfeito com o prato."

### Technical Details

- The edge function creates a Supabase client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (both already available in edge function environment) to query unit data
- Products query: `SELECT name, price, category, image_url, is_highlighted FROM tablet_products WHERE unit_id = $1 AND is_active = true LIMIT 30`
- Recipes query: `SELECT name, total_cost FROM recipes WHERE unit_id = $1 AND is_active = true LIMIT 20`
- Customer count: `SELECT count(*) FROM customers WHERE unit_id = $1`
- Context is truncated to keep under token limits
- The system prompt instructs the AI to reference actual product names/prices and give specific photo directions

