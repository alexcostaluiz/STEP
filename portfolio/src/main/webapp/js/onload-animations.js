/**
 * onload-animations.js
 * 05/29/2020
 *
 * @author Alexander Luiz Costa
 */

/**
 * Starts the appropriate page load animations on DOMContentLoaded
 * event.
 */
window.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".bp")) {
        fadeShiftContent()
    }

    if (document.querySelector("[sidebar]")) {
        fadeShiftSidebar()
    }

    if (document.querySelector(".socials")) {
        fadeShiftSocials()
    }
})

/**
 * Fades in and shifts up any elements of class "bp".
 * 
 * Can be called from within script tags to execute on page
 * load.
 */
function fadeShiftContent() {
    const body = document.querySelectorAll(".bp")
    for (var i = 0; i < body.length; i++) {
        body[i].id = "bp" + i
        Animator.queue(new FadeShift(body[i], 1, 0.1, 'y', 24, 0, -1.6))
    }
}

/**
 * Fades in and shifts left any sidebar links.
 * 
 * Can be called from within script tags to execute on page
 * load.
 */
function fadeShiftSidebar() {
    const links = document.querySelectorAll("[sidebar]")
    for (var i = 0; i < links.length; i++) {
        links[i].id = "sidebar" + i
        Animator.queue(new FadeShift(links[i], 1, 0.1, "x", 24, 0, -1.6), i * 100)
    }
}

/**
 * Fades in and shifts up any social links.
 * 
 * Can be called from within script tags to execute on page
 * load.
 */
function fadeShiftSocials() {
    const socials = document.querySelector(".socials")
    Animator.queue(new FadeShift(socials, 1, 0.1, 'y', 24, 0, -1.6))
}
