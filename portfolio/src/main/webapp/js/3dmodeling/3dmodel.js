/**
 * 3dmodel.js
 * 10/17/2019
 * 
 * Driver for the 3d modeling program.
 *
 * @author Alexander Luiz Costa
 */

/**
 * Width of the 3D viewport.
 * 
 * @type {number}
 */
let mWidth = 0;

/**
 * Height of the 3D viewport.
 * 
 * @type {number}
 */
let mHeight = 0;

/**
 * Top offset of the 3D viewport.
 *
 * @type {number}
 */
let mOffsetTop = 0;

/**
 * Left offset of the 3D viewport.
 *
 * @type {number}
 */
let mOffsetLeft = 0;

/**
 * Pointer (mouse/trackpad) x-coordinate.
 *
 * @type {number}
 */
let mouseX = 0;

/**
 * Pointer (mouse/trackpad) y-coordinate.
 *
 * @type {number}
 */
let mouseY = 0;

/**
 * Step size of rotation animations (dictates speed).
 *
 * @type {number}
 */
const dTheta = Math.PI / 720;

/**
 * True if home page is in interactive mode; false otherwise.
 *
 * @type {boolean}
 */
let interactive = false;

/**
 * True if the shape rotation animation is paused; false otherwise.
 *
 * @type {boolean}
 */
let pauseRotate = false;

/**
 * The ID of the current shape being modeled.
 * 
 * @param {number}
 */
let morphc = shapes.length - 1;

/**
 * True if the device is a primary touch device (tablet/phone).
 *
 * @type {boolean}
 */
let touch = false;

/**
 * The current shape being modeled.
 * 
 * @param {?Shape}
 */
let shape;

/*
 * Initialize the program.
 */
window.addEventListener("load", () => {
  touch = getComputedStyle(document.querySelector(".hint-b"))
    .display !== "none";

  init3DModel();
  initTouchAccessibility();
});

/**
 * Initializes the 3D modeling program.
 */
function init3DModel() {
  const mesh = document.querySelector(".mesh");
  set3DViewportAspectRatio(mesh);
  
  // Initialize listeners.
  window.addEventListener("mousemove", (e) => {
    mouseX = e.pageX;
    mouseY = e.pageY;
  });

  window.addEventListener("resize", () => {
    set3DViewportAspectRatio(mesh);
    const shapeName = document.querySelector(".shape");
    const shapeNameFake = document.querySelector(".shape.fake");
    shapeName.style.left = shapeNameFake.offsetLeft + "px";
  });

  mesh.addEventListener("mouseenter", (e) => {
    if (!interactive) {
      const hint = document.querySelector(".hint");
      Animator.queue(new Fade(hint, 0.5, 0.05));
    }
  });

  mesh.addEventListener("mouseleave", (e) => {
    if (!interactive) {
      const hint = document.querySelector(".hint");
      Animator.queue(new Fade(hint, 0.0, -0.05));
    }
  });

  // Queue animations.
  shape = getShape(morphc, mesh);
  Animator.queue(new Draw(shape));
  if (!touch) Animator.queue(new Distort(shape));
  Animator.queue(new Morph(shape, getShape(-1)));
}

/**
 * Sets the 3D viewport aspect ratio based on the current dimensions
 * of the mesh element.
 * 
 * @param {!Element} mesh The 3D viewport DOM element.
 */
function set3DViewportAspectRatio(mesh) {
  mWidth = mesh.offsetWidth;
  mHeight = mesh.offsetHeight;
  if (mWidth > mHeight) {
    mWidth = mHeight * 1.1;
    mOffsetLeft = (mesh.offsetWidth - mWidth) / 2;
    mOffsetTop = 0;
  } else {
    mHeight = mWidth / 1.1;
    mOffsetTop = (mesh.offsetHeight - mHeight) / 2;
    mOffsetLeft = 0;
  }
  meshScale = mesh.offsetWidth / 950;
}

/**
 * Initializes touch accessibility for devices that are primary
 * touch (tablets/phones).
 */
function initTouchAccessibility() {
  const modal = document.querySelector(".modal");
  
  for (let i = 0; i < shapes.length - 1; i++) {
    const p = document.createElement("p");
    
    // See `shapes` array in shapes.js.
    p.textContent = new shapes[i]().name;
    
    p.id = i;
    p.addEventListener("click", (e) => {
      Animator.queue(new Morph(shape, getShape(e.target.id)));
      closeModal();
    });
    modal.appendChild(p);
  }
}

/**
 * Draws all points every animation frame.
 */
class Draw extends Animation {
  /** 
   * Constructs a new Draw instance.
   *
   * @param {!Shape} shape The shape to draw.
   */
  constructor(shape) {
    super(shape.parent);
    this.shape = shape;
  }

  /** @override */
  anim() {
    this.shape.draw();
  }
}

/**
 * An exhibit animation. Passively rotates and morphs the forms of
 * a specified shape.
 */
class Exhibit extends Animation {
  /**
   * Constructs a new Exhibit animation.
   * 
   * @param {!Shape} shape The shape to animate.
   */
  constructor(shape) {
    super(shape.parent);
    this.shape = shape;

    /**
     * The current animation frame.
     * 
     * @type {number}
     */
    this.count = 0;

    /**
     * The current rotation.
     *   1: left
     *   2: right
     *   3: up
     *   4: down
     * 
     * @type {number}
     */
    this.rotation = 0;
  }

  /** @override */
  anim() {
    if (pauseRotate) {
      return true;
    }

    // Switch rotation direction every 800 frames.
    if (this.count % 800 == 0) {
      let newRotation = Math.floor(Math.random() * 2);
      if (this.rotation < 2) {
        newRotation += 2;
      }
      this.rotation = newRotation;
    }

    // Switch shape form every 2400 frames.
    if (!interactive && this.count % 2400 == 0 && this.count > 0) {
      Animator.queue(new Morph(this.shape, getShape(-1)));
      return true;
    }
    
    if (this.rotation == 0) this.shape.rotateX(dTheta);
    else if (this.rotation == 1) this.shape.rotateX(-dTheta);
    else if (this.rotation == 2) this.shape.rotateY(-dTheta);
    else if (this.rotation == 3) this.shape.rotateY(dTheta);
    
    this.count++;
  }
}

/**
 * An animation in which the points of the current shape are repelled by
 * the pointer (mouse/trackpad).
 */
class Distort extends Animation {
  /**
   * Constructs a new Distort instance.
   *
   * @param {!Shape} shape The shape whose points should be distorted.
   */
  constructor(shape) {
    super(shape.parent);
    this.shape = shape;

    // Used for offsetting mouse coordinates to the same plane
    // as the 3D viewport.
    /** @type {!Element} */
    this.welcome = document.querySelector(".columns.welcome");
    /** @type {!Element} */
    this.menu = document.querySelector(".menu");
  }

  /** @override */
  anim() {
    const maxDistortion = 150;

    // Offset required to sync mouse coordinates (which are based on origin at
    // the top left corner of screen) to 3D viewport coordinates (which does
    // not account for sibling container dimensions or margins).
    let xOffset = this.node.offsetLeft + this.menu.offsetWidth;
    let yOffset = 0;
    if (xOffset === 0) {
      xOffset = this.welcome.parentElement.parentElement.offsetLeft;
      const welcomeStyle = getComputedStyle(this.welcome);
      const welcomeHeight = +welcomeStyle.height.slice(0, -2);
      const welcomeMarginTop = +welcomeStyle.marginTop.slice(0, -2);
      const welcomeMarginBottom = +welcomeStyle.marginBottom.slice(0, -2);
      yOffset = welcomeHeight + welcomeMarginTop + welcomeMarginBottom;
    }
    
    for (let i = 0; i < this.shape.points.length; i++) {
      const p = this.shape.points[i];
      
      const homeX = p.projectX();
      const homeY = p.projectY();

      const actualX = p.node.offsetLeft;
      const actualY = p.node.offsetTop;
            
      const distanceFromMouseX = (mouseX - xOffset) - actualX;
      const distanceFromMouseY = (mouseY - yOffset) - actualY;
      const distanceFromMouse = Math.sqrt(distanceFromMouseX * distanceFromMouseX +
                                          distanceFromMouseY * distanceFromMouseY);

      // Point spread factor when mouse is near.
      const spread = 800 * meshScale * meshScale;

      // "Magnetic" pull factor of home coordinates on actual coordinates.
      let magnet = (distanceFromMouse / 500) / meshScale;
      if (magnet > 1.7) magnet = 1.7;
      
      const powerX = actualX - (distanceFromMouseX / distanceFromMouse) *
            spread / distanceFromMouse;
      const powerY = actualY - (distanceFromMouseY / distanceFromMouse) *
            spread / distanceFromMouse;

      const forceX = ((homeX - actualX) / 2) * magnet;
      const forceY = ((homeY - actualY) / 2) * magnet;
                  
      let distortX = ((powerX + forceX) - homeX);
      let distortY = ((powerY + forceY) - homeY);

      // Prevent jumpy points by enforcing a max distortion.
      if (Math.abs(distortX) > maxDistortion) {
        distortX = (distortX > 0) maxDistortion : -maxDistortion;
      }
      if (Math.abs(distortY) > maxDistortion) {
        distortY = (distortY > 0) maxDistortion : -maxDistortion;
      }
      
      p.distortX = distortX;
      p.distortY = distortY;
    }
  }
}

/**
 * Enters interative mode.
 */
function enterInteractive() {
  interactive = true;
  const welcomes = document.querySelector("[welcome]");
  const interactives = document.querySelector("[interactive]");
  const hint = (touch) ?
        document.querySelector(".hint-b") :
        document.querySelector(".hint");
  
  Animator.queue(new Fade(hint, 0, -0.1));
  Animator.queue(new CrossFade(welcomes, interactives, 1, 0.1));
}

/**
 * Exits interactive mode.
 */
function exitInteractive() {
  interactive = false;
  const welcomes = document.querySelector("[welcome]");
  const interactives = document.querySelector("[interactive]");
  
  Animator.queue(new CrossFade(interactives, welcomes, 1, 0.1));
  
  if (pauseRotate) {
    pauseRotate = false;
    Animator.queue(new Exhibit(shape));
  }
  
  if (touch) {
    const hintb = document.querySelector(".hint-b");
    Animator.queue(new Fade(hintb, 1, 0.05));
  }
}

/**
 * Queues a morph animation to a random shape.
 */
function randomMorph() {
  Animator.queue(new Morph(shape, getShape(-1)));
}

/**
 * Plays and pauses the auto rotation of the current shape.
 */
function toggleAutoRotate() {
  pauseRotate = !pauseRotate;
  if (!pauseRotate) {
    Animator.queue(new Exhibit(shape));
  }
}

/**
 * Selects a specific shape with a modal menu.
 */
function selectShape() {
  const modal = document.querySelector(".modal");
  const screen = document.querySelector(".screen");
  modal.style.display = "block";
  screen.style.display = "block";
  Animator.queue(new FadeShift(modal, 1, 0.1, "y", 16, 0, -1.6));
}

/**
 * Closes the modal menu if it is open.
 */
function closeModal() {
  const modal = document.querySelector(".modal");
  const screen = document.querySelector(".screen");
  Animator.cancel(modal.id, FadeShift);
  screen.style.display = "none";
  modal.style.display = "none";
  modal.style.opacity = "0";
}

/*
 * Listens to key up events.
 */
document.addEventListener("keyup", (e) => {
  switch (e.key) {
  case "i": 
  case "I":
    enterInteractive();
    break;
  case "Esc": 
  case "Escape":
    exitInteractive();
    break;
  default:
    break;
  }

  if (interactive) {
    let num = 0;
    switch (e.key) {
    case "m":
    case "M":
      randomMorph();
      break;
    case "p":
    case "P":
      toggleAutoRotate();
      break;
    case "0":
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      num = (+e.key - 1 < 0) ? 9 : +e.key - 1;
      Animator.queue(new Morph(shape, getShape(num)));
      break
    case ")":
      num++;
    case "(":
      num++;
    case "*":
      num++;
    case "&":
      num++;
    case "^":
      num++;
    case "%":
      num++;
    case "$":
      num++;
    case "#":
      num++;
    case "@":
      num++;
    case "!":
      num++;
      Animator.queue(new Morph(shape, getShape(num + 9)));
      break;
    default:
      break;
    }
  }  
});

/*
 * Listens to key hold events.
 */
document.addEventListener("keydown", (e) => {
  if (interactive) {
    const factor = 4;
    switch (e.key) {
    case "s":
    case "S":
      pauseRotate = true;
      shape.rotateX(dTheta * factor);
      break;
    case "w": 
    case "W":
      pauseRotate = true;
      shape.rotateX(-dTheta * factor);
      break;
    case "a":
    case "A":
      pauseRotate = true;
      shape.rotateY(dTheta * factor);
      break;
    case "d":
    case "D":
      pauseRotate = true;
      shape.rotateY(-dTheta * factor);
      break;
    case "z": 
    case "Z":
      pauseRotate = true;
      shape.rotateZ(-dTheta * factor);
      break;
    case "x": 
    case "X":
      pauseRotate = true;
      shape.rotateZ(dTheta * factor);
      break;
    default:
      break;
    }
  }
});
