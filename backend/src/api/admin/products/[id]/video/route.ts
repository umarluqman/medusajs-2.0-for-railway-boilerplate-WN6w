import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { z } from "zod";
import { PRODUCT_VIDEO_MODULE } from "modules/product-video";
import ProductVideoModuleService from "modules/product-video/service";
import MinioFileProviderService from "modules/minio-file/service";
import { LinkDefinition } from "@medusajs/types";
import { Modules } from "@medusajs/utils";
import { createProductVideoWorkflow } from "workflows/product-video/create-product-video";

const CreateProductVideoBody = z.object({
  title: z.string().optional(),
  url: z.string(),
  file_key: z.string(),
  mime_type: z.string().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
});

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const data = CreateProductVideoBody.parse(req.body);

  try {
    // Create the product video
    const { result } = await createProductVideoWorkflow(req.scope).run({
      input: {
        title: data.title ?? "",
        url: data.url,
        file_key: data.file_key,
        mime_type: data.mime_type,
        description: data.description ?? "",
        thumbnail_url: data.thumbnail_url ?? "",
        product_id: req.params.id,
      },
    });
    console.log("RESULT->", result);

    res.json({ product_video: result });
  } catch (error) {
    console.error("Error creating product video:", error);
    res.status(500).json({ message: "Failed to create product video" });
  }
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productVideoService: ProductVideoModuleService =
    req.scope.resolve(PRODUCT_VIDEO_MODULE);
  const remoteLink = req.scope.resolve("remoteLink");

  try {
    // Get the link between product and video
    const link = await remoteLink.list({
      [Modules.PRODUCT]: {
        product_id: req.params.id,
      },
    });

    if (!link || !link.length) {
      res.json({ product_video: null });
      return;
    }

    // Get the video details
    const productVideo = await productVideoService.retrieveProductVideo(
      link[0][PRODUCT_VIDEO_MODULE].product_video_id
    );

    res.json({ product_video: productVideo });
  } catch (error) {
    console.error("Error retrieving product video:", error);
    res.status(500).json({ message: "Failed to retrieve product video" });
  }
};

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const productVideoService: ProductVideoModuleService =
    req.scope.resolve(PRODUCT_VIDEO_MODULE);
  const remoteLink = req.scope.resolve("remoteLink");
  const minioService: MinioFileProviderService =
    req.scope.resolve("minioFileService");

  try {
    // Get the link between product and video
    const links = (await remoteLink.list({
      ["@medusajs/product"]: {
        product_id: req.params.id,
      },
    })) as LinkDefinition[];

    if (!links || !links.length) {
      res.status(404).json({ message: "Product video not found" });
      return;
    }

    // Get the video details
    const productVideo = await productVideoService.retrieveProductVideo(
      links[0][PRODUCT_VIDEO_MODULE].product_video_id
    );

    // Delete the file from MinIO
    if (productVideo.file_key) {
      await minioService.delete({ fileKey: productVideo.file_key });
    }

    // Delete the video record
    await productVideoService.deleteProductVideoes(productVideo.id);

    // Delete the link
    await remoteLink.delete(links[0].id);

    res.json({ id: productVideo.id });
  } catch (error) {
    console.error("Error deleting product video:", error);
    res.status(500).json({ message: "Failed to delete product video" });
  }
};
