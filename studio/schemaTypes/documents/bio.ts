import {defineField, defineType} from 'sanity'

export const bio = defineType({
  name: 'bio',
  title: 'Bio',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'portrait',
      title: 'Portrait',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alternative text',
          type: 'string',
          validation: (rule) => rule.required().warning('Add alt text for accessibility.'),
        }),
        defineField({name: 'caption', title: 'Caption', type: 'string'}),
      ],
    }),
    defineField({name: 'intro', title: 'Introduction', type: 'richText', validation: (rule) => rule.required()}),
    defineField({name: 'emailAddress', title: 'Email', type: 'string'}),
    defineField({name: 'googleScholarUrl', title: 'Google Scholar URL', type: 'url'}),
    defineField({name: 'ebirdUrl', title: 'eBird profile URL', type: 'url'}),
    defineField({name: 'cvUrl', title: 'CV URL', type: 'url'}),
  ],
  preview: {select: {title: 'name', media: 'portrait'}},
})
