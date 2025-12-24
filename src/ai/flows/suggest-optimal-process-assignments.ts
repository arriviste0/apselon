'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting optimal process assignments based on job details.
 *
 * The flow analyzes job details (description, quantity, due date) and suggests optimal initial process
 * assignments to employees or departments, leveraging AI to predict potential bottlenecks and improve efficiency.
 *
 * @interface SuggestOptimalProcessAssignmentsInput - Defines the input schema for the flow.
 * @interface SuggestOptimalProcessAssignmentsOutput - Defines the output schema for the flow.
 * @function suggestOptimalProcessAssignments - The main function to trigger the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalProcessAssignmentsInputSchema = z.object({
  jobDescription: z.string().describe('Detailed description of the job.'),
  quantity: z.number().describe('The quantity of items to be produced.'),
  dueDate: z.string().describe('The due date for the job (YYYY-MM-DD).'),
  processList: z.array(z.string()).describe('List of the 17 processes'),
});
export type SuggestOptimalProcessAssignmentsInput = z.infer<
  typeof SuggestOptimalProcessAssignmentsInputSchema
>;

const SuggestOptimalProcessAssignmentsOutputSchema = z.object({
  suggestedAssignments: z
    .record(z.string(), z.string())
    .describe(
      'A map of process names to suggested employee or department assignments.'
    ),
  potentialBottlenecks: z
    .array(z.string())
    .describe('A list of potential bottlenecks identified by the AI.'),
});
export type SuggestOptimalProcessAssignmentsOutput = z.infer<
  typeof SuggestOptimalProcessAssignmentsOutputSchema
>;

export async function suggestOptimalProcessAssignments(
  input: SuggestOptimalProcessAssignmentsInput
): Promise<SuggestOptimalProcessAssignmentsOutput> {
  return suggestOptimalProcessAssignmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalProcessAssignmentsPrompt',
  input: {schema: SuggestOptimalProcessAssignmentsInputSchema},
  output: {schema: SuggestOptimalProcessAssignmentsOutputSchema},
  prompt: `You are an AI assistant designed to optimize job assignments in a manufacturing setting. Analyze the job details provided and suggest optimal initial process assignments to employees or departments. Also, predict potential bottlenecks in the production process.

Job Description: {{{jobDescription}}}
Quantity: {{{quantity}}}
Due Date: {{{dueDate}}}
Processes: {{#each processList}}{{{this}}}, {{/each}}

Consider the following factors when making assignments:
* Employee/department skills and expertise
* Current workload of employees/departments
* Potential dependencies between processes
* Time required for each process

Output the assignments as a JSON object mapping process names to employee/department names.
Also, output a list of potential bottlenecks.

Example Output:
{
  "suggestedAssignments": {
    "Design": "John Doe",
    "Approval": "Jane Smith",
    "Material Check": "Inventory Department",
    "Cutting": "Cutting Department",
     ...
  },
  "potentialBottlenecks": ["Cutting", "Assembly"]
}

Ensure the output is a valid JSON object.`,
});

const suggestOptimalProcessAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestOptimalProcessAssignmentsFlow',
    inputSchema: SuggestOptimalProcessAssignmentsInputSchema,
    outputSchema: SuggestOptimalProcessAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
