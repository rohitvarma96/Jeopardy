import { Redirect } from 'expo-router';

import { routes } from '../../src/navigation/routes';

export default function FighterSelect() {
  return <Redirect href={routes.brawlers} />;
}
