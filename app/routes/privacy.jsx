export const meta = () => {
  return [
    { title: "Privacy Policy - Product Page Countdown Timer" },
    { name: "description", content: "Privacy Policy for Product Page Countdown Timer Shopify App" },
  ];
};

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "820px", margin: "40px auto", padding: "32px 24px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: "1.7", color: "#1f2937", backgroundColor: "#ffffff" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px", color: "#111827" }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "28px" }}>
        Last updated: November 2026 | App: <strong>Product Page Countdown Timer</strong>
      </p>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
          1. Overview
        </h2>
        <p>
          Product Page Countdown Timer ("the App") provides customizable urgency countdown timer cards displayed above product titles on Shopify storefronts. This Privacy Policy describes how information is accessed, used, and protected when merchants install and use the App.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
          2. Information We Access & Use
        </h2>
        <p>
          When you install the App, we are automatically able to access certain types of information from your Shopify account solely to operate the App:
        </p>
        <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
          <li>
            <strong>Store & Authentication Data:</strong> Shop domain, access token, and app installation settings stored securely in Shopify App Metafields to render your configured countdown timer.
          </li>
          <li>
            <strong>Product Information (<code>read_products</code>):</strong> Basic product details (such as product titles, images, and prices) are read exclusively to populate the live storefront preview inside your App dashboard. We do not modify, sell, or permanently store your product catalog on external servers.
          </li>
          <li>
            <strong>Storefront Visitors:</strong> The App does not collect, track, or store personally identifiable information (PII), cookies, or payment details from your store's customers.
          </li>
        </ul>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
          3. Data Sharing & Retention
        </h2>
        <p>
          We never sell, rent, or trade merchant or customer data to third parties. Configuration settings remain stored within your Shopify store's app metafields while the App is installed. Upon uninstalling the App, all associated session tokens are promptly deleted in compliance with Shopify's mandatory data protection webhooks.
        </p>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
          4. GDPR & CCPA Compliance
        </h2>
        <p>
          If you or your customers are residents of the European Economic Area (EEA) or California, you have the right to access, correct, or request deletion of your personal data. Because the App does not store customer personal data, any mandatory Shopify data erasure requests are automatically fulfilled.
        </p>
      </section>

      <section>
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px", color: "#111827" }}>
          5. Contact Us
        </h2>
        <p>
          For questions regarding this Privacy Policy or data privacy practices, please contact our support team at:{" "}
          <a href="mailto:support@williamscookstools.com" style={{ color: "#2563eb", textDecoration: "underline" }}>
            support@williamscookstools.com
          </a>
        </p>
      </section>
    </div>
  );
}