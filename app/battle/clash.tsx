import { Redirect } from 'expo-router';

import { routes } from '../../src/navigation/routes';

export default function Clash() {
  return <Redirect href={routes.battleArena} />;
}
