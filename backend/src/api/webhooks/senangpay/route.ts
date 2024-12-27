import { Request, Response } from "express";
import { asValue, createContainer } from "awilix";
import SenangPayService from "../../../modules/senangpay/service";

export const POST = async (req: Request, res: Response) => {
  // Create a container for dependency injection
  const container = createContainer();

  // Register the logger
  container.register({
    logger: asValue({
      info: (message: string, ...args: any[]) => console.info(message, ...args),
      error: (message: string, ...args: any[]) =>
        console.error(message, ...args),
      warn: (message: string, ...args: any[]) => console.warn(message, ...args),
      debug: (message: string, ...args: any[]) =>
        console.debug(message, ...args),
      panic: (message: string, ...args: any[]) =>
        console.error(message, ...args),
      shouldLog: () => true,
      setLogLevel: () => {},
      unsetLogLevel: () => {},
      activity: (message: string) => message,
      progress: () => ({
        start: () => {},
        update: () => {},
        stop: () => {},
      }),
      log: (message: string, ...args: any[]) => console.log(message, ...args),
      success: (message: string, ...args: any[]) =>
        console.log(message, ...args),
    }),
  });

  // Create the SenangPay service with injected dependencies
  const senangPayService = new SenangPayService(
    { logger: container.resolve("logger") },
    {
      merchantId: process.env.SENANGPAY_MERCHANT_ID!,
      secretKey: process.env.SENANGPAY_SECRET_KEY!,
      sandbox: process.env.SENANGPAY_SANDBOX === "true",
    }
  );

  try {
    const webhookResult = await senangPayService.getWebhookActionAndData({
      data: req.body,
      rawData: JSON.stringify(req.body),
      headers: req.headers,
    });

    return res.status(200).json(webhookResult);
  } catch (error: any) {
    console.error("[SenangPay Webhook] Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
