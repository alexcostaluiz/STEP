package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Servlet responsible for creating new tasks.
 */
@WebServlet("/like-comment")
public class LikeCommentServlet extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    long commentId = Long.parseLong(request.getParameter("commentId"));
    long likes = Long.parseLong(request.getParameter("likes"));
    long dislikes = Long.parseLong(request.getParameter("dislikes"));
    
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Key commentKey = KeyFactory.createKey("Comment", commentId);
    try {
      Entity comment = datastore.get(commentKey);
      comment.setProperty("likes", likes);
      comment.setProperty("dislikes", dislikes);
      datastore.put(comment);
    } catch (EntityNotFoundException e) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }
  }
}
