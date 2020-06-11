/**
 * UserServlet.java
 * 06/10/2020
 *
 * An endpoint to retrieve whether or not a user is logged in to the site
 * and, if so, information about the user.
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.gson.Gson;
import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** 
 * Returns whether or not a user is logged in to the site and, if so,
 * information about the logged in user.
 */
@WebServlet("/user")
public class UserServlet extends HttpServlet {
  /** 
   * A UserService with to retrieve information about the logged in user.
   */
  private final UserService userService = UserServiceFactory.getUserService();

  /** Used to serialize user data to JSON. */
  private final Gson gson = new Gson();

  /** 
   * Aids in the serialization of user data to JSON. 
   */
  private class UserResponse {
    /** Whether there is a user logged in. */
    private final boolean isUserLoggedIn;

    /** The logged in user, if one exists. */
    private final User user;

    /** The URL where a user may log in. */
    private final String loginURL;

    /** The URL where a user may log out. */
    private final String logoutURL;

    /** 
     * Contructs a UserResponse instance.
     */
    public UserResponse(boolean isUserLoggedIn, User user,
                        String loginURL, String logoutURL) {
      this.isUserLoggedIn = isUserLoggedIn;
      this.user = user;
      this.loginURL = loginURL;
      this.logoutURL = logoutURL;
    }
  }
  
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException {
    String referer = request.getHeader("referer");
    referer = "/user";

    boolean isUserLoggedIn = userService.isUserLoggedIn();
    User user = userService.getCurrentUser();
    String loginURL = (isUserLoggedIn) ? null : userService.createLoginURL(referer);
    String logoutURL = (isUserLoggedIn) ? userService.createLogoutURL(referer) : null;
    
    UserResponse userResponse = new UserResponse(isUserLoggedIn, user, loginURL, logoutURL);
    response.getWriter().println(gson.toJson(userResponse));
  }
}
