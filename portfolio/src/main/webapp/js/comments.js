const Vote = {
  UP: 'up',
  DOWN: 'down',
}

window.addEventListener('load', () => {
  initPostCommentForm();
  fetchComments();
});

async function fetchComments(cursor) {
  const moreComments = document.getElementById('more-comments');
  const loadingComments = document.getElementById('loading-comments');
  moreComments.style.display = 'none';
  loadingComments.style.display = 'block';
  
  let url = '/list-comments';
  if (cursor !== undefined) {
    url += '?cursor=' + cursor;
  }
  const response = await fetch(url);
  const json = await response.json();
  const commentSection = document.querySelector('.comment-section');
  const nothingToShow = document.getElementById('nothing-to-show');

  loadingComments.style.display = 'none';
  if (moreComments.cursor !== json.cursor) {
    moreComments.cursor = json.cursor;

    if (json.comments.length === 0) {
      nothingToShow.style.display = 'block';
    } else if (json.comments.length === 5) {
      moreComments.style.display = 'block';
    }
  }

  for (const comment of json.comments) {
    const container = createComment(comment);
    commentSection.insertBefore(container, moreComments);
  }

  for (const reply of json.replies) {
    const container = createComment(reply);
    const parent = document.getElementById(reply.parentId);
    const commentReplySection = parent.querySelector('.comment-reply-section');
    const postReplyForm = parent.querySelector('.comment-reply-form');
    commentReplySection.insertBefore(container, postReplyForm);

    const replyCount = parent.querySelector('.comment-replies-count');
    replyCount.textContent = +replyCount.textContent + 1;
  }
}

function createComment(comment) {
  const isNotReply = comment.parentId === -1;
  
  const container = (isNotReply) ?
        document.getElementById('comment-container-template').cloneNode(true) :
        document.getElementById('comment-reply-container-template').cloneNode(true);
  container.style = undefined;
  container.id = comment.id;

  const name = container.querySelector('.comment-name');
  const content = container.querySelector('.comment-content');
  const timestamp = container.querySelector('.comment-timestamp');  
  name.textContent = comment.name;
  content.textContent = comment.content;
  timestamp.textContent = dateToString(comment.timestamp);

  const [thumbUp, thumbDown, replies] = container.querySelectorAll('img');
  const [thumbUpCount, thumbDownCount, replyCount] = container.querySelectorAll('span');
  thumbUp.onclick = (event) => void likeComment(comment, Vote.UP);
  thumbDown.onclick = (event) => void likeComment(comment, Vote.DOWN);
  thumbUpCount.textContent = comment.likes;
  thumbDownCount.textContent = comment.dislikes;

  if (isNotReply) {
    replies.onclick = (event) => void showReplies(comment);
    replyCount.textContent = '0';

    const postReplyForm = container.querySelector('.comment-reply-form');
    postReplyForm.onsubmit = (event) => validateComment(event, comment);
    postReplyForm['name'].onfocus = (event) =>
      void event.target.classList.remove('comment-form-invalid');
    postReplyForm['content'].onfocus = (event) =>
      void event.target.classList.remove('comment-form-invalid');    
  }
  
  comment.container = container;
  comment.liked = false;
  comment.disliked = false;
  
  return container;
}

function dateToString(timestamp) {
  const commentDate = new Date(timestamp);
  const now = Date.now();
 
  let diff = now - commentDate;
  
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;

  if (diff < 0) {
    diff = second;
  }

  if (diff < year) {
    if (diff < month) {
      if (diff < week) {
        if (diff < day) {
          if (diff < hour) {
            if (diff < minute) {
              const seconds = Math.floor(diff / second);
              return seconds + ((seconds === 1) ? ' second ' : ' seconds ') + 'ago';
            }
            const minutes = Math.floor(diff / minute);
            return minutes + ((minutes === 1) ? ' minute ' : ' minutes ') + 'ago';
          }
          const hours = Math.floor(diff / hour);
          return hours + ((hours === 1) ? ' hour ' : ' hours ') + 'ago';
        }        
        const days = Math.floor(diff / day);
        return days + ((days === 1) ? ' day ' : ' days ') + 'ago';
      }      
      const weeks = Math.floor(diff / week);
      return weeks + ((weeks === 1) ? ' week ' : ' weeks ') + 'ago';
    }
    const months = Math.floor(diff / month);
    return months + ((months === 1) ? ' month ' : ' months ') + 'ago';
  }
  const years = Math.floor(diff / year);
  return years + ((years === 1) ? ' year ' : ' years ') + 'ago';
}

function likeComment(comment, voteType) {
  const likeCount = comment.container.querySelector('.comment-like-count');
  const dislikeCount = comment.container.querySelector('.comment-dislike-count');
  
  switch (voteType) {
  case Vote.UP:
    if (comment.disliked === true) {
      comment.disliked = false;
      comment.liked = true;
      likeCount.textContent = ++comment.likes;
      dislikeCount.textContent = --comment.dislikes;
    } else {
      if (comment.liked === false) {
        comment.liked = true;
        likeCount.textContent = ++comment.likes;
      } else {
        comment.liked = false;
        likeCount.textContent = --comment.likes;
      }
    }
    break;
  case Vote.DOWN:
    if (comment.liked === true) {
      comment.liked = false;
      comment.disliked = true;
      likeCount.textContent = --comment.likes;
      dislikeCount.textContent = ++comment.dislikes;
    } else {
      if (comment.disliked === false) {
        comment.disliked = true;
        dislikeCount.textContent = ++comment.dislikes;
      } else {
        comment.disliked = false;
        dislikeCount.textContent = --comment.dislikes;
      }
    }
    break;
  default:
    break;
  }

  fetch('/like-comment?commentId=' + comment.id + '&likes=' +
        comment.likes + '&dislikes=' + comment.dislikes);
}

function showReplies(comment) {
  const replySection = comment.container.querySelector('.comment-reply-section');
  if (replySection.style.display === 'block') {
    replySection.style.display = 'none';
  } else {
    replySection.style.display = 'block';
  }
}

function initPostCommentForm() {
  const moreComments = document.getElementById('more-comments');
  const postCommentForm = document.getElementById('post-comment');
  moreComments.onclick = () => void fetchComments(moreComments.cursor);
  postCommentForm.onsubmit = (event) => validateComment(event, undefined);
  
  postCommentForm['name'].onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
  postCommentForm['content'].onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
}

function validateComment(event, comment) {
  const form = event.target;
  const name = form['name'];
  const content = form['content'];

  let valid = true;
  if (name.value === '') {
    valid = false;
    name.classList.add('comment-form-invalid');
  }
  if (content.value === '') {
    valid = false;
    content.classList.add('comment-form-invalid');
  }

  if (valid) {
    let parentId = -1;
    if (comment !== undefined) {
      parentId = comment.id;
    }
    form['parentId'].value = parentId;
  }
  
  return valid;
}
