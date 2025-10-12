document.addEventListener('DOMContentLoaded', () => {
    const sliderWrapper = document.querySelector('.slider-wrapper');
    const images = document.querySelectorAll('.slider-wrapper img');
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const paginationDotsContainer = document.querySelector('.pagination-dots');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.getElementById('navLinks');
    const icon = hamburger.querySelector('i');

    //==== Counter ==== 
    // Function to handle the counting animation
    function animateValue(obj, start, end, duration, suffix) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Calculate the current number
            const currentValue = Math.floor(progress * (end - start) + start);

            // Update the element's text content with the number and the suffix
            obj.textContent = currentValue.toLocaleString() + suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Function to start animations for all counter items
    function startCounters(entries, observer) {
        entries.forEach(entry => {
            // Check if the section is in view and hasn't been animated yet
            if (entry.isIntersecting && !entry.target.dataset.animated) {

                const counterNumbers = entry.target.querySelectorAll('.number');

                counterNumbers.forEach(numDiv => {
                    const targetValue = parseInt(numDiv.getAttribute('data-target'));
                    // Determine the suffix (e.g., 'k+', 'yrs+') from the original text
                    const originalText = numDiv.textContent;
                    const suffix = originalText.replace(targetValue, '').trim();

                    animateValue(numDiv, 0, targetValue, 4500, suffix); // 2.5 second animation
                });

                entry.target.dataset.animated = 'true'; // Mark as animated
                observer.unobserve(entry.target); // Stop observing
            }
        });
    }

    // Set up the Intersection Observer to trigger the animation on scroll
    const counterSection = document.querySelector('.boxes');
    if (counterSection) {
        const observer = new IntersectionObserver(startCounters, {
            root: null, // relative to the viewport
            threshold: 0.5 // trigger when 50% of the element is visible
        });

        observer.observe(counterSection);
    }

    // Onload Alert
    window.onload = () => {
        if (window.innerWidth <= 768) {
            const alertOverlay = document.getElementById('alertOverlay');
            alertOverlay.style.display = 'flex';

            // document.getElementById('closeAlertBtn').onclick = () => {
            //     alertBox.style.display = 'none';
            // }
        } else {
            const alertOverlay = document.getElementById('alertOverlay');
            alertBox.style.display = 'none';
        }
    };

    /* Hamburger */
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');

        // toggle icon class between bars and xmark
        if (icon.classList.contains('fa-bars')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
        } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
        }


        // accessibility
        const expanded = hamburger.getAttribute("aria-expanded") === "true";
        hamburger.setAttribute("aria-expanded", !expanded);
    });

    // Close nav when a links is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-xmark');
            hamburger.setAttribute("aria-expanded", false);
        });
    });



    /* popups */
    const popupQueue = [];
    let isShowingPopup = false;

    function queuePopup(message, type = "info") {
        popupQueue.push({ message, type });
        if (!isShowingPopup) {
            showNextPopup();
        }
    }

    function showNextPopup() {
        if (popupQueue.length === 0) {
            isShowingPopup = false;
            return;
        }

        isShowingPopup = true;
        const { message, type } = popupQueue.shift();

        const container = document.getElementById("popup-container");
        const popup = document.createElement("div");
        popup.className = `popup ${type}`;
        popup.textContent = message;

        container.appendChild(popup);

        // trigger animation
        setTimeout(() => popup.classList.add("show"), 50);

        // auto-remove after 4s and show next
        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => {
                popup.remove();
                showNextPopup();
            }, 800);
        }, 4000);
    }

    // === Fake random data ===
    const names = [
        "Michael", "Sarah", "James", "Emmanuel", "Chaddy", "George", "Vladimir", "Alex", "Yashika", "David", "Sophia", "Daniel", "Annie", "Annalisa", "Kessy", "Morph", "Ratesh Kumar", "Nuelihno",
        "Olivia", "Liam", "Mia", "Noah", "Ava", "Ethan", "Isabella", "Kia", "Mario", "Luke", "Jason", "Calvin", "Eunice", "Kaya", "Lindani", "Qairat", "Dickson",
        "Lucas", "Amelia", "Mason", "Charlotte", "Henry", "Grace", "Arrie", "Vivian", "Collins", "Kumar", "Mary Renteria", "Maria", "Mark", "Tyson", "Zuevich", "Shawn", "Anderson", "Usman", "Diario", "Johan Rincon", "Tyler", "Wilson", "Martin"
    ];

    function randomAmount(min = 20, max = 50000) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function randomTime() {
        const mins = Math.floor(Math.random() * 59) + 1; // 1–59 minutes
        const hours = Math.floor(Math.random() * 5) + 1; // 1–5 hours
        const days = Math.floor(Math.random() * 2) + 1;  // 1–2 days

        const rand = Math.random();
        if (rand < 0.6) return `${mins} mins ago`;
        if (rand < 0.9) return `${hours} hours ago`;
        return `${days} days ago`;
    }

    function randomMessage() {
        const name = names[Math.floor(Math.random() * names.length)];
        const amount = randomAmount();
        const time = randomTime();

        if (Math.random() < 0.5) {
            return {
                text: `${name} withdrew $${amount} ${time}`,
                type: "error"
            };
        } else {
            return {
                text: `${name} earned $${amount} ${time}`,
                type: "success"
            };
        }
    }

    // === Generate 100 popups ===
    for (let i = 0; i < 100; i++) {
        const { text, type } = randomMessage();
        queuePopup(text, type);
    }

    /* back to top */
    const backToTopBtn = document.getElementById('backToTop');

    // Show or hide button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // smooth scroll to top when button is clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Zoom In JS
    const zoomElements = document.querySelectorAll('.zoom-in');

    window.addEventListener('scroll', () => {
        zoomElements.forEach(zel => {
            const rect = zel.getBoundingClientRect();

            if (rect.top < window.innerHeight - 30 && rect.bottom > 0) {
                zel.classList.add('visible');
            } else {
                zel.classList.remove('visible');
            }
        });
    });
});