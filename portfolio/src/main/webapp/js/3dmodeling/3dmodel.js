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
let viewportWidth = 0;

/**
 * Height of the 3D viewport.
 * 
 * @type {number}
 */
let viewportHeight = 0;

/**
 * Top offset of the 3D viewport.
 *
 * @type {number}
 */
let viewportOffsetTop = 0;

/**
 * Left offset of the 3D viewport.
 *
 * @type {number}
 */
let viewportOffsetLeft = 0;

/**
 * A scaling factor based on the viewport width.
 *
 * @type {number}
 */
let viewportScale = 0;

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
const rotationStepSize = Math.PI / 720;

/**
 * True if home page is in interactive mode; false otherwise.
 *
 * @type {boolean}
 */
let interactiveModeEnabled = false;

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
let currentShapeIndex = shapes.length - 1;

/**
 * True if the device is a primary touch device (tablet/phone).
 *
 * @type {boolean}
 */
let deviceIsPrimaryTouch = false;

/**
 * The current shape being modeled.
 * 
 * @param {?Shape}
 */
let currentShape = undefined;

/*
 * Initialize the program.
 */
window.addEventListener('load', () => {
  deviceIsPrimaryTouch = getComputedStyle(document.querySelector('.hint-b'))
    .display !== 'none';

  init3DModel();
  initTouchAccessibility();
});

/**
 * Initializes the 3D modeling program.
 */
function init3DModel() {
  const viewport = document.querySelector('.mesh');
  set3DViewportAspectRatio(viewport);
  
  // Initialize listeners.
  window.addEventListener('mousemove', (event) => {
    mouseX = event.pageX;
    mouseY = event.pageY;
  });

  window.addEventListener('resize', () => {
    set3DViewportAspectRatio(viewport);
    const shapeName = document.querySelector('.shape');
    const shapeNameFake = document.querySelector('.shape.fake');
    shapeName.style.left = shapeNameFake.offsetLeft + 'px';
  });

  viewport.addEventListener('mouseenter', () => {
    if (!interactiveModeEnabled) {
      const hint = document.querySelector('.hint');
      Animator.queue(new Fade(hint, 0.5, 0.05));
    }
  });

  viewport.addEventListener('mouseleave', () => {
    if (!interactiveModeEnabled) {
      const hint = document.querySelector('.hint');
      Animator.queue(new Fade(hint, 0.0, -0.05));
    }
  });

  // Queue animations.
  currentShape = getShape(currentShapeIndex, viewport);
  Animator.queue(new Draw(currentShape));
  if (!deviceIsPrimaryTouch) Animator.queue(new Distort(currentShape));
  Animator.queue(new Morph(currentShape, getShape(-1)));
}

/**
 * Sets the 3D viewport aspect ratio based on the current dimensions
 * of the viewport element.
 * 
 * @param {!Element} viewport The 3D viewport DOM element.
 */
function set3DViewportAspectRatio(viewport) {
  viewportWidth = viewport.offsetWidth;
  viewportHeight = viewport.offsetHeight;
  if (viewportWidth > viewportHeight) {
    viewportWidth = viewportHeight * 1.1;
    viewportOffsetLeft = (viewport.offsetWidth - viewportWidth) / 2;
    viewportOffsetTop = 0;
  } else {
    viewportHeight = viewportWidth / 1.1;
    viewportOffsetTop = (viewport.offsetHeight - viewportHeight) / 2;
    viewportOffsetLeft = 0;
  }
  viewportScale = viewport.offsetWidth / 950;
}

/**
 * Initializes touch accessibility for devices that are primary
 * touch (tablets/phones).
 */
function initTouchAccessibility() {
  const shapeSelectModal = document.querySelector('.modal');
  
  for (let i = 0; i < shapes.length - 1; i++) {
    const p = document.createElement('p');
    
    // See `shapes` array in shapes.js.
    p.textContent = new shapes[i]().name;
    
    p.id = i;
    p.addEventListener('click', (event) => {
      Animator.queue(new Morph(currentShape, getShape(event.target.id)));
      closeModal();
    });
    shapeSelectModal.appendChild(p);
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
    this.frameCount = 0;

    /**
     * The current rotation direction.
     *   1: left
     *   2: right
     *   3: up
     *   4: down
     * 
     * @type {number}
     */
    this.currentRotationDirection = 0;
  }

  /** @override */
  anim() {
    if (pauseRotate) {
      return true;
    }

    // Switch rotation direction every 800 frames.
    if (this.frameCount % 800 == 0) {
      let newRotation = Math.floor(Math.random() * 2);
      if (this.currentRotationDirection < 2) {
        newRotation += 2;
      }
      this.currentRotationDirection = newRotation;
    }

    // Switch shape form every 2400 frames.
    if (!interactiveModeEnabled && this.frameCount % 2400 == 0 && this.frameCount > 0) {
      Animator.queue(new Morph(this.shape, getShape(-1)));
      return true;
    }
    
    if (this.currentRotationDirection == 0) this.shape.rotateX(rotationStepSize);
    else if (this.currentRotationDirection == 1) this.shape.rotateX(-rotationStepSize);
    else if (this.currentRotationDirection == 2) this.shape.rotateY(-rotationStepSize);
    else if (this.currentRotationDirection == 3) this.shape.rotateY(rotationStepSize);
    
    this.frameCount++;
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
    this.welcome = document.querySelector('.columns.welcome');
    /** @type {!Element} */
    this.menu = document.querySelector('.menu');
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
    
    for (const point of this.shape.points) {
      const homeX = point.projectX();
      const homeY = point.projectY();

      const actualX = point.node.offsetLeft;
      const actualY = point.node.offsetTop;
            
      const distanceFromMouseX = (mouseX - xOffset) - actualX;
      const distanceFromMouseY = (mouseY - yOffset) - actualY;
      const distanceFromMouse = Math.sqrt(distanceFromMouseX * distanceFromMouseX +
                                          distanceFromMouseY * distanceFromMouseY);

      // Point spread factor when mouse is near.
      const spread = 800 * viewportScale * viewportScale;

      // "Magnetic" pull factor of home coordinates on actual coordinates.
      let magnet = (distanceFromMouse / 500) / viewportScale;
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
        distortX = (distortX > 0) ? maxDistortion : -maxDistortion;
      }
      if (Math.abs(distortY) > maxDistortion) {
        distortY = (distortY > 0) ? maxDistortion : -maxDistortion;
      }
      
      point.distortX = distortX;
      point.distortY = distortY;
    }
  }
}

/**
 * Enters interative mode.
 */
function enterInteractive() {
  interactiveModeEnabled = true;
  const welcomes = document.querySelector('[welcome]');
  const interactives = document.querySelector('[interactive]');
  const hint = (deviceIsPrimaryTouch) ?
        document.querySelector('.hint-b') :
        document.querySelector('.hint');
  
  Animator.queue(new Fade(hint, 0, -0.1));
  Animator.queue(new CrossFade(welcomes, interactives, 1, 0.1));
}

/**
 * Exits interactive mode.
 */
function exitInteractive() {
  interactiveModeEnabled = false;
  const welcomes = document.querySelector('[welcome]');
  const interactives = document.querySelector('[interactive]');
  
  Animator.queue(new CrossFade(interactives, welcomes, 1, 0.1));
  
  if (pauseRotate) {
    pauseRotate = false;
    Animator.queue(new Exhibit(currentShape));
  }
  
  if (deviceIsPrimaryTouch) {
    const hintb = document.querySelector('.hint-b');
    Animator.queue(new Fade(hintb, 1, 0.05));
  }
}

/**
 * Queues a morph animation to a random shape.
 */
function randomMorph() {
  Animator.queue(new Morph(currentShape, getShape(-1)));
}

/**
 * Plays and pauses the auto rotation of the current shape.
 */
function toggleAutoRotate() {
  pauseRotate = !pauseRotate;
  if (!pauseRotate) {
    Animator.queue(new Exhibit(currentShape));
  }
}

/**
 * Selects a specific shape with a modal menu.
 */
function selectShape() {
  const shapeSelectModal = document.querySelector('.modal');
  const dismissScreen = document.querySelector('.screen');
  shapeSelectModal.style.display = 'block';
  dismissScreen.style.display = 'block';
  Animator.queue(new FadeShift(shapeSelectModal, 1, 0.1, 'y', 16, 0, -1.6));
}

/**
 * Closes the modal menu if it is open.
 */
function closeModal() {
  const shapeSelectModal = document.querySelector('.modal');
  const dismissScreen = document.querySelector('.screen');
  Animator.cancel(shapeSelectModal.id, FadeShift);
  dismissScreen.style.display = 'none';
  shapeSelectModal.style.display = 'none';
  shapeSelectModal.style.opacity = '0';
}

/*
 * Listens to key up events.
 */
document.addEventListener('keyup', (event) => {
  switch (event.key) {
  case 'i': 
  case 'I':
    enterInteractive();
    break;
  case 'Esc': 
  case 'Escape':
    exitInteractive();
    break;
  default:
    break;
  }

  if (interactiveModeEnabled) {
    switch (event.key) {
    case 'm':
    case 'M':
      randomMorph();
      break;
    case 'p':
    case 'P':
      toggleAutoRotate();
      break;
    default:
      break;
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
                  '!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
    const shapeIndex = keys.indexOf(event.key);
    if (shapeIndex >= 0) {
      Animator.queue(new Morph(currentShape, getShape(shapeIndex)));
    }
  }
});

/*
 * Listens to key hold events.
 */
document.addEventListener('keydown', (event) => {
  if (interactiveModeEnabled) {
    const factor = 4;
    switch (event.key) {
    case 's':
    case 'S':
      pauseRotate = true;
      currentShape.rotateX(rotationStepSize * factor);
      break;
    case 'w': 
    case 'W':
      pauseRotate = true;
      currentShape.rotateX(-rotationStepSize * factor);
      break;
    case 'a':
    case 'A':
      pauseRotate = true;
      currentShape.rotateY(rotationStepSize * factor);
      break;
    case 'd':
    case 'D':
      pauseRotate = true;
      currentShape.rotateY(-rotationStepSize * factor);
      break;
    case 'z': 
    case 'Z':
      pauseRotate = true;
      currentShape.rotateZ(-rotationStepSize * factor);
      break;
    case 'x': 
    case 'X':
      pauseRotate = true;
      currentShape.rotateZ(rotationStepSize * factor);
      break;
    default:
      break;
    }
  }
});
