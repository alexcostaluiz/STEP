/**
 * VisualizationsServlet.java
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
 * Dynamically assembles the different endpoints of the "/visualizations" page.
 */
@WebServlet("/visualizations/*")
public class VisualizationsServlet extends HttpServlet {
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response)
    throws IOException, ServletException {
    
    String visualization = request.getPathInfo();

    // Default visualization is sorting visualization.
    if (visualization == null || visualization.equals("/")) {
      visualization = "/sorting";
    }

    // Gather the visualizations content which will be inserted into
    // the visualizations template page.
    List<String> content = new ArrayList<>();
    switch (visualization) {
    case "/sorting":
    case "/searching":
      content = Files.readAllLines(Paths.get("data/visualizations" + visualization + ".html"),
                                   StandardCharsets.UTF_8);
      break;
    default:
      response.sendError(HttpServletResponse.SC_NOT_FOUND);
      return;
    }

    List<String> template = Files.readAllLines(Paths.get("visualizations.html"),
                                               StandardCharsets.UTF_8);

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
