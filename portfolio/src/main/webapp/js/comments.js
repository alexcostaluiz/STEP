/**
 * comments.js
 * 06/05/2020
 *
 * Fetches, creates, and populates comments for project pages with comment
 * sections.
 *
 * @author Alexander Luiz Costa
 */

/**
 * Types of comment votes (like and dislike).
 * 
 * @enum {string}
 */
const Vote = {
  UP: 'up',
  DOWN: 'down',
}

window.addEventListener('load', () => {
  initPostCommentForm();
  fetchComments();
});

/**
 * Initialize the "more comments" pagination button and comment
 * submission form.
 */
function initPostCommentForm() {
  const moreComments = document.getElementById('more-comments');
  moreComments.onclick = () => void fetchComments(moreComments.cursor);
  
  const postCommentForm = document.getElementById('post-comment');
  postCommentForm.onsubmit = (event) => validateComment(event, undefined);
  postCommentForm['name'].onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
  postCommentForm['content'].onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
}

/**
 * Fetch a batch of parent comments and their associated replies.
 *
 * @param {string} cursor The web-safe cursor string describing the position
 *     at which the server is during comment retrieval.
 */
async function fetchComments(cursor) {
  // Display an animated loading icon to the user.
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

  // Remove the loading icon and display the "more comments" button
  // if more comments yet to be shown exist in the database.
  loadingComments.style.display = 'none';
  if (moreComments.cursor !== json.cursor) {
    moreComments.cursor = json.cursor;

    if (json.comments.length === 0) {
      // If no comments at all were retrieved display a message relaying
      // to the user that no comments yet exist.
      nothingToShow.style.display = 'block';
    } else if (json.comments.length === 5) {
      moreComments.style.display = 'block';
    }
  }

  for (const comment of json.comments) {
    const container = createComment(comment);
    commentSection.insertBefore(container, moreComments);
    fetchReplies(comment, null);
  }
}

async function fetchReplies(parentComment, cursor) {
  // Display an animated loading icon to the user.
  const moreReplies = parentComment.container.querySelector('.more-replies');
  const loadingReplies = parentComment.container.querySelector('.loading-ripple');
  moreReplies.style.display = 'none';
  loadingReplies.style.display = 'block';
  
  let url = '/list-replies';
  if (cursor !== undefined) {
    url += '?cursor=' + cursor;
  }
  const response = await fetch(url);
  const json = await response.json();
  const commentReplySection = parentComment.container.querySelector('.comment-reply-section');

  // Remove the loading icon and display the "more comments" button
  // if more comments yet to be shown exist in the database.
  loadingReplies.style.display = 'none';
  if (moreReplies.cursor !== json.cursor) {
    moreReplies.cursor = json.cursor;

    if (json.comments.length === 5) {
      moreReplies.style.display = 'block';
    }
  }

  for (const reply of json.replies) {
    const container = createComment(reply);
    commentReplySection.insertBefore(container, moreReplies);
  }
}

/**
 * Creates a comment or reply from the respective templates defined in projects.html.
 *
 * @param {!Object<string, *>} comment The comment whose data shall populate a cloned
 *     template.
 * @return {!Element} A comment template clone containing the data from the specified
 *     comment.
 */
function createComment(comment) {
  const isParentComment = comment.parentId === -1;
  
  const container = (isParentComment) ?
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

  // Initialize a reply form if this comment can be replied to.
  if (isParentComment) {
    replies.onclick = (event) => void showReplies(comment);
    replyCount.textContent = comment.replyCount;

    const moreReplies = container.querySelector('.more-replies');
    moreReplies.onclick => void fetchReplies(comment, moreReplies.cursor);

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

/**
 * Converts a timestamp (milliseconds since Unix epoch) to a relative passed
 * duration (e.g. "16 second ago", "1 week ago", "3 years ago").
 *
 * @param {number} timestamp The number of milliseconds since the Unix epoch.
 * @return {string} A relative passed duration.
 */
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

/**
 * Callback for when a comment or reply is liked or disliked.
 * 
 * Users are granted one like or dislike per comment per session. Once the page
 * is reloaded users are granted another like or dislike per comment even if
 * they have already voted on a comment. Without user accounts, I could not implement
 * a reliable way for each individual to recieve one like or dislike per comment
 * regardless of the page session.
 *
 * @param {!Object<string, *>} comment The comment that was liked or disliked.
 * @param {!Vote} voteType Vote.UP if comment was liked or Vote.DOWN if comment
 *     was disliked.
 */
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

  // Update the specified comment's likes and dislikes in the server
  // database.
  fetch('/like-comment?commentId=' + comment.id + '&likes=' +
        comment.likes + '&dislikes=' + comment.dislikes);
}

/**
 * Callback to toggle a specified comment's reply and reply form dropdown.
 *
 * @param {!Object<string, *>} comment The comment whose reply dropdown
 *     should be shown or hidden.
 */
function showReplies(comment) {
  const replySection = comment.container.querySelector('.comment-reply-section');
  if (replySection.style.display === 'block') {
    replySection.style.display = 'none';
  } else {
    replySection.style.display = 'block';
  }
}

/**
 * Validates a comment or reply form before sending a request to create
 * the comment.
 *
 * @param {!Event} event The relevant submission event.
 * @param {?Object<string, *>} comment The parent comment of the reply
 *     being submitted. May be undefined if a parent comment is being
 *     submitted.
 */
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
