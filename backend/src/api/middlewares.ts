import { defineMiddlewares } from "@medusajs/medusa";
import { z } from "zod";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      method: ["POST"],
      // additionalDataValidator: {
      //   product_supplier_id: z.string().optional(),
      // },
    },
  ],
});
