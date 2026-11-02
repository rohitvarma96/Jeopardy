import { router } from 'expo-router';

import { routes, type TabHref } from './routes';

export function exitPreview(destination: TabHref = routes.arena) {
  router.dismissAll();
  router.replace(destination);
}
