<?php

/**
 * @file
 * The default format for adresses.
 */

$plugin = array(
  'title' => t('Query PostalCodes Table OnChange'),
  'format callback' => 'addressfield_format_query_postalcode_table_generate',
  'type' => 'query_postalcode_table',
  'weight' => 1000,
);

/**
 * Format callback.
 *
 * @see CALLBACK_addressfield_format_callback()
 */
function addressfield_format_query_postalcode_table_generate(&$format, $address, $context = array()) {
  if ($context['mode'] == 'form') {
    // drupal_add_js ( drupal_get_path('module','buyinamerika').'/js/select2/select2.js' );
    // drupal_add_css( drupal_get_path('module','buyinamerika').'/js/select2/select2.css' );
    drupal_add_js ( drupal_get_path('module', 'addressfield_query_postalcodes_table').'/js/addressfield_query_postalcodes_table.js' );
    drupal_add_css( drupal_get_path('module','addressfield_query_postalcodes_table').'/css/addressfield_query_postalcodes_table.css' );
  }
  else {
    
  }
}

