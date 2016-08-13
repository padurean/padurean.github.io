// On document ready handler
// !!!IMPORTANT:
//   '$' alias for 'jQuery' is only available inside the handler function
jQuery( document ).ready(function( $ ) {
  $('footer').prepend(new Date().getFullYear() + '&nbsp;');
});
