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
    { id: 'mdl_elite', name: 'Deadlift Elite', condition: (data) => data.mdl >= 300 },
    { id: 'hrp_elite', name: 'Push-up Pro', condition: (data) => data.hrp >= 50 },
    { id: 'sdc_elite', name: 'Speed Demon', condition: (data) => data.sdc <= 100 },
    { id: 'plk_elite', name: 'Iron Core', condition: (data) => data.plk >= 180 },
    { id: 'run_elite', name: 'Track Star', condition: (data) => data.run <= 900 },
    { id: 'total_elite', name: 'Elite Soldier', condition: (data) => data.total >= 450 },
    { id: 'power_lifter', name: 'Power Lifter', condition: (data) => data.mdl >= data.bodyWeight * 2 }
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
function updateScores(scores) {
    Object.entries(scores).forEach(([event, score]) => {
        const card = document.getElementById(`${event}Score`);
        if (card) {
            const progress = card.querySelector('.progress');
            const scoreText = card.querySelector('.score');

            progress.style.width = `${score}%`;
            progress.style.backgroundColor = score >= 60 ? 'var(--success)' : 'var(--danger)';
            scoreText.textContent = `${score}/100`;
        }
    });

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

    ACHIEVEMENTS.forEach(achievement => {
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${achievement.condition(data) ? '' : 'locked'}`;
        badge.textContent = achievement.name;
        achievementList.appendChild(badge);
    });
}

// Add popup suggestions functionality
function createSuggestions(input, options) {
    // Create suggestions only when the input is clicked
    input.addEventListener('click', () => {
        // Remove any existing suggestions containers first
        document.querySelectorAll('.suggestions-container').forEach(container => {
            container.remove();
        });
        
        // Create new suggestions container
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'suggestions-container';
        input.parentNode.appendChild(suggestionsContainer);

        options.forEach(option => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = option;

            // Extract the number of reps from the option text
            const repsMatch = option.match(/^(\d+)\s+reps/);
            if (repsMatch) {
                item.setAttribute('data-reps', repsMatch[1]);
            }

            item.addEventListener('click', () => {
                input.value = option.split(' ')[0];
                suggestionsContainer.remove();
                input.dispatchEvent(new Event('input'));
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
    const timeInputs = ['sdcTime', 'plkTime', 'runTime'];

    timeInputs.forEach(id => {
        const input = document.getElementById(id);
        const picker = input.nextElementSibling;
        const minutesColumn = picker.querySelector('.minutes .time-scroll');
        const secondsColumn = picker.querySelector('.seconds .time-scroll');
        
        // Ensure time picker is hidden by default
        picker.classList.remove('active');

        // Show picker on input focus
        input.addEventListener('focus', () => {
            // Hide all other pickers
            document.querySelectorAll('.time-picker').forEach(p => p.classList.remove('active'));
            picker.classList.add('active');

            // Set initial values if input has a value
            if (input.value) {
                const [minutes, seconds] = input.value.split(':');
                scrollToValue(minutesColumn, minutes);
                scrollToValue(secondsColumn, seconds);
            }
        });

        // Add click handlers for time options
        [minutesColumn, secondsColumn].forEach(column => {
            column.querySelectorAll('.time-option').forEach(option => {
                option.addEventListener('click', () => {
                    // Get the clicked value
                    const clickedValue = option.textContent;

                    // Update the input value immediately
                    const currentValue = input.value || '00:00';
                    const [currentMin, currentSec] = currentValue.split(':');

                    // Update either minutes or seconds based on which column was clicked
                    const newValue = column === minutesColumn
                        ? `${clickedValue}:${currentSec}`
                        : `${currentMin}:${clickedValue}`;

                    input.value = newValue;

                    // Highlight the selected option
                    column.querySelectorAll('.time-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');

                    // Only close the picker if seconds were selected
                    if (column === secondsColumn) {
                        picker.classList.remove('active');
                    }
                });
            });
        });

        // Handle time selection via scrolling
        [minutesColumn, secondsColumn].forEach(column => {
            column.addEventListener('scroll', () => {
                const selectedMinute = getSelectedValue(minutesColumn);
                const selectedSecond = getSelectedValue(secondsColumn);
                input.value = `${selectedMinute}:${selectedSecond}`;

                // Update selected state of options
                column.querySelectorAll('.time-option').forEach(option => {
                    const rect = option.getBoundingClientRect();
                    const columnRect = column.getBoundingClientRect();
                    option.classList.toggle('selected',
                        rect.top >= columnRect.top && rect.bottom <= columnRect.bottom
                    );
                });
            });
        });

        // Close picker when clicking outside
        document.addEventListener('click', (e) => {
            if (!picker.contains(e.target) && e.target !== input) {
                picker.classList.remove('active');
            }
        });
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

// Log workout
function logWorkout() {
    const standardType = document.getElementById('standardType').value;
    const gender = document.getElementById('gender').value;
    const bodyWeight = Number(document.getElementById('bodyWeight').value) || 0;

    const mdlWeight = Number(document.getElementById('deadlift').value) || 0;
    const hrpReps = Number(document.getElementById('hrpReps').value) || 0;
    const sdcTime = document.getElementById('sdcTime').value;
    const plkTime = document.getElementById('plkTime').value;
    const runTime = document.getElementById('runTime').value;

    const scores = {
        mdl: calculateScore('mdl', mdlWeight, standardType, gender),
        hrp: calculateScore('hrp', hrpReps, standardType, gender),
        sdc: calculateScore('sdc', sdcTime, standardType, gender),
        plk: calculateScore('plk', plkTime, standardType, gender),
        run: calculateScore('run', runTime, standardType, gender)
    };

    updateScores(scores);
    updateAchievements({
        mdl: mdlWeight,
        hrp: hrpReps,
        sdc: timeToSeconds(sdcTime),
        plk: timeToSeconds(plkTime),
        run: timeToSeconds(runTime),
        bodyWeight,
        total: Object.values(scores).reduce((sum, score) => sum + score, 0)
    });

    // Show success message
    const button = document.getElementById('logWorkout');
    const originalText = button.textContent;
    button.textContent = 'Workout Logged!';
    button.style.backgroundColor = 'var(--success)';

    setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
    }, 2000);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide all time pickers on page load
    document.querySelectorAll('.time-picker').forEach(picker => {
        picker.classList.remove('active');
    });
    // Initialize popup suggestions
    document.querySelectorAll('input[data-options]').forEach(input => {
        const options = JSON.parse(input.dataset.options || '[]');
        createSuggestions(input, options);
    });

    // Initialize time pickers
    initializeTimePickers();

    // Add event listener for log workout button
    document.getElementById('logWorkout').addEventListener('click', logWorkout);

    // Update scores when standard or gender changes
    ['standardType', 'gender'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const scores = {
                mdl: 0,
                hrp: 0,
                sdc: 0,
                plk: 0,
                run: 0
            };
            updateScores(scores);
        });
    });
});

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