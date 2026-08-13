import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        {
          status: 403,
        }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'image';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'No file provided',
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    /*
     * PDF
     * ----
     * Upload PDF as an IMAGE resource.
     *
     * Do NOT use resource_type: "raw"
     * because we want Cloudinary to handle
     * the PDF as a viewable PDF asset.
     */
    const isPdf = type === 'pdf';

    const uploadOptions: Record<string, unknown> = {
      folder: 'dndc-exam',

      resource_type: isPdf ? 'image' : 'image',

      // Keep the original file format.
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    /*
     * Only transform normal images.
     *
     * NEVER apply the WebP transformation to PDFs.
     */
    if (!isPdf) {
      uploadOptions.transformation = [
        {
          width: 1200,
          crop: 'limit',
        },
        {
          quality: 'auto',
        },
        {
          format: 'webp',
        },
      ];
    }

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      format?: string;
      resource_type?: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else if (!result) {
              reject(
                new Error('Cloudinary returned no result')
              );
            } else {
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    console.log('Cloudinary upload:', {
      type,
      resourceType: result.resource_type,
      format: result.format,
      url: result.secure_url,
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
    });
  } catch (error) {
    console.error('Upload error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Upload failed',
      },
      {
        status: 500,
      }
    );
  }
}