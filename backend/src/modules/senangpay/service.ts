import {
  PaymentStatus,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  WebhookActionResult,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  Logger,
} from "@medusajs/types";
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/utils";
import crypto from "crypto";

type SenangPayOptions = {
  merchantId: string;
  secretKey: string;
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

type InjectedDependencies = {
  logger: Logger;
};

class SenangPayService extends AbstractPaymentProvider<SenangPayOptions> {
  static identifier = "senangpay";

  protected options: SenangPayOptions;
  protected logger_: Logger;

  static validateOptions(options: Record<any, any>) {
    if (!options?.merchantId || !options?.secretKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "SenangPay payment provider requires both merchantId and secretKey options"
      );
    }
  }

  constructor({ logger }: InjectedDependencies, options: SenangPayOptions) {
    //@ts-ignore
    super(...arguments);

    this.logger_ = logger;

    this.options = {
      merchantId: options.merchantId,
      secretKey: options.secretKey,
      sandbox: options.sandbox ?? true,
    };
  }

  async initiatePayment(
    input: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      this.logger_.info(`[SenangPay] Initiating payment...`);
      const { amount, currency_code } = input;

      // Extract context data
      const { email, name, phone, resource_id } = input.context as {
        email?: string;
        name?: string;
        phone?: string;
        resource_id: string;
      };

      if (!amount || !resource_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Missing required fields: amount and resource_id"
        );
      }

      // Format amount to 2 decimal places
      const formattedAmount = (amount as number).toFixed(2);
      const detail = `Order_${resource_id}`;

      // Generate hash
      const tobeHashed =
        this.options.secretKey + detail + formattedAmount + resource_id;
      const hash = crypto
        .createHmac("sha256", this.options.secretKey)
        .update(tobeHashed)
        .digest("hex");

      // Construct payment session data
      const data: SenangPaySessionData = {
        merchantId: this.options.merchantId,
        hash,
        amount: formattedAmount,
        order_id: resource_id,
        detail,
        payment_url: `${
          this.options.sandbox
            ? "https://sandbox.senangpay.my"
            : "https://app.senangpay.my"
        }/payment/${this.options.merchantId}`,
        name: name || "",
        email: email || "",
        phone: phone || "",
      };

      this.logger_.info(
        `[SenangPay] Created session data: ${JSON.stringify(data)}`
      );

      return {
        data,
      };
    } catch (error) {
      this.logger_.error(
        `[SenangPay] Error initiating payment: ${error.message}`
      );
      return {
        error: error.message,
        code: error instanceof MedusaError ? error.type : "unknown_error",
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
    try {
      this.logger_.info(`[SenangPay] Authorizing payment...`);
      const status = await this.getPaymentStatus(paymentSessionData);

      if (status === PaymentSessionStatus.ERROR) {
        throw new MedusaError(
          MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
          "Payment authorization failed"
        );
      }

      return {
        status,
        data: paymentSessionData,
      };
    } catch (error) {
      this.logger_.error(`[SenangPay] Authorization error: ${error.message}`);
      throw error;
    }
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
      this.options.secretKey + status_id + order_id + transaction_id + msg;

    const calculatedHash = crypto
      .createHmac("sha256", this.options.secretKey)
      .update(toBeHashed)
      .digest("hex");

    if (calculatedHash !== hash) {
      throw new Error("Invalid hash");
    }

    const webhookData = {
      status: status_id,
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
