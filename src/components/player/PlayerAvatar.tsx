import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { PLAYER_AVATARS } from '../../data/player';
import type { AvatarId } from '../../game/types/player';
import { colors, radii } from '../../theme';
import { AppText } from '../ui';

export function PlayerAvatar({ username, avatarId }: { username: string; avatarId: AvatarId }) {
  const avatar = PLAYER_AVATARS.find((item) => item.id === avatarId);
  if (!avatar) throw new Error('Unsupported player avatar.');
  const initials = Array.from(username.trim().split(/\s+/).slice(0, 2)
    .map((word) => Array.from(word)[0]).join('').toUpperCase()).slice(0, 2).join('');
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={`${avatar.label} player avatar`} style={styles.avatar}>
      {avatarId === 'initials' ? (
        <AppText variant="heading" allowFontScaling={false}>{initials}</AppText>
      ) : (
        <Ionicons name={avatar.icon} size={28} color={colors.gold} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 56, height: 56, borderRadius: radii.full, backgroundColor: colors.background,
    borderColor: colors.gold, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
});
