import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ICartModuleService, IPaymentModuleService } from "@medusajs/types";
import { Modules } from "@medusajs/utils";

interface SenangPayWebhookData {
  status_id: string;
  transaction_id: string;
  msg: string;
  order_id: string;
  hash: string;
  amount: string;
  name: string;
  email: string;
  phone: string;
  type: string;
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Add CORS headers
    res.setHeader(
      "Access-Control-Allow-Origin",
      process.env.STORE_CORS || "http://localhost:8000"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    console.log("[SenangPay Webhook GET] Received query:", req.query);

    // Get webhook data from query parameters
    const webhookData: SenangPayWebhookData = {
      status_id: req.query.status_id as string,
      transaction_id: req.query.transaction_id as string,
      msg: req.query.msg as string,
      order_id: req.query.order_id as string,
      hash: req.query.hash as string,
      amount: req.query.amount as string,
      name: req.query.name as string,
      email: req.query.email as string,
      phone: req.query.phone as string,
      type: req.query.type as string,
    };

    if (!webhookData.status_id || !webhookData.order_id || !webhookData.hash) {
      console.error("[SenangPay Webhook GET] Invalid webhook data");
      return res.status(400).json({ error: "Invalid webhook data" });
    }

    // Get the container from the request
    const container = req.scope;

    // Resolve required services
    const paymentModuleService: IPaymentModuleService = container.resolve(
      Modules.PAYMENT
    );

    const dataAndAction = await paymentModuleService.getWebhookActionAndData({
      provider: "senangpay_senangpay",
      payload: {
        data: {
          status_id: webhookData.status_id,
          transaction_id: webhookData.transaction_id,
          order_id: webhookData.order_id,
          msg: webhookData.msg,
          hash: webhookData.hash,
          amount: webhookData.amount,
          name: webhookData.name,
          email: webhookData.email,
          phone: webhookData.phone,
          type: webhookData.type,
        },
        rawData: req.rawBody,
        headers: req.headers,
      },
    });

    console.log("[SenangPay Webhook GET] result->", dataAndAction);

    return res.status(200).json(dataAndAction);
  } catch (error: any) {
    console.error("[SenangPay Webhook GET] Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[SenangPay Webhook] Received body:", req.body);

    // Validate webhook data
    const webhookData = req.body as SenangPayWebhookData;
    if (!webhookData.status_id || !webhookData.order_id || !webhookData.hash) {
      console.error("[SenangPay Webhook] Invalid webhook data");
    }

    // Get the container from the request
    const container = req.scope;

    // Resolve required services
    const paymentModuleService: IPaymentModuleService = container.resolve(
      Modules.PAYMENT
    );

    const dataAndAction = await paymentModuleService.getWebhookActionAndData({
      provider: "senangpay_senangpay",
      payload: {
        data: {
          status_id: webhookData.status_id,
          transaction_id: webhookData.transaction_id,
          order_id: webhookData.order_id,
          msg: webhookData.msg,
          hash: webhookData.hash,
          amount: webhookData.amount,
          name: webhookData.name,
          email: webhookData.email,
          phone: webhookData.phone,
          type: webhookData.type,
        },
        rawData: req.rawBody,
        headers: req.headers,
      },
    });

    console.log("[SenangPay Webhook] result->", dataAndAction);

    // Must return 'OK' without HTML tags for Senangpay
    return res.status(200).send("OK");
  } catch (error: any) {
    console.error("[SenangPay Webhook] Error:", error);
    // Even on error, return OK to acknowledge receipt
    return res.status(200).send("OK");
  }
};
