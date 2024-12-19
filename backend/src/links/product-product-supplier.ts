import SupplierModule from "../modules/supplier";
import ProductModule from "@medusajs/product";
import { defineLink } from "@medusajs/utils";

export default defineLink(
  ProductModule.linkable.product,
  SupplierModule.linkable.productSupplier
);
