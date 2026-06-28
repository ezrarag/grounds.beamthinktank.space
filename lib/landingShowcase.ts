// Minimal data for the full-screen landing showcase. Each entry is intentionally
// simple: a name, a city, a background image, and a link into /properties.
// Keep this list in step with the public properties you want to feature.

export interface ShowcaseProperty {
  id: string
  name: string
  city: string
  imageUrl?: string
  href: string
}

export const showcaseProperties: ShowcaseProperty[] = [
  {
    id: 'central-united-methodist-church',
    name: 'Central United Methodist Church',
    city: 'Milwaukee',
    imageUrl:
      'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1600&q=80',
    href: '/properties',
  },
  {
    id: 'former-milwaukee-public-museum',
    name: 'Former Milwaukee Public Museum',
    city: 'Milwaukee',
    imageUrl:
      'https://images.unsplash.com/photo-1565060169187-5284a3f7af8e?auto=format&fit=crop&w=1600&q=80',
    href: '/properties',
  },
  {
    id: 'milwaukee-public-library-central',
    name: 'Milwaukee Public Library — Central Branch Model',
    city: 'Milwaukee',
    imageUrl:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1600&q=80',
    href: '/properties',
  },
]
