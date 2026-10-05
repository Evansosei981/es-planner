import { PracticeQuestion } from '../types/practice';

export const DAILY_QUESTIONS_COUNT = 3;
export const DEFAULT_REMINDER_TIME = "20:00";

export const DEFAULT_QUESTION_BANK: PracticeQuestion[] = [
  // Linear Algebra & Calculus (Enhanced with LaTeX Math Terms)
  {
    id: "math-1",
    courseName: "Linear Algebra & Calculus",
    category: "Matrices",
    difficulty: "easy",
    question: "If a square matrix $A$ has determinant $\\det(A) = 0$, which statement is TRUE?",
    type: "multiple_choice",
    options: [
      "Matrix $A$ is invertible ($A^{-1}$ exists)",
      "Matrix $A$ is non-singular",
      "Matrix $A$ is singular and cannot be inverted",
      "All eigenvalues $\\lambda$ of $A$ are non-zero"
    ],
    correctAnswer: "Matrix $A$ is singular and cannot be inverted",
    explanation: "A determinant of zero ($\\det(A) = 0$) means the column or row vectors are linearly dependent, so the linear map collapses dimensions and $A^{-1}$ does not exist."
  },
  {
    id: "math-2",
    courseName: "Linear Algebra & Calculus",
    category: "Eigenvalues",
    difficulty: "medium",
    question: "For a square matrix $A$, what scalar $\\lambda$ satisfies $A\\mathbf{v} = \\lambda \\mathbf{v}$ for a non-zero vector $\\mathbf{v}$?",
    type: "multiple_choice",
    options: ["Determinant", "Eigenvalue", "Trace", "Rank"],
    correctAnswer: "Eigenvalue",
    explanation: "By definition, if $A\\mathbf{v} = \\lambda \\mathbf{v}$ for a non-zero vector $\\mathbf{v}$, then $\\lambda$ is an eigenvalue and $\\mathbf{v}$ is the corresponding eigenvector."
  },
  {
    id: "math-3",
    courseName: "Linear Algebra & Calculus",
    category: "Derivatives",
    difficulty: "easy",
    question: "What is the derivative of $f(x) = \\ln(x)$ with respect to $x$ for all $x > 0$?",
    type: "multiple_choice",
    options: ["$\\frac{1}{x}$", "$e^x$", "$x$", "$\\frac{1}{x^2}$"],
    correctAnswer: "$\\frac{1}{x}$",
    explanation: "The standard derivative of the natural logarithm is $\\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}$ for all $x > 0$."
  },
  {
    id: "math-4",
    courseName: "Linear Algebra & Calculus",
    category: "Integration",
    difficulty: "medium",
    question: "Evaluate the definite integral $\\int_{0}^{2} (3x^2 - 2x + 1) \\, dx$.",
    type: "multiple_choice",
    options: ["$6$", "$7$", "$8$", "$10$"],
    correctAnswer: "$6$",
    explanation: "By the Fundamental Theorem of Calculus: $\\int_{0}^{2} (3x^2 - 2x + 1) \\, dx = \\left[ x^3 - x^2 + x \\right]_{0}^{2} = (2^3 - 2^2 + 2) - 0 = (8 - 4 + 2) = 6$."
  },
  {
    id: "math-5",
    courseName: "Linear Algebra & Calculus",
    category: "Limits",
    difficulty: "medium",
    question: "Compute the limit: $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$.",
    type: "multiple_choice",
    options: ["$0$", "$1$", "$3$", "Undefined"],
    correctAnswer: "$3$",
    explanation: "Using the fundamental trigonometric limit $\\lim_{u \\to 0} \\frac{\\sin(u)}{u} = 1$, rewrite as $3 \\cdot \\lim_{x \\to 0} \\frac{\\sin(3x)}{3x} = 3 \\cdot 1 = 3$."
  },

  // Data Structures & Algorithms
  {
    id: "dsa-1",
    courseName: "Data Structures & Algorithms",
    category: "Trees",
    difficulty: "medium",
    question: "What is the worst-case time complexity of searching in an AVL tree with $n$ nodes?",
    type: "multiple_choice",
    options: ["$O(1)$", "$O(\\log n)$", "$O(n)$", "$O(n \\log n)$"],
    correctAnswer: "$O(\\log n)$",
    explanation: "AVL trees are height-balanced binary search trees. Their height is strictly bounded by $\\approx 1.44 \\log_2(n)$, guaranteeing $O(\\log n)$ worst-case search."
  },
  {
    id: "dsa-2",
    courseName: "Data Structures & Algorithms",
    category: "Graph Algorithms",
    difficulty: "medium",
    question: "Which algorithm finds the single-source shortest path in a graph with non-negative edge weights?",
    type: "multiple_choice",
    options: ["Kruskal's Algorithm", "Dijkstra's Algorithm", "Prim's Algorithm", "Tarjan's Algorithm"],
    correctAnswer: "Dijkstra's Algorithm",
    explanation: "Dijkstra's algorithm greedily expands distance estimates from a single source in non-negative weighted graphs in $O((V + E) \\log V)$ time with a priority queue."
  },
  {
    id: "dsa-3",
    courseName: "Data Structures & Algorithms",
    category: "Complexity",
    difficulty: "easy",
    question: "What is the average time complexity of accessing an element in a Hash Table with good distribution?",
    type: "multiple_choice",
    options: ["$O(n)$", "$O(\\log n)$", "$O(1)$", "$O(n^2)$"],
    correctAnswer: "$O(1)$",
    explanation: "With a uniform hash function and low load factor, element lookup in a hash table executes in average constant time $O(1)$."
  },
  {
    id: "dsa-4",
    courseName: "Data Structures & Algorithms",
    category: "Sorting",
    difficulty: "medium",
    question: "Which sorting algorithm is inherently stable and guarantees $O(n \\log n)$ worst-case time complexity?",
    type: "multiple_choice",
    options: ["Quick Sort", "Heap Sort", "Merge Sort", "Selection Sort"],
    correctAnswer: "Merge Sort",
    explanation: "Merge Sort divides arrays into halves and merges them while preserving relative order of equal keys, running in $O(n \\log n)$ in all cases."
  },

  // Database Systems
  {
    id: "db-1",
    courseName: "Database Systems",
    category: "Transactions",
    difficulty: "easy",
    question: "In relational database transactions, what does the 'I' in the ACID acronym stand for?",
    type: "multiple_choice",
    options: ["Integrity", "Isolation", "Indexing", "Idempotence"],
    correctAnswer: "Isolation",
    explanation: "ACID stands for Atomicity, Consistency, Isolation, and Durability. Isolation guarantees that concurrent transactions do not interfere with each other's execution."
  },
  {
    id: "db-2",
    courseName: "Database Systems",
    category: "Normalization",
    difficulty: "medium",
    question: "A relation is in 2nd Normal Form (2NF) if it is in 1NF and contains no:",
    type: "multiple_choice",
    options: [
      "Transitive dependencies",
      "Partial dependencies on a candidate key",
      "Multi-valued dependencies",
      "Foreign keys"
    ],
    correctAnswer: "Partial dependencies on a candidate key",
    explanation: "2NF requires that all non-prime attributes are fully functionally dependent on the entire primary key, eliminating partial dependencies."
  },
  {
    id: "db-3",
    courseName: "Database Systems",
    category: "SQL",
    difficulty: "easy",
    question: "Which SQL clause is used to filter records resulting from an aggregate function like SUM or COUNT?",
    type: "multiple_choice",
    options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
    correctAnswer: "HAVING",
    explanation: "WHERE filters rows before aggregation, whereas HAVING filters grouped result sets after aggregation functions have been computed."
  },

  // Operating Systems
  {
    id: "os-1",
    courseName: "Operating Systems",
    category: "Concurrency",
    difficulty: "medium",
    question: "Which of the following is NOT one of Coffman's four conditions required for deadlock to occur?",
    type: "multiple_choice",
    options: [
      "Mutual Exclusion",
      "Hold and Wait",
      "Preemption Allowed",
      "Circular Wait"
    ],
    correctAnswer: "Preemption Allowed",
    explanation: "The condition is No Preemption. If preemption is allowed, resources can be forcibly reclaimed from a process, preventing deadlock."
  },
  {
    id: "os-2",
    courseName: "Operating Systems",
    category: "Virtual Memory",
    difficulty: "easy",
    question: "What term describes the phenomenon where the system spends more time paging memory than executing instructions?",
    type: "multiple_choice",
    options: ["Thrashing", "Deadlock", "Starvation", "Context Switching"],
    correctAnswer: "Thrashing",
    explanation: "Thrashing occurs when the working set of active processes exceeds physical memory, causing continuous page faults and near-zero CPU throughput."
  }
];
