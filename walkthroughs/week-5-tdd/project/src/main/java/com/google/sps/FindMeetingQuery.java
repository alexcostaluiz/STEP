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

import com.google.common.collect.TreeMultiset;
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
  private static enum Mark { END, START }

  /** 
   * A mark in time. Either the start or 
   * end of an event. 
   */
  private static class TimeMark {
    /** The time of this mark. */
    private int time;
    
    /** The type of this mark. */
    private Mark mark;

    /** 
     * Whether the significance of this time 
     * mark is optional.
     */
    private boolean optional;

    public TimeMark(int time, Mark mark, boolean optional) {
      this.time = time;
      this.mark = mark;
      this.optional = optional;
    }
  }

  /** 
   * Orders a collection of time markings in
   * chronological order.
   */
  private static final Comparator<TimeMark> ORDER_CHRONOLOGICALLY =
    (a, b) -> {
      int compare = Long.compare(a.time, b.time);
      if (compare == 0) {
        return Long.compare(a.mark.ordinal(), b.mark.ordinal());
      } else {
        return compare;
      }
    };

  /**
   * The relevance of an event as it pertains to its attendees in
   * comparison to those attendees or optional attendees of the 
   * specified meeting request.
   */
  private static enum Relevance { MANDATORY, OPTIONAL, NONE }

  /**
   * Returns a list of open time slots for the specified meeting request.
   * 
   * @param events A collection of preexisting events.
   * @param request The meeting request.
   * @return A list of open time slots for the specified request.
   */
  public Collection<TimeRange> query(Collection<Event> events, MeetingRequest request) {
    TreeMultiset<TimeMark> sortedStartsAndEnds = TreeMultiset.create(ORDER_CHRONOLOGICALLY);
    
    for (Event event : events) {
      Relevance relevance = getAttendeeRelevance(event, request);
      boolean optional = false;
      switch (relevance) {
        case OPTIONAL:
          optional = true;
          // Fall through.
        case MANDATORY:
          TimeMark start = new TimeMark(event.getWhen().start(), Mark.START, optional);
          TimeMark end = new TimeMark(event.getWhen().end(), Mark.END, optional);
          sortedStartsAndEnds.add(start);
          sortedStartsAndEnds.add(end);
          break;
        default:
          break;
      }
    }
    sortedStartsAndEnds.add(new TimeMark(TimeRange.END_OF_DAY + 1, Mark.START, false));
    
    boolean consideringOptionals = true;
    Collection<TimeRange> openTimeSlots = new ArrayList<>();
    do {
      int start = TimeRange.START_OF_DAY;
      int end = TimeRange.END_OF_DAY;
      int eventsOverlapping = 0;
      for (TimeMark timeMark : sortedStartsAndEnds) {
        if (consideringOptionals || !timeMark.optional) {
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
                  openTimeSlots.add(TimeRange.fromStartEnd(start, end, false));
                }
              }
              eventsOverlapping++;
              break;
              
            default:
              break;
          }
        }
      }
      consideringOptionals = !consideringOptionals;
    } while (openTimeSlots.isEmpty() && !consideringOptionals);
    
    return openTimeSlots;
  }

  /**
   * Returns the relevance of a specified event as its attendees relate to those of the
   * specified meeting request.
   * 
   * @param event The event whose relevance should be calculated.
   * @param request The meeting request to which to compare the specified event.
   * @return MANDATORY if event contains a matching attendee to request, OPTIONAL if
   *     event contains an attendee matching an optional attendee of request, and NONE
   *     otherwise.
   */
  private static Relevance getAttendeeRelevance(Event event, MeetingRequest request) {
    for (String attendee : request.getAttendees()) {
      if (event.getAttendees().contains(attendee)) {
        return Relevance.MANDATORY;
      }
    }

    for (String optional : request.getOptionalAttendees()) {
      if (event.getAttendees().contains(optional)) {
        if (request.getAttendees().isEmpty()) {
          return Relevance.MANDATORY;
        } else {
          return Relevance.OPTIONAL;
        }
      }
    }

    return Relevance.NONE;
  }
}
