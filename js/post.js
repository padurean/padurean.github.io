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

function getCommentAndUpdateView(
	filePath, iItem, itemsLength, jqElem, commentsWrapperJqElem) {
	$.get(filePath)
		.done(function(commentData) {
			var nameMessageTimestamp =
				commentData.split('name:')[1].split('message:');
			nameMessageTimestamp =
				[ nameMessageTimestamp[0] ].concat(nameMessageTimestamp[1].split('date:'));
			var commentName = nameMessageTimestamp[0].trim();
			var commentMessage = nameMessageTimestamp[1].trim();
			commentMessage =
				commentMessage.replace(/\r?\n/g, '<br/>');
			console.log('commentMessage', commentMessage);
			var commentDate = new Date(nameMessageTimestamp[2] * 1000).toLocaleString();
			var commentHtml =
				'<li>\n' +
				'\t<span class="grey-text">\n' +
				'\t\t<i class="fa fa-comment-o medium left" aria-hidden="true"></i>\n' +
				'\t\t' + commentName + ':\n' +
				'\t</span><br/>\n' +
				'\t' + commentMessage + '\n' +
				'\t<br/><small class="grey-text">' +
				'<time pubdate datetime="'+commentDate+'">'+commentDate+'</time></small>\n'+
				'</li>\n'
			if (iItem === 1) {
				commentsWrapperJqElem.html(commentHtml);
			} else {
				commentsWrapperJqElem.append(commentHtml);
			}
			if (iItem === itemsLength - 1) {
				jqElem.removeClass('faster-spin');
			}
		})
		.fail(function(error) {
			console.log('failed to load comment ' + filePath, error);
		});
}
function refreshComments(jqElem, commentsWrapperJqElem) {
  jqElem.addClass('faster-spin');

	var folderPath = '/comments/sample-post/';
  $.get(folderPath)
    .done(function(data) {
      if (data && data.indexOf('<li') > 0) {
        var items = data.split('<ul>')[1].split('</ul')[0].split('href="');
        for (var iItem = 1; iItem < items.length; iItem++) {
          var filePath = folderPath + items[iItem].split('"')[0];
          getCommentAndUpdateView(
						filePath, iItem, items.length, jqElem, commentsWrapperJqElem);
        }
      } else {
        commentsWrapperJqElem.html(
          '<li><em class="grey-text">No comments</em></li>');
        jqElem.removeClass('faster-spin');
      }
    })
    .fail(function(error) {
      console.log('refreshComments error', error);
      commentsWrapperJqElem.html(
        '<li><em class="grey-text">Unable to load comments</em></li>');
      jqElem.removeClass('faster-spin');
    });
}
function refreshCommentsListener() {
  refreshComments($(this), $('#comments-wrapper'));
}

var commentJqElem;
function customInit() {
	var refreshCommentsElem = $('.refresh-comments');
	refreshCommentsElem.click(refreshCommentsListener);
	refreshComments(refreshCommentsElem, $('#comments-wrapper'));

	$('#commenter-name').change(trimValueListener);
	$('#commenter-message').change(trimValueListener);
}