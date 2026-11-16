import { useState, useEffect } from "react";
import { useSubmit, useLoaderData, useActionData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  let previewProductTitle = "Sample Product";
  let settings = {
    heading: "🔥 Limited Deal Ends In:",
    urgencyNote: "Order before timer expires to lock in current price!",
    bgColor: "#fff8f6",
    borderColor: "#ffccc7",
    textColor: "#262626",
    digitBgColor: "#cf1322",
    digitTextColor: "#ffffff",
    hours: "04",
    minutes: "30",
  };

  try {
    const response = await admin.graphql(`
      #graphql
      query getProductTimerSettings {
        products(first: 1) {
          nodes {
            title
          }
        }
        currentAppInstallation {
          metafield(namespace: "product_timer", key: "settings") {
            value
          }
        }
      }
    `);
    const json = await response.json();
    const firstProduct = json?.data?.products?.nodes?.[0];
    if (firstProduct?.title) {
      previewProductTitle = firstProduct.title;
    }
    const rawValue = json?.data?.currentAppInstallation?.metafield?.value;
    if (rawValue) {
      settings = { ...settings, ...JSON.parse(rawValue) };
    }
  } catch (metaErr) {
    console.error("GraphQL query failed:", metaErr);
  }

  return { settings, previewProductTitle };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  try {
    const payload = {
      heading: formData.get("heading") || "🔥 Limited Deal Ends In:",
      urgencyNote: formData.get("urgencyNote") || "",
      bgColor: formData.get("bgColor") || "#fff8f6",
      borderColor: formData.get("borderColor") || "#ffccc7",
      textColor: formData.get("textColor") || "#262626",
      digitBgColor: formData.get("digitBgColor") || "#cf1322",
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
  const { settings, previewProductTitle } = useLoaderData();
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
  const [saved, setSaved] = useState(false);

  const isSaving = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.success) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionData]);

  const handleSave = () => {
    submit(
      { heading, urgencyNote, bgColor, borderColor, textColor, digitBgColor, digitTextColor, hours, minutes },
      { method: "post" }
    );
  };

  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "#f6f6f7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#202223" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>
        
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px 0" }}>Product Page Countdown Timer</h1>
            <p style={{ fontSize: "13px", color: "#6d7175", margin: 0 }}>Embed an urgency timer block directly above your product Add-to-Cart button.</p>
          </div>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving}
            style={{ backgroundColor: isSaving ? "#8c9196" : "#008060", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: isSaving ? "not-allowed" : "pointer" }}
          >
            {isSaving ? "Saving..." : (saved ? "Saved!" : "Save Settings")}
          </button>
        </div>

        {saved && (
          <div style={{ padding: "12px 16px", backgroundColor: "#e3f1df", border: "1px solid #9bc995", borderRadius: "6px", marginBottom: "20px", color: "#1a5e18", fontSize: "14px" }}>
            Product countdown block settings saved!
          </div>
        )}

        {/* Product Block Live Preview */}
        <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e1e3e5", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "12px", fontWeight: "700", margin: "0 0 12px 0", color: "#6d7175", textTransform: "uppercase" }}>
            Product Page Block Preview ({previewProductTitle})
          </h3>
          <div style={{ maxWidth: "460px", backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: textColor, padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "10px" }}>{heading}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
              <div style={{ backgroundColor: digitBgColor, color: digitTextColor, padding: "8px 14px", borderRadius: "6px", minWidth: "54px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700" }}>{hours}</div>
                <div style="fontSize: 10px; opacity: 0.9;">HRS</div>
              </div>
              <div style={{ backgroundColor: digitBgColor, color: digitTextColor, padding: "8px 14px", borderRadius: "6px", minWidth: "54px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700" }}>{minutes}</div>
                <div style={{ fontSize: "10px", opacity: 0.9 }}>MIN</div>
              </div>
              <div style={{ backgroundColor: digitBgColor, color: digitTextColor, padding: "8px 14px", borderRadius: "6px", minWidth: "54px" }}>
                <div style={{ fontSize: "18px", fontWeight: "700" }}>45</div>
                <div style={{ fontSize: "10px", opacity: 0.9 }}>SEC</div>
              </div>
            </div>
            {urgencyNote && <div style={{ fontSize: "12px", opacity: 0.85 }}>{urgencyNote}</div>}
          </div>
        </div>

        {/* Settings Form */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e1e3e5" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0" }}>Block Copy & Duration</h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Timer Heading</label>
              <input type="text" value={heading} onChange={(e) => setHeading(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #c9cccf", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Urgency Subtext</label>
              <input type="text" value={urgencyNote} onChange={(e) => setUrgencyNote(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #c9cccf", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Hours</label>
                <input type="text" value={hours} onChange={(e) => setHours(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #c9cccf", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Minutes</label>
                <input type="text" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #c9cccf", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e1e3e5" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "600", margin: "0 0 16px 0" }}>Card & Digit Colors</h3>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>Card Background</label>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: "100%", height: "34px", border: "1px solid #c9cccf", borderRadius: "4px" }} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>Border Color</label>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ width: "100%", height: "34px", border: "1px solid #c9cccf", borderRadius: "4px" }} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>Digit Box Color</label>
              <input type="color" value={digitBgColor} onChange={(e) => setDigitBgColor(e.target.value)} style={{ width: "100%", height: "34px", border: "1px solid #c9cccf", borderRadius: "4px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "4px" }}>Text & Digit Color</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ flex: 1, height: "34px", border: "1px solid #c9cccf", borderRadius: "4px" }} />
                <input type="color" value={digitTextColor} onChange={(e) => setDigitTextColor(e.target.value)} style={{ flex: 1, height: "34px", border: "1px solid #c9cccf", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}