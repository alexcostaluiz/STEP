/**
 * LikeCommentServlet.java
 * 06/05/2020
 *
 * An endpoint at which comment like and dislike counts may be
 * persistently updated in Datastore.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import java.io.IOException;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Servlet responsible for updating the like and dislike counts of
 * project comments.
 */
@WebServlet("/like-comment")
public class LikeCommentServlet extends HttpServlet {
  /** 
   * A Datastore service to interface with the underlying
   * Datastore database. 
   */
  private final DatastoreService datastore =
    DatastoreServiceFactory.getDatastoreService();

  /** 
   * A UserService to retrieve information about the logged in user.
   */
  private final UserService userService = UserServiceFactory.getUserService();

  /**
   * Describes the specific vote action of this like update.
   */
  private enum VoteAction {
    LIKED,
    DISLIKED,
    UNLIKED,
    UNDISLIKED,
    LIKED_TO_DISLIKED,
    DISLIKED_TO_LIKED,
  }
  
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    if (!userService.isUserLoggedIn()) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    String userId = userService.getCurrentUser().getUserId();
    long commentId = Long.parseLong(request.getParameter("commentId"));
    long likes = Long.parseLong(request.getParameter("likes"));
    long dislikes = Long.parseLong(request.getParameter("dislikes"));
    int actionOrdinal = Integer.parseInt(request.getParameter("action"));
    VoteAction action = VoteAction.values()[actionOrdinal];
    
    Key commentKey = KeyFactory.createKey("Comment", commentId);
    try {
      Entity comment = datastore.get(commentKey);

      List<String> likeUsers = (List) comment.getProperty("likeUsers");
      List<String> dislikeUsers = (List) comment.getProperty("dislikeUsers");
      switch (action) {
      case LIKED:
        likeUsers.add(userId);
        break;
      case DISLIKED:
        dislikeUsers.add(userId);
        break;
      case UNLIKED:
        likeUsers.remove(userId);
        break;
      case UNDISLIKED:
        dislikeUsers.remove(userId);
        break;
      case LIKED_TO_DISLIKED:
        likeUsers.remove(userId);
        dislikeUsers.add(userId);
        break;
      case DISLIKED_TO_LIKED:
        dislikeUsers.remove(userId);
        likeUsers.add(userId);
        break;
      default:
        break;
      }

      comment.setProperty("likeUsers", likeUsers);
      comment.setProperty("dislikeUsers", dislikeUsers);
      comment.setProperty("likes", likes);
      comment.setProperty("dislikes", dislikes);
      datastore.put(comment);
    } catch (EntityNotFoundException e) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
  }
}
