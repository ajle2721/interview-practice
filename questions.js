const QUESTIONS = [
  // Conflict
  { id: 1, category: "Conflict", question: "Tell me about a time you had a conflict with a peer. How did you resolve it?" },
  { id: 2, category: "Conflict", question: "Describe a time when you disagreed with your manager. What did you do?" },
  { id: 3, category: "Conflict", question: "Tell me about a time you had to work with a difficult colleague. How did you handle the situation?" },
  { id: 4, category: "Conflict", question: "Give an example of a time you had to mediate a dispute between two team members." },
  { id: 5, category: "Conflict", question: "Tell me about a time you had to deliver bad news to a teammate or stakeholder." },
  { id: 6, category: "Conflict", question: "Describe a situation where you had to push back on a request from a senior leader." },
  { id: 7, category: "Conflict", question: "Have you ever been in a situation where you felt a team member wasn't pulling their weight? How did you address it?" },
  { id: 8, category: "Conflict", question: "Talk about a time you had to handle a customer complaint that you felt was unfair." },

  // Leadership
  { id: 9, category: "Leadership", question: "Tell me about a time you took the lead on a project without being asked." },
  { id: 10, category: "Leadership", question: "Describe a time you coached or mentored a colleague to help them improve." },
  { id: 11, category: "Leadership", question: "Give an example of a time you had to motivate a demotivated team." },
  { id: 12, category: "Leadership", question: "Tell me about a time you had to make a difficult decision that wasn't popular with your team." },
  { id: 13, category: "Leadership", question: "Describe a situation where you had to delegate tasks to ensure a project's success." },
  { id: 14, category: "Leadership", question: "Tell me about a time you influenced a major change within your department." },
  { id: 15, category: "Leadership", question: "Describe your leadership style with a specific example of it in action." },
  { id: 16, category: "Leadership", question: "Tell me about a time you identified a gap in a process and took initiative to fix it." },

  // Failure
  { id: 17, category: "Failure", question: "Tell me about a significant mistake you made at work and what you learned from it." },
  { id: 18, category: "Failure", question: "Describe a project that failed despite your best efforts." },
  { id: 19, category: "Failure", question: "Tell me about a time you missed a deadline. What happened and how did you handle it?" },
  { id: 20, category: "Failure", question: "Give an example of a time you received critical feedback. How did you respond?" },
  { id: 21, category: "Failure", question: "Describe a time you set a goal for yourself but failed to achieve it." },
  { id: 22, category: "Failure", question: "Tell me about a time you made a wrong technical decision. How did you rectify it?" },
  { id: 23, category: "Failure", question: "Talk about a time you let a teammate down and how you handled the aftermath." },
  { id: 24, category: "Failure", question: "Describe a situation where you overcommitted yourself and couldn't deliver quality work." },

  // Ambiguity
  { id: 25, category: "Ambiguity", question: "Tell me about a time you had to work on a project with very little direction or data." },
  { id: 26, category: "Ambiguity", question: "How do you handle tasks where the requirements are constantly changing?" },
  { id: 27, category: "Ambiguity", question: "Describe a situation where you had to make a decision with incomplete information." },
  { id: 28, category: "Ambiguity", question: "Tell me about a time you joined a project midway through and had to get up to speed quickly." },
  { id: 29, category: "Ambiguity", question: "Give an example of a time you had to define a process from scratch." },
  { id: 30, category: "Ambiguity", question: "Describe a time you had to pivot your strategy due to a sudden change in market or business needs." },
  { id: 31, category: "Ambiguity", question: "Tell me about a time you navigated a complex organizational change." },
  { id: 32, category: "Ambiguity", question: "How do you prioritize your work when everything seems like a top priority?" },

  // Prioritization
  { id: 33, category: "Prioritization", question: "Tell me about a time you had to juggle multiple high-priority projects. How did you manage?" },
  { id: 34, category: "Prioritization", question: "Describe a situation where you had to say 'no' to a request because of your workload." },
  { id: 35, category: "Prioritization", question: "How do you decide which tasks to focus on when you have a limited amount of time?" },
  { id: 36, category: "Prioritization", question: "Tell me about a time you had to reschedule a deadline. How did you communicate this?" },
  { id: 37, category: "Prioritization", question: "Give an example of a time you dropped a low-value task to focus on something more impactful." },
  { id: 38, category: "Prioritization", question: "Describe a time you managed a project with very tight constraints (time, budget, or resources)." },
  { id: 39, category: "Prioritization", question: "Tell me about a time you realized you wouldn't meet a goal. What did you do?" },
  { id: 40, category: "Prioritization", question: "How do you handle interruptions when you are trying to complete a critical task?" },

  // Cross-functional collaboration
  { id: 41, category: "Cross-functional collaboration", question: "Tell me about a time you worked with a different department to achieve a common goal." },
  { id: 42, category: "Cross-functional collaboration", question: "Describe a situation where you had to explain a technical concept to a non-technical audience." },
  { id: 43, category: "Cross-functional collaboration", question: "How do you handle disagreements between your team and another team?" },
  { id: 44, category: "Cross-functional collaboration", question: "Tell me about a successful cross-functional project you were part of. What was your role?" },
  { id: 45, category: "Cross-functional collaboration", question: "Describe a time you had to influence someone from another team who didn't report to you." },
  { id: 46, category: "Cross-functional collaboration", question: "Give an example of a time you gathered requirements from multiple stakeholders with conflicting needs." },
  { id: 47, category: "Cross-functional collaboration", question: "Tell me about a time you had to rely on another team to finish your work, but they were delayed." },
  { id: 48, category: "Cross-functional collaboration", question: "How do you build trust with partners outside of your immediate team?" },

  // Technical challenge
  { id: 49, category: "Technical challenge", question: "Tell me about the most complex technical problem you've solved. What was your approach?" },
  { id: 50, category: "Technical challenge", question: "Describe a time you had to learn a new technology or tool very quickly for a project." },
  { id: 51, category: "Technical challenge", question: "Tell me about a time you optimized a slow process or improved system performance." },
  { id: 52, category: "Technical challenge", question: "Describe a situation where you had to debug a critical production issue under pressure." },
  { id: 53, category: "Technical challenge", question: "Give an example of a time you had to simplify a complex architecture or piece of code." },
  { id: 54, category: "Technical challenge", question: "Tell me about a time you chose a specific technology over another. What was the trade-off?" },
  { id: 55, category: "Technical challenge", question: "Describe a time you had to refactor a large legacy codebase." },
  { id: 56, category: "Technical challenge", question: "Talk about a time you implemented a solution that had a long-term impact on your team's productivity." },

  // Ownership
  { id: 57, category: "Ownership", question: "Tell me about a time you went above and beyond your job description to ensure a project succeeded." },
  { id: 58, category: "Ownership", question: "Describe a situation where you took responsibility for a failure that wasn't entirely your fault." },
  { id: 59, category: "Ownership", question: "Give an example of a time you spotted a problem and fixed it, even though it wasn't your 'area'." },
  { id: 60, category: "Ownership", question: "Tell me about a time you followed through on a commitment even when it became difficult." },
  { id: 61, category: "Ownership", question: "Describe a time you advocated for a better way of doing things, despite resistance." },
  { id: 62, category: "Ownership", question: "Tell me about a project you owned from conception to launch. What were the challenges?" },
  { id: 63, category: "Ownership", question: "Give an example of how you ensure the quality of your work before it's delivered." },
  { id: 64, category: "Ownership", question: "Tell me about a time you stayed late or worked extra to help a teammate reach their goal." },

  // Learning / growth
  { id: 65, category: "Learning / growth", question: "Tell me about a time you proactively sought feedback to improve your performance." },
  { id: 66, category: "Learning / growth", question: "Describe a new skill you learned recently. Why did you choose it and how did you learn it?" },
  { id: 67, category: "Learning / growth", question: "Tell me about a time you failed to learn something as quickly as you expected. What did you do?" },
  { id: 68, category: "Learning / growth", question: "Describe a situation where you had to teach yourself a complex subject." },
  { id: 69, category: "Learning / growth", question: "How do you stay updated with industry trends and developments?" },
  { id: 70, category: "Learning / growth", question: "Tell me about a time you turned a negative experience into a learning opportunity." },
  { id: 71, category: "Learning / growth", question: "Give an example of how you've applied a lesson from a past mistake to a new project." },
  { id: 72, category: "Learning / growth", question: "Describe your long-term career goals and how your current work helps you achieve them." },

  // Product decision-making
  { id: 73, category: "Product decision-making", question: "Tell me about a time you used data to drive a product or feature decision." },
  { id: 74, category: "Product decision-making", question: "Describe a situation where you had to balance user needs with technical feasibility." },
  { id: 75, category: "Product decision-making", question: "Tell me about a feature you proposed that was ultimately built. What was the impact?" },
  { id: 76, category: "Product decision-making", question: "Give an example of a time you had to kill a project or feature you believed in." },
  { id: 77, category: "Product decision-making", question: "Describe how you gather and incorporate user feedback into your development process." },
  { id: 78, category: "Product decision-making", question: "Tell me about a time you had to prioritize features for an MVP (Minimum Viable Product)." },
  { id: 79, category: "Product decision-making", question: "Describe a time you disagreed with a product roadmap and how you handled it." },
  { id: 80, category: "Product decision-making", question: "Talk about a time you had to make a trade-off between speed to market and product quality." },
  { id: 81, category: "Conflict", question: "Tell me about a time you had to manage a conflict with a stakeholder who had more power than you." },
  { id: 82, category: "Leadership", question: "Describe a time you had to guide your team through a period of high stress or burnout." },
  { id: 83, category: "Technical challenge", question: "Tell me about a time you had to debug an issue that only occurred in production but not locally." }
];
