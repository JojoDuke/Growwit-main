# Product Requirements Document (PRD)

## Product Name

Growwit

---

## 1. Overview

The product is a mobile application that helps users safely and consistently grow attention, conversations, and conversions on Reddit by telling them **exactly what to post, where to post it, and when to post it**, while minimizing the risk of bans, removals, or downvotes.

The app does not automate posting. Instead, it functions as an intelligent daily coach that generates Reddit-ready content and schedules precise posting actions that the user manually executes.

The core philosophy is: **participation first, promotion second**, enforced through system constraints.

---

## 2. Problem Statement

Reddit is one of the highest-intent platforms for discovering products, services, and ideas, but it is hostile to overt promotion. Most users fail because:

* They do not understand subreddit-specific norms
* They post too frequently or unnaturally
* Their content sounds promotional or AI-generated
* They do not know when or where posting is safe
* They lack a repeatable, low-effort workflow

Existing tools focus on automation or analytics, which increases risk. This product focuses on **guided human execution**, safety, and consistency.

---

## 3. Goals & Success Metrics

### Product Goals

* Enable users to post on Reddit consistently without getting banned
* Reduce cognitive load by providing exact instructions
* Generate authentic discussions that lead to inbound interest
* Support different user intents (discussion, DMs, traffic) safely

### Success Metrics

* Daily active usage (user opens app at least once per day)
* Post completion rate ("I posted" confirmation)
* Account longevity (no bans or suspensions)
* Repeat campaign creation
* User-reported outcomes (DMs, profile clicks, link clicks)

---

## 4. Target Users

* Indie hackers
* Startup founders
* Solo consultants and freelancers
* Developers and builders
* Content creators exploring Reddit for distribution

Users are assumed to:

* Post manually
* Care about long-term account safety
* Prefer exact instructions over advice

---

## 5. Core Product Principles

* Safety over growth
* Constraints over freedom
* Exact instructions over suggestions
* Manual execution over automation
* Earned attention over forced redirection

---

## 6. User Flow (High-Level)

1. User creates a campaign
2. User inputs product/service details
3. User selects campaign goal
4. System generates a posting schedule
5. Each day, user receives a notification
6. User copies and pastes the exact post
7. User confirms completion
8. Cycle repeats

---

## 7. Campaign Setup

### 7.1 Campaign Inputs

Required inputs:

* Short description of product or service
* Target audience
* Primary problem being addressed
* Reddit account age (manual input)
* Approximate account karma (manual input)
* Monthly posting target (e.g., 30–50 posts)
* Campaign goal (see Section 8)

Optional inputs:

* Tone preference (neutral, reflective, exploratory)
* Industry or topic focus

---

## 8. Campaign Goals & Promotion Constraints

### 8.1 Campaign Goal Selection

Each campaign must have **one primary goal**.
The selected goal determines:

* Post structure
* Allowed CTAs
* Subreddit eligibility
* Posting frequency
* Risk thresholds

The system enforces all constraints automatically.

Available goals:

1. Spark discussion and credibility
2. Generate inbound DMs
3. Drive profile-based discovery
4. Generate link clicks
5. Book calls or consultations

Only one goal may be active per campaign.

---

### 8.2 Goal-to-Behavior Mapping

#### 8.2.1 Spark Discussion and Credibility (Lowest Risk)

Purpose:

* Build trust
* Establish posting history
* Warm accounts

Allowed:

* Discussion-style posts
* First-person experiences
* Question-driven prompts
* No CTAs
* No links
* No product mentions

Disallowed:

* Any redirection
* DM requests
* Promotional language

Recommended for new campaigns and new accounts.

---

#### 8.2.2 Generate Inbound DMs (Low Risk)

Purpose:

* Enable private, high-intent conversations

Allowed:

* Soft DM CTA at the end of the post
* Conversational, optional phrasing

Examples:

* "Happy to chat if anyone's dealing with this too."
* "Feel free to DM me if you want to compare notes."

Disallowed:

* Links
* Explicit product promotion
* Sales language

---

#### 8.2.3 Drive Profile-Based Discovery (Low Risk)

Purpose:

* Passive discovery without explicit promotion

Allowed:

* No CTA
* No links in post
* Product link allowed in Reddit profile

Mechanism:

* Curiosity-driven posts lead users to click the username

---

#### 8.2.4 Generate Link Clicks (Medium Risk, Gated)

Purpose:

* Drive traffic to a website or landing page

Allowed only if:

* Subreddit is internally marked "links permitted"
* Account age and karma thresholds are met
* Frequency limits are respected

Post structure:

* Value-first explanation
* Link placed naturally within content
* No aggressive CTA language

Example:

* "I wrote a more detailed breakdown here if it's useful: [link]"

Out of MVP scope.

---

#### 8.2.5 Book Calls or Consultations (Highest Risk)

Purpose:

* High-intent professional conversations

Allowed only if:

* Subreddit context supports professional services
* Very low posting frequency
* Optional, non-sales CTA

Example:

* "If you want to talk it through, I'm open to a short call."

Out of MVP scope.

---

## 9. Content Generation

### 9.1 Frequency

* Maximum: 1 post per day
* Minimum spacing: 24 hours between posts per account

---

### 9.2 Content Characteristics

The system generates **one Reddit post per scheduled action**.

Post requirements:

* First-person tone
* Human, reflective language
* Question-driven or experience-driven
* No emojis
* No marketing language
* No buzzwords
* No explicit persuasion
* Ready to paste without editing

---

### 9.3 CTA Handling

* CTAs are only included if allowed by the campaign goal
* CTA phrasing must be subtle and optional
* CTA placement is always at the end of the post
* The system may omit a CTA if risk is detected

---

## 10. Subreddit Selection

### 10.1 Subreddit Pool

* Uses a curated internal list (manually maintained initially)
* Each subreddit is tagged with:

  * Topic
  * Promotion tolerance
  * Link allowance
  * Risk level

---

### 10.2 Selection Rules

The system selects subreddits based on:

* Campaign topic
* Campaign goal
* Account maturity
* Posting history
* Risk thresholds

The user is not shown unsafe options.

---

## 11. Scheduling & Timing

* System assigns a specific posting window (e.g., 7:00–7:30 AM)
* Timing is based on:

  * General Reddit activity patterns
  * Subreddit-specific peak windows (static data in MVP)
* User receives a push notification when it's time to post

---

## 12. Notifications

### Notification Types

* "It's time to post"
* "Today's post is ready"
* "Posting delayed due to safety rules"

Each notification includes:

* Subreddit name
* Copy button
* Reminder to confirm posting

---

## 13. User Actions

* Copy post text
* Paste into Reddit manually
* Post
* Return to app
* Tap "I posted"

No automation or API posting.

---

## 14. Safety & Enforcement

* Safety rules override user intent

* The system may:

  * Delay posts
  * Change subreddits
  * Remove CTAs
  * Refuse to generate content

* The system does not:

  * Evade moderation
  * Encourage spam
  * Automate posting
  * Generate deceptive content

---

## 15. MVP Scope

Included:

* Campaign creation
* Goal selection (first 3 goals only)
* Static subreddit pool
* Push notifications
* Copy-paste workflow

Excluded:

* Comment generation
* Multiple accounts
* Link-based campaigns
* Analytics
* Auto-posting
* Learning or optimization

---

## 16. Post-MVP Expansion

* Comment generation
* Multi-account orchestration
* Dynamic subreddit discovery
* Risk scoring
* Conditional promotion logic
* Multi-agent backend architecture
* Performance feedback loops

---

## 17. Platform & Technical Notes

* Mobile app (iOS and Android)
* Backend-driven scheduling
* LLM-based content generation
* Rule engine for safety enforcement
* No Reddit API posting access required

---

## 18. Non-Goals

* Becoming a growth hacking tool
* Automating spam or manipulation
* Maximizing short-term traffic at the expense of accounts
* Replacing human judgment entirely

---

## 19. Core Value Proposition

The product removes uncertainty from Reddit posting by converting intent into **safe, exact, daily actions** that feel natural, human, and sustainable.

