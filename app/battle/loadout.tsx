import { Redirect } from 'expo-router';

import { routes } from '../../src/navigation/routes';

export default function Loadout() {
  return <Redirect href={routes.armory} />;
}
