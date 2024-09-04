gsap.registerPlugin(ScrollTrigger);

gsap.from(".hero-welcome", {opacity: 0, y: 50, duration: 1, delay: 0.3});
gsap.from(".hero-content h2", {opacity: 0, y: 50, duration: 1, delay: 0.5});
gsap.from(".hero-content p", {opacity: 0, y: 50, duration: 1, delay: 0.7});
gsap.from(".cta-button", {opacity: 0, y: 50, duration: 1, delay: 0.9});

// Hamburger menu functionality
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

function loadFeatures() {
    fetch('cjjson/features.json')
        .then(response => response.json())
        .then(data => {
            const featureGrid = document.getElementById('feature-grid');
            data.features.forEach(feature => {
                const featureCard = document.createElement('div');
                featureCard.className = 'feature-card';
                featureCard.innerHTML = `
                    <div class="feature-card-inner">
                        <div class="feature-card-front">
                            <div class="feature-icon">${feature.icon}</div>
                            <h3 class="feature-title">${feature.title}</h3>
                            <p class="feature-description">${feature.description}</p>
                        </div>
                        <div class="feature-card-back">
                            <p>${feature.details}</p>
                        </div>
                    </div>
                `;
                featureGrid.appendChild(featureCard);
            });

            // Add click event listeners for feature cards
            document.querySelectorAll('.feature-card').forEach(card => {
                card.addEventListener('click', () => {
                    card.classList.toggle('flipped');
                });
            });

            // Add animation for feature cards
            gsap.utils.toArray(".feature-card").forEach((card, i) => {
                gsap.from(card, {
                    scrollTrigger: {
                        trigger: card,
                        start: "top bottom-=100",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 0,
                    y: 50,
                    duration: 0.5,
                    delay: i * 0.1
                });
            });
        })
        .catch(error => console.error('Error fetching features data:', error));
}

function loadCoaches() {
    fetch('cjjson/coaches.json')
        .then(response => response.json())
        .then(data => {
            const coachesGrid = document.getElementById('coaches-grid');
            data.coaches.forEach(coach => {
                const coachCard = document.createElement('div');
                coachCard.className = 'team-member';
                coachCard.innerHTML = `
                    <div class="team-member-inner">
                        <div class="team-member-front">
                            <img src="${coach.image}" alt="${coach.name}">
                            <div class="team-member-info">
                                <h3 class="team-member-name">${coach.name}</h3>
                                <p class="team-member-position">${coach.position}</p>
                            </div>
                        </div>
                        <div class="team-member-back">
                            <h3>${coach.name}</h3>
                            <p>${coach.description}</p>
                        </div>
                    </div>
                `;
                coachesGrid.appendChild(coachCard);
            });

            // Add click event listeners for team members
            document.querySelectorAll('.team-member').forEach(member => {
                member.addEventListener('click', () => {
                    member.classList.toggle('flipped');
                });
            });

            // Add animation for coach cards
            gsap.utils.toArray(".team-member").forEach((member, i) => {
                gsap.from(member, {
                    scrollTrigger: {
                        trigger: member,
                        start: "top bottom-=100",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 0,
                    y: 50,
                    duration: 0.5,
                    delay: i * 0.1
                });
            });
        })
        .catch(error => console.error('Error fetching coaches data:', error));
}

function loadPlayers() {
    fetch('cjjson/players.json')
        .then(response => response.json())
        .then(data => {
            const playersGrid = document.getElementById('players-grid');
            const modal = document.getElementById('playerModal');
            const modalImage = document.getElementById('modalImage');
            const modalName = document.getElementById('modalName');
            const modalPosition = document.getElementById('modalPosition');
            const modalDescription = document.getElementById('modalDescription');
            const modalSponsor = document.getElementById('modalSponsor');
            const closeBtn = document.getElementsByClassName('close')[0];

            data.players.forEach(player => {
                const playerCard = document.createElement('div');
                playerCard.className = 'player-card';
                playerCard.innerHTML = `
                    <img src="${player.image}" alt="Player ${player.name}">
                    <p class="player-name">${player.name}</p>
                `;
                playersGrid.appendChild(playerCard);

                playerCard.addEventListener('click', () => {
                    modalImage.src = player.image;
                    modalName.textContent = player.name;
                    modalPosition.textContent = player.position;
                    modalDescription.textContent = player.description;
                    modalSponsor.innerHTML = `Sponsored by: <span>${player.sponsor}</span>`;
                    modal.style.display = 'block';
                });
            });

            closeBtn.onclick = function() {
                modal.style.display = 'none';
            }

            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            }

            // Add animation for player cards
            gsap.utils.toArray(".player-card").forEach((player, i) => {
                gsap.from(player, {
                    scrollTrigger: {
                        trigger: player,
                        start: "top bottom-=100",
                        toggleActions: "play none none reverse"
                    },
                    opacity: 0,
                    y: 50,
                    duration: 0.5,
                    delay: i * 0.1
                });
            });
        })
        .catch(error => console.error('Error fetching player data:', error));
}

function loadSchedule() {
    fetch('cjjson/schedule.json')
        .then(response => response.json())
        .then(data => {
            const scheduleBody = document.getElementById('schedule-body');
            data.matches.forEach(match => {
                const dateTime = new Date(match.date);
                const formattedDate = dateTime.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
                const formattedTime = dateTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${match.opponent}</td>
                    <td>${match.venue}</td>
                    <td>${formattedTime}</td>
                `;
                scheduleBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching schedule:', error));
}

function loadResults() {
    fetch('cjjson/results.json')
        .then(response => response.json())
        .then(data => {
            const resultsBody = document.getElementById('results-body');
            data.results.forEach(result => {
                const dateTime = new Date(result.date);
                const formattedDate = dateTime.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${result.opponent}</td>
                    <td>${result.venue}</td>
                    <td>${result.result}</td>
                `;
                resultsBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching results:', error));
}

window.addEventListener('load', () => {
    loadFeatures();
    loadCoaches();
    loadPlayers();
    loadSchedule();
    loadResults();
});