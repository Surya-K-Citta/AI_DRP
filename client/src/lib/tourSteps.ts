/**
 * The guided tour, in order. A step is one of:
 *  - info:   explains the highlighted part of the page; the person presses Next.
 *  - click:  an arrow points at a real button; the tour moves on when the person presses it.
 *  - action: offers a button in the tour panel (here: fill the form with sample answers).
 * `route` is the page the step belongs to; `go` is where "Take me there" leads when the person is somewhere else.
 */
export interface TourStop {
  id: string;
  kind: 'info' | 'click' | 'action';
  route: RegExp;
  go: string;
  /** CSS selector of what to point at. Without one the step is shown with no arrow. */
  target?: string;
  title: string;
  text: string;
  /** For `click`: what to press, shown as a hint in the panel. */
  press?: string;
}

const DASH = /^\/dashboard\/?$/;
const CREATE = /^\/individual-dpr\/create\/?$/;

export const TOUR_STOPS: TourStop[] = [
  { id: 'welcome', kind: 'info', route: DASH, go: '/dashboard', target: '[data-tour="journey"]', title: 'Welcome to the tour', text: 'This tour shows how a Detailed Project Report (DPR) is made, from the first click to the finished report. A DPR is the document a bank or a scheme office reads before it decides on your loan or subsidy. You can leave at any time with Exit tour and restart it from the dashboard.' },
  { id: 'summary', kind: 'info', route: DASH, go: '/dashboard', target: '[data-tour="summary"]', title: 'Your reports at a glance', text: 'These cards count your reports: Total, Draft, Submitted, Analyzed and the average quality score. Press a card later to see just those reports.' },
  { id: 'create', kind: 'click', route: DASH, go: '/dashboard', target: '[data-tour="actions"] button', title: 'Start a new DPR', press: 'Create DPR', text: 'Everything starts here. Press the Create DPR button the arrow is pointing at.' },

  { id: 'pick', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="scheme-grid"]', title: 'Choose how you want to apply', text: 'Each card is a way to get money: a plain bank term loan, or a government scheme such as PMEGP or MUDRA. The scheme you pick decides which questions you will answer, so the report matches what that office expects. Use the search box and filters above to narrow the list.' },
  { id: 'pick-click', kind: 'click', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="scheme-card"]', title: 'Pick one to try', press: 'Bank term loan', text: 'For this tour, press the "Bank term loan" card the arrow is pointing at. You can choose any scheme when you make your own report.' },
  { id: 'brief', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="start-steps"]', title: 'A short brief first', text: 'Before you answer anything, this page explains the choice you made: who it is for, what it offers and which documents are usually needed. Read it, then continue.' },
  { id: 'brief-click', kind: 'click', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="start-steps"]', title: 'Start the steps', press: 'Start DPR steps', text: 'Press the Start DPR steps button the arrow is pointing at.' },

  { id: 'stepper', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="stepper"]', title: 'Your progress', text: 'Each numbered pill is one section of the report. The bar fills as you answer, and it shows when your work was last saved. You can jump to any section by pressing its pill.' },
  { id: 'form', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="form-pane"]', title: 'Where you answer', text: 'This is the form. Each step is a topic, such as your unit, the market, the cost of machinery and how the loan will be repaid. Open a step and answer in plain words; fields marked required must be filled before the report can be generated. Helper text under each question explains what to write.' },
  { id: 'sample', kind: 'action', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="form-pane"]', title: 'Try it with sample answers', text: 'Not sure what to type? Press the button below to fill every step with realistic sample answers for this tour. Nothing is sent anywhere, and you can edit every answer afterwards.' },
  { id: 'preview', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '#dpr-preview', title: 'The report writes itself', text: 'On the right you see the report as it will look. It updates as you type, so you always see what the bank will read.' },
  { id: 'mode', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="mode-toggle"]', title: 'Basic or Advanced', text: 'Basic fills the report by answering questions one by one. Advanced lets you type straight into the report page. Switching keeps everything you have written.' },
  { id: 'scheme', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="scheme-select"]', title: 'Changed your mind?', text: 'You can change the scheme here at any time. The questions adjust and your common answers stay.' },
  { id: 'save', kind: 'click', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="save-draft"]', title: 'Save your work', press: 'Save Draft', text: 'Your work is also saved by itself every half minute, but you can press Save Draft whenever you like. Press the button the arrow is pointing at. A saved draft appears on your dashboard so you can continue later.' },
  { id: 'check', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="check-answers"]', title: 'Check my answers', text: 'This lists anything missing or worth a second look, such as numbers that do not add up, and takes you straight to the question.' },
  { id: 'generate', kind: 'info', route: CREATE, go: '/individual-dpr/create?new=true', target: '[data-tour="generate"]', title: 'Generate the DPR', text: 'When every required answer is filled, this button turns on. It creates the final report that you can view, download as PDF or Word and submit for review. That is the end of the tour. You can take it again any time from the dashboard.' },
];
