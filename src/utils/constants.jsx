import React from 'react';

export const sanitizePrompt = (p) => {
  if (!p) return "product";
  return String(p)
    .replace(/[']/g, "") // Remove single quotes
    .replace(/[^\w\s,.]/gi, "") // Allow commas and periods
    .replace(/\s+/g, " ")
    .trim();
};
export const NAV_ICONS = [
  {
    id: "studio", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
    )
  },
  {
    id: "stores", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
    )
  },
  {
    id: "analytics", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
    )
  },
  {
    id: "products", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
    )
  },
  {
    id: "promotions", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    )
  },
  {
    id: "settings", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    )
  },
  {
    id: "channels", icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
    )
  },
];
export const INITIAL_PRODUCTS = [
  { name: "Luna Glow Serum", desc: "Brightening & Hydrating", price: "$29.00", promo: "20% OFF", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Day Cream", desc: "Moisturizer & Nourish", price: "$32.00", imageUrl: "https://images.unsplash.com/photo-1608248593842-8d76d4948a33?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1608248593842-8d76d4948a33?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Gentle Cleanser", desc: "Daily Purifying Cleanser", price: "$18.00", imageUrl: "https://images.unsplash.com/photo-1556228720-1c2a01f52d59?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1556228720-1c2a01f52d59?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Face Mist", desc: "Hydrating & Refreshing", price: "$16.00", promo: "Buy 1 Get 1", imageUrl: "https://images.unsplash.com/photo-1570194065650-d60fd15d8689?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1570194065650-d60fd15d8689?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Eye Serum", desc: "Brightening & Anti-aging", price: "$38.00", imageUrl: "https://images.unsplash.com/photo-1563804447971-6e113ab80713?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1563804447971-6e113ab80713?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Toner", desc: "Balancing & Soothing", price: "$22.00", imageUrl: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna SPF 50", desc: "UV Protection Daily", price: "$27.00", imageUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7ceb4cb1?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1601049541289-9b1b7ceb4cb1?auto=format&fit=crop&w=500&q=80" },
  { name: "Luna Night Cream", desc: "Repair & Renewal", price: "$35.00", imageUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=500&q=80" },
];
export const INITIAL_PHILOSOPHY = [
  { label: "ORGANIC ESSENCE", sub: "Pure & Botanical", imageUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=500&q=80" },
  { label: "ETHICAL INTEGRITY", sub: "100% Cruelty Free", imageUrl: "https://images.unsplash.com/photo-1583088580009-2d947c3e90a6?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1583088580009-2d947c3e90a6?auto=format&fit=crop&w=500&q=80" },
  { label: "CLINICAL EXCELLENCE", sub: "Expertly Formulated", imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=500&q=80" },
  { label: "SUSTAINABLE FUTURE", sub: "Conscious Luxury", imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500&q=80", verifiedUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500&q=80" },
];
export const INIT_MESSAGES = [
  { role: "agent", text: "Hello I'm SERA, ready when you are.", action: "idle", hasAction: false }
];
export const CURATED_STORES = [];
export const TRENDING_PRODUCTS = [];
/** Actions that can mutate the store UI — used as allowlist so Gemini cannot turn on Approve/Reject with random action names. */
export const STORE_MUTATION_ACTIONS = new Set([
  "change_title", "change_subtitle", "change_collection", "change_button",
  "add_promo_banner", "remove_promo_banner", "add_product", "change_price",
  "change_product_promo", "change_product_image", "change_product_desc", "change_product_name",
  "remove_product",
  "change_theme_color", "change_hero_bg", "navigate", "update_philosophy", "change_store_cover", "change_philosophy_image",
  "batch_create", "show_plan", "sync_channels", "update_schema", "batch_update_prices", "generate_video"
]);
/** Map model action strings to our switch cases */
export function canonicalizeAgentAction(action) {
  if (!action || typeof action !== "string") return action;
  const a = action.trim();
  const map = {
    change_product_description: "change_product_desc",
    update_product_description: "change_product_desc",
    update_product_desc: "change_product_desc",
    rename_product: "change_product_name",
    change_product_title: "change_product_name",
    change_product_price: "change_price",
    update_price: "change_price",
  };
  return map[a] || a;
}
/** Map common model param shapes to what applyAction expects (Gemini often uses product/price vs productName/newPrice). */
export function normalizeAgentParams(action, raw) {
  if (!raw || typeof raw !== "object") return {};
  let p = { ...raw };
  // Handle 'data' or 'changes' aliases if they exist
  if (p.data && typeof p.data === 'object') {
    const { data, ...rest } = p;
    p = { ...rest, ...data };
  } else if (Array.isArray(p.changes)) {
    p.changes.forEach(c => {
      if (c.params) Object.assign(p, c.params);
      else Object.assign(p, c);
    });
  }
  const productScoped = new Set([
    "change_price", "change_product_promo", "change_product_image", "remove_product",
    "change_product_desc", "change_product_name", "batch_create", "show_plan", "update_schema"
  ]);
  if (!productScoped.has(action)) return p;
  const fromObj = (o) => (o && typeof o === "object" ? (o.name || o.title || o.productName) : null);
  const pn =
    p.productName ??
    p.product ??
    p.targetProduct ??
    fromObj(p.target) ??
    (typeof p.target === "string" ? p.target : null);
  if (pn != null && p.productName == null) p.productName = String(pn);
  if (action === "change_price") {
    if (p.newPrice == null && p.new_price != null) p.newPrice = p.new_price;
    if (p.newPrice == null && p.price != null) p.newPrice = p.price;
    if (p.newPrice != null) p.newPrice = String(p.newPrice);
  }
  if (action === "change_product_desc") {
    if (p.desc == null && p.description != null) p.desc = p.description;
    if (p.desc == null && p.newDescription != null) p.desc = p.newDescription;
  }
  if (action === "change_product_name") {
    if (p.newName == null && p.new_product_name != null) p.newName = p.new_product_name;
    if (p.newName == null && p.updatedName != null) p.newName = p.updatedName;
    if (p.newName == null && p.name != null && p.productName && String(p.name).toLowerCase() !== String(p.productName).toLowerCase()) {
      p.newName = String(p.name);
    }
  }
  if (action === "change_product_image") {
    const prompt = p.imagePrompt || p.image_prompt || p.prompt || (p.product && p.product.imagePrompt);
    if (prompt) p.imagePrompt = prompt;
  }
  if (action === "batch_create" || action === "show_plan" || action === "update_schema") {
    if (p.schema && Array.isArray(p.schema.layout)) {
      const hero = p.schema.layout.find(s => s.type === 'hero')?.props || {};
      const prods = p.schema.layout.find(s => s.type === 'featured_products')?.props?.products || [];
      const philo = p.schema.layout.find(s => s.type === 'philosophy')?.props?.items || [];
      p.title = hero.title || p.title;
      p.subtitle = hero.subtitle || p.subtitle;
      p.collection = hero.collection || p.collection;
      p.buttonText = hero.buttonText || p.buttonText;
      p.products = prods.length ? prods : p.products;
      p.philosophy = philo.length ? philo : p.philosophy;
      if (p.schema.theme) {
        p.themeColor = p.schema.theme.themeColor || p.themeColor;
        p.heroBg = p.schema.theme.heroBg || p.heroBg;
      }
    }
    const prods = p.products || p.inventory || p.items || p.data?.products;
    if (prods && Array.isArray(prods)) {
      const normalizeProduct = (item) => {
        const normalized = { ...item };
        const name = normalized.name || normalized.productName || normalized.product || normalized.title;
        if (name) normalized.name = String(name);
        return normalized;
      };
      p.products = prods.map(normalizeProduct);
    }
  }
  return p;
}
/**
 * True only when the model returned a real store mutation with enough payload to run applyAction meaningfully.
 * Prevents Approve/Reject lighting up on chit-chat (e.g. "hey") when Flash returns batch_create + {} or invented actions.
 */
export function isStoreMutationAction(action, rawParams) {
  if (!action || action === "idle" || !STORE_MUTATION_ACTIONS.has(action)) return false;
  const p = normalizeAgentParams(action, rawParams || {});
  if (action === "batch_create" || action === "show_plan" || action === "update_schema") {
    const hasProducts = Array.isArray(p.products) && p.products.length > 0;
    const hasPhilosophy = Array.isArray(p.philosophy) && p.philosophy.length > 0;
    const hasHero =
      !!(p.title || p.subtitle || p.collection || p.buttonText) ||
      (p.promoBanner !== undefined && p.promoBanner !== "") ||
      !!p.themeColor ||
      !!p.heroBg ||
      !!p.schema;
    return hasProducts || hasPhilosophy || hasHero;
  }
  if (action === "add_product") return !!p.name;
  if (action === "change_title") return !!p.title;
  if (action === "change_subtitle") return !!p.subtitle;
  if (action === "change_collection") return !!p.collection;
  if (action === "change_button") return !!p.buttonText;
  if (action === "add_promo_banner") return !!p.bannerText;
  if (action === "change_price") return !!(p.productName && p.newPrice);
  if (action === "change_product_promo") return !!p.productName;
  if (action === "change_product_image") return !!p.productName;
  if (action === "change_product_desc") return !!(p.productName && (p.desc || p.description));
  if (action === "change_product_name") return !!(p.productName && p.newName);
  if (action === "remove_product") return !!p.productName;
  if (action === "change_theme_color") return !!p.color;
  if (action === "change_hero_bg") return !!p.gradient;
  if (action === "navigate") return !!p.page;
  if (action === "update_philosophy") return Array.isArray(p.items) && p.items.length > 0;
  if (action === "sync_channels") return Array.isArray(p.channels) && p.channels.length > 0;
  if (action === "update_schema") return !!p.schema;
  if (action === "remove_promo_banner") return true;
  if (action === "change_store_cover") return !!(p.imagePrompt || p.imageUrl);
  if (action === "change_philosophy_image") return !!p.philosophyTitle;
  if (action === "batch_update_prices") return Array.isArray(p.updates) && p.updates.length > 0;
  if (action === "generate_video") return !!p.video_url || !!p.prompt;
  return false;
}
export const getStockCount = (name) => {
  if (!name) return 46;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i);
  return (hash % 45) + 12;
};
export const getStorePhilosophy = (store) => {
  if (!store) return INITIAL_PHILOSOPHY;
  const cat = store.category || "";
  if (cat.includes("Coffee")) {
    return [
      { label: "SINGLE ORIGIN", sub: "Ethically Sourced Beans", imageUrl: "" },
      { label: "PRECISION ROAST", sub: "Artisanal Temperature Control", imageUrl: "" },
      { label: "UNCOMPROMISING TASTE", sub: "Balanced & Complex Notes", imageUrl: "" },
      { label: "BARISTA CRAFT", sub: "Engineered for Perfection", imageUrl: "" }
    ];
  }
  if (cat.includes("Gadgets") || cat.includes("Tech")) {
    return [
      { label: "ALUMINUM UNIBODY", sub: "Aerospace-Grade Materials", imageUrl: "" },
      { label: "TACTILE PRECISION", sub: "Custom Mechanical Switches", imageUrl: "" },
      { label: "ERGONOMIC MASTERY", sub: "Designed for Flow State", imageUrl: "" },
      { label: "ELITE PERFORMANCE", sub: "Zero Latency Wireless", imageUrl: "" }
    ];
  }
  if (cat.includes("Lifestyle") || cat.includes("Urban")) {
    return [
      { label: "ARCHITECTURAL FORM", sub: "Timeless Minimalist Lines", imageUrl: "" },
      { label: "PURE MINIMALISM", sub: "Declutter Your Daily Rituals", imageUrl: "" },
      { label: "TACTILE MATERIALS", sub: "Matte Finishes & Natural Grains", imageUrl: "" },
      { label: "DAILY ELEGANCE", sub: "Elevate the Ordinary", imageUrl: "" }
    ];
  }
  return INITIAL_PHILOSOPHY;
};
/**
 * CENTRALIZED STORE THEME TOKENS
 * Renderer holds final authority over readable contrast and surfaces.
 */
export const storeThemeDark = {
  surface: {
    primary: "#111113",
    secondary: "#1a1a1e",
    card: "#161618",
    skeleton: "linear-gradient(90deg,#1a1a1e 25%,#252528 50%,#1a1a1e 75%)"
  },
  text: {
    primary: "#ffffff",
    secondary: "#ccc",
    muted: "#888"
  },
  border: {
    subtle: "#333338"
  }
};
export const storeThemeLight = {
  surface: {
    primary: "#ffffff",
    secondary: "#f9fafb",
    card: "#ffffff",
    skeleton: "linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)"
  },
  text: {
    primary: "#111827",
    secondary: "#4b5563",
    muted: "#9ca3af"
  },
  border: {
    subtle: "#e5e7eb"
  }
};


export const INITIAL_LUNA_SCHEMA = {
    metadata: {
      brand_identity: "Luna Skincare",
      objective: "Autonomous Commerce"
    },
    theme: {
      themeColor: "#c8b89a",
      heroBg: "linear-gradient(135deg, #111113 0%, #1a1a1e 100%)",
      isDarkMode: true,
      fontFamily: "'Playfair Display', serif"
    },
    layout: [
      {
        id: "init-hero",
        type: "hero",
        variant: "centered",
        props: {
          title: "LUNA",
          subtitle: "Advanced Botanical Skincare",
          collection: "Spring Curated Release",
          buttonText: "Explore Collection",
          promoBanner: "COMPLIMENTARY SHIPPING ON ALL ORDERS OVER $150",
          heroVariant: "centered",
          heroImage: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=1000&q=80"
        }
      },
      {
        id: "init-products",
        type: "featured_products",
        variant: "grid",
        props: {
          sectionTitle: "Curated Selection",
          products: INITIAL_PRODUCTS
        }
      },
      {
        id: "init-philosophy",
        type: "philosophy",
        variant: "scroller",
        props: {
          items: INITIAL_PHILOSOPHY
        }
      },
      {
        id: "init-footer",
        type: "footer",
        variant: "default",
        props: {}
      }
    ],
    testimonials: [],
    faq: [],
    footer: {
      about: "Powered by SERA AI Agent Commerce OS.",
      links: ["Shop All", "About Us", "Contact"]
    },
    heroStyles: { height: "500px", padding: "60px 40px", textAlign: "center" }
  };