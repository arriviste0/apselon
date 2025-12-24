# **App Name**: SwiftTrack Production

## Core Features:

- Job Creation & Assignment: Admin creates jobs with details (customer, description, quantity, due date, priority) and assigns them to departments/employees. Generative AI analyzes job details to suggest optimal process assignments and predict potential bottlenecks as a tool.
- Process Workflow: Each job moves through 17 predefined steps (Design, Approval, etc.). Status updates (Pending, In Progress, Completed, Rejected) with start/end times, employee name, and remarks for each process.
- Employee Portal: Employees log in, view assigned jobs and current process, and update status (Start, Complete, Issue/Reject) with a comment box.
- Admin Dashboard: Admin sees all jobs, current process, delay alerts, employee productivity, and bottlenecks in real-time.
- Job Timeline: Timeline view of all 17 steps for each job, showing who did what and when for auditing and accountability.
- Database Integration: Utilize MongoDB or PostgreSQL to manage user, job, process, and job process tracking data efficiently.

## Style Guidelines:

- Primary color: Dark indigo (#3F51B5) to convey reliability and efficiency.
- Background color: Light gray (#F0F2F5), offering a clean and unobtrusive backdrop.
- Accent color: Muted teal (#45A29E) for interactive elements, providing a sense of action without being overwhelming.
- Body and headline font: 'Inter', a grotesque-style sans-serif providing a modern, machined, objective, neutral look.
- Use consistent, minimalist icons to represent job processes and actions.
- Clean and organized layout with clear visual hierarchy for easy navigation and information access.
- Subtle transitions and animations to provide feedback on user interactions and guide users through the workflow.