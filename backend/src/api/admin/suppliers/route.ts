import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { SUPPLIER_MODULE } from "modules/supplier";
import SupplierModuleService from "modules/supplier/service";
import { z } from "zod";
import { PostAdminCreateSupplier } from "./validators";
import { createSupplierWorkflow } from "/workflows/create-supplier";

type PostAdminCreateSupplierType = z.infer<typeof PostAdminCreateSupplier>;

export const POST = async (
  req: MedusaRequest<PostAdminCreateSupplierType>,
  res: MedusaResponse
) => {
  const { result } = await createSupplierWorkflow(req.scope).run({
    input: req.body,
  });

  res.json({ supplier: result });
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const supplierModuleService: SupplierModuleService =
    req.scope.resolve(SUPPLIER_MODULE);

  const limit = req.query.limit || 15;
  const offset = req.query.offset || 0;

  const [suppliers, count] = await supplierModuleService.listAndCountSuppliers(
    {},
    {
      skip: offset as number,
      take: limit as number,
    }
  );

  res.json({
    suppliers,
    count,
    limit,
    offset,
  });
};
