export interface Location {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const locations: Location[] = [
  { id: 'paris', name: '巴黎', coordinates: { lat: 48.8566, lng: 2.3522 } },
  { id: 'tokyo', name: '東京', coordinates: { lat: 35.6762, lng: 139.6503 } },
  { id: 'kyoto', name: '京都', coordinates: { lat: 35.0116, lng: 135.7681 } },
];

export const memories: Memory[] = [
  {
    id: 'm1',
    locationId: 'paris',
    type: 'note',
    imageUrl: 'https://images.unsplash.com/photo-1763318188790-fd36a659ae43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5kd3JpdHRlbiUyMGpvdXJuYWwlMjBub3RlcyUyMHZpbnRhZ2V8ZW58MXx8fHwxNzc0Mzk5ODk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2023年4月12日',
    position: { x: 15, y: 20, rotation: -2 },
  },
  {
    id: 'm2',
    locationId: 'paris',
    type: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1676274844534-6058b7b1469f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMHN0cmVldCUyMHZpbnRhZ2V8ZW58MXx8fHwxNzc0Mzk5ODk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2023年4月13日',
    position: { x: 55, y: 15, rotation: 1 },
  },
  {
    id: 'm3',
    locationId: 'paris',
    type: 'book',
    bookTitle: '追憶似水年華',
    bookAuthor: 'Marcel Proust',
    date: '2023年4月15日',
    position: { x: 25, y: 60, rotation: 0 },
  },
  {
    id: 'm4',
    locationId: 'tokyo',
    type: 'note',
    imageUrl: 'https://images.unsplash.com/photo-1763318188790-fd36a659ae43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBkaWFyeSUyMGhhbmR3cml0aW5nJTIwcGFwZXJ8ZW58MXx8fHwxNzc0Mzk5ODk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月8日',
    position: { x: 20, y: 25, rotation: -1 },
  },
  {
    id: 'm5',
    locationId: 'tokyo',
    type: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1543675174-b8a96c3ba7f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHRlbXBsZSUyMGFyY2hpdGVjdHVyZXxlbnwxfHx8fDE3NzQzOTk4OTd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月9日',
    position: { x: 50, y: 50, rotation: 2 },
  },
  {
    id: 'm6',
    locationId: 'kyoto',
    type: 'note',
    imageUrl: 'https://images.unsplash.com/photo-1662826321840-57145ff39952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwbm90ZWJvb2slMjBza2V0Y2h8ZW58MXx8fHwxNzc0Mzk5ODk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月11日',
    position: { x: 30, y: 30, rotation: -3 },
  },
  {
    id: 'm7',
    locationId: 'kyoto',
    type: 'photo',
    imageUrl: 'https://images.unsplash.com/photo-1769783369289-f4cd57b161be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxreW90byUyMGdhcmRlbiUyMHF1aWV0fGVufDF8fHx8MTc3NDM5OTg5N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2024年1月12日',
    position: { x: 60, y: 45, rotation: 1 },
  },
  {
    id: 'm8',
    locationId: 'kyoto',
    type: 'book',
    bookTitle: '雪国',
    bookAuthor: '川端康成',
    date: '2024年1月13日',
    position: { x: 15, y: 70, rotation: 0 },
  },
];