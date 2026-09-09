import { LegalDocument } from '@/components/LegalDocument';

export default function PrivacyPolicy() {
  return (
    <LegalDocument
      title="Privacy Policy"
      updated="September 2026"
      sections={[
        {
          heading: 'Overview',
          body:
            "Huddl doesn't have a backend server and doesn't ask you to create an account. There's no Huddl-operated database that your information could be stored in, because none exists — everything the app knows about you stays on your device.",
        },
        {
          heading: 'What the app stores on your device',
          body:
            "The leagues you follow and the teams you favorite are saved in your device's local storage so they're there the next time you open the app. This information is never uploaded anywhere, and Huddl has no way to see it.",
        },
        {
          heading: 'On-device AI analysis',
          body:
            "Game analysis runs entirely on your device using a language model downloaded once from Hugging Face and cached locally. When you ask for an analysis, the game context used to generate it (team records, standings, injuries) and the analysis itself are processed on-device and are never sent to Huddl or anyone else.",
        },
        {
          heading: 'Sports data',
          body:
            "Scores, schedules, standings, and stats are fetched live from ESPN's public sports API so the app can show you what's happening. These requests only carry the information needed to load the screen you're viewing (for example, which league and date) — nothing that identifies you personally. Huddl doesn't control how ESPN itself handles that traffic; if you want details on that, ESPN publishes its own privacy policy.",
        },
        {
          heading: 'No analytics, tracking, or ads',
          body: "Huddl doesn't include any analytics or advertising SDKs and doesn't track how you use the app.",
        },
        {
          heading: "Children's privacy",
          body: "Huddl doesn't knowingly collect personal information from anyone, regardless of age, because it doesn't collect personal information at all.",
        },
        {
          heading: 'Changes to this policy',
          body: 'If this policy changes, the date at the top of this page will change with it.',
        },
        {
          heading: 'Contact',
          body: 'Questions about this policy can be sent to [your contact email].',
        },
      ]}
    />
  );
}
