import Question from '../models/Question.js';

const sampleQuestions = [
  {
    question: "What does HTML stand for?",
    options: [
      { text: "Hyper Text Markup Language", isCorrect: true },
      { text: "High Tech Modern Language", isCorrect: false },
      { text: "Home Tool Markup Language", isCorrect: false },
      { text: "Hyperlink and Text Markup Language", isCorrect: false }
    ],
    difficulty: "easy",
    category: "Web Development",
    explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages."
  },
  {
    question: "Which of the following is NOT a JavaScript data type?",
    options: [
      { text: "String", isCorrect: false },
      { text: "Boolean", isCorrect: false },
      { text: "Float", isCorrect: true },
      { text: "Number", isCorrect: false }
    ],
    difficulty: "medium",
    category: "JavaScript",
    explanation: "JavaScript doesn't have a specific 'Float' data type. Numbers in JavaScript are all floating-point numbers by default."
  },
  {
    question: "What is the correct way to create a function in JavaScript?",
    options: [
      { text: "function myFunction() {}", isCorrect: true },
      { text: "create myFunction() {}", isCorrect: false },
      { text: "function = myFunction() {}", isCorrect: false },
      { text: "def myFunction() {}", isCorrect: false }
    ],
    difficulty: "easy",
    category: "JavaScript",
    explanation: "The correct syntax for creating a function in JavaScript is 'function functionName() {}'."
  },
  {
    question: "Which CSS property is used to change the text color?",
    options: [
      { text: "text-color", isCorrect: false },
      { text: "font-color", isCorrect: false },
      { text: "color", isCorrect: true },
      { text: "text-style", isCorrect: false }
    ],
    difficulty: "easy",
    category: "CSS",
    explanation: "The 'color' property in CSS is used to change the text color of an element."
  },
  {
    question: "What does the 'typeof' operator return for an array in JavaScript?",
    options: [
      { text: "array", isCorrect: false },
      { text: "object", isCorrect: true },
      { text: "list", isCorrect: false },
      { text: "undefined", isCorrect: false }
    ],
    difficulty: "medium",
    category: "JavaScript",
    explanation: "In JavaScript, arrays are a type of object, so typeof returns 'object' for arrays."
  },
  {
    question: "Which HTTP method is used to retrieve data from a server?",
    options: [
      { text: "POST", isCorrect: false },
      { text: "GET", isCorrect: true },
      { text: "PUT", isCorrect: false },
      { text: "DELETE", isCorrect: false }
    ],
    difficulty: "easy",
    category: "HTTP",
    explanation: "The GET method is used to retrieve data from a server without modifying it."
  },
  {
    question: "What is the purpose of the 'useState' hook in React?",
    options: [
      { text: "To handle side effects", isCorrect: false },
      { text: "To manage component state", isCorrect: true },
      { text: "To create context", isCorrect: false },
      { text: "To handle routing", isCorrect: false }
    ],
    difficulty: "medium",
    category: "React",
    explanation: "The useState hook is used to add state management to functional components in React."
  },
  {
    question: "Which of the following is the correct way to handle errors in JavaScript?",
    options: [
      { text: "try-catch", isCorrect: true },
      { text: "if-else", isCorrect: false },
      { text: "switch-case", isCorrect: false },
      { text: "for-loop", isCorrect: false }
    ],
    difficulty: "easy",
    category: "JavaScript",
    explanation: "The try-catch statement is used to handle exceptions and errors in JavaScript."
  },
  {
    question: "What does CSS stand for?",
    options: [
      { text: "Computer Style Sheets", isCorrect: false },
      { text: "Cascading Style Sheets", isCorrect: true },
      { text: "Creative Style Sheets", isCorrect: false },
      { text: "Colorful Style Sheets", isCorrect: false }
    ],
    difficulty: "easy",
    category: "CSS",
    explanation: "CSS stands for Cascading Style Sheets, which is used to style and layout web pages."
  },
  {
    question: "Which React hook is used for performing side effects?",
    options: [
      { text: "useState", isCorrect: false },
      { text: "useContext", isCorrect: false },
      { text: "useEffect", isCorrect: true },
      { text: "useReducer", isCorrect: false }
    ],
    difficulty: "medium",
    category: "React",
    explanation: "The useEffect hook is used to perform side effects like API calls, subscriptions, or DOM manipulation."
  },
  {
    question: "What is the default port for HTTP?",
    options: [
      { text: "21", isCorrect: false },
      { text: "80", isCorrect: true },
      { text: "443", isCorrect: false },
      { text: "8080", isCorrect: false }
    ],
    difficulty: "easy",
    category: "Networking",
    explanation: "HTTP uses port 80 as its default port, while HTTPS uses port 443."
  },
  {
    question: "Which method is used to add an element to the end of an array in JavaScript?",
    options: [
      { text: "append()", isCorrect: false },
      { text: "add()", isCorrect: false },
      { text: "push()", isCorrect: true },
      { text: "insert()", isCorrect: false }
    ],
    difficulty: "easy",
    category: "JavaScript",
    explanation: "The push() method adds one or more elements to the end of an array and returns the new length."
  },
  {
    question: "What is the purpose of the 'key' prop in React lists?",
    options: [
      { text: "To style list items", isCorrect: false },
      { text: "To help React identify which items have changed", isCorrect: true },
      { text: "To set the order of items", isCorrect: false },
      { text: "To add event handlers", isCorrect: false }
    ],
    difficulty: "medium",
    category: "React",
    explanation: "The 'key' prop helps React identify which items have changed, are added, or are removed for efficient re-rendering."
  },
  {
    question: "Which CSS property is used to make text bold?",
    options: [
      { text: "text-weight", isCorrect: false },
      { text: "font-weight", isCorrect: true },
      { text: "font-style", isCorrect: false },
      { text: "text-style", isCorrect: false }
    ],
    difficulty: "easy",
    category: "CSS",
    explanation: "The font-weight property is used to set the thickness of text, with 'bold' being one of the values."
  },
  {
    question: "What does API stand for?",
    options: [
      { text: "Application Programming Interface", isCorrect: true },
      { text: "Advanced Programming Interface", isCorrect: false },
      { text: "Automated Programming Interface", isCorrect: false },
      { text: "Application Process Interface", isCorrect: false }
    ],
    difficulty: "easy",
    category: "General Programming",
    explanation: "API stands for Application Programming Interface, which defines how different software components communicate."
  }
];

export const QUESTIONS = [
  // JavaScript (6)
  {
    id: "js1",
    question: "What is the result of: typeof NaN ?",
    options: [{ text: "number" }, { text: "NaN" }, { text: "undefined" }, { text: "object" }],
    correctAnswer: 0,
    category: "JavaScript",
    difficulty: "medium"
  },
  {
    id: "js2",
    question: "Which array method returns a new array and does NOT mutate the original?",
    options: [{ text: "splice" }, { text: "push" }, { text: "slice" }, { text: "reverse" }],
    correctAnswer: 2,
    category: "JavaScript",
    difficulty: "easy"
  },
  {
    id: "js3",
    question: "What will be logged and why?\nfor (var i=0;i<3;i++){ setTimeout(()=>console.log(i),0); }",
    options: [{ text: "0 1 2" }, { text: "3 3 3" }, { text: "undefined" }, { text: "Error" }],
    correctAnswer: 1,
    category: "JavaScript",
    difficulty: "medium",
    explanation: "var is function-scoped; by the time timeouts run i==3"
  },
  {
    id: "js4",
    question: "Which statement about Promise.race is true?",
    options: [
      { text: "It resolves when all promises resolve" },
      { text: "It resolves/rejects with the first settled promise" },
      { text: "It cancels remaining promises" },
      { text: "It returns a synchronous value" }
    ],
    correctAnswer: 1,
    category: "JavaScript",
    difficulty: "medium"
  },
  {
    id: "js5",
    question: "Which of these creates a shallow copy of an object?",
    options: [
      { text: "Object.assign({}, obj)" },
      { text: "JSON.parse(JSON.stringify(obj))" },
      { text: "{ ...obj }" },
      { text: "Both A and C" }
    ],
    correctAnswer: 3,
    category: "JavaScript",
    difficulty: "easy"
  },
  {
    id: "js6",
    question: "What will be the value of this inside an arrow function?",
    options: [
      { text: "Dynamically bound based on call site" },
      { text: "Lexical — taken from surrounding scope" },
      { text: "Always undefined" },
      { text: "Always global object" }
    ],
    correctAnswer: 1,
    category: "JavaScript",
    difficulty: "medium"
  },

  // React (6)
  {
    id: "r1",
    question: "Where should data-fetching side effects live in a functional React component?",
    options: [
      { text: "Inside render return()" },
      { text: "Inside useEffect with appropriate dependencies" },
      { text: "Inside useState initializer" },
      { text: "Inside component props" }
    ],
    correctAnswer: 1,
    category: "React",
    difficulty: "easy"
  },
  {
    id: "r2",
    question: "What is the purpose of keys when rendering lists in React?",
    options: [
      { text: "To identify which items changed, are added, or removed" },
      { text: "To enable CSS styling" },
      { text: "To prevent event handlers" },
      { text: "To set component id attribute" }
    ],
    correctAnswer: 0,
    category: "React",
    difficulty: "easy"
  },
  {
    id: "r3",
    question: "Which hook should be used to memoize an expensive calculation between renders?",
    options: [{ text: "useEffect" }, { text: "useMemo" }, { text: "useState" }, { text: "useRef" }],
    correctAnswer: 1,
    category: "React",
    difficulty: "medium"
  },
  {
    id: "r4",
    question: "Given a parent passing an inline function prop to child each render, the child re-renders. How to fix?",
    options: [
      { text: "Wrap the function in useCallback in the parent" },
      { text: "Use setTimeout" },
      { text: "Convert to class component" },
      { text: "Use PropTypes" }
    ],
    correctAnswer: 0,
    category: "React",
    difficulty: "medium"
  },
  {
    id: "r5",
    question: "In React, what is the difference between controlled and uncontrolled inputs?",
    options: [
      { text: "Controlled use state to manage value; uncontrolled use refs/DOM" },
      { text: "Controlled are read-only" },
      { text: "Uncontrolled cannot handle events" },
      { text: "There is no difference" }
    ],
    correctAnswer: 0,
    category: "React",
    difficulty: "easy"
  },
  {
    id: "r6",
    question: "Which lifecycle (or hook) is best to clean up subscriptions when component unmounts?",
    options: [
      { text: "useEffect cleanup function" },
      { text: "componentWillMount" },
      { text: "render" },
      { text: "constructor" }
    ],
    correctAnswer: 0,
    category: "React",
    difficulty: "easy"
  },

  // Python (3) -> total 15
  {
    id: "py1",
    question: "What does list slicing a[1:5:2] mean?",
    options: [
      { text: "Start at 1, up to 5 exclusive, step 2" },
      { text: "From 1 to index 5 inclusive step 2" },
      { text: "Skip first 5 elements" },
      { text: "Reverse" }
    ],
    correctAnswer: 0,
    category: "Python",
    difficulty: "easy"
  },
  {
    id: "py2",
    question: "What is printed?\ndef f(a=[]):\n  a.append(1)\n  return a\nprint(f()); print(f())",
    options: [{ text: "[1] then [1,1]" }, { text: "[1] then [1]" }, { text: "Error" }],
    correctAnswer: 0,
    category: "Python",
    difficulty: "medium"
  },
  {
    id: "py3",
    question: "One-liner: create dict mapping numbers to their squares for 1..5",
    options: [{ text: "{i: i*i for i in range(1,6)}" }],
    correctAnswer: 0,
    category: "Python",
    difficulty: "easy"
  }
];

export const REAL_QUESTIONS = [
  { id: "js1", question: "What is typeof NaN?", options: [{ text: "number" }, { text: "NaN" }, { text: "undefined" }, { text: "object" }], correctAnswer: 0, category: "JavaScript" },
  { id: "js2", question: "Which array method returns a new array and does NOT mutate the original?", options: [{ text: "splice" }, { text: "push" }, { text: "slice" }, { text: "reverse" }], correctAnswer: 2, category: "JavaScript" },
  { id: "js3", question: "What will be logged and why?\nfor (var i=0;i<3;i++){ setTimeout(()=>console.log(i),0); }", options: [{ text: "0 1 2" }, { text: "3 3 3" }, { text: "undefined" }, { text: "Error" }], correctAnswer: 1, category: "JavaScript", explanation: "var is function-scoped; by the time timeouts run i==3" },
  { id: "js4", question: "Which statement about Promise.race is true?", options: [{ text: "It resolves when all promises resolve" }, { text: "It resolves/rejects with the first settled promise" }, { text: "It cancels remaining promises" }, { text: "It returns a synchronous value" }], correctAnswer: 1, category: "JavaScript" },
  { id: "js5", question: "Which of these creates a shallow copy of an object?", options: [{ text: "Object.assign({}, obj)" }, { text: "JSON.parse(JSON.stringify(obj))" }, { text: "{ ...obj }" }, { text: "Both A and C" }], correctAnswer: 3, category: "JavaScript" },
  { id: "js6", question: "What will be the value of this inside an arrow function?", options: [{ text: "Dynamically bound based on call site" }, { text: "Lexical — taken from surrounding scope" }, { text: "Always undefined" }, { text: "Always global object" }], correctAnswer: 1, category: "JavaScript" },
  { id: "r1", question: "Where should data-fetching side effects live in a functional React component?", options: [{ text: "Inside render return()" }, { text: "Inside useEffect with appropriate dependencies" }, { text: "Inside useState initializer" }, { text: "Inside component props" }], correctAnswer: 1, category: "React" },
  { id: "r2", question: "What is the purpose of keys when rendering lists in React?", options: [{ text: "To identify which items changed, are added, or removed" }, { text: "To enable CSS styling" }, { text: "To prevent event handlers" }, { text: "To set component id attribute" }], correctAnswer: 0, category: "React" },
  { id: "r3", question: "Which hook should be used to memoize an expensive calculation between renders?", options: [{ text: "useEffect" }, { text: "useMemo" }, { text: "useState" }, { text: "useRef" }], correctAnswer: 1, category: "React" },
  { id: "r4", question: "Given a parent passing an inline function prop to child each render, the child re-renders. How to fix?", options: [{ text: "Wrap the function in useCallback in the parent" }, { text: "Use setTimeout" }, { text: "Convert to class component" }, { text: "Use PropTypes" }], correctAnswer: 0, category: "React" },
  { id: "r5", question: "In React, what is the difference between controlled and uncontrolled inputs?", options: [{ text: "Controlled use state to manage value; uncontrolled use refs/DOM" }, { text: "Controlled are read-only" }, { text: "Uncontrolled cannot handle events" }, { text: "There is no difference" }], correctAnswer: 0, category: "React" },
  { id: "r6", question: "Which lifecycle (or hook) is best to clean up subscriptions when component unmounts?", options: [{ text: "useEffect cleanup function" }, { text: "componentWillMount" }, { text: "render" }, { text: "constructor" }], correctAnswer: 0, category: "React" },
  { id: "py1", question: "What does list slicing a[1:5:2] mean?", options: [{ text: "Start at 1, up to 5 exclusive, step 2" }, { text: "From 1 to 5 inclusive step 2" }, { text: "Skip first 5 elements" }, { text: "Reverse" }], correctAnswer: 0, category: "Python" },
  { id: "py2", question: "What is printed?\ndef f(a=[]):\n  a.append(1)\n  return a\nprint(f()); print(f())", options: [{ text: "[1] then [1,1]" }, { text: "[1] then [1]" }, { text: "Error" }], correctAnswer: 0, category: "Python" },
  { id: "py3", question: "One-liner: create dict mapping numbers to their squares for 1..5", options: [{ text: "{i: i*i for i in range(1,6)}" }], correctAnswer: 0, category: "Python" }
];
export default REAL_QUESTIONS;

export function getSeedQuestions(count = 15, categories = []) {
  const POOL = [
    { id: "q1", question: "What is typeof NaN in JavaScript?", options: [{ text: "number" }, { text: "NaN" }, { text: "undefined" }, { text: "object" }], correctAnswer: 0, category: "JavaScript" },
    { id: "q2", question: "Which array method returns a new array and does NOT mutate the original?", options: [{ text: "splice" }, { text: "push" }, { text: "slice" }, { text: "reverse" }], correctAnswer: 2, category: "JavaScript" },
    { id: "q3", question: "What will be logged by: for (var i=0;i<3;i++){ setTimeout(()=>console.log(i),0); }", options: [{ text: "0 1 2" }, { text: "3 3 3" }, { text: "undefined" }, { text: "Error" }], correctAnswer: 1, category: "JavaScript" },
    { id: "q4", question: "Which statement about Promise.race is true?", options: [{ text: "It resolves when all promises resolve" }, { text: "It settles with the first settled promise" }, { text: "It cancels remaining promises" }, { text: "It returns a synchronous value" }], correctAnswer: 1, category: "JavaScript" },
    { id: "q5", question: "Which creates a shallow copy of an object?", options: [{ text: "Object.assign({}, obj)" }, { text: "JSON.parse(JSON.stringify(obj))" }, { text: "{ ...obj }" }, { text: "Both A and C" }], correctAnswer: 3, category: "JavaScript" },
    { id: "q6", question: "Value of this inside an arrow function is:", options: [{ text: "Dynamically bound" }, { text: "Lexical (from surrounding scope)" }, { text: "Always undefined" }, { text: "Global object" }], correctAnswer: 1, category: "JavaScript" },
    { id: "q7", question: "Where should data-fetching side effects live in a functional React component?", options: [{ text: "Inside render return()" }, { text: "Inside useEffect with dependencies" }, { text: "Inside useState initializer" }, { text: "Inside props" }], correctAnswer: 1, category: "React" },
    { id: "q8", question: "Purpose of keys when rendering lists in React:", options: [{ text: "Identify items changed/added/removed" }, { text: "Enable CSS styling" }, { text: "Prevent event handlers" }, { text: "Set component id attribute" }], correctAnswer: 0, category: "React" },
    { id: "q9", question: "Which hook memoizes an expensive calculation between renders?", options: [{ text: "useEffect" }, { text: "useMemo" }, { text: "useState" }, { text: "useRef" }], correctAnswer: 1, category: "React" },
    { id: "q10", question: "How to avoid child re-renders when passing inline function props?", options: [{ text: "Wrap function in useCallback" }, { text: "Use setTimeout" }, { text: "Convert to class component" }, { text: "Use PropTypes" }], correctAnswer: 0, category: "React" },
    { id: "q11", question: "Controlled vs uncontrolled inputs in React:", options: [{ text: "Controlled use state; uncontrolled use refs/DOM" }, { text: "Controlled are read-only" }, { text: "Uncontrolled cannot handle events" }, { text: "No difference" }], correctAnswer: 0, category: "React" },
    { id: "q12", question: "Best place to clean up subscriptions on unmount:", options: [{ text: "useEffect cleanup" }, { text: "componentWillMount" }, { text: "render" }, { text: "constructor" }], correctAnswer: 0, category: "React" },
    { id: "q13", question: "Python slice a[1:5:2] means:", options: [{ text: "Start at 1, up to 5 exclusive, step 2" }, { text: "From 1 to 5 inclusive step 2" }, { text: "Skip first 5 elements" }, { text: "Reverse" }], correctAnswer: 0, category: "Python" },
    { id: "q14", question: "What prints for: def f(a=[]): a.append(1); return a; print(f()); print(f())", options: [{ text: "[1] then [1,1]" }, { text: "[1] then [1]" }, { text: "Error" }, { text: "[1,1] then [1,1,1]" }], correctAnswer: 0, category: "Python" },
    { id: "q15", question: "Create dict mapping numbers to squares 1..5 (Python):", options: [{ text: "{i: i*i for i in range(1,6)}" }, { text: "{i*i for i in range(1,6)}" }, { text: "dict(1..5)" }, { text: "map(lambda x: x*x, range(1,6))" }], correctAnswer: 0, category: "Python" }
  ];

  // filter by categories when provided
  let pool = POOL;
  if (Array.isArray(categories) && categories.length > 0) {
    pool = pool.filter(q => q.category && categories.includes(q.category));
  }

  // shuffle and slice
  const shuffled = pool.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.max(0, Math.min(count, shuffled.length)));
}

// optional no-op seed function for future DB seeding (kept for compatibility)
export async function seedQuestions() {
  // If you later add a DB, insert seed questions here.
  return getSeedQuestions(0);
}