import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({name: 'siteTitle', title: 'Site title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'siteDescription', title: 'Site description', type: 'text', rows: 2}),
    defineField({name: 'journalEnabled', title: 'Journal enabled', type: 'boolean', initialValue: false}),
  ],
})
