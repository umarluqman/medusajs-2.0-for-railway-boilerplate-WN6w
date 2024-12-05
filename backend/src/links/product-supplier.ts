import SupplierModule from "../modules/supplier";
import ProductModule from "@medusajs/medusa/product";
import { defineLink } from "@medusajs/utils";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  SupplierModule.linkable.supplier
);
