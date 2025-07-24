import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Construir la URL correcta dependiendo del entorno
    let uploadUrl: string;
    if (BACKEND_URL.startsWith('http')) {
      // URL absoluta (desarrollo)
      uploadUrl = `${BACKEND_URL}/api/media/upload`;
    } else if (BACKEND_URL === '/panel/api') {
      // En producción, necesitamos usar la URL completa del backend
      // Asumiendo que el backend está en el mismo dominio
      const host = request.headers.get('host') || 'localhost';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      uploadUrl = `${protocol}://${host}${BACKEND_URL}/media/upload`;
    } else {
      // Ruta relativa genérica
      uploadUrl = `${BACKEND_URL}/media/upload`;
    }
    
    console.log('Upload URL:', uploadUrl);
    
    const backendResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await backendResponse.text();
    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response:', data);
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data || 'Error al subir la imagen' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(JSON.parse(data), { status: backendResponse.status });
  } catch (error) {
    console.error('Error en el proxy de media upload:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}