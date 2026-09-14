import {defineField, defineType} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, validation: (rule) => rule.required()}),
    defineField({name: 'year', title: 'Year', type: 'number', validation: (rule) => rule.required().integer().min(1900).max(2100)}),
    defineField({name: 'type', title: 'Type', type: 'string'}),
    defineField({name: 'venue', title: 'Venue', type: 'string'}),
    defineField({name: 'subtitle', title: 'Subtitle', type: 'string'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 3}),
    defineField({name: 'coverImage', title: 'Cover image', type: 'image', options: {hotspot: true}}),
    defineField({name: 'credits', title: 'Credits', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'body', title: 'Body', type: 'projectBody'}),
    defineField({name: 'featured', title: 'Featured', type: 'boolean', initialValue: false}),
    defineField({name: 'sortOrder', title: 'Sort order', type: 'number'}),
  ],
  orderings: [{title: 'Manual order', name: 'manualOrder', by: [{field: 'sortOrder', direction: 'asc'}, {field: 'year', direction: 'desc'}]}],
  preview: {select: {title: 'title', subtitle: 'year', media: 'coverImage'}},
})
