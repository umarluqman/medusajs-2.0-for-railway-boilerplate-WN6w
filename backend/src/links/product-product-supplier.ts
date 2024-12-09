import { defineLink } from "@medusajs/utils";
import ProductModule from "@medusajs/product";
import SupplierModule from "../modules/supplier";

export default defineLink(ProductModule.linkable.product, {
  linkable: SupplierModule.linkable.productSupplier,
  isList: true,
});
