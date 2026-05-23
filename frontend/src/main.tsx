import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { createRouterConfig } from './routes/index.tsx'
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme/index.ts';
import { NotifyProvider } from './components/notification/NotifyProvider.tsx';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from './lib/react-query.ts';

const router = createRouterConfig();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <QueryClientProvider client={queryClient}>
    <ChakraProvider theme={theme}>
      <NotifyProvider>
        <RouterProvider router={router}></RouterProvider>
      </NotifyProvider>
    </ChakraProvider>
    </QueryClientProvider>
  </>
)