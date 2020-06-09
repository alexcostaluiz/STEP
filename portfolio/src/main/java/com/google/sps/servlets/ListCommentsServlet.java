/**
 * ListCommentsServlet.java
 * 06/05/2020
 *
 * An endpoint at which comments of a specific project page
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
import com.google.common.collect.ImmutableList;
import com.google.gson.Gson;
import com.google.sps.data.Comment;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Lists comments of a specifc project page. 
 */
@WebServlet("/list-comments")
public class ListCommentsServlet extends HttpServlet {
  /** The number of parent comments returned per request. */
  private static final int PAGE_SIZE = 5;
  
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
  
  /** Used to serialize comment data to JSON. */
  private final Gson gson = new Gson();

  /**
   * Limits the number of parent comments returned per request
   * to PAGE_SIZE.
   */
  private final FetchOptions fetchOptions =
    FetchOptions.Builder.withLimit(PAGE_SIZE);

  /** The comments to be returned by this endpoint. */
  private final List<Comment> comments = new ArrayList<>();

  /**
   * Aids in the serialization of comment data to JSON through Gson.
   */
  private class Response {
    /** The comments to return. */
    private final List<Comment> comments;
    
    /** A cursor pointing to the last retrieved comment. */
    private String cursor;

    /** Constructs the response of this endpoint. */
    public Response(List<Comment> comments, String cursor) {
      this.comments = comments;
      this.cursor = cursor;
    }
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    // If a cursor is specified in the request, fetch the next PAGE_SIZE comments.
    // Otherwise, fetch the first PAGE_SIZE comments.
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
    
    // Reject unrecognized referring urls.
    if (!VALID_PROJECTS.contains(project)) {
      response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
      return;
    }

    // Fetch the next PAGE_SIZE parent comments and their replies for
    // the determined project.
    QueryResultList<Entity> commentResults = fetchComments(project);
    for (Entity entity : commentResults) {
      comments.add(new Comment(entity));
    }

    String cursor = commentResults.getCursor().toWebSafeString();
    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson(new Response(comments, cursor)));
  }

  private CompositeFilter createCommentFilter(String project) {
    Filter projectFilter = new FilterPredicate("project", FilterOperator.EQUAL, project);
    Filter parentFilter = new FilterPredicate("parentId", FilterOperator.EQUAL, -1);
    return CompositeFilterOperator.and(projectFilter, parentFilter);
  }

  /**
   * Fetches and returns the parent comments associated with the specified parent
   * comment id.
   * 
   * @param parentId The id of the comment whose replies shall be returned/
   * @return A list of at most PAGE_SIZE replies.
   */
  private QueryResultList<Entity> fetchComments(String project) {
    CompositeFilter commentFilter = createCommentFilter(project);
    
    Query commentQuery = new Query("Comment")
      .setFilter(commentFilter)
      .addSort("timestamp", SortDirection.DESCENDING);
    PreparedQuery preparedComments = datastore.prepare(commentQuery);
    
    return preparedComments.asQueryResultList(fetchOptions);
  }
}
