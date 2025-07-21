import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:5001';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const backendResponse = await fetch(`${BACKEND_URL}/api/media/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await backendResponse.text();
    
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