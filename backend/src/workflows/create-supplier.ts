import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import SupplierModuleService from "modules/supplier/service";
import { SUPPLIER_MODULE } from "modules/supplier";

export type CreateSupplierStepInput = {
  name: string;
  email?: string;
  phone: string;
  address?: string;
};

export const createSupplierStep = createStep(
  "create-supplier-step",
  async (input: CreateSupplierStepInput, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    const supplier = await supplierModuleService.createSuppliers(input);

    return new StepResponse(supplier, supplier.id);
  },
  async (id: string, { container }) => {
    const supplierModuleService: SupplierModuleService =
      container.resolve(SUPPLIER_MODULE);

    await supplierModuleService.deleteSuppliers(id);
  }
);

type CreateSupplierWorkflowInput = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export const createSupplierWorkflow = createWorkflow(
  "create-supplier",
  (input: CreateSupplierWorkflowInput) => {
    const supplier = createSupplierStep(input);

    return new WorkflowResponse(supplier);
  }
);
