import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import SupplierModuleService from "modules/supplier/service";
import { SUPPLIER_MODULE } from "modules/supplier";

export type DeleteSupplierStepInput = {
  id: string;
};

export const deleteSupplierStep = createStep(
  "delete-supplier-step",
  async (input: DeleteSupplierStepInput, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    await supplierModuleService.deleteSuppliers([input.id]);

    return new StepResponse({ id: input.id });
  }
);

export const deleteSupplierWorkflow = createWorkflow(
  "delete-supplier",
  (input: DeleteSupplierStepInput) => {
    const result = deleteSupplierStep(input);
    return new WorkflowResponse(result);
  }
);
