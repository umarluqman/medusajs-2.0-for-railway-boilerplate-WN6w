import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { updateProductSupplierWorkflow } from "workflows/update-product-supplier";
import { z } from "zod";

const AssignSupplierBody = z.object({
  supplier_id: z.string(),
  supply_price: z.number().optional(),
  minimum_order_quantity: z.number().optional(),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const data = AssignSupplierBody.parse(req.body);

  const { result } = await updateProductSupplierWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      ...data,
    },
  });

  res.json({ product_supplier: result });
};
