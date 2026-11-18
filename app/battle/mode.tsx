import { Redirect } from 'expo-router';

import { routes } from '../../src/navigation/routes';

export default function Mode() {
  return <Redirect href={routes.arena} />;
}
