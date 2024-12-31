import { Module } from "@medusajs/utils";
import ProductVideoModuleService from "./service";

export const PRODUCT_VIDEO_MODULE = "product_video";

export default Module(PRODUCT_VIDEO_MODULE, {
  service: ProductVideoModuleService,
});
