import { createBrowserRouter } from 'react-router';
import { MapScreen } from './components/MapScreen';
import { LocationMemoryScreen } from './components/LocationMemoryScreen';
import { MemoryDetailScreen } from './components/MemoryDetailScreen';
import { AddMemoryScreen } from './components/AddMemoryScreen';

const Root = () => {
  return <MapScreen />;
};

const LocationRoot = () => {
  return <LocationMemoryScreen />;
};

const MemoryRoot = () => {
  return <MemoryDetailScreen />;
};

const AddRoot = () => {
  return <AddMemoryScreen />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
  },
  {
    path: '/location/:id',
    Component: LocationRoot,
  },
  {
    path: '/memory/:id',
    Component: MemoryRoot,
  },
  {
    path: '/add',
    Component: AddRoot,
  },
]);