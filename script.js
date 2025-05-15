// AFT Scoring Standards (17-21 age group)
const AFT_STANDARDS = {
    combat: {
        mdl: { min: 150, max: 340 }, // lbs
        hrp: { min: 15, max: 60 },   // reps
        sdc: { min: 148, max: 90 },  // seconds (2:28 to 1:30)
        plk: { min: 120, max: 240 }, // seconds (2:00 to 4:00)
        run: { min: 1110, max: 780 } // seconds (18:30 to 13:00)
    },
    general: {
        male: {
            mdl: { min: 140, max: 340 },
            hrp: { min: 10, max: 60 },
            sdc: { min: 180, max: 90 }, // 3:00 to 1:30
            plk: { min: 110, max: 220 }, // 1:50 to 3:40
            run: { min: 1272, max: 802 } // 21:12 to 13:22
        },
        female: {
            mdl: { min: 120, max: 210 },
            hrp: { min: 10, max: 40 },
            sdc: { min: 195, max: 110 }, // 3:15 to 1:50
            plk: { min: 90, max: 200 }, // 1:30 to 3:20
            run: { min: 1387, max: 929 } // 23:07 to 15:29
        }
    }
};

// Achievement Definitions
const ACHIEVEMENTS = [
    { id: 'mdl_elite', name: 'Deadlift Elite', icon: '💪', condition: (data) => data.mdl >= 300, description: 'Deadlift 300+ lbs' },
    { id: 'hrp_elite', name: 'Push-up Pro', icon: '👊', condition: (data) => data.hrp >= 50, description: '50+ push-ups' },
    { id: 'sdc_elite', name: 'Speed Demon', icon: '⚡', condition: (data) => data.sdc <= 100, description: 'SDC under 1:40' },
    { id: 'plk_elite', name: 'Iron Core', icon: '🏋️', condition: (data) => data.plk >= 180, description: 'Plank 3:00+' },
    { id: 'run_elite', name: 'Track Star', icon: '🏃', condition: (data) => data.run <= 900, description: '2-mile under 15:00' },
    { id: 'total_elite', name: 'Elite Soldier', icon: '⭐', condition: (data) => data.total >= 450, description: '450+ total points' },
    { id: 'power_lifter', name: 'Power Lifter', icon: '🏆', condition: (data) => data.mdl >= data.bodyWeight * 2, description: 'Deadlift 2x bodyweight' }
];

// Convert time string (mm:ss) to seconds
function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
}

// Convert seconds to time string (mm:ss)
function secondsToTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Calculate score for an event
function calculateScore(event, value, standardType, gender) {
    const standards = standardType === 'combat' ?
        AFT_STANDARDS.combat :
        AFT_STANDARDS.general[gender];

    const { min, max } = standards[event];

    if (!value) return 0;

    // For time-based events (sdc, plk, run), lower is better
    if (['sdc', 'plk', 'run'].includes(event)) {
        // Convert time to seconds for comparison
        let timeInSeconds;
        if (typeof value === 'string') {
            const [minutes, seconds] = value.split(':').map(Number);
            timeInSeconds = minutes * 60 + seconds;
        } else {
            timeInSeconds = value;
        }

        // Special handling for Sprint-Drag-Carry
        if (event === 'sdc') {
            // If time is worse than minimum, calculate progress towards minimum (0-60 points)
            if (timeInSeconds > min) {
                // Calculate percentage of minimum time achieved
                const percentageOfMin = min / timeInSeconds;
                // Convert to points (0-60)
                return Math.round(percentageOfMin * 60);
            }
            // If time is between min and max, calculate score (60-100 points)
            if (timeInSeconds >= max) {
                const range = min - max;
                const progress = (min - timeInSeconds) / range;
                return Math.round(60 + (progress * 40));
            }
            // If time is better than max, return 100
            return 100;
        }

        // Special handling for Plank
        if (event === 'plk') {
            // If time is less than minimum, calculate progress towards minimum (0-60 points)
            if (timeInSeconds < min) {
                // Calculate percentage of minimum time achieved
                const percentageOfMin = timeInSeconds / min;
                // Convert to points (0-60)
                return Math.round(percentageOfMin * 60);
            }
            // If time is between min and max, calculate score (60-100 points)
            if (timeInSeconds <= max) {
                const range = max - min;
                const progress = (timeInSeconds - min) / range;
                return Math.round(60 + (progress * 40));
            }
            // If time is better than max, return 100
            return 100;
        }

        // Special handling for 2-Mile Run
        if (event === 'run') {
            // If time is worse than minimum, calculate progress towards minimum (0-60 points)
            if (timeInSeconds > min) {
                // Calculate percentage of minimum time achieved
                const percentageOfMin = min / timeInSeconds;
                // Convert to points (0-60)
                return Math.round(percentageOfMin * 60);
            }
            // If time is between min and max, calculate score (60-100 points)
            if (timeInSeconds >= max) {
                const range = min - max;
                const progress = (min - timeInSeconds) / range;
                return Math.round(60 + (progress * 40));
            }
            // If time is better than max, return 100
            return 100;
        }
    }

    // For count/weight events (mdl, hrp), higher is better
    if (['mdl', 'hrp'].includes(event)) {
        // If value is less than minimum, calculate progress towards minimum (0-60 points)
        if (value < min) {
            // Calculate percentage of minimum achieved
            const percentageOfMin = value / min;
            // Convert to points (0-60)
            return Math.round(percentageOfMin * 60);
        }
        // If value is between min and max, calculate score (60-100 points)
        if (value <= max) {
            const range = max - min;
            const progress = (value - min) / range;
            return Math.round(60 + (progress * 40));
        }
        // If value is better than max, return 100
        return 100;
    }

    return 0;
}

// Update progress bars and scores
function updateScores(scores, showProgressBars = false) {
    Object.entries(scores).forEach(([event, score]) => {
        const card = document.getElementById(`${event}Score`);
        if (card) {
            const progressBar = card.querySelector('.progress-bar');
            const progress = card.querySelector('.progress');
            const scoreText = card.querySelector('.score');
            const inputDisplay = card.querySelector('.input-display');
            
            // Show/hide progress bars based on the showProgressBars parameter
            if (showProgressBars) {
                progressBar.style.display = 'block';
                inputDisplay.style.display = 'none';
            }

            progress.style.width = `${score}%`;
            progress.style.backgroundColor = score >= 60 ? 'var(--success)' : 'var(--danger)';
            scoreText.textContent = `${score}/100`;
        }
    });
    
    // Add a button to reset the view back to input fields
    if (showProgressBars) {
        // Check if reset button already exists
        if (!document.getElementById('resetView')) {
            const dashboard = document.querySelector('.dashboard');
            const resetButton = document.createElement('button');
            resetButton.id = 'resetView';
            resetButton.className = 'reset-button';
            resetButton.textContent = 'Edit Inputs';
            resetButton.addEventListener('click', () => {
                // Show input fields and hide progress bars
                document.querySelectorAll('.event-card').forEach(card => {
                    const progressBar = card.querySelector('.progress-bar');
                    const inputDisplay = card.querySelector('.input-display');
                    if (progressBar && inputDisplay) {
                        progressBar.style.display = 'none';
                        inputDisplay.style.display = 'block';
                    }
                });
                resetButton.remove();
            });
            dashboard.appendChild(resetButton);
        }
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    document.getElementById('totalScore').textContent = totalScore;

    const standardType = document.getElementById('standardType').value;
    const gender = document.getElementById('gender').value;
    const passThreshold = standardType === 'combat' ? 350 : 300;
    const passStatus = document.getElementById('passStatus');

    if (totalScore >= passThreshold) {
        passStatus.textContent = 'PASS';
        passStatus.className = 'pass-status pass';
    } else {
        passStatus.textContent = 'FAIL';
        passStatus.className = 'pass-status fail';
    }

    // Update event standards highlighting
    const eventMap = {
        '3-Rep Max Deadlift': 'mdl',
        'Hand-Release Push-ups': 'hrp',
        'Sprint-Drag-Carry': 'sdc',
        'Plank': 'plk',
        '2-Mile Run': 'run'
    };

    document.querySelectorAll('.info-card').forEach(card => {
        const eventName = card.querySelector('h3').textContent;
        const eventKey = eventMap[eventName];
        const score = scores[eventKey];

        const paragraphs = card.querySelectorAll('p');
        paragraphs.forEach(p => {
            // Reset color first
            p.style.color = '';

            // Only highlight if we have a valid score
            if (score !== undefined) {
                p.style.color = score >= 60 ? 'var(--success)' : 'var(--danger)';
            }
        });
    });
}

// Check and update achievements
function updateAchievements(data) {
    const achievementList = document.getElementById('achievementList');
    achievementList.innerHTML = '';

    // Check if this is the initial page load or a logged workout
    const isInitialLoad = !data || (
        data.mdl === 0 && 
        data.hrp === 0 && 
        data.sdc === 0 && 
        data.plk === 0 && 
        data.run === 0 && 
        data.total === 0
    );

    ACHIEVEMENTS.forEach(achievement => {
        // If it's initial load, force locked state
        // Otherwise, check the achievement condition
        const isUnlocked = isInitialLoad ? false : achievement.condition(data);
        
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${isUnlocked ? '' : 'locked'}`;
        
        // Create icon element
        const icon = document.createElement('div');
        icon.className = 'achievement-icon';
        icon.textContent = achievement.icon;
        badge.appendChild(icon);
        
        // Create content container
        const content = document.createElement('div');
        content.className = 'achievement-content';
        
        // Add name
        const name = document.createElement('div');
        name.className = 'achievement-name';
        name.textContent = achievement.name;
        content.appendChild(name);
        
        // Add description
        const description = document.createElement('div');
        description.className = 'achievement-description';
        description.textContent = achievement.description;
        content.appendChild(description);
        
        badge.appendChild(content);
        
        // Add status indicator
        const status = document.createElement('div');
        status.className = 'achievement-status';
        status.textContent = isUnlocked ? '\u2713' : '\u25cb';
        badge.appendChild(status);
        
        achievementList.appendChild(badge);
        
        // If an achievement is unlocked, add a pulse animation
        if (isUnlocked) {
            badge.classList.add('just-unlocked');
            setTimeout(() => {
                badge.classList.remove('just-unlocked');
            }, 3000); // Remove the animation after 3 seconds
        }
    });
    
    // Always show the achievements section
    const achievementSection = document.querySelector('.achievements');
    achievementSection.style.display = 'block';
}

// Add popup suggestions functionality
function createSuggestions(input, options) {
    if (!options || options.length === 0) return;
    
    // Create suggestions only when the input is clicked
    input.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        
        // Remove any existing suggestions containers first
        document.querySelectorAll('.suggestions-container').forEach(container => {
            container.remove();
        });
        
        // Create new suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestions-container';
        
        // Position the suggestions container
        const rect = input.getBoundingClientRect();
        
        // If this is a card input, add the card-suggestion class
        if (input.classList.contains('card-input')) {
            suggestionsContainer.classList.add('card-suggestion');
            // Position below the input (like the main form inputs)
            suggestionsContainer.style.top = `${rect.bottom + window.scrollY + 5}px`;
            suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
        } else {
            // For regular inputs, position below
            suggestionsContainer.style.top = `${rect.bottom + window.scrollY + 5}px`;
        }
        
        suggestionsContainer.style.left = `${rect.left + window.scrollX}px`;
        suggestionsContainer.style.width = `${rect.width}px`;
        document.body.appendChild(suggestionsContainer);
        
        // Prevent page scrolling when scrolling within the suggestions container
        suggestionsContainer.addEventListener('wheel', (e) => {
            e.stopPropagation();
            const atTop = suggestionsContainer.scrollTop === 0;
            const atBottom = suggestionsContainer.scrollHeight - suggestionsContainer.scrollTop === suggestionsContainer.clientHeight;
            
            // Only prevent default if scrolling would go beyond the container's bounds
            if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                e.preventDefault();
            }
        }, { passive: false });

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = option;
            
            // Extract the number of reps from the option text for styling
            const repsMatch = option.match(/^(\d+)\s+reps/);
            if (repsMatch) {
                item.setAttribute('data-reps', repsMatch[1]);
            }
            
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                
                // Extract numeric value from suggestion
                const match = option.match(/(\d+)/);
                if (match && match[0]) {
                    const numericValue = match[0];
                    input.value = numericValue;
                    
                    // Trigger change event to update any listeners
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                }
                
                // Remove the suggestions container
                suggestionsContainer.remove();
            });
            suggestionsContainer.appendChild(item);
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.remove();
            }
        });
    });
}

// Initialize time pickers
function initializeTimePickers() {
    // Hide all time pickers on page load
    document.querySelectorAll('.time-picker').forEach(picker => {
        picker.style.display = 'none';
    });
    
    const timeInputs = ['sdcTime', 'plkTime', 'runTime'];
    const cardTimeInputs = ['sdcCard', 'plkCard', 'runCard'];
    
    // Initialize all time inputs (both main form and dashboard cards)
    [...timeInputs, ...cardTimeInputs].forEach(id => {
        const input = document.getElementById(id);
        if (!input) return; // Skip if input doesn't exist
        
        const picker = input.nextElementSibling;
        if (!picker || !picker.classList.contains('time-picker')) return;
        
        const minutesColumn = picker.querySelector('.minutes .time-scroll');
        const secondsColumn = picker.querySelector('.seconds .time-scroll');
        
        // Ensure time picker is hidden by default
        picker.style.display = 'none';

        // Show picker on input focus/click
        input.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            
            // Hide all other pickers
            document.querySelectorAll('.time-picker').forEach(p => {
                p.style.display = 'none';
            });
            
            // Position the picker directly under this specific input
            const rect = input.getBoundingClientRect();
            const inputParent = input.parentElement;
            
            // Set position relative to the input's parent container
            picker.style.position = 'absolute';
            picker.style.top = `${input.offsetHeight + 5}px`;
            picker.style.left = '5%';
            picker.style.right = '5%';
            picker.style.width = '90%';
            picker.style.margin = '0 auto';
            
            // Show this picker
            picker.style.display = 'flex';

            // Set initial values if input has a value
            if (input.value) {
                const [minutes, seconds] = input.value.split(':');
                scrollToValue(minutesColumn, minutes);
                scrollToValue(secondsColumn, seconds);
            }
        });
        
        // Prevent clicks within the picker from closing it
        picker.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Make the time options in the picker work properly
        picker.querySelectorAll('.time-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Get the column this option belongs to
                const column = option.closest('.time-column');
                const isMinutes = column.classList.contains('minutes');
                
                // Get current values
                let [minutes, seconds] = (input.value || '00:00').split(':');
                
                // Update the appropriate value
                if (isMinutes) {
                    minutes = option.textContent;
                } else {
                    seconds = option.textContent;
                }
                
                // Update input value
                input.value = `${minutes}:${seconds}`;
                
                // Select this option visually
                column.querySelectorAll('.time-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                // Close the picker if seconds were selected
                if (!isMinutes) {
                    picker.style.display = 'none';
                }
            });
        });
    });

    // Close time pickers when clicking outside
    document.addEventListener('click', (e) => {
        // Only close pickers if the click is not on a time picker or a readonly input (which opens the picker)
        if (!e.target.closest('.time-picker') && !e.target.hasAttribute('readonly')) {
            document.querySelectorAll('.time-picker').forEach(picker => {
                picker.style.display = 'none';
            });
        }
    });
}

// Helper function to scroll to a specific value
function scrollToValue(column, value) {
    const options = column.querySelectorAll('.time-option');
    const targetOption = Array.from(options).find(option => option.textContent === value);
    if (targetOption) {
        targetOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Helper function to get the currently selected value
function getSelectedValue(column) {
    const options = column.querySelectorAll('.time-option');
    const selectedOption = Array.from(options).find(option => {
        const rect = option.getBoundingClientRect();
        const columnRect = column.getBoundingClientRect();
        return rect.top >= columnRect.top && rect.bottom <= columnRect.bottom;
    });
    return selectedOption ? selectedOption.textContent : '00';
}
function logWorkout() {
    // Get values directly from the dashboard card inputs
    const bodyWeight = parseInt(document.getElementById('bodyWeight').value) || 0;
    
    // Get values from dashboard card inputs
    const mdlCardInput = document.querySelector('#mdlScore .card-input');
    const hrpCardInput = document.querySelector('#hrpScore .card-input');
    const sdcCardInput = document.querySelector('#sdcScore .card-input');
    const plkCardInput = document.querySelector('#plkScore .card-input');
    const runCardInput = document.querySelector('#runScore .card-input');
    
    // Extract values from dashboard cards
    let deadlift = mdlCardInput && mdlCardInput.value ? parseInt(mdlCardInput.value) || 0 : 0;
    let hrpReps = hrpCardInput && hrpCardInput.value ? parseInt(hrpCardInput.value) || 0 : 0;
    let sdcTime = sdcCardInput && sdcCardInput.value ? sdcCardInput.value : '';
    let plkTime = plkCardInput && plkCardInput.value ? plkCardInput.value : '';
    let runTime = runCardInput && runCardInput.value ? runCardInput.value : '';
    
    // Validate inputs
    if (deadlift === 0 && hrpReps === 0 && !sdcTime && !plkTime && !runTime) {
        alert('Please enter at least one exercise value');
        return;
    }

    // Convert times to seconds
    const sdcSeconds = timeToSeconds(sdcTime);
    const plkSeconds = timeToSeconds(plkTime);
    const runSeconds = timeToSeconds(runTime);

    // Get standard type and gender using the helper functions
    const standardType = window.getStandardType();
    const gender = window.getGender();

    const scores = {
        mdl: calculateScore('mdl', deadlift, standardType, gender),
        hrp: calculateScore('hrp', hrpReps, standardType, gender),
        sdc: calculateScore('sdc', sdcSeconds, standardType, gender),
        plk: calculateScore('plk', plkSeconds, standardType, gender),
        run: calculateScore('run', runSeconds, standardType, gender)
    };

    // Update the dashboard cards with the input values
    updateInputDisplay('mdlScore', deadlift ? deadlift + ' lbs' : 'Not tested');
    updateInputDisplay('hrpScore', hrpReps ? hrpReps + ' reps' : 'Not tested');
    updateInputDisplay('sdcScore', sdcTime || 'Not tested');
    updateInputDisplay('plkScore', plkTime || 'Not tested');
    updateInputDisplay('runScore', runTime || 'Not tested');

    // Update scores and show progress bars
    updateScores(scores, true);
    
    // Update achievements
    updateAchievements({
        mdl: deadlift,
        hrp: hrpReps,
        sdc: sdcSeconds,
        plk: plkSeconds,
        run: runSeconds,
        bodyWeight,
        total: Object.values(scores).reduce((sum, score) => sum + score, 0)
    });
    
}

// Helper function to update the input display in dashboard cards
function updateInputDisplay(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        // Find the card input and update its value
        const cardInput = card.querySelector('.card-input');
        if (cardInput) {
            // For inputs that are not 'Not tested', update the value
            if (value !== 'Not tested') {
                cardInput.value = value.replace(' lbs', '').replace(' reps', '');
            } else {
                cardInput.value = '';
            }
        }
        
        // Show the progress bar
        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.display = value !== 'Not tested' ? 'flex' : 'none';
        }
    }
}

// Generate rep suggestions from 1 to 100
function generateRepSuggestions() {
    const suggestions = [];
    for (let i = 1; i <= 100; i++) {
        let label = `${i} reps`;
        
        // Add special labels for significant values
        if (i === 10) {
            label = `${i} reps (General MOS Minimum)`;
        } else if (i === 15) {
            label = `${i} reps (Combat MOS Minimum)`;
        } else if (i === 40) {
            label = `${i} reps (Female Maximum)`;
        } else if (i === 60) {
            label = `${i} reps (Male Maximum)`;
        }
        
        suggestions.push(label);
    }
    return suggestions;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Initialize time pickers
    initializeTimePickers();

    // Initialize suggestions for MDL input
    const mdlCardInput = document.getElementById('mdlCard');
    if (mdlCardInput) {
        createSuggestions(mdlCardInput, [
            "140 lbs (Min - General M)",
            "120 lbs (Min - General F)",
            "150 lbs (Min - Combat)",
            "340 lbs (Max - Combat)"
        ]);
    }
    
    // Initialize suggestions for HRP input with rep suggestions
    const hrpCardInput = document.getElementById('hrpCard');
    if (hrpCardInput) {
        const repSuggestions = generateRepSuggestions();
        createSuggestions(hrpCardInput, repSuggestions);
    }
    
    // Direct event listeners for toggle buttons
    setupToggleButtons();
    
    // Direct event listener for log workout button
    const logWorkoutBtn = document.getElementById('logWorkout');
    if (logWorkoutBtn) {
        logWorkoutBtn.onclick = function() {
            console.log('Log Workout button clicked');
            logWorkout();
        };
    }
});

// Direct implementation of toggle buttons
document.addEventListener('DOMContentLoaded', function() {
    // Initialize achievements section with empty data
    updateAchievements({
        mdl: 0,
        hrp: 0,
        sdc: 0,
        plk: 0,
        run: 0,
        bodyWeight: 0,
        total: 0
    });
    // Direct MOS toggle implementation
    const mosToggle = document.getElementById('mosToggle');
    if (mosToggle) {
        mosToggle.addEventListener('click', function() {
            // Toggle the right class
            this.classList.toggle('right');
            
            // Toggle active class on options
            const options = this.querySelectorAll('.toggle-option');
            options[0].classList.toggle('active');
            options[1].classList.toggle('active');
            
            // Update card headings based on selected standard
            updateCardHeadings();
        });
    }
    
    // Direct Gender toggle implementation
    const genderToggle = document.getElementById('genderToggle');
    if (genderToggle) {
        genderToggle.addEventListener('click', function() {
            // Toggle the right class
            this.classList.toggle('right');
            
            // Toggle active class on options
            const options = this.querySelectorAll('.toggle-option');
            options[0].classList.toggle('active');
            options[1].classList.toggle('active');
            
            // Update card headings based on selected standard
            updateCardHeadings();
        });
    }
    
    // Direct Log Workout button implementation
    const logWorkoutBtn = document.getElementById('logWorkout');
    if (logWorkoutBtn) {
        logWorkoutBtn.addEventListener('click', function() {
            // Get values from dashboard cards
            const mdlValue = document.querySelector('#mdlCard').value || 0;
            const hrpValue = document.querySelector('#hrpCard').value || 0;
            const sdcValue = document.querySelector('#sdcCard').value || '';
            const plkValue = document.querySelector('#plkCard').value || '';
            const runValue = document.querySelector('#runCard').value || '';
            
            // Validate inputs
            if (mdlValue === 0 && hrpValue === 0 && !sdcValue && !plkValue && !runValue) {
                alert('Please enter at least one exercise value');
                return;
            }
            
            // Call the existing logWorkout function
            logWorkout();
        });
    }
    
    // Initial update of card headings
    updateCardHeadings();
});

// Function to update card headings based on selected standard and gender
function updateCardHeadings() {
    // Get current standard type and gender
    const isCombat = document.querySelector('#mosToggle').classList.contains('right');
    const isFemale = document.querySelector('#genderToggle').classList.contains('right');
    
    const standardType = isCombat ? 'combat' : 'general';
    const gender = isFemale ? 'female' : 'male';
    
    // Get the standards based on selection
    const standards = standardType === 'combat' ? 
        AFT_STANDARDS.combat : 
        AFT_STANDARDS.general[gender];
    
    // Update card headings
    // Deadlift
    const mdlCard = document.querySelector('#mdlScore h3');
    if (mdlCard) {
        mdlCard.textContent = `3-Rep Max Deadlift (${standards.mdl.min}-${standards.mdl.max} lbs)`;
    }
    
    // Hand-Release Push-ups
    const hrpCard = document.querySelector('#hrpScore h3');
    if (hrpCard) {
        hrpCard.textContent = `Hand-Release Push-ups (${standards.hrp.min}-${standards.hrp.max} reps)`;
    }
    
    // Sprint-Drag-Carry
    const sdcCard = document.querySelector('#sdcScore h3');
    if (sdcCard) {
        sdcCard.textContent = `Sprint-Drag-Carry (${secondsToTime(standards.sdc.min)}-${secondsToTime(standards.sdc.max)})`;
    }
    
    // Plank
    const plkCard = document.querySelector('#plkScore h3');
    if (plkCard) {
        plkCard.textContent = `Plank (${secondsToTime(standards.plk.min)}-${secondsToTime(standards.plk.max)})`;
    }
    
    // 2-Mile Run
    const runCard = document.querySelector('#runScore h3');
    if (runCard) {
        runCard.textContent = `2-Mile Run (${secondsToTime(standards.run.min)}-${secondsToTime(standards.run.max)})`;
    }
    
    // Update helper functions
    window.getStandardType = function() {
        return standardType;
    };
    
    window.getGender = function() {
        return gender;
    };
}

// Initialize toggle switches
function initializeToggles() {
    // Set default values
    let standardType = 'general';
    let gender = 'male';
    
    // MOS toggle
    const mosToggle = document.getElementById('mosToggle');
    if (!mosToggle) return; // Safety check
    
    const mosOptions = mosToggle.querySelectorAll('.toggle-option');
    
    // Clear existing event listeners by cloning and replacing the element
    const newMosToggle = mosToggle.cloneNode(true);
    mosToggle.parentNode.replaceChild(newMosToggle, mosToggle);
    
    // Get the new reference and options
    const newMosOptions = newMosToggle.querySelectorAll('.toggle-option');
    
    // Ensure initial state is set correctly
    if (newMosToggle.classList.contains('right')) {
        standardType = 'combat';
        newMosOptions[1].classList.add('active');
        newMosOptions[0].classList.remove('active');
    } else {
        standardType = 'general';
        newMosOptions[0].classList.add('active');
        newMosOptions[1].classList.remove('active');
    }
    
    // Gender toggle
    const genderToggle = document.getElementById('genderToggle');
    if (!genderToggle) return; // Safety check
    
    // Clear existing event listeners by cloning and replacing the element
    const newGenderToggle = genderToggle.cloneNode(true);
    genderToggle.parentNode.replaceChild(newGenderToggle, genderToggle);
    
    // Get the new reference and options
    const newGenderOptions = newGenderToggle.querySelectorAll('.toggle-option');
    
    // Ensure initial state is set correctly
    if (newGenderToggle.classList.contains('right')) {
        gender = 'female';
        newGenderOptions[1].classList.add('active');
        newGenderOptions[0].classList.remove('active');
    } else {
        gender = 'male';
        newGenderOptions[0].classList.add('active');
        newGenderOptions[1].classList.remove('active');
    }
    
    // Update labels initially
    updateEventLabels(standardType, gender);
    
    // MOS toggle click handler
    newMosToggle.addEventListener('click', () => {
        newMosToggle.classList.toggle('right');
        newMosOptions.forEach(option => {
            option.classList.toggle('active');
        });
        
        // Update standardType based on toggle state
        standardType = newMosToggle.classList.contains('right') ? 'combat' : 'general';
        
        // Update labels when MOS type changes
        updateEventLabels(standardType, gender);
        
        // Update scores when MOS type changes
        const scores = {
            mdl: 0,
            hrp: 0,
            sdc: 0,
            plk: 0,
            run: 0
        };
        updateScores(scores);
    });
    
    // Gender toggle click handler
    newGenderToggle.addEventListener('click', () => {
        newGenderToggle.classList.toggle('right');
        newGenderOptions.forEach(option => {
            option.classList.toggle('active');
        });
        
        // Update gender based on toggle state
        gender = newGenderToggle.classList.contains('right') ? 'female' : 'male';
        
        // Update labels when gender changes
        updateEventLabels(standardType, gender);
        
        // Update scores when gender changes
        const scores = {
            mdl: 0,
            hrp: 0,
            sdc: 0,
            plk: 0,
            run: 0
        };
        updateScores(scores);
    });
    
    // Make helper functions available globally
    window.getStandardType = () => standardType;
    window.getGender = () => gender;
}

// Update event labels based on selected MOS type and gender
function updateEventLabels(standardType, gender) {
    console.log('Updating event labels for:', standardType, gender);
    
    const standards = standardType === 'combat' ? 
        AFT_STANDARDS.combat : 
        AFT_STANDARDS.general[gender];
    
    // Update dashboard card headings
    // Deadlift
    const mdlCard = document.querySelector('#mdlScore h3');
    if (mdlCard) {
        mdlCard.textContent = `3-Rep Max Deadlift (${standards.mdl.min}-${standards.mdl.max} lbs)`;
    }
    
    // Hand-Release Push-ups
    const hrpCard = document.querySelector('#hrpScore h3');
    if (hrpCard) {
        hrpCard.textContent = `Hand-Release Push-ups (${standards.hrp.min}-${standards.hrp.max} reps)`;
    }
    
    // Sprint-Drag-Carry
    const sdcCard = document.querySelector('#sdcScore h3');
    if (sdcCard) {
        sdcCard.textContent = `Sprint-Drag-Carry (${secondsToTime(standards.sdc.min)}-${secondsToTime(standards.sdc.max)})`;
    }
    
    // Plank
    const plkCard = document.querySelector('#plkScore h3');
    if (plkCard) {
        plkCard.textContent = `Plank (${secondsToTime(standards.plk.min)}-${secondsToTime(standards.plk.max)})`;
    }
    
    // 2-Mile Run
    const runCard = document.querySelector('#runScore h3');
    if (runCard) {
        runCard.textContent = `2-Mile Run (${secondsToTime(standards.run.min)}-${secondsToTime(standards.run.max)})`;
    }
    
    // Also update the card input placeholders to match
    const mdlInput = document.querySelector('#mdlCard');
    if (mdlInput) {
        mdlInput.placeholder = `Enter weight (lbs)`;
    }
    
    const hrpInput = document.querySelector('#hrpCard');
    if (hrpInput) {
        hrpInput.placeholder = `Enter reps`;
    }
}

// Add click-outside handler to close popups
document.addEventListener('click', (e) => {
    // Close suggestion popups
    document.querySelectorAll('.suggestions-container').forEach(container => {
        if (!container.contains(e.target) && !e.target.hasAttribute('data-options')) {
            container.remove();
        }
    });

    // Close time popups
    document.querySelectorAll('.time-picker').forEach(popup => {
        if (!popup.contains(e.target) && !e.target.id.match(/Time$/)) {
            popup.classList.remove('active');
        }
    });
}); 