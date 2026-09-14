import {award} from './documents/award'
import {bio} from './documents/bio'
import {exhibition} from './documents/exhibition'
import {journalPost} from './documents/journal-post'
import {project} from './documents/project'
import {publication} from './documents/publication'
import {siteSettings} from './documents/site-settings'
import {projectBody} from './objects/project-body'
import {richText} from './objects/rich-text'

export const schemaTypes = [
  richText,
  projectBody,
  bio,
  project,
  publication,
  award,
  exhibition,
  siteSettings,
  journalPost,
]
