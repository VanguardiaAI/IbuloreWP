#!/usr/bin/env python3
"""
Script para crear comentarios de prueba en artículos del blog.
Útil para probar la funcionalidad de gestión de comentarios.
"""

import requests
import json
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from utils.wordpress_api import get_wp_api

# Cargar variables de entorno
load_dotenv()

def get_blog_posts():
    """Obtiene los posts del blog para usar en los comentarios."""
    try:
        wp_api = get_wp_api()
        response = wp_api.get('posts', params={'per_page': 10, 'status': 'publish'})
        posts = response.json()
        
        print(f"📝 Encontrados {len(posts)} posts publicados")
        for post in posts[:5]:  # Mostrar solo los primeros 5
            print(f"   - ID: {post['id']} | Título: {post['title']['rendered'][:50]}...")
        
        return posts
    except Exception as e:
        print(f"❌ Error obteniendo posts: {e}")
        return []

def create_test_comment(post_id, comment_data):
    """Crea un comentario de prueba en un post específico."""
    try:
        wp_api = get_wp_api()
        
        # Preparar datos del comentario
        wp_comment_data = {
            'post': post_id,
            'content': comment_data['content'],
            'author_name': comment_data['author_name'],
            'author_email': comment_data['author_email'],
            'status': comment_data.get('status', 'approved')
        }
        
        if comment_data.get('author_url'):
            wp_comment_data['author_url'] = comment_data['author_url']
        
        if comment_data.get('parent'):
            wp_comment_data['parent'] = comment_data['parent']
        
        response = wp_api.post('comments', wp_comment_data)
        new_comment = response.json()
        
        print(f"✅ Comentario creado: ID {new_comment.get('id')} por {comment_data['author_name']}")
        return new_comment
        
    except Exception as e:
        print(f"❌ Error creando comentario: {e}")
        return None

def create_test_comments_set():
    """Crea un conjunto completo de comentarios de prueba."""
    
    # Comentarios de prueba con diferentes estados y tipos
    test_comments = [
        {
            'author_name': 'María González',
            'author_email': 'maria.gonzalez@example.com',
            'author_url': 'https://mariagonzalez.blog',
            'content': '¡Excelente artículo! Me ha ayudado mucho a entender mejor la tradición yoruba. Los Orishas son fascinantes y su historia es muy rica. Gracias por compartir este conocimiento.',
            'status': 'approved'
        },
        {
            'author_name': 'Carlos Rodríguez',
            'author_email': 'carlos.rodriguez@example.com',
            'content': '¿Podrían hacer un artículo sobre las ceremonias de iniciación? Estoy muy interesado en aprender más sobre los rituales y su significado espiritual.',
            'status': 'hold'  # Pendiente de aprobación
        },
        {
            'author_name': 'Ana Martínez',
            'author_email': 'ana.martinez@example.com',
            'author_url': 'https://espiritualidad.com',
            'content': 'Muy interesante la información sobre Yemayá. Como practicante, puedo confirmar que la conexión con el mar es realmente poderosa. ¿Tienen más información sobre sus caminos?',
            'status': 'approved'
        },
        {
            'author_name': 'Spam User',
            'author_email': 'spam@spam-site.com',
            'author_url': 'https://spam-products.com',
            'content': '¡Compra productos baratos aquí! ¡Oferta especial en artículos religiosos! ¡No te pierdas esta oportunidad única!',
            'status': 'spam'
        },
        {
            'author_name': 'Luis Fernández',
            'author_email': 'luis.fernandez@example.com',
            'content': 'Gracias por la información. Soy nuevo en esto y me gustaría saber más sobre cómo empezar en el camino de los Orishas. ¿Recomiendan algún libro específico?',
            'status': 'approved'
        },
        {
            'author_name': 'Isabella Santos',
            'author_email': 'isabella.santos@example.com',
            'author_url': 'https://santeria-cubana.org',
            'content': 'Como santera iniciada, debo decir que este artículo está muy bien documentado. Es importante que se difunda información correcta sobre nuestra religión.',
            'status': 'approved'
        },
        {
            'author_name': 'Comentario Ofensivo',
            'author_email': 'troll@example.com',
            'content': 'Este contenido es inapropiado y ofensivo. No debería estar aquí.',
            'status': 'trash'  # Enviado a papelera
        },
        {
            'author_name': 'Pedro Jiménez',
            'author_email': 'pedro.jimenez@example.com',
            'content': '¿Alguien sabe dónde puedo conseguir los elementos necesarios para un altar? Vivo en una ciudad pequeña y no encuentro tiendas especializadas.',
            'status': 'hold'  # Pendiente
        }
    ]
    
    return test_comments

def create_reply_comments(parent_comment_id, post_id):
    """Crea comentarios de respuesta a un comentario padre."""
    replies = [
        {
            'author_name': 'Administrador',
            'author_email': 'admin@ibulore.com',
            'author_url': 'https://ibulore.com',
            'content': '¡Gracias por tu comentario! Me alegra saber que el artículo te ha sido útil. Si tienes alguna pregunta específica, no dudes en preguntar.',
            'status': 'approved',
            'parent': parent_comment_id
        },
        {
            'author_name': 'Experto en Santería',
            'author_email': 'experto@santeria.com',
            'author_url': 'https://santeria-tradicional.com',
            'content': 'Complementando la información del artículo, también es importante mencionar que cada Orisha tiene sus propias características y formas de veneración específicas.',
            'status': 'approved',
            'parent': parent_comment_id
        }
    ]
    
    created_replies = []
    for reply_data in replies:
        reply = create_test_comment(post_id, reply_data)
        if reply:
            created_replies.append(reply)
            time.sleep(1)  # Pausa entre creaciones
    
    return created_replies

def main():
    """Función principal que crea todos los comentarios de prueba."""
    print("🚀 CREANDO COMENTARIOS DE PRUEBA")
    print("=" * 50)
    print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Obtener posts del blog
    posts = get_blog_posts()
    
    if not posts:
        print("❌ No se encontraron posts. Asegúrate de tener artículos publicados en el blog.")
        return
    
    # Usar los primeros posts para los comentarios
    target_posts = posts[:3]  # Usar máximo 3 posts
    test_comments = create_test_comments_set()
    
    print(f"\n📝 Creando comentarios en {len(target_posts)} posts...")
    
    created_comments = []
    
    # Distribuir comentarios entre los posts
    for i, post in enumerate(target_posts):
        post_id = post['id']
        post_title = post['title']['rendered'][:50]
        
        print(f"\n📄 Post: {post_title}... (ID: {post_id})")
        
        # Asignar comentarios a este post
        start_idx = i * (len(test_comments) // len(target_posts))
        end_idx = start_idx + (len(test_comments) // len(target_posts))
        
        if i == len(target_posts) - 1:  # Último post recibe los comentarios restantes
            end_idx = len(test_comments)
        
        post_comments = test_comments[start_idx:end_idx]
        
        for comment_data in post_comments:
            comment = create_test_comment(post_id, comment_data)
            if comment:
                created_comments.append(comment)
                time.sleep(0.5)  # Pausa entre comentarios
    
    # Crear algunas respuestas
    if created_comments:
        print(f"\n💬 Creando respuestas a algunos comentarios...")
        
        # Crear respuestas para los primeros comentarios aprobados
        approved_comments = [c for c in created_comments if c.get('status') == 'approved']
        
        for comment in approved_comments[:2]:  # Solo 2 respuestas para no saturar
            print(f"   Respondiendo al comentario {comment['id']}...")
            replies = create_reply_comments(comment['id'], comment['post'])
            created_comments.extend(replies)
    
    print(f"\n🎉 PROCESO COMPLETADO")
    print(f"📊 Total de comentarios creados: {len(created_comments)}")
    
    # Mostrar resumen por estado
    status_count = {}
    for comment in created_comments:
        status = comment.get('status', 'unknown')
        status_count[status] = status_count.get(status, 0) + 1
    
    print(f"📈 Resumen por estado:")
    for status, count in status_count.items():
        print(f"   - {status}: {count}")
    
    print(f"\n💡 Ahora puedes probar la gestión de comentarios en el frontend!")
    print(f"🔗 Ve a: http://localhost:3000/dashboard/blog/comments")

if __name__ == "__main__":
    main() 