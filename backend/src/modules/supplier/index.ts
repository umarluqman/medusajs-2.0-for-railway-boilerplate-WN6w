import { Module } from "@medusajs/utils";
import SupplierModuleService from "./service";

export const SUPPLIER_MODULE = "supplierModuleService";

export default Module(SUPPLIER_MODULE, {
  service: SupplierModuleService,
});
