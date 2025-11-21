import { vi } from "vitest";
import inquirer from 'inquirer';

// Queue to hold successive mock answers. Each entry is an object
// mapping prompt `name` -> value (usually single-key objects used by tests).
const _answersQueue: Record<string, any>[] = [];

function ensurePromptMock() {
  const curr = (inquirer as any).prompt;
  if (curr && typeof curr.mockImplementation === 'function') return curr;

  // Replace prompt with a persistent mock implementation that consumes
  // queued answers. It supports being called with a single question
  // or an array of questions.
  const mockFn = vi.fn().mockImplementation(async (questions: any) => {
    // If questions is an array, we expect answers for each prompt to be queued
    if (Array.isArray(questions)) {
      const needed = questions.length;
      // Merge next `needed` queued answer objects into one result
      const toMerge: Record<string, any>[] = [];
      for (let i = 0; i < needed; i++) {
        if (_answersQueue.length) {
          toMerge.push(_answersQueue.shift() as Record<string, any>);
        }
      }
      return Object.assign({}, ...toMerge);
    }

    // Single question: consume and return the next queued answer object
    if (_answersQueue.length) {
      return _answersQueue.shift();
    }

    return {};
  });

  (inquirer as any).prompt = mockFn;
  return mockFn;
}

export function mockInquirer(answers: Record<string, any>) {
  // Enqueue the answers object for the next prompt(s)
  _answersQueue.push(answers);

  try {
    // Ensure the imported inquirer.prompt has been replaced with our persistent mock
    ensurePromptMock();
  } catch (err) {
    // ignore - tests will fail later if mock not present
  }
}

export function clearInquirerQueue() {
  _answersQueue.length = 0;
}