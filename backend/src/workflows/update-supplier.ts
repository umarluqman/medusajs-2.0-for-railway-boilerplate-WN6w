import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import SupplierModuleService from "modules/supplier/service";
import { SUPPLIER_MODULE } from "modules/supplier";

export type UpdateSupplierStepInput = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export const updateSupplierStep = createStep(
  "update-supplier-step",
  async (input: UpdateSupplierStepInput, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    if (!input.id) {
      throw new Error("Supplier ID is required for update");
    }

    // First verify the supplier exists
    const existingSupplier = await supplierModuleService.retrieveSupplier(
      input.id
    );

    if (!existingSupplier) {
      throw new Error(`Supplier with id "${input.id}" not found`);
    }

    const supplier = await supplierModuleService.updateSuppliers({
      id: input.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    });
    console.log("supplier->", supplier);

    return new StepResponse(supplier, supplier.id);
  }
);

export const updateSupplierWorkflow = createWorkflow(
  "update-supplier",
  (input: UpdateSupplierStepInput) => {
    const supplier = updateSupplierStep(input);
    return new WorkflowResponse(supplier);
  }
);
