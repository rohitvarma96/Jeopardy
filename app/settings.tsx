import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { PlayerAvatar } from '../src/components/player/PlayerAvatar';
import { PlayerDataNotice } from '../src/components/player/PlayerDataNotice';
import { AppText, Button, Card, IconSlot, LoadingState, Screen, SelectableCard } from '../src/components/ui';
import { PagedItems } from '../src/components/ui/PagedItems';
import { normalizeUsername, PLAYER_AVATARS, usernameError } from '../src/data/player';
import type { AvatarId, PlayerSettings } from '../src/game/types/player';
import { routes } from '../src/navigation/routes';
import { usePlayerStore } from '../src/store/player-store';
import { colors, layout, radii, spacing, typography } from '../src/theme';

export default function Settings() {
  const player = usePlayerStore();
  const [draftName, setDraftName] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<AvatarId | null>(null);
  const [busy, setBusy] = useState<'identity' | 'preference' | null>(null);
  const [notice, setNotice] = useState('');
  const username = draftName ?? player.profile.username;
  const avatarId = draftAvatar ?? player.avatarId;
  const problem = usernameError(username);
  const changed = normalizeUsername(username) !== player.profile.username || avatarId !== player.avatarId;
  const savePreference = async (key: keyof PlayerSettings) => {
    setBusy('preference');
    setNotice('');
    try {
      if (await player.saveSettings({ ...player.settings, [key]: !player.settings[key] })) setNotice('Preference saved.');
    } finally { setBusy(null); }
  };

  return (
    <Screen
      title="Settings"
      description="Identity and preferences are saved on this device, not synced to an account."
      backHref={routes.career}
      previewLabel={null}
      footer={player.status === 'ready' ? <Button label="Save identity" loading={busy === 'identity'} disabled={!changed || problem !== null || busy !== null} onPress={async () => {
        setBusy('identity');
        setNotice('');
        try {
          if (await player.saveIdentity(username, avatarId)) {
            setDraftName(null); setDraftAvatar(null); setNotice('Identity saved.');
          }
        } finally { setBusy(null); }
      }} /> : null}
      pages={player.status === 'ready' ? [
      { id: 'identity', label: 'Name', content: <Card title="Player identity" style={styles.page}>
        <PlayerAvatar username={username} avatarId={avatarId} />
        <AppText variant="label" nativeID="player-name-label">Player name</AppText>
        <TextInput
          accessibilityLabel="Player name"
          accessibilityHint="Between 2 and 24 characters. Use Save identity to apply changes."
          value={username}
          onChangeText={(value) => { setDraftName(value); setNotice(''); }}
          editable={busy === null}
          maxLength={24}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
          selectionColor={colors.gold}
          style={styles.input}
        />
        {problem ? <AppText accessibilityRole="alert">{problem}</AppText> : null}
      </Card> },
      { id: 'avatar', label: 'Avatar', content: <>
        <AppText variant="label">Avatar</AppText>
        <PagedItems items={PLAYER_AVATARS} keyExtractor={(item) => item.id} label="Avatars" columns={2} itemHeight={104}
          renderItem={(avatar) => (
            <SelectableCard key={avatar.id} label={`${avatar.label} avatar`} selected={avatar.id === avatarId}
              disabled={busy !== null} onPress={() => { setDraftAvatar(avatar.id); setNotice(''); }} style={styles.avatarChoice}>
              <IconSlot name={avatar.icon} size="small" />
              <AppText variant="label">{avatar.label}</AppText>
            </SelectableCard>
          )} />
      </> },
      { id: 'preferences', label: 'Preferences', content: <>
        <PagedItems items={[
          { key: 'soundEnabled', label: 'Sound effects', description: 'Future audio only. This prototype is silent.' },
          { key: 'reducedMotion', label: 'Reduce motion', description: 'Disable combat motion. System reduction always takes priority.' },
        ] as const} keyExtractor={(item) => item.key} label="Preferences" itemHeight={130}
          renderItem={(item) => <Preference label={item.label} description={item.description}
            value={player.settings[item.key]} disabled={busy !== null} onPress={() => void savePreference(item.key)} />} />
        {busy === 'preference' ? <LoadingState label="Saving preference..." /> : null}
        <AppText variant="caption" tone="secondary">Preferences save immediately.</AppText>
      </> },
      ] : undefined}
    >
      <PlayerDataNotice />
      {notice ? <AppText accessibilityLiveRegion="polite">{notice}</AppText> : null}
    </Screen>
  );
}

function Preference({ label, description, value, disabled, onPress }: {
  label: string; description: string; value: boolean; disabled: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.preference, pressed && !disabled && styles.pressed]}>
      <View style={styles.preferenceText}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" tone="secondary">{description}</AppText>
      </View>
      <AppText variant="label" tone="accent">{value ? 'On' : 'Off'}</AppText>
      <IconSlot name={value ? 'checkmark-circle' : 'ellipse-outline'} size="small" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: layout.touchTarget, color: colors.text, backgroundColor: colors.background,
    borderColor: colors.textSecondary, borderWidth: 1, borderRadius: radii.medium,
    padding: spacing.small, fontSize: typography.body,
  },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.small },
  avatarChoice: { minWidth: 0 },
  page: { flex: 1, minHeight: 0, gap: spacing.small, padding: spacing.small, justifyContent: 'space-evenly' },
  preference: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.small },
  preferenceText: { flex: 1, minWidth: 0, gap: spacing.xsmall },
  pressed: { opacity: 0.8 },
});
