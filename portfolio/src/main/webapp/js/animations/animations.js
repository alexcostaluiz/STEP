/**
 * animations.js
 * 10/17/2019
 * 
 * A lightweight javascript animations library.
 *
 * @author Alexander Luiz Costa
 */

/** 
 * Holds a collection of currently running animations.
 * 
 * @type {!Object<string, number>}
 */
const animations = {};

/**
 * Registers and deregisters animations.
 * 
 * @abstract
 */
class Animator {
  /**
   * Queues the specified animation with `window.requestAnimationFrame`.
   * 
   * @param {!Animation} anim The animation to queue.
   * @param {number} delay The delay in milliseconds before this animation is
   *     queued.
   * @return {!Animation} The queued animation. Useful for chaining a call to
   *     `Animation#then({function(): undefined})`.
   */
  static queue(anim, delay) {
    if (delay !== undefined) {
      setTimeout(() => {
        this.queue(anim);
      }, delay);
      return anim;
    } else {
      if (anim instanceof Animation) {
        this.cancel(anim.ids, anim.constructor);
        const i = window.requestAnimationFrame(anim.run);
        animations[[anim.node.id, anim.constructor.name]] = i;
        return anim;
      }
      else {
        throw new Error('Error: specified animation must inherit from Animation class');
      }
    }
  }

  /**
   * Cancels an animation if one is currently running on any DOM element(s)
   * with the specified id(s) and matches the specified animation subclass.
   *
   * @param {!string|Array<string>} ids An id or array of ids of DOM element(s)
   *     whose specified animation should be canceled.
   * @param {!Animation} a The animation subclass to cancel (e.g. if you are
   *     trying to cancel a CrossFade animation, pass `CrossFade`. Do NOT
   *     pass an instance of the CrossFade class. Alternatively, if you must
   *     pass an instance, you may pass crossFade.constructor where crossFade
   *     is an instance of the CrossFade class).
   */
  static cancel(ids, anim) {
    if (typeof ids === 'string') {
      window.cancelAnimationFrame(animations[[ids, anim.name]]);
      delete animations[[ids, anim.name]];
    } else {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        window.cancelAnimationFrame(animations[[id, anim.name]]);
        delete animations[[id, anim.name]];
      }
    }
  }

  /**
   * Cancels all animations running on a DOM element with the specified id.
   *
   * @param {string} id The id of the element whose animations should be
   *     canceled.
   */
  static cancelAll(id) {
    for (let key in animations) {
      if (key.includes(id)) {
        window.cancelAnimationFrame(animations[key]);
        delete animations[key];
      }
    }
  }

  /**
   * Returns whether any animations are running on the DOM element with the
   * specified id.
   * 
   * @param {string} id The id of the element on which to check for animations.
   * @return {boolean} True if any animations are running on the object; false
   *     otherwise.
   */
  static check(id) {
    for (let key in animations) {
      if (key.includes(id)) {
        return true;
      }
    }
    return false;
  } 
}

/**
 * Base animation class.
 * 
 * @abstract
 */
class Animation {

  /**
   * Constructs an `Animation` instance. The specified DOM element must have
   * an explicitly assigned ID. This contructor should be called via super()
   * in all `Animation` subclasses at the first line in their respective
   * constructors.
   * 
   * @param {!Element} node The DOM element to be animated. May or may not be
   *     the actual or only element being animated in a given animation. The
   *     combination of the ID of this node and the name of this animation
   *     simply serve as a unique identifier for this animation.
   */
  constructor(node) {
    if (this.constructor === Animation) {
      throw new TypeError('Abstract class "Animation" cannot be instantiated.');
    }    
    if (node.id === '') {
      throw new TypeError('DOM element "node" must have an explicitly assigned id.');
    }

    this.node = node;

    /** @type {string} */
    this.ids = [node.id];

    /** @type {function(): undefined} */
    this.run = () => void this.animWrapper();

    /** @type {function(): undefined} */
    this.after = undefined;
  }

  /**
   * Compute an animation frame. Called recursively for every animation 
   * frame during the lifecycle of this animation. Return false when another
   * animation frame for this animation shall be requested. Return true when
   * this animation is complete and no more animation frames shall be requested
   * for this animation.
   * 
   * @return {boolean} True if this animation is complete; false otherwise.
   * 
   * @abstract
   */
  anim() {}

  /**
   * Wraps the `anim()` method with the universal logic to request or not
   * request another animation frame for this animation according to the
   * return value of `Animation#anim()`.
   */
  animWrapper() {
    const complete = this.anim();
    if (complete) {
      Animator.cancel(this.ids, this.constructor);
      if (this.after !== undefined) {
        this.after();
      }
    } else {
      const i = window.requestAnimationFrame(this.run);
      animations[[this.node.id, this.constructor.name]] = i;
    }
  }

  /**
   * Registers a callback to run when this animation has finished.
   *
   * @param {function(): undefined} after The function to run when this
   * animation has finished.
   */
  then(after) {
    this.after = after;
  }
}

/**
 * A fade animation.
 */
class Fade extends Animation {
  /**
   * Constructs a new Fade animation.
   *
   * @param {!Element} node The node to fade, must have an id.
   * @param {number} fadeTo The opacity value to which to fade. Should be
   *     within the following bounds: 0 <= fadeTo <= 1.
   * @param {number} step The increment by which to increase or decrease
   *     opacity each animation frame. Controls the speed of the animation,
   *     may be positive or negative (e.g. 0.1). 
   */
  constructor(node, fadeTo, step) {
    super(node);
    this.fadeTo = fadeTo;
    this.step = step;
  }

  /** @override */
  anim() {
    let complete = true;
    try {
      complete = this.stepFade(this.node, this.fadeTo, this.step);
    } catch (e) {
      console.error(e);
    }
    return complete;
  }
  
  /**
   * A helper method to increase or decrease the `node` opacity by `step`.
   *
   * Note: Not using this.node, this.fadeTo, etc. and passing arguments
   * allows different fades to be called within the same animation.
   * @see CrossFade
   *
   * @param {!Element} node The node to manipulate.
   * @param {number} fadeTo The opacity value to which to fade.
   * @param {number} step The increment of opacity value.
   * @return {boolean} True if node has reached `fadeTo`; false otherwise.
   */
  stepFade(node, fadeTo, step) {
    const opacity = +node.style.opacity;
    
    if (fadeTo < opacity && step > 0 ||
        fadeTo > opacity && step < 0) {
      throw new Error('Error: step is incompatible with fadeTo (infinite loop).');
    }
    
    if (opacity === fadeTo) {
      return true;
    }
    
    const newOpacity = opacity + step;
    if (step < 0 && newOpacity < fadeTo ||
        step > 0 && newOpacity > fadeTo) {
      node.style.opacity = fadeTo;
    } else {
      node.style.opacity = newOpacity;
    }
    
    return false;
  }
}

/**
 * A crossfade animation.
 */
class CrossFade extends Fade {
  /**
   * Constructs a new CrossFade animation.
   *
   * @param {!Element} node The node to fade out.
   * @param {!Element} otherNode The node to fade in.
   * @param {number} fadeTo The oapcity value to which to fade `otherNode`. 
   *     Should be within the following bounds: 0 <= fadeTo <= 1.
   * @param {number} step The increment by which to increase or decrease
   *     opacity each animation frame. Controls the speed of the animation,
   *     may be positive or negative (e.g. 0.1).
   */
  constructor(node, otherNode, fadeTo, step) {
    super(node, fadeTo, step);
    this.otherNode = otherNode;
    this.ids.push(otherNode.id);

    /**
     * False while `node` is transitioned out of view; true while `otherNode`
     * is transitioned into view.
     * 
     * @type {boolean}
     */
    this.flip = false;
  }

  /** @override */
  anim() {
    if (!this.flip) {
      let complete = true;
      
      try {
        complete = this.stepFade(this.node, /* fadeTo= */ 0.0, -this.step);
      } catch (e) {
        console.error(e);
      }

      // `node` has been transitioned out of view
      if (complete) {
        this.flip = true;
        this.node.style.display = 'none';
        this.otherNode.style.display = 'block';
        const temp = this.node;
        this.node = this.otherNode;
        this.otherNode = temp;
      }
    } else {
      let complete = true;
      try {
        complete = this.stepFade(this.node, this.fadeTo, this.step);
      } catch (e) {
        console.error(e);
      }
      return complete;
    }
  }
}

/**
 * A fade animation with a translation.
 */ 
class FadeShift extends Fade {
  /**
   * Constructs a new FadeShift animation.
   *
   * @param {!Element} node The node to animate, must have an id.
   * @param {number} fadeTo The opacity value to which to fade. Should be
   *     within the following bounds: 0 <= fadeTo <= 1.
   * @param {number} fadeStep The increment by which to increase or decrease
   *     opacity each animation frame. Controls the speed of the animation,
   *     may be positive or negative (e.g. 0.1).
   * @param {string} shiftAxis The axis on which to translate `node`. 'x' for
   *     left-right translations, 'y' for up-down translation. 'y' is default.
   * @param {number} shiftFrom The starting translation value.
   * @param {number} shiftTo The destination translation value.
   * @param {number} shiftStep The increment by which to translate `node` each
   *     animation frame. Controls the speed of the translation. Can be negative
   *     or positive. By default, this value will be calculated to finish the
   *     translation at the same time the fade ends. Only supply a value if you
   *     wish for the fade and shift to end at different times.
   */
  constructor(node, fadeTo, fadeStep, shiftAxis, shiftFrom, shiftTo, shiftStep) {
    super(node, fadeTo, fadeStep);
    this.shiftFrom = shiftFrom;
    this.shiftTo = shiftTo;
    
    if (/[XxYy]/g.test(shiftAxis)) {
      this.shiftAxis = shiftAxis.toUpperCase();
    } else {
      throw new Error('Invalid shiftAxis. Valid values include "x" or "X" and "y" or "Y".');
    }
    
    this.shiftStep = (shiftStep === undefined) ? this.computeShiftStep() : shiftStep;
    
    this.shiftCurr = shiftFrom;
    this.node.style.transform = 'translate' + this.shiftAxis + '(' +
      this.shiftCurr + 'px)';
  }
  
  /** @override */
  anim() {
    let fadeComplete = true;
    let shiftComplete = true;
    try {
      fadeComplete = this.stepFade(this.node, this.fadeTo, this.step);
      shiftComplete = this.stepShift(this.node, this.shiftAxis,
                                     this.shiftTo, this.shiftStep);
    } catch (e) {
      console.error(e);
    }
    return fadeComplete && shiftComplete;
  }

  /** 
   * A helper method to compute a shiftStep to match the timing of
   * the fade animation.
   *
   * @return {number} A shiftStep that matches the fade timing.
   */
  computeShiftStep() {
    const currOpacity = +this.node.style.opacity;
    const diff = this.fadeTo - currOpacity;
    const numIterations = diff / this.step;
    
    return (this.shiftTo - this.shiftFrom) / numIterations;
  }
  
  /**
   * A helper method to translate a node by the specified increment.
   *
   * @param {!Element} node The node to manipulate.
   * @param {string} axis The axis on which to translate node.
   * @param {number} shiftTo The destination translation value.
   * @param {number} step The increment of translation.
   * @return {boolean} True if `node` has reached its destination; false
   *     otherwise
   */
  stepShift(node, axis, shiftTo, step) {
    const curr = this.shiftCurr;
    
    if (shiftTo < curr && step > 0 ||
        shiftTo > curr && step < 0) {
      throw 'Error: step is incompatible with fadeTo (infinite loop).';
    }
    
    if (curr === shiftTo) {
      return true;
    }

    const progress = Math.abs((shiftTo - curr) / (shiftTo - this.shiftFrom));
    let newShift = curr + (step * progress) + (step / 10);
    if (step < 0 && newShift < shiftTo ||
        step > 0 && newShift > shiftTo) {
      newShift = shiftTo;
    }
    node.style.transform = 'translate' + axis + '(' + newShift + 'px)';
    this.shiftCurr = newShift;
    
    return false;
  }
}
