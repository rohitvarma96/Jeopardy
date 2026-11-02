import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ANIMATION_PREVIEWS } from '../../src/components/battle/animationPreviews';
import { BattleScene } from '../../src/components/battle/BattleScene';
import { AppText, Button, HealthBar, Screen } from '../../src/components/ui';
import { useBattleMotion } from '../../src/hooks/useBattleMotion';
import { routes } from '../../src/navigation/routes';
import { spacing } from '../../src/theme';

export default function AnimationPreview() {
  const [index, setIndex] = useState(0);
  const [replay, setReplay] = useState(0);
  const [reduced, setReduced] = useState(false);
  const motionEnabled = useBattleMotion(reduced);
  const preview = ANIMATION_PREVIEWS[index];

  return (
    <Screen title="Animation preview" description="Isolated presentation fixtures. No answers, timers or match state are changed." backHref={routes.arena} previewLabel="Phase 5 preview">
      {__DEV__ ? (
        <>
          <AppText variant="heading">{preview.label}</AppText>
          <BattleScene key={replay} view={preview.view} motionEnabled={motionEnabled} />
          <HealthBar label="Preview opponent health" value={preview.view.opponent.hp} animate={motionEnabled} />
          <Button label="Replay animation" onPress={() => setReplay((value) => value + 1)} />
          <Button label={reduced ? 'Use system motion preference' : 'Preview reduced motion'} variant="secondary" onPress={() => setReduced((value) => !value)} />
          <View style={styles.controls}>
            {ANIMATION_PREVIEWS.map((item, itemIndex) => (
              <Button key={item.label} label={item.label} variant={itemIndex === index ? 'primary' : 'secondary'} onPress={() => { setIndex(itemIndex); setReplay((value) => value + 1); }} />
            ))}
          </View>
        </>
      ) : <AppText>Animation previews are available in development builds only.</AppText>}
    </Screen>
  );
}

const styles = StyleSheet.create({ controls: { gap: spacing.small } });
