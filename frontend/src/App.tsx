import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { Toaster } from 'sonner';

export default function App() {
  // Main app entry point
  return (
    <>
      <Toaster theme="dark" richColors position="bottom-right" />
      <RouterProvider router={router} />
    </>
  );
}
