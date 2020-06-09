/**
 * ListCommentsResponse.java
 * 06/09/2020
 * 
 * A response object for the "/list-comments" and 
 * "/list-replies" endpoints.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.data;

import com.google.sps.data.Comment;

/**
 * Aids in the serialization of comment and reply data 
 * to JSON through Gson.
 */
public class ListCommentsResponse {
  /** The comments to return. */
  private final List<Comment> comments;
  
  /** A cursor pointing to the last retrieved comment. */
  private String cursor;
  
  /** 
   * Constructs the response. 
   */
  public ListCommentsResponse(List<Comment> comments, String cursor) {
    this.comments = comments;
    this.cursor = cursor;
  }
}
