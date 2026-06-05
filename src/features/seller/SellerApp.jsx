import { useState, useRef, useEffect, useMemo } from "react";
import { StoreProvider, useStore } from '../../store/storeContext';

import confetti from "canvas-confetti";
import SeraAgentMessage from "../../SeraAgentMessage";
import { sendChat, rememberAction, BACKEND_URL, searchProducts, publishStore, getAnalytics } from "../../lib/agentApi";

import {
  sanitizePrompt,
  NAV_ICONS,
  INITIAL_PRODUCTS,
  INITIAL_PHILOSOPHY,
  INIT_MESSAGES,
  CURATED_STORES,
  TRENDING_PRODUCTS,
  STORE_MUTATION_ACTIONS,
  canonicalizeAgentAction,
  normalizeAgentParams,
  isStoreMutationAction,
  getStockCount,
  getStorePhilosophy,
  storeThemeDark,
  storeThemeLight
} from '../../utils/constants';
/**
 * SECTION REGISTRY
 * A dictionary of all available sections and their variants.
 * This is the "LEGO" system for the AI.
 */

import { ImageLoadingPlaceholder } from '../../components/ImageLoadingPlaceholder';
import { SECTION_REGISTRY } from '../../engine/SectionRegistry';
import { DynamicRenderer } from '../../engine/DynamicRenderer';
export const SellerApp = ({ isDarkMode, setIsDarkMode, t, DynamicRenderer }) => {

  const {
    state,
    setAppMode, setStoreSchema, setDraftSchema, setPublishedSchema, setUserStores,
    setActiveAnalyticsStoreId, setAnalyticsData, setIsLoadingAnalytics,
    setBuyerSearchQuery, setBuyerAiQuery, setBuyerAiMessages, setBuyerAiStatus,
    setSelectedCategoryFilter, setFollowedStores, setCart, setIsCartOpen,
    setSelectedProductDetail, setSelectedStorefront, setModalQty, setSelectedPhilosophy, setToastMessage
  } = useStore();

  const {
    appMode, storeSchema, draftSchema, publishedSchema, userStores,
    activeAnalyticsStoreId, analyticsData, isLoadingAnalytics,
    buyerSearchQuery, buyerAiQuery, buyerAiMessages, buyerAiStatus,
    selectedCategoryFilter, followedStores, cart, isCartOpen,
    selectedProductDetail, selectedStorefront, modalQty, selectedPhilosophy, toastMessage
  } = state;

  // --- CSS Inject ---
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      * { box-sizing: border-box; }
      img { display: block; max-width: 100%; height: auto; }
      .product-img { min-height: 100%; min-width: 100%; display: block !important; opacity: 1 !important; }
      .product-card { transition: all 0.3s ease; border: 1px solid #222; border-radius: 12px; overflow: hidden; background: #161618; }
      .product-card:hover { border-color: #444; transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.3); }
      @keyframes typingBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
      @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .loading-shimmer { animation: pulse 1.5s infinite ease-in-out; background: #1a1a1e; }
      .spinner-ring { 
        width: 44px; height: 44px; 
        border: 4px solid rgba(200, 184, 154, 0.1); 
        border-top: 4px solid #c8b89a; 
        border-radius: 50%; 
        animation: spin 0.8s linear infinite; 
      }
      .placeholder-static { background: #1a1a1e; display: flex; align-items: center; justify-content: center; position: absolute; inset: 0; }
      .chart-bar-container:hover .chart-tooltip { opacity: 1 !important; transform: translateY(-5px); }
      .chart-bar-container:hover .chart-bar { filter: brightness(1.2); }
    `;
    document.head.appendChild(style);
  }, []);
  const [activeNav, setActiveNav] = useState("studio");
  const [activePromoTab, setActivePromoTab] = useState("video");
  const [videoFormat, setVideoFormat] = useState("landscape");
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("sera_hackathon_messages");
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return INIT_MESSAGES;
  });
  const [input, setInput] = useState("");
  useEffect(() => {
    try {
      const replacer = (key, value) => {
        if (typeof value === 'string' && value.startsWith('data:image') && value.length > 10000) {
          return value.substring(0, 50) + "... [Base64 image omitted from history storage]";
        }
        return value;
      };
      localStorage.setItem("sera_hackathon_messages", JSON.stringify(messages, replacer));
    } catch (e) { }
  }, [messages]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [showPublishedModal, setShowPublishedModal] = useState(false);
  // --- BUYER MODE AI-NATIVE DISCOVERY STATES ---
                              const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };
  const parsePriceNum = (priceStr) => {
    if (!priceStr) return 29.00;
    const s = String(priceStr);
    if (s.toLowerCase().includes("rp")) {
      return parseFloat(s.replace(/[^0-9]/g, "")) || 450000;
    }
    return parseFloat(s.replace(/[^0-9.]/g, "")) || 29.00;
  };
  const formatPriceStr = (num, originalStr) => {
    const s = String(originalStr || "");
    if (s.toLowerCase().includes("rp")) {
      return "Rp " + num.toLocaleString("id-ID");
    }
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  // --- DYNAMIC UI STATES ---
  // --- CONSOLIDATED STORE SCHEMA ---
  
        const [chatWidth, setChatWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setChatWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "auto";
    };
  }, [isResizing]);
            useEffect(() => {
    if (activeNav === "analytics") {
      if (!activeAnalyticsStoreId && userStores.length > 0) {
        setActiveAnalyticsStoreId(userStores[0].id);
      }
    }
  }, [activeNav, userStores, activeAnalyticsStoreId]);
  useEffect(() => {
    if (activeNav === "analytics" && activeAnalyticsStoreId) {
      let isMounted = true;
      setIsLoadingAnalytics(true);
      getAnalytics(activeAnalyticsStoreId).then(data => {
        if (isMounted) {
          setAnalyticsData(data);
          setIsLoadingAnalytics(false);
        }
      }).catch(err => {
        console.error("Failed to load analytics:", err);
        if (isMounted) setIsLoadingAnalytics(false);
      });
      return () => { isMounted = false; };
    }
  }, [activeNav, activeAnalyticsStoreId]);
  useEffect(() => {
    try {
      localStorage.setItem("sera_hackathon_published_schema", JSON.stringify(publishedSchema));
    } catch (e) { console.error(e); }
  }, [publishedSchema]);
  useEffect(() => {
    try {
      localStorage.setItem("sera_hackathon_user_stores", JSON.stringify(userStores));
    } catch (e) { console.error(e); }
  }, [userStores]);
  const filteredStores = useMemo(() => {
    const allCuratedStores = [...userStores, ...CURATED_STORES];
    return allCuratedStores
      .filter(s => selectedCategoryFilter === "all" || s.category === selectedCategoryFilter)
      .filter(s => !buyerSearchQuery || (s.name || "").toLowerCase().includes(buyerSearchQuery.toLowerCase()) || (s.category || "").toLowerCase().includes(buyerSearchQuery.toLowerCase()) || (s.desc || "").toLowerCase().includes(buyerSearchQuery.toLowerCase()));
  }, [userStores, selectedCategoryFilter, buyerSearchQuery]);
  // Legacy state aliases (Fully bulletproof optional chaining)
  const products = storeSchema.layout.find(s => s.type === "featured_products")?.props?.products || [];
  const philosophy = storeSchema.layout.find(s => s.type === "philosophy")?.props?.items || [];
  const storeData = storeSchema.layout.find(s => s.type === "hero")?.props || {};
  const testimonials = storeSchema.testimonials || [];
  const faq = storeSchema.faq || [];
  const footerData = storeSchema.footer || {};
  const heroStyles = storeSchema.heroStyles || {};
  const themeColor = storeSchema.theme?.themeColor || "#c8b89a";
  const heroBg = storeSchema.theme?.heroBg || "linear-gradient(135deg, #16161a 0%, #09090b 100%)";
  const heroImage = storeSchema.layout.find(s => s.type === "hero")?.props?.heroImage || null;
  const layoutOrder = storeSchema.layout.map(s => s.type);
  // Setters for backward compatibility
  const setTestimonials = (val) => setStoreSchema(prev => ({ ...prev, testimonials: val }));
  const setFaq = (val) => setStoreSchema(prev => ({ ...prev, faq: val }));
  const setFooterData = (val) => setStoreSchema(prev => ({ ...prev, footer: { ...prev.footer, ...val } }));
  const setHeroStyles = (val) => setStoreSchema(prev => ({ ...prev, heroStyles: { ...prev.heroStyles, ...val } }));
  // Setters for backward compatibility (Fixed to dynamically add section if missing and read fresh prev state)
  const setProducts = (fn) => setStoreSchema(prev => {
    const existingSection = prev.layout.find(s => s.type === "featured_products");
    const currentProducts = existingSection?.props?.products || [];
    const nextProducts = typeof fn === "function" ? fn(currentProducts) : fn;
    if (existingSection) {
      return {
        ...prev,
        layout: prev.layout.map(s => s.type === "featured_products" ? { ...s, props: { ...s.props, products: nextProducts } } : s)
      };
    } else {
      return {
        ...prev,
        layout: [...prev.layout, { id: "auto-products", type: "featured_products", variant: "grid", props: { sectionTitle: "Featured Products", products: nextProducts } }]
      };
    }
  });
  const setPhilosophy = (fn) => setStoreSchema(prev => {
    const existingSection = prev.layout.find(s => s.type === "philosophy");
    const currentItems = existingSection?.props?.items || [];
    const nextItems = typeof fn === "function" ? fn(currentItems) : fn;
    if (existingSection) {
      return {
        ...prev,
        layout: prev.layout.map(s => s.type === "philosophy" ? { ...s, props: { ...s.props, items: nextItems } } : s)
      };
    } else {
      return {
        ...prev,
        layout: [...prev.layout, { id: "auto-philosophy", type: "philosophy", variant: "scroller", props: { items: nextItems } }]
      };
    }
  });
  const setStoreData = (fn) => setStoreSchema(prev => {
    const existingSection = prev.layout.find(s => s.type === "hero");
    const currentProps = existingSection?.props || {};
    const nextData = typeof fn === "function" ? fn(currentProps) : fn;
    if (existingSection) {
      return {
        ...prev,
        layout: prev.layout.map(s => s.type === "hero" ? { ...s, props: { ...s.props, ...nextData } } : s)
      };
    } else {
      return {
        ...prev,
        layout: [{ id: "auto-hero", type: "hero", variant: "centered", props: { ...nextData } }, ...prev.layout]
      };
    }
  });
  const setThemeColor = (color) => setStoreSchema(prev => ({ ...prev, theme: { ...prev.theme, themeColor: color } }));
  const setHeroBg = (bg) => setStoreSchema(prev => ({ ...prev, theme: { ...prev.theme, heroBg: bg } }));
  const setHeroImage = (img) => setStoreSchema(prev => ({
    ...prev,
    layout: prev.layout.map(s => s.type === "hero" ? { ...s, props: { ...s.props, heroImage: img } } : s)
  }));
  const setLayoutOrder = (order) => setStoreSchema(prev => {
    // Reorder or filter layout based on types. 
    // This is a bit complex for a simple setter, so we'll just try to match types.
    const newLayout = order.map(type => {
      const existing = prev.layout.find(s => s.type === type);
      if (existing) return existing;
      // Create default if missing
      return { id: `auto-${type}`, type, variant: "default", props: {} };
    });
    // Ensure footer is always included at the bottom if missing
    if (!newLayout.some(s => s.type === "footer")) {
      const existingFooter = prev.layout.find(s => s.type === "footer") || { id: "init-footer", type: "footer", variant: "default", props: {} };
      newLayout.push(existingFooter);
    }
    return { ...prev, layout: newLayout };
  });
  const [isTyping, setIsTyping] = useState(false);
  const [steps, setSteps] = useState([]);
  const [executionState, setExecutionState] = useState(null);
  const executionStateRef = useRef(null);
  const [pendingImages, setPendingImages] = useState([]);
  const lastUploadedImages = useRef([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [uploadingForProduct, setUploadingForProduct] = useState(null);
  const productImageInputRef = useRef(null);
  const [chatMode, setChatMode] = useState('agent'); // 'plan' or 'agent'
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [agentActivity, setAgentActivity] = useState([]); // {message, status, done}
  const agentActivityRef = useRef([]);
  const lastUserMsgRef = useRef("");
  const abortControllerRef = useRef(null);
  const [ephemeralThought, setEphemeralThought] = useState(null); // brief reasoning flash during GENERATING
  const [buildingStage, setBuildingStage] = useState(0); // 0=idle, 1=analyzing, 2=planning, 3=layout, 4=assets
  const [visibilityMode, setVisibilityMode] = useState('agent'); // 'silent', 'agent', 'deep'
  const stopAgentWork = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsTyping(false);
    setAgentActivity(prev => prev.map(a => ({ ...a, done: true })));
    setMessages(prev => prev.map(m => m.id === "pending_agent_msg" ? {
      ...m,
      id: undefined,
      status: "done",
      text: "Operational Status: Progress stopped by user."
    } : m));
  };
  const [channelsState, setChannelsState] = useState([
    { id: "tiktok", name: "TikTok Shop", status: "Disconnected", icon: "[Phone]" },
    { id: "shopify", name: "Shopify Store", status: "Connected", icon: "ðŸ›ï¸" },
    { id: "instagram", name: "Instagram Shopping", status: "Connected", icon: "ðŸ“¸" },
  ]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps, agentActivity, ephemeralThought]);
  const addStep = (label, isAsync = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setSteps(prev => [...prev, { id, label, done: false, active: true, isAsync }]);
    if (!isAsync) {
      setTimeout(() => {
        completeStep(id);
      }, 1500);
    }
    return id;
  };
  const completeStep = (id) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: true, active: false } : s));
  };
  const preloadImage = (url, stepId, retryCount = 0, onComplete) => {
    const img = new Image();
    // Reduced timeout to 8s for responsive progressive layout filling
    const timeout = setTimeout(() => {
      console.warn("Image timeout (waited 8s):", url);
      if (stepId) {
        completeStep(stepId);
        setProducts(prev => prev.map(p => p.stepId === stepId ? { ...p, stepId: null } : p));
        setPhilosophy(prev => prev.map(ph => ph.stepId === stepId ? { ...ph, stepId: null } : ph));
      }
      if (onComplete) onComplete(false);
    }, 8000);
    img.onload = () => {
      clearTimeout(timeout);
      if (stepId) {
        completeStep(stepId);
        setProducts(prev => prev.map(p => p.stepId === stepId ? { ...p, stepId: null } : p));
        setPhilosophy(prev => prev.map(ph => ph.stepId === stepId ? { ...ph, stepId: null } : ph));
      }
      if (onComplete) onComplete(true);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      // Wait a tiny bit (500ms) before reporting failure to clean up shimmer smoothly
      setTimeout(() => {
        if (stepId) {
          completeStep(stepId);
          setProducts(prev => prev.map(p => p.stepId === stepId ? { ...p, stepId: null } : p));
          setPhilosophy(prev => prev.map(ph => ph.stepId === stepId ? { ...ph, stepId: null } : ph));
        }
        if (onComplete) onComplete(false);
      }, 500);
    };
    img.src = url;
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPendingImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = null;
  };
  const handleProductImageUpdate = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadingForProduct) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setProducts(prev => prev.map(p =>
        p.name === uploadingForProduct ? { ...p, imageUrl: event.target.result } : p
      ));
      addStep(`Updated photo for: ${uploadingForProduct}`);
      setUploadingForProduct(null);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };
  // --- Apply action from AI ---
  const applyAction = (action, rawParams, prevSnap) => {
    const params = normalizeAgentParams(action, rawParams || {});
    console.log(`ðŸ› ï¸ Applying Action: ${action}`, params);
    if (action === 'update_schema') {
      const usedUrls = new Set();
      const layoutWithImages = (params.schema?.layout || []).map(section => {
        if (section.type === "featured_products" && section.props?.products && Array.isArray(section.props.products)) {
          return {
            ...section,
            props: {
              ...section.props,
              products: section.props.products.map((p, idx) => {
                const existingSec = storeSchema.layout?.find(s => s.type === "featured_products");
                const existingProduct = existingSec?.props?.products?.find((ep, eIdx) => {
                  if (p.productInstanceId && ep.productInstanceId) {
                    return ep.productInstanceId === p.productInstanceId;
                  }
                  return ep.name === p.name || eIdx === idx;
                });
                let finalImageUrl = p.verifiedUrl || existingProduct?.verifiedUrl || existingProduct?.imageUrl || "";
                if (p.imageIndex !== undefined && lastUploadedImages.current[p.imageIndex]) {
                  finalImageUrl = lastUploadedImages.current[p.imageIndex];
                }
                const stepId = (!p.verifiedUrl && !existingProduct?.verifiedUrl && !finalImageUrl.startsWith("data:"))
                  ? (existingProduct?.stepId || addStep(`Generating image for: ${p.name}`, true))
                  : null;
                return {
                  ...p,
                  productInstanceId: p.productInstanceId || existingProduct?.productInstanceId || `prod_inst_${Math.random().toString(36).substr(2, 9)}`,
                  imageUrl: p.verifiedUrl || finalImageUrl,
                  pendingUrl: finalImageUrl,
                  icon: p.icon || "📦",
                  stepId,
                  verificationError: p.verificationError || null
                };
              })
            }
          };
        }
        if (section.type === "philosophy" && section.props?.items && Array.isArray(section.props.items)) {
          return {
            ...section,
            props: {
              ...section.props,
              items: section.props.items.map((item, idx) => {
                const existingPhiloSec = storeSchema.layout?.find(s => s.type === "philosophy");
                const existingItem = existingPhiloSec?.props?.items?.find((ei, eIdx) => {
                  if (item.philoInstanceId && ei.philoInstanceId) {
                    return ei.philoInstanceId === item.philoInstanceId;
                  }
                  return ei.label === item.label || eIdx === idx;
                });
                let finalImageUrl = item.verifiedUrl || existingItem?.verifiedUrl || existingItem?.imageUrl || "";
                const stepId = (!item.verifiedUrl && !existingItem?.verifiedUrl)
                  ? (existingItem?.stepId || addStep(`Generating brand philosophy: ${item.label}`, true))
                  : null;
                return {
                  ...item,
                  philoInstanceId: item.philoInstanceId || existingItem?.philoInstanceId || `philo_inst_${Math.random().toString(36).substr(2, 9)}`,
                  imageUrl: item.verifiedUrl || finalImageUrl,
                  pendingUrl: finalImageUrl,
                  stepId
                };
              })
            }
          };
        }
        if (section.type === "hero" && section.props) {
          const heroSec = section.props;
          const heroPrompt = heroSec.heroImagePrompt || (heroSec.title ? `${heroSec.title} luxury lifestyle photography, cinematic lighting` : null);
          let finalHeroImg = heroSec.heroImage || "";
          if (!finalHeroImg && heroPrompt) {
            addStep("Generating cinematic hero photography");
          }
          return {
            ...section,
            props: {
              ...section.props,
              heroImage: finalHeroImg
            }
          };
        }
        return section;
      });
      // Ensure all required sections are always present in layout
      const finalLayout = [...layoutWithImages];
      if (!finalLayout.some(s => s.type === "hero")) {
        finalLayout.push({ id: "auto-hero", type: "hero", variant: "centered", props: { title: "Crafting...", subtitle: "Autonomous generation in progress" } });
      }
      if (!finalLayout.some(s => s.type === "trust_bar")) {
        finalLayout.push({ id: "auto-trust", type: "trust_bar", variant: "ticker", props: {} });
      }
      if (!finalLayout.some(s => s.type === "featured_products")) {
        finalLayout.push({ id: "auto-products", type: "featured_products", variant: "grid", props: { products: [] } });
      }
      if (!finalLayout.some(s => s.type === "philosophy")) {
        finalLayout.push({ id: "auto-philosophy", type: "philosophy", variant: "scroller", props: { items: [] } });
      }
      if (!finalLayout.some(s => s.type === "testimonials")) {
        finalLayout.push({ id: "auto-testimonials", type: "testimonials", variant: "cards", props: {} });
      }
      if (!finalLayout.some(s => s.type === "faq")) {
        finalLayout.push({ id: "auto-faq", type: "faq", variant: "accordion", props: {} });
      }
      if (!finalLayout.some(s => s.type === "footer")) {
        finalLayout.push({ id: "auto-footer", type: "footer", variant: "default", props: {} });
      }
      // Sort sections in canonical order
      const SECTION_ORDER = ["hero", "trust_bar", "featured_products", "philosophy", "testimonials", "faq", "footer"];
      const sortedLayout = [...finalLayout].sort((a, b) => {
        const ai = SECTION_ORDER.indexOf(a.type);
        const bi = SECTION_ORDER.indexOf(b.type);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
      setBuildingStage(0); // Clear skeleton — real layout is now rendered
      setStoreSchema(prev => ({
        ...prev,
        ...params.schema,
        layout: sortedLayout,
        theme: { ...prev.theme, ...(params.schema?.theme || {}) },
        metadata: { ...prev.metadata, ...(params.schema?.metadata || {}) }
      }));
      // Preload any pending images
      const allProducts = layoutWithImages.find(s => s.type === "featured_products")?.props?.products || [];
      const allPhilo = layoutWithImages.find(s => s.type === "philosophy")?.props?.items || [];
      const itemsToLoadProducts = allProducts.filter(p => p.stepId);
      const itemsToLoadPhilo = allPhilo.filter(ph => ph.stepId);
      const totalItemsToLoad = [...itemsToLoadProducts, ...itemsToLoadPhilo];
      if (totalItemsToLoad.length === 0) {
        setMessages(prev => {
          const last = [...prev];
          if (last[last.length - 1]?.role === 'agent') last[last.length - 1].status = 'done';
          return last;
        });
      } else {
        // Parallel Loading Implementation (Instant Live Visual Building)
        let failedAny = false;
        itemsToLoadProducts.forEach(p => {
          preloadImage(p.pendingUrl, p.stepId, 0, (success) => {
            if (!success) failedAny = true;
          });
        });
        itemsToLoadPhilo.forEach(ph => {
          preloadImage(ph.pendingUrl, ph.stepId, 0, (success) => {
            if (!success) failedAny = true;
          });
        });
        setMessages(prev => {
          const last = [...prev];
          const msg = last[last.length - 1];
          if (msg && msg.role === 'agent') {
            msg.status = 'done';
          }
          return last;
        });
      }
      addStep("Orchestrating structural layout changes");
      return;
    }

    switch (action) {
      case 'generate_video':
        const finalUrl = params.video_url || params.url;
        if (finalUrl) {
          if (params.brand_name) {
            setStoreData(p => {
              if (!p.title || p.title === "New AI Store" || p.title === "AI Store") {
                return { ...p, title: params.brand_name };
              }
              return p;
            });
            setStoreSchema(prev => {
              const currentBrand = prev.metadata?.brand_identity;
              if (!currentBrand || currentBrand === "New AI Store" || currentBrand === "AI Store") {
                const next = { ...prev, metadata: { ...(prev.metadata || {}), brand_identity: params.brand_name } };
                const nextLayout = [...(next.layout || [])];
                const heroIdx = nextLayout.findIndex(s => s.type === "hero");
                if (heroIdx >= 0) nextLayout[heroIdx] = { ...nextLayout[heroIdx], props: { ...nextLayout[heroIdx].props, title: params.brand_name } };
                next.layout = nextLayout;
                return next;
              }
              return prev;
            });
          }
          if (params.aspect_ratio === "9:16") {
            setStoreData(p => {
              const currentList = p.promoVideos || (p.promoVideo ? [p.promoVideo] : []);
              return { ...p, promoVideo: finalUrl, promoVideos: [...currentList, finalUrl] };
            });
            addStep("Generating vertical promo video");
          } else {
            setStoreData(p => {
              const currentList = p.storeVideos || (p.storeVideo ? [p.storeVideo] : []);
              return { ...p, storeVideo: finalUrl, storeVideos: [...currentList, finalUrl] };
            });
            addStep("Generating landscape store banner");
          }
          setActiveNav("promotions");
        }
        break;
      case 'change_title':
        if (params.title) {
          setStoreData(p => ({ ...p, title: params.title }));
          setStoreSchema(prev => {
            const next = { ...prev, metadata: { ...prev.metadata, brand_identity: params.title } };
            const nextLayout = [...(next.layout || [])];
            const heroIdx = nextLayout.findIndex(s => s.type === "hero");
            if (heroIdx >= 0) nextLayout[heroIdx] = { ...nextLayout[heroIdx], props: { ...nextLayout[heroIdx].props, title: params.title } };
            next.layout = nextLayout;
            return next;
          });
          addStep("Updating store title");
        }
        break;
      case 'change_subtitle':
        if (params.subtitle) {
          setStoreData(p => ({ ...p, subtitle: params.subtitle }));
          setStoreSchema(prev => {
            const next = { ...prev };
            const nextLayout = [...(next.layout || [])];
            const heroIdx = nextLayout.findIndex(s => s.type === "hero");
            if (heroIdx >= 0) nextLayout[heroIdx] = { ...nextLayout[heroIdx], props: { ...nextLayout[heroIdx].props, subtitle: params.subtitle } };
            next.layout = nextLayout;
            return next;
          });
          addStep("Updating subtitle");
        }
        break;
      case 'change_collection':
        if (params.collection) { setStoreData(p => ({ ...p, collection: params.collection })); addStep("Updating collection label"); }
        break;
      case 'change_button':
        if (params.buttonText) { setStoreData(p => ({ ...p, buttonText: params.buttonText })); addStep("Updating CTA button"); }
        break;
      case 'add_promo_banner':
        if (params.bannerText) { setStoreData(p => ({ ...p, promoBanner: params.bannerText })); addStep("Adding promo banner"); }
        break;
      case 'remove_promo_banner':
        setStoreData(p => ({ ...p, promoBanner: "" })); addStep("Removing promo banner");
        break;
      case 'add_product':
        if (params.name) {
          const stepId = addStep(params.imageIndex !== undefined ? `Processing uploaded image: ${params.name}` : `Generating image for: ${params.name}`, true);
          const uniqueSalt = Math.floor(Math.random() * 1000000);
          const promptStr = sanitizePrompt(params.imagePrompt || params.name);
          // Standardized Pollinations URL: removed model=flux for stability, added nologo=true
          let finalImageUrl = "";
          if (params.imageIndex !== undefined && lastUploadedImages.current[params.imageIndex]) {
            finalImageUrl = lastUploadedImages.current[params.imageIndex];
          }
          preloadImage(finalImageUrl, stepId, 0, (success) => {
            setMessages(prev => {
              const last = [...prev];
              const msg = last[last.length - 1];
              if (msg && msg.role === 'agent') {
                msg.status = success ? 'done' : 'failed';
              }
              return last;
            });
          });
          setProducts(prev => [{
            ...params,
            name: params.name,
            desc: params.desc || "New product",
            price: params.price || "$0.00",
            imageUrl: finalImageUrl,
            icon: params.icon || "📦",
            stepId
          }, ...prev]);
        }
        break;
      case 'change_price':
        if (params.productName && params.newPrice) {
          setProducts(p => p.map(prod =>
            prod.name.toLowerCase().includes(params.productName.toLowerCase()) ? { ...prod, price: params.newPrice } : prod
          ));
          addStep(`Updating price: ${params.productName}`);
        }
        break;
      case 'batch_update_prices':
        if (Array.isArray(params.updates)) {
          setProducts(prev => prev.map(prod => {
            const prodName = String(prod.name || "").toLowerCase();
            const update = params.updates.find(u => prodName.includes(String(u.productName || "").toLowerCase()));
            return update ? { ...prod, price: update.newPrice } : prod;
          }));
          addStep(`Batch updating product prices`);
        }
        break;
      case 'change_product_promo':
        if (params.productName) {
          setProducts(p => p.map(prod =>
            prod.name.toLowerCase().includes(params.productName.toLowerCase()) ? { ...prod, promo: params.promo || "" } : prod
          ));
          addStep(params.promo ? `Adding promo to: ${params.productName}` : `Removing promo from: ${params.productName}`);
        }
        break;
      case 'change_product_desc':
        if (params.productName && params.desc) {
          setProducts(p => p.map(prod =>
            prod.name.toLowerCase().includes(params.productName.toLowerCase()) ? { ...prod, desc: params.desc } : prod
          ));
          addStep(`Updating description: ${params.productName}`);
        }
        break;
      case 'change_product_name':
        if (params.productName && params.newName) {
          setProducts(p => p.map(prod =>
            prod.name.toLowerCase().includes(params.productName.toLowerCase()) ? { ...prod, name: params.newName } : prod
          ));
          addStep(`Renaming: ${params.productName} â†’ ${params.newName}`);
        }
        break;
      case 'change_product_image':
        if (params.productName) {
          const stepId = addStep(params.imageIndex !== undefined ? `Updating with uploaded image: ${params.productName}` : `Regenerating image: ${params.productName}`, true);
          const uniqueSalt = Math.floor(Math.random() * 1000000);
          const promptStr = sanitizePrompt(params.imagePrompt || params.productName);
          // Standardized Pollinations URL
          let finalImageUrl = params.imageUrl || "";
          if (params.imageIndex !== undefined && lastUploadedImages.current[params.imageIndex]) {
            finalImageUrl = lastUploadedImages.current[params.imageIndex];
          }
          preloadImage(finalImageUrl, stepId, 0, (success) => {
            setMessages(prev => {
              const last = [...prev];
              const msg = last[last.length - 1];
              if (msg && msg.role === 'agent') {
                msg.status = success ? 'done' : 'failed';
              }
              return last;
            });
          });
          setProducts(prev => {
            const targetName = String(params.productName).trim().toLowerCase();
            return prev.map(p => {
              const currentName = String(p.name).trim().toLowerCase();
              if (currentName === targetName || currentName.includes(targetName) || targetName.includes(currentName)) {
                return { ...p, imageUrl: finalImageUrl, stepId };
              }
              return p;
            });
          });
        }
        break;
      case 'remove_product':
        if (params.productName) {
          setProducts(p => p.filter(prod => !prod.name.toLowerCase().includes(params.productName.toLowerCase())));
          addStep(`Removing product: ${params.productName}`);
        }
        break;
      case 'change_theme_color':
        if (params.color) { setThemeColor(params.color); addStep("Changing theme color"); }
        break;
      case 'change_store_cover':
        if (params.imagePrompt || params.imageUrl) {
          const stepId = addStep("Updating store cover image", true);
          const uniqueSalt = Math.floor(Math.random() * 1000000);
          const promptStr = sanitizePrompt(params.imagePrompt || "store cover banner");
          const finalUrl = params.imageUrl || "";
          setSelectedStorefront(prev => prev ? { ...prev, cover: finalUrl } : prev);
          setHeroImage(finalUrl);
          setStoreSchema(prev => {
            if (!prev.layout) return prev;
            return {
              ...prev,
              layout: prev.layout.map(s => s.type === "hero" ? { ...s, props: { ...s.props, heroImage: finalUrl } } : s)
            };
          });
          preloadImage(finalUrl, stepId, 0, (success) => {
            setMessages(prev => {
              const last = [...prev];
              const msg = last[last.length - 1];
              if (msg && msg.role === 'agent') msg.status = success ? 'done' : 'failed';
              return last;
            });
            if (success) {
              addStep("Successfully updated store cover banner");
            }
          });
        }
        break;
      case 'change_hero_bg':
        if (params.gradient) { setHeroBg(params.gradient); setHeroImage(null); addStep("Updating hero background"); }
        if (params.heroImagePrompt || params.imageUrl) {
          const uniqueSalt = Math.floor(Math.random() * 1000000);
          const finalUrl = params.imageUrl || "";
          setHeroImage(finalUrl);
          addStep("Generating cinematic hero photography");
        }
        break;
      case 'navigate':
        if (params.page) { setActiveNav(params.page); }
        break;
      case 'change_philosophy_image':
        if (params.philosophyTitle) {
          const stepId = addStep(`Regenerating image for philosophy: ${params.philosophyTitle}`, true);
          const uniqueSalt = Math.floor(Math.random() * 1000000);
          const promptStr = sanitizePrompt(params.imagePrompt || params.philosophyTitle);
          let finalImageUrl = params.imageUrl || "";
          preloadImage(finalImageUrl, stepId, 0, (success) => {
            setMessages(prev => {
              const last = [...prev];
              const msg = last[last.length - 1];
              if (msg && msg.role === 'agent') msg.status = success ? 'done' : 'failed';
              return last;
            });
            if (success) {
              setStoreSchema(prev => {
                if (!prev.layout) return prev;
                return {
                  ...prev,
                  layout: prev.layout.map(s => {
                    if (s.type === "philosophy") {
                      return {
                        ...s,
                        props: {
                          ...s.props,
                          items: (s.props?.items || []).map(ph => {
                            const targetTitle = String(params.philosophyTitle).trim().toLowerCase();
                            const currentTitle = String(ph.title || ph.label || "").trim().toLowerCase();
                            if (currentTitle === targetTitle || currentTitle.includes(targetTitle) || targetTitle.includes(currentTitle)) {
                              return { ...ph, imageUrl: finalImageUrl, verifiedUrl: finalImageUrl, stepId: null };
                            }
                            return ph;
                          })
                        }
                      };
                    }
                    return s;
                  })
                };
              });
              addStep(`Successfully updated philosophy image`);
            }
          });
        }
        break;
      case 'update_philosophy':
        if (params.items && Array.isArray(params.items)) {
          setStoreSchema(prev => {
            if (!prev.layout) return prev;
            return {
              ...prev,
              layout: prev.layout.map(s => {
                if (s.type === "philosophy") {
                  return {
                    ...s,
                    props: {
                      ...s.props,
                      items: params.items.map((item, idx) => ({
                        ...item,
                        imgPrompt: item.imagePrompt || item.imgPrompt || item.label
                      }))
                    }
                  };
                }
                return s;
              })
            };
          });
          addStep("Updating brand philosophy banner");
        }
        break;
      case 'show_plan':
        addStep("Proposed plan ready for review");
        setDraftSchema(params);
        break;
      case 'batch_create':
        const productsList = params.products || params.inventory || params.items || params.data?.products;
        if (params.title) {
          setStoreData({
            title: params.title,
            subtitle: params.subtitle || "Quality products for you.",
            collection: params.collection || "New Collection",
            buttonText: params.buttonText || "Shop Now",
            promoBanner: params.promoBanner || "",
            heroVariant: params.heroVariant || "centered"
          });
          setStoreSchema(prev => ({ ...prev, metadata: { ...prev.metadata, brand_identity: params.title } }));
        }
        if (params.themeColor) setThemeColor(params.themeColor);
        if (params.heroBg) setHeroBg(params.heroBg);
        const usedUrls = new Set();
        const heroPrompt = params.heroImagePrompt || (params.title ? `${params.title} luxury lifestyle photography, cinematic lighting` : null);
        if (heroPrompt) {
          addStep("Generating cinematic hero photography");
          // setHeroImage(""); // Do not wipe out the generated image if called at the end of creation
        }
        else if (params.heroImage) {
          setHeroImage(params.heroImage);
        } // else {
          // setHeroImage(null); // Preserve existing image
        // }
        if (params.layout && Array.isArray(params.layout)) {
          setLayoutOrder(params.layout.filter(s => ["hero", "featured_products", "philosophy", "testimonials", "faq", "newsletter", "promo_ticker", "footer"].includes(s)));
          addStep("Planning store layout architecture");
        }
        if (params.heroStyles) setHeroStyles(prev => ({ ...prev, ...params.heroStyles }));
        if (params.footer) setFooterData(prev => ({ ...prev, ...params.footer }));
        if (params.testimonials) setTestimonials(params.testimonials);
        if (params.faq) setFaq(params.faq);
        let itemsToLoadProducts = [];
        if (productsList && Array.isArray(productsList)) {
          const newProductsWithSteps = productsList.map((p, idx) => {
            const existingSec = storeSchema.layout?.find(s => s.type === "featured_products");
            const existingProduct = existingSec?.props?.products?.find((ep, eIdx) => {
              if (p.productInstanceId && ep.productInstanceId) {
                return ep.productInstanceId === p.productInstanceId;
              }
              return ep.name === p.name || eIdx === idx;
            });
            let finalImageUrl = p.verifiedUrl || existingProduct?.verifiedUrl || existingProduct?.imageUrl || "";
            if (p.imageIndex !== undefined && lastUploadedImages.current[p.imageIndex]) {
              finalImageUrl = lastUploadedImages.current[p.imageIndex];
            }
            const stepId = (!p.verifiedUrl && !existingProduct?.verifiedUrl && !finalImageUrl.startsWith("data:"))
              ? (existingProduct?.stepId || addStep(`Generating image for: ${p.name}`, true))
              : null;
            return {
              ...p,
              productInstanceId: p.productInstanceId || existingProduct?.productInstanceId || `prod_inst_${Math.random().toString(36).substr(2, 9)}`,
              imageUrl: p.verifiedUrl || finalImageUrl,
              pendingUrl: finalImageUrl,
              icon: p.icon || "📦",
              stepId
            };
          });
          setProducts(newProductsWithSteps);
          itemsToLoadProducts = newProductsWithSteps.filter(p => p.stepId);
        }
        let itemsToLoadPhilo = [];
        if (params.philosophy && Array.isArray(params.philosophy)) {
          const newPhiloWithSteps = params.philosophy.map((item, idx) => {
            const existingPhiloSec = storeSchema.layout?.find(s => s.type === "philosophy");
            const existingItem = existingPhiloSec?.props?.items?.find((ei, eIdx) => {
              if (item.philoInstanceId && ei.philoInstanceId) {
                return ei.philoInstanceId === item.philoInstanceId;
              }
              return ei.label === item.label || eIdx === idx;
            });
            let finalImageUrl = item.verifiedUrl || existingItem?.verifiedUrl || existingItem?.imageUrl || "";
            const stepId = (!item.verifiedUrl && !existingItem?.verifiedUrl)
              ? (existingItem?.stepId || addStep(`Generating brand philosophy: ${item.label}`, true))
              : null;
            return {
              ...item,
              philoInstanceId: item.philoInstanceId || existingItem?.philoInstanceId || `philo_inst_${Math.random().toString(36).substr(2, 9)}`,
              imageUrl: item.verifiedUrl || finalImageUrl,
              pendingUrl: finalImageUrl,
              stepId
            };
          });
          setPhilosophy(newPhiloWithSteps);
          itemsToLoadPhilo = newPhiloWithSteps.filter(ph => ph.stepId);
        }
        const totalItemsToLoad = [...itemsToLoadProducts, ...itemsToLoadPhilo];
        if (totalItemsToLoad.length === 0) {
          setMessages(prev => {
            const last = [...prev];
            if (last[last.length - 1]?.role === 'agent') last[last.length - 1].status = 'done';
            return last;
          });
        } else {
          // Parallel Loading Implementation (Instant Live Visual Building)
          let failedAny = false;
          itemsToLoadProducts.forEach(p => {
            preloadImage(p.pendingUrl, p.stepId, 0, (success) => {
              if (!success) failedAny = true;
            });
          });
          itemsToLoadPhilo.forEach(ph => {
            preloadImage(ph.pendingUrl, ph.stepId, 0, (success) => {
              if (!success) failedAny = true;
            });
          });
          setMessages(prev => {
            const last = [...prev];
            const msg = last[last.length - 1];
            if (msg && msg.role === 'agent') {
              msg.status = 'done';
            }
            return last;
          });
        }
        addStep("Building complete store experience");
        break;
      case 'proactive_suggestion':
        // Now handled via chat messages
        break;
      case 'sync_channels':
        if (params.channels) {
          setChannelsState(prev => prev.map(ch =>
            params.channels.includes(ch.id) ? { ...ch, status: params.status || "Syncing" } : ch
          ));
          addStep(`Syncing products to: ${params.channels.join(", ")}`);
          // Simulate sync completion
          setTimeout(() => {
            setChannelsState(prev => prev.map(ch =>
              params.channels.includes(ch.id) ? { ...ch, status: "Connected" } : ch
            ));
            addStep("Multi-channel sync complete");
          }, 4000);
        }
        break;
      default:
        break;
    }
  };
  const sendMessage = async (overrideInput, overrideMode) => {
    const userMsg = overrideInput || input;
    const currentImages = [...pendingImages];
    if (!userMsg.trim() && currentImages.length === 0) return;

    let finalMode = overrideMode || chatMode;

    // Auto-escalate to agent mode if user verbally confirms a pending plan
    if (finalMode === 'plan' && !overrideMode && messages.some(m => m.action === 'show_plan' && !m.planConfirmed)) {
      if (/\\b(oke|ok|lanjut|lanjutkan|kerjakan|buat|bikin|gas|sip|setuju|yes|ya|y|go|terapkan)\\b/i.test(userMsg)) {
        finalMode = 'agent';
        setChatMode('agent');
      }
    }
    setMessages(prev => {
      const next = [...prev];
      if (finalMode === 'agent' && chatMode === 'plan') {
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].action === 'show_plan') {
            next[i].planConfirmed = true;
            break;
          }
        }
      }
      next.push({ role: "user", text: userMsg || (currentImages.length > 0 ? "Mengirim gambar..." : ""), images: currentImages });
      return next;
    });
    if (!overrideInput) setInput("");
    setPendingImages([]);
    lastUploadedImages.current = currentImages;
    lastUserMsgRef.current = userMsg;
    setIsTyping(true);
    setAgentActivity([]); // Reset cognition steps
    agentActivityRef.current = [];
    setBuildingStage(0); // Reset building stage
    setExecutionState(null);
    executionStateRef.current = null;
    try {
      let storeContextToSend = {};
      if (appMode === "buyer") {
        storeContextToSend = {
          session_id: "buyer_session",
          chatMode: "buyer",
          activeStores: filteredStores.map(s => ({ id: s.id, name: s.name, category: s.category, desc: s.desc })),
          ...(selectedStorefront ? { storeId: selectedStorefront.id, storeName: selectedStorefront.name } : {})
        };
      } else {
        storeContextToSend = {
          ...storeSchema,
          storeId: storeSchema.id || activeAnalyticsStoreId, // Ensure storeId is explicit
          activeTab: activeNav, // Pass active tab for bulletproof routing
          products, // Keep for backward compatibility in prompt
          themeColor,
          heroBg
        };
      }
      abortControllerRef.current = new AbortController();
      const response = await sendChat(
        { input: userMsg, history: messages, storeContext: storeContextToSend, images: currentImages, chatMode: appMode === 'buyer' ? 'buyer' : finalMode },
        abortControllerRef.current.signal
      );
      if (!response.body) {
        throw new Error("ReadableStream not supported or empty body.");
      }
      // Check if it's a standard JSON response (not streaming)
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setIsTyping(false);
        const action = canonicalizeAgentAction(data.action || "idle");
        const params = normalizeAgentParams(action, data.params || {});
        const prevSnap = { storeData, products, themeColor, heroBg };
        const ui = isStoreMutationAction(action, params);
        setMessages(prev => [...prev, {
          role: "agent",
          text: data.text || "Respons diterima.",
          action,
          params,
          hasAction: ui,
          status: ui ? "generating" : "done",
          actionState: ui ? "pending" : null,
          prevState: ui ? prevSnap : null,
        }]);
        if (ui) applyAction(action, params);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === "schema_preview") {
                if (data.action === 'batch_create') {
                  const ts = Date.now() / 1000;
                  const syntheticLogs = [
                    { message: "Analyzing commerce intent and brand identity...", phase: "analysis", done: true, type: "cognition", timestamp: ts - 3 },
                    { message: "Querying component library for optimal layout structures...", phase: "data_fetching", done: true, type: "cognition", timestamp: ts - 2.5 },
                    { message: "Designing multi-section storefront layout...", phase: "layout_design", done: true, type: "cognition", timestamp: ts - 1.5 },
                    { message: "Orchestrating layout components and state bindings...", phase: "layout_design", done: true, type: "cognition", timestamp: ts - 1 },
                    { message: "Generating high-fidelity visual assets via Imagen 3...", phase: "asset_generation", done: false, type: "cognition", timestamp: ts }
                  ];
                  setAgentActivity(syntheticLogs);
                  agentActivityRef.current = syntheticLogs;
                  // Force skeleton to show final design stage immediately
                  setBuildingStage(4);
                  setBuildingStage(0); // Reset skeleton
                  const p = data.params || {};
                  const tc = p.themeColor || '#c8b89a';
                  const syntheticSchema = {
                    layout: [
                      { id: 'sp-hero', type: 'hero', variant: 'centered', props: { title: p.title || 'Your Store', subtitle: p.subtitle || '', collection: p.collection || '', buttonText: p.buttonText || 'Shop Now', heroImagePrompt: p.heroImagePrompt } },
                      { id: 'sp-trust', type: 'trust_bar', variant: 'ticker', props: {} },
                      { id: 'sp-products', type: 'featured_products', variant: 'grid', props: { products: p.products || [] } },
                      ...(p.philosophy?.length ? [{ id: 'sp-philo', type: 'philosophy', variant: 'scroller', props: { items: p.philosophy } }] : []),
                      { id: 'sp-testimonials', type: 'testimonials', variant: 'cards', props: {} },
                      { id: 'sp-faq', type: 'faq', variant: 'accordion', props: {} },
                      { id: 'sp-footer', type: 'footer', variant: 'default', props: {} }
                    ],
                    theme: { themeColor: tc, heroBg: p.heroBg || 'linear-gradient(135deg,#111113 0%,#1a1a1e 100%)' }
                  };
                  applyAction('update_schema', { schema: syntheticSchema });
                } else {
                  setIsTyping(false);
                  setBuildingStage(0);
                  applyAction(data.action, data.params);
                }
              } else if (data.type === "execution_state") {
                executionStateRef.current = data.state;
                setExecutionState(data.state);
                // ðŸ”¥ REAL-TIME VISUAL HYDRATION PIPELINE ðŸ”¥
                // Hydrate products and philosophy in storeSchema live as each asset finishes!
                if (data.state?.results && Array.isArray(data.state.results)) {
                  setStoreSchema(prev => {
                    let updatedLayout = prev.layout.map(section => {
                      if (section.type === "hero") {
                        const match = data.state.results.find(r => r.itemId === "hero_bg");
                        if (match && match.status === "success" && section.props?.heroImage !== (match.proxy_url || match.url)) {
                          return {
                            ...section,
                            props: { ...section.props, heroImage: match.proxy_url || match.url }
                          };
                        }
                        if (match && match.status === "failed" && section.props?.heroImage) {
                          return {
                            ...section,
                            props: { ...section.props, heroImage: "" }
                          };
                        }
                        return section;
                      }
                      if (section.type === "featured_products" && section.props?.products && Array.isArray(section.props.products)) {
                        let changed = false;
                        const nextProducts = section.props.products.map((p, idx) => {
                          const match = data.state.results.find(r => r.itemId === `prod_${idx}`);
                          if (match && match.status === "success" && (!p.verifiedUrl || p.stepId)) {
                            changed = true;
                            const verifiedUrl = match.proxy_url || match.url;
                            return {
                              ...p,
                              verifiedUrl,
                              imageUrl: verifiedUrl,
                              pendingUrl: verifiedUrl, // Cancel shimmer
                              stepId: null, // Mark step as complete
                              verificationError: null
                            };
                          } else if (match && match.status === "failed" && (!p.verificationError || p.stepId)) {
                            changed = true;
                            return {
                              ...p,
                              stepId: null,
                              verificationError: match.error || "Failed to load image",
                              verifiedUrl: "",
                              imageUrl: "",
                              pendingUrl: ""
                            };
                          }
                          return p;
                        });
                        return changed ? { ...section, props: { ...section.props, products: nextProducts } } : section;
                      }
                      if (section.type === "philosophy" && section.props?.items && Array.isArray(section.props.items)) {
                        let changed = false;
                        const nextItems = section.props.items.map((item, idx) => {
                          const match = data.state.results.find(r => r.itemId === `philo_${idx}`);
                          if (match && match.status === "success" && (!item.verifiedUrl || item.stepId)) {
                            changed = true;
                            const verifiedUrl = match.proxy_url || match.url;
                            return {
                              ...item,
                              verifiedUrl,
                              imageUrl: verifiedUrl,
                              pendingUrl: verifiedUrl,
                              stepId: null,
                              verificationError: null
                            };
                          } else if (match && match.status === "failed" && (!item.verificationError || item.stepId)) {
                            changed = true;
                            return {
                              ...item,
                              stepId: null,
                              verificationError: match.error || "Failed to load image",
                              verifiedUrl: "",
                              imageUrl: "",
                              pendingUrl: ""
                            };
                          }
                          return item;
                        });
                        return changed ? { ...section, props: { ...section.props, items: nextItems } } : section;
                      }
                      return section;
                    });
                    return { ...prev, layout: updatedLayout };
                  });
                }
              } else if (data.type === "agent_message_start") {
                const cleanText = (data.text || "").replace(/Generating storefront assets\.{0,3}/gi, "").trim();
                if (data.ephemeral) {
                  // Flash reasoning text briefly in cognition area, then auto-clear
                  if (cleanText) {
                    setEphemeralThought(cleanText);
                    setTimeout(() => setEphemeralThought(null), 600);
                  }
                } else {
                  // Legacy non-ephemeral: add as pending message
                  setIsTyping(false);
                  setMessages(prev => [...prev.filter(m => m.id !== "pending_agent_msg"), {
                    id: "pending_agent_msg",
                    role: "agent",
                    text: cleanText,
                    hasAction: false,
                    status: "generating",
                    milestones: agentActivityRef.current.map(a => ({ text: a.message, status: a.done ? "done" : "active" })),
                    events: agentActivityRef.current,
                    tools: executionStateRef.current ? executionStateRef.current.results.map(r => ({ label: `Generate ${(r.action || "image").replace("generate_", "").replace("_image", "")}`, detail: r.itemId })) : [],
                  }]);
                }
              } else if (data.type === "cognition") {
                console.log('ðŸ§  [COGNITION CHUNK]:', data);
                // Always accumulate — regardless of mode or intent match
                setAgentActivity(prev => {
                  const updated = prev.map(s => ({ ...s, done: true }));
                  const next = [...updated, {
                    message: data.message,
                    status: data.status,
                    done: false,
                    agent: data.agent,
                    tool: data.tool,
                    phase: data.phase,
                    event_id: data.event_id,
                    timestamp: data.timestamp,
                    localTs: Date.now(),
                    session_id: data.session_id,
                  }];
                  agentActivityRef.current = next;
                  return next;
                });
                const currentMode = overrideMode || chatMode;
                // Gate buildingStage by Mode: Only Execution Mode mutates the skeleton
                if (currentMode === 'agent') {
                  if (data.phase) {
                    if (data.phase === 'analysis') setBuildingStage(1);
                    else if (data.phase === 'data_fetching') setBuildingStage(2);
                    else if (data.phase === 'layout_design') setBuildingStage(3);
                    else if (data.phase === 'asset_generation' || data.phase === 'validation') setBuildingStage(4);
                  } else {
                    const msg = (data.message || '').toLowerCase();
                    if (msg.includes('analyzing') || msg.includes('intent')) setBuildingStage(1);
                    else if (msg.includes('mongodb') || msg.includes('memory') || msg.includes('querying')) setBuildingStage(2);
                    else if (msg.includes('designing') || msg.includes('layout') || msg.includes('storefront')) setBuildingStage(3);
                    else if (msg.includes('generating') || msg.includes('assets') || msg.includes('image')) setBuildingStage(4);
                  }
                }
                await new Promise(r => setTimeout(r, 700));
              } else if (data.type === "final") {
                const currentMode = overrideMode || chatMode;
                setAgentActivity(prev => {
                  const next = prev.map(s => ({ ...s, done: true }));
                  agentActivityRef.current = next;
                  return next;
                });
                const action = canonicalizeAgentAction(data.action || "idle");
                const params = normalizeAgentParams(action, data.params || {});
                const responseText = data.text || "Respons diterima.";
                const isUIAction = isStoreMutationAction(action, params);
                const prevSnap = { storeData, products, themeColor, heroBg };
                if (isUIAction) await new Promise(r => setTimeout(r, 400));
                setIsTyping(false);
                const isAgent = currentMode === 'agent';
                // Add message in "generating" status with permanent milestones and tools
                const runtimeSnapshot = structuredClone(agentActivityRef.current || []);
                setMessages(prev => [...prev.filter(m => m.id !== "pending_agent_msg"), {
                  role: "agent",
                  text: responseText,
                  content: responseText,
                  action,
                  params,
                  chat: data.chat || null,
                  runtime: runtimeSnapshot,
                  cognition: runtimeSnapshot.filter(
                    e => e.type === "thinking" ||
                      e.type === "cognition" ||
                      e.phase
                  ),
                  events: runtimeSnapshot,
                  summary: data.summary || null,
                  timestamp: Date.now(),
                  tools: executionStateRef.current ? executionStateRef.current.results.map(r => ({ label: `Generate ${(r.action || "image").replace("generate_", "").replace("_image", "")}`, detail: r.itemId })) : [],
                  milestones: runtimeSnapshot.map(a => ({ text: a.message, status: "done" })),
                  hasAction: isUIAction,
                  status: isUIAction ? "generating" : "done",
                  actionState: isUIAction ? "pending" : null,
                  prevState: isUIAction ? prevSnap : null,
                }]);
                if (isUIAction) applyAction(action, params, prevSnap);
              }
            } catch (e) {
              console.warn("JSON Parse warning in stream:", e);
            }
          }
        }
        if (done) break;
      }
    } catch (error) {
      setIsTyping(false);
      setAgentActivity([]);
      if (error.name === "AbortError" || error.message?.includes("abort")) {
        console.log("Stream aborted by user.");
        return;
      }
      console.error("Critical Stream Error:", error);
      setMessages(prev => [...prev, {
        role: "agent",
        text: "Connection lost or system error occurred. Please try again.",
        action: "idle", hasAction: false
      }]);
    }
  };
  const handleAction = async (index, decision) => {
    const msg = messages[index];
    const decisionState = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "undone";
    setMessages(prev => {
      const newMsg = [...prev];
      const m = newMsg[index];
      m.actionState = decisionState;
      if (decision === "reject" || decision === "undo") {
        if (m.prevState) {
          setStoreData(m.prevState.storeData);
          setProducts(m.prevState.products);
          setThemeColor(m.prevState.themeColor);
          setHeroBg(m.prevState.heroBg);
        }
      }
      return newMsg;
    });
    if (decision === "approve" && msg.action === "show_plan") {
      if (msg.params?.schema) {
        applyAction("update_schema", msg.params);
      } else {
        applyAction("batch_create", msg.params);
      }
      setDraftSchema(null);
    } else if (decision === "reject" || decision === "undo") {
      setDraftSchema(null);
    }
    // Notify backend to remember this decision
    try {
      await rememberAction(msg.action, decisionState, msg.params);
    } catch (err) {
      console.error("Failed to commit to memory:", err);
    }
    setSteps([]);
  };
  // -- Retry Failed Assets Handler --
  const handleRetryAssets = async (msgIndex, pendingRetries, retrySchema) => {
    if (!retrySchema || !pendingRetries?.length) return;
    const failedIds = pendingRetries.map(r => r.itemId);
    setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, retryStatus: 'retrying' } : m));
    setIsTyping(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/agent/retry-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema: retrySchema, failed_item_ids: failedIds })
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'execution_state' && data.state?.results) {
              setStoreSchema(prev => {
                const updatedLayout = prev.layout.map(section => {
                  if (section.type === 'hero') {
                    const match = data.state.results.find(r => r.itemId === 'hero_bg' && r.status === 'success');
                    if (match) return { ...section, props: { ...section.props, heroImage: match.proxy_url || match.url } };
                  }
                  if (section.type === 'featured_products' && section.props?.products) {
                    let changed = false;
                    const nextProds = section.props.products.map((p, idx) => {
                      const match = data.state.results.find(r => r.itemId === `prod_${idx}` && r.status === 'success');
                      if (match && !p.verifiedUrl) { changed = true; const u = match.proxy_url || match.url; return { ...p, verifiedUrl: u, imageUrl: u, pendingUrl: u, stepId: null }; }
                      return p;
                    });
                    return changed ? { ...section, props: { ...section.props, products: nextProds } } : section;
                  }
                  if (section.type === 'philosophy' && section.props?.items) {
                    let changed = false;
                    const nextItems = section.props.items.map((item, idx) => {
                      const match = data.state.results.find(r => r.itemId === `philo_${idx}` && r.status === 'success');
                      if (match && !item.verifiedUrl) { changed = true; const u = match.proxy_url || match.url; return { ...item, verifiedUrl: u, imageUrl: u, pendingUrl: u, stepId: null }; }
                      return item;
                    });
                    return changed ? { ...section, props: { ...section.props, items: nextItems } } : section;
                  }
                  return section;
                });
                return { ...prev, layout: updatedLayout };
              });
            } else if (data.type === 'retry_complete') {
              const remaining = data.remaining_failures || 0;
              setMessages(prev => prev.map((m, i) => {
                if (i !== msgIndex) return m;
                const stillFailed = (m.params?.pending_retries || []).filter(r => (data.failed_ids || []).includes(r.itemId));
                return { ...m, retryStatus: remaining === 0 ? 'success' : 'partial', params: { ...m.params, pending_retries: stillFailed } };
              }));
            }
          } catch (e) { /* skip */ }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map((m, i) => i === msgIndex ? { ...m, retryStatus: 'error' } : m));
    } finally {
      setIsTyping(false);
    }
  };
  const completedSteps = steps.filter(s => s.done).length;
  const toggleFollowStore = (storeId) => {
    setFollowedStores(prev => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  };

  const handleBuyerAiSubmit = async (e) => {
    e.preventDefault();
    if (!buyerAiQuery.trim()) return;
    const userText = buyerAiQuery.trim();
    const newMsgId = Math.random().toString(36).substr(2, 9);
    setBuyerAiMessages(prev => [...prev, { role: "user", text: userText, id: `user-${newMsgId}` }]);
    setBuyerAiQuery("");
    setBuyerAiStatus("Analyzing request...");
    try {
      setBuyerAiStatus("Thinking...");
      const storeContext = {
        session_id: "buyer_session_1",
        storeName: "SERA AI Store",
        chatMode: "buyer"
      };
      const response = await sendChat({
        input: userText,
        history: buyerAiMessages,
        storeContext,
        chatMode: "buyer"
      }, new AbortController().signal);
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === "cognition" && data.message) {
                setBuyerAiStatus(data.message);
              } else if (data.type === "final") {
                setBuyerAiMessages(prev => [...prev, { role: "agent", text: data.text, id: `agent-${newMsgId}` }]);
                setBuyerAiStatus("");
              }
            } catch (e) {
              // Ignore invalid JSON chunks
            }
          }
        }
        if (done) break;
      }
    } catch (err) {
      console.error("Failed buyer AI assistant search:", err);
      setBuyerAiMessages(prev => [...prev, {
        role: "agent",
        text: `Sorry, there was an issue communicating with SERA AI. Please try again.`,
        id: `agent-${newMsgId}`
      }]);
    } finally {
      setBuyerAiStatus("");
    }
  };
  return (
    <div className={isDarkMode ? "" : "light-mode"} style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      background: t.bg,
      fontFamily: "'DM Sans', sans-serif",
      color: t.text,
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');
        :root { color-scheme: ${isDarkMode ? "dark" : "light"}; }
        * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: ${isDarkMode ? "#2a2a2e transparent" : "#e5e7eb #f9fafb"}; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${isDarkMode ? "transparent" : "#f9fafb"}; }
        ::-webkit-scrollbar-thumb { background: ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}; border-radius: 4px; }
        .nav-btn { background: none; border: none; cursor: pointer; padding: 10px; border-radius: 10px; color: ${isDarkMode ? "#4a4a52" : "#9ca3af"}; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .nav-btn:hover { background: ${isDarkMode ? "#1e1e22" : "#f3f4f6"}; color: ${isDarkMode ? "#c8b89a" : "#8b7355"}; }
        .nav-btn.active { background: ${isDarkMode ? "#1e1e22" : "#f3f4f6"}; color: ${isDarkMode ? "#c8b89a" : "#8b7355"}; }
        .product-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 12px; overflow: hidden; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
        .product-card:hover { transform: translateY(-2px); border-color: ${isDarkMode ? "#333" : "#d1d5db"}; }
        .send-btn { background: #c8b89a; border: none; border-radius: 8px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: opacity 0.2s; }
        .send-btn:hover { opacity: 0.85; }
        .chat-input { background: none; border: none; outline: none; color: ${t.text}; font-family: 'DM Sans', sans-serif; font-size: 13px; flex: 1; resize: none; }
        .chat-input::placeholder { color: ${isDarkMode ? "#444" : "#999"}; }
        .step-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; }
        .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
        .hero-title { white-space: pre-line; }
        
        .markdown-body h3 { font-size: 15px; font-weight: 700; color: ${t.text}; margin-top: 16px; margin-bottom: 8px; font-family: 'Playfair Display', serif; }
        .markdown-body h3:first-of-type { margin-top: 0; }
        .markdown-body p { margin-bottom: 12px; }
        .markdown-body ul { margin-left: 20px; margin-bottom: 16px; list-style-type: disc; }
        .markdown-body li { margin-bottom: 6px; padding-left: 4px; }
        .markdown-body li::marker { color: ${isDarkMode ? "#c8b89a" : "#8b7355"}; }
        .markdown-body strong { font-weight: 700; color: ${isDarkMode ? '#fff' : '#000'}; }
      `}</style>
      {/* LEFT SIDEBAR — fixed, no scroll (Only in Seller Studio) */}
      {appMode === "seller" && (
        <div style={{
          width: 56,
          height: "100vh",
          background: isDarkMode ? "#0f0f10" : "#ffffff",
          borderRight: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "14px 0",
          gap: 4,
          flexShrink: 0,
          position: "relative",
          zIndex: 10,
          boxShadow: isDarkMode ? "none" : "2px 0 10px rgba(0,0,0,0.02)"
        }}>
          {/* Official Logo */}
          <div style={{ marginBottom: 20, padding: "0 10px" }}>
            <img src="/sera-logo.png" alt="SERA" style={{ width: 32, height: 32, borderRadius: 8 }} />
          </div>
          {NAV_ICONS.filter(nav => nav.id !== 'settings' && nav.id !== 'channels').map(({ id, icon }) => (
            <button
              key={id}
              className={`nav-btn${activeNav === id ? " active" : ""}`}
              onClick={() => setActiveNav(id)}
              title={id.charAt(0).toUpperCase() + id.slice(1)}
            >
              {icon}
            </button>
          ))}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {/* Bottom Channels (Bell) Icon */}
            <button
              className={`nav-btn${activeNav === 'channels' ? " active" : ""}`}
              onClick={() => setActiveNav('channels')}
              title="Channels"
            >
              {NAV_ICONS.find(n => n.id === 'channels').icon}
            </button>
            {/* Bottom Settings Icon */}
            <button
              className={`nav-btn${activeNav === 'settings' ? " active" : ""}`}
              onClick={() => setActiveNav('settings')}
              title="Settings"
            >
              {NAV_ICONS.find(n => n.id === 'settings').icon}
            </button>
          </div>
        </div>
      )}
      {/* MAIN STORE AREA — scrollable */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        height: "100vh",
        background: t.bg,
      }}>
        {/* Top bar */}
        <div style={{
          position: "sticky",
          top: 0,
          background: isDarkMode ? "rgba(15, 15, 16, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          padding: "0 24px",
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? "#c8b89a" : "#8b7355", letterSpacing: 0.5 }}>SERA</span>
            <span style={{ fontSize: 11, color: isDarkMode ? "#6b6b75" : "#9ca3af", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", padding: "2px 8px", borderRadius: 4 }}>AI Agent Commerce OS</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {appMode === "seller" && ["Studio", "Stores", "Analytics", "Channels", "Settings"].map(navLabel => (
              <button key={navLabel} onClick={() => setActiveNav(navLabel.toLowerCase())} style={{
                background: activeNav === navLabel.toLowerCase() ? (isDarkMode ? "#1e1e22" : "#e5e7eb") : "none",
                border: "none", cursor: "pointer", padding: "4px 12px", borderRadius: 6,
                fontSize: 12, color: activeNav === navLabel.toLowerCase() ? (isDarkMode ? "#c8b89a" : "#8b7355") : (isDarkMode ? "#4a4a52" : "#9ca3af"),
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                fontWeight: activeNav === navLabel.toLowerCase() ? 600 : 400
              }}
              onMouseEnter={e => { if (activeNav !== navLabel.toLowerCase()) e.currentTarget.style.color = isDarkMode ? "#c8b89a" : "#8b7355"; }}
              onMouseLeave={e => { if (activeNav !== navLabel.toLowerCase()) e.currentTarget.style.color = isDarkMode ? "#4a4a52" : "#9ca3af"; }}
              >{navLabel}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Mobile/Desktop Toggle */}
            {appMode === "seller" && (
              <div style={{ display: "flex", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", borderRadius: 6, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: 2, marginLeft: 12 }}>
                <button onClick={() => setPreviewMode("desktop")} style={{ background: previewMode === "desktop" ? (isDarkMode ? "#2a2a2e" : "#fff") : "transparent", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: previewMode === "desktop" ? t.text : t.subtext, display: "flex", alignItems: "center", boxShadow: previewMode === "desktop" && !isDarkMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }} title="Desktop View">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                </button>
                <button onClick={() => setPreviewMode("mobile")} style={{ background: previewMode === "mobile" ? (isDarkMode ? "#2a2a2e" : "#fff") : "transparent", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", color: previewMode === "mobile" ? t.text : t.subtext, display: "flex", alignItems: "center", boxShadow: previewMode === "mobile" && !isDarkMode ? "0 2px 4px rgba(0,0,0,0.05)" : "none" }} title="Mobile View">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" /></svg>
                </button>
              </div>
            )}
            {/* Dark/Light Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                marginLeft: 12,
                background: isDarkMode ? "#1a1a1e" : "#f3f4f6",
                border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                borderRadius: 6,
                width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                color: isDarkMode ? "#fbbf24" : "#6366f1"
              }}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>
            {/* Publish Button */}
            {appMode === "seller" && (
              <button
                onClick={async () => {
                  setIsPublishing(true);
                  try {
                    const productsList = storeSchema.layout?.find(s => s.type === "featured_products")?.props?.products || storeSchema.products || [];
                    const heroTitle = storeSchema.layout?.find(s => s.type === "hero")?.props?.title;
                    const metaName = storeSchema.metadata?.brand_identity;
                    const storeName = storeSchema.name || metaName || heroTitle || "Unknown Brand";
                    const storeCategory = storeSchema.category || storeSchema.metadata?.category || storeSchema.metadata?.industry || "General Store";
                    const payload = {
                      session_id: "guest_default",
                      store_id: storeSchema.id,
                      name: storeName,
                      store_name: storeName,
                      category: storeCategory,
                      branding: {
                        heroImage: heroImage || storeSchema.layout?.find(s => s.type === "hero")?.props?.heroImage || "",
                        philosophy: storeSchema.layout?.find(s => s.type === "philosophy")?.props?.items || []
                      },
                      products: productsList,
                      type: "seller"
                    };
                    const res = await publishStore(payload);
                    if (!res.success) {
                      throw new Error(res.error || "Unknown error");
                    }
                    // Backend generated the real store ID in MongoDB!
                    const finalStoreId = res.store_id;
                    setIsPublishing(false);
                    setIsPublished(true);
                    const updatedSchema = { ...storeSchema, id: finalStoreId };
                    setPublishedSchema(updatedSchema);
                    // Persist ID to prevent duplicate stores on republish
                    setStoreSchema(updatedSchema);
                    setUserStores(prev => {
                      const existingIndex = storeSchema.id ? prev.findIndex(s => s.id === storeSchema.id) : -1;
                      const newStoreObj = {
                        id: finalStoreId,
                        name: storeName,
                        category: storeCategory,
                        logo: "",
                        cover: storeSchema.layout?.find(s => s.type === "hero")?.props?.heroImage || "",
                        trustScore: "99.9%",
                        followers: "1.2K",
                        desc: storeSchema.layout?.find(s => s.type === "hero")?.props?.subtitle || "Advanced botanical skincare crafted for autonomous commerce excellence.",
                        isUserStore: true,
                        customSchema: storeSchema,
                        storeData: storeData
                      };
                      if (existingIndex >= 0) {
                        const next = [...prev];
                        next[existingIndex] = newStoreObj;
                        return next;
                      } else {
                        return [...prev, newStoreObj];
                      }
                    });
                    setShowPublishedModal(true);
                    // Bulletproof Confetti via Raw DOM
                    setTimeout(() => {
                      try {
                        const canvas = document.createElement('canvas');
                        canvas.style.position = 'fixed';
                        canvas.style.inset = '0';
                        canvas.style.width = '100vw';
                        canvas.style.height = '100vh';
                        canvas.style.zIndex = '999999';
                        canvas.style.pointerEvents = 'none';
                        document.body.appendChild(canvas);
                        const myConfetti = confetti.create(canvas, { resize: true, useWorker: false });
                        myConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } }).then(() => {
                          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                        });
                      } catch (e) {
                        console.error("Confetti error", e);
                      }
                    }, 50);
                  } catch (err) {
                    console.error("Publish failed:", err);
                    alert("Failed to publish store: " + err.message);
                    setIsPublishing(false);
                  }
                }}
                style={{
                  marginLeft: 8, background: "#c8b89a", color: "#0f0f10", border: "none",
                  borderRadius: 6, padding: "4px 12px", cursor: "pointer",
                  fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
                }}
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {/* Flip Mode Toggle Button (Modern Minimalist Pill) */}
            <button
              onClick={() => setAppMode(prev => prev === "buyer" ? "seller" : "buyer")}
              style={{
                marginLeft: 12,
                background: appMode === "buyer" ? (isDarkMode ? "#2a2a2e" : "#e5e7eb") : (isDarkMode ? "#1a1a1e" : "#f3f4f6"),
                border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                color: appMode === "buyer" ? t.text : t.subtext,
                borderRadius: 20,
                padding: "4px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease"
              }}
              title={`Current Mode: ${appMode === "buyer" ? "Buyer Discovery" : "Seller Studio"}. Click to switch.`}
            >
              {appMode === "buyer" ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transition: "all 0.3s ease" }}>
                    <rect x="2" y="6" width="20" height="12" rx="6"></rect>
                    <circle cx="8" cy="12" r="4" fill="currentColor"></circle>
                  </svg>
                  <span style={{ color: t.text, fontWeight: 700 }}>Buyer</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ transition: "all 0.3s ease" }}>
                    <rect x="2" y="6" width="20" height="12" rx="6"></rect>
                    <circle cx="16" cy="12" r="4" fill="currentColor"></circle>
                  </svg>
                  <span style={{ color: t.text, fontWeight: 700 }}>Studio</span>
                </>
              )}
            </button>
            {/* Open chat button (only shows when chat is hidden) */}
            {!chatOpen && (
              <button onClick={() => setChatOpen(true)} style={{
                marginLeft: 8, background: isDarkMode ? "#1a1a1e" : "#f3f4f6", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                color: isDarkMode ? "#c8b89a" : "#82693f", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                fontWeight: 600
              }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Open SERA
              </button>
            )}
          </div>
        </div>
        {/* SELLER MODE: Studio Views */}
        {appMode === "seller" && (
          <>
            {/* STORES TAB: Multi-Store Management Grid */}
            <div style={{ display: activeNav === "stores" ? "block" : "none", padding: "40px 28px", maxWidth: 1200, margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.text, marginBottom: 8 }}>My Storefronts</h1>
                  <p style={{ fontSize: 13, color: t.subtext }}>Manage your autonomous AI commerce storefronts or launch a new brand in the Studio.</p>
                </div>
                <button
                  onClick={() => {
                    setStoreSchema({
                      metadata: { brand_identity: "New AI Store", objective: "Autonomous Commerce" },
                      theme: { themeColor: "#c8b89a", heroBg: "linear-gradient(135deg, #111113 0%, #1a1a1e 100%)", isDarkMode: true, fontFamily: "'Playfair Display', serif" },
                      layout: [],
                      testimonials: [], faq: [], footer: { about: "Powered by SERA AI Agent Commerce OS.", links: ["Shop All", "About Us", "Contact"] }, heroStyles: { height: "500px", padding: "60px 40px", textAlign: "center" }
                    });
                    setActiveNav("studio");
                  }}
                  style={{
                    background: "#c8b89a", color: "#0f0f10", border: "none", borderRadius: 8, padding: "10px 20px",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
                  }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  Create New Store in Studio
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                {userStores.map(store => (
                  <div
                    key={store.id}
                    style={{
                      background: isDarkMode ? "#161618" : "#fff",
                      border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                      borderRadius: 16, overflow: "hidden", transition: "all 0.3s",
                      display: "flex", flexDirection: "column"
                    }}
                  >
                    <div style={{ height: 180, position: "relative", background: isDarkMode ? "#111" : "#e5e7eb" }}>
                      {store.cover ? (
                        <img src={store.cover} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: isDarkMode ? "linear-gradient(135deg, #1a1a1e 0%, #000 100%)" : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="32" height="32" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                      )}
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "#c8b89a", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12, border: "1px solid rgba(200,184,154,0.3)" }}>
                         Live Ecosystem
                      </div>
                    </div>
                    <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: t.text, marginBottom: 4 }}>{store.name}</h3>
                      <p style={{ fontSize: 12, color: "#c8b89a", marginBottom: 12, fontWeight: 600 }}>{store.category}</p>
                      <p style={{ fontSize: 12, color: t.subtext, marginBottom: 20, flex: 1, lineHeight: 1.5 }}>{store.desc}</p>
                      <div style={{ display: "flex", gap: 12, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
                        <button
                          onClick={() => {
                            setStoreSchema({ ...store.customSchema, id: store.id });
                            setActiveNav("studio");
                          }}
                          style={{
                            flex: 1, background: isDarkMode ? "#222226" : "#f3f4f6", color: t.text, border: "none",
                            borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = isDarkMode ? "#2a2a30" : "#e5e7eb"}
                          onMouseLeave={e => e.currentTarget.style.background = isDarkMode ? "#222226" : "#f3f4f6"}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                          Edit in Studio
                        </button>
                        <button
                          onClick={() => {
                            if (userStores.length <= 1) {
                              alert("You must keep at least one active store.");
                              return;
                            }
                            if (window.confirm(`Are you sure you want to delete ${store.name}?`)) {
                              setUserStores(prev => prev.filter(s => s.id !== store.id));
                            }
                          }}
                          style={{
                            background: "transparent", color: "#f87171", border: `1px solid ${isDarkMode ? "#333338" : "#e5e7eb"}`,
                            borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center"
                          }}
                          title="Delete Store"
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* STUDIO TAB: Active AI Creation Sandbox */}
            <div style={{ display: activeNav === "studio" ? "flex" : "none", padding: previewMode === "mobile" ? "40px 0" : "0", background: previewMode === "mobile" ? (isDarkMode ? "#0a0a0c" : "#f3f4f6") : "transparent", justifyContent: "center" }}>
              <div style={{
                width: previewMode === "mobile" ? 375 : "100%",
                height: previewMode === "mobile" ? 812 : "auto",
                minHeight: previewMode === "mobile" ? 812 : "100vh",
                overflowY: previewMode === "mobile" ? "auto" : "visible",
                backgroundColor: isDarkMode ? "#0f0f10" : "#ffffff",
                backgroundImage: (storeSchema.layout.length === 0 && buildingStage === 0)
                  ? (isDarkMode ? "radial-gradient(rgba(200, 184, 154, 0.15) 1px, transparent 1px)" : "radial-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px)")
                  : "none",
                backgroundSize: "24px 24px",
                border: previewMode === "mobile" ? (isDarkMode ? "12px solid #1a1a1e" : "12px solid #e5e7eb") : "none",
                borderRadius: previewMode === "mobile" ? 40 : 0,
                boxShadow: previewMode === "mobile" ? "0 20px 40px rgba(0,0,0,0.5)" : "none",
                position: "relative"
              }}>
                {/* Promo Banner */}
                {storeData.promoBanner && (
                  <div style={{
                    background: "linear-gradient(90deg, #c8b89a, #e6d8b8, #c8b89a)",
                    backgroundSize: "200% auto",
                    animation: "gradientFlow 3s linear infinite",
                    padding: "12px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: "#0f0f10",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    zIndex: 20,
                    position: "relative",
                    boxShadow: "0 4px 15px rgba(200, 184, 154, 0.3)"
                  }}>
                    <style>{`
                @keyframes gradientFlow {
                  0% { background-position: 0% center; }
                  100% { background-position: 200% center; }
                }
              `}</style>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    {storeData.promoBanner.toUpperCase()}
                    <div style={{
                      position: "absolute", right: 16, cursor: "pointer", opacity: 0.6, display: "flex", alignItems: "center"
                    }} onClick={() => setStoreData(p => ({ ...p, promoBanner: "" }))} title="Tutup">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </div>
                  </div>
                )}
                {/* Canvas: idle/empty state handled by parent background */}
                {/* Canvas skeleton removed — real layout renders immediately from schema_preview */}
                {storeSchema.layout.length === 0 && (isTyping || buildingStage > 0) && (() => {
                  const sk = isDarkMode ? "linear-gradient(90deg,#1a1a1e 25%,#252528 50%,#1a1a1e 75%)" : "linear-gradient(90deg,#e5e7eb 25%,#d1d5db 50%,#e5e7eb 75%)";
                  const skStyle = { backgroundImage: sk, backgroundSize: "200% 100%", animation: "shimmer 1.8s infinite linear", borderRadius: 8 };
                  const stage = buildingStage;
                  return (
                    <div style={{ background: "transparent", minHeight: 600 }}>
                      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} @keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>

                      {/* Hero skeleton — always visible once SERA starts */}
                      <div style={{ margin: "0 32px 24px", height: 240, background: isDarkMode ? "#121214" : "#ffffff", borderRadius: 16, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, overflow: "hidden", position: "relative" }}>
                        <div style={{ ...skStyle, width: "28%", height: 8 }} />
                        <div style={{ ...skStyle, width: "52%", height: 36, borderRadius: 6 }} />
                        <div style={{ ...skStyle, width: "42%", height: 12 }} />
                        <div style={{ ...skStyle, width: 130, height: 40, borderRadius: 24, opacity: stage >= 2 ? 1 : 0.3, transition: "opacity 0.5s", backgroundImage: stage >= 3 ? "none" : sk, backgroundColor: stage >= 3 ? "rgba(200,184,154,0.3)" : "transparent" }} />
                      </div>
                      {/* Product grid — reveals when layout design step starts */}
                      <div style={{ padding: "0 32px 24px", opacity: stage >= 3 ? 1 : 0, transition: "opacity 0.6s" }}>
                        <div style={{ ...skStyle, width: 180, height: 14, marginBottom: 18 }} />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <div key={i} style={{ opacity: stage >= 4 ? 1 : i < 3 ? 0.7 : 0.3, transition: `opacity 0.4s ${i * 0.08}s` }}>
                              <div style={{ ...skStyle, height: 160, borderRadius: 10, marginBottom: 10 }} />
                              <div style={{ ...skStyle, width: "75%", height: 11, marginBottom: 7 }} />
                              <div style={{ ...skStyle, width: "40%", height: 11 }} />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Philosophy strip — reveals on final asset generation step */}
                      <div style={{ padding: "0 32px 32px", display: "flex", gap: 16, opacity: stage >= 4 ? 1 : 0, transition: "opacity 0.6s 0.2s" }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ flex: 1, height: 120, borderRadius: 12, ...skStyle, opacity: 0.5 + i * 0.15 }} />
                        ))}
                      </div>
                    </div>
                  );
                })()}
                <DynamicRenderer
                  layout={storeSchema.layout}
                  globalProps={{
                    onSelectProduct: (prod) => {
                      setSelectedProductDetail({ name: prod.name, price: prod.price, desc: prod.desc || "Premium curated item.", imageUrl: prod.image, store: prod.store || "Store", rating: prod.rating || 4.8, sales: prod.sales || 120 });
                      if(setModalQty) setModalQty(1);
                    },
                    products,
                    items: philosophy,
                    ...storeData,
                    themeColor,
                    heroBg,
                    heroImage,
                    isDarkMode,
                    isBuilding: buildingStage > 0,
                    testimonials,
                    faq,
                    footerData,
                    heroStyles,
                    onSelectProduct: (prod) => {
                      setSelectedProductDetail(prod);
                      setModalQty(1);
                    },
                    onSelectPhilosophy: (philo) => {
                      setSelectedPhilosophy(philo);
                    }
                  }}
                />                {/* Draft Proposal Overlay removed to favor interactive Chat UI proposal cards */}
                {/* End Dynamic Layout */}
              </div>
            </div>
            {/* Analytics content (Enhanced) */}
            <div style={{ display: activeNav === "analytics" ? "block" : "none", padding: "40px 28px", paddingBottom: "100px", animation: "fadeIn 0.5s ease-out" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: t.text, marginBottom: 4 }}>Store Analytics</h2>
                  <p style={{ fontSize: 14, color: t.subtext }}>Monitor your real-time store performance and agent AI insights.</p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <select
                    value={activeAnalyticsStoreId}
                    onChange={e => setActiveAnalyticsStoreId(e.target.value)}
                    style={{ background: isDarkMode ? "#0f0f10" : "#ffffff", color: t.text, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "8px 16px", borderRadius: 8, fontSize: 14, outline: "none", cursor: "pointer" }}
                  >
                    {userStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button style={{ background: isDarkMode ? "#0f0f10" : "#ffffff", color: t.text, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Last 30 Days
                  </button>
                  <button style={{ background: themeColor, color: "#0f0f10", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Export Report
                  </button>
                </div>
              </div>
              {/* Top KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
                {[
                  { label: "Total Revenue", value: analyticsData?.summary?.total_revenue ? `$${analyticsData.summary.total_revenue.toLocaleString()}` : "$0", trend: analyticsData?.summary?.total_revenue ? "+15.3%" : "0%", up: true, icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
                  { label: "Products Tracked", value: analyticsData?.summary?.total_products || "0", trend: analyticsData?.summary?.total_products ? "+8.2%" : "0%", up: true, icon: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></> },
                  { label: "Avg Conversion", value: analyticsData?.summary?.avg_conversion ? `${(analyticsData.summary.avg_conversion * 100).toFixed(1)}%` : "0%", trend: analyticsData?.summary?.avg_conversion ? "-1.1%" : "0%", up: false, icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /> },
                  { label: "Healthy Products", value: analyticsData?.summary?.healthy || "0", trend: analyticsData?.summary?.healthy ? "+45%" : "0%", up: true, icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
                ].map((kpi, i) => (
                  <div key={i} style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 16, padding: "24px", position: "relative", overflow: "hidden", transition: "transform 0.2s", cursor: "pointer", opacity: isLoadingAnalytics ? 0.5 : 1 }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: isDarkMode ? "#2a2a2e" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: themeColor }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{kpi.icon}</svg>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 8px", borderRadius: 20, background: kpi.trend === "0%" ? "rgba(128,128,128,0.1)" : (kpi.up ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)"), color: kpi.trend === "0%" ? t.subtext : (kpi.up ? "#4ade80" : "#ef4444"), display: "flex", alignItems: "center", gap: 4 }}>
                        {kpi.trend === "0%" ? "-" : (kpi.up ? "↑" : "↓")} {kpi.trend}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: t.subtext, marginBottom: 4, fontWeight: 500 }}>{kpi.label}</p>
                    <h3 style={{ fontSize: 28, fontWeight: 700, color: t.text, fontFamily: "'DM Sans', sans-serif" }}>{kpi.value}</h3>
                  </div>
                ))}
              </div>
              {/* Charts & Details Grid */}
              <div style={{ display: "grid", gridTemplateColumns: window.innerWidth < 1000 ? "1fr" : "2fr 1fr", gap: 24 }}>
                {/* Revenue Chart */}
                <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Revenue Overview</p>
                      <p style={{ fontSize: 12, color: t.subtext, marginTop: 4 }}>Daily performance in the last 7 days</p>
                    </div>
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 16, height: 220, paddingBottom: 20, borderBottom: `1px dashed ${t.border}`, flex: 1 }}>
                    {/* SVG Line Chart Background */}
                    <svg style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 20, width: "100%", height: "calc(100% - 20px)", zIndex: 0, overflow: "hidden" }} preserveAspectRatio="none" viewBox="0 0 600 100">
                      <path
                        d={analyticsData?.products?.length > 0 ? "M 43,100 L 43,60 C 86,60 86,30 129,30 C 172,30 172,55 214,55 C 257,55 257,10 300,10 C 343,10 343,35 386,35 C 429,35 429,15 471,15 C 514,15 514,0 557,0 L 557,100 Z" : "M 43,100 L 43,95 L 557,95 L 557,100 Z"}
                        fill={analyticsData?.products?.length > 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(128, 128, 128, 0.05)"}
                      />
                      <path
                        d={analyticsData?.products?.length > 0 ? "M 43,60 C 86,60 86,30 129,30 C 172,30 172,55 214,55 C 257,55 257,10 300,10 C 343,10 343,35 386,35 C 429,35 429,15 471,15 C 514,15 514,0 557,0" : "M 43,95 L 557,95"}
                        fill="none"
                        stroke={analyticsData?.products?.length > 0 ? "#22c55e" : "#555"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* Interactive hover columns */}
                    {(() => {
                      const fallbackChartData = [
                        { day: "W1", val: 5, rev: "$0" }, { day: "W2", val: 5, rev: "$0" },
                        { day: "W3", val: 5, rev: "$0" }, { day: "W4", val: 5, rev: "$0" }
                      ];
                      if (analyticsData?.products?.length > 0) {
                        const sums = [0, 0, 0, 0];
                        analyticsData.products.forEach(p => {
                          if (p.weekly_revenue && p.weekly_revenue.length >= 4) {
                            sums[0] += p.weekly_revenue[0];
                            sums[1] += p.weekly_revenue[1];
                            sums[2] += p.weekly_revenue[2];
                            sums[3] += p.weekly_revenue[3];
                          }
                        });
                        const max = Math.max(...sums, 1);
                        return sums.map((s, idx) => ({ day: `W${idx + 1}`, val: Math.max((s / max) * 100, 5), rev: `$${(s / 1000).toFixed(1)}k` }));
                      }
                      return fallbackChartData;
                    })().map((d, i) => (
                      <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", position: "relative", cursor: "pointer", zIndex: 1 }} className="chart-bar-container">
                        {/* Dot marker on the line */}
                        <div style={{ position: "absolute", top: `${100 - d.val}%`, marginTop: -6, width: 12, height: 12, borderRadius: "50%", background: isDarkMode ? "#161618" : "#ffffff", border: "3px solid #22c55e", opacity: 0, transition: "opacity 0.2s ease" }} className="chart-tooltip" />
                        {/* Text Tooltip */}
                        <div style={{ position: "absolute", top: `${100 - d.val}%`, marginTop: -38, opacity: 0, transition: "all 0.2s ease", fontSize: 11, fontWeight: 700, color: t.text, background: isDarkMode ? "#0f0f10" : "#ffffff", padding: "6px 10px", borderRadius: 6, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, whiteSpace: "nowrap" }} className="chart-tooltip">{d.rev}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, padding: "0 10px" }}>
                    {["Week 1", "Week 2", "Week 3", "Week 4"].map(d => (
                      <span key={d} style={{ fontSize: 12, fontWeight: 600, color: t.subtext, flex: 1, textAlign: "center" }}>{d}</span>
                    ))}
                  </div>
                </div>
                {/* AI Agent Insights */}
                <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 24 }}>AI Agent Insights</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                    <div style={{ background: "transparent", border: "none", padding: "8px 0", display: "flex", gap: 12 }}>
                      <div style={{ color: "#38bdf8", marginTop: 2 }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>High Inquiry Rate</h4>
                        <p style={{ fontSize: 12, color: t.subtext, lineHeight: 1.4 }}>The Buyer AI has successfully closed 34 sales by answering questions about your top products.</p>
                      </div>
                    </div>
                    <div style={{ background: "transparent", border: "none", padding: "8px 0", display: "flex", gap: 12 }}>
                      <div style={{ color: "#a855f7", marginTop: 2 }}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4 }}>Campaign Success</h4>
                        <p style={{ fontSize: 12, color: t.subtext, lineHeight: 1.4 }}>Your latest Flash Sale video campaign increased conversion rates by 12% in the last 2 hours.</p>
                      </div>
                    </div>
                  </div>
                  <button style={{ width: "100%", marginTop: 16, background: isDarkMode ? "#0f0f10" : "#ffffff", color: t.text, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = themeColor} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                    View Detailed Report
                  </button>
                </div>
              </div>
            </div>
            {/* Products content */}
            <div style={{ display: activeNav === "products" ? "block" : "none", padding: "40px 28px", paddingBottom: "100px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.text }}>Inventory</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: t.subtext }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input id="product-search" name="product-search" type="text" placeholder="Search products..." style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "8px 12px 8px 32px", borderRadius: 6, color: t.text, fontSize: 13, outline: "none", width: 200 }} />
                  </div>
                  <button style={{ background: isDarkMode ? "#161618" : "#ffffff", color: t.text, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    Filter
                  </button>
                  <button style={{ background: isDarkMode ? "#1e3a5f" : "#e0f2fe", color: isDarkMode ? "#93c5fd" : "#0284c7", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add Product</button>
                </div>
              </div>
              <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, overflow: "hidden" }}>
                <input
                  id="product-image-upload"
                  name="product-image-upload"
                  type="file"
                  accept="image/*"
                  ref={productImageInputRef}
                  onChange={handleProductImageUpdate}
                  style={{ display: "none" }}
                />
                {selectedProducts.length > 0 && (
                  <div style={{ padding: "12px 16px", background: isDarkMode ? "rgba(200, 184, 154, 0.1)" : "rgba(200, 184, 154, 0.2)", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: isDarkMode ? "#c8b89a" : "#9ca3af", fontWeight: 600 }}>{selectedProducts.length} products selected</span>
                    <button
                      onClick={() => {
                        const prompt = `Generate new high-quality images for these products: ${selectedProducts.join(", ")}`;
                        sendMessage(prompt);
                        setSelectedProducts([]);
                      }}
                      style={{ background: "#c8b89a", color: "#0f0f10", border: "none", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}
                    > Generate Images for Selected</button>
                  </div>
                )}
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, color: t.subtext, background: isDarkMode ? "#0f0f10" : "#ffffff" }}>
                      <th style={{ padding: "16px", width: 40, textAlign: "center" }}>
                        <input
                          id="select-all-products"
                          name="select-all-products"
                          type="checkbox"
                          checked={selectedProducts.length === products.length && products.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProducts(products.map(p => p.name));
                            else setSelectedProducts([]);
                          }}
                          style={{ accentColor: "#c8b89a", cursor: "pointer" }}
                        />
                      </th>
                      <th style={{ padding: "16px", fontWeight: 500 }}>Product</th>
                      <th style={{ padding: "16px", fontWeight: 500 }}>Price</th>
                      <th style={{ padding: "16px", fontWeight: 500 }}>Stock</th>
                      <th style={{ padding: "16px", fontWeight: 500 }}>Status</th>
                      <th style={{ padding: "16px", fontWeight: 500, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #222", background: selectedProducts.includes(p.name) ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <input
                            id={`select-product-${i}`}
                            name={`select-product-${i}`}
                            type="checkbox"
                            checked={selectedProducts.includes(p.name)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedProducts(prev => [...prev, p.name]);
                              else setSelectedProducts(prev => prev.filter(name => name !== p.name));
                            }}
                            style={{ accentColor: "#c8b89a", cursor: "pointer" }}
                          />
                        </td>
                        <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            onClick={() => {
                              setUploadingForProduct(p.name);
                              productImageInputRef.current?.click();
                            }}
                            style={{
                              width: 40, height: 40, borderRadius: 8,
                              background: `hsl(${35 + (i % 8) * 8}, ${15 + (i % 8) * 3}%, ${12 + (i % 8) * 1}%)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 18, position: "relative", overflow: "hidden",
                              cursor: "pointer", border: "1px solid #222"
                            }}
                            title="Click to change photo"
                          >
                            {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "ðŸ§´"}
                            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                              <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <p style={{ color: "#e8e6e1", fontWeight: 500 }}>{p.name}</p>
                              {p.promo && (
                                <span style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>{p.promo}</span>
                              )}
                            </div>
                            <p style={{ color: "#666", fontSize: 11, marginTop: 2 }}>{p.desc}</p>
                          </div>
                        </td>
                        <td style={{ padding: "16px", color: "#c8b89a", fontWeight: 600 }}>{p.price}</td>
                        <td style={{ padding: "16px", color: "#e8e6e1" }}>{45 + (i * 7 % 13)} in stock</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ padding: "4px 8px", background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>Active</span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              const prompt = `Regenerate a high-quality cinematic image for product: ${p.name}`;
                              sendMessage(prompt);
                            }}
                            style={{ background: "none", border: "none", color: "#c8b89a", cursor: "pointer", marginRight: 12 }}
                            title="Regenerate Image"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2v6h-6"></path><path d="M3 12a.9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                          </button>
                          <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer", marginRight: 12 }} title="Edit">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                          <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }} title="Delete">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination */}
                <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${t.border}`, background: isDarkMode ? "#111113" : "#f9fafb" }}>
                  <p style={{ fontSize: 12, color: t.subtext }}>Showing 1-{products.length} of {products.length} products</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: isDarkMode ? "#1a1a1e" : "#f3f4f6", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, color: t.subtext, padding: "6px 10px", borderRadius: 4, cursor: "not-allowed", fontSize: 12 }}>Previous</button>
                    <button style={{ background: "#c8b89a", border: "none", color: "#0f0f10", padding: "6px 12px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>1</button>
                    <button style={{ background: isDarkMode ? "#1a1a1e" : "#fff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, color: t.text, padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>Next</button>
                  </div>
                </div>
              </div>
            </div>
            {/* Promotions content (Mock) */}
            <div style={{ display: activeNav === "promotions" ? "block" : "none", padding: "40px 28px", paddingBottom: "100px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.text, marginBottom: 8 }}>Marketing & Promotions</h2>
                    <p style={{ fontSize: 14, color: t.subtext }}>Manage campaigns, creatives, and offers for your store</p>
                  </div>
                  <div style={{ paddingLeft: 24, borderLeft: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: t.subtext, letterSpacing: 0.5, marginBottom: 8 }}>TARGET STORE</p>
                    <select
                      value={storeSchema.id || ""}
                      onChange={(e) => {
                        const selectedStore = userStores.find(s => s.id === e.target.value);
                        if (selectedStore) {
                          setStoreSchema({ ...selectedStore.customSchema, id: selectedStore.id });
                        }
                      }}
                      style={{
                        background: isDarkMode ? "#0f0f10" : "#ffffff", color: t.text, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 8,
                        padding: "8px 12px", fontSize: 14, outline: "none", cursor: "pointer",
                        minWidth: 200, fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      {!storeSchema.id && <option value="">Current Active Store</option>}
                      {userStores.map((store, idx) => (
                        <option key={store.id || idx} value={store.id}>{store.name || "Untitled Store"}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button style={{ background: "#c8b89a", color: "#0f0f10", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  New Campaign
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[
                    { label: "ACTIVE CAMPAIGNS", value: "5", trend: "↑ 2 this week", trendColor: "#4ade80" },
                    { label: "TOTAL REACH", value: "12.4k", trend: "↑ 18% vs last week", trendColor: "#4ade80" },
                    { label: "CONVERSIONS", value: "342", trend: "↑ 9.2% rate", trendColor: "#4ade80" },
                    { label: "REVENUE FROM PROMOS", value: "$8.2k", trend: "↑ 24% this month", trendColor: "#4ade80" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "20px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: t.subtext, letterSpacing: 0.5, marginBottom: 12 }}>{stat.label}</p>
                      <h3 style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 8 }}>{stat.value}</h3>
                      <p style={{ fontSize: 12, color: stat.trendColor, fontWeight: 500 }}>{stat.trend}</p>
                    </div>
                  ))}
                </div>
                {/* Tabs Row */}
                <div style={{ display: "flex", gap: 4, background: isDarkMode ? "#1a1a1e" : "#f3f4f6", padding: "4px", borderRadius: 10, width: "fit-content", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                  {[
                    { id: "banner", label: "Banner", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg> },
                    { id: "discounts", label: "Discounts", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg> },
                    { id: "image", label: "Image", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg> },
                    { id: "video", label: "Video", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg> },
                    { id: "offers", label: "Offers", icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg> }
                  ].map(tab => (
                    <div
                      key={tab.id}
                      onClick={() => setActivePromoTab(tab.id)}
                      style={{
                        padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                        ...(activePromoTab === tab.id
                          ? { fontWeight: 600, background: isDarkMode ? "#161618" : "#ffffff", color: t.text, boxShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.2)" : "0 2px 4px rgba(0,0,0,0.05)", border: `1px solid ${isDarkMode ? "#333338" : "#d1d5db"}` }
                          : { fontWeight: 500, color: t.subtext, border: "1px solid transparent" })
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </div>
                  ))}
                </div>
                {/* Video Campaigns Section */}
                {activePromoTab === "video" && (
                  <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 4 }}>Video Campaigns</h3>
                        <p style={{ fontSize: 13, color: t.subtext }}>Cinematic video assets for your storefront</p>
                      </div>
                      {/* Segmented Control for Flip */}
                      <div style={{ display: "flex", background: isDarkMode ? "#121214" : "#f3f4f6", borderRadius: 8, padding: 4, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                        <div
                          onClick={() => setVideoFormat("landscape")}
                          style={{ padding: "6px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: videoFormat === "landscape" ? (isDarkMode ? "#2c2c35" : "#ffffff") : "transparent", color: videoFormat === "landscape" ? t.text : t.subtext, boxShadow: videoFormat === "landscape" ? "0 2px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}
                        >Landscape (16:9)</div>
                        <div
                          onClick={() => setVideoFormat("vertical")}
                          style={{ padding: "6px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", background: videoFormat === "vertical" ? (isDarkMode ? "#2c2c35" : "#ffffff") : "transparent", color: videoFormat === "vertical" ? t.text : t.subtext, boxShadow: videoFormat === "vertical" ? "0 2px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}
                        >Vertical (9:16)</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                      {/* LEFT SIDE: Preview */}
                      <div style={{ flex: "1", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280, position: "relative" }}>
                        {videoFormat === "landscape" ? (
                          // Landscape Preview
                          <div style={{ width: "100%", aspectRatio: "16/9", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", borderRadius: 12, overflow: "hidden", position: "relative", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                            {storeData.storeVideo ? (
                              <video src={storeData.storeVideo} autoPlay loop muted style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
                            ) : (
                              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: t.subtext }}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 8 }}><rect x="2" y="6" width="20" height="12" rx="2" ry="2" /><path d="M10 10l5 2-5 2v-4z" /></svg>
                                <span style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>No Video</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Vertical Preview — Buyer-style card
                          <div style={{ height: 340, aspectRatio: "9/16", borderRadius: 16, overflow: "hidden", position: "relative", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", cursor: "pointer", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                            {storeData.promoVideo ? (
                              <>
                                <video src={storeData.promoVideo} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                {/* Gradient overlay */}
                                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 45%)" }} />
                                {/* LIVE badge */}
                                <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.85)", backdropFilter: "blur(6px)", padding: "4px 10px", borderRadius: 100, border: "1px solid rgba(239,68,68,0.4)" }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
                                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>Live</span>
                                </div>
                                {/* Bottom info */}
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 16px 20px" }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, color: themeColor, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Promo Campaign</span>
                                  <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 10, lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}>
                                    {storeSchema?.metadata?.brand_identity || storeData.title || "My Store"}
                                  </h3>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>Special Campaign</span>
                                    <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 700, background: "rgba(74,222,128,0.15)", padding: "4px 10px", borderRadius: 8, backdropFilter: "blur(4px)", border: "1px solid rgba(74,222,128,0.3)" }}>View Store</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: t.subtext, background: isDarkMode ? "#1a1a1e" : "#e5e7eb" }}>
                                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 10, opacity: 0.5 }}><rect x="6" y="2" width="12" height="20" rx="2" ry="2" /><path d="M10 10l5 2-5 2v-4z" /></svg>
                                <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, opacity: 0.5 }}>No Video</span>
                                <span style={{ fontSize: 10, color: t.subtext, marginTop: 6, opacity: 0.4 }}>Upload or generate a 9:16 video</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* RIGHT SIDE: Tools & Controls */}
                      <div style={{ flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        {videoFormat === "landscape" ? (
                          // Landscape Tools
                          <div style={{ border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, background: isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: storeData.storeVideo ? "rgba(200, 184, 154, 0.1)" : "transparent", padding: "4px 10px", borderRadius: 100, border: storeData.storeVideo ? `1px solid #c8b89a` : `1px solid ${t.border}`, marginBottom: 16 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: storeData.storeVideo ? "#c8b89a" : t.subtext }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: storeData.storeVideo ? "#c8b89a" : t.subtext, textTransform: "uppercase", letterSpacing: 1 }}>{storeData.storeVideo ? "Active Banner" : "Inactive"}</span>
                            </div>
                            <h4 style={{ fontSize: 20, fontWeight: 600, color: t.text, fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>Storefront Banner Video</h4>
                            <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6, marginBottom: 24 }}>
                              A cinematic 16:9 landscape video that spans across the top of your boutique, creating an immersive first impression for your buyers.
                            </p>
                            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                              <label style={{ flex: 1, background: isDarkMode ? "#2c2c35" : "#e5e7eb", color: t.text, border: "none", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }} onMouseEnter={e => e.target.style.background = isDarkMode ? "#3c3c45" : "#d1d5db"} onMouseLeave={e => e.target.style.background = isDarkMode ? "#2c2c35" : "#e5e7eb"}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Upload Video
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime"
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const url = URL.createObjectURL(e.target.files[0]);
                                      setStoreData(p => {
                                        const currentList = p.storeVideos || (p.storeVideo ? [p.storeVideo] : []);
                                        return { ...p, storeVideo: url, storeVideos: [...currentList, url] };
                                      });
                                    }
                                  }}
                                />
                              </label>
                              <button
                                onClick={() => setStoreData(p => {
                                  const url = "https://www.w3schools.com/html/mov_bbb.mp4";
                                  const currentList = p.storeVideos || (p.storeVideo ? [p.storeVideo] : []);
                                  return { ...p, storeVideo: url, storeVideos: [...currentList, url] };
                                })}
                                style={{ flex: 1, background: isDarkMode ? "#2c2c35" : "#e5e7eb", color: t.text, border: "none", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}
                                onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3c3c45" : "#d1d5db"}
                                onMouseLeave={(e) => e.target.style.background = isDarkMode ? "#2c2c35" : "#e5e7eb"}
                              >
                                <span></span> Generate AI
                              </button>
                              {storeData.storeVideo && (
                                <button
                                  onClick={() => setStoreData(p => ({ ...p, storeVideo: "" }))}
                                  style={{ background: "transparent", color: "#ef4444", border: `1px solid rgba(239, 68, 68, 0.3)`, padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                                  onMouseEnter={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                                >
                                  Disable
                                </button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, minHeight: 70 }}>
                              {(storeData.storeVideos || (storeData.storeVideo ? [storeData.storeVideo] : [])).map((vid, idx) => (
                                <div key={idx} style={{ position: "relative", width: 120, height: 68, borderRadius: 8, overflow: "hidden", border: storeData.storeVideo === vid ? `2px solid #c8b89a` : `1px solid ${t.border}`, flexShrink: 0, cursor: "pointer", background: "#000" }} onClick={() => setStoreData(p => ({ ...p, storeVideo: vid }))}>
                                  <video src={vid} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                                  <button onClick={(e) => { e.stopPropagation(); setStoreData(p => { const nv = (p.storeVideos || []).filter(v => v !== vid); return { ...p, storeVideos: nv, storeVideo: p.storeVideo === vid ? (nv[0] || "") : p.storeVideo }; }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // Vertical Tools
                          <div style={{ border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, background: isDarkMode ? "rgba(255,255,255,0.02)" : "#ffffff" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: storeData.promoVideo ? "rgba(200, 184, 154, 0.1)" : "transparent", padding: "4px 10px", borderRadius: 100, border: storeData.promoVideo ? `1px solid #c8b89a` : `1px solid ${t.border}`, marginBottom: 16 }}>
                              <div style={{ width: 6, height: 6, borderRadius: "50%", background: storeData.promoVideo ? "#c8b89a" : t.subtext }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: storeData.promoVideo ? "#c8b89a" : t.subtext, textTransform: "uppercase", letterSpacing: 1 }}>{storeData.promoVideo ? "Active Promo" : "Inactive"}</span>
                            </div>
                            <h4 style={{ fontSize: 20, fontWeight: 600, color: t.text, fontFamily: "'Playfair Display', serif", marginBottom: 12 }}>Featured Promo Campaign</h4>
                            <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6, marginBottom: 24 }}>
                              A modern 9:16 vertical video designed for high engagement. Appears in the Buyer Feed and the "Trending Now" section of your store.
                            </p>
                            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                              <label style={{ flex: 1, background: t.text, color: t.bg, border: "none", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "opacity 0.2s" }} onMouseEnter={e => e.target.style.opacity = 0.8} onMouseLeave={e => e.target.style.opacity = 1}>
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                Upload Video
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime"
                                  style={{ display: "none" }}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const url = URL.createObjectURL(e.target.files[0]);
                                      setStoreData(p => {
                                        const currentList = p.promoVideos || (p.promoVideo ? [p.promoVideo] : []);
                                        return { ...p, promoVideo: url, promoVideos: [...currentList, url] };
                                      });
                                    }
                                  }}
                                />
                              </label>
                              <button
                                onClick={() => setStoreData(p => {
                                  const url = "https://www.w3schools.com/html/mov_bbb.mp4";
                                  const currentList = p.promoVideos || (p.promoVideo ? [p.promoVideo] : []);
                                  return { ...p, promoVideo: url, promoVideos: [...currentList, url] };
                                })}
                                style={{ flex: 1, background: isDarkMode ? "#2c2c35" : "#e5e7eb", color: t.text, border: "none", padding: "12px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}
                                onMouseEnter={(e) => e.target.style.background = isDarkMode ? "#3c3c45" : "#d1d5db"}
                                onMouseLeave={(e) => e.target.style.background = isDarkMode ? "#2c2c35" : "#e5e7eb"}
                              >
                                <span></span> Generate AI
                              </button>
                              {storeData.promoVideo && (
                                <button
                                  onClick={() => setStoreData(p => ({ ...p, promoVideo: "" }))}
                                  style={{ background: "transparent", color: "#ef4444", border: `1px solid rgba(239, 68, 68, 0.3)`, padding: "12px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                                  onMouseEnter={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
                                  onMouseLeave={(e) => e.target.style.background = "transparent"}
                                >
                                  Disable
                                </button>
                              )}
                            </div>
                            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, minHeight: 110 }}>
                              {(storeData.promoVideos || (storeData.promoVideo ? [storeData.promoVideo] : [])).map((vid, idx) => (
                                <div key={idx} style={{ position: "relative", width: 68, height: 120, borderRadius: 8, overflow: "hidden", border: storeData.promoVideo === vid ? `2px solid #c8b89a` : `1px solid ${t.border}`, flexShrink: 0, cursor: "pointer", background: "#000" }} onClick={() => setStoreData(p => ({ ...p, promoVideo: vid }))}>
                                  <video src={vid} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                                  <button onClick={(e) => { e.stopPropagation(); setStoreData(p => { const nv = (p.promoVideos || []).filter(v => v !== vid); return { ...p, promoVideos: nv, promoVideo: p.promoVideo === vid ? (nv[0] || "") : p.promoVideo }; }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Social Media Banner */}
                    <div style={{ background: isDarkMode ? "rgba(168, 85, 247, 0.1)" : "rgba(168, 85, 247, 0.05)", border: isDarkMode ? "1px solid rgba(168, 85, 247, 0.2)" : "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 12, padding: "20px", display: "flex", gap: 16, alignItems: "center", marginTop: 24 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(168, 85, 247, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="24" height="24" fill="none" stroke="#a855f7" strokeWidth="2" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#a855f7", marginBottom: 4 }}>Social Media Publishing — Coming Next</h4>
                        <p style={{ fontSize: 13, color: t.subtext, lineHeight: 1.5 }}>Publish directly to TikTok, Instagram Reels, and YouTube Shorts. SERA will auto-generate captions and hashtags for each platform.</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Image Campaigns Section */}
                {activePromoTab === "image" && (
                  <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 4 }}>Image Campaigns</h3>
                        <p style={{ fontSize: 13, color: t.subtext }}>High-resolution creatives for your store & ads</p>
                      </div>
                      <button style={{ background: "none", color: "#c8b89a", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Upload Image</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ background: isDarkMode ? "#1a1a1e" : "#f9fafb", borderRadius: 12, overflow: "hidden", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, height: 200, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                          <svg width="32" height="32" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Active Banner Control */}
                {activePromoTab === "banner" && (
                  <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 4 }}>Top Banner Announcement</h3>
                        <p style={{ fontSize: 12, color: t.subtext }}>Displays a promotional message at the top of your live store.</p>
                      </div>
                      <div style={{ width: 36, height: 20, background: storeData.promoBanner ? "#4ade80" : (isDarkMode ? "#333" : "#d1d5db"), borderRadius: 20, position: "relative", cursor: "pointer" }} onClick={() => setStoreData(p => ({ ...p, promoBanner: p.promoBanner ? "" : "Flash Sale: Diskon 20% Hari Ini!" }))}>
                        <div style={{ width: 16, height: 16, background: storeData.promoBanner ? "#0f0f10" : (isDarkMode ? "#888" : "#fff"), borderRadius: "50%", position: "absolute", [storeData.promoBanner ? "right" : "left"]: 2, top: 2, transition: "all 0.2s ease" }} />
                      </div>
                    </div>
                    <input
                      id="promo-banner-text"
                      name="promo-banner-text"
                      type="text"
                      value={storeData.promoBanner}
                      onChange={(e) => setStoreData(p => ({ ...p, promoBanner: e.target.value }))}
                      placeholder="Enter banner text here to activate..."
                      style={{ width: "100%", background: isDarkMode ? "#0f0f10" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, padding: "10px 14px", borderRadius: 6, color: t.text, fontSize: 13, outline: "none", opacity: storeData.promoBanner ? 1 : 0.5, pointerEvents: storeData.promoBanner ? "auto" : "none" }}
                    />
                  </div>
                )}
                {/* Discount Codes */}
                {activePromoTab === "discounts" && (
                  <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>Discount Codes</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                      {[
                        { code: "GLOWUP20", discount: "20% OFF", uses: "142 / 500", status: "Active" },
                        { code: "WELCOME10", discount: "10% OFF", uses: "89 / âˆž", status: "Active" },
                        { code: "FREESHIP", discount: "Free Shipping", uses: "312 / âˆž", status: "Active" },
                      ].map((promo, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: isDarkMode ? "#0f0f10" : "#ffffff", borderRadius: 8, border: `1px dashed ${t.border}` }}>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#c8b89a", letterSpacing: 1, marginBottom: 4 }}>{promo.code}</p>
                            <p style={{ fontSize: 11, color: t.subtext }}>{promo.discount} • {promo.uses} uses</p>
                          </div>
                          <span style={{ padding: "4px 8px", background: "rgba(74, 222, 128, 0.1)", color: "#4ade80", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{promo.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Product Specific Offers */}
                {activePromoTab === "offers" && (
                  <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px", animation: "fadeIn 0.3s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text }}>Product Offers</h3>
                      <button style={{ background: "none", color: "#c8b89a", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add Offer</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {products.filter(p => p.promo).map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 0 0", background: isDarkMode ? "#0f0f10" : "#ffffff", borderRadius: 8, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {(() => {
                              const imgUrl = p.verifiedUrl || p.imageUrl || p.image;
                              return imgUrl ? (
                                <img src={imgUrl} alt={p.name} style={{ width: 72, height: 72, minWidth: 72, minHeight: 72, flexShrink: 0, objectFit: "cover", borderRight: `1px solid ${t.border}` }} />
                              ) : (
                                <div style={{ width: 72, height: 72, minWidth: 72, minHeight: 72, flexShrink: 0, background: isDarkMode ? "#2a2a2e" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, borderRight: `1px solid ${t.border}` }}>ðŸ›ï¸</div>
                              );
                            })()}
                            <div style={{ padding: "12px 0" }}>
                              <p style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{p.name}</p>
                              <p style={{ fontSize: 12, color: t.subtext }}>Original: {p.price}</p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>{p.promo}</span>
                            <button style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", padding: 4 }} title="Remove Promo">
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Settings content (Mock) */}
            <div style={{ display: activeNav === "settings" ? "block" : "none", padding: "40px 28px", paddingBottom: "100px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.text, marginBottom: 24 }}>Store Settings</h2>
              {/* Settings Sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Brand Identity */}
                <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>Brand Identity</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                    <div>
                      <p style={{ fontSize: 12, color: t.subtext, marginBottom: 8 }}>Primary Color</p>
                      <div style={{ display: "flex", gap: 10 }}>
                        {["#c8b89a", "#3b82f6", "#ef4444", "#10b981", (isDarkMode ? "#e8e6e1" : "#1f2937")].map((c, i) => (
                          <div key={i} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: i === 0 ? `2px solid ${isDarkMode ? "#fff" : "#000"}` : "2px solid transparent" }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: t.subtext, marginBottom: 8 }}>Typography</p>
                      <select style={{ width: "100%", background: isDarkMode ? "#0f0f10" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, color: t.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, outline: "none" }}>
                        <option>DM Sans & Playfair</option>
                        <option>Inter & Merriweather</option>
                        <option>Roboto & Lora</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* AI Assistant Preferences */}
                <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>AI Assistant Preferences</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 12, color: t.subtext, marginBottom: 8 }}>Tone of Voice (For product descriptions)</p>
                      <select style={{ width: "100%", background: isDarkMode ? "#0f0f10" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, color: t.text, padding: "8px 12px", borderRadius: 6, fontSize: 13, outline: "none" }}>
                        <option>Elegant & Premium</option>
                        <option>Minimalist & Clean</option>
                        <option>Friendly & Playful</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isDarkMode ? "#0f0f10" : "#ffffff", borderRadius: 6, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                      <div>
                        <p style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>Auto-generate SEO Tags</p>
                        <p style={{ fontSize: 11, color: t.subtext }}>Let AI optimize product tags for search engines.</p>
                      </div>
                      <div style={{ width: 36, height: 20, background: "#c8b89a", borderRadius: 20, position: "relative", cursor: "pointer" }}>
                        <div style={{ width: 16, height: 16, background: "#0f0f10", borderRadius: "50%", position: "absolute", right: 2, top: 2 }} />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Integrations */}
                <div style={{ background: isDarkMode ? "#161618" : "#ffffff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 12, padding: "24px" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: t.text, marginBottom: 16 }}>Integrations</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                      { name: "Stripe", desc: "Payment Gateway", active: true },
                      { name: "PayPal", desc: "Payment Gateway", active: false },
                      { name: "Instagram", desc: "Social Shopping", active: true },
                      { name: "TikTok", desc: "Social Shopping", active: false },
                    ].map((intg, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: isDarkMode ? "#0f0f10" : "#ffffff", borderRadius: 6, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                        <div>
                          <p style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{intg.name}</p>
                          <p style={{ fontSize: 11, color: t.subtext }}>{intg.desc}</p>
                        </div>
                        <div style={{ width: 36, height: 20, background: intg.active ? "#4ade80" : (isDarkMode ? "#333" : "#d1d5db"), borderRadius: 20, position: "relative", cursor: "pointer" }}>
                          <div style={{ width: 16, height: 16, background: intg.active ? "#0f0f10" : (isDarkMode ? "#888" : "#fff"), borderRadius: "50%", position: "absolute", [intg.active ? "right" : "left"]: 2, top: 2 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        {/* BUYER MODE: Center Content Discovery Area */}
        
      </div>
      {/* RIGHT CHAT PANEL — closeable, messages scrollable */}
      {chatOpen && appMode === "seller" && (
        <div style={{
          width: chatWidth,
          position: "relative",
          height: "100vh",
          background: isDarkMode ? "#0f0f10" : "#ffffff",
          borderLeft: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: isDarkMode ? "none" : "-2px 0 10px rgba(0,0,0,0.02)"
        }}>
          {/* Resizer Handle */}
          <div
            onMouseDown={startResizing}
            style={{
              position: "absolute",
              top: 0,
              left: -4,
              width: 8,
              height: "100%",
              cursor: "col-resize",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{
              width: 1,
              height: "100%",
              background: isResizing ? "#c8b89a" : "rgba(255, 255, 255, 0.05)",
              transition: "background 0.2s",
            }} />
          </div>
          {/* Chat header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: isDarkMode ? "#c8b89a" : "#8b7355" }}>SERA</p>
                <p style={{ fontSize: 10, color: isDarkMode ? "#6b6b75" : "#9ca3af" }}>AI Agent Commerce OS</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                onClick={() => {
                  setMessages([{ role: "agent", text: "Hello I'm SERA, ready when you are.", action: "idle", hasAction: false }]);
                  setSteps([]);
                  try {
                    localStorage.removeItem("sera_hackathon_messages");
                    localStorage.removeItem("sera_hackathon_store_schema");
                  } catch (e) { }
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer", color: "#555",
                  padding: 4, borderRadius: 4, display: "flex", alignItems: "center",
                  transition: "color 0.2s"
                }}
                title="Clear Chat"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
              <button onClick={() => setChatOpen(false)} style={{
                background: isDarkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, cursor: "pointer", color: isDarkMode ? "#6b6b75" : "#9ca3af",
                padding: "4px 8px", borderRadius: 4, transition: "all 0.2s", fontSize: 11, fontWeight: 500
              }}>
                Hide
              </button>
            </div>
          </div>
          {/* Messages — scrollable */}
          <div className={isDarkMode ? "dark-mode" : "light-mode"} style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {messages.map((m, i) => {
              if (m.role === "agent") {
                const isPending = m.id === "pending_agent_msg";
                const currentMilestones = m.milestones || (isPending ? agentActivity.map(a => ({ text: a.message, status: a.done ? "done" : "active" })) : []);
                const currentTools = m.tools || (isPending && executionState ? executionState.results.map(r => ({ label: `Generate ${(r.action || "image").replace("generate_", "").replace("_image", "")}`, detail: r.itemId })) : []);
                let messageActions = [];
                if (m.action === "show_plan") {
                  if (!m.planConfirmed) {
                    messageActions = [
                      { label: "Approve Plan", variant: "approve", key: "approve_plan" },
                      { label: "Edit Plan", variant: "undo", key: "edit_plan" }
                    ];
                  }
                } else if (m.hasAction && m.actionState === "pending") {
                  messageActions = [
                    { label: "Approve", variant: "approve", key: "approve" },
                    { label: "Reject", variant: "reject", key: "reject" }
                  ];
                }
                let extractedPlan = null;
                if (m.params) {
                  const schema = m.params.schema || m.params;
                  if (schema && (schema.layout || m.params.products || m.params.philosophy)) {
                    if (schema.layout) {
                      const heroSec = schema.layout.find(s => s.type === "hero");
                      const prodSec = schema.layout.find(s => s.type === "featured_products");
                      const philoSec = schema.layout.find(s => s.type === "philosophy");
                      const theme = schema.theme || {};
                      extractedPlan = {
                        title: heroSec?.props?.title || "Strategic Proposal",
                        subtitle: heroSec?.props?.subtitle || heroSec?.props?.collection || "Curated Products & Brand Pillars",
                        products: prodSec?.props?.products || [],
                        philosophy: philoSec?.props?.items || philoSec?.props?.philosophy || [],
                        themeColor: theme.themeColor || "#c8b89a"
                      };
                    } else {
                      extractedPlan = {
                        title: m.params.title || "Strategic Proposal",
                        subtitle: m.params.subtitle || m.params.collection || "Curated Products & Brand Pillars",
                        products: m.params.products || [],
                        philosophy: m.params.philosophy || [],
                        themeColor: m.params.themeColor || "#c8b89a"
                      };
                    }
                  }
                }
                const currentEvents = m.runtime || m.events || (isPending ? agentActivity : []);
                const messageProp = {
                  state: (!isPending || m.status === "done") ? "complete" : (agentActivity.length > 0 ? (agentActivity[agentActivity.length - 1].status?.toLowerCase() || "planning") : "planning"),
                  isStreaming: isPending,
                  milestones: currentMilestones,
                  events: currentEvents,
                  runtime: m.runtime || currentEvents,
                  cognition: m.cognition || [],
                  summary: m.summary || null,
                  timestamp: m.timestamp || null,
                  tools: currentTools,
                  chat: m.chat || null,
                  content: m.text || m.content || (isPending ? "" : "Operational Result: Premium storefront prepared successfully."),
                  planData: m.action === "show_plan" ? extractedPlan : null,
                  actions: messageActions
                };

                return (
                  <div key={i} style={{ width: "100%", marginBottom: 12 }}>
                    <SeraAgentMessage
                      message={messageProp}
                      onAction={(key, variant) => {
                        if (key === "approve_plan") {
                          setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, planConfirmed: true } : msg));
                          setChatMode('agent');
                          sendMessage("Yes, proceed with building the store as planned!", 'agent');
                        } else if (key === "edit_plan") {
                          setMessages(prev => prev.map((msg, idx) => idx === i ? { ...msg, planConfirmed: true } : msg));
                          sendMessage("I want to change some details of the plan.");
                        } else {
                          handleAction(i, variant);
                        }
                      }}
                    />
                    {/* Retry Card: shown when agent reports failed image assets */}
                    {m.params?.pending_retries?.length > 0 && m.retryStatus !== "success" && (
                      <div style={{
                        marginTop: 8, padding: "14px 16px",
                        background: isDarkMode ? "rgba(200,90,60,0.08)" : "rgba(200,90,60,0.06)",
                        border: `1px solid ${isDarkMode ? "rgba(220,100,70,0.3)" : "rgba(200,90,60,0.25)"}`,
                        borderRadius: 12, fontSize: 13
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 16 }}>⚠️</span>
                          <span style={{ fontWeight: 700, color: isDarkMode ? "#f87171" : "#c0392b" }}>
                            {m.retryStatus === "retrying"
                              ? `Mencoba generate ulang ${m.params.pending_retries.length} gambar dengan prompt asli...`
                              : `${m.params.pending_retries.length} gambar gagal di-generate`}
                          </span>
                        </div>
                        {m.retryStatus !== "retrying" && (
                          <>
                            <div style={{ color: isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", marginBottom: 10, lineHeight: 1.5 }}>
                              Saya akan coba generate ulang satu per satu dengan prompt asli (bukan yang diturunkan):
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {m.params.pending_retries.map((asset, ai) => (
                                <div key={ai} style={{
                                  display: "flex", justifyContent: "space-between", alignItems: "center",
                                  padding: "8px 12px", borderRadius: 8,
                                  background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                                  border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                }}>
                                  <span style={{ color: isDarkMode ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)", fontWeight: 500 }}>
                                    [Photo] {asset.label}
                                  </span>
                                  <button
                                    onClick={() => handleRetryAssets(i, [asset], m.params?.retry_schema)}
                                    style={{
                                      padding: "4px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                                      background: "#c8b89a", color: "#0f0f10", fontSize: 11, fontWeight: 700
                                    }}
                                  >
                                    Coba Lagi &rarr;
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleRetryAssets(i, m.params.pending_retries, m.params?.retry_schema)}
                              style={{
                                marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
                                cursor: "pointer", background: "linear-gradient(135deg, #c8b89a, #a89070)",
                                color: "#0f0f10", fontWeight: 700, fontSize: 13
                              }}
                            >
                              &#8635; Generate Ulang Semua ({m.params.pending_retries.length})
                            </button>
                          </>
                        )}
                        {m.retryStatus === "retrying" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, color: isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
                            <div className="img-spinner" style={{ width: 14, height: 14 }} />
                            <span>Memproses satu per satu...</span>
                          </div>
                        )}
                        {m.retryStatus === "partial" && m.params.pending_retries.length > 0 && (
                          <div style={{ color: isDarkMode ? "#fbbf24" : "#b45309", marginTop: 8, fontSize: 12 }}>
                            Masih ada {m.params.pending_retries.length} gambar yang belum berhasil. Quota Imagen 3 mungkin habis sementara — silakan coba lagi beberapa menit kemudian.
                          </div>
                        )}
                      </div>
                    )}
                    {m.retryStatus === "success" && (
                      <div style={{ marginTop: 6, padding: "8px 14px", borderRadius: 8, background: isDarkMode ? "rgba(52,211,153,0.1)" : "rgba(16,185,129,0.08)", border: "1px solid rgba(52,211,153,0.3)", fontSize: 12, color: isDarkMode ? "#34d399" : "#059669" }}>
                        ✅ Semua gambar berhasil di-generate ulang!
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginBottom: 12 }}>
                  <div style={{
                    maxWidth: "70%",
                    padding: "8px 13px",
                    borderRadius: "10px 10px 2px 10px",
                    background: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    border: `0.5px solid ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    fontSize: 12.5, lineHeight: 1.5, whiteSpace: "pre-line",
                    color: isDarkMode ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.75)",
                    position: "relative",
                    alignSelf: "flex-end"
                  }}>
                    {m.text}
                    {m.images && m.images.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: m.images.length > 1 ? "1fr 1fr" : "1fr", gap: 6, marginTop: 8 }}>
                        {m.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`uploaded-${idx}`} style={{ width: "100%", borderRadius: 6, display: "block" }} />
                        ))}
                      </div>
                    )}
                    {m.image && !m.images && <img src={m.image} alt="uploaded" style={{ marginTop: 8, maxWidth: "100%", borderRadius: 6, display: "block" }} />}
                  </div>
                </div>
              );
            })}
            {/* Instant Active Runtime Container while typing or cognition is active before message start */}
            {(isTyping || (agentActivity.length > 0 && agentActivity.some(a => !a.done))) && !messages.some(m => m.id === "pending_agent_msg") && (() => {
              const isTask = /build|create|make|buat|design|generate|coffee|skincare|store|toko|ganti|ubah|tambah/i.test(lastUserMsgRef.current);
              return (
                <div style={{ width: "100%", marginBottom: 12 }}>
                  <SeraAgentMessage
                    message={{
                      state: agentActivity.length > 0 ? (agentActivity[agentActivity.length - 1].status?.toLowerCase() || "planning") : "planning",
                      isStreaming: true,
                      milestones: agentActivity.length > 0
                        ? agentActivity.map(a => ({ text: a.message, status: a.done ? "done" : "active" }))
                        : (isTask ? [{ text: "Analyzing commerce intent & store schema...", status: "active" }] : []),
                      events: agentActivity,
                      runtime: agentActivity,
                      tools: executionState ? executionState.results.map(r => ({ label: `Generate ${(r.action || "image").replace("generate_", "").replace("_image", "")}`, detail: r.itemId })) : [],
                      content: "",
                      actions: []
                    }}
                  />
                  {/* Ephemeral thought — flashes briefly then fades away */}
                  {ephemeralThought && (
                    <div style={{
                      marginTop: 4, marginLeft: 2,
                      fontSize: 11, color: t.subtext, fontStyle: "italic",
                      fontFamily: "'JetBrains Mono', monospace",
                      lineHeight: 1.5, maxWidth: "90%",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      animation: "sera-fadein 0.25s ease",
                    }}>
                      {ephemeralThought}
                    </div>
                  )}
                </div>
              );
            })()}
            <div ref={messagesEndRef} />
          </div>
          {/* Permanent Action Bar */}
          {(() => {
            let lastActionIndex = -1;
            let lastActionMsg = null;
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].hasAction) {
                lastActionIndex = i;
                lastActionMsg = messages[i];
                break;
              }
            }
            const state = lastActionMsg ? lastActionMsg.actionState : "idle";
            const isPending = state === "pending";
            const canUndo = state === "approved";
            const approvalDisabled = !isPending || lastActionIndex < 0;
            const undoDisabled = !canUndo || lastActionIndex < 0;
            return (
              <div style={{ padding: "0 14px 8px 14px", background: isDarkMode ? "#0f0f10" : "#ffffff", zIndex: 10 }}>
                <div style={{ display: "flex", gap: 6, padding: "6px", background: isDarkMode ? "#121214" : "#e5e7eb", borderRadius: 8, border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, alignItems: "center" }}>
                  {/* Custom Styled Dropdown on the left */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
                      style={{
                        background: "none",
                        border: "none",
                        color: isDarkMode ? "#c8b89a" : t.text,
                        fontSize: 9,
                        fontWeight: 800,
                        cursor: "pointer",
                        outline: "none",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        fontFamily: "'DM Sans', sans-serif",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 4,
                        background: isModeMenuOpen ? (isDarkMode ? "#2a2a2e" : "#d1d5db") : (isDarkMode ? "#1e1e22" : "#e5e7eb"),
                        border: `1px solid ${isDarkMode ? "#3f3f46" : "#d1d5db"}`
                      }}
                    >
                      {chatMode}
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isModeMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {isModeMenuOpen && (
                      <div style={{
                        position: "absolute",
                        bottom: "100%",
                        left: 0,
                        marginBottom: 8,
                        background: isDarkMode ? "#1a1a1e" : "#fff",
                        border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                        borderRadius: 8,
                        overflow: "hidden",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                        zIndex: 100,
                        animation: "fadeInUp 0.2s ease-out"
                      }}>
                        <style>{`
                          @keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                          }
                        `}</style>
                        <div
                          onClick={() => { setChatMode('plan'); setIsModeMenuOpen(false); }}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            background: chatMode === 'plan' ? (isDarkMode ? "#222" : "#f8f9fa") : "transparent",
                            transition: "all 0.2s"
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? "#c8b89a" : t.text }}>PLAN</div>
                        </div>
                        <div
                          onClick={() => { setChatMode('agent'); setIsModeMenuOpen(false); }}
                          style={{
                            padding: "10px 12px",
                            cursor: "pointer",
                            background: chatMode === 'agent' ? (isDarkMode ? "#222" : "#f8f9fa") : "transparent",
                            transition: "all 0.2s",
                            borderTop: `1px solid ${t.border}`
                          }}
                        >
                          <div style={{ fontSize: 10, fontWeight: 700, color: isDarkMode ? "#c8b89a" : t.text }}>AGENT</div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ height: 16, width: 1, background: t.border, marginRight: 6 }} />
                  <button
                    type="button"
                    title={approvalDisabled ? "Menunggu aksi toko dari SERA" : "Setujui perubahan toko"}
                    disabled={approvalDisabled}
                    onClick={() => !approvalDisabled && handleAction(lastActionIndex, "approve")}
                    style={{
                      flex: 1,
                      background: isDarkMode ? "#161618" : "#ffffff",
                      border: "none",
                      color: isPending ? (isDarkMode ? "#4ade80" : "#059669") : (isDarkMode ? "#e5e7eb" : "#374151"),
                      padding: "6px 0", fontSize: 11, fontWeight: 700,
                      cursor: approvalDisabled ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.2s",
                      boxShadow: "none",
                      opacity: approvalDisabled ? 0.45 : 1,
                    }}>
                    <svg width="14" height="14" fill="none" stroke={isPending ? "#4ade80" : "currentColor"} strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                    {lastActionMsg?.action === "show_plan" ? "Approve Plan" : "Approve"}
                  </button>
                  <button
                    type="button"
                    title={approvalDisabled ? "Menunggu aksi toko dari SERA" : "Tolak dan kembalikan preview"}
                    disabled={approvalDisabled}
                    onClick={() => !approvalDisabled && handleAction(lastActionIndex, "reject")}
                    style={{
                      flex: 1,
                      background: isDarkMode ? "#161618" : "#ffffff",
                      border: "none",
                      color: isPending ? (isDarkMode ? "#f87171" : "#dc2626") : (isDarkMode ? "#e5e7eb" : "#374151"),
                      padding: "6px 0", fontSize: 11, fontWeight: 700,
                      cursor: approvalDisabled ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.2s",
                      boxShadow: "none",
                      opacity: approvalDisabled ? 0.45 : 1,
                    }}>
                    <svg width="14" height="14" fill="none" stroke={isPending ? "#f87171" : "currentColor"} strokeWidth="3" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {lastActionMsg?.action === "show_plan" ? "Reject Plan" : "Reject"}
                  </button>
                  <div style={{ width: 1, background: t.border, margin: "4px 2px" }} />
                  <button
                    type="button"
                    title={undoDisabled ? "Setujui dulu untuk bisa undo" : "Batalkan persetujuan terakhir"}
                    disabled={undoDisabled}
                    onClick={() => !undoDisabled && handleAction(lastActionIndex, "undo")}
                    style={{
                      flex: 1,
                      background: isDarkMode ? "#161618" : "#ffffff",
                      border: "none",
                      color: canUndo ? (isDarkMode ? "#38bdf8" : "#2563eb") : (isDarkMode ? "#e5e7eb" : "#374151"),
                      padding: "6px 0", fontSize: 11, fontWeight: 700,
                      cursor: undoDisabled ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      transition: "all 0.2s",
                      boxShadow: "none",
                      opacity: undoDisabled ? 0.45 : 1,
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={canUndo ? "#38bdf8" : "currentColor"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                    Undo
                  </button>
                </div>
              </div>
            );
          })()}
          {/* Chat input — fixed at bottom */}
          <div style={{
            padding: "0 14px 14px 14px",
            borderTop: "none",
            flexShrink: 0,
          }}>
            <div style={{
              background: isDarkMode ? "#1e1e22" : "#ffffff",
              border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              boxShadow: isDarkMode ? "none" : "0 2px 10px rgba(0,0,0,0.05)"
            }}>
              <input
                id="chat-image-upload"
                name="chat-image-upload"
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingImages.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {pendingImages.map((img, idx) => (
                      <div key={idx} style={{ position: "relative", width: 60, height: 60, borderRadius: 8, overflow: "hidden", border: "1px solid #333", background: "#111113" }}>
                        <img src={img} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          onClick={() => setPendingImages(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 16, height: 16, color: "#fff", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >Ã—</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#888", display: "flex", alignItems: "center", padding: "4px" }}
                    title="Upload Image"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <textarea
                    id="chat-textarea"
                    name="chat-textarea"
                    className="chat-input"
                    placeholder={isTyping ? "SERA is working..." : "Ask SERA to build anything..."}
                    value={input}
                    rows={1}
                    disabled={isTyping}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!isTyping) sendMessage();
                        e.target.style.height = 'auto';
                      }
                    }}
                    style={{ lineHeight: 1.5, maxHeight: 120, resize: "none", opacity: isTyping ? 0.5 : 1 }}
                  />
                  <button
                    className="send-btn"
                    onClick={() => {
                      if (isTyping) {
                        stopAgentWork();
                      } else {
                        sendMessage();
                      }
                    }}
                    title={isTyping ? "Stop" : "Kirim pesan"}
                    style={{ opacity: isTyping ? 0.9 : 1, cursor: 'pointer', background: "#c8b89a", border: "none", borderRadius: "8px", padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {isTyping ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#0f0f10" stroke="#0f0f10" strokeWidth="2">
                        <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="#0f0f10" strokeWidth="3" viewBox="0 0 24 24">
                        <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Publish Success Modal */}
      {showPublishedModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#161618", border: "1px solid #333", borderRadius: 16, padding: "40px", width: 400, textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", zIndex: 101, position: "relative" }}>
            <div style={{ width: 64, height: 64, background: "#c8b89a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="32" height="32" fill="none" stroke="#0f0f10" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#e8e6e1", marginBottom: 12 }}>Store Published!</h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>Congratulations, your store is now live. Customers can start shopping immediately.</p>
            <div style={{ background: "#111113", border: "1px solid #222", borderRadius: 8, padding: "12px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#4ade80", fontSize: 13 }}>sera.shop/my-store</span>
              <button style={{ background: "none", border: "none", color: "#c8b89a", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Copy</button>
            </div>
            <button onClick={() => setShowPublishedModal(false)} style={{ background: "#1e1e22", color: "#e8e6e1", border: "none", borderRadius: 8, padding: "12px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%" }}>Done</button>
          </div>
        </div>
      )}
      {/* STOREFRONT MODAL / OVERLAY (BUYER MODE STORE EXPLORATION) */}
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#c8b89a", color: "#0f0f10", padding: "14px 28px", borderRadius: 100, fontSize: 14, fontWeight: 700, boxShadow: "0 12px 36px rgba(0,0,0,0.5)", zIndex: 300, animation: "bounceUp 0.3s ease", display: "flex", alignItems: "center", gap: 10 }}>
          <span></span>
          {toastMessage}
        </div>
      )}
      {/* PRODUCT DETAIL MODAL (QUICK VIEW / PDP) */}
      {selectedProductDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }}>
          <div style={{ background: isDarkMode ? "#161618" : "#fff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: 850, display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh" }}>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "50%", background: "#1a1a1e", position: "relative", minHeight: 300 }}>
              <img src={selectedProductDetail.imageUrl} alt={selectedProductDetail.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "50%", padding: "40px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: t.subtext, fontWeight: 600, textTransform: "uppercase" }}>PREVIEW MODE</span>
                <button onClick={() => setSelectedProductDetail(null)} style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", fontSize: 20 }}>&times;</button>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: t.text, marginBottom: 16 }}>{selectedProductDetail.name}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "#c8b89a" }}>{selectedProductDetail.price}</span>
              </div>
              <div style={{ borderTop: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, paddingTop: 20, marginBottom: 28 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8 }}>DESCRIPTION</h4>
                <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6 }}>{selectedProductDetail.desc}</p>
              </div>
              <div style={{ marginTop: "auto", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", padding: 16, borderRadius: 12, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: t.subtext, margin: 0 }}>This is a preview. Buyers will see the "Add to Cart" button here.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* PHILOSOPHY DETAIL MODAL */}
      {selectedPhilosophy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }} onClick={() => setSelectedPhilosophy(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: isDarkMode ? "#161618" : "#fff", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: 800, display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh" }}>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "45%", background: "#1a1a1e", position: "relative", minHeight: 300 }}>
              <img src={selectedPhilosophy.imageUrl} alt={selectedPhilosophy.label || selectedPhilosophy.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "55%", padding: "40px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: t.subtext, fontWeight: 600, textTransform: "uppercase" }}>PREVIEW MODE</span>
                <button onClick={() => setSelectedPhilosophy(null)} style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", fontSize: 20 }}>&times;</button>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: t.text, marginBottom: 24, lineHeight: 1.2 }}>{selectedPhilosophy.label || selectedPhilosophy.title}</h2>
              <p style={{ fontSize: 16, color: t.subtext, lineHeight: 1.8, fontWeight: 300 }}>{selectedPhilosophy.sub || selectedPhilosophy.body}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function SeraLayout() {
  return (
    <StoreProvider>
      <SeraLayoutInner />
    </StoreProvider>
  );
}
