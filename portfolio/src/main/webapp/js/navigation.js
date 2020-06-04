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
let navigationDrawerIsOpen = false;

/**
 * The expanded height of the dropdown menu for mobile devices.
 *
 * @type {number}
 */
let dropdownExpandedHeight = 0;

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
  
  if (dropdownExpandedHeight === 0 &&
      getComputedStyle(drawer).display !== "none") {
    initDropdown();
  }
});

/*
 * Initializes the navigation drawer in the case that the browser window
 * is first sized for desktop viewing and is later shrunk to mobile sizing.
 */
window.addEventListener("resize", () => {
  if (drawer !== undefined && dropdown !== undefined) {
    if (dropdownExpandedHeight === 0 &&
        getComputedStyle(drawer).display !== "none") {
      initDropdown();
    }
  }
});

/**
 * Initializes navigation dropdown height. The dropdown element is, by default,
 * invisibile (opacity = 0.0), positioned absolutely, and expanded. Here we
 * save the expanded height for use in the reveal and dismiss animations and
 * reset the style of the dropdown.
 */
function initDropdown() {
  dropdownExpandedHeight = dropdown.offsetHeight;
  
  // Remove opacity and position styling.
  dropdown.style = undefined;
  dropdown.style.height = "0px";
}

/**
 * Toggles the opening/closing of the navigation drawer.
 */
function toggleDropdown() {
  Animator.queue(new ToggleDropdown(dropdown, dropdownExpandedHeight,
                                    navigationDrawerIsOpen, 25));
  navigationDrawerIsOpen = !navigationDrawerIsOpen;
}

/**
 * A hide/reveal dropdown animation.
 */
class ToggleDropdown extends Animation {
  /**
   * Constructs a new `ToggleDropdown` animation.
   *
   * @param {!Element} dropdown The element to animate, must have an ID.
   * @param {number} expandedHeight The expanded height of the dropdown element.
   * @param {boolean} dropdownIsOpen The current state of the dropdown. Should be
   *     true if the dropdown is open or opening before this animation
   *     and false if the dropdown is closed or closing before this
   *     animation.
   * @param {number} step The increment by which to expand or minimize
   *     the drdopdown element each animation frame. Controls the speed
   *     of this animation. Must be positive.
   */
  constructor(dropdown, expandedHeight, dropdownIsOpen, step) {
    super(dropdown);
    this.expandedHeight = expandedHeight;
    this.dropdownIsOpen = dropdownIsOpen;

    if (step < 0) {
      throw new Error('ToggleDropdown animation cannot have a negative step');
    }
    
    this.step = (dropdownIsOpen) ? -step : step;
  }

  /** @override */
  anim() {
    const currentHeight = +this.node.style.height
          .substr(0, this.node.style.height.length-2);
    const destinationHeight = (this.dropdownIsOpen) ? 0 : this.expandedHeight;
    const initialHeight = (this.dropdownIsOpen) ? this.expandedHeight : 0;

    if (currentHeight === destinationHeight) {
      return true;
    }

    const progress = Math.abs((destinationHeight - (currentHeight - this.step / 100)) / (destinationHeight - initialHeight));
    let newHeight = currentHeight + (this.step * progress);

    if (!this.dropdownIsOpen && newHeight > this.expandedHeight ||
        this.dropdownIsOpen && newHeight < 0) {
      newHeight = destinationHeight;
    }
    
    this.node.style.height = newHeight + 'px';
  }
}
