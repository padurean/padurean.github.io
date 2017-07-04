// On document ready handler
$(function() {
  $('footer').prepend(new Date().getFullYear());

  setTimeout(showLangIconsAboveSnippets, 400);

  $('.opens_in_new').append(
    '<span class="opens_in_new_symbol flip">&#8689;</span>'
  );

  var wipRandomJokeElems = $(".wip-random-joke");
  wipRandomJokeElems.click(function (event) {
    event.preventDefault();
    var wipRandomJokeElem = $(event.target);
    var randomJokeElem = wipRandomJokeElem.find('.random-joke');
    if(randomJokeElem.length) {
      randomJokeElem[0].remove();
    } else {
      wipRandomJokeElem.append(
        '<span class="random-joke"><i class="fa fa-angle-double-left"></i><i class="fa fa-exclamation-triangle"> </i> Not there yet dude :) still working on this.</span>'
      );
    }
  });
});

function showLangIconsAboveSnippets() {
  var langLabels =
  $('div.prism-show-language > div.prism-show-language-label');
  for (var i=0; i<langLabels.length; i++) {
    var langLabel = $(langLabels[i]);
    var lang = langLabel.text().toLowerCase();
    if (lang === 'haskell') {
      langLabel.css('background-image', 'url("../img/haskell-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    } else if (lang === 'scala') {
      langLabel.css('background-image', 'url("../img/scala-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    } else if (lang === 'javascript') {
      langLabel.css('background-image', 'url("../img/javascript-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    } else if (lang === 'html') {
      langLabel.css('background-image', 'url("../img/html-logo.svg")');
      setCssForLangLabelWithImage(langLabel);
    }
  }
}

function setCssForLangLabelWithImage(langLabel) {
  langLabel.css('padding-left', '1.75rem');
  langLabel.css('background-size', '1.25rem 1.25rem');
  langLabel.css('background-repeat', 'no-repeat');
  langLabel.css('background-position', '.1rem .1rem');
}
