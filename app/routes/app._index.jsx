import { useState, useEffect } from "react";
import { useSubmit, useLoaderData, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";

const THEME_PRESETS = [
  {
    name: "Crimson Flash Sale",
    badge: "Popular",
    bgColor: "#fff5f5",
    borderColor: "#feb2b2",
    textColor: "#1a202c",
    digitBgColor: "#e53e3e",
    digitTextColor: "#ffffff",
  },
  {
    name: "Midnight Luxury",
    badge: "Dark",
    bgColor: "#111827",
    borderColor: "#374151",
    textColor: "#f9fafb",
    digitBgColor: "#f59e0b",
    digitTextColor: "#111827",
  },
  {
    name: "Ocean Trust",
    badge: "Clean",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    textColor: "#1e3a8a",
    digitBgColor: "#2563eb",
    digitTextColor: "#ffffff",
  },
];

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let storeProducts = [];
  let settings = {
    heading: "FLASH DEAL ENDS IN",
    urgencyNote: "Order before the timer runs out to claim your special price.",
    bgColor: "#fff5f5",
    borderColor: "#feb2b2",
    textColor: "#1a202c",
    digitBgColor: "#e53e3e",
    digitTextColor: "#ffffff",
    hours: "04",
    minutes: "30",
  };

  try {
    const metaResponse = await admin.graphql(`
      #graphql
      query getSavedTimerSettings {
        currentAppInstallation {
          metafield(namespace: "product_timer", key: "settings") {
            value
          }
        }
      }
    `);
    const metaJson = await metaResponse.json();
    const rawValue = metaJson?.data?.currentAppInstallation?.metafield?.value;
    if (rawValue) {
      settings = { ...settings, ...JSON.parse(rawValue) };
    }
  } catch (metaErr) {
    console.error("Failed to load metafield settings:", metaErr);
  }

  try {
    const prodResponse = await admin.graphql(`
      #graphql
      query getStoreProductsForPreview {
        products(first: 10) {
          nodes {
            id
            title
            featuredMedia {
              preview {
                image {
                  url
                }
              }
            }
            variants(first: 1) {
              nodes {
                price
              }
            }
          }
        }
      }
    `);
    const prodJson = await prodResponse.json();
    const nodes = prodJson?.data?.products?.nodes || [];
    storeProducts = nodes.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.variants?.nodes?.[0]?.price || "29.99",
      image: p.featuredMedia?.preview?.image?.url || null,
    }));
  } catch (prodErr) {
    console.error("Failed to load store products:", prodErr);
  }

  return { settings, storeProducts };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    const payload = {
      heading: formData.get("heading") || "FLASH DEAL ENDS IN",
      urgencyNote: formData.get("urgencyNote") || "",
      bgColor: formData.get("bgColor") || "#fff5f5",
      borderColor: formData.get("borderColor") || "#feb2b2",
      textColor: formData.get("textColor") || "#1a202c",
      digitBgColor: formData.get("digitBgColor") || "#e53e3e",
      digitTextColor: formData.get("digitTextColor") || "#ffffff",
      hours: formData.get("hours") || "04",
      minutes: formData.get("minutes") || "30",
    };

    const appRes = await admin.graphql(`
      #graphql
      query getAppInstallationId {
        currentAppInstallation {
          id
        }
      }
    `);
    const appData = await appRes.json();
    const ownerId = appData?.data?.currentAppInstallation?.id;

    if (ownerId) {
      await admin.graphql(
        `#graphql
        mutation setProductTimerSettings($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields {
              key
              value
            }
          }
        }`,
        {
          variables: {
            metafields: [
              {
                ownerId,
                namespace: "product_timer",
                key: "settings",
                type: "json",
                value: JSON.stringify(payload),
              },
            ],
          },
        }
      );
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err?.message };
  }
};

export default function ProductTimerIndex() {
  const { settings, storeProducts } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [heading, setHeading] = useState(settings.heading);
  const [urgencyNote, setUrgencyNote] = useState(settings.urgencyNote);
  const [bgColor, setBgColor] = useState(settings.bgColor);
  const [borderColor, setBorderColor] = useState(settings.borderColor);
  const [textColor, setTextColor] = useState(settings.textColor);
  const [digitBgColor, setDigitBgColor] = useState(settings.digitBgColor);
  const [digitTextColor, setDigitTextColor] = useState(settings.digitTextColor);
  const [hours, setHours] = useState(settings.hours);
  const [minutes, setMinutes] = useState(settings.minutes);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHeading(settings.heading);
    setUrgencyNote(settings.urgencyNote);
    setBgColor(settings.bgColor);
    setBorderColor(settings.borderColor);
    setTextColor(settings.textColor);
    setDigitBgColor(settings.digitBgColor);
    setDigitTextColor(settings.digitTextColor);
    setHours(settings.hours);
    setMinutes(settings.minutes);
  }, [settings]);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const applyPreset = (preset) => {
    setBgColor(preset.bgColor);
    setBorderColor(preset.borderColor);
    setTextColor(preset.textColor);
    setDigitBgColor(preset.digitBgColor);
    setDigitTextColor(preset.digitTextColor);
  };

  const handleSave = () => {
    submit(
      { heading, urgencyNote, bgColor, borderColor, textColor, digitBgColor, digitTextColor, hours, minutes },
      { method: "post" }
    );
  };

  const currentProduct = storeProducts[selectedProductIndex] || {
    title: "Store Product",
    price: "0.00",
    image: null,
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", backgroundColor: "#f1f2f4", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#1a1c1d" }}>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* 顶部通栏 */}
        <div style={{ background: "#ffffff", padding: "20px 24px", borderRadius: "12px", border: "1px solid #e3e5e7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "-0.3px" }}>Product Page Countdown Timer</h1>
              <span style={{ backgroundColor: "#e3f1df", color: "#108043", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "20px" }}>AUTO ABOVE PRODUCT TITLE</span>
            </div>
            <p style={{ fontSize: "13px", color: "#616a75", margin: "4px 0 0 0" }}>Automatically displays an urgency countdown card right above your product title on all product pages.</p>
          </div>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving}
            style={{ backgroundColor: isSaving ? "#8c9196" : "#111213", color: "#ffffff", border: "none", padding: "11px 26px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}
          >
            {isSaving ? "Saving Changes..." : (saved ? "✓ Saved to Store" : "Save & Publish")}
          </button>
        </div>

        {saved && (
          <div style={{ padding: "14px 18px", backgroundColor: "#e3f1df", border: "1px solid #9bc995", borderRadius: "10px", marginBottom: "20px", color: "#108043", fontSize: "14px", fontWeight: "500" }}>
            ✓ Settings updated! Your product page countdown timer is now live above the product title.
          </div>
        )}

        {/* 主体双栏布局 */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "24px", alignItems: "start" }}>
          
          {/* 左侧：配置面板 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "#ffffff", borderRadius: "12px", padding: "22px", border: "1px solid #e3e5e7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 4px 0" }}>Quick Theme Presets</h3>
              <p style={{ fontSize: "12.5px", color: "#616a75", margin: "0 0 14px 0" }}>One-click designer color schemes tailored for high conversion.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: bgColor === preset.bgColor && digitBgColor === preset.digitBgColor ? "2px solid #111213" : "1px solid #dcdfe3",
                      background: preset.bgColor,
                      color: preset.textColor,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: preset.digitBgColor, display: "inline-block" }}></span>
                      <span style={{ fontSize: "10px", fontWeight: "700", opacity: 0.75 }}>{preset.badge}</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700" }}>{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#ffffff", borderRadius: "12px", padding: "22px", border: "1px solid #e3e5e7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px 0" }}>Content & Countdown Duration</h3>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#303336" }}>Badge Headline</label>
                <input type="text" value={heading} onChange={(e) => setHeading(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #c9cccf", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#303336" }}>Urgency Subtext</label>
                <input type="text" value={urgencyNote} onChange={(e) => setUrgencyNote(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #c9cccf", fontSize: "14px", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#303336" }}>Hours</label>
                  <input type="number" min="0" max="99" value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #c9cccf", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#303336" }}>Minutes</label>
                  <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #c9cccf", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ background: "#ffffff", borderRadius: "12px", padding: "22px", border: "1px solid #e3e5e7", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 16px 0" }}>Custom Color Fine-Tuning</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", marginBottom: "6px", color: "#4a4f55" }}>Card Background</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #c9cccf", padding: "4px 8px", borderRadius: "8px" }}>
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: "28px", height: "28px", border: "none", background: "none", cursor: "pointer" }} />
                    <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{bgColor}</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", marginBottom: "6px", color: "#4a4f55" }}>Border Accent</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #c9cccf", padding: "4px 8px", borderRadius: "8px" }}>
                    <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ width: "28px", height: "28px", border: "none", background: "none", cursor: "pointer" }} />
                    <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{borderColor}</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", marginBottom: "6px", color: "#4a4f55" }}>Timer Box Fill</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", border: "1px solid #c9cccf", padding: "4px 8px", borderRadius: "8px" }}>
                    <input type="color" value={digitBgColor} onChange={(e) => setDigitBgColor(e.target.value)} style={{ width: "28px", height: "28px", border: "none", background: "none", cursor: "pointer" }} />
                    <span style={{ fontSize: "13px", fontFamily: "monospace" }}>{digitBgColor}</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: "600", marginBottom: "6px", color: "#4a4f55" }}>Heading & Digit Text</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="color" title="Heading Text" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ flex: 1, height: "38px", border: "1px solid #c9cccf", borderRadius: "8px", cursor: "pointer" }} />
                    <input type="color" title="Digit Text" value={digitTextColor} onChange={(e) => setDigitTextColor(e.target.value)} style={{ flex: 1, height: "38px", border: "1px solid #c9cccf", borderRadius: "8px", cursor: "pointer" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：读取店铺真实商品的实景预览 */}
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e3e5e7", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", position: "sticky", top: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "12px", borderBottom: "1px solid #f0f1f3" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#616a75", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live Store Product Preview</span>
              <span style={{ fontSize: "11px", color: "#108043", backgroundColor: "#e3f1df", padding: "2px 8px", borderRadius: "6px", fontWeight: "600" }}>Above Product Title</span>
            </div>

            {storeProducts.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#4a4f55", marginBottom: "6px" }}>
                  Preview with your store product ({storeProducts.length} loaded):
                </label>
                <select
                  value={selectedProductIndex}
                  onChange={(e) => setSelectedProductIndex(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #c9cccf", fontSize: "13px", backgroundColor: "#fff" }}
                >
                  {storeProducts.map((prod, idx) => (
                    <option key={prod.id} value={idx}>
                      {prod.title} — ${prod.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ padding: "16px", backgroundColor: "#fafafa", borderRadius: "10px", border: "1px dashed #d2d5d8" }}>
              <div style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                color: textColor,
                padding: "16px 18px",
                borderRadius: "12px",
                marginBottom: "18px",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: digitBgColor }}></span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{heading}</span>
                    </div>
                    {urgencyNote && <div style={{ fontSize: "12px", opacity: 0.85, lineHeight: 1.4 }}>{urgencyNote}</div>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ background: digitBgColor, color: digitTextColor, padding: "7px 9px", borderRadius: "8px", minWidth: "42px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: "800", lineHeight: 1.1 }}>{String(hours).padStart(2, "0")}</div>
                      <div style={{ fontSize: "8.5px", fontWeight: "600", opacity: 0.85, marginTop: "2px" }}>HRS</div>
                    </div>
                    <span style={{ fontWeight: "800", fontSize: "15px", opacity: 0.6 }}>:</span>
                    <div style={{ background: digitBgColor, color: digitTextColor, padding: "7px 9px", borderRadius: "8px", minWidth: "42px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: "800", lineHeight: 1.1 }}>{String(minutes).padStart(2, "0")}</div>
                      <div style={{ fontSize: "8.5px", fontWeight: "600", opacity: 0.85, marginTop: "2px" }}>MIN</div>
                    </div>
                    <span style={{ fontWeight: "800", fontSize: "15px", opacity: 0.6 }}>:</span>
                    <div style={{ background: digitBgColor, color: digitTextColor, padding: "7px 9px", borderRadius: "8px", minWidth: "42px", textAlign: "center" }}>
                      <div style={{ fontSize: "16px", fontWeight: "800", lineHeight: 1.1 }}>48</div>
                      <div style={{ fontSize: "8.5px", fontWeight: "600", opacity: 0.85, marginTop: "2px" }}>SEC</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
                {currentProduct.image && (
                  <img
                    src={currentProduct.image}
                    alt={currentProduct.title}
                    style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e1e3e5" }}
                  />
                )}
                <div>
                  <div style={{ fontSize: "11px", color: "#8c9196", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>STOREFRONT PRODUCT</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#111213", marginBottom: "2px" }}>{currentProduct.title}</div>
                  <div style={{ fontSize: "15px", fontWeight: "600", color: "#303336" }}>${currentProduct.price}</div>
                </div>
              </div>

              <div style={{ backgroundColor: "#111213", color: "#fff", textAlign: "center", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: "600", opacity: 0.9 }}>
                Add to cart
              </div>
            </div>

            <div style={{ marginTop: "14px", fontSize: "12px", color: "#616a75", lineHeight: 1.5 }}>
              <strong>How to enable:</strong> Go to <em>Online Store → Themes → Customize → App embeds</em>, toggle on <strong>Product Deal Countdown</strong>, and click Save.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}