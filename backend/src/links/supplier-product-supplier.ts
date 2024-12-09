import { defineLink } from "@medusajs/utils";
import SupplierModule from "../modules/supplier";

export default defineLink(SupplierModule.linkable.supplier, {
  linkable: SupplierModule.linkable.productSupplier,
  isList: true,
});
