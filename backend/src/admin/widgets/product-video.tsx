import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { EllipsisHorizontal } from "@medusajs/icons";
import { AdminProduct, DetailWidgetProps } from "@medusajs/types";
import {
  Button,
  Container,
  DropdownMenu,
  Heading,
  IconButton,
  Text,
  toast,
} from "@medusajs/ui";
import { useCallback, useEffect, useState } from "react";

const ProductVideoWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [productVideo, setProductVideo] = useState<any>(null);

  useEffect(() => {
    // Fetch existing video for this product
    fetch(`/admin/products/${data.id}?fields=+product_video.*`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ product }) => {
        if (product?.product_video) {
          console.log("product_video", product?.product_video);
          setProductVideo(product?.product_video[2]);
        }
      })
      .catch((error) => {
        console.error("Error fetching product video:", error);
      });
  }, [data.id]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!videoFile) return;

    setIsUploading(true);
    try {
      // First upload the file to MinIO
      const formData = new FormData();
      formData.append("file", videoFile);
      // formData.append("product_id", data.id);

      const response = await fetch("/admin/upload/video", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload video");
      }

      const { url, file_key } = await response.json();

      // Then create the product video record
      const videoResponse = await fetch(`/admin/products/${data.id}/video`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: videoFile.name,
          url,
          file_key,
          mime_type: videoFile.type,
        }),
      });

      if (!videoResponse.ok) {
        throw new Error("Failed to associate video with product");
      }

      const { product_video } = await videoResponse.json();
      console.log("PRODUCT VIDEO->", product_video);
      setProductVideo(product_video);
      setVideoFile(null);
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        toast.error("Please upload a video file");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        setVideoFile(file);
      } else {
        toast.error("Please upload a video file");
      }
    }
  };

  const handleDelete = async () => {
    if (!productVideo) return;

    try {
      const response = await fetch(`/admin/products/${data.id}/video`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      setProductVideo(null);
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Embed Video</Heading>
        {productVideo && (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <IconButton variant="transparent" size="small">
                <EllipsisHorizontal />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item className="gap-x-2" onClick={handleDelete}>
                <span>Delete</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </div>
      <div className="px-6 py-4">
        {productVideo ? (
          <div className="space-y-4">
            <Text className="text-gray-600">{productVideo.title}</Text>
            <video
              src={productVideo.url}
              controls
              className="w-full rounded-lg"
            />
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            {videoFile ? (
              <div className="space-y-2">
                <Text className="text-gray-600">{videoFile.name}</Text>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => setVideoFile(null)}
                  >
                    Remove
                  </Button>
                  <Button
                    size="small"
                    onClick={handleUpload}
                    isLoading={isUploading}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-2">
                  <Text className="text-gray-600">
                    Drag and drop video here or click to upload
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    Supported formats: MP4, WebM, MOV
                  </Text>
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default ProductVideoWidget;
