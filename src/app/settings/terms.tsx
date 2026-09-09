import { LegalDocument } from '@/components/LegalDocument';

export default function TermsAndConditions() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      updated="September 2026"
      sections={[
        {
          heading: 'Acceptance',
          body: 'By using Huddl, you agree to these terms. If you disagree with any part of them, please don\'t use the app.',
        },
        {
          heading: 'What Huddl is',
          body:
            "Huddl is a personal companion app for browsing publicly available sports schedules, scores, and standings, with an optional on-device feature that generates a short, informal analysis of an upcoming or in-progress matchup.",
        },
        {
          heading: 'Not betting or financial advice',
          body:
            "Any analysis or prediction the app generates is for entertainment only. It is not professional advice, and it isn't intended to inform betting, wagering, or any financial decision. The underlying model can be wrong, especially about roster or injury details it wasn't given up-to-date information on.",
        },
        {
          heading: 'Accuracy of sports data',
          body:
            "Scores, schedules, and stats come from a third-party public API and may occasionally be delayed, incomplete, or incorrect. Huddl doesn't guarantee the accuracy of any data it displays.",
        },
        {
          heading: 'No warranty',
          body: 'Huddl is provided "as is," without warranties of any kind, express or implied.',
        },
        {
          heading: 'Limitation of liability',
          body:
            'To the fullest extent permitted by law, Huddl and its developer are not liable for any damages arising from your use of, or inability to use, the app.',
        },
        {
          heading: 'Changes to these terms',
          body: 'These terms may be updated from time to time. Continuing to use the app after a change means you accept the updated terms.',
        },
        {
          heading: 'Contact',
          body: 'Questions about these terms can be sent to [your contact email].',
        },
      ]}
    />
  );
}
