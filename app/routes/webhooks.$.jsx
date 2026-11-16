import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  // authenticate.webhook 会自动校验 HMAC 签名：
  // 签名无效时自动抛出 401 Unauthorized Response；签名有效时解析出 topic 和 shop
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case "APP_UNINSTALLED":
    case "SHOP_REDACT":
      if (shop) {
        await db.session.deleteMany({ where: { shop } });
      }
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
      // 本应用不存储任何客户个人数据，校验 HMAC 后直接返回 200 即可
      break;
    default:
      break;
  }

  return new Response("OK", { status: 200 });
};