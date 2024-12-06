import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { updateSupplierWorkflow } from "workflows/update-supplier";
import { PutAdminUpdateSupplier } from "../validators";
import { z } from "zod";
import { deleteSupplierWorkflow } from "workflows/delete-supplier";

type PutAdminUpdateSupplierType = z.infer<typeof PutAdminUpdateSupplier>;

export const PUT = async (
  req: MedusaRequest<PutAdminUpdateSupplierType>,
  res: MedusaResponse
) => {
  const { result } = await updateSupplierWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.body,
    },
  });

  res.json({ supplier: result });
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const { result } = await deleteSupplierWorkflow(req.scope).run({
    input: {
      id: req.params.id,
    },
  });

  res.json({ id: result.id });
};
