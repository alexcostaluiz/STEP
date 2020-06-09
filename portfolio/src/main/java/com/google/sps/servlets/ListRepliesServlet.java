/**
 * ListRepliesServlet.java
 * 06/05/2020
 *
 * An endpoint at which replies of a specific project page
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
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Lists replies of a specifc project page. 
 */
@WebServlet("/list-replies")
public class ListRepliesServlet extends HttpServlet {
  /** The number of replies returned per request. */
  private static final int PAGE_SIZE = 5;
  
  /**
   * A Datastore service to interface with the underlying
   * Datastore database. 
   */
  private final DatastoreService datastore =
    DatastoreServiceFactory.getDatastoreService();
  
  /** Used to serialize reply data to JSON. */
  private final Gson gson = new Gson();

  /**
   * Limits the number of replies returned per request
   * to PAGE_SIZE.
   */
  private final FetchOptions fetchOptions =
    FetchOptions.Builder.withLimit(PAGE_SIZE);

  /** The replies to be returned by this endpoint. */
  private final List<Comment> replies = new ArrayList<>();

  /**
   * Aids in the serialization of reply data to JSON through Gson.
   */
  private class Response {
    /** The replies to return. */
    private final List<Comment> replies;
    
    /** A cursor pointing to the last retrieved reply. */
    private String cursor;

    /** Constructs the response of this endpoint. */
    public Response(List<Comment> replies, String cursor) {
      this.replies = replies;
      this.cursor = cursor;
    }
  }

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    long parentId = Long.parseLong(request.getParameter("parentId"));
    
    // If a cursor is specified in the request, fetch the next PAGE_SIZE comments.
    // Otherwise, fetch the first PAGE_SIZE comments.
    String startCursor = request.getParameter("cursor");
    if (startCursor != null) {
      fetchOptions.startCursor(Cursor.fromWebSafeString(startCursor));
    }

    // Fetch the next PAGE_SIZE parent comments and their replies for
    // the determined project.
    QueryResultList<Entity> replyResults = fetchReplies(parentId);
    for (Entity entity : replyResults) {
      replies.add(new Comment(entity));
    }

    String cursor = replyResults.getCursor().toWebSafeString();
    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson(new Response(replies, cursor)));
  }

  /**
   * Fetches and returns the replies associated with the specified parent
   * comment id.
   * 
   * @param parentId The id of the comment whose replies shall be returned/
   * @return A list of at most PAGE_SIZE replies.
   */
  private QueryResultList<Entity> fetchReplies(long parentId) {
    Filter parentFilter = new FilterPredicate("parentId", FilterOperator.EQUAL, parentId);
    
    Query replyQuery = new Query("Comment")
      .setFilter(parentFilter)
      .addSort("timestamp", SortDirection.ASCENDING);
    PreparedQuery preparedReplies = datastore.prepare(replyQuery);
    
    return preparedReplies.asQueryResultList(fetchOptions);
  }
}
