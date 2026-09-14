import {defineField, defineType} from 'sanity'

export const award = defineType({
  name: 'award',
  title: 'Award / Honor / Qualification',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'organization', title: 'Organization', type: 'string'}),
    defineField({name: 'year', title: 'Year', type: 'number', validation: (rule) => rule.required().integer()}),
    defineField({name: 'note', title: 'Note', type: 'string'}),
    defineField({name: 'url', title: 'URL', type: 'url'}),
    defineField({name: 'sortOrder', title: 'Sort order', type: 'number'}),
  ],
  orderings: [{title: 'Newest first', name: 'newest', by: [{field: 'year', direction: 'desc'}, {field: 'sortOrder', direction: 'asc'}]}],
  preview: {select: {title: 'title', organization: 'organization', year: 'year'}, prepare: ({title, organization, year}) => ({title, subtitle: [organization, year].filter(Boolean).join(' · ')})},
})
