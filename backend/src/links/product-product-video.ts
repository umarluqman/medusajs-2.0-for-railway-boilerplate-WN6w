import ProductVideoModule from "../modules/product-video";
import ProductModule from "@medusajs/product";
import { defineLink } from "@medusajs/utils";

export default defineLink(
  ProductModule.linkable.product,
  ProductVideoModule.linkable.productVideo
);
