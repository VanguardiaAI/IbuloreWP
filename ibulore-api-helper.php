<?php
/**
 * Plugin Name:       Ibulore API Helper
 * Plugin URI:        https://vanguardia.dev/
 * Description:       Un plugin personalizado para asegurar que la API REST de WordPress permita la subida de imágenes y otras funcionalidades necesarias para el panel de Ibulore.
 * Version:           1.0
 * Author:            Vanguardia
 * Author URI:        https://vanguardia.dev/
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ibulore-api-helper
 */

// Si este archivo es llamado directamente, abortar.
if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Habilita la subida de imágenes a través de la API REST de WordPress.
 * Soluciona errores de permisos de "upload_files" para usuarios autenticados.
 */

// Filtro 1: Asegura que los tipos de archivo comunes (MIME types) estén permitidos en el contexto de la API.
function ibulore_allow_rest_api_file_uploads( $existing_mimes ) {
    $existing_mimes['png']  = 'image/png';
    $existing_mimes['jpg']  = 'image/jpeg';
    $existing_mimes['jpeg'] = 'image/jpeg';
    $existing_mimes['gif']  = 'image/gif';
    return $existing_mimes;
}
add_filter( 'upload_mimes', 'ibulore_allow_rest_api_file_uploads' );

// Filtro 2: Otorga explícitamente la capacidad de 'upload_files' en el contexto de una petición a la API.
function ibulore_fix_rest_upload_permissions( $caps, $cap, $user_id, $context ) {
    if ( 'upload_files' === $cap ) {
        $caps = array( 'upload_files' );
    }
    return $caps;
}
add_filter( 'map_meta_cap', 'ibulore_fix_rest_upload_permissions', 10, 4 );

?> 

