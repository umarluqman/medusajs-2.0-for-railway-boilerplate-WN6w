import {
  createWorkflow,
  StepResponse,
  WorkflowData,
  createStep,
} from "@medusajs/framework/workflows-sdk";
import { IProductModuleService } from "@medusajs/types";

import { Modules } from "@medusajs/utils";
import { SUPPLIER_MODULE } from "modules/supplier";

interface WorkflowInput {
  product_id: string;
  supplier_id: string;
  minimum_order_quantity: number;
  supply_price: number;
  type: "create" | "update";
  product_supplier_id?: string;
}
interface AssignSupplierToProductStepInput {
  product_id: string;
  supplier_id: string;
  minimum_order_quantity: number;
  supply_price: number;
  type: "create" | "update";
  product_supplier_id?: string;
}

export const assignSupplierToProductStep = createStep(
  "assign-supplier-to-product-step",
  async (input: AssignSupplierToProductStepInput, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    );
    console.log("INPUT->", input);
    const product = await productModuleService.retrieveProduct(
      input.product_id
    );

    console.log("PRODUCT->", product);
    const supplier = await container
      .resolve(SUPPLIER_MODULE)
      .retrieveSupplier(input.supplier_id);

    console.log({ supplier, type: input.type });
    const remoteLink = container.resolve("remoteLink");

    let res;
    if (input.type === "create") {
      res = await container
        .resolve(SUPPLIER_MODULE)
        .createProductSuppliers(input);

      await remoteLink.create({
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
        [SUPPLIER_MODULE]: {
          product_supplier_id: res.id,
        },
      });
    } else {
      res = await container
        .resolve(SUPPLIER_MODULE)
        .updateProductSuppliers({ ...input, id: input.product_supplier_id });
    }

    console.log({ res });

    return new StepResponse(res, res.id);
  }
  // async (id: string, { container }) => {
  //   const supplierModuleService: SupplierModuleService =
  //     container.resolve(SUPPLIER_MODULE);

  //   await supplierModuleService.deleteProductSuppliers(id);
  // }
);

export const assignSupplierToProductWorkflow = createWorkflow(
  "assign-supplier-to-product-workflow",
  async (input: WorkflowData<WorkflowInput>): Promise<StepResponse> => {
    const productSupplier = await assignSupplierToProductStep({
      product_id: input.product_id,
      supplier_id: input.supplier_id,
      minimum_order_quantity: input.minimum_order_quantity,
      supply_price: input.supply_price,
      type: input.type,
      product_supplier_id: input.product_supplier_id,
    });

    return productSupplier;
  }
);
