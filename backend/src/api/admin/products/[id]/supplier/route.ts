import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assignSupplierToProductWorkflow } from "workflows/assign-supplier-to-product";
import { z } from "zod";

const AssignSupplierBody = z.object({
  supplier_id: z.string(),
  product_id: z.string(),
  supply_price: z.number().optional(),
  minimum_order_quantity: z.number().optional(),
  product_supplier_id: z.string().optional(),
  type: z.enum(["create", "update"]),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const data = AssignSupplierBody.parse(req.body);

  const { result } = await assignSupplierToProductWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      ...data,
    },
  });

  res.json({ product_supplier: result });
};
