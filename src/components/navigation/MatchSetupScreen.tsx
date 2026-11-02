import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';

import { useMatchSetupStore } from '../../features/match-setup/store';
import { exitPreview } from '../../navigation/exitPreview';
import { journey } from '../../navigation/journey';
import { routes } from '../../navigation/routes';
import { Button, Card, EmptyState, ProgressBar, Screen } from '../ui';

const setupSteps = ['mode', 'matchmaking', 'categoryDraft', 'fighterSelect', 'loadout'] as const;

type MatchSetupScreenProps = {
  step: (typeof setupSteps)[number];
  children?: ReactNode;
  /** When set, the prerequisite state is missing (e.g. direct entry) and a safe recovery is shown. */
  blocked?: string;
};

export function leaveMatch() {
  useMatchSetupStore.getState().reset();
  exitPreview(routes.arena);
}

export function MatchSetupScreen({ step, children, blocked }: MatchSetupScreenProps) {
  const router = useRouter();
  const entry = journey.find((item) => item.id === step);
  if (!entry) throw new Error(`Unknown setup step: ${step}`);

  return (
    <Screen
      title={entry.title}
      description={entry.description}
      backHref={routes.arena}
      exitHref={step === 'mode' ? undefined : routes.arena}
      exitLabel="Leave match"
      onExit={leaveMatch}
      previewLabel={null}
    >
      <ProgressBar label="Match setup" value={setupSteps.indexOf(step) + 1} max={setupSteps.length} />
      {blocked ? (
        <Card>
          <EmptyState
            icon="alert-circle-outline"
            title="Match setup not ready"
            description={blocked}
            action={<Button label="Choose a mode" onPress={() => router.replace(routes.mode)} />}
          />
        </Card>
      ) : (
        children
      )}
    </Screen>
  );
}
