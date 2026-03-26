import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { MapScreen } from './components/MapScreen';
import { LocationMemoryScreen } from './components/LocationMemoryScreen';
import { MemoryDetailScreen } from './components/MemoryDetailScreen';
import { EditMemoryScreen } from './components/EditMemoryScreen';
import { AddMemoryScreen } from './components/AddMemoryScreen';
import { TimelineScreen } from './components/TimelineScreen';
import { BookshelfScreen } from './components/BookshelfScreen';
import { BookDetailScreen } from './components/BookDetailScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: MapScreen },
      { path: 'timeline', Component: TimelineScreen },
      { path: 'bookshelf', Component: BookshelfScreen },
    ],
  },
  {
    path: '/location/:id',
    Component: LocationMemoryScreen,
  },
  {
    path: '/memory/:id',
    Component: MemoryDetailScreen,
  },
  {
    path: '/memory/:id/edit',
    Component: EditMemoryScreen,
  },
  {
    path: '/book/:id',
    Component: BookDetailScreen,
  },
  {
    path: '/add',
    Component: AddMemoryScreen,
  },
]);
