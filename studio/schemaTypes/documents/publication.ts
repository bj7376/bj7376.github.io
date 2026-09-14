import {defineField, defineType} from 'sanity'

export const publication = defineType({
  name: 'publication',
  title: 'Publication',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'authors', title: 'Authors', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'venue', title: 'Venue', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'year', title: 'Year', type: 'number', validation: (rule) => rule.required().integer()}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'note', title: 'Note', type: 'string'}),
    defineField({name: 'sortOrder', title: 'Sort order', type: 'number'}),
  ],
  orderings: [{title: 'Newest first', name: 'newest', by: [{field: 'year', direction: 'desc'}, {field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', venue: 'venue', year: 'year'}, prepare: ({title, venue, year}) => ({title, subtitle: [venue, year].filter(Boolean).join(' · ')})},
})
