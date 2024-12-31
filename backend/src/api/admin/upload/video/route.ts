import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ulid } from "ulid";
import path from "path";
import multer from "multer";
import { Modules } from "@medusajs/utils";
import { IFileModuleService } from "@medusajs/types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const uploadMiddleware = upload.single("file");

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  return new Promise<void>((resolve, reject) => {
    uploadMiddleware(req as any, res as any, async (err) => {
      if (err) {
        console.error("Upload middleware error:", err);
        res.status(500).json({ message: "Upload failed" });
        return resolve();
      }

      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ message: "No file provided" });
        return resolve();
      }

      try {
        const fileService: IFileModuleService = req.scope.resolve(Modules.FILE);
        const parsedFilename = path.parse(file.originalname);
        const fileKey = `videos/${parsedFilename.name}-${ulid()}${
          parsedFilename.ext
        }`;
        console.log({ fileService });
        const uploadResult = await fileService.createFiles([
          {
            filename: fileKey,
            content: file.buffer.toString("binary"),
            mimeType: file.mimetype,
          },
        ]);

        res.json({
          url: uploadResult[0].url,
          file_key: uploadResult[0].id,
        });
        resolve();
      } catch (error) {
        console.error("Error uploading video:", error);
        res.status(500).json({ message: "Failed to upload video" });
        resolve();
      }
    });
  });
}
