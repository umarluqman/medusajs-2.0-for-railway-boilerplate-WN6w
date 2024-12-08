import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/utils";
import { LinkDefinition } from "@medusajs/types";
import { SUPPLIER_MODULE } from "modules/supplier";
import SupplierModuleService from "modules/supplier/service";

export type UpdateProductSupplierStepInput = {
  product_id: string;
  supplier_id: string;
  supply_price?: number;
  minimum_order_quantity?: number;
};

export const updateProductSupplierStep = createStep(
  "update-product-supplier-step",
  async (input: UpdateProductSupplierStepInput, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    // Verify supplier exists
    await supplierModuleService.retrieveSupplier(input.supplier_id);

    const remoteLink = container.resolve("remoteLink");
    const logger = container.resolve("logger");

    // Remove existing supplier links
    const existingLinks = await remoteLink.list({
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      relation: SUPPLIER_MODULE,
    });

    if (existingLinks.length) {
      await remoteLink.dismiss(existingLinks);
    }

    // Create new link with additional data
    const link: LinkDefinition = {
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [SUPPLIER_MODULE]: {
        supplier_id: input.supplier_id,
        supply_price: input.supply_price,
        minimum_order_quantity: input.minimum_order_quantity,
      },
    };

    await remoteLink.create([link]);

    logger.info("Updated product supplier relationship");

    return new StepResponse(link, link);
  },
  async (link, { container }) => {
    if (!link) {
      return;
    }

    const remoteLink = container.resolve("remoteLink");
    await remoteLink.dismiss([link]);
  }
);

export const updateProductSupplierWorkflow = createWorkflow(
  "update-product-supplier",
  (input: UpdateProductSupplierStepInput) => {
    const result = updateProductSupplierStep(input);
    return new WorkflowResponse(result);
  }
);
