// On document ready handler
$(function() {
  $('footer').prepend(new Date().getFullYear());

  setTimeout(showLangIconsAboveSnippets, 200);
});

function showLangIconsAboveSnippets() {
  var langLabels =
    $('div.prism-show-language > div.prism-show-language-label');
  for (var i=0; i<langLabels.length; i++) {
    var langLabel = $(langLabels[i]);
    var lang = langLabel.text().toLowerCase();
    if (lang === 'scala') {
      langLabel.css('background-image', 'url("/img/scala-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    } else if (lang === 'javascript') {
      langLabel.css('background-image', 'url("/img/javascript-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    }
  }
}

  function setCssForLangLabelWithImage(langLabel) {
    langLabel.css('padding-left', '1.5rem');
    langLabel.css('background-size', '1.25rem 1.25rem');
    langLabel.css('background-repeat', 'no-repeat');
    langLabel.css('background-position', '.1rem .1rem');
  }
