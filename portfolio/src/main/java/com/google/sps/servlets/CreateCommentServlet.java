/**
 * CreateCommentServlet.java
 * 06/05/2020
 *
 * An endpoint at which comments may be created and persistently stored
 * in Datastore.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.common.collect.ImmutableList;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Creates and persistently stores new comments.
 */
@WebServlet("/create-comment")
public class CreateCommentServlet extends HttpServlet {
  /** 
   * The valid project path names for the referring url
   * to this endpoint.
   */
  private static final ImmutableList<String> VALID_PROJECTS =
    ImmutableList.of("ugadining", "portflagship", "3dmodeling", "visualizations");

  /** 
   * A Datastore service to interface with the underlying
   * Datastore database. 
   */
  private final DatastoreService datastore =
    DatastoreServiceFactory.getDatastoreService();
  
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    String name = request.getParameter("name");
    String content = request.getParameter("content");
    long likes = 0;
    long dislikes = 0;
    long timestamp = System.currentTimeMillis();
    long parentId = Long.parseLong(request.getParameter("parentId"));

    // Parse the referring url to determine to which project page this
    // comment belongs.
    String referer = request.getHeader("referer");
    String project = referer.substring(referer.lastIndexOf('/') + 1);
    if (project.equals("projects")) {
      project = "ugadining";
    }
    
    // Block comments from being constructed from referring urls that do
    // not match the expected format.
    if (!VALID_PROJECTS.contains(project)) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      return;
    }

    Entity comment = new Entity("Comment");
    comment.setProperty("name", name);
    comment.setProperty("content", content);
    comment.setProperty("likes", likes);
    comment.setProperty("dislikes", dislikes);
    comment.setProperty("timestamp", timestamp);
    comment.setProperty("parentId", parentId);
    comment.setProperty("project", project);
    datastore.put(comment);

    // Send the user back to the page from which they came so they may view
    // their newly constructed comment or reply.
    response.sendRedirect(referer);
  }
}
