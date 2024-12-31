import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import ProductVideoModuleService from "modules/product-video/service";
import { PRODUCT_VIDEO_MODULE } from "modules/product-video";
import { Modules } from "@medusajs/utils";
import { IProductModuleService } from "@medusajs/types";

export type CreateProductVideoStepInput = {
  title?: string;
  url: string;
  file_key: string;
  mime_type?: string;
  description?: string;
  thumbnail_url?: string;
  product_id: string;
};

export const createProductVideoStep = createStep(
  "create-product-video-step",
  async (input: CreateProductVideoStepInput, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    );
    console.log("INPUT->", input);
    const product = await productModuleService.retrieveProduct(
      input.product_id
    );

    // const configModule = await container.resolve("configModule");

    // console.log("CONFIG MODULE->", configModule);

    const productVideo = await container
      .resolve(PRODUCT_VIDEO_MODULE)
      .createProductVideos(input);

    console.log("PRODUCT VIDEO->", productVideo);

    const remoteLink = container.resolve("remoteLink");

    await remoteLink.create({
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [PRODUCT_VIDEO_MODULE]: {
        product_video_id: productVideo.id,
      },
    });

    return new StepResponse(productVideo, productVideo.id);
  },
  async (id: string, { container }) => {
    const productVideoModuleService: ProductVideoModuleService =
      container.resolve(PRODUCT_VIDEO_MODULE);

    await productVideoModuleService.deleteProductVideoes(id);
  }
);

type WorkflowInput = {
  title?: string;
  url: string;
  file_key: string;
  mime_type?: string;
  description?: string;
  thumbnail_url?: string;
  product_id: string;
};

export const createProductVideoWorkflow = createWorkflow(
  "create-product-video",
  (input: WorkflowInput) => {
    console.log("INPUT->", input);
    const productVideo = createProductVideoStep(input);
    console.log({ productVideo });
    return new WorkflowResponse(productVideo);
  }
);
