let currentSection = 'subjectVerbAgreement'; // Set the initial section to SVA

// Function to fetch JSON data
async function fetchData() {
    try {
        const response = await fetch('data.json');
        tensesData = await response.json(); // Store all data, but we'll only access the relevant section
        console.log("Data loaded:", tensesData);
        loadSection(currentSection); // Load the SVA section initially
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
        exerciseBlock.setAttribute('data-exercise-id', exercise.id);

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

                const numBlanks = q.blanks || (Array.isArray(q.answer) ? q.answer.length : 1);

                let tempHtml = questionHtml;
                for (let i = 0; i < numBlanks; i++) {
                    const inputId = `input_${exercise.id}_q${qIndex}_blank${i}`;
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
            scoreDiv.style.display = 'none';
            exerciseBlock.appendChild(scoreDiv);

            const allAnswersDiv = document.createElement('div');
            allAnswersDiv.className = 'answers';
            allAnswersDiv.id = `${exercise.id}_all_answers`;
            allAnswersDiv.innerHTML = '<p><strong>Correct Answers:</strong></p>';
            const olAnswersDisplay = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                let originalQuestionText = q.text.replace(/___/g, '<span class="blank-placeholder">___</span>');
                let displayAnswer = '';

                if (Array.isArray(q.answer)) {
                    if (q.blanks && q.blanks > 1) {
                        displayAnswer = q.answer.join(' / ');
                    } else {
                        displayAnswer = q.answer.join(' / ');
                    }
                } else {
                    displayAnswer = q.answer;
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
            correctedDiv.className = 'answers';
            correctedDiv.id = `${exercise.id}_all_answers`;

            correctedDiv.innerHTML += '<h4>Corrected Paragraphs:</h4>';
            exercise.corrected_text.forEach(pText => {
                const p = document.createElement('p');
                p.className = 'corrected-paragraph';
                p.innerHTML = pText;
                correctedDiv.appendChild(p);
            });

            if (exercise.explanation) {
                const explanationDiv = document.createElement('div');
                explanationDiv.className = 'explanation';
                explanationDiv.innerHTML = `<h4>Explanation:</h4>${exercise.explanation}`;
                correctedDiv.appendChild(explanationDiv);
            }
            exerciseBlock.appendChild(correctedDiv);
        } else if (exercise.type === 'multiple_choice_circle') {
             const olQuestions = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                const choices = q.answer.map((choice, choiceIndex) => {
                    const inputId = `radio_${exercise.id}_q${qIndex}_choice${choiceIndex}`;
                    return `
                        <label>
                            <input type="radio" name="exercise_${exercise.id}_q${qIndex}" id="${inputId}" value="${choice}" data-question-index="${qIndex}" data-answer="${choice}">
                            ${choice}
                        </label>`;
                }).join(' ');
                li.innerHTML = `${q.text.replace(/[-]/g, '')} ${choices}`;
                olQuestions.appendChild(li);
            });
            exerciseBlock.appendChild(olQuestions);

            const checkAnswersBtn = document.createElement('button');
            checkAnswersBtn.className = 'check-answers-btn';
            checkAnswersBtn.textContent = `Check Answers for ${exercise.title}`;
            checkAnswersBtn.onclick = () => checkMultipleChoiceAnswers(exercise.id);
            exerciseBlock.appendChild(checkAnswersBtn);

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'exercise-score';
            scoreDiv.id = `${exercise.id}_score`;
            scoreDiv.style.display = 'none';
            exerciseBlock.appendChild(scoreDiv);

            const allAnswersDiv = document.createElement('div');
            allAnswersDiv.className = 'answers';
            allAnswersDiv.id = `${exercise.id}_all_answers`;
            allAnswersDiv.innerHTML = '<p><strong>Correct Answers:</strong></p>';
            const olAnswersDisplay = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${qIndex + 1}.</strong> ${q.text.replace(/[-]/g, '')} → ${q.answer.join(' / ')}`;
                olAnswersDisplay.appendChild(li);
            });
            allAnswersDiv.appendChild(olAnswersDisplay);
            exerciseBlock.appendChild(allAnswersDiv);

        } else if (exercise.type === 'correct_incorrect') {
            const olQuestions = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                const inputId = `radio_${exercise.id}_q${qIndex}`;
                li.innerHTML = `${q.text}
                    <label><input type="radio" name="${inputId}" value="C" data-question-index="${qIndex}" data-answer="C"> C</label>
                    <label><input type="radio" name="${inputId}" value="X" data-question-index="${qIndex}" data-answer="X"> X</label>`;
                olQuestions.appendChild(li);
            });
            exerciseBlock.appendChild(olQuestions);

            const checkAnswersBtn = document.createElement('button');
            checkAnswersBtn.className = 'check-answers-btn';
            checkAnswersBtn.textContent = `Check Answers for ${exercise.title}`;
            checkAnswersBtn.onclick = () => checkCorrectIncorrectAnswers(exercise.id);
            exerciseBlock.appendChild(checkAnswersBtn);

            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'exercise-score';
            scoreDiv.id = `${exercise.id}_score`;
            scoreDiv.style.display = 'none';
            exerciseBlock.appendChild(scoreDiv);

            const allAnswersDiv = document.createElement('div');
            allAnswersDiv.className = 'answers';
            allAnswersDiv.id = `${exercise.id}_all_answers`;
            allAnswersDiv.innerHTML = '<p><strong>Correct Answers:</strong></p>';
            const olAnswersDisplay = document.createElement('ol');
            exercise.questions.forEach((q, qIndex) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${qIndex + 1}.</strong> ${q.text} → ${q.answer}`;
                olAnswersDisplay.appendChild(li);
            });
            allAnswersDiv.appendChild(olAnswersDisplay);
            exerciseBlock.appendChild(allAnswersDiv);
        }

        container.appendChild(exerciseBlock);
    });
}

// Function to normalize strings for comparison (case-insensitive, trim whitespace)
function normalizeString(str) {
    if (typeof str !== 'string') return '';
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Function to check answers for fill_in_the_blanks
function checkExerciseAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const inputs = exerciseBlock.querySelectorAll('.exercise-input');
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

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

        let expectedAnswersForBlank = [];
        if (Array.isArray(qData.answer)) {
            if (qData.blanks && qData.blanks > 1) {
                if (qData.answer.length > blankIndex) {
                    expectedAnswersForBlank = Array.isArray(qData.answer[blankIndex]) ? qData.answer[blankIndex] : [qData.answer[blankIndex]];
                }
            } else {
                expectedAnswersForBlank = qData.answer;
            }
        } else {
            expectedAnswersForBlank = [qData.answer];
        }

        isCorrectForThisBlank = expectedAnswersForBlank.some(expectedPart => normalizeString(expectedPart) === userAnswer);

        inputElement.classList.remove('correct', 'incorrect');
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

// Function to show correct answers for fill_in_the_blanks
function showCorrectAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const inputs = exerciseBlock.querySelectorAll('.exercise-input');
    const allAnswersDiv = document.getElementById(`${exerciseId}_all_answers`);
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'fill_in_the_blanks') {
        console.error(`Exercise data for ${exerciseId} not found or is not fill_in_the_blanks type.`);
        return;
    }

    if (allAnswersDiv.style.display === 'none' || allAnswersDiv.style.display === '') {
        inputs.forEach(inputElement => {
            const questionIndex = parseInt(inputElement.dataset.questionIndex);
            const blankIndex = parseInt(inputElement.dataset.blankIndex);
            const qData = exerciseData.questions[questionIndex];

            let correctValue = '';
            if (Array.isArray(qData.answer)) {
                if (qData.blanks && qData.blanks > 1) {
                    if (qData.answer.length > blankIndex) {
                        correctValue = Array.isArray(qData.answer[blankIndex]) ? qData.answer[blankIndex][0] : qData.answer[blankIndex];
                    }
                } else {
                    correctValue = qData.answer[0];
                }
            } else {
                correctValue = qData.answer;
            }

            inputElement.value = correctValue;
            inputElement.classList.remove('incorrect');
            inputElement.classList.add('correct');
            inputElement.readOnly = true;
        });
        allAnswersDiv.style.display = 'block';
        if (scoreDiv) scoreDiv.style.display = 'none';
    } else {
        inputs.forEach(input => {
            input.classList.remove('correct', 'incorrect');
            input.readOnly = false;
            input.value = '';
        });
        allAnswersDiv.style.display = 'none';
        if (scoreDiv) scoreDiv.style.display = 'none';
    }
}

// Function to toggle corrected paragraphs visibility
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

// Function to check answers for multiple choice (circle) exercises
function checkMultipleChoiceAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const radios = exerciseBlock.querySelectorAll('input[type="radio"]');
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'multiple_choice_circle') {
        console.error(`Exercise data for ${exerciseId} not found or is not multiple_choice_circle type.`);
        return;
    }

    let correctCount = 0;
    let totalQuestions = 0;

    const questions = {};
    radios.forEach(radio => {
        const questionName = radio.name;
        if (!questions[questionName]) {
            questions[questionName] = { radios: [], userAnswer: null, correctAnswer: null };
        }
        questions[questionName].radios.push(radio);
        const qIndex = parseInt(radio.dataset.questionIndex);
        questions[questionName].correctAnswer = exerciseData.questions[qIndex].answer[0];
    });

    totalQuestions = Object.keys(questions).length;

    Object.values(questions).forEach(qData => {
        const selectedRadio = qData.radios.find(radio => radio.checked);
        let isAnswerCorrect = false;

        if (selectedRadio) {
            const userAnswer = normalizeString(selectedRadio.value);
            const expectedAnswer = normalizeString(qData.correctAnswer);
            if (userAnswer === expectedAnswer) {
                isAnswerCorrect = true;
                correctCount++;
            }
        }

        qData.radios.forEach(radio => {
            radio.parentNode.style.color = '';
            if (radio.checked) {
                const userAnswer = normalizeString(radio.value);
                const expectedAnswer = normalizeString(qData.correctAnswer);
                if (userAnswer === expectedAnswer) {
                    radio.parentNode.style.color = 'var(--correct-color)';
                } else {
                    radio.parentNode.style.color = 'var(--incorrect-color)';
                }
            }
            const expectedAnswer = normalizeString(qData.correctAnswer);
            if (normalizeString(radio.value) === expectedAnswer) {
                radio.parentNode.style.fontWeight = 'bold';
            }
        });
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    scoreDiv.textContent = `You got ${correctCount} out of ${totalQuestions} correct! (${score.toFixed(0)}%)`;
    scoreDiv.style.display = 'block';
}

// Function to show correct answers for multiple choice (circle) exercises
function showCorrectAnswersMultipleChoice(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const radios = exerciseBlock.querySelectorAll('input[type="radio"]');
    const allAnswersDiv = document.getElementById(`${exerciseId}_all_answers`);
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'multiple_choice_circle') {
        console.error(`Exercise data for ${exerciseId} not found or is not multiple_choice_circle type.`);
        return;
    }

    if (allAnswersDiv.style.display === 'none' || allAnswersDiv.style.display === '') {
        allAnswersDiv.style.display = 'block';
        radios.forEach(radio => {
            radio.disabled = true;
            const qIndex = parseInt(radio.dataset.questionIndex);
            const correctAnswer = normalizeString(exerciseData.questions[qIndex].answer[0]);
            if (normalizeString(radio.value) === correctAnswer) {
                radio.parentNode.style.color = 'var(--correct-color)';
                radio.parentNode.style.fontWeight = 'bold';
            } else {
                radio.parentNode.style.color = '';
            }
        });
        if (scoreDiv) scoreDiv.style.display = 'none';
    } else {
        radios.forEach(radio => {
            radio.disabled = false;
            radio.checked = false;
            radio.parentNode.style.color = '';
            radio.parentNode.style.fontWeight = 'normal';
        });
        allAnswersDiv.style.display = 'none';
        if (scoreDiv) scoreDiv.style.display = 'none';
    }
}


// Function to check answers for correct/incorrect exercises
function checkCorrectIncorrectAnswers(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const radios = exerciseBlock.querySelectorAll('input[type="radio"]');
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'correct_incorrect') {
        console.error(`Exercise data for ${exerciseId} not found or is not correct_incorrect type.`);
        return;
    }

    let correctCount = 0;
    let totalQuestions = 0;

    const questions = {};
    radios.forEach(radio => {
        const questionName = radio.name;
        if (!questions[questionName]) {
            questions[questionName] = { radios: [], userAnswer: null, correctAnswer: null };
        }
        questions[questionName].radios.push(radio);
        const qIndex = parseInt(radio.dataset.questionIndex);
        questions[questionName].correctAnswer = exerciseData.questions[qIndex].answer;
    });

    totalQuestions = Object.keys(questions).length;

    Object.values(questions).forEach(qData => {
        const selectedRadio = qData.radios.find(radio => radio.checked);
        let isAnswerCorrect = false;

        if (selectedRadio) {
            const userAnswer = selectedRadio.value;
            if (userAnswer === qData.correctAnswer) {
                isAnswerCorrect = true;
                correctCount++;
            }
        }

        qData.radios.forEach(radio => {
            radio.parentNode.style.color = '';
            if (radio.checked) {
                if (radio.value === qData.correctAnswer) {
                    radio.parentNode.style.color = 'var(--correct-color)';
                } else {
                    radio.parentNode.style.color = 'var(--incorrect-color)';
                }
            }
            if (radio.value === qData.correctAnswer) {
                radio.parentNode.style.fontWeight = 'bold';
            }
        });
    });

    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    scoreDiv.textContent = `You got ${correctCount} out of ${totalQuestions} correct! (${score.toFixed(0)}%)`;
    scoreDiv.style.display = 'block';
}

// Function to show correct answers for correct/incorrect exercises
function showCorrectAnswersCorrectIncorrect(exerciseId) {
    const exerciseBlock = document.querySelector(`.exercise-block[data-exercise-id="${exerciseId}"]`);
    const radios = exerciseBlock.querySelectorAll('input[type="radio"]');
    const allAnswersDiv = document.getElementById(`${exerciseId}_all_answers`);
    const scoreDiv = document.getElementById(`${exerciseId}_score`);
    const exerciseData = tensesData.subjectVerbAgreement.exercises.find(ex => ex.id === exerciseId);

    if (!exerciseData || exerciseData.type !== 'correct_incorrect') {
        console.error(`Exercise data for ${exerciseId} not found or is not correct_incorrect type.`);
        return;
    }

    if (allAnswersDiv.style.display === 'none' || allAnswersDiv.style.display === '') {
        allAnswersDiv.style.display = 'block';
        radios.forEach(radio => {
            radio.disabled = true;
            const qIndex = parseInt(radio.dataset.questionIndex);
            const correctAnswer = exerciseData.questions[qIndex].answer;
            if (radio.value === correctAnswer) {
                radio.parentNode.style.color = 'var(--correct-color)';
                radio.parentNode.style.fontWeight = 'bold';
            } else {
                radio.parentNode.style.color = '';
            }
        });
        if (scoreDiv) scoreDiv.style.display = 'none';
    } else {
        radios.forEach(radio => {
            radio.disabled = false;
            radio.checked = false;
            radio.parentNode.style.color = '';
            radio.parentNode.style.fontWeight = 'normal';
        });
        allAnswersDiv.style.display = 'none';
        if (scoreDiv) scoreDiv.style.display = 'none';
    }
}

// Main function to load a specific section
function loadSection(sectionKey) {
    currentSection = sectionKey; // Update current section tracker
    if (!tensesData || !tensesData.subjectVerbAgreement || !tensesData.subjectVerbAgreement.sections) {
        console.error(`Section data for ${sectionKey} not found.`);
        document.getElementById('section-content').innerHTML = `<p>Content for ${sectionKey} is not yet available.</p>`;
        document.getElementById('exercise-content').innerHTML = '';
        return;
    }

    const sectionData = tensesData.subjectVerbAgreement.sections;
    const exercisesData = tensesData.subjectVerbAgreement.exercises;

    renderContent(sectionData, 'section-content');
    renderExercises(exercisesData, 'exercise-content');

    // Update active class in navigation
    document.querySelectorAll('#main-nav a').forEach(link => {
        link.classList.remove('active');
    });
    const currentNavLink = document.querySelector(`#main-nav a[href="#${sectionKey}-intro"]`);
    if (currentNavLink) {
        currentNavLink.classList.add('active');
    }

    window.scrollTo(0, 0); // Scroll to top of new content
}


// Theme switcher function
function setTheme(themeName) {
    document.body.className = themeName === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', themeName);
}

// Apply saved theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    fetchData(); // Fetch data and load the SVA section
});

// Function to simulate loading the next section (Summary / Next Steps)
function loadNextSection() {
    alert("You've completed the Subject-Verb Agreement section! You can navigate between topics using the menu above. Consider this a foundational grammar topic.");
}