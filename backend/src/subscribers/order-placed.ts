import { Modules } from "@medusajs/utils";
import {
  INotificationModuleService,
  IOrderModuleService,
} from "@medusajs/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";
import { EmailTemplates } from "../modules/email-notifications/templates";

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService =
    container.resolve(Modules.NOTIFICATION);
  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );

  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ["items", "summary", "shipping_address"],
  });
  const shippingAddress = await (
    orderModuleService as any
  ).orderAddressService_.retrieve(order.shipping_address.id);
  // console.log({ order: order });
  try {
    console.log("start", order.shipping_address.phone);

    // await notificationModuleService.createNotifications({
    //   to: order.email,
    //   channel: "email",
    //   template: EmailTemplates.ORDER_PLACED,
    //   data: {
    //     emailOptions: {
    //       replyTo: "info@example.com",
    //       subject: "Your order has been placed",
    //     },
    //     order,
    //     shippingAddress,
    //     preview: "Thank you for your order!",
    //   },
    // });
    console.log("phoneNUMBER", order.shipping_address.phone);
    if (order.shipping_address.phone) {
      console.log("starting->");
      try {
        const body = {
          number: shippingAddress.phone.startsWith("0")
            ? `+6${shippingAddress.phone}`
            : shippingAddress.phone.startsWith("6")
            ? `+${shippingAddress.phone}`
            : shippingAddress.phone,
          type: "text",
          media_url: order.items[0].thumbnail,
          message: `Thank you for your order #${order.id}! We'll process it right away.`,
          instance_id: process.env.WASAPBOT_INSTANCE_ID,
          access_token: process.env.WASAPBOT_ACCESS_TOKEN,
        };
        console.log("body->", { ...body });
        const response = await fetch("https://dash.wasapbot.my/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add any required API authentication headers here
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(
            `WhatsApp API responded with status: ${response.status}`
          );
        }
      } catch (whatsappError) {
        console.error("Error sending WhatsApp notification-->:", whatsappError);
      }
    }
  } catch (error) {
    console.error("Error sending order confirmation notification:", error);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
