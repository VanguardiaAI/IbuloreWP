import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Imagen y prompt son requeridos' },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'REPLICATE_API_TOKEN no está configurado' },
        { status: 500 }
      );
    }

    // Convertir la imagen a base64 para enviarla a Replicate
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;

    // Configurar la entrada para el modelo Flux Kontext Pro
    const input = {
      prompt: prompt,
      input_image: base64Image,
      output_format: "jpg",
      // Parámetros adicionales opcionales
      num_inference_steps: 28,
      guidance_scale: 3.5,
      seed: Math.floor(Math.random() * 1000000),
    };

    console.log('Generando imagen con Flux Kontext Pro...');
    
    // Ejecutar el modelo
    const output = await replicate.run(
      "black-forest-labs/flux-kontext-pro",
      { input }
    );

    console.log('=== RESPUESTA DE REPLICATE ===');
    console.log('Tipo:', typeof output);
    console.log('Es array:', Array.isArray(output));
    console.log('Contenido completo:', output);
    console.log('JSON serializado:', JSON.stringify(output, null, 2));
    
    if (output && typeof output === 'object') {
      console.log('Propiedades:', Object.keys(output));
      console.log('Constructor:', output.constructor.name);
    }

    // Manejar la respuesta del modelo flux-kontext-pro
    // El modelo devuelve un FileOutput (ReadableStream) que necesitamos convertir
    let imageUrl: string;
    
              if (output && output.constructor && output.constructor.name === 'FileOutput') {
       console.log('Detectado FileOutput de Replicate');
       
       // Convertir FileOutput a string para obtener la URL
       imageUrl = String(output);
       console.log('URL obtenida del FileOutput:', imageUrl);
    } else if (typeof output === 'string') {
      // Si es una string directa
      imageUrl = output;
      console.log('URL obtenida directamente como string:', imageUrl);
    } else if (Array.isArray(output)) {
      // Si es un array, tomar el primer elemento
      imageUrl = output[0] as string;
      console.log('URL obtenida del primer elemento del array:', imageUrl);
    } else {
      // Último recurso: intentar obtener cualquier URL del objeto
      console.log('Intentando extraer URL de objeto desconocido...');
      const outputStr = JSON.stringify(output);
      console.log('Buscando URLs en:', outputStr);
      
      const urlMatch = outputStr.match(/https?:\/\/[^\s"']+/);
      if (urlMatch) {
        imageUrl = urlMatch[0];
        console.log('URL encontrada con regex:', imageUrl);
      } else {
        throw new Error('No se pudo encontrar una URL válida en la respuesta del modelo');
      }
    }

    console.log('URL de imagen extraída:', imageUrl);

    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      throw new Error(`URL inválida obtenida: ${imageUrl}`);
    }

    // Descargar y guardar la imagen localmente
    try {
      console.log('Descargando imagen para guardar localmente...');
      
      // Crear directorio si no existe
      const uploadDir = path.join(process.cwd(), 'public', 'generated-images');
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Descargar la imagen
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Error al descargar la imagen');
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const fileName = `ai-generated-${timestamp}.jpg`;
      const filePath = path.join(uploadDir, fileName);
      
      // Guardar la imagen
      await writeFile(filePath, buffer);
      
      const localImageUrl = `/generated-images/${fileName}`;
      console.log('Imagen guardada localmente:', localImageUrl);

      // Guardar metadatos en un archivo JSON
      const metadataPath = path.join(uploadDir, 'metadata.json');
      let metadata = [];
      
      if (fs.existsSync(metadataPath)) {
        const existingData = fs.readFileSync(metadataPath, 'utf-8');
        metadata = JSON.parse(existingData);
      }

      metadata.unshift({
        id: timestamp.toString(),
        fileName: fileName,
        localUrl: localImageUrl,
        originalUrl: imageUrl,
        prompt: prompt,
        timestamp: new Date().toISOString(),
      });

      // Mantener solo las últimas 50 imágenes
      if (metadata.length > 50) {
        const oldItems = metadata.slice(50);
        // Eliminar archivos antiguos
        for (const item of oldItems) {
          const oldFilePath = path.join(uploadDir, item.fileName);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
        metadata = metadata.slice(0, 50);
      }

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      return NextResponse.json({
        success: true,
        imageUrl: localImageUrl, // Devolver la URL local
        originalUrl: imageUrl,   // Mantener la URL original por referencia
        prompt: prompt,
        fileName: fileName,
        timestamp: new Date().toISOString(),
      });

    } catch (saveError) {
      console.error('Error guardando imagen localmente:', saveError);
      // Si falla el guardado local, devolver la URL original
      return NextResponse.json({
        success: true,
        imageUrl: imageUrl,
        prompt: prompt,
        saveError: 'No se pudo guardar la imagen localmente',
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Error generando imagen:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al generar la imagen',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint para generar fotos de productos con IA' },
    { status: 200 }
  );
} 