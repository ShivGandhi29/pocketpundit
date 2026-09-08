import { useRouter } from 'expo-router';

import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { LEAGUES } from '@/services/api';

// Dev-only route (see the "Developer" section in settings/index.tsx) that
// renders the onboarding welcome hero in isolation — no state is read or
// written here, so it's safe to preview without disturbing whatever the
// user has actually onboarded with. "Get Started" just backs out.
export default function DevWelcomePreview() {
  const router = useRouter();
  return <WelcomeScreen leagues={LEAGUES} onGetStarted={() => router.back()} />;
}
