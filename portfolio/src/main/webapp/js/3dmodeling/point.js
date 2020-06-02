/**
 * point.js
 * 10/17/2019
 * 
 * Defines the 3D point objects to be used
 * for a 3D modeling program.
 *
 * @author Alexander Luiz Costa
 */

/**
 * Represents a point in 3D space.
 */
class Point {
  /**
   * Constructs a Point instance.
   *
   * @param {number} x The x-coordinate of the point.
   * @param {number} y The y-coordinate of the point.
   * @param {number} z The z-coordinate of the point.
   * @param {!Element} parent the DOM element to which to append this point
   *     if the point should be attached. Leave undefined if the point should
   *     not be attached.
   */
  constructor(x, y, z, parent) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.parent = parent;
    
    if (parent !== undefined) {
      this.node = document.createElement("div");
      this.node.classList.add("node");
      parent.appendChild(this.node);
      this.draw();
    }

    /**
     * The distortion to this point's coordinates caused by the user's
     * pointer.
     * 
     * @type {number}
     */
    this.distortX = 0;
    this.distortY = 0;
  }
  
  /**
   * Rotates this point around the x-axis.
   * 
   * @param {!number} rad The radians by which to rotate this point. Should
   *     be small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateX(rad) {
    const tempY = this.y;
    const tempZ = this.z;
    this.y = tempY * Math.cos(rad) - tempZ * Math.sin(rad);
    this.z = tempY * Math.sin(rad) + tempZ * Math.cos(rad);
  }
  
  /**
   * Rotates this point around the y-axis.
   * 
   * @param {!number} rad The radians by which to rotate this point. Should
   *     be small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateY(rad) {
    const tempX = this.x;
    const tempZ = this.z;
    this.x = tempX * Math.cos(rad) + tempZ * Math.sin(rad);
    this.z = tempX * -Math.sin(rad) + tempZ * Math.cos(rad);
  }

  /**
   * Rotates this point around the z-axis.
   * 
   * @param {!number} rad The radians by which to rotate this point. Should
   *     be small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateZ(rad) {
    const tempX = this.x;
    const tempY = this.y;
    this.x = tempX * Math.cos(rad) - tempY * Math.sin(rad);
    this.y = tempX * Math.sin(rad) + tempY * Math.cos(rad);
  }

  /**
   * Projects the 3D point onto a 2D viewing plane.
   *
   * @see 3dmodel.js for mOffsetLeft definition.
   */
  projectX() {
    return this.x / (this.z + 1.5) * mWidth / 2 + mWidth / 2 - 4.5 + mOffsetLeft;
  }

  /**
   * Projects the 3D point onto a 2D viewing plane.
   *
   * @see 3dmodel.js for mOffsetTop definition.
   */
  projectY() {
    return this.y / (this.z + 1.5) * mHeight / 2 + mHeight / 2 - 4.5 + mOffsetTop;
  }

  /**
   * Draws this point in the DOM tree.
   */
  draw() {
    if (this.parent === undefined) {
      return;
    }
    
    let scale = ((1 - this.z - 0.5) * 0.7 + 0.3) * (0.7 * meshScale + 0.3);
    if (scale < 0) {
      scale = 0;
    }
    this.node.style.transform = "scale(" + scale + ")";
    this.node.style.left = this.projectX() + this.distortX + "px";
    this.node.style.top = this.projectY() + this.distortY + "px";
  }
}
