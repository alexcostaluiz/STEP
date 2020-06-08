package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Servlet responsible for creating new tasks.
 */
@WebServlet("/create-comment")
public class CreateCommentServlet extends HttpServlet {
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    String name = request.getParameter("name");
    String content = request.getParameter("content");
    long likes = 0;
    long dislikes = 0;
    long timestamp = System.currentTimeMillis();
    long parentId = Long.parseLong(request.getParameter("parentId"));
    
    String referer = request.getHeader("referer");
    String project = referer.substring(referer.lastIndexOf('/') + 1);
    if (project.equals("projects")) {
      project = "ugadining";
    }
    List<String> projects = Arrays.asList("ugadining", "portflagship",
                                          "3dmodeling", "visualizations");
    if (!projects.contains(project)) {
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

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    datastore.put(comment);

    response.sendRedirect(referer);
  }
}
