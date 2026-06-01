import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/storeContext';
import { CURATED_STORES } from '../../utils/constants';

export const BuyerApp = ({ isDarkMode, setIsDarkMode, t, DynamicRenderer }) => {
  const {
    state: {
      appMode, storeSchema, draftSchema, publishedSchema, userStores,
      activeAnalyticsStoreId, analyticsData, isLoadingAnalytics,
      buyerSearchQuery, buyerAiQuery, buyerAiMessages, buyerAiStatus,
      selectedCategoryFilter, followedStores,
      cart, isCartOpen, selectedProductDetail, selectedStorefront, modalQty,
      selectedPhilosophy, toastMessage
    },
    dispatch,
    setAppMode, setStoreSchema, setDraftSchema, setPublishedSchema, setUserStores,
    setActiveAnalyticsStoreId, setAnalyticsData, setIsLoadingAnalytics,
    setBuyerSearchQuery, setBuyerAiQuery, setBuyerAiMessages, setBuyerAiStatus,
    setSelectedCategoryFilter, setFollowedStores,
    setCart, setIsCartOpen, setSelectedProductDetail, setSelectedStorefront, setModalQty,
    setSelectedPhilosophy, setToastMessage
  } = useStore();

const [chatOpen, setChatOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };
  const [chatWidth, setChatWidth] = useState(380);

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
const [activeNav, setActiveNav] = useState("home");
const getDisplayBrandName = (store) => store?.name || "Unknown Brand";

const toggleFollowStore = (storeId) => {
  setFollowedStores(prev => {
    const set = prev instanceof Set ? new Set(prev) : new Set(Array.isArray(prev) ? prev : []);
    if (set.has(storeId)) {
      set.delete(storeId);
    } else {
      set.add(storeId);
    }
    return set;
  });
};

const filteredStores = [...(userStores || []), ...CURATED_STORES].filter(s => {
  if (selectedCategoryFilter !== "all" && s.category !== selectedCategoryFilter) return false;
  return true;
});

const filteredProducts = CURATED_STORES.flatMap(store => store.products || []).filter(p => {
  if (selectedCategoryFilter !== "all" && p.category !== selectedCategoryFilter) return false;
  if (buyerSearchQuery && !p.name.toLowerCase().includes(buyerSearchQuery.toLowerCase())) return false;
  return true;
});

  const handleSearch = (e) => {
    if (e.key === 'Enter' && buyerSearchQuery.trim()) {
      // In full implementation, this triggers actual AI search backend
    }
  };

  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };
  const getStockCount = (name) => {
    if (!name) return 46;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = hash + name.charCodeAt(i);
    return (hash % 45) + 12;
  };
  const INITIAL_PHILOSOPHY = [
    { label: "AI CURATION", sub: "Data-Driven Selection", imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=640&h=360&q=80" },
    { label: "AUTONOMOUS COMMERCE", sub: "Frictionless Experience", imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=640&h=360&q=80" },
    { label: "PERSONALIZED JOURNEY", sub: "Tailored For You", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&h=360&q=80" },
    { label: "SEAMLESS CHECKOUT", sub: "Instant Fulfillment", imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=640&h=360&q=80" }
  ];
  const getStorePhilosophy = (store) => {
    return INITIAL_PHILOSOPHY;
  };
  const checkout = () => {
    setCart([]);
    setIsCartOpen(false);
  };
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };
  const chatEndRef = useRef(null);

  
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  
  const handleBuyerAiSubmit = (e) => {
    e.preventDefault();
    if (!buyerAiQuery.trim()) return;
    setBuyerAiMessages([...buyerAiMessages, { id: Date.now(), role: "user", text: buyerAiQuery }]);
    setBuyerAiQuery("");
    setBuyerAiStatus("Analyzing request...");
    setTimeout(() => {
      setBuyerAiStatus("Generating response...");
      setTimeout(() => {
        setBuyerAiMessages(prev => [...prev, { id: Date.now(), role: "agent", text: "I've found some amazing products matching your criteria! Check them out in the feed." }]);
        setBuyerAiStatus("");
      }, 1000);
    }, 1000);
  };
const handleAgentMsg = () => {
    if (!buyerAiQuery.trim()) return;
    const msg = buyerAiQuery;
    setBuyerAiMessages(prev => [...prev, { role: 'user', text: msg }]);
    setBuyerAiQuery("");
    setBuyerAiStatus("analyzing");
    
    // Simulate AI response
    setTimeout(() => {
      setBuyerAiStatus("searching");
      setTimeout(() => {
        setBuyerAiMessages(prev => [...prev, { role: 'agent', text: `I found several highly rated ${msg.toLowerCase()} from our verified autonomous stores. Would you like to see options focused on sustainability or premium ingredients?` }]);
        setBuyerAiStatus("idle");
      }, 1200);
    }, 800);
  };

  const formatPrice = (priceStr) => {
    if (!priceStr) return "";
    return priceStr.startsWith('$') ? priceStr : `$${priceStr}`;
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

  const handleAddToCart = (product, store) => {
    setCart(prev => [...prev, { ...product, storeId: store.id, qty: 1 }]);
    setToastMessage(`Added ${product.name} to cart`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", background: t.bg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh", position: "relative" }}>
      <div style={{ height: 60, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 48px", background: isDarkMode ? "#0f0f10" : "#fff", borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`, position: "sticky", top: 0, zIndex: 50 }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0, fontWeight: 600, display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: isDarkMode ? "#c8b89a" : "#8b7355", letterSpacing: 0.5, fontFamily: "'DM Sans', sans-serif" }}>SERA</span>
          <span style={{ fontSize: 11, color: isDarkMode ? "#6b6b75" : "#9ca3af", background: isDarkMode ? "#1a1a1e" : "#f3f4f6", padding: "2px 8px", borderRadius: 4, marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>Discovery AI</span>
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
          
          <button
            onClick={() => setAppMode(appMode === "buyer" ? "seller" : "buyer")}
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
            <div style={{ width: "100%", marginBottom: 56 }}>
              {/* Image Banner */}
              <div style={{ width: "100%", background: isDarkMode ? "#0f0f10" : "#fff", borderBottom: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                <img src="/buyer-banner.jpg" alt="Start Shopping Powered by AI" style={{ width: "100%", maxHeight: "450px", objectFit: "cover", display: "block", margin: "0 auto" }} />
              </div>
            </div>
            {/* Buyer Mode Restricted Content Area */}
            <div style={{ padding: "0 48px", width: "100%", margin: "0 auto" }}>
              {/* Category Filter Tabs */}
              <div style={{ display: "flex", gap: 12, marginBottom: 40, overflowX: "auto", paddingBottom: 12, WebkitOverflowScrolling: "touch" }}>
                {["all", "Modern Lifestyle", "Artisanal Coffee", "Creator Gadgets", "Organic Skincare"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    style={{
                      background: selectedCategoryFilter === cat ? (isDarkMode ? "#c8b89a" : "#8b7355") : (isDarkMode ? "#1a1a1e" : "#f3f4f6"),
                      color: selectedCategoryFilter === cat ? (isDarkMode ? "#0f0f10" : "#ffffff") : (isDarkMode ? "#ffffff" : "#111827"),
                      border: `1px solid ${selectedCategoryFilter === cat ? "transparent" : (isDarkMode ? "#2a2a2e" : "#e5e7eb")}`,
                      borderRadius: 100,
                      padding: "10px 24px",
                      fontSize: 14,
                      fontWeight: selectedCategoryFilter === cat ? 700 : 500,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => { if (selectedCategoryFilter !== cat) e.currentTarget.style.background = isDarkMode ? "#2a2a2e" : "#e5e7eb" }}
                    onMouseLeave={(e) => { if (selectedCategoryFilter !== cat) e.currentTarget.style.background = isDarkMode ? "#1a1a1e" : "#f3f4f6" }}
                  >
                    {cat === "all" ? "All Curated Ecosystems" : cat}
                  </button>
                ))}
              </div>
              {/* 2. Top Curated Stores Section */}
              <div style={{ marginBottom: 56 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                      Top Curated Stores
                    </h2>
                    <p style={{ color: t.subtext, fontSize: 13 }}>
                      Discover autonomous AI-powered brands backed by verified reputation and trust indicators.
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: "#c8b89a", fontWeight: 600, background: isDarkMode ? "#1a1a1e" : "#f3f4f6", padding: "4px 12px", borderRadius: 20, border: `1px solid ${t.border}` }}>
                     AI Verified Ecosystem
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                  {filteredStores.map(store => {
                    const isFollowing = followedStores.has(store.id);
                    return (
                      <div
                        key={store.id}
                        onClick={() => setSelectedStorefront(store)}
                        style={{
                          position: "relative",
                          aspectRatio: "3/4",
                          borderRadius: 24,
                          overflow: "hidden",
                          cursor: "pointer",
                          boxShadow: isDarkMode ? "none" : "0 12px 32px rgba(0,0,0,0.08)",
                          border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
                          transition: "transform 0.3s ease",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        {/* Full Cover Image */}
                        {store.cover ? (
                          <img src={store.cover} alt={store.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} onError={(e) => e.currentTarget.style.display = 'none'} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", background: isDarkMode ? "#161618" : "#f9fafb", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
                            ðŸ›ï¸
                          </div>
                        )}
                        {/* Trust Badge Top Right */}
                        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3 }}>
                          <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", padding: "6px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(255,255,255,0.1)" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>{store.trustScore}</span>
                          </div>
                        </div>
                        {/* Bottom Gradient Overlay & Content */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)", zIndex: 1 }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24, zIndex: 2, display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#c8b89a", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{store.category}</span>
                          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8, lineHeight: 1.1 }}>{store.name}</h3>
                          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5, marginBottom: 24, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{store.desc}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>👥 {store.followers}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleFollowStore(store.id); }}
                              style={{
                                background: isFollowing ? "rgba(255,255,255,0.1)" : "#c8b89a",
                                color: isFollowing ? "#fff" : "#0f0f10",
                                border: isFollowing ? "1px solid rgba(255,255,255,0.2)" : "none",
                                backdropFilter: isFollowing ? "blur(8px)" : "none",
                                borderRadius: 100,
                                padding: "8px 20px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                transition: "all 0.2s ease"
                              }}
                            >
                              {isFollowing ? "Following" : "Follow"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Featured Video Campaigns */}
              {(() => {
                const allCampaigns = [];
                [...CURATED_STORES, ...userStores].forEach(s => {
                  const sData = s.storeData || s.customSchema?.storeData || s.schema?.storeData || {};
                  const videos = sData.promoVideos && sData.promoVideos.length > 0
                    ? sData.promoVideos
                    : (sData.promoVideo ? [sData.promoVideo] : (s.promoVideo ? [s.promoVideo] : []));
                  [...new Set(videos)].forEach((vidUrl, idx) => {
                    allCampaigns.push({
                      id: `${s.id}-promo-${idx}`,
                      store: s,
                      videoUrl: vidUrl
                    });
                  });
                });
                if (allCampaigns.length === 0) return null;
                return (
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                      <div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                          Featured Video Campaigns
                        </h2>
                        <p style={{ color: t.subtext, fontSize: 13 }}>
                          Exclusive promotions and flash sales powered by Veo AI.
                        </p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, background: "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: 1 }}>Live Now</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                      {allCampaigns.map(camp => (
                        <div key={camp.id} onClick={() => {
                          setActiveNav("home");
                        }} style={{ cursor: "pointer", background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: "9/16" }}>
                          <video src={camp.videoUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)" }} />
                          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div>
                              <h3 style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{getDisplayBrandName(camp.store)}</h3>
                              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Special Campaign</p>
                            </div>
                            <span style={{ color: "#4ade80", fontSize: 13, fontWeight: 700, background: "rgba(74,222,128,0.15)", padding: "6px 12px", borderRadius: 8, backdropFilter: "blur(4px)", border: "1px solid rgba(74,222,128,0.3)" }}>
                              View Store
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3. Trending Products From Stores */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 4 }}>
                      Trending Products From Stores
                    </h2>
                    <p style={{ color: t.subtext, fontSize: 13 }}>
                      Curated items directly promoted by our top AI storefronts.
                    </p>
                  </div>
                  <span style={{ fontSize: 12, color: t.subtext }}>Updated in real-time</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                  {[...CURATED_STORES, ...userStores]
                    .flatMap(s => ((s.customSchema || s.schema)?.layout?.find(l => l.type === "featured_products")?.props?.products || []).map(p => ({
                      id: p.name,
                      name: p.name,
                      price: p.price,
                      desc: p.description || p.desc,
                      image: p.imageUrl || p.image,
                      storeId: s.id,
                      store: (s.customSchema || s.schema)?.metadata?.brand_identity || s.storeData?.title || s.name || "AI Store",
                      aiTag: p.promo || "Trending",
                      rating: 4.8,
                      sales: 340 + Math.floor(Math.random() * 500)
                    })))
                    .filter(p => selectedCategoryFilter === "all" || [...CURATED_STORES, ...userStores].find(s => s.id === p.storeId)?.category === selectedCategoryFilter)
                    .filter(p => !buyerSearchQuery || p.name.toLowerCase().includes(buyerSearchQuery.toLowerCase()) || p.store.toLowerCase().includes(buyerSearchQuery.toLowerCase()) || p.aiTag.toLowerCase().includes(buyerSearchQuery.toLowerCase()))
                    .map(prod => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedProductDetail({
                            name: prod.name,
                            price: prod.price,
                            desc: prod.desc || "Premium curated item directly promoted by our top AI storefronts. Crafted with precision and designed for the modern individual.",
                            imageUrl: prod.image,
                            promo: prod.aiTag,
                            store: prod.store,
                            rating: prod.rating,
                            sales: prod.sales
                          });
                          setModalQty(1);
                        }}
                        style={{
                          background: isDarkMode ? "#161618" : "#fff",
                          border: `1px solid ${t.border}`,
                          borderRadius: 16,
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          display: "flex",
                          flexDirection: "column",
                          cursor: "pointer",
                          boxShadow: isDarkMode ? "none" : "0 6px 18px rgba(0,0,0,0.03)"
                        }}
                      >
                        <div style={{ height: 220, width: "100%", background: "#1a1a1e", position: "relative" }}>
                          <img src={prod.image} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(200,184,154,0.9)", color: "#0f0f10", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, backdropFilter: "blur(4px)" }}>
                            {prod.aiTag}
                          </div>
                        </div>
                        <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                          <span style={{ fontSize: 11, color: t.subtext, marginBottom: 4, fontWeight: 600 }}>{prod.store}</span>
                          <h4 style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4, lineHeight: 1.3 }}>{prod.name}</h4>
                          <p style={{ fontSize: 12, color: t.subtext, marginBottom: 12, lineHeight: 1.4, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{prod.desc}</p>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${t.border}` }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: "#c8b89a" }}>{prod.price}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.subtext }}>
                              <span>⭐ {prod.rating}</span>
                              <span>•</span>
                              <span>{prod.sales}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              {/* End of Buyer Mode Restricted Content Area */}
            </div>
            {/* FLOATING BOTTOM NAVIGATION DOCK (BUYER MODE) */}
            <div style={{
              position: "fixed",
              bottom: 32,
              left: chatOpen ? `calc((100vw - ${chatWidth}px) / 2)` : "50%",
              transform: "translateX(-50%)",
              background: isDarkMode ? "rgba(22, 22, 24, 0.85)" : "rgba(255, 255, 255, 0.85)",
              backdropFilter: "blur(16px)",
              border: `1px solid ${t.border}`,
              borderRadius: 30,
              padding: "10px 32px",
              display: "flex",
              alignItems: "center",
              gap: 36,
              boxShadow: isDarkMode ? "0 12px 40px rgba(0,0,0,0.6)" : "0 12px 40px rgba(0,0,0,0.12)",
              zIndex: 50,
              transition: "left 0.3s ease, background 0.3s ease"
            }}>
              {/* Explore / Discovery */}
              <button style={{ background: "none", border: "none", color: "#c8b89a", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Explore</span>
              </button>
              {/* Saved Stores / Favorites */}
              <button style={{ background: "none", border: "none", color: t.subtext, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = t.text} onMouseLeave={e => e.currentTarget.style.color = t.subtext}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Saved</span>
              </button>
              {/* Cart / Keranjang */}
              <button
                onClick={() => setIsCartOpen(true)}
                style={{ background: "none", border: "none", color: t.subtext, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", position: "relative", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = t.text}
                onMouseLeave={e => e.currentTarget.style.color = t.subtext}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {cart.length > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -6, background: "#c8b89a", color: "#0f0f10", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {cart.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                )}
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Cart</span>
              </button>
              {/* Profile / Profil */}
              <button style={{ background: "none", border: "none", color: t.subtext, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = t.text} onMouseLeave={e => e.currentTarget.style.color = t.subtext}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Profile</span>
              </button>
            </div>
          
      </div>

      {/* RIGHT AI ASSISTANT PANEL (BUYER MODE) */}
      {chatOpen && appMode === "buyer" && (
        <div style={{
          width: chatWidth,
          position: "relative",
          height: "100vh",
          background: t.panel,
          borderLeft: `1px solid ${t.border}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: isDarkMode ? "none" : "-2px 0 12px rgba(0,0,0,0.03)"
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
          {/* Header */}
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#c8b89a", animation: "pulse 2s infinite" }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: isDarkMode ? "#c8b89a" : "#8b7355" }}>SERA</p>
                <p style={{ fontSize: 10, color: isDarkMode ? "#6b6b75" : "#9ca3af" }}>Discovery AI Concierge</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setBuyerAiMessages([])} title="Clear Chat" style={{ background: "transparent", border: "none", color: isDarkMode ? "#6b6b75" : "#9ca3af", padding: "4px", borderRadius: 4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
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
          {/* AI Live Status Banner */}
          {buyerAiStatus && (
            <div style={{ padding: "10px 20px", background: "#1e1e22", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 14, height: 14, border: "2px solid #c8b89a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: 12, color: "#c8b89a", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{buyerAiStatus}</span>
            </div>
          )}
          {/* Messages Stream */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
            {buyerAiMessages.map(m => (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "85%",
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#c8b89a" : (isDarkMode ? "#161618" : "#fff"),
                  color: m.role === "user" ? "#0f0f10" : t.text,
                  border: `1px solid ${m.role === "user" ? "transparent" : t.border}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: isDarkMode ? "none" : "0 4px 12px rgba(0,0,0,0.03)"
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          {/* Input Area */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.border}`, background: isDarkMode ? "#111113" : "#fff" }}>
            <form onSubmit={handleBuyerAiSubmit} style={{ display: "flex", gap: 10, background: isDarkMode ? "#161618" : "#f9fafb", border: `1px solid ${t.border}`, borderRadius: 14, padding: "6px 6px 6px 16px", alignItems: "center" }}>
              <input
                id="buyer-ai-query"
                name="buyer-ai-query"
                type="text"
                value={buyerAiQuery}
                onChange={(e) => setBuyerAiQuery(e.target.value)}
                placeholder="Ask SERA..."
                style={{ background: "transparent", border: "none", outline: "none", color: t.text, fontSize: 13, flex: 1 }}
              />
              <button type="submit" style={{ background: "#c8b89a", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#0f0f10", cursor: "pointer", flexShrink: 0, fontWeight: 700 }}>
                <svg width="14" height="14" fill="none" stroke="#0f0f10" strokeWidth="3" viewBox="0 0 24 24">
                  <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
      
{selectedStorefront && (
        <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: chatOpen ? chatWidth : 0, background: isDarkMode ? "#0f0f10" : "#fff", zIndex: 180, overflowY: "auto", display: "flex", flexDirection: "column", animation: "fadeIn 0.3s ease", borderRight: chatOpen ? `1px solid ${t.border}` : "none" }}>
          {/* Top Bar / Back Navigation */}
          <div style={{ position: "sticky", top: 0, zIndex: 50, background: isDarkMode ? "rgba(15,15,16,0.9)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${t.border}`, padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={() => setSelectedStorefront(null)} style={{ background: "none", border: "none", color: t.text, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Back to AI Discovery
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(74,222,128,0.2)", fontWeight: 600 }}>
                 Verified AI Brand • {selectedStorefront.trustScore} Trust
              </span>
              <button onClick={() => { toggleFollowStore(selectedStorefront.id); showToast(followedStores.has(selectedStorefront.id) ? `Unfollowed ${selectedStorefront.name}` : `Following ${selectedStorefront.name}!`); }} style={{ background: followedStores.has(selectedStorefront.id) ? (isDarkMode ? "#2a2a2e" : "#e5e7eb") : "#c8b89a", color: followedStores.has(selectedStorefront.id) ? t.text : "#0f0f10", border: "none", borderRadius: 12, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {followedStores.has(selectedStorefront.id) ? "Following" : "Follow"}
              </button>
              {!chatOpen && (
                <button onClick={() => setChatOpen(true)} style={{
                  marginLeft: 8, background: isDarkMode ? "#1a1a1e" : "#f3f4f6", border: `1px solid ${isDarkMode ? "#2a2a2e" : "#e5e7eb"}`,
                  borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                  color: isDarkMode ? "#c8b89a" : "#82693f", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s",
                  fontWeight: 600
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Open SERA
                </button>
              )}
            </div>
          </div>
          {/* Stunning Full-Width Store Cover Banner */}
          {(() => {
            const stData = selectedStorefront.isUserStore
              ? (selectedStorefront.customSchema?.layout?.find(s => s.type === "hero")?.props || {})
              : (selectedStorefront.storeData || {});
            return (
              <>
                <div style={{
                  position: "relative",
                  width: "100%",
                  minHeight: "450px",
                  flexShrink: 0,
                  background: selectedStorefront.cover ? `url('${selectedStorefront.cover}') center/cover no-repeat` : (isDarkMode ? "#1a1a1e" : "#f3f4f6"),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "80px 0",
                  borderBottom: `1px solid ${t.border}`,
                  overflow: "hidden"
                }}>
                  <div style={{ position: "absolute", inset: 0, background: selectedStorefront.cover ? "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)" : (isDarkMode ? "linear-gradient(to bottom, rgba(15,15,16,0.3) 0%, rgba(15,15,16,0.85) 100%)" : "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.85) 100%)"), zIndex: 1 }} />
                  <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 20px", maxWidth: 800 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#c8b89a", letterSpacing: 4, textTransform: "uppercase", display: "block", marginBottom: 16 }}>{selectedStorefront.category || "Verified Brand"}</span>
                    <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 700, color: selectedStorefront.cover ? "#fff" : t.text, marginBottom: 20, lineHeight: 1.1 }}>{selectedStorefront.name}</h1>
                    <p style={{ fontSize: 18, color: selectedStorefront.cover ? "rgba(255,255,255,0.8)" : t.subtext, lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>{selectedStorefront.desc}</p>
                  </div>
                </div>
                {(() => {
                  const sVids = stData.storeVideos && stData.storeVideos.length > 0
                    ? stData.storeVideos
                    : (stData.storeVideo ? [stData.storeVideo] : []);
                  if (sVids.length === 0) return null;
                  return (
                    <section style={{ padding: "60px 40px", background: isDarkMode ? "#0f0f10" : "#ffffff" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                        {[...new Set(sVids)].map((vidUrl, i) => (
                          <div key={i} style={{ maxWidth: 1100, margin: "0 auto", borderRadius: 24, overflow: "hidden", position: "relative", aspectRatio: "21/9", background: "#000", boxShadow: "0 24px 60px rgba(0,0,0,0.5)", width: "100%" }}>
                            <video src={vidUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "40px 60px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <span style={{ background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: 1 }}>Flash Sale</span>
                                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80" }} /> Live Now</span>
                              </div>
                              <h2 style={{ fontSize: 42, color: "#fff", fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: 12, lineHeight: 1.1 }}>Exclusive Collection</h2>
                              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, maxWidth: 500, lineHeight: 1.5, marginBottom: 24 }}>Explore our cinematic product showcases directly inside the storefront.</p>
                              <button style={{ background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "fit-content", transition: "transform 0.2s" }}>Shop Featured</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })()}
              </>
            );
          })()}
          {/* Dynamic Store Content */}
          <div style={{ flex: 1 }}>
            <DynamicRenderer
              layout={selectedStorefront.isUserStore ? selectedStorefront.customSchema.layout.filter(s => s.type !== "hero") : [
                {
                  id: `store-products-${selectedStorefront.id}`,
                  type: "featured_products",
                  variant: "grid",
                  props: { sectionTitle: "Signature Items" }
                },
                {
                  id: `store-phil-${selectedStorefront.id}`,
                  type: "philosophy",
                  variant: "scroller",
                  props: {
                    items: getStorePhilosophy(selectedStorefront),
                    themeColor: "#c8b89a"
                  }
                },
                {
                  id: `store-foot-${selectedStorefront.id}`,
                  type: "footer",
                  variant: "default",
                  props: {
                    title: selectedStorefront.name,
                    subtitle: selectedStorefront.desc,
                    themeColor: "#c8b89a"
                  }
                }
              ]}
              globalProps={{
                ...(selectedStorefront.isUserStore
                  ? (selectedStorefront.customSchema?.layout?.find(s => s.type === "hero")?.props || {})
                  : (selectedStorefront.storeData || {})),
                themeColor: selectedStorefront.isUserStore ? (selectedStorefront.customSchema.theme?.themeColor || "#c8b89a") : "#c8b89a",
                products: selectedStorefront.isUserStore
                  ? (selectedStorefront.customSchema.layout.find(s => s.type === "featured_products")?.props?.products || [])
                  : (selectedStorefront.schema?.layout?.find(s => s.type === "featured_products")?.props?.products || []),
                isDarkMode: isDarkMode,
                onSelectProduct: (prod) => {
                  setSelectedProductDetail({
                    ...prod,
                    store: selectedStorefront.name
                  });
                  setModalQty(1);
                },
                onSelectPhilosophy: setSelectedPhilosophy,
                isBuyerMode: true
              }}
            />
          </div>
        </div>
      )}
      {/* PHILOSOPHY DETAIL MODAL */}
      {selectedPhilosophy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }} onClick={() => setSelectedPhilosophy(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: isDarkMode ? "#161618" : "#fff", border: `1px solid ${t.border}`, borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: 800, display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh" }}>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "45%", background: "#1a1a1e", position: "relative", minHeight: 300 }}>
              <img src={selectedPhilosophy.imageUrl} alt={selectedPhilosophy.label || selectedPhilosophy.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ width: window.innerWidth < 768 ? "100%" : "55%", padding: "40px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 20 }}>
                <button onClick={() => setSelectedPhilosophy(null)} style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", fontSize: 20 }}>&times;</button>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: t.text, marginBottom: 24, lineHeight: 1.2 }}>{selectedPhilosophy.label || selectedPhilosophy.title}</h2>
              <p style={{ fontSize: 16, color: t.subtext, lineHeight: 1.8, fontWeight: 300 }}>{selectedPhilosophy.sub || selectedPhilosophy.body}</p>
            </div>
          </div>
        </div>
      )}
      {/* PRODUCT DETAIL MODAL (QUICK VIEW / PDP) */}
      {selectedProductDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: 20 }}>
          <div style={{ background: isDarkMode ? "#161618" : "#fff", border: `1px solid ${t.border}`, borderRadius: 24, overflow: "hidden", width: "100%", maxWidth: 850, display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", maxHeight: "90vh" }}>
            {/* Left Image */}
            <div style={{ width: window.innerWidth < 768 ? "100%" : "50%", background: "#1a1a1e", position: "relative", minHeight: 300 }}>
              <img src={selectedProductDetail.imageUrl} alt={selectedProductDetail.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {selectedProductDetail.promo && (
                <div style={{ position: "absolute", top: 20, left: 20, background: "#c8b89a", color: "#0f0f10", fontSize: 11, fontWeight: 800, padding: "6px 12px", borderRadius: 8 }}>
                  {selectedProductDetail.promo}
                </div>
              )}
            </div>
            {/* Right Content */}
            <div style={{ width: window.innerWidth < 768 ? "100%" : "50%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflowY: "auto" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: t.subtext, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{selectedProductDetail.store}</span>
                  <button onClick={() => setSelectedProductDetail(null)} style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", fontSize: 20 }}>&times;</button>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: t.text, marginBottom: 16, lineHeight: 1.2 }}>{selectedProductDetail.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: "#c8b89a" }}>{selectedProductDetail.price}</span>
                  <span style={{ fontSize: 13, color: "#c8b89a", background: isDarkMode ? "#111113" : "#f3f4f6", padding: "4px 10px", borderRadius: 6, border: `1px solid ${t.border}` }}>
                    • {getStockCount(selectedProductDetail.name)} in stock
                  </span>
                  {selectedProductDetail.rating && (
                    <span style={{ fontSize: 13, color: t.subtext, background: isDarkMode ? "#111113" : "#f3f4f6", padding: "4px 10px", borderRadius: 6 }}>⭐ {selectedProductDetail.rating} • {selectedProductDetail.sales}</span>
                  )}
                </div>
                <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20, marginBottom: 28 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Description</h4>
                  <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6 }}>{selectedProductDetail.desc}</p>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Quantity</span>
                  <div style={{ display: "flex", alignItems: "center", background: isDarkMode ? "#111113" : "#f3f4f6", border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <button onClick={() => setModalQty(Math.max(1, modalQty - 1))} style={{ background: "none", border: "none", color: t.text, width: 36, height: 36, cursor: "pointer", fontSize: 16, fontWeight: 600 }}>-</button>
                    <span style={{ width: 40, textAlign: "center", fontSize: 14, fontWeight: 700, color: t.text }}>{modalQty}</span>
                    <button onClick={() => setModalQty(modalQty + 1)} style={{ background: "none", border: "none", color: t.text, width: 36, height: 36, cursor: "pointer", fontSize: 16, fontWeight: 600 }}>+</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <button
                    onClick={() => {
                      const priceClean = parsePriceNum(selectedProductDetail.price);
                      setCart(prev => {
                        const existingIndex = prev.findIndex(item => item.name === selectedProductDetail.name && item.store === selectedProductDetail.store);
                        if (existingIndex > -1) {
                          const next = [...prev];
                          next[existingIndex] = { ...next[existingIndex], qty: next[existingIndex].qty + modalQty };
                          return next;
                        }
                        return [...prev, { ...selectedProductDetail, qty: modalQty, priceNum: priceClean, id: Math.random().toString(36).substr(2, 9) }];
                      });
                      setSelectedProductDetail(null);
                      showToast(`Added ${modalQty}x ${selectedProductDetail.name} to Cart!`);
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 }, zIndex: 300 });
                    }}
                    style={{ flex: 1, background: "#c8b89a", color: "#0f0f10", border: "none", borderRadius: 14, padding: "16px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(200,184,154,0.3)", transition: "transform 0.2s" }}
                  >
                    Add to Cart • {formatPriceStr(parsePriceNum(selectedProductDetail.price) * modalQty, selectedProductDetail.price)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CART DRAWER MODAL */}
      {isCartOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 250, display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}>
          <div style={{ width: window.innerWidth < 500 ? "100%" : 450, height: "100vh", background: isDarkMode ? "#161618" : "#fff", borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column", boxShadow: "-10px 0 40px rgba(0,0,0,0.5)", animation: "slideLeft 0.3s ease" }}>
            <div style={{ padding: "24px 32px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: t.text }}>Shopping Cart</h2>
                <span style={{ background: "#c8b89a", color: "#0f0f10", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 10 }}>
                  {cart.reduce((sum, item) => sum + item.qty, 0)}
                </span>
              </div>
              <button onClick={() => setIsCartOpen(false)} style={{ background: "none", border: "none", color: t.subtext, cursor: "pointer", fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
              {cart.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: t.subtext, textAlign: "center" }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ marginBottom: 16, opacity: 0.5 }}>
                    <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: t.text }}>Your cart is empty</p>
                  <p style={{ fontSize: 13, maxWidth: 250 }}>Explore trending products or storefronts to add items to your cart.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 16, alignItems: "center", background: isDarkMode ? "#111113" : "#f9fafb", padding: 16, borderRadius: 16, border: `1px solid ${t.border}` }}>
                    <img src={item.imageUrl} alt={item.name} style={{ width: 70, height: 70, borderRadius: 12, objectFit: "cover", background: "#1a1a1e" }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 4 }}>{item.name}</h4>
                      <p style={{ fontSize: 12, color: t.subtext, marginBottom: 8 }}>{item.store} • Qty: {item.qty}</p>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#c8b89a" }}>{formatPriceStr(item.priceNum * item.qty, item.price)}</span>
                    </div>
                    <button
                      onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 8, opacity: 0.8 }}
                      title="Remove item"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div style={{ padding: "24px 32px", borderTop: `1px solid ${t.border}`, background: isDarkMode ? "#111113" : "#f9fafb" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: t.text }}>Subtotal</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#c8b89a" }}>
                    {formatPriceStr(cart.reduce((sum, item) => sum + (item.priceNum * item.qty), 0), cart[0]?.price)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, zIndex: 300 });
                    setCart([]);
                    setIsCartOpen(false);
                    showToast("🎉 Order Placed Successfully! AI Concierge has initiated fulfillment.");
                  }}
                  style={{ width: "100%", background: "#c8b89a", color: "#0f0f10", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(200,184,154,0.3)" }}
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
</div>
  );
};
