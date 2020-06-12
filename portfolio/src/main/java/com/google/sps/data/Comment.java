/**
 * Comment.java
 * 06/05/2020
 * 
 * Facilitates the serialization of comment data.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.data;

import com.google.appengine.api.datastore.Entity;

/**
 * A user comment or reply to a comment on a projects page.
 */
public class Comment {
  /** The id of this comment. */
  private final long id;

  /** The id of the user who created this comment. */
  private final String userId;

  /** The display name of the individual who submitted this comment. */
  private final String name;

  /** The message of this comment. */
  private final String content;

  /** The number of likes this comment has. */
  private final long likes;

  /** The number of dislikes this comment has. */
  private final long dislikes;

  /** 
   * The time at which this comment was created (milliseconds since 
   * Unix epoch).
   */
  private final long timestamp;

  /** 
   * The id of the parent of this comment if this comment is a reply
   * to another comment, or -1 if this comment has no parent comment.
   */
  private final long parentId;

  /** 
   * The number of replies to this comment, if this comment is
   * not a reply itself.
   */
  private final long replyCount;

  /**
   * Constructs a new comment instance from a Datastore entity.
   * @see com.google.appengine.api.datastore.Entity
   * 
   * @param entity The entity from which to create a comment.
   */
  public Comment(Entity entity) {
    this.id = entity.getKey().getId();
    this.userId = (String) entity.getProperty("userId");
    this.name = (String) entity.getProperty("name");
    this.content = (String) entity.getProperty("content");
    this.likes = (long) entity.getProperty("likes");
    this.dislikes = (long) entity.getProperty("dislikes");
    this.timestamp = (long) entity.getProperty("timestamp");
    this.parentId = (long) entity.getProperty("parentId");
    if (this.parentId == -1) {
      replyCount = (long) entity.getProperty("replyCount");
    } else {
      replyCount = 0;
    }
  }

  /**
   * Returns whether or not this comment is a reply to another
   * comment.
   * 
   * @returns True if this comment is a reply; false otherwise.
   */
  public boolean isReply() {
    return parentId != -1;
  }

  /**
   * Returns the id of this comment.
   *
   * @return The id of this comment.
   */
  public long getId() {
    return id;
  }
}
