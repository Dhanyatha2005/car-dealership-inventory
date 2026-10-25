import { useState } from 'react';
import type { ReactElement } from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from './providers';
import { routes } from './router';

export function App({ initialPath }: { initialPath?: string }): ReactElement {
  const [router] = useState(() =>
    initialPath
      ? createMemoryRouter(routes, { initialEntries: [initialPath] })
      : createBrowserRouter(routes),
  );
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
