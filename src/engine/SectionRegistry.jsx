import React from 'react';
import { storeThemeDark, storeThemeLight } from '../utils/constants';
import { ImageLoadingPlaceholder } from '../components/ImageLoadingPlaceholder';

export const SECTION_REGISTRY = {
  hero: {
    variants: {
      centered: (props) => {
        if (!props.title && !props.subtitle && !props.buttonText && !props.heroImage) return null;
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const resolvedBg = props.heroImage ? `url('${props.heroImage}')` : (props.isDarkMode ? props.heroBg : "linear-gradient(to bottom, #ffffff, #f3f4f6)");
        const overlayOpacity = props.heroImage ? (props.isDarkMode ? 0.6 : 0.3) : 0;
        return (
          <div style={{
            minHeight: props.height || 500,
            background: resolvedBg,
            backgroundSize: "cover", backgroundPosition: "center", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
            padding: "0 20px", transition: "background 0.3s ease"
          }}>
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0, transition: "background 0.3s ease" }}></div>
            <div style={{ position: "relative", zIndex: 2, maxWidth: 700 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: props.themeColor, letterSpacing: 4, textTransform: "uppercase", display: "block", marginBottom: 16 }}>{props.collection}</span>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 52, fontWeight: 600, lineHeight: 1.1, marginBottom: 20, color: props.heroImage ? "#fff" : t.text.primary, transition: "color 0.3s ease" }}>{props.title}</h1>
              <p style={{ fontSize: 16, color: props.heroImage ? "#ccc" : t.text.secondary, maxWidth: 500, margin: "0 auto", lineHeight: 1.6, transition: "color 0.3s ease" }}>{props.subtitle}</p>
              <button style={{
                marginTop: 32, background: props.themeColor, color: "#0f0f10",
                border: "none", padding: "14px 40px", borderRadius: 6,
                fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.3s ease"
              }}>{props.buttonText}</button>
            </div>
          </div>
        );
      },
      split: (props) => {
        if (!props.title && !props.subtitle && !props.buttonText && !props.heroImage) return null;
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const resolvedBg = props.heroImage ? `url('${props.heroImage}')` : (props.isDarkMode ? props.heroBg : "linear-gradient(to right, #ffffff, #f3f4f6)");
        const overlayOpacity = props.heroImage ? (props.isDarkMode ? 0.6 : 0.3) : 0;
        return (
          <div style={{
            minHeight: props.height || 600,
            background: resolvedBg,
            backgroundSize: "cover", backgroundPosition: "center", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left",
            padding: "0 60px", transition: "background 0.3s ease"
          }}>
            <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0, transition: "background 0.3s ease" }}></div>
            <div style={{ position: "relative", zIndex: 2, maxWidth: 500 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: props.themeColor, letterSpacing: 4, textTransform: "uppercase", display: "block", marginBottom: 16 }}>{props.collection}</span>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 56, fontWeight: 600, lineHeight: 1.1, marginBottom: 20, color: props.heroImage ? "#fff" : t.text.primary, transition: "color 0.3s ease" }}>{props.title}</h1>
              <p style={{ fontSize: 16, color: props.heroImage ? "#ccc" : t.text.secondary, lineHeight: 1.6, transition: "color 0.3s ease" }}>{props.subtitle}</p>
              <button style={{
                marginTop: 32, background: props.themeColor, color: "#0f0f10",
                border: "none", padding: "14px 40px", borderRadius: 6,
                fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 1, transition: "all 0.3s ease"
              }}>{props.buttonText}</button>
            </div>
            {!props.heroImage && (
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0, width: "45%",
                background: `linear-gradient(90deg, transparent, ${props.isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'})`,
                backgroundSize: "cover", backgroundPosition: "center",
                clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
                opacity: 0.8, zIndex: 1
              }}></div>
            )}
          </div>
        );
      },
      "cinematic-fullscreen": (props) => {
        if (!props.title && !props.subtitle && !props.buttonText && !props.heroImage) return null;
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const resolvedBg = props.heroImage ? `url('${props.heroImage}')` : (props.isDarkMode ? props.heroBg : "linear-gradient(to bottom, #ffffff, #f9fafb)");
        const overlayColor = props.isDarkMode ? "rgba(0,0,0,0.2), rgba(0,0,0,0.8)" : "rgba(255,255,255,0.1), rgba(255,255,255,0.6)";
        return (
          <div style={{
            height: "100vh",
            background: resolvedBg,
            backgroundSize: "cover", backgroundPosition: "center", position: "relative",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center",
            padding: "0 20px", transition: "background 0.3s ease"
          }}>
            <div style={{ position: "absolute", inset: 0, background: props.heroImage ? (props.isDarkMode ? "linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8))" : "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5))") : `linear-gradient(to bottom, ${overlayColor})`, zIndex: 0, transition: "background 0.3s ease" }}></div>
            <div style={{ position: "relative", zIndex: 2, maxWidth: 900 }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 84, fontWeight: 300,
                lineHeight: 1, marginBottom: 24, letterSpacing: "-0.02em",
                textShadow: props.heroImage || props.isDarkMode ? "0 10px 30px rgba(0,0,0,0.5)" : "none",
                color: props.heroImage ? "#fff" : t.text.primary, transition: "color 0.3s ease"
              }}>{props.title}</h1>
              <p style={{ fontSize: 20, opacity: 0.8, maxWidth: 600, margin: "0 auto 40px", fontWeight: 300, letterSpacing: 1, color: props.heroImage ? "#fff" : t.text.secondary, transition: "color 0.3s ease" }}>{props.subtitle}</p>
              <button style={{
                background: props.heroImage || props.isDarkMode ? "#fff" : "#111", color: props.heroImage || props.isDarkMode ? "#000" : "#fff", border: "none", padding: "18px 48px", borderRadius: 100,
                fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.3s ease",
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}>{props.buttonText}</button>
            </div>
            <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", animation: "pulse 2s infinite", color: props.heroImage ? "#fff" : t.text.primary }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
            </div>
          </div>
        );
      }
    }
  },
  featured_products: {
    variants: {
      grid: (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const skStyle = {
          backgroundImage: t.surface.skeleton,
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s infinite linear"
        };
        return (
          <div style={{ padding: "60px 40px", transition: "background 0.3s ease" }}>
            <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: t.text.primary, transition: "color 0.3s ease" }}>{props.sectionTitle || "Curated Selection"}</h2>
              <span style={{ fontSize: 12, color: props.isDarkMode ? props.themeColor : t.text.primary, cursor: "pointer", fontWeight: 600, letterSpacing: 1, transition: "color 0.3s ease" }}>EXPLORE ALL</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 30 }}>
              {((props.products && props.products.length > 0) ? props.products : (props.isBuilding ? Array(4).fill({ name: "Generating Product...", price: "...", desc: "Curating product details and imagery..." }) : [])).map((p, i) => (
                <div
                  key={i}
                  className="product-card hover-lift"
                  onClick={() => {
                    if (props.onSelectProduct) {
                      props.onSelectProduct({
                        name: p.name,
                        price: p.price,
                        desc: p.desc || p.description || "Premium botanical formulation and high-quality curated selection. Crafted for optimal results and daily elegance.",
                        imageUrl: p.imageUrl,
                        promo: p.promo || "Curated",
                        store: props.title || "Brand Store",
                        rating: "4.9",
                        sales: "1.2K+ sold"
                      });
                    }
                  }}
                  style={{
                    background: props.isDarkMode ? "#161618" : "#f9fafb",
                    border: "none",
                    borderRadius: 16,
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease"
                  }}
                >
                  {/* Image: shimmer while loading, real image on top */}
                  <div style={{ aspectRatio: "1 / 1", width: "100%", position: "relative", ...(p.verifiedUrl ? { backgroundColor: t.surface.secondary } : skStyle), transition: "background-color 0.3s ease" }}>
                    {!p.verifiedUrl && <ImageLoadingPlaceholder />}
                    {p.imageUrl && (
                      <img
                        key={`${p.imageUrl}-${p.verifiedUrl ? 'verified' : 'pending'}`}
                        src={p.imageUrl}
                        alt={p.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: p.verifiedUrl ? 1 : 0, transition: "opacity 0.5s ease-in" }}
                        onLoad={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.display = "block"; }}
                        onError={e => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                    {p.promo && <div style={{ position: "absolute", top: 12, left: 12, background: props.themeColor || "rgba(200,184,154,0.9)", color: "#000", fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 10, zIndex: 2, backdropFilter: "blur(4px)" }}>{p.promo}</div>}
                  </div>
                  {/* Text Container */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text.primary, transition: "color 0.3s ease", marginBottom: 4, lineHeight: 1.3 }}>{p.name}</h3>
                    <p style={{ fontSize: 12, color: t.text.secondary, marginBottom: 12, lineHeight: 1.4, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", transition: "color 0.3s ease" }}>{p.desc || p.description || "Premium botanical formulation and high-quality curated selection."}</p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: props.themeColor || "#c8b89a" }}>{p.price}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.text.secondary }}>
                        <span>⭐ 4.9</span>
                        <span>•</span>
                        <span>Hot</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      },
      "editorial-grid": (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        return (
          <div style={{ padding: "80px 40px", background: t.surface.primary, transition: "background 0.3s ease" }}>
            <div style={{ maxWidth: 600, marginBottom: 60 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, color: t.text.primary, marginBottom: 20, transition: "color 0.3s ease" }}>The Collection</h2>
              <p style={{ color: t.text.secondary, fontSize: 18, lineHeight: 1.6, transition: "color 0.3s ease" }}>Discover our latest pieces, crafted with precision and designed for the modern individual.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 20 }}>
              {((props.products && props.products.length > 0) ? props.products : (props.isBuilding ? Array(3).fill({ name: "Generating...", price: "..." }) : [])).slice(0, 3).map((p, i) => (
                <div key={i} style={{ gridColumn: i === 0 ? "span 8" : "span 4", height: i === 0 ? 600 : 290, position: "relative", overflow: "hidden", borderRadius: 4, backgroundColor: t.surface.secondary, transition: "background-color 0.3s ease" }}>
                  <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={p.name} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 30 }}>
                    <h3 style={{ color: "#fff", fontSize: i === 0 ? 32 : 18 }}>{p.name}</h3>
                    <p style={{ color: props.themeColor, fontWeight: 600, marginTop: 5 }}>{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  },
  philosophy: {
    variants: {
      scroller: (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const items = props.items || [];
        const doubledItems = [...items, ...items]; // For infinite scroll effect
        return (
          <div style={{ padding: "80px 0", background: "transparent", overflow: "hidden", transition: "background 0.3s ease" }}>
            <div style={{ padding: "0 40px", marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: t.text.primary, transition: "color 0.3s ease" }}>Our Ethos</h2>
            </div>
            <div className="hide-scrollbar" style={{ overflowX: "hidden" }}>
              <div className="philosophy-scroller">
                {doubledItems.map((v, i) => (
                  <div key={i} onClick={() => props.onSelectPhilosophy && props.onSelectPhilosophy(v)} style={{ flex: "0 0 350px", height: 450, position: "relative", borderRadius: 24, overflow: "hidden", cursor: "pointer", ...(v.verifiedUrl ? { backgroundColor: t.surface.secondary } : { backgroundImage: t.surface.skeleton, backgroundSize: "200% 100%", animation: "shimmer 1.8s infinite linear" }), transition: "background-color 0.3s ease" }}>
                    {!v.verifiedUrl && <ImageLoadingPlaceholder />}
                    {v.imageUrl && <img key={`${v.imageUrl}-${v.verifiedUrl ? 'verified' : 'pending'}`} src={v.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: v.verifiedUrl ? 1 : 0, transition: "opacity 0.5s ease-in" }} onLoad={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.display = "block"; }} onError={e => { e.currentTarget.style.display = "none"; }} />}
                    <div style={{ position: "absolute", inset: 0, padding: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)", transition: "background 0.3s ease" }}>
                      <h4 style={{ fontSize: 12, fontWeight: 800, color: props.themeColor || "#fff", letterSpacing: 4, textTransform: "uppercase", marginBottom: 12, transition: "color 0.3s ease" }}>{v.label || v.title}</h4>
                      <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, fontWeight: 300, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", transition: "color 0.3s ease" }}>{v.sub || v.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    }
  },
  trust_bar: {
    variants: {
      ticker: (props) => null, // Legacy
      "static-badges": (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        return (
          <div style={{ padding: "40px 20px", background: t.surface.secondary, borderBottom: `1px solid ${t.border.subtle}`, borderTop: `1px solid ${t.border.subtle}`, transition: "all 0.3s ease" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "40px 80px" }}>
              {((props.items && props.items.length > 0) ? props.items : [
                { label: "Premium Quality", icon: "", sub: "Handcrafted" },
                { label: "Free Shipping", icon: "📦", sub: "Worldwide" },
                { label: "Secure Payment", icon: "&#128274;", sub: "256-bit SSL" }
              ]).map((v, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 28, opacity: 0.8 }}>{v.icon || ""}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: t.text.primary, textTransform: "uppercase", letterSpacing: 1, transition: "color 0.3s ease" }}>{v.label}</div>
                    <div style={{ fontSize: 12, color: t.text.secondary, marginTop: 2, transition: "color 0.3s ease" }}>{v.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  },
  testimonials: {
    variants: {
      cards: (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const fallbackTestimonials = [
          { author: "Eleanor V.", title: "Verified Buyer", quote: "An absolute game changer for my daily routine. The quality is unmatched." },
          { author: "Marcus T.", title: "Verified Buyer", quote: "I've tried everything on the market, but this brand finally delivers on its promises." },
          { author: "Sophia L.", title: "Verified Buyer", quote: "The aesthetic is beautiful and the product itself feels incredibly premium." }
        ];
        const displayTestimonials = (props.testimonials && props.testimonials.length > 0) ? props.testimonials : fallbackTestimonials;
        return (
          <div style={{ padding: "100px 40px", background: t.surface.primary, transition: "background 0.3s ease" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: t.text.primary, textAlign: "center", marginBottom: 60, transition: "color 0.3s ease" }}>Client Perspectives</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 30 }}>
                {displayTestimonials.map((testimonial, i) => (
                  <div key={i} style={{ padding: 40, background: t.surface.card, borderRadius: 16, border: `1px solid ${t.border.subtle}`, transition: "all 0.3s ease" }}>
                    <div style={{ color: props.themeColor || (props.isDarkMode ? "#fff" : "#000"), marginBottom: 20, fontSize: 18, transition: "color 0.3s ease" }}>★★★★★</div>
                    <p style={{ color: t.text.secondary, fontSize: 16, lineHeight: 1.6, fontStyle: "italic", marginBottom: 30, transition: "color 0.3s ease" }}>"{testimonial.quote}"</p>
                    <div style={{ borderTop: `1px solid ${t.border.subtle}`, paddingTop: 20, transition: "border-color 0.3s ease" }}>
                      <div style={{ color: t.text.primary, fontWeight: 700, fontSize: 14, transition: "color 0.3s ease" }}>{testimonial.author}</div>
                      <div style={{ color: t.text.muted, fontSize: 12, marginTop: 4, transition: "color 0.3s ease" }}>{testimonial.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    }
  },
  faq: {
    variants: {
      accordion: (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        const fallbackFaq = [
          { q: "What makes your products different?", a: "We combine autonomous AI curation with the highest quality sustainable materials to create bespoke experiences." },
          { q: "How long does shipping take?", a: "Orders are processed immediately by our AI systems. Standard shipping takes 3-5 business days globally." },
          { q: "Are your products cruelty-free?", a: "Absolutely. We are committed to 100% ethical and cruelty-free practices across our entire supply chain." }
        ];
        const displayFaq = (props.faq && props.faq.length > 0) ? props.faq : fallbackFaq;
        return (
          <div style={{ padding: "100px 40px", background: t.surface.primary, transition: "background 0.3s ease" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: t.text.primary, textAlign: "center", marginBottom: 60, transition: "color 0.3s ease" }}>Common Questions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {displayFaq.map((f, i) => (
                  <div key={i} style={{ background: t.surface.secondary, padding: "24px 30px", borderRadius: 12, border: `1px solid ${t.border.subtle}`, transition: "all 0.3s ease" }}>
                    <h4 style={{ color: t.text.primary, fontSize: 16, fontWeight: 600, marginBottom: 12, transition: "color 0.3s ease" }}>{f.q}</h4>
                    <p style={{ color: t.text.secondary, fontSize: 15, lineHeight: 1.6, transition: "color 0.3s ease" }}>{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }
    }
  },
  footer: {
    variants: {
      default: (props) => {
        const t = props.isDarkMode ? storeThemeDark : storeThemeLight;
        return (
          <footer style={{ background: t.surface.primary, borderTop: `1px solid ${t.border.subtle}`, padding: "80px 40px 40px 40px", color: t.text.muted, fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 60, marginBottom: 60 }}>
              {/* Col 1: Brand & AI Status */}
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: t.text.primary, marginBottom: 12, transition: "color 0.3s ease" }}>
                  {props.title || "My Store"}
                </h3>
                <p style={{ fontSize: 14, color: t.text.muted, marginBottom: 24, lineHeight: 1.6, transition: "color 0.3s ease" }}>
                  {props.subtitle || "Powered by SERA AI Agent Commerce OS."}
                </p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: t.surface.secondary, border: `1px solid ${t.border.subtle}`, padding: "6px 12px", borderRadius: 10, transition: "all 0.3s ease" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                  <span style={{ fontSize: 11, color: t.text.primary, fontWeight: 600, transition: "color 0.3s ease" }}>AI Concierge Active • 24/7 Fulfilling</span>
                </div>
              </div>
              {/* Col 2: Navigation Links */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text.primary, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20, transition: "color 0.3s ease" }}>Explore</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                  <a href="#init-products" style={{ color: t.text.muted, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Curated Selection</a>
                  <a href="#init-philosophy" style={{ color: t.text.muted, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Our Ethos</a>
                  <a href="#init-hero" style={{ color: t.text.muted, textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Spring Release</a>
                  <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>AI Formulations</span>
                </div>
              </div>
              {/* Col 3: Support & Trust */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text.primary, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20, transition: "color 0.3s ease" }}>Support & Trust</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                  <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>24/7 AI Concierge</span>
                  <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Track Fulfillment</span>
                  <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Shipping & Returns</span>
                  <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted}>Privacy & Security</span>
                </div>
              </div>
              {/* Col 4: Newsletter */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text.primary, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20, transition: "color 0.3s ease" }}>AI Drops</h4>
                <p style={{ fontSize: 13, color: t.text.muted, marginBottom: 16, lineHeight: 1.5, transition: "color 0.3s ease" }}>Subscribe to receive early access to autonomous drops and bespoke formulations.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${t.border.subtle}`, background: t.surface.secondary, color: t.text.primary, outline: "none", transition: "all 0.3s ease" }} />
                  <button style={{ background: props.themeColor || t.text.primary, color: props.isDarkMode ? "#000" : "#fff", border: "none", padding: "0 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", transition: "all 0.3s ease" }}>JOIN</button>
                </div>
              </div>
            </div>
            <div style={{ maxWidth: 1200, margin: "0 auto", borderTop: `1px solid ${t.border.subtle}`, paddingTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, transition: "border-color 0.3s ease" }}>
              <p style={{ fontSize: 13, color: t.text.muted, transition: "color 0.3s ease" }}>&copy; 2026 {props.title || "SERA Store"}. Generated autonomously by SERA Architecture.</p>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s", display: "flex", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted} title="X / Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </span>
                <span style={{ color: t.text.muted, cursor: "pointer", transition: "color 0.2s", display: "flex", alignItems: "center" }} onMouseEnter={e => e.currentTarget.style.color = props.themeColor} onMouseLeave={e => e.currentTarget.style.color = t.text.muted} title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </span>
              </div>
            </div>
          </footer>
        );
      }
    }
  }
};
/**
 * DYNAMIC RENDERER
 * Maps the Layout Tree (Schema) to the Section Registry.
 */
