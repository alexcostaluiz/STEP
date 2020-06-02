/**
 * navigation.js
 * 05/31/2020
 *
 * Manages navigation animations.
 * 
 * @author Alexander Luiz Costa
 */

/**
 * True if the navigation drawer is open; false otherwise.
 *
 * @type {boolean}
 */
let open = false;

/**
 * The expanded height of the dropdown menu for mobile devices.
 *
 * @type {number}
 */
let dropdownHeight = 0;

/**
 * The expandable part of the navigation drawer.
 *
 * @type {?Element}
 */
let dropdown;

/**
 * The navigation drawer for mobile navigation.
 *
 * @type {?Element}
 */
let drawer;

/*
 * Initializes the navigation drawer for browsing on mobile devices.
 */
window.addEventListener("load", () => {
  drawer = document.querySelector(".drawer");
  dropdown = document.querySelector(".dropdown");
  
  if (dropdownHeight === 0 && getComputedStyle(drawer).display !== "none") {
	  initDropdown();
  }
});

/*
 * Initializes the navigation drawer in the case that the browser window
 * is first sized for desktop viewing and is later shrunk to mobile sizing.
 */
window.addEventListener("resize", () => {
  if (dropdownHeight === 0 && getComputedStyle(drawer).display !== "none") {
	  initDropdown();
  }
});

/**
 * Initializes navigation dropdown height. The dropdown element is, by default,
 * invisibile (opacity = 0.0), positioned absolutely, and expanded. Here we
 * save the expanded height for use in the reveal and dismiss animations and
 * reset the style of the dropdown.
 */
function initDropdown() {
  dropdownHeight = dropdown.offsetHeight;
  
  // Remove opacity and position styling.
  dropdown.style = undefined;
  dropdown.style.height = "0px";
}

/**
 * Toggles the opening/closing of the navigation drawer.
 */
function toggleDropdown() {
  Animator.queue(new ToggleDropdown(dropdown, dropdownHeight, open, 25));
  open = !open;
}

/**
 * A hide/reveal dropdown animation.
 */
class ToggleDropdown extends Animation {
  /**
   * Constructs a new `ToggleDropdown` animation.
   *
   * @param {!Element} dropdown The element to animate, must have an ID.
   * @param {number} height The expanded height of the dropdown element.
   * @param {boolean} open The current state of the dropdown. Should be
   *     true if the dropdown is open or opening before this animation
   *     and false if the dropdown is closed or closing before this
   *     animation.
   * @param {number} step The increment by which to expand or minimize
   *     the drdopdown element each animation frame. Controls the speed
   *     of this animation. Must be positive.
   */
  constructor(dropdown, height, open, step) {
	  super(dropdown);
	  this.height = height;
	  this.open = open;
	  this.step = (open) ? -step : step;
  }

  /** @override */
  anim() {
	  const curr = +this.node.style.height
          .substr(0, this.node.style.height.length-2);
	  const dest = (this.open) ? 0 : this.height;
	  const start = (this.open) ? this.height : 0;

	  if (curr === dest) {
	    return true;
	  }

    const progress = Math.abs((dest - (curr - this.step / 100)) / (dest - start));
	  let newHeight = curr + (this.step * progress);

    if (!this.open && newHeight > this.height ||
        this.open && newHeight < 0) {
      newHeight = dest;
    }
    
	  this.node.style.height = newHeight + "px";
  }
}
