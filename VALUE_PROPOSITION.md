# Journey Tracing — Value Proposition

## The Problem

Marketing messages at Booking.com travel through four independent systems before reaching a customer: Campaign Matching (Janeway) decides whether a user is eligible and which audience segment they belong to, Content Builder personalizes and renders the message template, Message Delivery (BMessage) schedules and dispatches the message through the appropriate channel, and Engagement Events (MM-Events) tracks whether the customer opened, clicked, or converted. Each of these systems has its own log store, its own error taxonomy, its own monitoring dashboards, and its own owning team.

When a message fails to deliver — or worse, when thousands fail silently — there is no single place to understand what happened. Today, investigating a failed journey means:

- **Fragmented debugging across systems.** An engineer has to SSH or log into each system individually, grep through separate log stores, and piece together what happened by matching timestamps and correlation IDs across Kafka topics. A single investigation can involve four different logging tools, four different query languages, and four different teams to contact.

- **No visibility into error patterns.** When 50 messages fail in Content Builder, there is no way to quickly determine whether all 50 share the same root cause (a broken template in one locale) or whether they represent 50 unrelated issues. This distinction matters enormously for prioritization, but discovering it requires manually reading through individual error logs and aggregating them by hand.

- **Inaccessible to non-engineers.** Campaign managers and product owners who launch and own marketing campaigns have no way to independently verify whether their messages actually reached customers. Every check requires filing a request to engineering, waiting for someone to investigate, and interpreting technical log output. This creates unnecessary dependency and slows down decision-making.

- **Slow incident response.** Because there is no unified view, the mean time to resolution for messaging incidents is measured in hours rather than minutes. Recurring issues go undetected for days because spotting a pattern requires someone to proactively correlate failures across systems — something that rarely happens under operational pressure.

The cost is real: engineering hours lost to repetitive investigations, recurring failures that persist longer than they should, and customer-impacting issues that erode trust in the marketing platform.

## What Journey Tracing Is

Journey Tracing is a unified diagnostic dashboard that provides end-to-end visibility across the entire messaging pipeline for every customer journey. It stitches together events from all four systems into a single, searchable, filterable view — so that anyone can understand what happened to a message, where it broke, and why.

### Search by any customer identifier

The dashboard accepts any identifier that the messaging platform uses to track a customer: a 16-digit hexadecimal Soylent Email ID, a Soylent Phone ID, a Device ID, or a User ID. Paste any of these into the search bar, and the system instantly retrieves every journey associated with that customer — across all channels, campaigns, and time periods. The autocomplete dropdown groups suggestions by identifier type with color-coded badges, so engineers can quickly find the right entity even when working with unfamiliar hex IDs.

### Error grouping by system

An Error Summary Bar sits at the top of the dashboard and automatically groups all failures by the system that caused them — Janeway, Content Builder, or BMessage. Each system card shows a count of affected journeys, and clicking a card filters the entire view to only those failures. This immediately answers the first question in any investigation: "Which system is responsible?"

Engagement Events (MM-Events) are deliberately excluded from error attribution. Opens, clicks, and conversions are observational — a missing engagement event does not mean the message failed to deliver. This design choice ensures the error summary reflects actual delivery failures, not noise from downstream tracking.

### Error code drill-down

Within each system, failures are further broken down by their specific error code. If BMessage shows 4 errors, expanding the card reveals that 3 are DELIVERY_TIMEOUT and 1 is SCHEDULING_ERROR — two fundamentally different problems that require different responses. Clicking on a specific error code filters the journey list to only those journeys, making it trivial to examine a cohort of identical failures.

This is the capability that transforms Journey Tracing from a lookup tool into a pattern-detection tool. Instead of reading through individual error logs and mentally grouping them, the dashboard surfaces the grouping automatically. To prevent information overload, only the top 3 error codes per system are shown, with a count of any additional error types rolled up into a summary line.

### Waterfall timeline per journey

Selecting any journey from the list opens a detailed timeline view showing every event in sequence across all four systems. Each event displays its status — OK (green), Error (red), Skipped (grey), or Missing (amber) — along with its duration in milliseconds.

For error events, the timeline shows the exact error code, the human-readable error message, and the retry count. For skipped events, it shows which upstream failure caused the skip ("Upstream failure in Campaign Matching (Janeway)") and which specific event was the blocker. This makes the causal chain immediately visible: you can see that a TEMPLATE_NOT_FOUND error in Content Builder caused all downstream events in BMessage and MM-Events to be skipped, without needing to infer the relationship from timestamps.

### Filtering and slicing

The dashboard provides multiple filtering dimensions that can be combined freely. The Campaign dropdown filters by intent type (booking confirmation, price drop alert, cart abandonment, etc.). The "Errors Only" toggle hides all successful journeys to focus on failures. System-level and error-code-level filters from the Error Summary Bar can be layered on top. All filters work together, so you can answer questions like "Show me all DELIVERY_TIMEOUT errors in BMessage for cart abandonment campaigns" in two clicks.

## The User Experience

### On-call engineer diagnosing a delivery failure

An engineer receives a page that message delivery rates have dropped. They open Journey Tracing and paste the Soylent Email ID from the alert into the search bar. The dashboard loads all recent journeys for that customer. The Error Summary Bar immediately shows 3 failures in BMessage — this tells them the problem is in delivery, not in campaign matching or content rendering.

They click the BMessage card. The expanded view shows all 3 errors are DELIVERY_TIMEOUT with the message "Gateway timeout after 30s." They click on one journey and the waterfall timeline confirms: the message passed through Janeway (eligibility check passed, audience resolved, channel selected), Content Builder successfully personalized and composed the message, BMessage scheduled the send — but the dispatch step timed out after 2 retry attempts. Everything downstream (delivery confirmation, engagement tracking) is marked as "Skipped due to upstream failure in BMessage."

The engineer now has a precise diagnosis: the delivery gateway is timing out, scheduling and content are healthy, and the issue has affected at least 3 journeys for this customer. They escalate to the BMessage team with the exact error code, timestamp, and correlation IDs. Total time from page to diagnosis: under 30 seconds.

### Platform team lead investigating a content error spike

A team lead notices a bump in content-related errors on their Grafana dashboard but cannot tell what changed. They open Journey Tracing and click "Errors Only" to filter out successful journeys. The Error Summary Bar shows 5 errors in Content Builder — more than usual.

They expand the Content Builder card and see the breakdown: 3 are TEMPLATE_NOT_FOUND ("Content template v3.2 not found for locale en_GB") and 2 are RENDERING_ERROR ("Failed to render dynamic block — missing variable {{booking.checkin_date}}"). These are two different problems. They click on TEMPLATE_NOT_FOUND and the journey list filters to just those 3 journeys. All three are review_request campaigns targeting push notifications.

The pattern is clear: a recent template deployment removed the en_GB version of the review request push template (v3.2). The team lead files a ticket to the content team with the exact template version, locale, and affected correlation IDs — all gathered from the dashboard without opening a single log file.

### Campaign manager verifying a new campaign launch

A campaign manager just launched a new loyalty reward campaign and wants to confirm messages are being delivered. They open Journey Tracing, select "loyalty_reward" from the Campaign dropdown, and scan the journey list. They see a mix of green "complete" journeys and can click into any one to see the full waterfall timeline showing the message flowing through all four systems. No errors, no skipped events, no missing steps. They have confidence the campaign is working end-to-end — without filing a ticket or pinging an engineer on Slack.

## Live Demo

https://journey-tracing-ui.vercel.app

Currently running with mock data across 8 users and 16 journeys demonstrating all failure modes across Janeway (ELIGIBILITY_FAILED, AUDIENCE_RESOLUTION_ERROR), Content Builder (TEMPLATE_NOT_FOUND, RENDERING_ERROR), and BMessage (SCHEDULING_ERROR, DELIVERY_TIMEOUT).
