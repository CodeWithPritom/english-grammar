let tensesData = {}; // Global variable to store loaded JSON data
let currentTense = 'presentTense'; // Keep track of the current loaded tense

// Function to fetch JSON data
async function fetchData() {
    try {
        const response = await fetch('data.json');
        tensesData = await response.json();
        console.log("Data loaded:", tensesData);
        // Load the initial section (Present Tense) when data is ready
        loadSection(currentTense);
    } catch (error) {
        console.error("Error loading JSON data:", error);
        document.getElementById('content-area').innerHTML = "<p>Error loading content. Please try again later.</p>";
    }
}

// Function to render content based on section data from JSON
function renderContent(sectionData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear previous content

    sectionData.forEach(item => {
        let element;
        switch (item.type) {
            case 'heading':
                element = document.createElement(`h${item.level}`);
                element.innerHTML = item.content;
                if (item.id) element.id = item.id;
                break;
            case 'paragraph':
                element = document.createElement('p');
                element.innerHTML = item.content;
                break;
            case 'list':
                element = document.createElement(item.style); // ul or ol
                item.items.forEach(listItem => {
                    const li = document.createElement('li');
                    li.innerHTML = listItem;
                    element.appendChild(li);
                });
                break;
            case 'table':
                element = document.createElement('table');
                const thead = document.createElement('thead');
                const trHead = document.createElement('tr');
                item.headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    trHead.appendChild(th);
                });
                thead.appendChild(trHead);
                element.appendChild(thead);

                const tbody = document.createElement('tbody');
                item.rows.forEach(row => {
                    const trBody = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        td.textContent = cell;
                        trBody.appendChild(td);
                    });
                    tbody.appendChild(trBody);
                });
                element.appendChild(tbody);
                break;
            case 'note':
                element = document.createElement('div');
                element.className = 'note';
                element.innerHTML = `<strong>Note:</strong> ${item.content}`;
                break;
            default:
                console.warn("Unknown content type:", item.type);
                return;
        }
        container.appendChild(element);
    });
}

// Function to render exercises from JSON
function renderExercises(exercisesData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear previous exercises
    container.innerHTML = '<h2>EXERCISES</h2>'; // Add a general exercise heading

    exercisesData.forEach(exercise => {
        const exerciseBlock = document.createElement('div');
        exerciseBlock.className = 'exercise-block';
        exerciseBlock.setAttribute('data-exercise-id', exercise.id); // Store ID for checking

        const h3 = document.createElement('h3');
        h3.textContent = exercise.title;
        exerciseBlock.appendChild(h3);

        const pDirection = document.createElement('p');
        pDirection.innerHTML = `<strong>Direction:</strong> ${exercise.direction}`;
        exerciseBlock.appendChild(pDirection);

        if (exercise.example) {
            const pExample = document.createElement('p');
            pExample.innerHTML = exercise.example;
            exerciseBlock.appendChild(pExample);
        }

        // Render based on exercise type
        if (exercise.type === 'fill_in_the_blanks') {
            const olQuestions = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                let questionHtml = q.text;

                // Determine number of blanks. If 'blanks' is specified, use it. Otherwise, infer from 'answer' array length.
                const numBlanks = q.blanks || (Array.isArray(q.answer) ? q.answer.length : 1);

                // Replace placeholders with input fields.
                // Use a loop to handle multiple blanks if q.blanks is > 1
                let tempHtml = questionHtml;
                for (let i = 0; i < numBlanks; i++) {
                    const inputId = `input_${exercise.id}_q${qIndex}_blank${i}`;
                    // Replace the placeholder '___' with an input element
                    // Make sure to only replace one placeholder at a time in case of multiple per question text.
                    tempHtml = tempHtml.replace('___', `<input type="text" class="exercise-input" id="${inputId}" data-question-index="${qIndex}" data-blank-index="${i}">`);
                }

                li.innerHTML = tempHtml;
                olQuestions.appendChild(li);
            });
            exerciseBlock.appendChild(olQuestions);

            const checkAnswersBtn = document.createElement('button');
            checkAnswersBtn.className = 'check-answers-btn';
            checkAnswersBtn.textContent = `Check Answers for ${exercise.title}`;
            checkAnswersBtn.onclick = () => checkExerciseAnswers(exercise.id);
            exerciseBlock.appendChild(checkAnswersBtn);

            const showCorrectAnswersBtn = document.createElement('button');
            showCorrectAnswersBtn.className = 'show-answers-btn';
            showCorrectAnswersBtn.textContent = `Show Correct Answers`;
            showCorrectAnswersBtn.onclick = () => showCorrectAnswers(exercise.id);
            exerciseBlock.appendChild(showCorrectAnswersBtn);

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'exercise-score';
            scoreDiv.id = `${exercise.id}_score`;
            scoreDiv.style.display = 'none'; // Hidden initially
            exerciseBlock.appendChild(scoreDiv);

            const allAnswersDiv = document.createElement('div');
            allAnswersDiv.className = 'answers';
            allAnswersDiv.id = `${exercise.id}_all_answers`; // For displaying all correct answers clearly
            allAnswersDiv.innerHTML = '<p><strong>Correct Answers:</strong></p>';
            const olAnswersDisplay = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                // Display the question text with placeholder, then the answer(s)
                let originalQuestionText = q.text.replace(/___/g, '<span class="blank-placeholder">___</span>');
                let displayAnswer = '';

                if (Array.isArray(q.answer)) {
                    if (q.blanks && q.blanks > 1) {
                        // For multi-blank questions, join answers for display
                        displayAnswer = q.answer.join(' / ');
                    } else {
                        // For single blank with multiple answer options
                        displayAnswer = q.answer.join(' / ');
                    }
                } else {
                    displayAnswer = q.answer; // Single answer string
                }
                li.innerHTML = `<strong>${qIndex + 1}.</strong> ${originalQuestionText} → ${displayAnswer}`;
                olAnswersDisplay.appendChild(li);
            });
            allAnswersDiv.appendChild(olAnswersDisplay);
            exerciseBlock.appendChild(allAnswersDiv);

        } else if (exercise.type === 'paragraph_correction') {
            exerciseBlock.innerHTML += '<h4>Original Paragraphs:</h4>';
            exercise.original_text.forEach(pText => {
                const p = document.createElement('p');
                p.className = 'original-paragraph';
                p.textContent = pText;
                exerciseBlock.appendChild(p);
            });

            const showCorrectedBtn = document.createElement('button');
            showCorrectedBtn.className = 'show-answers-btn';
            showCorrectedBtn.textContent = `Show Corrected Paragraphs`;
            showCorrectedBtn.onclick = () => toggleCorrectedParagraphs(exercise.id);
            exerciseBlock.appendChild(showCorrectedBtn);

            const correctedDiv = document.createElement('div');
            correctedDiv.className = 'answers'; // Use 'answers' class for toggling display
            correctedDiv.id = `${exercise.id}_all_answers`; // Same ID pattern for consistency

            correctedDiv.innerHTML += '<h4>Corrected Paragraphs:</h4>';
            exercise.corrected_text.forEach(pText => {
                const p = document.createElement('p');
                p.className = 'corrected-paragraph';
                p.innerHTML = pText; // Use innerHTML to allow <strong> tags for highlight
                correctedDiv.appendChild(p);
            });

            if (exercise.explanation) {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'explanation';
                explanationDiv.innerHTML = `<h4>Explanation:</h4>${exercise.explanation}`;
                correctedDiv.appendChild(explanationDiv);
            }
            exerciseBlock.appendChild(correctedDiv);
        } else if (exercise.type === 'jumbled_question') {
            // Special rendering for jumbled questions
            if (exercise.example) {
                const pExample = document.createElement('p');
                pExample.innerHTML = exercise.example;
                exerciseBlock.appendChild(pExample);
            }
            const olQuestions = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                // For jumbled questions, we might just show the question and have a button to reveal answers,
                // or provide an input field if we want user to type. For now, just displaying.
                li.innerHTML = q.text; // Display the raw jumbled text as per JSON example
                olQuestions.appendChild(li);
            });
            exerciseBlock.appendChild(olQuestions);

            const showCorrectAnswersBtn = document.createElement('button');
            showCorrectAnswersBtn.className = 'show-answers-btn';
            showCorrectAnswersBtn.textContent = `Show Correct Answers`;
            showCorrectAnswersBtn.onclick = () => showCorrectAnswersJumbled(exercise.id); // New function for jumbled
            exerciseBlock.appendChild(showCorrectAnswersBtn);

            const allAnswersDiv = document.createElement('div');
            allAnswersDiv.className = 'answers';
            allAnswersDiv.id = `${exercise.id}_all_answers`;
            allAnswersDiv.innerHTML = '<p><strong>Correct Answers:</strong></p>';
            const olAnswersDisplay = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${qIndex + 1}.</strong> ${q.text} → ${Array.isArray(q.answer) ? q.answer.join(' / ') : q.answer}`;
                olAnswersDisplay.appendChild(li);
            });
            allAnswersDiv.appendChild(olAnswersDisplay);
            exerciseBlock.appendChild(allAnswersDiv);

        }


        container.appendChild(exerciseBlock);
    });
}

// Function to check answers for a specific fill_in_the_blanks exercise
function checkExerciseAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const inputs = exerciseBlock.querySelectorAll('.exercise-input');
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.tenses[currentTense].exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'fill_in_the_blanks') {
        console.error(`Exercise data for ${exerciseId} not found or is not fill_in_the_blanks type.`);
        return;
    }

    let correctCount = 0;
    let totalBlanks = 0;

    inputs.forEach(inputElement => {
        totalBlanks++;
        const questionIndex = parseInt(inputElement.dataset.questionIndex);
        const blankIndex = parseInt(inputElement.dataset.blankIndex);
        const qData = exerciseData.questions[questionIndex];
        const userAnswer = normalizeString(inputElement.value);

        let isCorrectForThisBlank = false;

        // Determine expected answers for this specific blank
        let expectedAnswersForBlank = [];
        if (Array.isArray(qData.answer)) {
            if (qData.blanks && qData.blanks > 1) {
                // For multi-blank questions where q.answer is an array of answers for each blank
                if (qData.answer.length > blankIndex) {
                    // Handle cases where answer might be a single string for a multi-blank question,
                    // or an array of strings for distinct parts.
                    expectedAnswersForBlank = Array.isArray(qData.answer[blankIndex]) ? qData.answer[blankIndex] : [qData.answer[blankIndex]];
                }
            } else {
                // Single blank but multiple answer options
                expectedAnswersForBlank = qData.answer;
            }
        } else {
            // Single answer string for single blank
            expectedAnswersForBlank = [qData.answer];
        }

        isCorrectForThisBlank = expectedAnswersForBlank.some(expectedPart => normalizeString(expectedPart) === userAnswer);

        inputElement.classList.remove('correct', 'incorrect'); // Clear previous feedback
        if (isCorrectForThisBlank) {
            inputElement.classList.add('correct');
            correctCount++;
        } else {
            inputElement.classList.add('incorrect');
        }
    });

    const score = totalBlanks > 0 ? (correctCount / totalBlanks) * 100 : 0;
    scoreDiv.textContent = `You got ${correctCount} out of ${totalBlanks} correct! (${score.toFixed(0)}%)`;
    scoreDiv.style.display = 'block';
}

// Function to show correct answers and fill/highlight inputs for fill_in_the_blanks
function showCorrectAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const inputs = exerciseBlock.querySelectorAll('.exercise-input');
    const allAnswersDiv = document.getElementById(`${exerciseId}_all_answers`);
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.tenses[currentTense].exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'fill_in_the_blanks') {
        console.error(`Exercise data for ${exerciseId} not found or is not fill_in_the_blanks type.`);
        return;
    }

    if (allAnswersDiv.style.display === 'none' || allAnswersDiv.style.display === '') {
        // Show answers
        inputs.forEach(inputElement => {
            const questionIndex = parseInt(inputElement.dataset.questionIndex);
            const blankIndex = parseInt(inputElement.dataset.blankIndex);
            const qData = exerciseData.questions[questionIndex];

            let correctValue = '';
            if (Array.isArray(qData.answer)) {
                if (qData.blanks && qData.blanks > 1) {
                    // For multi-blank questions, get the specific answer for this blank
                    if (qData.answer.length > blankIndex) {
                        correctValue = Array.isArray(qData.answer[blankIndex]) ? qData.answer[blankIndex][0] : qData.answer[blankIndex];
                    }
                } else {
                    // Single blank with multiple answer options, pick the first one
                    correctValue = qData.answer[0];
                }
            } else {
                correctValue = qData.answer; // Single answer string
            }

            inputElement.value = correctValue;
            inputElement.classList.remove('incorrect'); // Remove incorrect if present
            inputElement.classList.add('correct'); // Highlight as correct
            inputElement.readOnly = true; // Make inputs read-only
        });
        allAnswersDiv.style.display = 'block';
        if (scoreDiv) scoreDiv.style.display = 'none'; // Hide score when showing all answers
    } else {
        // Hide answers
        inputs.forEach(input => {
            input.classList.remove('correct', 'incorrect');
            input.readOnly = false; // Make inputs editable again
            input.value = ''; // Optionally clear inputs when hiding answers
        });
        allAnswersDiv.style.display = 'none';
        if (scoreDiv) scoreDiv.style.display = 'none'; // Hide score again
    }
}

// Function to toggle corrected paragraphs visibility (for paragraph_correction type)
function toggleCorrectedParagraphs(exerciseId) {
    const correctedDiv = document.getElementById(`${exerciseId}_all_answers`);
    if (correctedDiv) {
        if (correctedDiv.style.display === 'none' || correctedDiv.style.display === '') {
            correctedDiv.style.display = 'block';
        } else {
            correctedDiv.style.display = 'none';
        }
    }
}

// Function to show correct answers for jumbled questions
function showCorrectAnswersJumbled(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const allAnswersDiv = document.getElementById(`${exerciseId}_all_answers`);

    if (allAnswersDiv.style.display === 'none' || allAnswersDiv.style.display === '') {
        allAnswersDiv.style.display = 'block';
    } else {
        allAnswersDiv.style.display = 'none';
    }
}

// Main function to load a specific tense section
function loadSection(tenseKey) {
    currentTense = tenseKey; // Update current tense tracker
    if (!tensesData || !tensesData.tenses || !tensesData.tenses[tenseKey]) {
        console.error(`Tense data for ${tenseKey} not found.`);
        document.getElementById('section-content').innerHTML = `<p>Content for ${tenseKey} is not yet available.</p>`;
        document.getElementById('exercise-content').innerHTML = '';
        return;
    }

    const sectionData = tensesData.tenses[tenseKey].sections;
    const exercisesData = tensesData.tenses[tenseKey].exercises;

    renderContent(sectionData, 'section-content');
    renderExercises(exercisesData, 'exercise-content');

    // Update active class in navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.classList.remove('active');
    });
    const currentNavLink = document.querySelector(`#main-nav a[onclick*="${tenseKey}"]`);
    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }

    window.scrollTo(0, 0); // Scroll to top of new content
}


// Theme switcher function
function setTheme(themeName) {
    document.body.className = themeName === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', themeName); // Save user's preference
}

// Apply saved theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    fetchData(); // Fetch data and load initial section
});

// Function to simulate loading the next section (Summary / Next Steps)
function loadNextSection() {
    alert("You've completed the Future Tense section! You can now navigate between tenses or consider this a comprehensive overview. (In a full application, this might lead to a summary or further resources.)");
    // You could potentially add a summary section here or link to a separate page.
    // For now, just an alert.
}