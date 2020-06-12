/**
 * DeleteCommentServlet.java
 * 06/11/2020
 *
 * An endpoint at which comments may be deleted from Datastore.
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
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.common.collect.ImmutableList;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Deletes a comment from Datastore.
 */
@WebServlet("/delete-comment")
public class DeleteCommentServlet extends HttpServlet {
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
  
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    if (!userService.isUserLoggedIn()) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
      return;
    }

    long commentId = Long.parseLong(request.getParameter("commentId"));
    String userId = userService.getCurrentUser().getUserId();
    
    Key commentKey = KeyFactory.createKey("Comment", commentId);
    try {
      Entity comment = datastore.get(commentKey);
      String commentUserId = (String) comment.getProperty("userId");
      if (userId.equals(commentUserId)) {
        long parentId = (long) comment.getProperty("parentId");
        if (parentId == -1) {
          // Comment to delete is parent, must delete children too.
          Filter parentFilter = new FilterPredicate("parentId", FilterOperator.EQUAL, commentId);
          Query replyQuery = new Query("Comment")
            .setFilter(parentFilter)
            .setKeysOnly();
          PreparedQuery preparedReplies = datastore.prepare(replyQuery);
          for (Entity entity : preparedReplies.asIterable()) {
            datastore.delete(entity.getKey());
          }
        } else {
          // Comment is child, must decrement parent reply count.
          Key parentKey = KeyFactory.createKey("Comment", parentId);
          Entity parent = datastore.get(parentKey);
          long parentReplyCount = (long) parent.getProperty("replyCount");
          parent.setProperty("replyCount", --parentReplyCount);
          datastore.put(parent);
        }
        datastore.delete(commentKey);
      } else {
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED);
      }
    } catch (EntityNotFoundException e) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
  }
}
