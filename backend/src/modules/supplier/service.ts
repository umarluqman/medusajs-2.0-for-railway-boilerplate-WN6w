import { MedusaService } from "@medusajs/utils";
import { Supplier } from "./models/supplier";
// import ProductSupplier from "./models/product-supplier";

class SupplierModuleService extends MedusaService({
  Supplier,
  //   ProductSupplier,
}) {}

export default SupplierModuleService;
