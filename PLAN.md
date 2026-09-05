# AGENTS.md — Personal Project & Task Tracker

## Project Purpose

Build a **personal Project & Task Tracker** using:

* **Next.js**
* **Supabase**

The application is intended for one person to manage:

* Personal Projects
* Work Projects
* Project-related tasks
* Standalone personal tasks
* Meetings
* Follow-ups
* General to-dos
* GitHub development activity associated with projects

The goal is to provide one clean command center where the user can immediately understand:

* What projects currently exist
* Which projects are Pending
* Which projects are In Development
* Which projects are already in Production
* What tasks need attention today
* What tasks are coming up
* What project should receive attention next
* What has recently been completed
* What development activity has recently happened in GitHub
* What commits, pushes, pull requests, and repository activity belong to each project

This is intentionally a **small system**.

Do not turn it into Jira, ClickUp, Monday, Notion, Linear, GitHub itself, or an enterprise project-management platform.

Keep the product:

* Small
* Focused
* Fast
* Clean
* Visually polished
* Easy to understand
* Enjoyable to use

---

# Technical Responsibility

The requirements in this document describe the intended product, behavior, and workflow.

The implementation should independently determine the appropriate:

* Next.js architecture
* Project structure
* Folder organization
* Pages and routes
* Components
* Supabase configuration
* Database schema
* Tables
* Relationships
* Constraints
* Indexes
* Authentication
* Row Level Security
* Queries
* Mutations
* Server/client boundaries
* Server Actions where appropriate
* Database functions or triggers where appropriate
* Validation
* TypeScript types
* State management
* Error handling
* Loading behavior
* Dependencies
* GitHub integration architecture
* GitHub authentication/authorization approach
* GitHub API interaction
* GitHub data synchronization or caching where appropriate
* Performance strategy
* Responsive behavior
* Security
* Accessibility
* Deployment approach

Do not expect every technical decision to be explicitly defined.

Analyze the requirements and choose an implementation that is simple, maintainable, secure, and appropriate for the size of the application.

---

# Technology

Use:

```text
Next.js
+
Supabase
```

Supabase should serve as the primary backend and source of truth for application-owned data.

GitHub should be integrated where appropriate for repository and development activity.

Use the capabilities provided by Next.js, Supabase, and GitHub intelligently.

Do not introduce additional infrastructure without a meaningful technical reason.

Avoid unnecessarily introducing:

* A separate backend server
* Another database
* Another frontend framework
* Multiple competing state-management systems
* Multiple UI frameworks solving the same problem
* Unnecessary infrastructure layers

Keep the architecture understandable.

---

# Product Philosophy

Optimize for:

* Simplicity
* Speed
* Clarity
* Strong visual hierarchy
* Useful automation
* Satisfying interactions
* Clean visualization
* Low cognitive load

The tracker should reduce manual bookkeeping.

If information can safely be determined automatically, prefer automation.

Examples include:

* Development start date
* Publication date
* Task completion date
* Project progress
* Development duration
* Overdue state
* Recent activity
* GitHub repository activity
* Latest commit
* Last push
* Pull request status

The user should spend time working on projects, not maintaining the tracker.

---

# Project Classification

Every project should belong to one of two classifications:

```text
Personal
Work
```

These are classifications only.

Do **not** create separate systems for Personal and Work Projects.

Both types should use the same:

* Project lifecycle
* Project pages
* Task functionality
* Progress calculation
* Start Development workflow
* Production workflow
* GitHub integration
* Notes
* Links
* Activity tracking
* Priority system
* Filtering
* Dashboard behavior

The distinction exists so the user can quickly answer:

> What am I currently building personally?

and:

> What am I currently working on professionally?

while still being able to view everything together.

---

# Creating a Project

When creating a project, allow the user to choose:

```text
Project Type

Personal
Work
```

Examples:

```text
Orbit
Personal
```

```text
Employee Microsite
Work
```

The project classification should be easy to recognize without overpowering more important information such as project status.

Keep the visual distinction subtle and clean.

---

# Project Information

A project should contain the information necessary to understand and manage it.

This may include:

* Project name
* Description
* Project type
* Status
* Priority
* Development start date
* Target publication date
* Published date
* Relevant project links
* GitHub repository connection
* Notes
* Created date
* Updated date

The implementation should determine the exact data model.

Do not add fields simply because traditional project-management applications contain them.

Every field should have a useful purpose.

---

# Project Lifecycle

The primary project lifecycle is:

```text
Pending
   ↓
In Development
   ↓
Production
```

Lightweight support may also be included for:

```text
Paused
Archived
```

Keep the lifecycle straightforward.

Do not introduce unnecessary project states.

---

# Pending Projects

New projects should normally begin as:

```text
Pending
```

Pending means:

> The project exists, but development has not started yet.

The user should still be able to:

* View the project
* Edit project information
* Change project type
* Set priority
* Add notes
* Add relevant links
* Connect a GitHub repository if desired
* Set a target publication date

However:

## Project-specific tasks cannot be created while the project is Pending.

The interface should clearly explain why.

For example:

> Development hasn't started yet. Start development before creating tasks for this project.

A Pending project should provide a prominent:

# Start Development

action.

---

# Start Development Workflow

When the user chooses:

# Start Development

the system should automatically:

1. Change the project status from:

```text
Pending
```

to:

```text
In Development
```

2. Automatically record the development start date.

3. Enable project-specific task creation.

4. Update the project page.

5. Update the dashboard.

6. Update relevant project views.

7. Record useful activity/history.

8. Begin surfacing relevant GitHub development activity if a repository is connected.

9. Provide clear and satisfying UI feedback.

The development start date should normally be automated rather than manually entered during this workflow.

The implementation should determine the safest and cleanest way to perform the transition using Next.js and Supabase.

---

# In Development

An In Development project represents something actively being built or worked on.

While a project is In Development, the user should be able to:

* Create project tasks
* Edit tasks
* Start tasks
* Complete tasks
* Reopen tasks
* View project progress
* See the development start date
* See a target publication date if one exists
* View project links
* View GitHub repository information
* View recent GitHub development activity
* Add or edit notes
* See the next relevant task
* Pause development if supported
* Mark the project as Production

In Development projects should receive strong visibility on the Dashboard.

---

# Project Tasks

Project tasks belong to a specific project.

Example:

```text
Project: Personal Project Tracker

- Build dashboard
- Configure Supabase
- Create project page
- Build task tracker
- Integrate GitHub
- Implement Start Development workflow
- Prepare deployment
```

Project tasks should remain simple.

Useful task information may include:

* Title
* Description
* Status
* Priority
* Due date
* Completion date

Determine the exact structure based on the simplest implementation that supports the intended workflow.

Keep task statuses straightforward.

For example:

```text
To Do
In Progress
Done
```

Do not overcomplicate the task lifecycle.

---

# Project Task Business Rule

This is an important business rule:

```text
Pending Project
→ Cannot Create Project Tasks
```

```text
In Development Project
→ Project Tasks Enabled
```

This rule should not exist only visually in the frontend.

Protect important workflow rules appropriately through the application and database.

The interface should still prevent invalid actions proactively and clearly explain why.

---

# Standalone Personal Tasks

The application should support tasks that do **not** belong to a project.

These may represent:

* Meetings
* Follow-ups
* Appointments
* Personal reminders
* General work
* Research
* Things to buy
* Administrative tasks
* Miscellaneous to-dos

Examples:

```text
Attend BTL Meeting
Send follow-up email
Review proposal
Research deployment options
```

Standalone personal tasks should not require a project.

Prefer a simple underlying task architecture rather than creating completely separate task systems unless there is a meaningful reason.

---

# Task Context vs Project Type

Keep these concepts separate.

## Project Type

```text
Personal
Work
```

## Task Context

```text
Project Task
Standalone Personal Task
```

A project task should automatically inherit the Personal or Work context of its parent project.

Example:

```text
Implement Orbit Timer
Project: Orbit
Project Type: Personal
```

Example:

```text
Build Microsite Announcements
Project: Employee Microsite
Project Type: Work
```

The user should not need to classify the task again.

---

# Task Completion

Completing a task should be fast and satisfying.

When a task is completed:

* The interface should immediately reflect the change.
* Relevant completion information should be recorded automatically.
* Project progress should update when applicable.
* Dashboard information should remain consistent.
* Any useful activity record may be generated automatically.

If a completed task is reopened, its completion state should update correctly.

---

# Project Progress

Project progress should preferably be derived automatically from project tasks.

Do not require the user to manually enter a progress percentage.

Example:

```text
8 Completed Tasks
10 Total Tasks

80% Complete
```

Progress should update automatically when tasks are completed or reopened.

Handle projects with no tasks gracefully.

Keep the visualization clear and compact.

---

# Next Action

Active projects should ideally surface a:

# Next Action

or equivalent concept.

This should quickly answer:

> What should I work on next for this project?

Example:

```text
Orbit

Next
Implement Media Controls
```

Use simple deterministic logic.

Possible considerations include:

1. Tasks currently In Progress
2. Higher-priority unfinished tasks
3. Tasks with earlier due dates
4. Older unfinished tasks

Do not build an elaborate ranking system.

Do not introduce AI solely for determining the next task.

---

# GitHub Integration

GitHub should be integrated directly into projects.

The purpose of the integration is to make the project tracker aware of actual development activity without requiring the user to manually duplicate GitHub information.

A project should be able to connect to a GitHub repository.

Where useful, allow support for more than one repository for a project, but do not overcomplicate the initial experience if one repository per project is sufficient.

The implementation should determine the cleanest GitHub authentication and repository connection strategy.

---

# GitHub Repository Connection

A project should allow the user to:

* Connect a GitHub repository
* View the connected repository
* Open the repository in GitHub
* Change the connected repository
* Disconnect the repository

Useful repository information may include:

* Repository name
* Owner
* Repository URL
* Visibility
* Default branch
* Latest activity time
* Last pushed time

Do not duplicate GitHub unnecessarily.

The tracker should surface useful project context while GitHub remains the source of truth for repository data.

---

# GitHub Development Activity

For projects with a connected GitHub repository, surface useful development activity such as:

* Commits
* Push activity
* Pull requests
* Merged pull requests
* Open pull requests
* Closed pull requests
* Branch activity
* Repository updates
* Latest commit
* Last push
* Contributors if useful
* Releases if useful
* Issues if they add meaningful value
* Deployment/release activity if available and useful

Do not add every GitHub API feature simply because it exists.

Focus on development activity that helps answer:

> What has happened recently on this project?

---

# Commits

For each connected project, provide useful commit visibility.

Possible information includes:

* Latest commit message
* Commit author
* Commit timestamp
* Short commit SHA
* Branch if useful
* Link to commit
* Recent commit history

Example:

```text
Latest Commit

Improve dashboard project filters

a41bd82
Today, 2:41 PM
```

Avoid building a full Git history browser.

A concise recent activity view is enough.

---

# Push Activity

Track useful repository push information.

Possible information includes:

```text
Last Push
Today, 2:41 PM

Branch
main
```

Recent push activity may also contribute to the project's activity timeline.

Do not create excessive event noise.

If several commits belong to one push or a short development session, the UI may summarize the activity rather than displaying dozens of redundant entries.

---

# Pull Requests

Pull request information should be visible for connected projects.

Useful information may include:

* PR title
* PR number
* Open
* Draft
* Merged
* Closed
* Author
* Created date
* Updated date
* Merged date
* Source branch
* Target branch
* Link to GitHub

Example:

```text
Pull Requests

#42 Improve dashboard layout
OPEN

#39 Add Supabase project filters
MERGED
```

The project tracker does not need to recreate the full GitHub pull request interface.

The user should be able to see important PR state and open the PR in GitHub when deeper interaction is required.

---

# GitHub Project Development Summary

A connected project may show a compact development summary.

Example:

```text
GitHub

Repository
ysmael/orbit

Last Push
Today, 2:41 PM

Latest Commit
Improve media state transitions

Open PRs
2

Merged PRs
8
```

Keep this compact.

Avoid turning project pages into GitHub dashboards.

---

# GitHub Activity Timeline

GitHub events should integrate naturally with the existing project Activity area where useful.

Example:

```text
Today

✓ Completed "Build Dashboard"

↗ Pushed 3 commits to main

⑂ Opened PR #42 — Improve Dashboard Layout

✓ Merged PR #39 — Add Supabase Filters
```

Application activity and GitHub activity may appear in one coherent chronological timeline if that produces the best UX.

Differentiate GitHub activity subtly.

Do not flood the timeline with low-value events.

---

# GitHub Dashboard Integration

The main Dashboard may surface GitHub information for active projects.

Useful examples include:

```text
Orbit

IN DEVELOPMENT
78%

Latest Commit
Improve window animations

Last Push
38 minutes ago

Open PR
#42 Media Controls
```

Only show GitHub information when it contributes useful context.

Do not make every project card excessively large.

A concise indicator such as:

```text
3 commits today
1 open PR
```

may sometimes be better than displaying detailed GitHub information directly on the card.

---

# GitHub and Project Activity

GitHub activity should complement project status and tasks.

Do not automatically interpret:

```text
Commit pushed
```

as:

```text
Task completed
```

unless there is an explicit feature connecting the two.

Project tasks remain application-managed data.

GitHub activity remains repository development data.

These should work together without incorrectly assuming relationships.

---

# GitHub Data Strategy

Do not unnecessarily copy the entire GitHub repository history into Supabase.

Determine a sensible approach for:

* Fetching GitHub data
* Caching useful metadata
* Refreshing project activity
* Avoiding excessive API requests
* Handling rate limits
* Handling disconnected repositories
* Handling renamed repositories
* Handling inaccessible repositories
* Handling private repositories securely

Store application-specific integration information when necessary.

GitHub should remain the source of truth for GitHub-owned data.

---

# GitHub Refresh Behavior

Repository information should remain reasonably current.

The implementation may use an appropriate combination of:

* On-demand refresh
* Refresh when viewing the project
* Cached data
* Background synchronization where justified
* Webhooks if they provide sufficient value without unnecessary complexity

Choose the simplest reliable strategy.

Do not introduce a complicated event-processing architecture unless needed.

---

# GitHub Security

GitHub credentials, access tokens, and integration secrets must be handled securely.

Do not expose sensitive credentials to the browser unnecessarily.

Private repository access must respect GitHub authorization.

The implementation should choose an appropriate secure integration model.

---

# GitHub Failure States

The application should handle GitHub integration failures gracefully.

Examples:

* Repository deleted
* Repository renamed
* Access revoked
* Token expired
* GitHub unavailable
* Repository made private
* API request failed

A GitHub failure should **not break the project tracker itself**.

Project tracking and tasks must continue functioning independently.

Example message:

> GitHub activity could not be refreshed. Your project and task data are unaffected.

---

# GitHub Empty State

Projects without a connected repository should have a clean optional integration state.

Example:

> Connect a GitHub repository to see commits, pushes, pull requests, and development activity here.

Provide a simple:

```text
Connect GitHub Repository
```

action.

Do not make GitHub mandatory for projects that do not need a repository.

---

# GitHub Scope

The GitHub integration exists primarily for **visibility**.

The initial system should prioritize reading and displaying useful repository information.

Do not automatically expand into:

* Full source-code browsing
* Code editing
* Pull request review tools
* Merge conflict resolution
* Git operations
* Full issue management
* GitHub Actions administration
* Repository settings management
* Organization administration

unless a later requirement specifically calls for them.

Link to GitHub for deep repository operations.

---

# Mark as Production

When development is finished, provide an action such as:

# Mark as Production

This workflow should automatically:

1. Change the project status to:

```text
Production
```

2. Record the publication/production date.

3. Preserve the project's task history.

4. Preserve the GitHub connection and development history.

5. Update the project page.

6. Update the Dashboard.

7. Update relevant project lists.

8. Allow useful derived information such as development duration.

Example:

```text
Development Started
August 22

Published
September 4

Development Duration
13 Days
```

The transition should be reliable and appropriately protected.

---

# Production Projects

Production means that the project has been published, deployed, released, or otherwise completed.

Production projects should preserve useful historical information including:

* Development start date
* Publication date
* Development duration
* Tasks
* Notes
* Links
* GitHub repository
* Relevant GitHub activity
* Activity history

Do not remove historical information after publishing.

GitHub activity may continue after Production because projects can still receive:

* Bug fixes
* Maintenance
* Improvements
* New releases

Do not assume Production means repository activity stops permanently.

---

# Paused Projects

A lightweight:

```text
Paused
```

status may be supported for projects whose development is temporarily stopped.

Keep this simple.

Do not initially build:

* Multiple development sessions
* Detailed pause analytics
* Time tracking
* Complex resumption history

unless actual product usage later justifies it.

---

# Archived Projects

Projects should preferably be archived instead of permanently deleted.

Archived projects should disappear from normal active views while remaining retrievable.

GitHub repository connections and historical development information should remain available unless explicitly disconnected.

Archive behavior should remain straightforward.

---

# Projects View

The Projects page should make it easy to filter by project type:

```text
All
Personal
Work
```

It should also support simple status filtering such as:

```text
All
Pending
In Development
Production
Paused
Archived
```

Useful combinations should be possible.

Examples:

```text
Personal + In Development
```

```text
Work + Production
```

A lightweight GitHub-related filter may be added if useful, such as:

```text
GitHub Connected
No Repository
```

Do not create a complex filtering engine.

---

# Dashboard

The Dashboard is the application's primary command center.

Within several seconds, the user should understand:

* What projects exist
* What projects are active
* Which projects are Personal
* Which projects are Work
* What is Pending
* What is In Development
* What is already in Production
* What requires attention today
* What is overdue
* What is coming next
* What should be worked on next
* What development activity recently happened
* Which projects recently received commits or pushes
* Which projects have open pull requests

Do not overload the Dashboard with unnecessary information.

---

# Dashboard Overview

Useful high-level metrics may include:

```text
Total Projects
In Development
Production
Pending
```

Useful task information may include:

```text
Due Today
Overdue
Completed
```

Optional development metrics may include things such as:

```text
Recent Commits
Open Pull Requests
```

only if they provide meaningful value.

Do not create a card simply because a number is available.

---

# Personal and Work Dashboard Views

The Dashboard may provide a lightweight control such as:

```text
All Projects
Personal
Work
```

When:

```text
All Projects
```

is selected, show the complete project overview.

When:

```text
Personal
```

is selected, focus on Personal Projects and related activity.

When:

```text
Work
```

is selected, focus on Work Projects and related activity.

This should behave like filtering one application, not switching between two separate systems.

---

# Active Projects

Projects currently In Development should receive strong visual priority.

Useful project card information may include:

* Project name
* Project type
* Status
* Priority
* Progress
* Completed tasks / total tasks
* Development start date
* Target publication date
* Next Action
* Concise GitHub activity when available

Example:

```text
Orbit

PERSONAL
IN DEVELOPMENT

████████░░ 78%

8 / 11 Tasks

Next
Implement Timer

GitHub
3 commits today
1 open PR
```

Keep project cards easy to scan.

Avoid displaying every project and GitHub field directly on the card.

---

# My Day

Include a lightweight:

# My Day

section.

This should bring together relevant things requiring attention today.

It may include:

* Project tasks
* Standalone personal tasks
* Meetings
* Follow-ups
* Tasks due today
* Relevant overdue tasks

Example:

```text
○ Finish Dashboard          Project Tracker
○ BTL Meeting               2:00 PM
○ Send Follow-up Email
```

Do not turn GitHub commits into My Day tasks automatically.

My Day should represent actionable work, not passive repository events.

---

# Upcoming

Include a lightweight Upcoming section.

Example:

```text
Tomorrow
Review Project UI

Sep 8
Prepare Prototype

Sep 10
Target Publication
```

This should primarily derive from task due dates and relevant project dates.

Do not build a large calendar system unless actual usage later demonstrates a strong need.

---

# Overdue Tasks

Tasks whose due date has passed and are not completed should automatically appear overdue.

Do not require users to manually set an overdue status.

Make overdue tasks noticeable without making the UI visually aggressive.

---

# Recent Activity

Provide a useful Recent Activity experience.

Application and GitHub events may be combined when that produces a clear timeline.

Examples:

```text
Started development on Project Tracker

Completed Dashboard Layout

Pushed 4 commits to main

Opened PR #18 — Improve Project Cards

Merged PR #15 — GitHub Integration

Published Employee Microsite
```

Only include meaningful events.

Do not create an enterprise audit log or flood the timeline with noise.

---

# Quick Create

Creating items should be fast.

A global action such as:

```text
+ Create
```

may provide options such as:

```text
New Project
New Personal Task
New Project Task
```

Project-related contextual actions may also include:

```text
Connect GitHub Repository
```

where appropriate.

---

# Search and Command Palette

A lightweight search or command palette is encouraged if it remains simple.

Example shortcut:

```text
Ctrl + K
```

Useful capabilities may include:

* Search projects
* Search tasks
* Create project
* Create personal task
* Create project task
* Open connected GitHub repository
* Navigate to Dashboard
* Navigate to Projects
* Navigate to Tasks

Keep the command palette focused.

---

# Main Navigation

Keep primary navigation minimal.

A possible structure:

```text
Dashboard
Projects
Tasks

Activity
Settings
```

GitHub does not necessarily need its own top-level navigation item.

Prefer GitHub information to live naturally inside:

* Project pages
* Dashboard
* Activity

unless usage later justifies a dedicated GitHub view.

---

# Project Detail Experience

A project page should act as the central workspace for that project.

A useful hierarchy may include:

```text
Project Name
Description

Project Type
Status
Priority
Progress

Development Start
Target Publication
Published Date

Primary Project Action
```

Then:

```text
Tasks
```

and supporting content such as:

```text
GitHub
Links
Notes
Activity
```

GitHub information should feel integrated into the project instead of appearing as an unrelated external widget.

Avoid unnecessary navigation layers.

---

# UI Direction

The interface is a major part of this project.

The application should feel:

* Clean
* Modern
* Premium
* Minimal
* Calm
* Responsive
* Precise
* Fast
* Satisfying

Avoid making it look like a generic enterprise admin dashboard or GitHub clone.

Avoid:

* Excessive borders
* Excessive gradients
* Excessive glassmorphism
* Huge cards everywhere
* Dense enterprise tables
* Too many badges
* Too many colors
* Visual clutter
* Gimmicky animations

Use strong:

* Typography
* Spacing
* Visual hierarchy
* Project cards
* Task layouts
* Progress visualization
* GitHub activity visualization
* Empty states
* Hover states
* Loading states
* Feedback
* Transitions

---

# Visual Hierarchy

The user should immediately understand:

1. What needs attention.
2. What is currently being developed.
3. What the next task is.
4. What is due today.
5. What is coming next.
6. What meaningful development activity recently occurred.

GitHub metadata should remain secondary to the project's primary workflow unless something requires attention, such as an open PR.

---

# Clean Visualization

Use clean and compact visualizations for information such as:

* Project progress
* Project status
* Priority
* Personal vs Work classification
* Task completion
* Upcoming work
* Recent commits
* Pull request state
* Repository activity

Avoid oversized charts for simple values.

This is not an analytics platform.

---

# Satisfying UI Interactions

Because the system is intentionally small, interaction quality matters significantly.

Interactions such as:

* Completing a task
* Starting development
* Publishing a project
* Connecting a GitHub repository
* Refreshing GitHub activity
* Opening a commit
* Opening a pull request
* Opening a project
* Creating an item
* Switching filters
* Updating progress
* Opening dialogs
* Navigating views

should feel responsive and polished.

Animations should remain:

* Subtle
* Purposeful
* Fast

---

# Loading States

Avoid blank interfaces while data is loading.

Use appropriate:

* Skeletons
* Inline loading indicators
* Optimistic updates where suitable

GitHub information should load independently where possible so a slow GitHub request does not prevent the rest of the project page from being useful.

---

# Empty States

Design intentional empty states.

Examples:

## No Projects

> Nothing here yet. Create your first project and start building.

## No Tasks Today

> You're clear for today.

## Pending Project Tasks

> Development hasn't started yet. Start development to begin adding project tasks.

## No GitHub Repository

> Connect a GitHub repository to see commits, pushes, pull requests, and development activity.

Empty states should explain what the user can do next.

---

# Error States

Do not expose raw technical, database, or GitHub API errors directly to users.

Show understandable messages.

Example:

> GitHub activity could not be refreshed. Your project data is unaffected.

Technical details may still be logged for debugging.

---

# Responsive Experience

Desktop productivity is the primary experience.

The application should still work well on smaller screens.

On narrower layouts:

* Adapt navigation appropriately
* Stack dashboard sections when needed
* Preserve primary project actions
* Keep task controls usable
* Keep GitHub summaries readable
* Keep Quick Create accessible
* Maintain clear information hierarchy

---

# Accessibility

Maintain sensible accessibility standards.

Include:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible dialogs
* Accessible dropdowns
* Appropriate button labels
* Good contrast
* Logical interaction order

Major workflows should remain usable without requiring a mouse.

---

# Performance

This is a small application and should feel very fast.

Avoid:

* Large unnecessary dependencies
* Excessive client-side JavaScript
* Refetching the entire application after every mutation
* Excessive GitHub API requests
* Heavy chart libraries for simple values
* Premature complex state management
* Unnecessary realtime subscriptions
* Excessive abstraction
* Complicated caching infrastructure without a clear need

GitHub integration should not make the application feel slow.

---

# Authentication

Use Supabase for application authentication.

Integrate GitHub authorization separately where needed for repository access.

Keep authentication appropriate for a personal system.

Do not automatically add:

* Organizations
* Teams
* Invitations
* User roles
* Complex permission matrices
* Enterprise administration

unless future requirements genuinely require them.

---

# Data Protection

User-owned data should be protected correctly.

Implement appropriate Supabase security and Row Level Security.

GitHub credentials and integration data should also be protected.

Do not rely only on frontend filtering to protect application data.

---

# Important Business Rules

Protect important business behavior.

Examples:

```text
Pending Project
→ Cannot Create Project Task
```

```text
Start Development
→ Automatically Record Development Start Date
```

```text
Mark as Production
→ Automatically Record Publication Date
```

```text
Task Completed
→ Completion Information Updates Correctly
```

```text
Project Progress
→ Reflects Project Task Completion
```

```text
Project Task
→ Inherits Personal/Work Context from Parent Project
```

```text
Connected GitHub Repository
→ Development Activity Can Be Displayed
```

```text
GitHub Unavailable
→ Project and Task Tracking Continue Working
```

Do not depend exclusively on frontend controls for important data integrity.

---

# Keep the System Small

This is very important.

Do not automatically add:

* Teams
* Organizations
* Collaboration
* Comments
* Chat
* Employee accounts
* Approval workflows
* Scrum infrastructure
* Sprints
* Epics
* Story points
* Gantt charts
* Resource allocation
* Budget management
* Client management
* Billing
* Complex notification systems
* Enterprise reporting
* Large calendar systems
* Custom workflow builders
* AI assistants
* AI task generation
* Large analytics systems
* Full GitHub client functionality
* Source-code editing
* Full PR review workflows

unless a strong product requirement appears later.

---

# Core Product Scope

The heart of the application is:

```text
Projects
+
Personal / Work Classification
+
Project Lifecycle
+
Project Tasks
+
Standalone Personal Tasks
+
GitHub Development Activity
+
Dashboard
```

The application should gain most of its quality from:

```text
Clean Visualization
+
Excellent UX
+
Useful Automation
+
Satisfying Interactions
+
Fast Performance
+
Strong Visual Consistency
```

rather than from having a large number of features.

---

# Product Improvement Responsibility

Small improvements or tweaks may be introduced when they clearly make the product better.

Possible areas include:

* Navigation
* Workflow details
* Dashboard organization
* Project cards
* Task interactions
* GitHub summaries
* Repository activity presentation
* Search
* Filters
* Quick actions
* Keyboard shortcuts
* Automatic behavior
* Empty states
* Responsive behavior
* Accessibility
* Performance
* Visual hierarchy
* Supabase reliability
* GitHub reliability

Additional features are acceptable when they pass this test:

> Does this noticeably improve usefulness, speed, clarity, visualization, or interaction quality without noticeably increasing complexity?

If yes, the enhancement may be implemented.

If the benefit is unclear, leave it out.

---

# Examples of Reasonable Small Improvements

Potential small improvements may include:

* Pinning important projects
* Recently viewed projects
* Quick task creation from project cards
* Improved Next Action logic
* Keyboard shortcuts
* Lightweight task ordering
* Better default filters
* Better project link handling
* GitHub repository quick links
* Recent commit preview
* Open PR indicator
* Small project completion summaries
* Contextual project actions
* Improved empty states
* Small dashboard quality-of-life improvements

These are examples only.

Do not automatically implement all of them.

---

# Avoid Overengineering

When two solutions provide approximately the same user experience, choose the simpler one.

Prefer:

```text
Simple Architecture
+
Excellent Execution
```

over:

```text
Complex Architecture
+
Unnecessary Abstraction
```

Do not add infrastructure simply because it appears technically impressive.

This includes GitHub synchronization.

Do not build a complicated event pipeline when a simpler integration provides the required experience.

---

# Implementation Philosophy

Build useful vertical slices.

Avoid spending excessive time building infrastructure before the core product works.

A reasonable progression may be:

1. Initialize the Next.js project
2. Connect Supabase
3. Implement authentication
4. Establish the core project model
5. Create projects
6. Display project lists
7. Build project detail experience
8. Support Personal / Work classification
9. Implement Start Development
10. Implement project tasks
11. Protect Pending project task restrictions
12. Implement project progress
13. Implement Mark as Production
14. Implement standalone personal tasks
15. Build Dashboard
16. Build My Day
17. Add Upcoming and Overdue views
18. Add project/task filters
19. Add GitHub repository connection
20. Display repository summary
21. Display commits and push activity
22. Display pull requests
23. Integrate useful GitHub events into project activity
24. Add GitHub information to the Dashboard where useful
25. Add Quick Create
26. Add Search / Command Palette if useful
27. Refine UI interactions
28. Design empty/loading/error states
29. Refine responsive behavior
30. Perform final visual and UX consistency pass

The exact implementation sequence may change when another approach is more efficient.

---

# Definition of Done

A feature should not be considered complete simply because a database or API operation works.

Consider:

* Correct functionality
* Data integrity
* Security
* Loading state
* Error state
* Empty state
* Responsive behavior
* Keyboard usability
* Accessibility
* Visual hierarchy
* Interaction feedback
* Performance
* Code quality
* GitHub failure behavior where relevant
* Consistency with related workflows

before considering a feature complete.

---

# Decision Rules

When requirements are ambiguous:

1. Prefer the simplest solution.
2. Protect data integrity.
3. Reduce user effort.
4. Automate obvious bookkeeping.
5. Prefer derived information over duplicate manual state.
6. Reuse existing concepts before introducing new modules.
7. Avoid hypothetical enterprise requirements.
8. Prefer excellent UX over a larger feature count.
9. Maintain visual consistency.
10. Avoid unnecessary dependencies.
11. Use existing Next.js and Supabase capabilities where appropriate.
12. Use GitHub as the source of truth for GitHub-owned information.
13. Do not duplicate large amounts of repository data without a reason.
14. Avoid creating new systems when an existing model can support the requirement.
15. Prefer maintainability over cleverness.

---

# Final Direction

Build a **small, premium personal Project & Task Tracker**.

Use:

```text
Next.js
+
Supabase
+
GitHub Integration
```

Support:

```text
Personal Projects
+
Work Projects
```

using the same project engine and functionality.

Support the primary lifecycle:

```text
Pending
→ In Development
→ Production
```

with lightweight support for:

```text
Paused
Archived
```

where useful.

Support:

```text
Project Tasks
+
Standalone Personal Tasks
```

Integrate GitHub into projects so development progress can also be understood through:

```text
Repositories
+
Commits
+
Pushes
+
Pull Requests
+
Relevant Development Activity
```

GitHub should complement the project tracker, not dominate it.

Automate important lifecycle information.

Provide a clean Dashboard.

Make project progress easy to understand.

Make tasks fast to manage.

Make repository activity easy to see.

Make the interface responsive and satisfying.

Keep the architecture understandable.

Keep the scope controlled.

The product should feel excellent because it is **well designed and well executed**, not because it contains an excessive number of features.

---

# Enhancements and Tweaks

Small features or workflow refinements may be added when they improve the product without significantly increasing complexity.

Before adding something new, ask:

> Does this clearly improve usefulness, speed, visualization, interaction quality, or user experience without making the system meaningfully more complicated?

If yes, implement or propose it.

If no, leave it out.

For meaningful changes beyond the original scope, optionally document:

```text
Enhancement:
[What changed]

Reason:
[Why it improves the product]

Complexity Impact:
Low / Moderate

Decision:
Implemented / Proposed / Rejected
```

Do not document trivial implementation details.

The objective is to allow thoughtful product improvements while preventing uncontrolled scope growth.
