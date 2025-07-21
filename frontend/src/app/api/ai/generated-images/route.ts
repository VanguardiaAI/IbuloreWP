import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'generated-images');
    const metadataPath = path.join(uploadDir, 'metadata.json');

    if (!fs.existsSync(metadataPath)) {
      return NextResponse.json({
        success: true,
        images: [],
      });
    }

    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    // Verificar que los archivos aún existen
    const validImages = metadata.filter((item: any) => {
      const filePath = path.join(uploadDir, item.fileName);
      return fs.existsSync(filePath);
    });

    return NextResponse.json({
      success: true,
      images: validImages,
    });

  } catch (error) {
    console.error('Error obteniendo imágenes guardadas:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener las imágenes guardadas',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 