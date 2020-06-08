/**
 * ListCommentsServlet.java
 * 06/05/2020
 *
 * An endpoint at which comments and replies of a specific project page
 * may be retrieved from Datastore and returned in JSON.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.gson.Gson;
import com.google.sps.data.Comment;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Lists comments and replies of a specifc project page. 
 */
@WebServlet("/list-comments")
public class ListCommentsServlet extends HttpServlet {
  /** The number of parent comments returned per request. */
  static final int PAGE_SIZE = 5;

  /**
   * Aids in the serialization of comment data to JSON through Gson.
   */
  private class Response {
    /** The comments to return. */
    List<Comment> comments;
    
    /** The replies associated with the comments being returned. */
    List<Comment> replies;
    
    /** A cursor pointing to the last retrieved comment. */
    String cursor;

    /** 
     * Constructs the response of this endpoint.
     */
    public Response(List<Comment> comments,
                    List<Comment> replies,
                    String cursor) {
      this.comments = comments;
      this.replies = replies;
      this.cursor = cursor;
    }
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    FetchOptions fetchOptions = FetchOptions.Builder.withLimit(PAGE_SIZE);

    // If a cursor is specified in the request, fetch the next PAGE_SIZE comments.
    String startCursor = request.getParameter("cursor");
    if (startCursor != null) {
      fetchOptions.startCursor(Cursor.fromWebSafeString(startCursor));
    }

    // Use the referring url to determine which project's comments are retrieved.
    String referer = request.getHeader("referer");
    String project = referer.substring(referer.lastIndexOf('/') + 1);
    if (project.equals("projects")) {
      project = "ugadining";
    }
    List<String> projects = Arrays.asList("ugadining", "portflagship",
                                          "3dmodeling", "visualizations");

    // Reject unrecognized referring urls.
    if (!projects.contains(project)) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      return;
    }

    // Fetch the next PAGE_SIZE parent comments for the determined project.
    Filter projectFilter = new FilterPredicate("project", FilterOperator.EQUAL, project);
    Filter commentFilter = new FilterPredicate("parentId", FilterOperator.EQUAL, -1);
    CompositeFilter compositeFilter = CompositeFilterOperator.
      and(projectFilter, commentFilter);

    Query commentQuery = new Query("Comment")
      .setFilter(compositeFilter)
      .addSort("timestamp", SortDirection.DESCENDING);
    PreparedQuery preparedComments = datastore.prepare(commentQuery);

    QueryResultList<Entity> commentResults;
    try {
      commentResults = preparedComments.asQueryResultList(fetchOptions);
    } catch (Exception e) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      return;
    }

    List<Comment> comments = new ArrayList<>();
    List<Long> parentIds = new ArrayList<>();
    for (Entity entity : commentResults) {
      Comment comment = new Comment(entity);
      comments.add(comment);
      parentIds.add(comment.getId());
      
    }

    // Fetch any replies associated with the PAGE_SIZE parent comments already fetched.
    List<Comment> replies = new ArrayList<>();
    if (!parentIds.isEmpty()) {
      Filter parentFilter = new FilterPredicate("parentId", FilterOperator.IN, parentIds);
      Query replyQuery = new Query("Comment")
        .setFilter(parentFilter)
        .addSort("timestamp", SortDirection.ASCENDING);
      PreparedQuery preparedReplies = datastore.prepare(replyQuery);
      
      for (Entity entity : preparedReplies.asIterable()) {
        replies.add(new Comment(entity));
      }
    }

    String cursor = commentResults.getCursor().toWebSafeString();
    Gson gson = new Gson();
    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson(new Response(comments, replies, cursor)));
  }
}
