function anchorActions() {
	var hashParam = window.location.hash;
	if (hashParam && hashParam === "#comment-added") {
		var commentAddedMsgJqElem = $('#comment-added-message');
		commentAddedMsgJqElem.removeClass('invisible');
		removeHash();
		setTimeout(function() {  commentAddedMsgJqElem.fadeTo('slow', 0); }, 10000);
	} else {
		$('#comment-added-message').addClass('invisible');
	}
}

function updateCommentsView(commentsArguments, jqElem, commentsWrapperJqElem) {
	var commentsHtml = [];
	for(var iComment = 0; iComment < commentsArguments.length; iComment++) {
		var commentResponse = commentsArguments[iComment];
		if (commentResponse[1] !== 'success') continue;
		var nameMessageTimestamp =
			commentResponse[0].split('name:')[1].split('message:');
		nameMessageTimestamp =
			[ nameMessageTimestamp[0] ].concat(nameMessageTimestamp[1].split('date:'));
		var commentName = nameMessageTimestamp[0].trim();
		var commentMessage = nameMessageTimestamp[1].trim();
		commentMessage = commentMessage
			.replace(/^(\\r?\\n)+|^\s+|^"|^'|"$|'$|\s+$|(\\r?\\n)+$/g, '')
			.replace(/\\r?\\n/g, '<br>');
		commentMessage = markdownifier.makeHtml(commentMessage);

		var commentDate = new Date(nameMessageTimestamp[2] * 1000).toLocaleString();
		commentsHtml.push(
			'<li>\n' +
			'\t<small class="grey-text-darker">' +
			'<time pubdate datetime="'+commentDate+'">'+commentDate+'</time></small>\n'+
			'\t<br>\n' +
			'\t<i class="fa fa-comment-o fa-flip-horizontal grey-text medium left" aria-hidden="true"></i>\n' +
			'\t<span class="grey-text">' + commentName + ':</span>\n' +
			'\t<br/>' + commentMessage + '\n' +
			'</li>\n'
		);
	}
	commentsWrapperJqElem.html(commentsHtml.join(''));
	jqElem.removeClass('faster-spin');
}
function refreshComments(jqElem, commentsWrapperJqElem, slug) {
  jqElem.addClass('faster-spin');
	var apiPath =
		'https://api.github.com/repos/padurean/padurean.github.io/contents/comments/' + slug;
	$.ajax({ url: apiPath, cache: false })
    .done(function(comments) {
			if (comments.length > 0) {
				var jqXhrs = [];
        for (var iComment = 0; iComment < comments.length; iComment++) {
					var filePath = '/' + comments[iComment].path;
					var fileExt = filePath.split('.').pop();
					if (fileExt && fileExt.toLowerCase() === 'yml')
						jqXhrs.push($.ajax({ url: filePath, cache: false }));
				}
				$.when.apply($, jqXhrs)
					.done(function() {
						updateCommentsView(jqXhrs.length > 1 ? arguments : [arguments], jqElem, commentsWrapperJqElem);
					})
					.fail(function(error) {
						console.error('refreshComments contents error', error);
						commentsWrapperJqElem.html(
							'<li><i class="grey-text">Unable to load comments</i></li>');
						jqElem.removeClass('faster-spin');
					});
			} else {
        commentsWrapperJqElem.html(
          '<li><i class="grey-text">No comments</i></li>');
        jqElem.removeClass('faster-spin');
      }
    })
    .fail(function(error) {
      console.error('refreshComments error', error);
      commentsWrapperJqElem.html(
        '<li><i class="grey-text">Unable to load comments</i></li>');
      jqElem.removeClass('faster-spin');
    });
}
function refreshCommentsListener() {
  refreshComments($(this), $('#comments-wrapper'), $('#options-slug').val());
}

var markdownifier;
function customInit() {
	markdownifier = new showdown.Converter({
		simpleLineBreaks: true,
		simplifiedAutoLink: true,
		excludeTrailingPunctuationFromURLs: true,
		openLinksInNewWindow: true,
		ghMentions: true
	});
	markdownifier.setFlavor('github');

	var refreshCommentsElem = $('.refresh-comments');
	refreshCommentsElem.click(refreshCommentsListener);
	refreshComments(refreshCommentsElem, $('#comments-wrapper'), $('#options-slug').val());

	$('#commenter-name').change(trimValueListener);
	$('#commenter-message').change(trimValueListener);
}