import { Modules } from "@medusajs/utils";
import {
  IOrderModuleService,
  IFulfillmentModuleService,
} from "@medusajs/types";
import { SubscriberArgs, SubscriberConfig } from "@medusajs/medusa";

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log("hehe");

  const fulfilmentModuleService: IFulfillmentModuleService = container.resolve(
    Modules.FULFILLMENT
  );

  const orderModuleService: IOrderModuleService = container.resolve(
    Modules.ORDER
  );

  const order = await orderModuleService.retrieveOrder(data.order_id, {
    relations: ["items", "summary", "shipping_address"],
  });

  const fulfilment = await fulfilmentModuleService.retrieveFulfillment(
    data.fulfillment_id
  );

  console.log("testestestesXX", { order, fulfilment });

  //   const shippingAddress = await (
  //     fulfilmentModuleService as any
  //   ).orderAddressService_.retrieve(order.shipping_address.id);
  try {
    if (order.shipping_address.phone) {
      console.log("starting->");
      try {
        // const body = {
        //   number: shippingAddress.phone.startsWith("0")
        //     ? `+6${shippingAddress.phone}`
        //     : shippingAddress.phone.startsWith("6")
        //     ? `+${shippingAddress.phone}`
        //     : shippingAddress.phone,
        //   type: "text",
        //   media_url: order.items[0].thumbnail,
        //   message: `Thank you for your order #${order.id}! We'll process it right away.`,
        //   instance_id: process.env.WASAPBOT_INSTANCE_ID,
        //   access_token: process.env.WASAPBOT_ACCESS_TOKEN,
        // };
        const body = {};
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
  event: "order.fulfillment_created",
};
