import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import SupplierModuleService from "modules/supplier/service";
import { SUPPLIER_MODULE } from "modules/supplier";

export type RetrieveSupplierStepInput = {
  id: string;
};

export const retrieveSupplierStep = createStep(
  "retrieve-supplier-step",
  async (input: RetrieveSupplierStepInput, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    const supplier = await supplierModuleService.retrieveSupplier(input.id);

    if (!supplier) {
      throw new Error(`Supplier with id "${input.id}" not found`);
    }

    return new StepResponse(supplier, supplier.id);
  }
);

export const retrieveSupplierWorkflow = createWorkflow(
  "retrieve-supplier",
  (input: RetrieveSupplierStepInput) => {
    const supplier = retrieveSupplierStep(input);
    return new WorkflowResponse(supplier);
  }
);
