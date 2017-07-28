function anchorActions() {
	var hashParam = window.location.hash;
	var commentAddedMsgJqElems = $('.comment-added-message');
	if (hashParam && hashParam === "#comment-added") {
		commentAddedMsgJqElems.removeClass('invisible');
		removeHash();
		setTimeout(function() {  commentAddedMsgJqElems.fadeTo('slow', 0); }, 10000);
	} else {
		commentAddedMsgJqElems.addClass('invisible');
	}
}

function updateCommentsView(commentsArguments, jqElem, commentsWrapperJqElem) {
	var commentsHtml = [];
	for(var iComment = 0; iComment < commentsArguments.length; iComment++) {
		var commentResponse = commentsArguments[iComment];
		if (commentResponse[1] !== 'success') continue;
		var yamlDoc = jsyaml.load(commentResponse[0]);
		var commentName = yamlDoc.name;
		var commentMessage = yamlDoc.message
			.replace(/^(\\r?\\n)+|^\s+|^"|^'|"$|'$|\s+$|(\\r?\\n)+$/g, '')
			.replace(/\\r?\\n/g, '<br>');
		commentMessage = markdownifier.makeHtml(commentMessage);
		var commentDate = new Date(yamlDoc.date * 1000).toLocaleString();
		commentsHtml.push(
			'<li>\n' +
			'\t<small class="grey-text-darker">' +
			'<time pubdate datetime="'+commentDate+'">'+commentDate+'</time></small>\n'+
			'\t<br>\n' +
			'\t<i class="fa fa-comment-o fa-flip-horizontal grey-text medium left" aria-hidden="true"></i>\n' +
			'\t<span class="grey-text">' + commentName + ':</span>\n' +
			'\t<br>' + commentMessage + '\n' +
			'</li>\n'
		);
	}
	commentsWrapperJqElem.html(commentsHtml.join(''));
	jqElem.removeClass('faster-spin');
}
function updateNoCommentsView(jqElem, commentsWrapperJqElem, isError) {
	var noCommentsMsg = isError ? 'Unable to load comments' : 'No comments yet';
	commentsWrapperJqElem.html(
		'<li><i class="grey-text">' + noCommentsMsg + '</i></li>');
	jqElem.removeClass('faster-spin');
}
function refreshComments(jqElem, commentsWrapperJqElem, slug) {
  jqElem.addClass('faster-spin');
	var apiPath =
		'https://api.github.com/repos/padurean/padurean.github.io/contents/comments/' + slug;
	$.ajax({ url: apiPath, cache: false })
    .done(function(comments) {
			var jqXhrs = [];
			for (var iComment = 0; iComment < comments.length; iComment++) {
				var filePath = '/' + comments[iComment].path;
				var fileExt = filePath.split('.').pop();
				if (fileExt && fileExt.toLowerCase() === 'yml')
					jqXhrs.push($.ajax({ url: filePath, cache: false }));
			}
			if (jqXhrs.length > 0) {
				$.when.apply($, jqXhrs)
					.done(function() {
						updateCommentsView(jqXhrs.length > 1 ? arguments : [arguments], jqElem, commentsWrapperJqElem);
					})
					.fail(function(error) {
						console.error('refreshComments contents error', error);
						updateNoCommentsView(jqElem, commentsWrapperJqElem, true);
					});
			} else {
				updateNoCommentsView(jqElem, commentsWrapperJqElem);
			}
    })
    .fail(function(error) {
			console.error('refreshComments error', error);
			updateNoCommentsView(jqElem, commentsWrapperJqElem, true);
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

	var optionsRedirectElem = $('#options-redirect');
	var initialOptionsRedirect = optionsRedirectElem.val();
	if (window.location.origin) {
		optionsRedirectElem.val(
			initialOptionsRedirect.replace('https://purecore.ro', window.location.origin));
	} else if (window.location.host) {
		optionsRedirectElem.val(
			initialOptionsRedirect.replace('purecore.ro', window.location.host));
	}

	var refreshCommentsElem = $('.refresh-comments');
	refreshCommentsElem.click(refreshCommentsListener);
	refreshComments(refreshCommentsElem, $('#comments-wrapper'), $('#options-slug').val());

	$('#commenter-name').change(trimValueListener);
	$('#commenter-message').change(trimValueListener);
}