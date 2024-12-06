import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/utils";
import { LinkDefinition } from "@medusajs/types";
import { SUPPLIER_MODULE } from "modules/supplier";
import { createProductsWorkflow } from "@medusajs/core-flows";
import SupplierModuleService from "modules/supplier/service";

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.supplier_id) {
      return new StepResponse([], []);
    }

    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);
    // if the supplier doesn't exist, an error is thrown.
    await supplierModuleService.retrieveSupplier(
      additional_data.supplier_id as string
    );

    // Link supplier to product
    const remoteLink = container.resolve("remoteLink");
    const logger = container.resolve("logger");

    const links: LinkDefinition[] = [];

    for (const product of products) {
      links.push({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [SUPPLIER_MODULE]: {
          supplier_id: additional_data.supplier_id,
        },
      });
    }

    await remoteLink.create(links);

    logger.info("Linked supplier to products");

    return new StepResponse(links, links);
  },
  async (links, { container }) => {
    if (!links?.length) {
      return;
    }

    const remoteLink = container.resolve("remoteLink");

    await remoteLink.dismiss(links);
  }
);
