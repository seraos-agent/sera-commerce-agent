import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  initLocalDb,
  localInsert,
  localFind,
  localUpdate,
  localDelete
} from './dbHelper.js';


dotenv.config();

// Global memory caches and concurrency trackers for visual orchestration stability
const imagePromptCache = new Map();
const proxyImageCache = new Map(); // In-memory cache for proxied images
let globalActiveWorkers = 0;

// Health state monitoring
const healthState = {
  mongo: 'disconnected',
  mcp: 'offline',
  vertex: 'unknown'
};
const GLOBAL_MAX_CONCURRENCY = 6;

const UNSPLASH_KEYWORDS = [
  {
    keywords: ["coffee", "cafe", "espresso", "barista", "bean", "brew", "kettle", "mug", "latte", "cappuccino", "kopi"],
    urls: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["skincare", "beauty", "cosmetic", "cream", "serum", "cleanser", "toner", "spf", "sunscreen", "shampoo", "soap", "lotion", "spa", "mist", "eye serum", "moisturizer", "essence", "masker"],
    urls: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["dress", "gown", "gaun", "kebaya", "satin", "velvet", "silk", "boutique", "boutiq", "atelier", "tailor", "premium fashion", "luxury dress", "skirt", "model", "wedding", "party"],
    urls: [
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1550639525-c97d48521080?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1549064482-6779ba3292fe?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["bag", "tas", "handbag", "backpack", "wallet", "dompet", "watch", "jam", "jewelry", "necklace", "ring", "earrings", "gem", "gold", "silver", "perhiasan", "aksesoris"],
    urls: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["shoes", "sepatu", "sneaker", "boots", "heels", "sandal", "footwear"],
    urls: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["shirt", "tshirt", "pants", "jacket", "hoodie", "apparel", "clothing", "fashion", "denim", "cotton", "wear", "suit", "blazer", "baju", "celana", "kaos", "jaket"],
    urls: [
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1505022610485-0249ba5b3675?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["keyboard", "gadget", "mouse", "tech", "laptop", "monitor", "stand", "desk", "headphone", "earbud", "charger", "cable", "screen", "accessory", "electronics", "device"],
    urls: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["plant", "pot", "botanical", "leaf", "garden", "flower", "succulent", "cactus", "indoor", "herbs", "flora", "pottery", "tanaman", "bunga"],
    urls: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1520412099521-63be15b5c63e?auto=format&fit=crop&w=500&q=80"
    ]
  },
  {
    keywords: ["chair", "table", "furniture", "sofa", "lamp", "cushion", "decor", "interior", "living", "room", "home", "cabinet", "woodwork", "stool", "mebel"],
    urls: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=500&q=80"
    ]
  }
];

const findUnsplashMatch = (promptStr, dominantGroup = null, usedUrls = null) => {
  if (!promptStr) return null;
  const lower = promptStr.toLowerCase();

  const getUniqueUrl = (urls) => {
    let hash = 0;
    for (let i = 0; i < lower.length; i++) {
      hash = lower.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseIndex = Math.abs(hash) % urls.length;
    if (!usedUrls) return urls[baseIndex];

    for (let attempt = 0; attempt < urls.length; attempt++) {
      const url = urls[(baseIndex + attempt) % urls.length];
      const urlKey = url.split('?')[0];
      if (!usedUrls.has(urlKey)) {
        usedUrls.add(urlKey);
        return url;
      }
    }
    return urls[baseIndex];
  };

  for (const group of UNSPLASH_KEYWORDS) {
    for (const kw of group.keywords) {
      if (lower.includes(kw)) {
        return getUniqueUrl(group.urls);
      }
    }
  }
  if (dominantGroup) {
    return getUniqueUrl(dominantGroup.urls);
  }
  return null;
};

const getDominantCategory = (params) => {
  if (!params) return null;
  let text = "";
  if (params.title) text += " " + params.title;
  if (params.subtitle) text += " " + params.subtitle;
  if (params.heroImagePrompt) text += " " + params.heroImagePrompt;

  const products = params.products || [];
  products.forEach(p => {
    if (p.name) text += " " + p.name;
    if (p.imagePrompt) text += " " + p.imagePrompt;
  });

  if (params.schema?.layout) {
    params.schema.layout.forEach(sec => {
      if (sec.type === "hero" && sec.props) {
        if (sec.props.title) text += " " + sec.props.title;
        if (sec.props.subtitle) text += " " + sec.props.subtitle;
        if (sec.props.heroImagePrompt) text += " " + sec.props.heroImagePrompt;
      }
      if (sec.type === "featured_products" && sec.props?.products) {
        sec.props.products.forEach(p => {
          if (p.name) text += " " + p.name;
          if (p.imagePrompt) text += " " + p.imagePrompt;
        });
      }
      if (sec.type === "philosophy" && sec.props?.items) {
        sec.props.items.forEach(item => {
          if (item.label) text += " " + item.label;
          if (item.sub) text += " " + item.sub;
          if (item.imagePrompt) text += " " + item.imagePrompt;
        });
      }
    });
  }

  const lower = text.toLowerCase();
  let bestGroup = null;
  let maxCount = 0;

  for (const group of UNSPLASH_KEYWORDS) {
    let count = 0;
    for (const kw of group.keywords) {
      const matches = lower.match(new RegExp(kw, 'g'));
      if (matches) count += matches.length;
    }
    if (count > maxCount) {
      maxCount = count;
      bestGroup = group;
    }
  }
  return bestGroup;
};

const acquireGlobalSlot = async () => {
  while (globalActiveWorkers >= GLOBAL_MAX_CONCURRENCY) {
    await new Promise(r => setTimeout(r, 100)); // check again in 100ms
  }
  globalActiveWorkers++;
};

const app = express();
app.use(express.json());
app.use(cors());

// --- IMAGE PROXY (Bypass domain blocking with Enhanced Retry & Fallback logic) ---
app.get('/api/proxy-image', async (req, res) => {
  const rawUrl = req.query.url;
  if (!rawUrl) return res.status(400).send('URL is required');

  // Keep nologo=true and add enhance=false to turn off LLM prompt expansion for 3x faster generation
  const imageUrl = rawUrl.includes('enhance=') ? rawUrl : (rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'enhance=false');

  // Return from in-memory cache if available
  const cached = proxyImageCache.get(imageUrl);
  if (cached) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return res.send(cached.buffer);
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  const fetchWithRetry = async (url, retries = 5) => {
    try {
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
      const response = await fetch(url, {
        headers: { 'User-Agent': randomUA },
        signal: AbortSignal.timeout(8000) // 8s timeout per attempt to prevent 60s hanging
      });

      if (!response.ok) {
        // Retry on almost any non-success except client errors like 400/401
        if (retries > 0 && response.status !== 400 && response.status !== 401) {
          const waitTime = (6 - retries) * 2000; // Progressive wait: 2s, 4s, 6s...
          console.log(`Ã¢Å¡Â Ã¯Â¸Â Proxy failed (${response.status}). Retrying in ${waitTime / 1000}s... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return fetchWithRetry(url, retries - 1);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        const waitTime = (6 - retries) * 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return fetchWithRetry(url, retries - 1);
      }
      throw err;
    }
  };

  try {
    const response = await fetchWithRetry(imageUrl);
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    const bufferObj = Buffer.from(buffer);

    // Save to cache
    proxyImageCache.set(imageUrl, { contentType, buffer: bufferObj });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(bufferObj);
  } catch (error) {
    console.error('Ã¢ÂÅ’ Proxy error after 5 retries, serving fallback image:', error.message);
    // Serve a beautiful SVG fallback image buffer
    const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#1a1a1a"/>
      <circle cx="200" cy="150" r="50" fill="#333333"/>
      <path d="M165 150 L190 125 L210 145 L235 120 L235 180 L165 180 Z" fill="#4d4d4d"/>
      <text x="50%" y="260" font-family="sans-serif" font-size="18" fill="#888888" dominant-baseline="middle" text-anchor="middle">Asset Temporarily Unavailable</text>
      <text x="50%" y="290" font-family="sans-serif" font-size="14" fill="#555555" dominant-baseline="middle" text-anchor="middle">SERA Commerce OS Ã¢â‚¬Â¢ Fallback Render</text>
    </svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).send(svgFallback);
  }
});

const port = process.env.PORT || 3001;

// --- COMMERCE CONFIG ---
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'sera-495721';


// Helper to parse base64 data URI
function parseDataUri(dataUri) {
  const matches = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return null;
}



/** Same shape check as UI: show_plan must carry a real storefront proposal, not empty {} */
function hasFullStoreProposalParams(p) {
  if (!p || typeof p !== 'object') return false;

  let products = p.products || p.inventory || p.items || p.data?.products;

  if (p.schema && Array.isArray(p.schema.layout)) {
    const featuredSec = p.schema.layout.find(s => s.type === 'featured_products');
    if (featuredSec?.props?.products && Array.isArray(featuredSec.props.products)) {
      products = featuredSec.props.products;
    }
  }

  const hasProducts = Array.isArray(products) && products.length > 0;
  // For a full store build/proposal, products are MANDATORY.
  return hasProducts;
}

/** User clearly asked to execute / confirm (Indonesian + English). */
function userConfirmedExecution(input) {
  if (!input || typeof input !== 'string') return false;
  const s = input.toLowerCase();
  const needles = [
    'oke kerjakan', 'ok kerjakan', 'kerjakan', 'silakan kerjakan', 'silahkan kerjakan',
    'gas', 'lanjut', 'terapkan', 'setuju', 'silakan', 'silahkan', 'ya buat', 'ya, buat',
    'apply', 'build it', 'execute', 'proceed', 'yes', 'ok go', 'mulai', 'langsung saja',
    'go ahead', 'do it', 'sudah oke', 'sip lanjut', 'oke buatkan plan', 'buatkan plan', 'oke buatkan',
    'buat plan', 'susun plan', 'lanjutkan', 'iya lanjutkan', 'lanjutkan dengan topik', 'topik yang lama',
    'oke buat plan', 'buatkan rencana',
  ];
  return needles.some((n) => s.includes(n));
}

/** User is asking to create / build a shop (not pure Q&A like "apakah saya punya toko?"). */
function userAskedNewStoreBuild(input) {
  if (!input || typeof input !== 'string') return false;
  const s = input.toLowerCase().trim();
  // Filter out pure greetings or small chit-chat
  if (/^(hey|hai|halo|hi|hello|yo|test)\b/.test(s) && s.length < 24) return false;
  // Filter out pure Q&A about current status if it doesn't mention building
  if (/^(apakah|apa|berapa|how|what|do i|have i)\b/i.test(s) && !/\b(buat(kan)?|bangun|buka|rancang|desain|tambah|ganti|setup|set up)\b/i.test(s)) return false;

  // Look for build/create verbs combined with shop/store nouns or niche names
  const buildVerbs = /\b(buat(kan)?|bangun|buka|rancang|desain|setup|set up|bikin|create|build|buil|biuld|setup)\b/i;
  const shopNouns = /\b(toko|store|shop|brand|bisnis|commerce|katalog|catalog|produk|item|barang|kopi|coffee|coffe|cofe|cafe|skincare|sepatu|shoes|fashion|pakaian|baju|jewelry|perhiasan)\b/i;

  return (buildVerbs.test(s) && shopNouns.test(s)) || /\b(create|build|buil|biuld|set up|make me)\b.*\b(shop|store|storefront|brand|cafe|coffee|coffe|cofe)\b/i.test(s);
}

function isEffectiveBatchCreate(parsed) {
  const action = parsed?.action;
  return (action === 'batch_create' || action === 'show_plan') && hasFullStoreProposalParams(parsed.params);
}

/** Check if the request is a "task" (build, edit, sync) vs simple Q&A/greeting. */
function isTaskIntent(userInput) {
  return userAskedNewStoreBuild(userInput) || userConfirmedExecution(userInput);
}

/**
 * Validates that a parsed update_schema response has a structurally complete layout.
 * Returns { valid: boolean, issues: string[] }
 */
function validateStoreSchema(parsed) {
  const issues = [];

  if (parsed.action !== 'update_schema') return { valid: true, issues }; // Only validate update_schema

  const layout = parsed.params?.schema?.layout;
  if (!Array.isArray(layout) || layout.length === 0) {
    issues.push('layout is missing or empty');
    return { valid: false, issues };
  }

  const REQUIRED = ['hero', 'featured_products', 'footer'];
  for (const req of REQUIRED) {
    if (!layout.find(s => s.type === req)) issues.push(`missing required section: ${req}`);
  }

  const productSec = layout.find(s => s.type === 'featured_products');
  const products = productSec?.props?.products;
  if (!Array.isArray(products) || products.length === 0) {
    issues.push('featured_products has no products array');
  } else if (products.some(p => !p.name)) {
    issues.push('one or more products missing "name" field');
  }

  const heroSec = layout.find(s => s.type === 'hero');
  if (!heroSec?.props?.title) issues.push('hero section missing title');

  return { valid: issues.length === 0, issues };
}

// Build dynamic system prompt with the new "AI Commerce Architect" Cognitive Architecture
function buildSystemPrompt(storeContext, memoryContext = {}, chatMode = 'plan') {
  const hasProducts = storeContext && Array.isArray(storeContext.products) && storeContext.products.length > 0;
  const storeInfo = hasProducts
    ? `\n\n=== [CURRENT STOREFRONT STATE] ===\n${JSON.stringify(storeContext, null, 2)}\n=== END STATE ===`
    : '\n\n=== [STOREFRONT STATE]: Empty Canvas ===';

  const defaultAction = chatMode === 'agent' ? 'update_schema' : 'show_plan';
  const actionDesc = chatMode === 'agent'
    ? '- **Schema-First**: Use "update_schema" for ALL new store builds. It is your most powerful tool.'
    : '- **Plan-First**: Use "show_plan" for ALL new store proposals. NEVER use update_schema or batch_create in plan mode.';

  return `Kamu adalah SERA, AI Commerce ${chatMode === 'agent' ? 'Executor & Architect' : 'Strategist'} untuk platform SERA Commerce OS.

IDENTITAS:
- Kamu adalah konsultan bisnis senior yang bisa langsung eksekusi
- Selalu bicara dengan percaya diri dan berikan opini konkret
- Gunakan bahasa yang sama dengan user (Indonesia -> Indonesia, English -> English)
- Ingat dan gunakan SEMUA konteks dari conversation sebelumnya

RULES:
1. JANGAN tanya ulang info yang sudah dikasih user
2. JANGAN switch bahasa di tengah conversation  
3. JANGAN bilang "berikut proposal" kecuali UI sudah confirmed render
4. ${chatMode === 'agent' ? 'JANGAN bertanya atau meminta konfirmasi. Langsung eksekusi pembuatan/perubahan toko!' : 'SELALU akhiri dengan satu pertanyaan tajam atau CTA yang spesifik'}
5. Berikan insight market yang relevan, bukan jawaban generic

BEHAVIOR RULES:
- Current Mode: ${chatMode}
- **HONESTY ABOUT MEMORY**: You have access to the conversation history of the CURRENT session only. You DO NOT have access to past sessions or chats from earlier unless they are visible in your current conversation history. If asked about previous chats or past sessions, summarize ONLY what is available in your current conversation history. If the information is not in your current history, honestly state that you do not have access to previous sessions. NEVER claim to remember something if it is not in your current context.

== Ã°Å¸Å¡Â¨ MANDATORY EXECUTION RULES ==
1. **Complete Layout Always**: Every store build MUST include ALL 7 sections in this EXACT order: \`[hero, trust_bar, featured_products, philosophy, testimonials, faq, footer]\`. NEVER omit any section. NEVER reorder. A response missing any of these 7 is INVALID.
2. **Wipe the Past**: Immediately destroy mock data (skincare) when a new niche is requested.
3. **Full Inventory**: You MUST ALWAYS generate new products (min 6) for every new store building request. Never leave legacy products behind.
4. **Visual Imagination**: Generate high-end **heroImagePrompt** for cinematic photography. Generate **imagePrompt** for every product and every philosophy item.
5. **Absolute Autonomy**: Do not ask for permission. Do not say "would you like...". EXECUTE the vision.
6. **Standardized Variants**: \`variant: "centered"\` for hero, \`variant: "ticker"\` for trust_bar, \`variant: "grid"\` for featured_products, \`variant: "scroller"\` for philosophy, \`variant: "cards"\` for testimonials, \`variant: "accordion"\` for faq, \`variant: "default"\` for footer.
7. **Real Content Only**: testimonials[] must have 3 real authored quotes relevant to the niche. faq[] must have 4 real questions relevant to the niche. Never use placeholder "..." values in the final response.
== Ã°Å¸Å’Â³ COMPONENT REGISTRY ==
- **hero**: [variants: "centered", "split", "cinematic-fullscreen"]
- **trust_bar**: [variants: "ticker"]
- **featured_products**: [variants: "grid", "editorial-grid"]
- **philosophy**: [variants: "scroller"]
- **testimonials**: [variants: "cards"] Ã¢â‚¬â€ props.testimonials: [{quote, author, title, rating}]
- **faq**: [variants: "accordion"] Ã¢â‚¬â€ props.faq: [{q, a}]
- **footer**: [variants: "default"]

== Ã°Å¸Å½Â¨ CREATIVE BLUEPRINTS ==
- **Luxury Fashion**: deep blacks, gold accents, serif typography. Cinematic product photography.
- **Minimalist Tech**: clean whitespace, high-contrast, monospace accents.
- **Artisanal/Cafe**: warm tones, handcrafted feel, story-first narrative in philosophy and faq.

== Ã°Å¸Å¡Â¨ RESPONSE SCHEMA (STRICT JSON ONLY Ã¢â‚¬â€ ALL 7 SECTIONS REQUIRED) ==
{
  "text": "Creative Director reasoning.",
  "action": "${defaultAction}",
  "params": {
    "schema": {
      "layout": [
        { "id": "h1", "type": "hero", "variant": "centered", "props": { "title": "BRAND NAME", "subtitle": "Brand tagline.", "collection": "Collection label", "buttonText": "Shop Now", "heroImagePrompt": "cinematic brand lifestyle photography, studio quality" } },
        { "id": "t1", "type": "trust_bar", "variant": "ticker", "props": {} },
        { "id": "p1", "type": "featured_products", "variant": "grid", "props": { "products": [ { "name": "Product Name", "price": "$XX", "desc": "Short description.", "promo": "New", "imagePrompt": "cinematic product shot on minimal background" } ] } },
        { "id": "ph1", "type": "philosophy", "variant": "scroller", "props": { "items": [ { "label": "PILLAR", "sub": "One sentence brand philosophy.", "imagePrompt": "cinematic photo representing this brand value" } ] } },
        { "id": "ts1", "type": "testimonials", "variant": "cards", "props": { "testimonials": [ { "quote": "Real review from a satisfied customer.", "author": "Full Name", "title": "Verified Buyer", "rating": 5 } ] } },
        { "id": "fq1", "type": "faq", "variant": "accordion", "props": { "faq": [ { "q": "A real question customers ask about this niche.", "a": "A detailed, helpful answer." } ] } },
        { "id": "f1", "type": "footer", "variant": "default", "props": { "about": "Powered by SERA AI Agent Commerce OS.", "links": ["Shop All", "About Us", "Contact"] } }
      ],
      "theme": { "themeColor": "#hexcolor", "heroBg": "linear-gradient(...)" }
    }
  }
}

== Ã°Å¸Å½Â¯ CORE PHILOSOPHY ==
${actionDesc}
- **No Passive Patching**: If the user asks for a new store, REDESIGN THE WHOLE TREE Ã¢â‚¬â€ all 7 sections.
- **No Truncation**: Never use "..." for actual content fields. Always generate complete, real content.

${storeInfo}`;
}



// --- INFRASTRUCTURE HEALTH STATE ---

async function testMongoConnection(uri) {
  const { MongoClient } = await import('mongodb');
  console.log("🩺 Running Hard Health Check on MongoDB Atlas...");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    healthState.mongo = 'connected';
    console.log("✅ [Health Check] MongoDB Atlas is CONNECTED.");
  } catch (err) {
    healthState.mongo = 'failed';
    console.error("❌ [Health Check] MongoDB Atlas unavailable:", err.message);
    console.warn("⚠️ System will run in degraded mode using Local JSON Fallback.");
  } finally {
    await client.close();
  }
}

// --- MCP CLIENT ---
let mcpClient = null;
let mcpTools = [];

async function setupMCP() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sera';

  // Hard Health Check First
  await testMongoConnection(mongoUri);

  try {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', 'mongodb-mcp-server', mongoUri],
      env: { ...process.env, MONGODB_CONNECTION_STRING: mongoUri }
    });
    mcpClient = new Client({ name: 'sera-backend-client', version: '1.0.0' }, { capabilities: {} });
    await mcpClient.connect(transport);
    console.log(`✅ Connected to MongoDB MCP Server`);
    const toolsResponse = await mcpClient.listTools();
    mcpTools = toolsResponse.tools || [];
    console.log(`✅ Loaded ${mcpTools.length} tools from MongoDB MCP`);

    // If MCP connects but Mongo is failed, MCP is connected but Degraded
    healthState.mcp = healthState.mongo === 'connected' ? 'healthy' : 'degraded (fallback active)';
  } catch (error) {
    healthState.mcp = 'failed';
    console.error('❌ Failed to connect to MCP Server:', error.message);
  }
}

setupMCP();

// --- API ENDPOINTS ---
app.get('/api/health', (req, res) => {
  res.json(healthState);
});

// --- MEMORY HELPERS (via MCP) ---
async function storeMemory(collection, document) {
  try {
    await callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
      collection,
      document: { ...document, timestamp: new Date().toISOString() }
    });
    console.log(`Ã°Å¸Â§Â  Memory Stored: ${collection}`);
  } catch (err) {
    console.error(`Ã¢ÂÅ’ Failed to store memory:`, err.message);
  }
}

async function getRecentMemory(collection, limit = 5) {
  try {
    const response = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection,
      limit,
      sort: { timestamp: -1 }
    });
    return response.documents || response.result || [];
  } catch (err) {
    console.error(`Ã¢ÂÅ’ Failed to retrieve memory:`, err.message);
    return [];
  }
}

// --- ADDITIONAL MONGODB SETUP & GUEST SESSION (SERA HACKATHON) ---

function runLocalMock(possibleNames, args) {
  const collection = args?.collection || 'system';
  const isFind = possibleNames.some(n => n.includes('find') || n.includes('get'));
  const isInsert = possibleNames.some(n => n.includes('insert') || n.includes('create'));
  const isUpdate = possibleNames.some(n => n.includes('update'));
  const isDelete = possibleNames.some(n => n.includes('delete'));

  try {
    if (isInsert) {
      return localInsert(collection, args.document);
    }
    if (isFind) {
      return localFind(collection, args.filter || args.query, args.limit);
    }
    if (isUpdate) {
      return localUpdate(collection, args.filter || args.query, args.update);
    }
    if (isDelete) {
      return localDelete(collection, args.filter || args.query);
    }
  } catch (err) {
    console.error(`Ã¢ÂÅ’ Local Mock execution error on [${collection}]:`, err.message);
  }
  return { success: true };
}

// 1. Flexible MCP Execution Helper
async function callFlexibleMcpTool(possibleNames, args) {
  const collection = args?.collection || 'system';

  if (!mcpClient) {
    console.warn(`Ã¢Å¡Â Ã¯Â¸Â [MongoDB MCP Offline] Falling back to Local DB for action on collection [${collection}]`);
    return runLocalMock(possibleNames, args);
  }

  // Find available tool in mcpTools
  let targetTool = null;
  for (const name of possibleNames) {
    if (mcpTools.some(t => t.name === name)) {
      targetTool = name;
      break;
    }
  }

  // Fallback to first possible name if not found in mcpTools (tools might still be loading)
  if (!targetTool) {
    // If not found, try to see if there's an "-many" variant like insert-many
    if (mcpTools.some(t => t.name === 'insert-many') && possibleNames.includes('insert_document')) targetTool = 'insert-many';
    else if (mcpTools.some(t => t.name === 'update-many') && possibleNames.includes('update_document')) targetTool = 'update-many';
    else if (mcpTools.some(t => t.name === 'delete-many') && possibleNames.includes('delete_document')) targetTool = 'delete-many';
    else targetTool = possibleNames[0];
  }

  // Transform args if tool requires it
  if (targetTool === 'insert-many' && args.document) {
    args.documents = [args.document];
    delete args.document;
  }
  if ((targetTool === 'update-many' || targetTool === 'delete-many') && args.filter) {
    // Usually no change needed for filter, but good to ensure
  }

  try {
    console.log(`⚡ [MongoDB MCP Execution] Tool: "${targetTool}" | Collection: "${collection}"`);
    const mcpArgs = { database: 'sera', ...args };
    const result = await mcpClient.callTool({
      name: targetTool,
      arguments: mcpArgs
    });
    if (result.isError) {
      throw new Error(result.content?.[0]?.text || "MCP tool returned an error");
    }
    console.log(`✅ [MongoDB MCP Success] Action on "${collection}" completed.`);

    // Parse untrusted user data if present (mongodb-mcp-server returns stringified JSON)
    if (result.content && Array.isArray(result.content)) {
      for (const block of result.content) {
        if (block.type === 'text' && block.text) {
          const match = block.text.match(/<untrusted-user-data-[^>]+>\s*(\[\{.*?\}\]|\{.*?\})\s*<\/untrusted-user-data-[^>]+>/s);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              result.documents = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              console.warn("Failed to parse untrusted JSON data:", e.message);
            }
          } else if (block.text.trim().startsWith('[') || block.text.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(block.text);
              result.documents = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) { }
          } else {
             console.log("UNPARSED MCP TEXT:", block.text);
          }
        }
      }
    }
    return result;
  } catch (err) {
    console.warn(`⚠️ [MongoDB MCP Error] Tool call [${targetTool}] failed on collection [${collection}]: ${err.message}. Failing over to Local DB...`);
    return runLocalMock(possibleNames, args);
  }
}


// 2. Setup MongoDB Collections & Indexes
async function setupCollections() {
  // Wait until mcpClient and mcpTools are available (max 30 seconds to prevent infinite loop)
  let attempts = 0;
  while ((!mcpClient || mcpTools.length === 0) && attempts < 60) {
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  if (!mcpClient) {
    console.error("Ã¢ÂÅ’ setupCollections: MCP Client failed to connect within timeout.");
    return;
  }

  console.log("Ã°Å¸â€œÂ¦ Starting MongoDB collections & index setup...");

  const collections = ['stores', 'products', 'analytics', 'campaigns'];
  for (const col of collections) {
    try {
      await callFlexibleMcpTool(['create_collection', 'create-collection', 'createCollection'], { collection: col });
      console.log(`Ã¢Å“â€¦ Collection ensured: ${col}`);
    } catch (e) {
      // Ignore error if collection already exists
    }
  }

  // Setup Indexes
  const indexSpecs = [
    { collection: 'stores', keys: { session_id: 1, store_id: 1 } },
    { collection: 'products', keys: { store_id: 1 } },
    { collection: 'analytics', keys: { store_id: 1, product_id: 1, flag: 1 } },
    { collection: 'campaigns', keys: { store_id: 1, product_id: 1, status: 1 } }
  ];

  for (const spec of indexSpecs) {
    try {
      await callFlexibleMcpTool(['create_index', 'create-index', 'createIndex'], {
        collection: spec.collection,
        keys: spec.keys,
        indexSpec: spec.keys // fallback arg name
      });
      console.log(`Ã¢Å“â€¦ Index ensured for: ${spec.collection}`);
    } catch (e) {
      // Ignore error if index already exists or is not supported
    }
  }
}

setupCollections();

// 3. Helper to Add Guest Session Fields
function addGuestSessionFields(doc, sessionId = 'guest_default', type = 'guest') {
  const now = new Date();
  const expiresAt = type === 'guest' ? new Date(now.getTime() + 24 * 3600 * 1000) : null;
  return {
    ...doc,
    session_id: sessionId,
    type: type,
    created_at: now,
    expires_at: expiresAt
  };
}

app.get('/api/debug-mcp', async (req, res) => {
  try {
    if (!mcpClient) return res.status(500).json({ error: "MCP not connected" });
    const dbs = await mcpClient.callTool({ name: 'list-databases', arguments: {} });
    res.json({ dbs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: GET /api/health
app.get('/api/health', (req, res) => {
  return res.json(healthState);
});

// Async Generate Embeddings in Background
async function generateEmbeddingsInBackground(productsDocs) {
  console.log(`Ã¢ÂÂ³ [Background Embedding] Initiating for ${productsDocs.length} products...`);
  for (const doc of productsDocs) {
    try {
      const textToEmbed = `${doc.name || ''} ${doc.desc || doc.description || ''} ${doc.category || ''}`;
      console.log(`Ã¢ÂÂ³ [Background Embedding] Generating vector for: "${doc.name}"`);
      const normalizedVector = await agent.embedText(textToEmbed);

      const embeddingDoc = {
        product_id: doc.product_id,
        store_id: doc.store_id,
        embedding: normalizedVector,
        timestamp: new Date().toISOString()
      };

      await callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
        collection: 'embeddings',
        document: embeddingDoc
      });
      console.log(`Ã¢Å“â€¦ [Background Embedding] Saved vector for: "${doc.name}"`);
    } catch (err) {
      console.error(`Ã¢ÂÅ’ [Background Embedding Error] Product "${doc.name}":`, err.message);
    }
  }
}

// 4. API Endpoint: POST /api/publish
app.post('/api/publish', async (req, res) => {
  const { session_id, type, store_id, store_name, category, branding, products } = req.body;
  if (!store_name || !Array.isArray(products)) {
    return res.status(400).json({ success: false, error: "store_name and products array are required" });
  }

  // Fallback: If products array is empty, mock at least 1 product so Analytics Data generates successfully
  if (products.length === 0) {
    products.push({ id: "mock_1", name: "Featured Item", price: "$29.99", stock: 100, status: "active" });
  }

  const sId = session_id || 'guest_default';
  const sType = type || 'guest';
  const storeId = store_id || `store_${Date.now()}`;

  // Step 1 & 2: Create store document
  const storeDoc = addGuestSessionFields({
    store_id: storeId,
    store_name,
    category: category || 'default',
    branding: branding || {},
    status: 'active'
  }, sId, sType);

  // Category profiles for Metrics Generator
  const CATEGORY_PROFILES = {
    skincare: { avg_views: [200, 600], avg_ctr: 0.18, avg_conversion: 0.035 },
    kopi: { avg_views: [300, 800], avg_ctr: 0.22, avg_conversion: 0.065 },
    fashion: { avg_views: [400, 1200], avg_ctr: 0.28, avg_conversion: 0.025 },
    makanan: { avg_views: [250, 700], avg_ctr: 0.24, avg_conversion: 0.080 },
    default: { avg_views: [200, 500], avg_ctr: 0.18, avg_conversion: 0.040 }
  };

  const profile = CATEGORY_PROFILES[category ? category.toLowerCase() : 'default'] || CATEGORY_PROFILES.default;
  const totalProds = products.length;

  const productsDocs = [];
  const analyticsDocs = [];

  products.forEach((prod, index) => {
    const prodId = `prod_${Date.now()}_${index}`;

    // Step 3: Add fields to product
    const prodDoc = addGuestSessionFields({
      ...prod,
      product_id: prodId,
      store_id: storeId,
      stock: prod.stock !== undefined ? prod.stock : 100,
      status: prod.status || 'active'
    }, sId, sType);
    productsDocs.push(prodDoc);

    // Step 4: Metrics Generator
    // avg_views range
    const minViews = profile.avg_views[0];
    const maxViews = profile.avg_views[1];
    const baseViews = minViews + Math.random() * (maxViews - minViews);
    const viewsVariance = 0.7 + Math.random() * 0.6; // Ã‚Â±30% variance (0.7 to 1.3)
    const views = Math.floor(baseViews * viewsVariance);

    const ctrVariance = 0.7 + Math.random() * 0.6;
    const ctr = profile.avg_ctr * ctrVariance;

    const convVariance = 0.7 + Math.random() * 0.6;
    const conversion_rate = profile.avg_conversion * convVariance;

    const clicks = Math.floor(views * ctr);
    const purchased = Math.floor(views * conversion_rate);
    const numericPrice = typeof prod.price === 'string' ? parseFloat(prod.price.replace(/[^0-9.-]+/g,"")) : (prod.price || 0);
    const revenue_30d = purchased * (numericPrice || 0);

    // Trend determination (30% rising, 30% stable, 40% declining)
    let trend = 'declining';
    const ratio = index / (totalProds || 1);
    if (ratio < 0.3) trend = 'rising';
    else if (ratio < 0.6) trend = 'stable';

    // Flag based on conversion_rate
    let flag = 'healthy';
    if (conversion_rate < 0.02) flag = 'critical';
    else if (conversion_rate < profile.avg_conversion * 0.7) flag = 'needs_boost';

    // Performance score (0-100)
    const ctr_score = Math.min((ctr / 0.3) * 40, 40);
    const conv_score = Math.min((conversion_rate / 0.08) * 40, 40);
    const trend_bonus = trend === 'rising' ? 20 : (trend === 'stable' ? 10 : 0);
    const performance_score = Math.round(ctr_score + conv_score + trend_bonus);

    // Weekly trend (4 weeks)
    const weekly_revenue = [];
    for (let w = 0; w < 4; w++) {
      let multiplier = 1.0;
      if (trend === 'rising') {
        multiplier = 0.6 + (w * 0.15);
      } else if (trend === 'stable') {
        multiplier = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
      } else if (trend === 'declining') {
        multiplier = 1.1 - (w * 0.12);
      }
      weekly_revenue.push(Math.round(revenue_30d * multiplier));
    }

    // Generate Rich Analytics Data for Hackathon Judges (MCP & MongoDB showcase)
    const traffic_sources = [
      { source: "Instagram Ads", percentage: Math.floor(20 + Math.random() * 30) },
      { source: "TikTok", percentage: Math.floor(10 + Math.random() * 40) },
      { source: "Organic Search", percentage: Math.floor(5 + Math.random() * 20) }
    ];
    
    const top_demographic = ["Gen Z (18-24)", "Millennials (25-34)", "Gen X (35-44)"][Math.floor(Math.random() * 3)];
    const mobile_usage = Math.floor(60 + Math.random() * 30); // 60% to 90% mobile

    const analyticDoc = addGuestSessionFields({
      store_id: storeId,
      product_id: prodId,
      product_name: prod.name || `Product ${index + 1}`,
      views,
      ctr,
      conversion_rate,
      clicks,
      purchased,
      revenue_30d,
      trend,
      flag,
      performance_score,
      weekly_revenue,
      insights: {
        traffic_sources,
        top_demographic,
        device_split: { mobile: mobile_usage, desktop: 100 - mobile_usage }
      }
    }, sId, sType);

    analyticsDocs.push(analyticDoc);
  });

  // Step 5: Save to MongoDB via MCP
  try {
    await callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
      collection: 'stores',
      document: storeDoc
    });

    const productPromises = productsDocs.map(pDoc =>
      callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
        collection: 'products',
        document: pDoc
      })
    );

    const analyticsPromises = analyticsDocs.map(aDoc =>
      callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
        collection: 'analytics',
        document: aDoc
      })
    );

    await Promise.all([...productPromises, ...analyticsPromises]);

    // Trigger async background embedding generation
    generateEmbeddingsInBackground(productsDocs).catch(err => {
      console.error("Ã¢ÂÅ’ Background embedding generation failed:", err.message);
    });

    // Step 6: Return response
    return res.json({
      success: true,
      store_id: storeId,
      store_name,
      product_count: productsDocs.length,
      analytics_generated: true,
      message: "Store published successfully"
    });
  } catch (err) {
    console.error("Ã¢ÂÅ’ POST /api/publish error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


app.post('/api/search-products', async (req, res) => {
  const { query, limit = 6 } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: "query is required" });
  }

  try {
    // Generate text embedding using Python ADK Service
    let queryVector = new Array(768).fill(0);
    try {
      const embedRes = await fetch("http://localhost:8000/api/agent/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query })
      });
      if (embedRes.ok) {
        const embedData = await embedRes.json();
        if (embedData.success && Array.isArray(embedData.embedding)) {
          queryVector = embedData.embedding;
        }
      }
    } catch (err) {
      console.error("Ã¢ÂÅ’ Error fetching embedding from Python ADK service:", err.message);
    }


    // Retrieve all products
    const productsRes = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection: 'products',
      filter: {}
    });
    const products = productsRes.documents || productsRes.result || [];

    // Retrieve all product embeddings
    const embeddingsRes = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection: 'embeddings',
      filter: {}
    });
    const embeddings = embeddingsRes.documents || embeddingsRes.result || [];

    // Map of product_id -> embedding values
    const embeddingMap = new Map();
    for (const emb of embeddings) {
      if (emb.product_id && Array.isArray(emb.embedding)) {
        embeddingMap.set(emb.product_id, emb.embedding);
      }
    }

    // Helper: calculate dot product
    const dotProduct = (vecA, vecB) => {
      if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
      let sum = 0;
      for (let i = 0; i < vecA.length; i++) sum += vecA[i] * vecB[i];
      return sum;
    };

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Calculate score and add matching explanation for each product
    const scoredProducts = products.map(p => {
      const pEmb = embeddingMap.get(p.product_id);

      // 1. Semantic Similarity
      const semanticScore = pEmb ? dotProduct(queryVector, pEmb) : 0.5; // fallback to mid value if no embedding exists yet

      // 2. Keyword Match
      let keywordScore = 0;
      const textToMatch = `${p.name || ''} ${p.desc || p.description || ''} ${p.category || ''}`.toLowerCase();
      if (queryWords.length > 0) {
        let matches = 0;
        for (const word of queryWords) {
          if (textToMatch.includes(word)) matches++;
        }
        keywordScore = matches / queryWords.length;
      }

      // 3. Product Rating (0 to 1 range, default 4.5/5 -> 0.9)
      const ratingVal = parseFloat(p.rating) || 4.5;
      const ratingScore = ratingVal / 5.0;

      // 4. Hybrid Scoring Formula
      const score = (0.7 * semanticScore) + (0.2 * keywordScore) + (0.1 * ratingScore);

      // Create explanation
      const explanation = [];
      if (semanticScore > 0.6) {
        explanation.push(`matches style preference (${Math.round(semanticScore * 100)}% match)`);
      }
      const matched = queryWords.filter(w => textToMatch.includes(w));
      if (matched.length > 0) {
        explanation.push(`contains keywords: ${matched.join(', ')}`);
      }
      if (ratingVal >= 4.7) {
        explanation.push(`highly rated (${ratingVal}/5)`);
      }

      return {
        ...p,
        score,
        semanticScore,
        keywordScore,
        searchExplanation: explanation.join(', ') || 'relevancy match'
      };
    });

    // Sort by hybrid score in descending order
    scoredProducts.sort((a, b) => b.score - a.score);

    // Slice to limit
    const results = scoredProducts.slice(0, limit);

    // REAL-TIME BUYER TRACKING: Increment views for the top results to reflect actual Buyer Mode interest
    if (results.length > 0) {
      // Run asynchronously so it doesn't block the search response
      Promise.all(results.map(async (r) => {
        try {
          const analyticsDocs = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
            collection: 'analytics',
            filter: { product_id: r.product_id }
          });
          const docs = analyticsDocs.documents || analyticsDocs.result || [];
          if (docs.length > 0) {
            const currentViews = docs[0].views || 0;
            const currentClicks = docs[0].clicks || 0;
            
            // Simulasikan interaksi: +1 views, +1 click jika relevansi sangat tinggi
            const incViews = 1;
            const incClicks = r.score > 0.75 ? 1 : 0;
            
            await callFlexibleMcpTool(['update_document', 'update-one', 'updateOne'], {
              collection: 'analytics',
              filter: { product_id: r.product_id },
              update: { $set: { views: currentViews + incViews, clicks: currentClicks + incClicks } }
            });
          }
        } catch(e) {
          console.error("Failed to track buyer search event:", e.message);
        }
      })).catch(() => {});
    }

    return res.json({
      success: true,
      query,
      results
    });

  } catch (err) {
    console.error("Ã¢ÂÅ’ POST /api/search-products error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// 5. API Endpoint: GET /api/analytics
app.get('/api/analytics', async (req, res) => {

  const { store_id } = req.query;
  if (!store_id) {
    return res.status(400).json({ success: false, error: "store_id is required" });
  }

  try {
    const response = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection: 'analytics',
      filter: { store_id },
      query: { store_id } // fallback arg name
    });

    const analytics = response?.documents || response?.result || response?.data || [];
    
    console.log("ANALYTICS DOCS REVENUE:", analytics.map(a => ({ name: a.name, price: a.price, revenue_30d: a.revenue_30d })));
    
    const total_products = analytics.length;
    const healthy = analytics.filter(a => a.flag === 'healthy').length;
    const needs_boost = analytics.filter(a => a.flag === 'needs_boost').length;
    const critical = analytics.filter(a => a.flag === 'critical').length;
    const total_revenue = analytics.reduce((sum, a) => sum + (a.revenue_30d || 0), 0);
    
    console.log("CALCULATED TOTAL REVENUE:", total_revenue);
    
    const avg_conversion = total_products > 0
      ? analytics.reduce((sum, a) => sum + (a.conversion_rate || 0), 0) / total_products
      : 0;

    // Sort performance_score ASC
    const sortedProducts = [...analytics].sort((a, b) => (a.performance_score || 0) - (b.performance_score || 0));

    return res.json({
      success: true,
      summary: {
        total_products,
        healthy,
        needs_boost,
        critical,
        total_revenue,
        avg_conversion
      },
      products: sortedProducts
    });
  } catch (err) {
    console.error("Ã¢ÂÅ’ GET /api/analytics error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. API Endpoint: GET /api/stores
app.get('/api/stores', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ success: false, error: "session_id is required" });
  }

  try {
    const filter = session_id === 'all' ? { status: 'active' } : { session_id };
    const query = session_id === 'all' ? { status: 'active' } : { session_id };

    console.log("SESSION ID:", session_id);
    console.log("MARKETPLACE MODE:", session_id === 'all');

    const response = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection: 'stores',
      filter: filter,
      query: query
    });

    const storesList = response?.documents || response?.result || response?.data || [];
    console.log("STORE COUNT:", storesList.length);

    return res.json({
      success: true,
      stores: storesList
    });
  } catch (err) {
    console.error("Ã¢ÂÅ’ GET /api/stores error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6b. API Endpoint: GET /api/products
app.get('/api/products', async (req, res) => {
  const { store_id } = req.query;
  try {
    const filter = store_id ? { store_id } : {};
    const query = filter;

    const response = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
      collection: 'products',
      filter: filter,
      query: query
    });

    const productsList = response?.documents || response?.result || response?.data || [];
    return res.json({
      success: true,
      products: productsList
    });
  } catch (err) {
    console.error(" GET /api/products error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. API Endpoint: POST /api/campaigns
app.post('/api/campaigns', async (req, res) => {
  const { store_id, session_id, campaigns } = req.body;
  if (!store_id || !Array.isArray(campaigns)) {
    return res.status(400).json({ success: false, error: "store_id and campaigns array are required" });
  }

  const sId = session_id || 'guest_default';

  try {
    const campaignPromises = campaigns.map(camp => {
      const campDoc = addGuestSessionFields({
        ...camp,
        campaign_id: camp.campaign_id || `camp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        store_id,
        status: camp.status || 'draft'
      }, sId, camp.type || 'guest');

      return callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
        collection: 'campaigns',
        document: campDoc
      });
    });

    await Promise.all(campaignPromises);

    return res.json({ success: true, saved: campaigns.length });
  } catch (err) {
    console.error("Ã¢ÂÅ’ POST /api/campaigns error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. API Endpoint: PATCH /api/campaigns/activate
app.patch('/api/campaigns/activate', async (req, res) => {
  const { campaign_id } = req.body;
  if (!campaign_id) {
    return res.status(400).json({ success: false, error: "campaign_id is required" });
  }

  try {
    // Attempt to use update_document / update-one
    let updateSuccess = false;
    try {
      await callFlexibleMcpTool(['update_document', 'update_one', 'update-one', 'updateOne'], {
        collection: 'campaigns',
        filter: { campaign_id },
        query: { campaign_id },
        update: { $set: { status: 'active' } }
      });
      updateSuccess = true;
    } catch (updateErr) {
      console.warn("Ã¢Å¡Â Ã¯Â¸Â update_document not supported or failed, falling back to replace/insert logic...");
    }

    if (!updateSuccess) {
      // Fallback: Find existing document
      const findRes = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
        collection: 'campaigns',
        filter: { campaign_id },
        query: { campaign_id }
      });

      const existingDocs = findRes?.documents || findRes?.result || findRes?.data || [];
      if (existingDocs.length > 0) {
        const oldDoc = existingDocs[0];

        // Attempt to delete old document first to prevent duplication
        let deleteSuccess = false;
        try {
          await callFlexibleMcpTool(['delete_document', 'delete_one', 'delete-one', 'deleteOne'], {
            collection: 'campaigns',
            filter: { _id: oldDoc._id },
            query: { _id: oldDoc._id }
          });
          deleteSuccess = true;
        } catch (delErr) {
          console.warn("Ã¢Å¡Â Ã¯Â¸Â delete_document failed during fallback, marking old doc as superseded...");
        }

        if (!deleteSuccess) {
          // If delete fails, mark old document with superseded: true (attempt update)
          try {
            await callFlexibleMcpTool(['update_document', 'update_one', 'update-one', 'updateOne'], {
              collection: 'campaigns',
              filter: { _id: oldDoc._id },
              query: { _id: oldDoc._id },
              update: { $set: { superseded: true } }
            });
          } catch (supErr) {
            // Ignore if update is not supported at all
          }
        }

        // Insert new document with active status
        const newDoc = { ...oldDoc, status: 'active' };
        delete newDoc._id; // Remove _id so MongoDB generates a new one

        await callFlexibleMcpTool(['insert_document', 'insert-one', 'insertOne'], {
          collection: 'campaigns',
          document: newDoc
        });
      } else {
        return res.status(404).json({ success: false, error: "Campaign not found" });
      }
    }

    return res.json({ success: true, message: "Campaign activated successfully" });
  } catch (err) {
    console.error("Ã¢ÂÅ’ PATCH /api/campaigns/activate error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Auto-Cleanup Guest Data
async function cleanupExpiredGuests() {
  if (!mcpClient) return;
  console.log("Ã°Å¸Â§Â¹ Running auto-cleanup for expired guest data...");

  const collections = ['stores', 'products', 'analytics', 'campaigns'];
  const now = new Date();

  for (const col of collections) {
    try {
      // Attempt to use delete_many / delete-many
      await callFlexibleMcpTool(['delete_document', 'delete_many', 'delete-many', 'deleteMany'], {
        collection: col,
        filter: { type: 'guest', expires_at: { $lt: now } },
        query: { type: 'guest', expires_at: { $lt: now } }
      });
      console.log(`Ã¢Å“â€¦ Cleanup completed for collection: ${col}`);
    } catch (err) {
      // Fallback: find_documents then delete_one per document
      try {
        const findRes = await callFlexibleMcpTool(['find_documents', 'find', 'findDocuments'], {
          collection: col,
          filter: { type: 'guest', expires_at: { $lt: now } },
          query: { type: 'guest', expires_at: { $lt: now } }
        });
        let expiredDocs = findRes?.documents || findRes?.result || findRes?.data || [];

        // Fallback manual JavaScript filter if MCP does not support $lt operator and returns all documents
        expiredDocs = expiredDocs.filter(doc => doc.type === 'guest' && doc.expires_at && new Date(doc.expires_at) < now);

        for (const doc of expiredDocs) {
          if (doc._id) {
            await callFlexibleMcpTool(['delete_document', 'delete_one', 'delete-one', 'deleteOne'], {
              collection: col,
              filter: { _id: doc._id },
              query: { _id: doc._id }
            });
          }
        }
        console.log(`Ã¢Å“â€¦ Fallback cleanup completed for collection: ${col} (${expiredDocs.length} docs removed)`);
      } catch (fallbackErr) {
        console.warn(`Ã¢Å¡Â Ã¯Â¸Â Cleanup fallback warning for ${col}:`, fallbackErr.message);
      }
    }
  }
}

// Run auto-cleanup 5 seconds after server start, then every 6 hours
setTimeout(() => {
  cleanupExpiredGuests();
  setInterval(cleanupExpiredGuests, 6 * 3600 * 1000);
}, 5000);

// 10. API Endpoint: POST /api/guest/session
app.post('/api/guest/session', (req, res) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000);
  const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  return res.json({
    success: true,
    session_id: sessionId,
    type: "guest",
    created_at: now,
    expires_at: expiresAt
  });
});

// --- API ENDPOINTS ---


// --- CENTRALIZED EXECUTION TRUTH SYSTEM (In-Memory Tracking) ---
const executionTasks = new Map();

app.post('/api/execute-task', async (req, res) => {
  const { action, prompt, taskId, itemId } = req.body;
  if (!action || !prompt) return res.status(400).json({ status: "failed", error: "Missing action or prompt" });

  const maxRetries = 3;
  let attempt = 0;
  let lastError = "Unknown error";
  let httpStatus = 500;

  const uniqueSalt = Math.floor(Math.random() * 1000000);
  const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${uniqueSalt}&model=turbo`;

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  while (attempt <= maxRetries) {
    try {
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt

      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': randomUA },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      httpStatus = response.status;

      if (response.ok) {
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > 1000) { // Verify asset existence & validity
          const result = {
            action,
            status: "success",
            asset_created: true,
            http_status: httpStatus,
            retry_count: attempt,
            url: targetUrl,
            proxy_url: `http://localhost:${port}/api/proxy-image?url=${encodeURIComponent(targetUrl)}`,
            itemId
          };

          if (taskId && executionTasks.has(taskId)) {
            const task = executionTasks.get(taskId);
            task.completed += 1;
            task.pending = Math.max(0, task.pending - 1);
            task.results.push(result);
            executionTasks.set(taskId, task);
          }

          return res.json(result);
        } else {
          throw new Error("Received empty or invalid image buffer");
        }
      } else {
        throw new Error(`HTTP Error ${httpStatus}`);
      }
    } catch (err) {
      lastError = err.message;
      attempt++;
      if (attempt <= maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Ã¢Å¡Â Ã¯Â¸Â Task [${action}] failed (${lastError}). Retrying in ${backoffMs / 1000}s... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }
  }

  console.error(`Ã¢ÂÅ’ Task [${action}] reached final failure state after ${maxRetries} retries: ${lastError}`);
  const failureResult = {
    action,
    status: "failed",
    asset_created: false,
    http_status: httpStatus,
    retry_count: maxRetries,
    error: lastError,
    itemId
  };

  if (taskId && executionTasks.has(taskId)) {
    const task = executionTasks.get(taskId);
    task.failed += 1;
    task.pending = Math.max(0, task.pending - 1);
    task.results.push(failureResult);
    executionTasks.set(taskId, task);
  }

  return res.json(failureResult);
});

// Ã¢â€â‚¬Ã¢â€â‚¬ /api/chat Ã¢â€â‚¬Ã¢â€â‚¬ Transparent streaming proxy Ã¢â€ â€™ Python ADK service (port 8000)
const ADK_SERVICE_URL = process.env.ADK_SERVICE_URL || 'http://localhost:8000';

app.post('/api/chat', async (req, res) => {
  const { input, history = [], storeContext = {}, images = [], chatMode = 'plan' } = req.body;
  console.log(`Ã°Å¸â€™Â¬ [PROXYÃ¢â€ â€™ADK] chatMode=${chatMode} | input="${(input || '').substring(0, 50)}"`);

  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    const adkRes = await fetch(`${ADK_SERVICE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, history, storeContext, chatMode, images })
    });

    if (!adkRes.ok || !adkRes.body) {
      const errText = await adkRes.text().catch(() => 'Unknown error');
      console.error('Ã¢ÂÅ’ ADK service error:', errText);
      res.write(JSON.stringify({ type: 'final', text: 'AI service unavailable. Please try again.', action: 'idle', params: {} }) + '\n');
      return res.end();
    }

    // Stream NDJSON chunks from Python ADK directly to the browser
    const reader = adkRes.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    console.error('Ã¢ÂÅ’ Proxy error /api/chat:', err.message);
    res.write(JSON.stringify({ type: 'final', text: `Proxy error: ${err.message}`, action: 'idle', params: {} }) + '\n');
    res.end();
  }
});

app.post('/api/remember', async (req, res) => {
  const { action, status, details } = req.body;
  await storeMemory('actions', { action, status, details });
  // AI personality summarisation is now delegated to Python ADK service
  res.json({ success: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', mcpConnected: !!mcpClient, project: PROJECT_ID, adkServiceUrl: ADK_SERVICE_URL });
});

app.get('/', (req, res) => {
  res.json({
    name: "SERA AI Commerce OS Backend",
    version: "1.0.0",
    status: "online",
    mcp_server: "mongodb-mcp-server",
    message: "Welcome to SERA AI Commerce OS API Server. All systems operational.",
    endpoints: {
      guest: "POST /api/guest/session",
      publish: "POST /api/publish",
      stores: "GET /api/stores",
      analytics: "GET /api/analytics",
      campaigns_create: "POST /api/campaigns",
      campaigns_activate: "PATCH /api/campaigns/activate",
      chat: "POST /api/chat",
      remember: "POST /api/remember",
      health: "GET /health"
    }
  });
});

app.listen(port, () => {
  console.log(`\n=========================================`);
  console.log(`Ã°Å¸Å¡â‚¬ SERA Backend listening at http://localhost:${port}`);
  console.log(`=========================================\n`);
});
