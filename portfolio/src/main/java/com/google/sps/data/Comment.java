package com.google.sps.data;

import com.google.appengine.api.datastore.Entity;

/**
 * A user comment on a projects page.
 */
public class Comment {
  private final long id;
  private final String name;
  private final String content;
  private final long likes;
  private final long dislikes;
  private final long timestamp;
  private final long parentId;

  public Comment(Entity entity) {
    this.id = entity.getKey().getId();
    this.name = (String) entity.getProperty("name");
    this.content = (String) entity.getProperty("content");
    this.likes = (long) entity.getProperty("likes");
    this.dislikes = (long) entity.getProperty("dislikes");
    this.timestamp = (long) entity.getProperty("timestamp");
    this.parentId = (long) entity.getProperty("parentId");
  }

  public boolean isReply() {
    return parentId != -1;
  }

  public long getId() {
    return id;
  }
}
