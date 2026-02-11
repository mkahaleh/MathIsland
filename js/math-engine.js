/* ========================================
   MATH ISLAND - Math Problem Engine
   Generates math problems from basic to algebra
   ======================================== */

class MathEngine {
    constructor() {
        this.difficulty = 'normal'; // easy, normal, hard
    }

    setDifficulty(diff) {
        this.difficulty = diff;
    }

    // Generate a problem based on level and type
    generate(level, type) {
        const generators = {
            'addition': () => this._addition(level),
            'subtraction': () => this._subtraction(level),
            'multiplication': () => this._multiplication(level),
            'division': () => this._division(level),
            'mixed': () => this._mixed(level),
            'fractions': () => this._fractions(level),
            'algebra-basic': () => this._algebraBasic(level),
            'algebra-intermediate': () => this._algebraIntermediate(level),
            'algebra-advanced': () => this._algebraAdvanced(level),
            'patterns': () => this._patterns(level),
            'comparison': () => this._comparison(level),
            'word-problem': () => this._wordProblem(level)
        };

        const gen = generators[type] || generators['addition'];
        const problem = gen();
        problem.type = type;
        problem.options = this._generateOptions(problem.answer, type, level);
        return problem;
    }

    // --- Basic Operations ---

    _addition(level) {
        const range = this._getRange(level, 'add');
        const a = Utils.randomInt(range.min, range.max);
        const b = Utils.randomInt(range.min, range.max);
        return {
            question: `${a} + ${b} = ?`,
            questionHtml: `<span class="highlight">${a}</span> + <span class="highlight">${b}</span> = ?`,
            answer: a + b,
            hint: `Start with ${a} and count ${b} more`
        };
    }

    _subtraction(level) {
        const range = this._getRange(level, 'sub');
        let a = Utils.randomInt(range.min, range.max);
        let b = Utils.randomInt(range.min, Math.min(a, range.max));
        if (this.difficulty === 'easy') {
            // Ensure non-negative result for easy mode
            if (b > a) [a, b] = [b, a];
        }
        return {
            question: `${a} - ${b} = ?`,
            questionHtml: `<span class="highlight">${a}</span> - <span class="highlight">${b}</span> = ?`,
            answer: a - b,
            hint: `Start with ${a} and take away ${b}`
        };
    }

    _multiplication(level) {
        const range = this._getRange(level, 'mul');
        const a = Utils.randomInt(range.min, range.max);
        const b = Utils.randomInt(2, Math.min(12, range.max));
        return {
            question: `${a} × ${b} = ?`,
            questionHtml: `<span class="highlight">${a}</span> × <span class="highlight">${b}</span> = ?`,
            answer: a * b,
            hint: `Think of ${a} groups with ${b} in each`
        };
    }

    _division(level) {
        const range = this._getRange(level, 'div');
        const b = Utils.randomInt(2, Math.min(12, range.max));
        const answer = Utils.randomInt(range.min, range.max);
        const a = b * answer; // Ensure clean division
        return {
            question: `${a} ÷ ${b} = ?`,
            questionHtml: `<span class="highlight">${a}</span> ÷ <span class="highlight">${b}</span> = ?`,
            answer: answer,
            hint: `How many groups of ${b} can you make from ${a}?`
        };
    }

    _mixed(level) {
        const ops = ['addition', 'subtraction', 'multiplication', 'division'];
        const chosen = Utils.randomChoice(ops);
        return this.generate(level, chosen);
    }

    // --- Fractions ---

    _fractions(level) {
        const types = ['simplify', 'add', 'compare'];
        const type = Utils.randomChoice(types);

        if (type === 'simplify') {
            const factor = Utils.randomInt(2, 5);
            const num = Utils.randomInt(1, 5);
            const den = Utils.randomInt(num + 1, 8);
            return {
                question: `Simplify: ${num * factor}/${den * factor}`,
                questionHtml: `Simplify: <span class="highlight">${num * factor}/${den * factor}</span>`,
                answer: `${num}/${den}`,
                answerNum: num / den,
                hint: `Find the greatest common factor of ${num * factor} and ${den * factor}`,
                isFraction: true
            };
        } else if (type === 'add') {
            const den = Utils.randomChoice([2, 3, 4, 5, 6, 8]);
            const a = Utils.randomInt(1, den - 1);
            const b = Utils.randomInt(1, den - 1);
            const sum = a + b;
            return {
                question: `${a}/${den} + ${b}/${den} = ?`,
                questionHtml: `<span class="highlight">${a}/${den}</span> + <span class="highlight">${b}/${den}</span> = ?`,
                answer: `${sum}/${den}`,
                answerNum: sum / den,
                hint: `When denominators are the same, just add the tops!`,
                isFraction: true
            };
        } else {
            const a = Utils.randomInt(1, 9);
            const b = Utils.randomInt(1, 9);
            const den = Utils.randomInt(2, 10);
            const larger = Math.max(a, b);
            const smaller = Math.min(a, b);
            return {
                question: `Which is larger: ${smaller}/${den} or ${larger}/${den}?`,
                questionHtml: `Which is larger: <span class="highlight">${smaller}/${den}</span> or <span class="highlight">${larger}/${den}</span>?`,
                answer: `${larger}/${den}`,
                answerNum: larger,
                hint: `With same denominator, compare the numerators`,
                isFraction: true,
                isComparison: true
            };
        }
    }

    // --- Algebra ---

    _algebraBasic(level) {
        // x + a = b
        const answer = Utils.randomInt(1, 20);
        const a = Utils.randomInt(1, 15);
        const b = answer + a;
        const variable = Utils.randomChoice(['x', 'n', 'm']);
        return {
            question: `${variable} + ${a} = ${b}. What is ${variable}?`,
            questionHtml: `<span class="highlight">${variable}</span> + ${a} = ${b}<br>What is <span class="highlight">${variable}</span>?`,
            answer: answer,
            hint: `Subtract ${a} from both sides`
        };
    }

    _algebraIntermediate(level) {
        const types = ['twoStep', 'coefficient'];
        const type = Utils.randomChoice(types);

        if (type === 'twoStep') {
            // ax + b = c
            const answer = Utils.randomInt(1, 10);
            const a = Utils.randomInt(2, 6);
            const b = Utils.randomInt(1, 10);
            const c = a * answer + b;
            const variable = Utils.randomChoice(['x', 'n', 'y']);
            return {
                question: `${a}${variable} + ${b} = ${c}. What is ${variable}?`,
                questionHtml: `<span class="highlight">${a}${variable}</span> + ${b} = ${c}<br>What is <span class="highlight">${variable}</span>?`,
                answer: answer,
                hint: `First subtract ${b}, then divide by ${a}`
            };
        } else {
            // a * x = b
            const answer = Utils.randomInt(2, 12);
            const a = Utils.randomInt(2, 8);
            const b = a * answer;
            const variable = Utils.randomChoice(['x', 'n', 'y']);
            return {
                question: `${a} × ${variable} = ${b}. What is ${variable}?`,
                questionHtml: `${a} × <span class="highlight">${variable}</span> = ${b}<br>What is <span class="highlight">${variable}</span>?`,
                answer: answer,
                hint: `Divide ${b} by ${a}`
            };
        }
    }

    _algebraAdvanced(level) {
        const types = ['bothSides', 'distributive', 'twoVariable'];
        const type = Utils.randomChoice(types);

        if (type === 'bothSides') {
            // ax + b = cx + d
            const answer = Utils.randomInt(1, 8);
            const a = Utils.randomInt(3, 7);
            const c = Utils.randomInt(1, a - 1);
            const b = Utils.randomInt(1, 10);
            const d = (a - c) * answer + b;
            const variable = 'x';
            return {
                question: `${a}${variable} + ${b} = ${c}${variable} + ${d}. What is ${variable}?`,
                questionHtml: `<span class="highlight">${a}${variable}</span> + ${b} = <span class="highlight">${c}${variable}</span> + ${d}<br>What is <span class="highlight">${variable}</span>?`,
                answer: answer,
                hint: `Get all ${variable}'s on one side: (${a}-${c})${variable} = ${d}-${b}`
            };
        } else if (type === 'distributive') {
            // a(x + b) = c
            const answer = Utils.randomInt(1, 8);
            const a = Utils.randomInt(2, 5);
            const b = Utils.randomInt(1, 6);
            const c = a * (answer + b);
            const variable = 'x';
            return {
                question: `${a}(${variable} + ${b}) = ${c}. What is ${variable}?`,
                questionHtml: `<span class="highlight">${a}(${variable} + ${b})</span> = ${c}<br>What is <span class="highlight">${variable}</span>?`,
                answer: answer,
                hint: `First divide by ${a}, then subtract ${b}`
            };
        } else {
            // Simple system: x + y = a, x = b
            const x = Utils.randomInt(1, 10);
            const y = Utils.randomInt(1, 10);
            const sum = x + y;
            return {
                question: `x + y = ${sum} and x = ${x}. What is y?`,
                questionHtml: `<span class="highlight">x + y</span> = ${sum} and <span class="highlight">x = ${x}</span><br>What is <span class="highlight">y</span>?`,
                answer: y,
                hint: `Replace x with ${x}: ${x} + y = ${sum}`
            };
        }
    }

    // --- Patterns ---

    _patterns(level) {
        const types = ['sequence', 'multiply'];
        const type = Utils.randomChoice(types);

        if (type === 'sequence') {
            const start = Utils.randomInt(1, 10);
            const step = Utils.randomInt(2, 8);
            const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
            const answer = start + step * 4;
            return {
                question: `What comes next? ${seq.join(', ')}, ?`,
                questionHtml: `What comes next?<br><span class="highlight">${seq.join(', ')}</span>, ?`,
                answer: answer,
                hint: `Each number increases by ${step}`
            };
        } else {
            const base = Utils.randomInt(2, 5);
            const seq = Array.from({ length: 4 }, (_, i) => base * Math.pow(2, i));
            const answer = base * Math.pow(2, 4);
            return {
                question: `What comes next? ${seq.join(', ')}, ?`,
                questionHtml: `What comes next?<br><span class="highlight">${seq.join(', ')}</span>, ?`,
                answer: answer,
                hint: `Each number is doubled!`
            };
        }
    }

    // --- Comparisons ---

    _comparison(level) {
        const range = this._getRange(level, 'add');
        const a = Utils.randomInt(range.min, range.max);
        const b = Utils.randomInt(range.min, range.max);
        const op1 = Utils.randomChoice(['+', '-']);
        const c = Utils.randomInt(1, range.max);
        const left = op1 === '+' ? a + b : Math.abs(a - b);
        const answers = ['<', '>', '='];
        const answer = left > c ? '>' : left < c ? '<' : '=';
        return {
            question: `${a} ${op1} ${b} ? ${c}`,
            questionHtml: `<span class="highlight">${a} ${op1} ${b}</span> ▢ <span class="highlight">${c}</span><br>Choose: &lt; or &gt; or =`,
            answer: answer,
            isSymbol: true,
            hint: `First calculate ${a} ${op1} ${b} = ${left}, then compare with ${c}`
        };
    }

    // --- Word Problems ---

    _wordProblem(level) {
        const scenarios = [
            () => {
                const apples = Utils.randomInt(3, 20);
                const give = Utils.randomInt(1, apples - 1);
                return {
                    question: `You have ${apples} apples and give away ${give}. How many left?`,
                    questionHtml: `You have <span class="highlight">${apples} apples</span> and give away <span class="highlight">${give}</span>.<br>How many are left?`,
                    answer: apples - give,
                    hint: `This is a subtraction problem: ${apples} - ${give}`
                };
            },
            () => {
                const bags = Utils.randomInt(2, 6);
                const each = Utils.randomInt(3, 10);
                return {
                    question: `${bags} bags with ${each} shells each. How many shells total?`,
                    questionHtml: `<span class="highlight">${bags} bags</span> with <span class="highlight">${each} shells</span> each.<br>How many shells total?`,
                    answer: bags * each,
                    hint: `Multiply: ${bags} × ${each}`
                };
            },
            () => {
                const total = Utils.randomInt(10, 30);
                const groups = Utils.randomChoice([2, 3, 5]);
                const perGroup = Math.floor(total / groups) * groups === total ? total / groups : null;
                const adjustedTotal = perGroup ? total : groups * Utils.randomInt(2, 8);
                return {
                    question: `Share ${adjustedTotal} coins equally among ${groups} friends. How many each?`,
                    questionHtml: `Share <span class="highlight">${adjustedTotal} coins</span> equally among <span class="highlight">${groups} friends</span>.<br>How many does each get?`,
                    answer: adjustedTotal / groups,
                    hint: `Divide: ${adjustedTotal} ÷ ${groups}`
                };
            },
            () => {
                const start = Utils.randomInt(5, 15);
                const found = Utils.randomInt(3, 12);
                const gave = Utils.randomInt(1, start + found - 1);
                return {
                    question: `You had ${start} gems, found ${found} more, then gave away ${gave}. How many now?`,
                    questionHtml: `You had <span class="highlight">${start} gems</span>, found <span class="highlight">${found} more</span>, then gave away <span class="highlight">${gave}</span>.<br>How many now?`,
                    answer: start + found - gave,
                    hint: `Step by step: ${start} + ${found} = ${start + found}, then - ${gave}`
                };
            },
            () => {
                const perDay = Utils.randomInt(2, 8);
                const days = Utils.randomInt(3, 7);
                return {
                    question: `If you collect ${perDay} stars per day, how many in ${days} days?`,
                    questionHtml: `If you collect <span class="highlight">${perDay} stars</span> per day, how many in <span class="highlight">${days} days</span>?`,
                    answer: perDay * days,
                    hint: `Multiply: ${perDay} × ${days}`
                };
            }
        ];

        return Utils.randomChoice(scenarios)();
    }

    // Generate multiple choice options
    _generateOptions(answer, type, level) {
        if (typeof answer === 'string' && type === 'comparison') {
            return Utils.shuffle(['<', '>', '=']);
        }

        const numAnswer = typeof answer === 'string' ? parseFloat(answer) : answer;
        const options = new Set([typeof answer === 'string' ? answer : numAnswer]);
        const range = Math.max(5, Math.abs(numAnswer) * 0.5);

        let attempts = 0;
        while (options.size < 4 && attempts < 50) {
            let wrong;
            const r = Math.random();
            if (r < 0.3) {
                wrong = numAnswer + Utils.randomInt(1, Math.ceil(range));
            } else if (r < 0.6) {
                wrong = numAnswer - Utils.randomInt(1, Math.ceil(range));
            } else if (r < 0.8) {
                wrong = numAnswer + Utils.randomInt(-2, 2) * Utils.randomInt(1, 3);
            } else {
                wrong = numAnswer * Utils.randomInt(2, 3) - Utils.randomInt(0, 5);
            }

            wrong = Math.round(wrong);
            if (wrong !== numAnswer && !options.has(wrong)) {
                if (typeof answer === 'string' && answer.includes('/')) {
                    const parts = answer.split('/');
                    const wrongNum = parseInt(parts[0]) + Utils.randomInt(-2, 2);
                    const wrongStr = `${wrongNum}/${parts[1]}`;
                    if (wrongStr !== answer) options.add(wrongStr);
                } else {
                    options.add(wrong);
                }
            }
            attempts++;
        }

        // Fill remaining if needed
        while (options.size < 4) {
            options.add(numAnswer + options.size * 2);
        }

        return Utils.shuffle([...options]);
    }

    // Get number ranges based on level and difficulty
    _getRange(level, operation) {
        const diffMod = this.difficulty === 'easy' ? 0.6 :
                        this.difficulty === 'hard' ? 1.5 : 1;

        const ranges = {
            add: {
                min: 1,
                max: Math.min(Math.floor((5 + level * 5) * diffMod), 999)
            },
            sub: {
                min: 1,
                max: Math.min(Math.floor((5 + level * 5) * diffMod), 999)
            },
            mul: {
                min: 1,
                max: Math.min(Math.floor((2 + level * 1.5) * diffMod), 20)
            },
            div: {
                min: 1,
                max: Math.min(Math.floor((2 + level * 1.5) * diffMod), 15)
            }
        };

        return ranges[operation] || ranges.add;
    }
}
