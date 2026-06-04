import React from 'react';
import { SECTION_REGISTRY } from './SectionRegistry';

export function DynamicRenderer({ layout, globalProps }) {
  if (!layout || !Array.isArray(layout)) return null;
  return (
    <div className="dynamic-layout-root">
      {layout.map((section, idx) => {
        if (!section || !section.type) return null;
        const registryEntry = SECTION_REGISTRY[section.type];
        if (!registryEntry) {
          console.warn(`Section type "${section.type}" not found in registry.`);
          return null;
        }
        // Find variant or fallback
        const variants = registryEntry.variants || {};
        const VariantComponent = variants[section.variant] || variants["centered"] || variants["grid"] || Object.values(variants)[0];
        if (typeof VariantComponent !== "function") {
          console.error(`No valid variant found for section "${section.type}"`);
          return null;
        }
        const combinedProps = {
          ...globalProps,
          ...(section.props || {}),
          products: globalProps.products?.length ? globalProps.products : section.props?.products || [],
          items: globalProps.items?.length ? globalProps.items : section.props?.items || [],
          title: globalProps.title || section.props?.title,
          subtitle: globalProps.subtitle || section.props?.subtitle,
          buttonText: globalProps.buttonText || section.props?.buttonText,
          collection: globalProps.collection || section.props?.collection,
        };
        return (
          <div key={section.id || `${section.type}-${idx}`} className={`section-wrapper-${section.type}`}>
            <section id={section.id} style={{ position: "relative" }}>
              <VariantComponent {...combinedProps} />
            </section>
            {(() => {
              if (section.type !== "hero") return null;
              const sVids = globalProps.storeVideos && globalProps.storeVideos.length > 0
                ? globalProps.storeVideos
                : (globalProps.storeVideo ? [globalProps.storeVideo] : []);
              if (sVids.length === 0) return null;
              return (
                <section style={{ padding: "60px 40px", background: globalProps.isDarkMode ? "#0f0f10" : "#ffffff" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                    {[...new Set(sVids)].map((vidUrl, i) => (
                      <div key={i} style={{ maxWidth: 1100, margin: "0 auto", borderRadius: 24, overflow: "hidden", position: "relative", aspectRatio: "21/9", background: globalProps.isDarkMode ? "#1a1a1e" : "#f3f4f6", border: `1px solid ${globalProps.isDarkMode ? "#2a2a2e" : "#e5e7eb"}`, width: "100%" }}>
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
            {(() => {
              if (section.type !== "featured_products") return null;
              const pVids = globalProps.promoVideos && globalProps.promoVideos.length > 0
                ? globalProps.promoVideos
                : (globalProps.promoVideo ? [globalProps.promoVideo] : []);
              if (pVids.length === 0) return null;
              return (
                <section style={{ padding: "80px 40px", background: globalProps.isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", borderTop: `1px solid ${globalProps.isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                  <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
                      <div>
                        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: globalProps.isDarkMode ? "#fff" : "#111", marginBottom: 8 }}>
                          Featured Promo Campaigns
                        </h2>
                        <p style={{ color: globalProps.isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", fontSize: 16 }}>
                          Exclusive promotions and flash sales powered by Veo AI.
                        </p>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, background: "#ef4444", color: "#fff", padding: "6px 16px", borderRadius: 100, textTransform: "uppercase", letterSpacing: 1 }}>Live Now</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
                      {[...new Set(pVids)].map((vidUrl, i) => (
                        <div key={i} style={{ borderRadius: 16, overflow: "hidden", position: "relative", aspectRatio: "9/16", background: globalProps.isDarkMode ? "#1a1a1e" : "#f3f4f6", border: `1px solid ${globalProps.isDarkMode ? "#2a2a2e" : "#e5e7eb"}` }}>
                          <video src={vidUrl} autoPlay loop muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)" }} />
                          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div>
                              <h3 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 4, fontFamily: "'Playfair Display', serif" }}>{globalProps.title || "My Store"}</h3>
                              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>Special Campaign</p>
                            </div>
                            <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, background: "#ef4444", padding: "8px 16px", borderRadius: 100, border: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                              Shop Now
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

