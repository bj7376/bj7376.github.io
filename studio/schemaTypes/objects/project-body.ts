import {defineArrayMember, defineField, defineType} from 'sanity'

const linkAnnotation = {
  name: 'link',
  title: 'Link',
  type: 'object' as const,
  fields: [
    defineField({
      name: 'href',
      title: 'URL or path',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'openInNewTab',
      title: 'Open in new tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
}

export const projectBody = defineType({
  name: 'projectBody',
  title: 'Project body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Quote', value: 'blockquote'},
      ],
      marks: {annotations: [linkAnnotation]},
    }),
    defineArrayMember({
      name: 'projectImage',
      title: 'Image',
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
    defineArrayMember({
      name: 'imageGallery',
      title: 'Image gallery',
      type: 'object',
      fields: [
        defineField({
          name: 'images',
          title: 'Images',
          type: 'array',
          validation: (rule) => rule.min(2),
          of: [
            defineArrayMember({
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
          ],
        }),
      ],
      preview: {
        select: {media: 'images.0', count: 'images'},
        prepare: ({media, count}) => ({
          title: `Gallery${Array.isArray(count) ? ` · ${count.length} images` : ''}`,
          media,
        }),
      },
    }),
    defineArrayMember({
      name: 'videoEmbed',
      title: 'Video / embed',
      type: 'object',
      fields: [
        defineField({
          name: 'url',
          title: 'URL',
          type: 'url',
          validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
        }),
        defineField({name: 'caption', title: 'Caption', type: 'string'}),
      ],
      preview: {
        select: {title: 'caption', subtitle: 'url'},
        prepare: ({title, subtitle}) => ({title: title || 'Video / embed', subtitle}),
      },
    }),
  ],
})
