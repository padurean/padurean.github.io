// On document ready handler
$(function() {
  $('footer').prepend(new Date().getFullYear());

  var langLabels =
    $('div.prism-show-language > div.prism-show-language-label');
  for (var i=0; i<langLabels.length; i++) {
    var langLabel = $(langLabels[i]);
    var lang = langLabel.text().toLowerCase();
    if (lang === 'scala') {
      langLabel.css('background-image', 'url("/img/scala-logo.svg")');
    } else if (lang === 'javascript') {
      // TODO OGG
    }
  }

});
