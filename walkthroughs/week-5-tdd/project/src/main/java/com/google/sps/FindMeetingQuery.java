// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * FindMeetingQuery.java
 * 06/16/2020
 *
 * Finds the open time slots for a meeting request.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.PriorityQueue;
import java.util.stream.Collectors;

/** 
 * Finds all open time slots for a meeting request. 
 */
public final class FindMeetingQuery {

  /** Describes a type of time marking. */
  private static enum Mark { START, END }

  /** 
   * A mark in time. Either the start or 
   * end of an event. 
   */
  private static class TimeMark {
    /** The time of this mark. */
    private int time;
    
    /** The type of this mark. */
    private Mark mark;

    public TimeMark(int time, Mark mark) {
      this.time = time;
      this.mark = mark;
    }
  }

  /** 
   * Orders a collection of time markings in
   * chronological order.
   */
  private static final Comparator<TimeMark> ORDER_CHRONOLOGICALLY =
    (a, b) -> Long.compare(a.time, b.time);

  /**
   * Returns a list of open time slots for the specified meeting request.
   * 
   * @param events A collection of preexisting events.
   * @param request The meeting request.
   * @return A list of open time slots for the specified request.
   */
  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    PriorityQueue<TimeMark> sortedStartsAndEnds = new PriorityQueue<>(ORDER_CHRONOLOGICALLY);
    
    for (Event event : events) {
      if (areAttendeesRelevant(event, request)) {
        TimeMark start = new TimeMark(event.getWhen().start(), Mark.START);
        TimeMark end = new TimeMark(event.getWhen().end(), Mark.END);
        sortedStartsAndEnds.add(start);
        sortedStartsAndEnds.add(end);
      }
    }
    sortedStartsAndEnds.add(new TimeMark(TimeRange.END_OF_DAY + 1, Mark.START));

    Collection<TimeRange> results = new ArrayList<>();
    int start = TimeRange.START_OF_DAY;
    int end = TimeRange.END_OF_DAY;
    int eventsOverlapping = 0;
    TimeMark timeMark;
    while ((timeMark = sortedStartsAndEnds.poll()) != null) {
      switch (timeMark.mark) {
        case END:
          eventsOverlapping--;
          if (eventsOverlapping == 0) {
            start = timeMark.time;
          }
          break;
        
        case START:
          if (eventsOverlapping == 0) {
            end = timeMark.time;
            if (end - start >= request.getDuration()) {
              results.add(TimeRange.fromStartEnd(start, end, false));
            }
          }
          eventsOverlapping++;
          break;
        
        default:
          break;
      }
    }
    
    return results;
  }

  private static boolean areAttendeesRelevant(Event event, MeetingRequest request) {
    for (String attendee : event.getAttendees()) {
      if (request.getAttendees().contains(attendee)) {
        return true;
      }
    }
    return false;
  }
}
