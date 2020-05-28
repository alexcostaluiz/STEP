/**
 * ProjectsServlet.java
 * 05/27/2020
 *
 * @author Alexander Luiz Costa
 */
package com.google.sps.servlets;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Dynamically assembles the different endpoints of the "/projects" page.
 */
@WebServlet("/projects/*")
public class ProjectsServlet extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException, ServletException {
    
    String project = request.getPathInfo();
    
    // let the default project be the UGA Dining project
    if (project == null || project.equals("/")) {
      project = "/ugadining";
    }
    
    // gather the project content (title and description) which will be
    // inserted into the projects template page
    List<String> content;
    switch (project) {
    case "/ugadining":
    case "/portflagship":
    case "/3dmodeling":
    case "/visualizations":
      content = Files.readAllLines(Paths.get("data/projects" + project + ".html"),
                                   StandardCharsets.UTF_8);
      break;
    default:
      response.sendError(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    List<String> template = Files.readAllLines(Paths.get("projects.html"),
                                           StandardCharsets.UTF_8);

    // assemble the response
    for (String line : template) {      
      response.getWriter().println(line);
      
      if (line.trim().equals("<div class=\"ten columns content-sidebar\">")) {
        for (String contentLine : content) {
          response.getWriter().println(contentLine);
        }
      }
    }
  }
}
