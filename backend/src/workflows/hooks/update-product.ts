import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/utils";
import { LinkDefinition } from "@medusajs/types";
import { SUPPLIER_MODULE } from "modules/supplier";
import { updateProductsWorkflow } from "@medusajs/core-flows";
import SupplierModuleService from "modules/supplier/service";

updateProductsWorkflow.hooks.productsUpdated(
  async ({ products, additional_data }, { container }) => {
    if (!additional_data?.supplier_id) {
      return new StepResponse([], []);
    }

    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    // Verify supplier exists
    await supplierModuleService.retrieveSupplier(
      additional_data.supplier_id as string
    );

    const remoteLink = container.resolve("remoteLink");
    const logger = container.resolve("logger");

    // Remove existing supplier links
    const existingLinks = await remoteLink.list({
      [Modules.PRODUCT]: {
        product_id: products[0].id,
      },
      relation: SUPPLIER_MODULE,
    });

    if (existingLinks.length) {
      await remoteLink.dismiss(existingLinks);
    }

    // Create new supplier link
    const links: LinkDefinition[] = [
      {
        [Modules.PRODUCT]: {
          product_id: products[0].id,
        },
        [SUPPLIER_MODULE]: {
          supplier_id: additional_data.supplier_id,
        },
      },
    ];

    await remoteLink.create(links);

    logger.info("Updated product supplier link");

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
