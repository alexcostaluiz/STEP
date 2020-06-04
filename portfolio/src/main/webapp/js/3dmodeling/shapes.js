/**
 * shapes.js
 * 05/31/2020
 * 
 * Defines various shapes to be used in the home page 3D interactive model.
 * 
 * Shapes:
 * - cube
 * - sphere
 * - nested sphere
 * - spiral sphere
 * - noisy sphere
 * - disk
 * - ray
 * - crescents
 * - torus
 * - contorted torus
 * - horn torus
 * - interlocking tori
 * - adjusted horn torus
 * - nautilus shell
 * - meshes
 * 
 * @author Alexander Luiz Costa
 */

/**
 * An abstract representation of a shape. Maintains a collection of points.
 * 
 * @abstract
 */
class Shape {
  /**
   * Constructs a shape.
   *
   * @param {?Element} parent The DOM element to which to append points if
   *     the point should be attached.
   */
  constructor(parent) {
    if (this.constructor === Shape) {
      throw new TypeError('Abstract class "Shape" cannot be instantiated directly.');
    }
    
    this.parent = parent;

    /**
     * The collection of points which make up this shape.
     *
     * @type {!Array<Point>}
     */
    this.points = [];

    /**
     * The name of this shape to be displayed above it. Subclasses should
     * initialize this property in their constructor.
     *
     * @type {string}
     */
    this.name = undefined;
  }
  
  /**
   * Adds a point to this shape.
   * @see Point (in point.js)
   * 
   * @param {!Point} p The point to add.
   */
  add(p) {
    this.points.push(p);
  }

  /**
   * Inserts a point in this shape at the specified index.
   *
   * @param {number} i The index at which to insert.
   * @param {!Point} p The point to insert.
   */
  insert(i, p) {
    this.points.splice(i, 0, p);
  }

  /**
   * Removes the specified point from this shape if it exists in
   * this shape.
   * 
   * @param {!Point} p The point to remove.
   */
  remove(p) {
    const i = this.points.indexOf(p);
    if (i >= 0) {
      this.points.splice(i, 1);
      p.node.remove();
    }
  }
  
  /**
   * Rotates all points in this shape around the x-axis.
   * 
   * @param {number} rad The radians by which to rotate points. Should be
   *     small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateX(rad) {
    for (const point of this.points) {
      point.rotateX(rad);
    }
  }
  
  /**
   * Rotates all points in this shape around the y-axis.
   * 
   * @param {number} rad The radians by which to rotate points. Should be
   *     small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateY(rad) {
    for (const point of this.points) {
      point.rotateY(rad);
    }
  }
  
  /**
   * Rotates all points in this shape around the z-axis.
   * 
   * @param {number} rad The radians by which to rotate points. Should be
   *     small to avoid jumpy animations (~ Math.PI / 360).
   */
  rotateZ(rad) {
    for (const point of this.points) {
      point.rotateZ(rad);
    }
  }
  
  /** 
   * Draws all points of this shape.
   */
  draw() {
    for (const point of this.points) {
      point.draw();
    }
  }

  /**
   * Returns an array of three-dimensional distances for each point from
   * this shape's form to the specified form.
   *
   * @param {!Shape} form The shape to which to be morphed.
   */
  computeDistance(form) {
    let diff = form.points.length - this.points.length;
    
    // Add extra points deep in z-axis if necessary.
    for (let i = 0; i < diff; i++) {
      // New points will come from random position near the
      // center of the viewport.
      const x = Math.random() * 1.25 - 0.75;
      const y = Math.random() * 1.25 - 0.75;
      const z = 1;
      this.insert(Math.floor(Math.random() * this.points.length),
                  new Point(x, y, z, this.parent));
    }

    const distances = new Array(this.points.length);

    // Mark points for removal that are not necessary.
    //
    // Uses a partial yates shuffle to avoid the same index being
    // overwritten multiple times.
    if (diff < 0) {
      diff = -diff;
      let len = distances.length;
      const taken = new Array(len);
      while (diff--) {
        const i = Math.floor(Math.random() * len);
        const index = (i in taken) ? taken[i] : i;
        distances[index] = [
          /* x= */ Math.random() * 0.3 - 0.15,
          /* y= */ Math.random() * 0.3 - 0.15,
          /* z= */ 1,
          /* remove= */ true,
        ];
        taken[i] = (--len in taken) ? taken[len] : len;
      }
    }
    
    let j = 0;
    for (let i = 0; i < this.points.length; i++) {
      if (distances[i] === undefined) {
        const thisShapePoint = this.points[i];
        const otherShapePoint = form.points[j++];
        
        const dx = otherShapePoint.x - thisShapePoint.x;
        const dy = otherShapePoint.y - thisShapePoint.y;
        const dz = otherShapePoint.z - thisShapePoint.z;
        
        distances[i] = [dx, dy, dz];
      }
    }
    
    return distances;
  }
}

/**
 * A morph animation. Animates the change from one shape to another.
 */
class Morph extends Animation {
  /**
   * Constructs a new Morph animation. Morphs the specified shape to the
   * specified form (another shape object).
   *
   * @param {!Shape} shape A shape that is attached to the DOM.
   * @param {!Shape} form Another shape that is not attached to the
   *     DOM to which `shape` will be morphed.
   */
  constructor(shape, form) {
    super(shape.parent);
    this.shape = shape;
    this.shape.name = form.name;
    
    /**
     * The current animation frame.
     * 
     * @type {number}
     */
    this.frameCount = 0;

    /**
     * The total number of frames for this animation.
     * 
     * @type {number}
     */
    this.totalFrames = 30;

    /**
     * An array of three-dimensional distances from each point in
     * `shape` to each point in `form`.
     * 
     * @type {!Array<Array<number, number, number, ?boolean>>}
     */
    this.distances = shape.computeDistance(form);

    // Start a reveal animation for the new name of this shape.
    const shapeLabel = document.querySelector('.shape');
    Animator.queue(new Reveal(shapeLabel, this.shape.name));

    // Cancel the current Exhibit animation on this shape while
    // this Morph animation is animating.
    Animator.cancel(this.node.id, Exhibit);
  }

  /** @override */
  anim() {
    if (this.frameCount === this.totalFrames) {
      // Resume the Exhibit animation.
      Animator.queue(new Exhibit(this.shape));
      return true;
    }
    
    // Move each point in this shape one increment towards
    // its destination.
    for (let i = this.shape.points.length - 1; i >= 0; i--) {
      const p = this.shape.points[i];

      p.x += this.distances[i][0] / this.totalFrames;
      p.y += this.distances[i][1] / this.totalFrames;
      p.z += this.distances[i][2] / this.totalFrames;

      // On the last processed frame, remove all points that are not
      // necessary for the new form.
      if (this.frameCount === (this.totalFrames - 1) &&
          this.distances[i][3]) {
        this.shape.remove(p);
      }
    }

    this.frameCount++;
  }
}

/**
 * A fading reveal animation for text elements.
 */
class Reveal extends Animation {
  /**
   * Constructs a new Reveal animation.
   * 
   * @param {!Element} node The parent node in which to add letters.
   * @param {string} text The string to write within the parent node.
   */
  constructor(node, text) {
    super(node);
    this.text = text;
    
    /**
     * The animation frame.
     * 
     * @type {number}
     */
    this.frameCount = 0;

    /**
     * An invisible element which gives the correct left padding
     * for this reveal animation.
     * 
     * @type {!Element}
     */
    this.fname = document.querySelector('.shape.fake');
    this.fname.textContent = this.text;
  }

  /** @override */
  anim() {
    if (this.frameCount - 14 === this.text.length) {
      return true;
    }
    
    // Controls the different stages of the reveal.
    //
    // 1. Fade the initial letters out of view.
    // 2. Remove all the letters.
    // 3. Reveal the empty string and set left padding.
    // 4. Add and fade in each letter of the new string.
    switch (true) {
    case (this.frameCount < 5): // 1
      this.node.style.opacity = +this.node.style.opacity - 0.2;
      if (this.frameCount == 4) { // 2
        while (this.node.firstChild) {
          this.node.removeChild(this.node.firstChild);
        }
      }
      break;
      
    case (this.frameCount == 5): // 3
      this.node.style.opacity = 1;
      this.node.style.left = this.fname.offsetLeft + 'px';
      // Fall through.
      
    default: // 4
      if (this.frameCount - 5 < this.text.length) {
        const letter = document.createElement('span');
        letter.style.opacity = 0;
        letter.textContent = this.text[this.frameCount - 5];
        this.node.appendChild(letter);
      }
      for (const letter of this.node.childNodes) {
        letter.style.opacity = +letter.style.opacity + 0.1;
      }
      break;
    }
    
    this.frameCount++;
  }
}

/**
 * A cube.
 */
class Cube extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'cube';
    const step = 0.122222;
    for (let x = -0.55; x <= 0.55; x += step) {
      for (let y = -0.55; y <= 0.55; y += step) {
        for (let z = -0.55; z <= 0.55; z += step) {
          super.add(new Point(x, y, z, parent));
        }
      }
    }
  }
}

/**
 * A sphere lattice.
 */
class Sphere extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'fibonacci lattice';
    const numPoints = 1000;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const radius = 0.9;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      super.add(new Point(x, y, z, parent));
    }
  }
}

/**
 * Nested sphere lattices.
 */
class FullSphere extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'nested fibonacci lattice';
    const numPoints = 250;
    for (let j = 0.225; j <= 0.9; j += 0.225) {
      for (let i = 0; i < numPoints; i++) {
        const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
        const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
        const radius = j;
        const x = radius * Math.cos(theta) * Math.sin(phi);
        const y = radius * Math.sin(theta) * Math.sin(phi);
        const z = radius * Math.cos(phi);
        super.add(new Point(x, y, z, parent));
      }
    }
  }
}

/**
 * Adjusted sphere lattice.
 */
class SpiralSphere extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'adjusted fibonacci lattice';
    const numPoints = 1000;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
      const theta = Math.PI + (1 + Math.sqrt(5)) * (i + 0.5);
      const radius = 0.9;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      super.add(new Point(x, y, z, parent));
    }
  }
}

/*
 * Random points within a spherical volume.
 */
class NoisySphere extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'noisy sphere';
    for (let i = -1; i < 1; i += 0.2) {
      for (let j = -1; j < 1; j += 0.2) {
        for (let k = -1; k < 1; k += 0.2) {
          const lambda = Math.pow(Math.random(), 1/3);
          const u = Math.random() * 2 - 1;
          const u2 = Math.sqrt(1 - Math.pow(u, 2));
          const phi = Math.random() * 2 * Math.PI;
          const radius = 0.9;
          const x = radius * lambda * u2 * Math.cos(phi);
          const y = radius * lambda * u2 * Math.sin(phi);
          const z = radius * lambda * u;
          super.add(new Point(x, y, z, parent));
        }
      }
    }
  }
}

/**
 * Intersecting disks.
 */
class Disk extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'intersecting disks';
    for (let i = 0; i <= 1; i += 0.0625) {
      for (let j = 0; j <= 1; j += 0.125) {
        for (let k = 0; k < 1; k += 0.125) {
          const theta = i * Math.PI;
          const phi = j * 2 * Math.PI;
          const radius = k;
          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.sin(theta) * Math.sin(phi);
          const z = radius * Math.cos(theta);
          if (!(x == 0 && y == 0 && z == 0)) {
            super.add(new Point(x, z, y, parent));
          }
        }
        if (i == 0) {
          break;
        }
      }
    }
  }
}

/**
 * Beaming rays, like a sun :).
 */
class Ray extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'beaming rays; like a sun';

    // Interior sphere.
    const numPoints = 200;
    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      const radius = 0.28;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      super.add(new Point(x, y, z, parent))
    }
    
    // Rays.
    for (let i = 0; i <= 1; i += 0.125) {
      for (let j = 0; j <= 1; j += 0.1) {
        for (let k = 0; k <= 1; k += 0.125) {
          const theta = i * Math.PI;
          const phi = j * 2 * Math.PI;
          const radius = (k + 0.9) * 0.5;
          const x = radius * Math.sin(theta) * Math.cos(phi);
          const y = radius * Math.sin(theta) * Math.sin(phi);
          const z = radius * Math.cos(theta);
          super.add(new Point(x, z, y, parent));
        }
        if (i == 0) {
          break;
        }
      }
    }
  }
}

/**
 * Two crescent shapes.
 */
class Crescents extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'kissing crescents';
    const step = 0.001;
    for (let i = 0; i < 1; i += step) {
      const v = i;
      const u = 120 * v;
      const x = (2 + Math.sin(2* Math.PI* u) *Math.sin(2 *Math.PI* v)) *Math.sin(3* Math.PI *v) * 0.3;
      const y = (2 + Math.sin(2* Math.PI *u) *Math.sin(2 *Math.PI *v)) *Math.cos(3* Math.PI *v) * 0.3;
      const z = (Math.cos(2* Math.PI *u) * Math.sin(2* Math.PI* v) + 4 *v - 2) * 0.3;
      super.add(new Point(x, y, z, parent));
    }
  }
}

/**
 * A torus (donut).
 */
class Torus extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'torus; like a doughnut';
    const R = 0.65;
    const r = 0.3;
    const step = 0.001;
    for (let i = 0; i < 1; i += step) {
      const phi = i * 2 * Math.PI;
      const theta = 47 * phi;
      const x = (R + r * Math.cos(theta)) * Math.cos(phi);
      const y = (R + r * Math.cos(theta)) * Math.sin(phi);
      const z = r * Math.sin(theta);
      super.add(new Point(x, y, z, parent));
    }
  }
}

/**
 * A twisted torus.
 */
class TwistedTorus extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'contorted torus';
    const N = 4;
    const R3 = 3;
    const R = 15;
    const N2 = 4;
    const step = 0.03125;
    for (let i = 0; i < 1; i += step) {
      for (let j = 0; j < 1; j += step) {
        const v = i * 2 * Math.PI - Math.PI;
        const u = j * 2 * Math.PI - Math.PI * Math.pow(v, 1);
        
        const f1 = (R3+(R/(10*N))*Math.cos(N2*u/N+((R/(10*N))-R/10)/(R/(10*N))*v)+(R/10-(R/(10*N)))*Math.cos(N2*u/N+v));
        const f2 = ((R/(10*N))*Math.sin(N2*u/N+((R/(10*N))-R/10)/(R/(10*N))*v)+(R/10-(R/(10*N)))*Math.sin(N2*u/N+v));
        
        const x = -Math.sin(u) * f1 * 0.2;
        const y = Math.cos(u) * f1 * 0.2;
        const z = f2 * 0.2;
        
        super.add(new Point(x, z, y, parent));
      }
    }
  }
}

/**
 * A horn torus.
 */
class HornTorus extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'horn torus';
    const R = 0.47;
    const r = 0.47;
    const step = 0.001;
    for (let i = 0; i < 1; i += step) {
      const phi = i * 2 * Math.PI;
      const theta = 45 * phi;
      const x = (R + r * Math.cos(theta)) * Math.cos(phi);
      const y = (R + r * Math.cos(theta)) * Math.sin(phi);
      const z = r * Math.sin(theta);
      super.add(new Point(x, z, y, parent));
    }
  }
}

/**
 * Interlocking tori.
 */
class Tori extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'interlocking tori';
    const R = 0.45;
    const r = 0.225; 
    const step = 0.002;
    for (let i = 0; i < 1; i += step) {
      const phi = i * 2 * Math.PI;
      const theta = 45 * phi;
      const x = (R + r * Math.cos(theta)) * Math.cos(phi);
      const y = (R + r * Math.cos(theta)) * Math.sin(phi);
      const z = r * Math.sin(theta);
      super.add(new Point(x + r, z, y, parent));
    }
    for (let i = 0; i < 1; i += step) {
      const phi = i * 2 * Math.PI;
      const theta = 45 * phi;
      const x = (R + r * Math.cos(theta)) * Math.cos(phi);
      const y = (R + r * Math.cos(theta)) * Math.sin(phi);
      const z = r * Math.sin(theta);
      super.add(new Point(x - r, y, z, parent));
    }
  }
}

/**
 * A cylinder horn torus.
 */
class Cylinder extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'adjusted horn torus';
    const R = 0.55;
    const r = 0.55;
    const step = 0.001;
    for (let i = 0; i < 1; i += step) {
      const phi = i * 2 * Math.PI;
      const theta = 45 * phi;
      const inter = Math.cos(theta) > 0.4 ? 0.4 : Math.cos(theta);
      const x = (R + r * inter) * Math.cos(phi);
      const y = (R + r * inter) * Math.sin(phi);
      const z = r * Math.sin(theta);
      super.add(new Point(x, z, -y, parent));
    }
  }
}

/**
 * A nautilus shell.
 */
class Shell extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'nautilus shell';
    for (let i = 0; i < 1; i += 0.03125) {
      for (let j = 0; j < 1; j += 0.03125) {
        const theta = i * Math.PI;
        const phi = j * 11 * Math.PI / 4 - Math.PI / 4;
        const x = 0.5 * Math.pow(1.1, phi) * (Math.pow(Math.sin(theta), 2) * Math.sin(phi));
        const y = 0.5 * Math.pow(1.1, phi) * (Math.pow(Math.sin(theta), 2) * Math.cos(phi));
        const z = 0.5 * Math.pow(1.1, phi) * (Math.sin(theta) * Math.cos(theta));
        super.add(new Point(-x, y, z, parent));
      }
    }
  }
}

/*
 * Mesh functions.
 */
const meshFunc1 = function (x, z) {
  return Math.sin(-Math.pow(x * 2.2, 2) + Math.pow(z * 3, 2)) * (x / 1.5);
}
const meshFunc2 = function (x, z) {
  return (17.5 * x * z) / Math.exp((Math.pow(x * 2.5, 2)) + (Math.pow(z * 2.5, 2)));
}

/**
 * All the mesh functions.
 * 
 * @type {!Array<function(number, number): number>}
 */
const functions = [meshFunc1, meshFunc2];

/** 
 * A mesh-like shape (a 3D graph of a 3D function).
 */
class Mesh extends Shape {
  constructor(parent, func) {
    super(parent);
    this.name = 'mesh';

    if (func === undefined) {
      func = Math.floor(Math.random() * functions.length);
    }
    this.func = functions[func];
    
    for (let x = -0.7; x < 0.7; x += 0.04375) {
      for (let z = -0.7; z < 0.7; z += 0.04375) {
        const y = this.func(x, z);
        if (y !== undefined) {
          super.add(new Point(x, y, z, parent));
        }
      }
    }
  }
}

/**
 * 1000 randomly positioned points.
 */
class Singularity extends Shape {
  constructor(parent) {
    super(parent);
    this.name = 'singularity';
    for (let i = 0; i < 1000; i++) {
      super.add(new Point(
        Math.random() * 2.5 - 1.25, 
        Math.random() * 2.5 - 1.25,
        Math.random() * 2.5 - 1.25,
        parent,
      ));
    }
  }
}

/**
 * All the shapes.
 * 
 * @type {!Array<Shape>}
 */
const shapes = [
  Cube, Sphere, FullSphere, SpiralSphere,
  NoisySphere, Disk, Ray, Crescents, Torus,
  TwistedTorus, HornTorus, Tori, Cylinder,
  Shell, Mesh, Singularity,
];

/**
 * Returns a shape based on the specified ID. The ID corresponds to an 
 * index in shapes array below.
 * 
 * @param {number} i An integer specifying which shape to return. If 
 *     i < 0, a random shape is returned.
 * @param {?Element} parent The DOM element to which to append points
 *     if the points should be attached. Leave undefined if the shape
 *     should not be attached to the window.
 */
function getShape(i, parent) {
  if (i < 0) {
    let newMorph = Math.floor(Math.random() * (shapes.length - 1));
    while (newMorph === currentShapeIndex) {
      newMorph = Math.floor(Math.random() * (shapes.length - 1));
    }
    currentShapeIndex = newMorph;
  } else {
    currentShapeIndex = i;
  }

  return new shapes[currentShapeIndex](parent);
}
