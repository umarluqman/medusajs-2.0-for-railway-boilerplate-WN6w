import {
  PaymentStatus,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  WebhookActionResult,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  Logger,
  ConfigModule,
  MedusaContainer,
} from "@medusajs/types";
import {
  AbstractPaymentProvider,
  BigNumber,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/utils";
import crypto from "crypto";

type SenangPayOptions = {
  merchantId: string;
  merchantKey: string;
  sandbox?: boolean;
};

type SenangPaySessionData = {
  // Required fields for payment initiation
  merchantId: string;
  hash: string;
  amount: string; // in 2 decimal places
  order_id: string;
  detail: string;
  payment_url: string;

  // Optional user info fields
  name?: string;
  email?: string;
  phone?: string;

  // Fields from webhook response
  status_id?: string; // "0" (failed), "1" (success), "2" (pending)
  transaction_id?: string;
  msg?: string;
};

type SenangPaySessionResponse = PaymentProviderSessionResponse & {
  data: SenangPaySessionData;
};

class SenangPayService extends AbstractPaymentProvider<SenangPayOptions> {
  static identifier = "senangpay";

  protected options: SenangPayOptions;
  private logger: Logger;

  constructor(container: MedusaContainer, options: SenangPayOptions) {
    super(container);

    this.logger = container.resolve("logger");

    if (!options?.merchantId || !options?.merchantKey) {
      throw new Error(
        "SenangPay payment provider requires both merchantId and merchantKey options"
      );
    }

    this.options = {
      merchantId: options.merchantId,
      merchantKey: options.merchantKey,
      sandbox: options.sandbox ?? true,
    };
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      this.logger.info(`[service] id: ${SenangPayService.identifier}`);
      const { amount, currency_code } = input;
      this.logger.info(
        `[service] amount and currency: ${amount}, ${currency_code}`
      );

      const { email, session_id, resource_id, customer } = input.context as {
        email?: string;
        session_id?: string;
        resource_id: string;
        customer?: any;
      };
      this.logger.info(`[service] context: ${JSON.stringify(input.context)}`);

      if (!amount || !resource_id) {
        throw new Error(
          "Missing required fields: amount and resource_id are required"
        );
      }

      // Format amount to 2 decimal places
      const formattedAmount = ((amount as number) / 100).toFixed(2);
      const detail = `Order_${resource_id}`;

      // Hash should be: merchantKey + detail + amount + order_id
      const tobeHashed =
        this.options.merchantKey + detail + formattedAmount + resource_id;

      const hash = crypto
        .createHmac("sha256", this.options.merchantKey)
        .update(tobeHashed)
        .digest("hex");

      const sessionData = {
        id: session_id,
        amount: amount,
        currency_code: currency_code,
        provider_id: SenangPayService.identifier,
        status: PaymentSessionStatus.PENDING,
        data: {
          merchantId: this.options.merchantId,
          hash,
          formatted_amount: formattedAmount,
          order_id: resource_id,
          detail,
          payment_url: `${
            this.options.sandbox
              ? "https://sandbox.senangpay.my"
              : "https://app.senangpay.my"
          }/payment/${this.options.merchantId}`,
          email: email || "",
          metadata: {
            session_id,
            resource_id,
          },
        },
      };

      this.logger.info(
        `[service] session data: ${JSON.stringify(sessionData)}`
      );

      return {
        data: sessionData,
      };
    } catch (error) {
      this.logger.error(`[service] error: ${error}`);
      return {
        error: error.message,
        code: "unknown",
        detail: error,
      };
    }
  }

  async getPaymentStatus(
    paymentSessionData: SenangPaySessionData
  ): Promise<PaymentSessionStatus> {
    const status_id = paymentSessionData.status_id as string;

    switch (status_id) {
      case "1": // successful
        return PaymentSessionStatus.AUTHORIZED;
      case "0": // failed
        return PaymentSessionStatus.ERROR;
      case "2": // pending authorization
        return PaymentSessionStatus.PENDING;
      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  async authorizePayment(
    paymentSessionData: SenangPaySessionData
  ): Promise<{ status: PaymentSessionStatus; data: Record<string, unknown> }> {
    const status = await this.getPaymentStatus(paymentSessionData);
    return {
      status,
      data: paymentSessionData,
    };
  }

  async capturePayment(
    paymentSessionData: SenangPaySessionData
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    try {
      if (paymentSessionData.status_id === "1") {
        return {
          status: "captured" as PaymentStatus,
          data: paymentSessionData,
        };
      }
      throw new Error("Payment not authorized");
    } catch (error) {
      return {
        error: error.message,
        code: "unknown",
        detail: error,
      };
    }
  }

  async refundPayment(
    paymentSessionData: SenangPaySessionData,
    refundAmount: number
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    try {
      return {
        status: "refunded" as PaymentStatus,
        data: {
          ...paymentSessionData,
          refunded_amount: refundAmount,
        },
      };
    } catch (error) {
      return {
        error: error.message,
        code: "unknown",
        detail: error,
      };
    }
  }

  async cancelPayment(
    paymentSessionData: SenangPaySessionData
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    try {
      return {
        status: "canceled" as PaymentStatus,
        data: paymentSessionData,
      };
    } catch (error) {
      return {
        error: error.message,
        code: "unknown",
        detail: error,
      };
    }
  }

  async deletePayment(
    paymentSessionData: SenangPaySessionData
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return await this.cancelPayment(paymentSessionData);
  }

  async retrievePayment(
    paymentSessionData: SenangPaySessionData
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    try {
      return paymentSessionData;
    } catch (error) {
      return {
        error: error.message,
        code: "unknown",
        detail: error,
      };
    }
  }
  async updatePayment(
    context: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    // SenangPay does not support updating payment

    return await this.initiatePayment(context);
  }

  async getWebhookActionAndData(data: {
    data: Record<string, unknown>;
    rawData: string | Buffer;
    headers: Record<string, unknown>;
  }): Promise<WebhookActionResult> {
    const { status_id, order_id, transaction_id, msg, hash, amount } =
      data.data;

    const toBeHashed =
      this.options.merchantKey + status_id + order_id + transaction_id + msg;

    const calculatedHash = crypto
      .createHmac("sha256", this.options.merchantKey)
      .update(toBeHashed)
      .digest("hex");

    if (calculatedHash !== hash) {
      throw new Error("Invalid hash");
    }

    const webhookData = {
      session_id: order_id as string,
      amount: amount ? new BigNumber(amount as string) : new BigNumber(0),
    };

    switch (status_id) {
      case "1": // successful
        return {
          action: PaymentActions.SUCCESSFUL,
          data: webhookData,
        };
      case "0": // failed
        return {
          action: PaymentActions.FAILED,
          data: webhookData,
        };
      case "2": // pending authorization
        return {
          action: PaymentActions.AUTHORIZED,
          data: webhookData,
        };
      default:
        return {
          action: PaymentActions.NOT_SUPPORTED,
          data: webhookData,
        };
    }
  }
}

export default SenangPayService;
