import { NextRequest, NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_EXTENSIONS = ["csv", "xls", "xlsx"];

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 403,
        }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No dataset file provided",
        },
        {
          status: 400,
        }
      );
    }

    const originalName = file.name;

    const extension =
      originalName.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only CSV, XLS and XLSX files are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Dataset file must be smaller than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /*
     * Cloudinary RAW asset
     *
     * Excel/CSV files are not image/video files.
     * Therefore they must be uploaded as RAW.
     */

    const baseName = originalName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const publicId =
      `${baseName}_${Date.now()}.${extension}`;

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      resource_type: string;
      format?: string;
      bytes?: number;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "dndc-exam/datasets",
            public_id: publicId,
            resource_type: "raw",
            type: "upload",
            overwrite: false,
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploadResult) {
              reject(
                new Error(
                  "Cloudinary returned no upload result"
                )
              );
              return;
            }

            resolve({
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              resource_type: uploadResult.resource_type,
              format: uploadResult.format,
              bytes: uploadResult.bytes,
            });
          }
        )
        .end(buffer);
    });

    console.log("Dataset uploaded successfully:", {
      fileName: originalName,
      fileType: file.type,
      extension,
      resourceType: result.resource_type,
      publicId: result.public_id,
      url: result.secure_url,
    });

    return NextResponse.json({
      success: true,

      url: result.secure_url,

      publicId: result.public_id,

      resourceType: result.resource_type,

      fileName: originalName,

      fileType:
        file.type ||
        "application/octet-stream",

      extension,

      size: file.size,
    });
  } catch (error) {
    console.error(
      "Dataset upload error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Dataset upload failed",
      },
      {
        status: 500,
      }
    );
  }
}