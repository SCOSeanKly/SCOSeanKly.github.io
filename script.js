// script.js

// Function to toggle the dropdown menu
function toggleDropdown() {
    var dropdown = document.getElementById("myDropdown");
    var blurOverlay = document.getElementById("blurOverlay");
    dropdown.classList.toggle("show");
    blurOverlay.classList.toggle("show");
    document.body.style.overflow = dropdown.classList.contains("show") ? "hidden" : "auto";
}

// Function to scroll to a section
function scrollToSection(sectionId) {
    toggleDropdown(); // Close the menu
    const section = document.getElementById(sectionId);
    const topOffset = 60; // Adjust this value based on your top bar height
    const elementPosition = section.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - topOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
    });
}

// Wait for the DOM to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
    const banners = document.querySelectorAll('.banner-container');
    const appBodies = document.querySelectorAll('.app-body');
    
    // Create an Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                if (entry.target.classList.contains('banner-container')) {
                    // Banner animation code
                    setTimeout(() => {
                        entry.target.querySelector('.app-title').style.filter = 'blur(0)';
                        entry.target.querySelector('.app-title').style.opacity = '1';
                        entry.target.querySelector('.app-description').style.filter = 'blur(0)';
                        entry.target.querySelector('.app-description').style.opacity = '1';
                    }, 300);
                }
            } else {
                entry.target.classList.remove('in-view');
                if (entry.target.classList.contains('banner-container')) {
                    // Reset the blur effect when out of view
                    entry.target.querySelector('.app-title').style.filter = 'blur(5px)';
                    entry.target.querySelector('.app-title').style.opacity = '0';
                    entry.target.querySelector('.app-description').style.filter = 'blur(5px)';
                    entry.target.querySelector('.app-description').style.opacity = '0';
                }
            }
        });
    }, {
        threshold: 0.2 // Trigger when 20% of the element is visible
    });

    // Observe all banner containers and app bodies
    banners.forEach(banner => {
        observer.observe(banner);
    });
    appBodies.forEach(body => {
        observer.observe(body);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        var dropdown = document.getElementById("myDropdown");
        var blurOverlay = document.getElementById("blurOverlay");
        var menuIcon = document.querySelector('.menu-icon');
        if (!event.target.closest('.dropdown') && !event.target.matches('.menu-icon') && dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            blurOverlay.classList.remove("show");
            document.body.style.overflow = "auto";
        }
    });
});