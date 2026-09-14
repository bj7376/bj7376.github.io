import {defineField, defineType} from 'sanity'

export const journalPost = defineType({
  name: 'journalPost',
  title: 'Journal post',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'body', title: 'Body', type: 'richText'}),
  ],
  preview: {select: {title: 'title', subtitle: 'publishedAt', media: 'coverImage'}},
})
