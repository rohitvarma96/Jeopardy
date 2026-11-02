import { Button, Card, EmptyState, Screen } from '../src/components/ui';
import { exitPreview } from '../src/navigation/exitPreview';

export default function NotFound() {
  return (
    <Screen title="Page not found" description="The requested route does not exist.">
      <Card>
        <EmptyState
          icon="warning-outline"
          title="Unknown route"
          description="Return to Arena to continue the navigation preview."
          action={<Button label="Arena home" onPress={() => exitPreview()} />}
        />
      </Card>
    </Screen>
  );
}
