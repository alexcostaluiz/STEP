/**
 * RewriteURLFilter.java
 * 05/27/2020
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Strips a request URL of any file extensions and/or extra forward slashes
 * and performs necessary server-side forwarding. Operates on all requests
 * to the webserver.
 */
@WebFilter("/*")
public class RewriteURLFilter implements Filter {

  // Must provide concrete implementation to avoid AbstractMethodError.
  @Override
  public void init(FilterConfig config) throws ServletException {}
  
  @Override
  public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
    throws ServletException, IOException {
    if (req instanceof HttpServletRequest && res instanceof HttpServletResponse) {
      HttpServletRequest request = (HttpServletRequest) req;
      HttpServletResponse response = (HttpServletResponse) res;
      String uri = request.getRequestURI();

      // Client-side forwarding (modifies url of client browser).
      if (uri.contains(".html")) {
        response.sendRedirect(uri.replace(".html", ""));
        return;
      }
      if (uri.endsWith("/") && !uri.equals("/")) {
        response.sendRedirect(uri.substring(0, uri.length() - 1));
        return;
      }

      // Server-side forwarding (will not change url of client browser).
      // Dynamic pages (e.g. /projects) are handled by a servlet.
      switch (uri) {
      case "/index":
      case "/about":
      case "/social":
        request.getRequestDispatcher(uri + ".html").forward(req, res);
        break;
      default:
        chain.doFilter(req, res);
        break;
      }
    } else {
      chain.doFilter(req, res);
    }
  }
}
