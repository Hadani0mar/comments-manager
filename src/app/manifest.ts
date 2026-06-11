import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مدير تعليقات صيدلية أبناء الصغير',
    short_name: 'مدير التعليقات',
    description: 'لوحة تحكم تفاعلية متكاملة لعرض وتعديل الردود والتعليقات الخاصة بصيدلية أبناء الصغير',
    start_url: '/',
    display: 'standalone',
    background_color: '#030406',
    theme_color: '#FF6C37',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '192x192',
        type: 'image/x-icon',
      },
      {
        src: '/favicon.ico',
        sizes: '512x512',
        type: 'image/x-icon',
      },
    ],
  }
}
