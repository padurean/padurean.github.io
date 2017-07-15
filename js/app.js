// On document ready handler
$(function() {
  $('footer').prepend(new Date().getFullYear());

  setTimeout(showLangIconsAboveSnippets, 400);

  $('.opens_in_new').append(
    '<span class="opens_in_new_symbol flip">&#8689;</span>'
  );

  $('.expand-collapse').each(attachExpandCollapse);
  $('.expand-collapse-all').each(attachExpandCollapseAll);
  $('.post-section-title').each(attachExpandCollapseForTitle);
  $('.wip-random-joke').each(attachShowWiPMessage);
});

function attachExpandCollapseAll(i, obj) {
  var expandCollapseElem = $(obj);
  expandCollapseElem.click(function(event) {
    event.preventDefault();
    expandColapseAll(expandCollapseElem);
  });
}
function expandColapseAll(expandCollapseElem) {
  var labelElem = expandCollapseElem.find('.btn-label');
  var iconElem = expandCollapseElem.find('i.fa');
  var collapsed = iconElem.hasClass('collapsed');
  
  var articleBodyElems = $('.article-body');
  articleBodyElems.each(function(i, obj) {
    var articleBodyElem = $(obj);
    var expandCollapseIconElem =
      articleBodyElem.parents('article').find('.expand-collapse');
    if (collapsed) {
      articleBodyElem.fadeIn();
      expandCollapseIconElem.removeClass('fa-angle-right collapsed');
      expandCollapseIconElem.addClass('fa-angle-down');
    } else {
      articleBodyElem.fadeOut();
      expandCollapseIconElem.removeClass('fa-angle-down');
      expandCollapseIconElem.addClass('fa-angle-right collapsed');
    }
  });
  
  if (collapsed) {
    iconElem.removeClass('fa-angle-double-right collapsed');
    iconElem.addClass('fa-angle-double-down');
    labelElem.text('Collapse All Chapters');
  } else {
    iconElem.removeClass('fa-angle-double-down');
    iconElem.addClass('fa-angle-double-right collapsed');
    labelElem.text('Expand All Chapters');
  }
}

function attachExpandCollapseForTitle(i, obj) {
  var titleElem = $(obj);
  var expandCollapseElem = titleElem.siblings('.expand-collapse');
  titleElem.click(function(event) {
    event.preventDefault();
    expandCollapseElem.click();
  });
}

function attachExpandCollapse(i, obj) {
  var expandCollapseElem = $(obj);
  expandCollapseElem.click(function(event) {
    event.preventDefault();
    expandColapse(expandCollapseElem);
  });
}
function expandColapse(expandCollapseElem) {
  var articleBodyElem =
    expandCollapseElem.parents('article').find('.article-body');
  if (expandCollapseElem.hasClass('collapsed')) {
    articleBodyElem.fadeIn();
    expandCollapseElem.removeClass('fa-angle-right collapsed');
    expandCollapseElem.addClass('fa-angle-down');
  } else {
    articleBodyElem.fadeOut();
    expandCollapseElem.removeClass('fa-angle-down');
    expandCollapseElem.addClass('fa-angle-right collapsed');
  }
}

function attachShowWiPMessage(i, obj) {
  var wipRandomJokeElem = $(obj);
  wipRandomJokeElem.click(function (event) {
    event.preventDefault();
    showWiPMessage(wipRandomJokeElem);
  });
}
function showWiPMessage(wipRandomJokeElem) {
  var randomJokeElem = wipRandomJokeElem.find('.random-joke');
  if(randomJokeElem.length) {
    randomJokeElem[0].remove();
  } else {
    wipRandomJokeElem.append(
      '<span class="random-joke"><i class="fa fa-angle-double-left"></i><i class="fa fa-exclamation-triangle"></i> Not there yet dude :) still working on this.</span>'
    );
  }
}

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
