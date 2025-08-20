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

export const seedQuestions = async () => {
  try {
    const existingCount = await Question.countDocuments();
    
    if (existingCount === 0) {
      await Question.insertMany(sampleQuestions);
      console.log('Sample questions seeded successfully');
    } else {
      console.log('Questions already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding questions:', error);
  }
};