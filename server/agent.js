import { GoogleGenAI } from '@google/genai';
import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
dotenv.config();

export class SeraAgent {
  constructor(config = {}) {
    this.projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || 'sera-495721';
    this.location = config.location || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
    this.flashModel = config.flashModel || process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
    this.proModel = config.proModel || process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';

    // Initialize Google Gen AI in Vertex AI Mode for embeddings
    this.ai = new GoogleGenAI({
      vertexai: true,
      project: this.projectId,
      location: this.location
    });

    // Initialize Vertex AI SDK for generation content
    this.vertexAI = new VertexAI({ project: this.projectId, location: this.location });
    this.flashGenModel = this.vertexAI.getGenerativeModel({ model: this.flashModel });
    this.proGenModel = this.vertexAI.getGenerativeModel({ model: this.proModel });

    // Embedding cache Map<text, normalized_vector>
    this.embeddingCache = new Map();
  }

  /**
   * Generates and caches a normalized text embedding using text-embedding-005
   */
  async embedText(text) {
    if (!text || typeof text !== 'string') return new Array(768).fill(0);
    const cleanText = text.trim();
    if (this.embeddingCache.has(cleanText)) {
      return this.embeddingCache.get(cleanText);
    }

    try {
      const response = await this.ai.models.embedContent({
        model: 'text-embedding-005',
        contents: cleanText
      });

      const values = response.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        // Normalize the vector (l2-norm)
        let sumSq = 0;
        for (let i = 0; i < values.length; i++) {
          sumSq += values[i] * values[i];
        }
        const magnitude = Math.sqrt(sumSq);
        const normalized = magnitude > 0 ? values.map(v => v / magnitude) : values;

        this.embeddingCache.set(cleanText, normalized);
        return normalized;
      }
    } catch (err) {
      console.error('❌ SeraAgent embedText error:', err.message);
    }

    // Return zero vector fallback
    return new Array(768).fill(0);
  }

  /**
   * Decoupled reasoning loop representing the core cognition steps
   */
  async executeReasoningChain(params, callbacks = {}) {
    const { userInput, history = [], storeContext = {}, chatMode = 'plan', memoryContext = {} } = params;
    const { onCognition = () => {}, onAgentMessageStart = () => {} } = callbacks;

    // Step 1: Think (Intent Analysis)
    onCognition({
      agent: 'Orchestration Agent',
      status: 'PLANNING',
      phase: 'analysis',
      message: 'Analyzing commerce intent...'
    });

    // Check if it's a casual chat / greeting / simple date question
    const isGreeting = /^(hey|hi|halo|hello|hai|hei|yo|sup|hei sera|hi sera|hey sera|selamat pagi|selamat siang|selamat malam|pagi|siang|malam|apa kabar|gimana|how are you|what's up|wassup|hola)[?!.,\s]*$/i.test(userInput.trim());
    
    // Quick routing for greetings
    if (isGreeting) {
      const greetingReplies = {
        id: [
          'Hei! Ada yang bisa saya bantu hari ini? 😊',
          'Halo! Siap membantu kamu. Mau mulai dari mana?',
          'Hai! SERA siap. Mau buat toko baru atau ada yang perlu diubah?',
        ],
        en: [
          'Hey! What can I help you with today? 😊',
          'Hi there! Ready to help you build something great. What\'s on your mind?',
          'Hello! SERA is online and ready. Want to build a store or make some changes?',
        ]
      };
      const isIndo = /halo|hai|hei|pagi|siang|malam|apa kabar|gimana/i.test(userInput);
      const pool = isIndo ? greetingReplies.id : greetingReplies.en;
      const text = pool[Math.floor(Math.random() * pool.length)];
      return { text, action: 'idle', params: {} };
    }

    // Step 2: Plan (Retrieve memories and context)
    onCognition({
      agent: 'Orchestration Agent',
      status: 'PLANNING',
      phase: 'data_fetching',
      message: 'Querying database memory...'
    });

    // Run dynamic execution model routing
    const hasVerb = /\b(build|buil|biuld|create|make|buat|bikin|design|generate|ganti|ubah|tambah|edit|hapus|launch|publish|setup|add|remove|update|change|susun|lanjut|lanjutkan|kerjakan|gas|apply|proceed|mulai|go|jual|sell)\b/i.test(userInput);
    const hasEntity = /\b(store|shop|toko|produk|product|harga|price|tema|theme|warna|color|banner|hero|gambar|image|layout|skincare|coffee|coffe|cofe|sepatu|baju|plan|rencana|bisnis|business|butik|boutique|cafe|warung|restoran|restaurant|jual|sell|jualan|dagang|dagangan|market|pasar|konsep|concept|ide|idea|strategi|strategy|blueprint|proposal|katalog|catalog|item|barang|topik|topic|cilok|kuliner|food|minuman|beverage|snack|cemilan|platform|sera|mode|buyer|pembeli)\b/i.test(userInput);
    const isFollowUp = history.length > 0 && !/^(hey|hi|halo|hello|hai|hei|yo|sup|selamat pagi|selamat siang|selamat malam)[?!.,\s]*$/i.test(userInput.trim());
    const isTask = (hasVerb && hasEntity) || (userInput.length <= 20 && hasEntity) || isFollowUp;

    if (!isTask) {
      // Casual chat response using Flash model
      const systemPrompt = `Kamu adalah SERA, AI Commerce Strategist untuk platform SERA Commerce OS.
IDENTITAS:
- Kamu adalah konsultan bisnis senior yang bisa langsung eksekusi
- Selalu bicara dengan percaya diri dan berikan opini konkret
- Gunakan bahasa yang sama dengan user (Indonesia -> Indonesia, English -> English)
- Ingat dan gunakan SEMUA konteks dari conversation sebelumnya
RULES:
1. JANGAN tanya ulang info yang sudah dikasih user
2. JANGAN switch bahasa di tengah conversation  
3. JANGAN bilang "berikut proposal" kecuali UI sudah confirmed render
4. SELALU akhiri dengan satu pertanyaan tajam atau CTA yang spesifik
5. Berikan insight market yang relevan, bukan jawaban generic`;

      try {
        const result = await this.flashGenModel.generateContent({
          contents: this.buildModelContents(history, userInput),
          systemInstruction: { parts: [{ text: systemPrompt }] }
        });
        const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return { text: responseText.trim() || "I'm here to help you design and scale your store.", action: 'idle', params: {} };
      } catch (err) {
        console.error('❌ Casual chat generative error:', err.message);
        return { text: "I'm here to help you. Could you clarify your request?", action: 'idle', params: {} };
      }
    }

    // Step 3: Tool Use & Layout design
    onCognition({
      agent: 'Commerce Generation Agent',
      status: 'GENERATING',
      phase: 'layout_design',
      message: 'Designing storefront layout...'
    });

    const isApprove = /^(approve|lanjut|lanjutkan|kerjakan|gas|apply|proceed|mulai|go|ok|oke|siap|yes|yup|sikat|buatkan|bikin|bangun)$/i.test(userInput.trim());
    const isPlan = chatMode === 'plan';

    const systemPrompt = this.buildSystemPrompt(storeContext, memoryContext, chatMode);
    const modelToUse = isPlan ? this.flashGenModel : this.proGenModel;

    try {
      const modelResponse = await modelToUse.generateContent({
        contents: this.buildModelContents(history, userInput),
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: isPlan ? 0.7 : 0.2
        }
      });

      const rawText = modelResponse.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      let parsed = this.parseJsonSafely(rawText);

      // Stream the early agent thought message if present
      if (parsed.text) {
        onAgentMessageStart(parsed.text);
      }

      // Step 4: Execute & Reflect
      onCognition({
        agent: 'Validation Agent',
        status: 'VALIDATING',
        phase: 'validation',
        message: 'Validating commerce layout...'
      });

      // Auto repair if validation fails or structure is incomplete
      if (chatMode === 'agent' && (parsed.action === 'batch_create' || parsed.action === 'update_schema')) {
        const issues = this.validateStoreSchema(parsed);
        if (issues.length > 0) {
          console.warn('⚠️ Schema validation failed inside agent:', issues.join(', '));
          onCognition({
            agent: 'Validation Agent',
            status: 'VALIDATING',
            phase: 'validation_repair',
            message: 'Repairing storefront schema...'
          });

          const repairPrompt = `CRITICAL SCHEMA REPAIR NEEDED.
The previous response was structurally INVALID because: ${issues.join('; ')}.
You MUST respond again with a COMPLETE update_schema JSON that includes ALL 7 sections:
[hero, trust_bar, featured_products (min 6 products), philosophy (3 items), testimonials (3 quotes), faq (4 questions), footer].
Do NOT omit any section. Do NOT use placeholder "..." values. Return ONLY valid JSON.`;

          const repairedRes = await this.proGenModel.generateContent({
            contents: [...this.buildModelContents(history, userInput), { role: 'user', parts: [{ text: repairPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });

          const repairedRaw = repairedRes.response.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const repairedParsed = this.parseJsonSafely(repairedRaw);
          const recheck = this.validateStoreSchema(repairedParsed);
          if (recheck.length === 0) {
            parsed = repairedParsed;
          }
        }
      }

      return parsed;

    } catch (err) {
      console.error('❌ Task generation error:', err);
      return {
        text: 'An error occurred during layout design. Please try again.',
        action: 'idle',
        params: {}
      };
    }
  }

  buildModelContents(history, userInput) {
    const contents = [];
    // Convert history format to Gen AI SDK format
    for (const h of history) {
      contents.push({
        role: h.role === 'agent' ? 'model' : 'user',
        parts: [{ text: h.text }]
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });
    return contents;
  }

  parseJsonSafely(text) {
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch (e) {
      console.warn('⚠️ JSON parse failed for raw output:', text.substring(0, 100));
      return { text, action: 'idle', params: {} };
    }
  }

  validateStoreSchema(parsed) {
    const issues = [];
    const layout = parsed?.params?.schema?.layout || parsed?.schema?.layout || [];
    if (!Array.isArray(layout) || layout.length === 0) {
      issues.push('missing or empty layout array');
      return issues;
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

    return issues;
  }

  buildSystemPrompt(storeContext, memoryContext = {}, chatMode = 'plan') {
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
- **HONESTY ABOUT MEMORY**: You have access to the conversation history of the CURRENT session only. You DO NOT have access to past sessions or chats from earlier unless they are visible in your current conversation history. If asked about previous chats or past sessions, summarize ONLY what is available in your current conversation history. If the information is not in your current context, honestly state that you do not have access to previous sessions. NEVER claim to remember something if it is not in your current context.

== 🚨 MANDATORY EXECUTION RULES ==
1. **Complete Layout Always**: Every store build MUST include ALL 7 sections in this EXACT order: \`[hero, trust_bar, featured_products, philosophy, testimonials, faq, footer]\`. NEVER omit any section. NEVER reorder. A response missing any of these 7 is INVALID.
2. **Wipe the Past**: Immediately destroy mock data (skincare) when a new niche is requested.
3. **Full Inventory**: You MUST ALWAYS generate new products (min 6) for every new store building request. Never leave legacy products behind.
4. **Visual Imagination**: Generate high-end **heroImagePrompt** for cinematic photography. Generate **imagePrompt** for every product and every philosophy item.
5. **Absolute Autonomy**: Do not ask for permission. Do not say "would you like...". EXECUTE the vision.
6. **Standardized Variants**: \`variant: "centered"\` for hero, \`variant: "ticker"\` for trust_bar, \`variant: "grid"\` for featured_products, \`variant: "scroller"\` for philosophy, \`variant: "cards"\` for testimonials, \`variant: "accordion"\` for faq, \`variant: "default"\` for footer.
7. **Real Content Only**: testimonials[] must have 3 real authored quotes relevant to the niche. faq[] must have 4 real questions relevant to the niche. Never use placeholder "..." values in the final response.

== 🌳 COMPONENT REGISTRY ==
- **hero**: [variants: "centered", "split", "cinematic-fullscreen"]
- **trust_bar**: [variants: "ticker"]
- **featured_products**: [variants: "grid", "editorial-grid"]
- **philosophy**: [variants: "scroller"]
- **testimonials**: [variants: "cards"]
- **faq**: [variants: "accordion"]
- **footer**: [variants: "default"]

== 🎨 CREATIVE BLUEPRINTS ==
- **Luxury Fashion**: deep blacks, gold accents, serif typography. Cinematic product photography.
- **Minimalist Tech**: clean whitespace, high-contrast, monospace accents.
- **Artisanal/Cafe**: warm tones, handcrafted feel, story-first narrative in philosophy and faq.

== 🚨 RESPONSE SCHEMA (STRICT JSON ONLY — ALL 7 SECTIONS REQUIRED) ==
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

== 🎯 CORE PHILOSOPHY ==
${actionDesc}
- **No Passive Patching**: If the user asks for a new store, REDESIGN THE WHOLE TREE — all 7 sections.
- **No Truncation**: Never use "..." for actual content fields. Always generate complete, real content.

${storeInfo}`;
  }
}
