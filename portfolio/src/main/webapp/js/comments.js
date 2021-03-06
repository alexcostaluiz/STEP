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

/**
 * Types of comment vote actions.
 *
 * @enum {number}
 */
const VoteAction = {
  LIKED: 0,
  DISLIKED: 1,
  UNLIKED: 2,
  UNDISLIKED: 3,
  LIKED_TO_DISLIKED: 4,
  DISLIKED_TO_LIKED: 5,
}

/** @type {boolean} */
let isUserLoggedIn = false;

/** @type {?User} */
let user = undefined;

window.addEventListener('load', () => {
  initPopupModal();
  initPostCommentForm();
  fetchUser();
});

/** 
 * Initialize the popup modal for deleting comments.
 */
function initPopupModal() {
  const popup = document.querySelector('.popup-modal');
  const popupContent = popup.querySelector('.popup-modal-content');
  popup.onclick = () => void closePopupModal();
  popupContent.onclick = (event) => {
    event.stopPropagation();
  };
}

/**
 * Initialize the "more comments" pagination button and comment
 * submission form.
 */
function initPostCommentForm() {
  const moreComments = document.getElementById('more-comments');
  moreComments.onclick = () => void fetchComments(moreComments.cursor);
  
  const postCommentForm = document.getElementById('post-comment');
  postCommentForm.onsubmit = (event) => validateComment(event, undefined);
  postCommentForm.name.onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
  postCommentForm.content.onfocus = (event) =>
    void event.target.classList.remove('comment-form-invalid');
}

/**
 * Fetch the currently logged in user, if one exists.
 */
async function fetchUser() {    
  const response = await fetch('/user');
  const json = await response.json();
  isUserLoggedIn = json.isUserLoggedIn;
  user = json.user;
  
  const loginButton = document.getElementById('login-button');
  if (isUserLoggedIn) {
    const postCommentForm = document.getElementById('post-comment');
    postCommentForm.style.opacity = 1;
    postCommentForm.content.disabled = false;
    postCommentForm.post.disabled = false;
    postCommentForm.name.disabled = false;
    postCommentForm.name.value = json.user.email;

    const logoutButton = document.getElementById('logout-button');
    logoutButton.style.display = 'inline';
    logoutButton.href = json.logoutURL;
    
    loginButton.style.display = 'none';
  } else {
    loginButton.href = json.loginURL;
  }
  
  fetchComments();
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
    fetchReplies(comment, /* cursor= */ undefined);
  }
}

/**
 * Fetch a batch of replies to the specified parent comment.
 *
 * @param {string} cursor The web-safe cursor string describing the position
 *     at which the server is during reply retrieval.
 */
async function fetchReplies(parentComment, cursor) {
  // Display an animated loading icon to the user.
  const moreReplies = parentComment.container.querySelector('.more-comments');
  const loadingReplies = parentComment.container.querySelector('.loading-ripple');
  moreReplies.style.display = 'none';
  loadingReplies.style.display = 'block';
  
  let url = '/list-replies?parentId=' + parentComment.id;
  if (cursor !== undefined) {
    url += '&cursor=' + cursor;
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

  for (const reply of json.comments) {
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

  const [deleteIcon, thumbUp, thumbDown, replies] = container.querySelectorAll('img');
  const [thumbUpCount, thumbDownCount, replyCount] = container.querySelectorAll('span');
  thumbUp.onclick = () => void likeComment(comment, Vote.UP);
  thumbDown.onclick = () => void likeComment(comment, Vote.DOWN);
  thumbUpCount.textContent = comment.likes;
  thumbDownCount.textContent = comment.dislikes;
  if (isUserLoggedIn && user.userId === comment.userId) {
    deleteIcon.onclick = () => void deleteComment(comment);
    deleteIcon.style.display = 'inline';
  }

  // Initialize a reply form if this comment can be replied to.
  if (isParentComment) {
    replies.onclick = () => void showReplies(comment);
    replyCount.textContent = comment.replyCount;

    const moreReplies = container.querySelector('.more-comments');
    moreReplies.onclick = () => void fetchReplies(comment, moreReplies.cursor);

    const postReplyForm = container.querySelector('.comment-reply-form');
    postReplyForm.onsubmit = (event) => validateComment(event, comment);
    postReplyForm.name.onfocus = (event) =>
      void event.target.classList.remove('comment-form-invalid');
    postReplyForm.content.onfocus = (event) =>
      void event.target.classList.remove('comment-form-invalid');
    
    if (isUserLoggedIn) {
      postReplyForm.style.display = 'block';
      postReplyForm.name.value = user.email;
    }
  }
  
  comment.container = container;
  if (isUserLoggedIn) {
    if (comment.likeUsers.includes(user.userId)) {
      comment.liked = true;
    } else {
      comment.liked = false;
    }
    if (comment.dislikeUsers.includes(user.userId)) {
      comment.disliked = true;
    } else {
      comment.disliked = false;
    }
  }
  
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

  // Do not allow elapsed time to appear negative, which may occur
  // on very quick page reload.
  if (diff < 0) {
    diff = second;
  }
  
  if (diff < minute) {
    const seconds = Math.floor(diff / second);
    return seconds + ((seconds === 1) ? ' second ' : ' seconds ') + 'ago';
  }
  
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return minutes + ((minutes === 1) ? ' minute ' : ' minutes ') + 'ago';
  }
  
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return hours + ((hours === 1) ? ' hour ' : ' hours ') + 'ago';
  }        
  
  if (diff < week) {
    const days = Math.floor(diff / day);
    return days + ((days === 1) ? ' day ' : ' days ') + 'ago';
  }      

  if (diff < month) {
    const weeks = Math.floor(diff / week);
    return weeks + ((weeks === 1) ? ' week ' : ' weeks ') + 'ago';
  }
  
  if (diff < year) {
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
  if (!isUserLoggedIn) {
    return;
  }
  
  const likeCount = comment.container.querySelector('.comment-like-count');
  const dislikeCount = comment.container.querySelector('.comment-dislike-count');

  let voteAction = undefined;
  switch (voteType) {
  case Vote.UP:
    if (comment.disliked === true) {
      comment.disliked = false;
      comment.liked = true;
      likeCount.textContent = ++comment.likes;
      dislikeCount.textContent = --comment.dislikes;
      voteAction = VoteAction.DISLIKED_TO_LIKED;
    } else {
      if (comment.liked === false) {
        comment.liked = true;
        likeCount.textContent = ++comment.likes;
        voteAction = VoteAction.LIKED;
      } else {
        comment.liked = false;
        likeCount.textContent = --comment.likes;
        voteAction = VoteAction.UNLIKED;
      }
    }
    break;
  case Vote.DOWN:
    if (comment.liked === true) {
      comment.liked = false;
      comment.disliked = true;
      likeCount.textContent = --comment.likes;
      dislikeCount.textContent = ++comment.dislikes;
      voteAction = VoteAction.LIKED_TO_DISLIKED;
    } else {
      if (comment.disliked === false) {
        comment.disliked = true;
        dislikeCount.textContent = ++comment.dislikes;
        voteAction = VoteAction.DISLIKED;
      } else {
        comment.disliked = false;
        dislikeCount.textContent = --comment.dislikes;
        voteAction = VoteAction.UNDISLIKED;
      }
    }
    break;
  default:
    break;
  }

  // Update the specified comment's likes and dislikes in the server
  // database.
  fetch('/like-comment?commentId=' + comment.id + '&likes=' +
        comment.likes + '&dislikes=' + comment.dislikes +
        '&action=' + voteAction);
}

/**
 * Callback to delete a comment.
 *
 * @param {!Object<string, *>} comment The comment to delete.
 */
function deleteComment(comment) {
  const onConfirm = async () => {
    closePopupModal();
    const response = await fetch('/delete-comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'commentId=' + comment.id,
    });
    if (response.status === 200) {
      comment.container.style.display = 'none';
      if (comment.parentId !== -1) {
        const parent = document.getElementById(comment.parentId);
        const replyCount = parent.querySelector('.comment-replies-count');
        --replyCount.textContent;
      }
      const commentSection = document.querySelector('.comment-section');
      const comments = document.querySelectorAll('.comment-container');
      let noCommentsExist = true;
      for (const comment of comments) {
        if (comment.style.display !== 'none') {
          noCommentsExist = false;
          break;
        }
      }
      if (noCommentsExist) {
        const nothingToShow = document.getElementById('nothing-to-show');
        nothingToShow.style.display = 'block';
      }
    }
  };
  showPopup(onConfirm);
}

/**
 * Show the modal popup.
 * 
 * @return {!Promise} True if the popup is confirmed, false otherwise.
 */
function showPopup(onConfirm) {
  const popup = document.querySelector('.popup-modal');
  popup.style.display = 'block';
  const [confirm, cancel] = popup.querySelectorAll('button');
  confirm.onclick = onConfirm; 
  cancel.onclick = () => {
    closePopupModal();
  };
}

/**
 * Close the modal popup.
 */
function closePopupModal() {
  const popup = document.querySelector('.popup-modal');
  popup.style.display = 'none';
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
  const name = form.name;
  const content = form.content;

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
    form.parentId.value = parentId;
  }
  
  return valid;
}
