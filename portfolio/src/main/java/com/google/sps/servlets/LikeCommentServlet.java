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
import java.io.IOException;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
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
  private final DatastoreService datastore;

  @Override
  public void init(ServletConfig config) throws ServletException {
    datastore = DatastoreServiceFactory.getDatastoreService();
  }
  
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    long commentId = Long.parseLong(request.getParameter("commentId"));
    long likes = Long.parseLong(request.getParameter("likes"));
    long dislikes = Long.parseLong(request.getParameter("dislikes"));
    
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
